#!/usr/bin/env python3
"""
Asset Pipeline Dev Server
=========================
Flask API server (port 7788) that wraps generate_characters.py.

Start:
    cd tools/asset-pipeline && .venv/bin/python server.py

Endpoints:
    GET  /api/characters          — list characters + variants from characters.yaml
    GET  /api/assets/portraits    — scan public/assets/portraits/
    GET  /api/assets/sprites      — scan public/assets/sprites/
    GET  /api/bases               — scan bases/ dir
    POST /api/generate            — run generate_characters.py as subprocess
    GET  /api/jobs/{job_id}       — poll job status + output
"""

from __future__ import annotations

import os
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path
from typing import Any

import yaml
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── Paths ──────────────────────────────────────────────────────

PIPELINE_DIR = Path(__file__).parent.resolve()
REPO_ROOT = PIPELINE_DIR.parent.parent  # monkey-island-web/
PUBLIC_PORTRAITS = REPO_ROOT / "public" / "assets" / "portraits"
PUBLIC_SPRITES   = REPO_ROOT / "public" / "assets" / "sprites"
BASES_DIR        = PIPELINE_DIR / "bases"
CHARACTERS_FILE  = PIPELINE_DIR / "characters.yaml"
VENV_PYTHON      = PIPELINE_DIR / ".venv" / "bin" / "python"
GENERATE_SCRIPT  = PIPELINE_DIR / "generate_characters.py"

# ── App ────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

# ── Job store ─────────────────────────────────────────────────

# jobs: job_id -> {"status": "running"|"done"|"failed", "output": [...], "error": str|None}
_jobs: dict[str, dict[str, Any]] = {}
_jobs_lock = threading.Lock()

MAX_OUTPUT_LINES = 500


def _run_job(job_id: str, cmd: list[str]) -> None:
    """Run a subprocess in a thread, capturing output into the job store."""
    with _jobs_lock:
        _jobs[job_id]["status"] = "running"

    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=str(PIPELINE_DIR),
        )
        for line in proc.stdout:  # type: ignore[union-attr]
            line = line.rstrip("\n")
            with _jobs_lock:
                out = _jobs[job_id]["output"]
                out.append(line)
                if len(out) > MAX_OUTPUT_LINES:
                    _jobs[job_id]["output"] = out[-MAX_OUTPUT_LINES:]

        proc.wait()
        with _jobs_lock:
            if proc.returncode == 0:
                _jobs[job_id]["status"] = "done"
            else:
                _jobs[job_id]["status"] = "failed"
                _jobs[job_id]["error"] = f"Process exited with code {proc.returncode}"
    except Exception as exc:
        with _jobs_lock:
            _jobs[job_id]["status"] = "failed"
            _jobs[job_id]["error"] = str(exc)


# ── Helpers ────────────────────────────────────────────────────

def _file_info(path: Path) -> dict[str, Any]:
    try:
        stat = path.stat()
        return {
            "name": path.name,
            "size": stat.st_size,
            "mtime": int(stat.st_mtime),
            "path": str(path),
        }
    except OSError:
        return {"name": path.name, "size": 0, "mtime": 0, "path": str(path)}


def _load_characters() -> dict[str, Any]:
    if not CHARACTERS_FILE.exists():
        return {}
    with open(CHARACTERS_FILE) as f:
        data = yaml.safe_load(f)
    return data.get("characters", {})


# ── Routes ─────────────────────────────────────────────────────

@app.route("/api/characters")
def get_characters():
    """Parse characters.yaml and return character list with portrait/sprite variants."""
    chars = _load_characters()
    result: list[dict[str, Any]] = []
    for name, cfg in chars.items():
        portraits = list((cfg.get("portraits") or {}).keys())
        sprites   = list((cfg.get("sprites")   or {}).keys())
        result.append({
            "name": name,
            "portraits": portraits,
            "sprites": sprites,
            "base_seed": cfg.get("base_seed"),
            "facing": cfg.get("facing", "right"),
        })
    return jsonify(result)


@app.route("/api/assets/portraits")
def get_portraits():
    """Scan public/assets/portraits/ and return file list with metadata."""
    if not PUBLIC_PORTRAITS.exists():
        return jsonify([])
    files = sorted(PUBLIC_PORTRAITS.glob("*.png"), key=lambda p: p.name)
    return jsonify([_file_info(f) for f in files])


@app.route("/api/assets/sprites")
def get_sprites():
    """Scan public/assets/sprites/ and return file list with metadata."""
    if not PUBLIC_SPRITES.exists():
        return jsonify([])
    files = sorted(PUBLIC_SPRITES.glob("*.png"), key=lambda p: p.name)
    return jsonify([_file_info(f) for f in files])


@app.route("/api/bases")
def get_bases():
    """Scan bases/ dir and return base image info."""
    if not BASES_DIR.exists():
        return jsonify([])
    files = sorted(BASES_DIR.rglob("*.png"), key=lambda p: str(p))
    result = []
    for f in files:
        info = _file_info(f)
        # relative path from bases dir, e.g. "portrait/guybrush_base.png"
        try:
            rel = f.relative_to(BASES_DIR)
            info["rel"] = str(rel)
        except ValueError:
            info["rel"] = f.name
        result.append(info)
    return jsonify(result)


@app.route("/bases/<path:rel_path>")
def serve_base(rel_path: str):
    """Serve base images directly (used by the UI for thumbnails)."""
    from flask import send_file
    target = BASES_DIR / rel_path
    # basic path traversal guard
    try:
        target.resolve().relative_to(BASES_DIR.resolve())
    except ValueError:
        return "Forbidden", 403
    if not target.exists():
        return "Not found", 404
    return send_file(target)


@app.route("/api/generate", methods=["POST"])
def generate():
    """
    Run generate_characters.py as a subprocess.
    Body JSON:
        character       (str | null)   — specific character or omit for all
        mode            (str)          — "all" | "portraits" | "sprites"
        strength_portrait (float)      — 0.3–0.9
        strength_sprite   (float)      — 0.3–0.9
        regenerate_base (bool)         — force Phase 1 regen
    Returns: { job_id: str }
    """
    body = request.get_json(force=True) or {}
    character       = body.get("character")
    mode            = body.get("mode", "all")
    str_portrait    = float(body.get("strength_portrait", 0.50))
    str_sprite      = float(body.get("strength_sprite",   0.65))
    regen_base      = bool(body.get("regenerate_base", False))

    # Determine python executable
    python_bin = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable

    cmd: list[str] = [python_bin, str(GENERATE_SCRIPT)]
    if character:
        cmd += ["--character", character]
    if mode in ("portraits", "sprites"):
        cmd += ["--mode", mode]
    if regen_base:
        cmd.append("--regenerate-base")
    # Pass strengths via env since generate_characters.py uses defaults;
    # if the script supports --strength-portrait etc. they can be added here.
    # For now we pass them as no-ops — the script uses YAML-defined strengths.
    # (Extend generate_characters.py CLI as needed.)

    job_id = str(uuid.uuid4())
    with _jobs_lock:
        _jobs[job_id] = {
            "status": "running",
            "output": [f"$ {' '.join(cmd)}"],
            "error": None,
        }

    t = threading.Thread(target=_run_job, args=(job_id, cmd), daemon=True)
    t.start()

    return jsonify({"job_id": job_id})


@app.route("/api/jobs/<job_id>")
def get_job(job_id: str):
    """Return job status + last N lines of output."""
    with _jobs_lock:
        job = _jobs.get(job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404
    # Return last 200 lines to keep payload manageable
    out = job["output"][-200:]
    return jsonify({
        "status": job["status"],
        "output": out,
        "error": job.get("error"),
    })


# ── Entry point ────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"Asset Pipeline Dev Server starting on http://localhost:7788")
    print(f"  Pipeline dir : {PIPELINE_DIR}")
    print(f"  Public assets: {REPO_ROOT / 'public' / 'assets'}")
    print(f"  Bases dir    : {BASES_DIR}")
    print(f"  Python (venv): {VENV_PYTHON}")
    print()
    app.run(host="0.0.0.0", port=7788, debug=True, use_reloader=False)
