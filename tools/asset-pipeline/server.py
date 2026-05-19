#!/usr/bin/env python3
"""
Asset Pipeline API Server
=========================
Flask API server for DevTools panels — story generation, image generation,
character asset management, and room analysis.

Usage:
    cd tools/asset-pipeline
    .venv/bin/python server.py
    # or: python server.py

Endpoints:
    GET  /api/health
    GET  /api/characters
    POST /api/generate
    GET  /api/jobs/{id}
    GET  /api/rooms
    GET  /api/games
    POST /api/story/analyze
    POST /api/story/generate
    POST /api/image/generate
    POST /api/image/analyze
    GET  /api/backgrounds
"""

import json
import os
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── Configuration ─────────────────────────────────────────────────

PORT = 7788
COMFYUI_URL = "http://127.0.0.1:8188"

# Paths relative to this file
_HERE = Path(__file__).parent
PUBLIC_DIR = _HERE.parent.parent / "monkey-island-web" / "public"
BACKGROUNDS_DIR = PUBLIC_DIR / "assets" / "backgrounds"
ROOMS_DIR = PUBLIC_DIR / "rooms"
GAMES_DIR = PUBLIC_DIR / "games"
ROOM_BUILDER = _HERE.parent / "depth-analyzer" / "room_builder.py"
STORY_ANALYZER = _HERE.parent / "story-analyzer" / "analyze.py"

# In-memory job store: {job_id: {"status": str, "output": [str], "error": str|None}}
jobs: dict[str, dict] = {}
jobs_lock = threading.Lock()

# ── App setup ─────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app, origins="*")


# ── Helpers ───────────────────────────────────────────────────────

def check_comfyui() -> bool:
    try:
        r = requests.get(f"{COMFYUI_URL}/system_stats", timeout=3)
        return r.status_code == 200
    except Exception:
        return False


def check_anthropic() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


def new_job() -> str:
    job_id = str(uuid.uuid4())
    with jobs_lock:
        jobs[job_id] = {"status": "running", "output": [], "error": None}
    return job_id


def append_output(job_id: str, line: str) -> None:
    with jobs_lock:
        if job_id in jobs:
            jobs[job_id]["output"].append(line)


def finish_job(job_id: str, success: bool, error: str | None = None) -> None:
    with jobs_lock:
        if job_id in jobs:
            jobs[job_id]["status"] = "done" if success else "failed"
            if error:
                jobs[job_id]["error"] = error


def run_subprocess_job(job_id: str, cmd: list[str], cwd: Path | None = None) -> None:
    """Run a subprocess, streaming stdout/stderr into the job output list."""
    try:
        append_output(job_id, f"$ {' '.join(str(c) for c in cmd)}")
        proc = subprocess.Popen(
            [str(c) for c in cmd],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=str(cwd) if cwd else None,
            env={**os.environ},
        )
        for line in proc.stdout:  # type: ignore[union-attr]
            append_output(job_id, line.rstrip())
        proc.wait()
        if proc.returncode == 0:
            finish_job(job_id, True)
        else:
            finish_job(job_id, False, f"Process exited with code {proc.returncode}")
    except Exception as exc:
        finish_job(job_id, False, str(exc))


# ── Health ────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "comfyui": check_comfyui(),
        "anthropic": check_anthropic(),
    })


# ── Characters (compatibility for AssetManagerPanel) ─────────────

@app.get("/api/characters")
def get_characters():
    characters = ["guybrush", "lechuck", "elaine", "voodoo_lady", "bartender"]
    return jsonify({"characters": characters})


# ── Generate (character asset generation, compatibility) ──────────

@app.post("/api/generate")
def generate():
    data = request.get_json(force=True, silent=True) or {}
    job_id = new_job()

    def _run():
        pipeline = _HERE / "pipeline.py"
        if not pipeline.exists():
            finish_job(job_id, False, "pipeline.py not found")
            return
        cmd = [sys.executable, str(pipeline)]
        if data.get("character"):
            cmd += ["--character", data["character"]]
        if data.get("mode"):
            cmd += ["--mode", data["mode"]]
        run_subprocess_job(job_id, cmd, cwd=_HERE)

    threading.Thread(target=_run, daemon=True).start()
    return jsonify({"job_id": job_id})


# ── Job status ────────────────────────────────────────────────────

@app.get("/api/jobs/<job_id>")
def get_job(job_id: str):
    with jobs_lock:
        job = jobs.get(job_id)
    if job is None:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)


# ── Rooms ─────────────────────────────────────────────────────────

@app.get("/api/rooms")
def get_rooms():
    result = []
    if ROOMS_DIR.exists():
        for f in sorted(ROOMS_DIR.glob("*.json")):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                result.append({"id": data.get("id", f.stem), "name": data.get("name", f.stem)})
            except Exception:
                result.append({"id": f.stem, "name": f.stem})
    return jsonify(result)


# ── Games ─────────────────────────────────────────────────────────

@app.get("/api/games")
def get_games():
    result = []
    if GAMES_DIR.exists():
        for config_path in sorted(GAMES_DIR.glob("*/config.json")):
            try:
                data = json.loads(config_path.read_text(encoding="utf-8"))
                result.append({
                    "id": data.get("id", config_path.parent.name),
                    "title": data.get("title", config_path.parent.name),
                })
            except Exception:
                result.append({
                    "id": config_path.parent.name,
                    "title": config_path.parent.name,
                })
    return jsonify(result)


# ── Backgrounds ───────────────────────────────────────────────────

@app.get("/api/backgrounds")
def get_backgrounds():
    result = []
    if BACKGROUNDS_DIR.exists():
        for f in sorted(BACKGROUNDS_DIR.glob("*.png")):
            result.append({
                "id": f.stem,
                "url": f"/assets/backgrounds/{f.name}",
            })
    return jsonify(result)


# ── Story: analyze ────────────────────────────────────────────────

@app.post("/api/story/analyze")
def story_analyze():
    """Run pass-1 story extraction via Claude API directly (not subprocess).
    Returns the structure JSON synchronously (Claude call is fast enough for a UI wait).
    """
    data = request.get_json(force=True, silent=True) or {}
    story_text = data.get("text", "").strip()
    if not story_text:
        return jsonify({"error": "text is required"}), 400

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY not set"}), 503

    # Import inline to avoid hard dependency at startup
    try:
        import anthropic  # type: ignore[import]
    except ImportError:
        return jsonify({"error": "anthropic package not installed"}), 503

    # Re-use the prompt from story-analyzer/analyze.py
    EXTRACTION_SYSTEM = """\
You are a game designer converting narrative fiction into a SCUMM-style point-and-click adventure game.

Your task: analyze the provided story and output a structured game design document.

Output ONLY valid JSON matching this structure:
{
  "title": "Korean game title",
  "rooms": [
    {
      "id": "snake_case_id",
      "name": "Korean display name",
      "description": "Brief description for background art generation",
      "imagePrompt": "Detailed English image generation prompt for FLUX (scene composition, lighting, objects, mood, no characters)",
      "npcs": ["npc_id_1"],
      "items": ["item that can be found here"],
      "connections": ["other_room_id"]
    }
  ],
  "npcs": [
    {
      "id": "snake_case_id",
      "name": "Korean name",
      "location": "room_id",
      "personality": "brief personality description",
      "knowledge": ["what they know / can tell the player"],
      "gives": ["item they give if conditions met"]
    }
  ],
  "items": [
    {
      "id": "snake_case_id",
      "name": "Korean name",
      "icon": "single emoji",
      "location": "room_id or npc_id",
      "purpose": "what it's used for"
    }
  ],
  "flags": [
    {
      "id": "snake_case_flag_name",
      "description": "what this flag tracks"
    }
  ],
  "player_goals": ["main objective 1", "main objective 2"]
}

Guidelines:
- Generate 3-7 rooms from the story locations.
- All names must be in Korean.
- Keep it faithful to the source story but adapt it to adventure game structure.
- Items should have meaningful uses (puzzles, unlocking areas, dialogue triggers).
- imagePrompt: English prompt for FLUX image generation. Include scene composition, lighting,
  mood, prominent objects, architectural details. No characters or people.
"""

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=4096,
            system=EXTRACTION_SYSTEM,
            messages=[{
                "role": "user",
                "content": f"Analyze this story and extract the game structure:\n\n{story_text}"
            }]
        )
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0]
        structure = json.loads(text)
        return jsonify(structure)
    except json.JSONDecodeError as exc:
        return jsonify({"error": f"Claude returned invalid JSON: {exc}"}), 500
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── Story: generate files ─────────────────────────────────────────

@app.post("/api/story/generate")
def story_generate():
    """Generate room + dialogue JSON files from a structure dict.
    Runs story-analyzer/analyze.py as a subprocess (writes to a temp story file).
    """
    data = request.get_json(force=True, silent=True) or {}
    structure = data.get("structure")
    output_dir = data.get("output_dir", str(PUBLIC_DIR))
    game_id = data.get("game_id", "")

    if not structure:
        return jsonify({"error": "structure is required"}), 400

    job_id = new_job()

    def _run():
        import tempfile

        try:
            # Write structure to a temp file, then call a helper that reads it
            # We use a small inline script that accepts a pre-extracted structure
            # (to avoid re-running Claude for pass-1)
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".json", delete=False, encoding="utf-8"
            ) as tf:
                json.dump(structure, tf, ensure_ascii=False)
                tf_path = tf.name

            append_output(job_id, f"Structure saved to {tf_path}")

            # Build inline Python runner that calls story-analyzer helpers directly
            runner_code = f"""
import json, sys, os
from pathlib import Path

sys.path.insert(0, str(Path({repr(str(STORY_ANALYZER.parent))})))

import anthropic

api_key = os.environ.get("ANTHROPIC_API_KEY", "")
client = anthropic.Anthropic(api_key=api_key)

with open({repr(tf_path)}, encoding="utf-8") as f:
    structure = json.load(f)

output_dir = Path({repr(output_dir)})
game_id = {repr(game_id)}

# Determine output dirs
if game_id:
    rooms_dir = output_dir / "games" / game_id / "rooms"
    dialogues_dir = output_dir / "games" / game_id / "dialogues"
    # Also write a config stub
    game_dir = output_dir / "games" / game_id
    game_dir.mkdir(parents=True, exist_ok=True)
    config = {{
        "id": game_id,
        "title": structure.get("title", game_id),
        "startRoom": structure["rooms"][0]["id"] if structure.get("rooms") else "start",
        "rooms": [r["id"] for r in structure.get("rooms", [])],
    }}
    config_path = game_dir / "config.json"
    config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  Written: {{config_path}}")
else:
    rooms_dir = output_dir / "rooms"
    dialogues_dir = output_dir / "dialogues"

rooms_dir.mkdir(parents=True, exist_ok=True)
dialogues_dir.mkdir(parents=True, exist_ok=True)

# Import story analyzer functions
from analyze import generate_room_json, generate_dialogue_json

story_text = structure.get("title", "")

print(f"Generating {{len(structure.get('rooms', []))}} rooms...")
for room_info in structure.get("rooms", []):
    try:
        room_json = generate_room_json(client, room_info, structure, story_text)
        out = rooms_dir / f"{{room_info['id']}}.json"
        out.write_text(json.dumps(room_json, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  Room written: {{out}}")
    except Exception as e:
        print(f"  [error] room {{room_info['id']}}: {{e}}", file=sys.stderr)

print(f"Generating {{len(structure.get('npcs', []))}} dialogues...")
for npc_info in structure.get("npcs", []):
    try:
        dlg_json = generate_dialogue_json(client, npc_info, structure, story_text)
        out = dialogues_dir / f"{{npc_info['id']}}.json"
        out.write_text(json.dumps(dlg_json, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  Dialogue written: {{out}}")
    except Exception as e:
        print(f"  [error] npc {{npc_info['id']}}: {{e}}", file=sys.stderr)

print("Done.")
"""

            runner_path = Path(tf_path).with_suffix(".runner.py")
            runner_path.write_text(runner_code, encoding="utf-8")
            append_output(job_id, "Starting generation via Claude API...")

            proc = subprocess.Popen(
                [sys.executable, str(runner_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                env={**os.environ},
            )
            for line in proc.stdout:  # type: ignore[union-attr]
                append_output(job_id, line.rstrip())
            proc.wait()

            # Cleanup temp files
            try:
                Path(tf_path).unlink(missing_ok=True)
                runner_path.unlink(missing_ok=True)
            except Exception:
                pass

            if proc.returncode == 0:
                finish_job(job_id, True)
            else:
                finish_job(job_id, False, f"Process exited with code {proc.returncode}")

        except Exception as exc:
            finish_job(job_id, False, str(exc))

    threading.Thread(target=_run, daemon=True).start()
    return jsonify({"job_id": job_id})


# ── Image: generate via ComfyUI ───────────────────────────────────

@app.post("/api/image/generate")
def image_generate():
    data = request.get_json(force=True, silent=True) or {}
    room_id = data.get("room_id", "")
    room_name = data.get("room_name", room_id)
    prompt = data.get("prompt", "")
    model = data.get("model", "flux1-dev-fp8.safetensors")
    steps = int(data.get("steps", 20))
    width = int(data.get("width", 1600))
    height = int(data.get("height", 800))
    seed = data.get("seed")
    lora = data.get("lora") or None

    if not room_id or not prompt:
        return jsonify({"error": "room_id and prompt are required"}), 400

    job_id = new_job()
    generate_script = _HERE / "generate.py"

    def _run():
        cmd = [
            sys.executable, str(generate_script),
            "--prompt", prompt,
            "--room-id", room_id,
            "--room-name", room_name,
            "--model", model,
            "--steps", str(steps),
            "--width", str(width),
            "--height", str(height),
            "--output", str(BACKGROUNDS_DIR),
        ]
        if seed is not None:
            cmd += ["--seed", str(seed)]
        if lora:
            cmd += ["--lora", lora]
        run_subprocess_job(job_id, cmd, cwd=_HERE)

    threading.Thread(target=_run, daemon=True).start()
    return jsonify({"job_id": job_id})


# ── Image: analyze via room_builder ───────────────────────────────

@app.post("/api/image/analyze")
def image_analyze():
    data = request.get_json(force=True, silent=True) or {}
    room_id = data.get("room_id", "")
    room_name = data.get("room_name", room_id)
    context = data.get("context", "")
    device = data.get("device", "cpu")
    skip_segmentation = bool(data.get("skip_segmentation", False))
    skip_claude = bool(data.get("skip_claude", False))

    if not room_id:
        return jsonify({"error": "room_id is required"}), 400

    image_path = BACKGROUNDS_DIR / f"{room_id}.png"
    if not image_path.exists():
        return jsonify({"error": f"Background image not found: {image_path.name}"}), 404

    job_id = new_job()

    def _run():
        cmd = [
            sys.executable, str(ROOM_BUILDER),
            "--image", str(image_path),
            "--room-id", room_id,
            "--room-name", room_name,
            "--output", str(PUBLIC_DIR / "room-configs"),
            "--rooms-dir", str(ROOMS_DIR),
            "--device", device,
        ]
        if context:
            cmd += ["--context", context]
        if skip_segmentation:
            cmd.append("--skip-segmentation")
        if skip_claude:
            cmd.append("--skip-claude")
        run_subprocess_job(job_id, cmd, cwd=ROOM_BUILDER.parent)

    threading.Thread(target=_run, daemon=True).start()
    return jsonify({"job_id": job_id})


# ── Static base image serving (for AssetManagerPanel /bases/ URLs) ─

@app.get("/bases/<asset_type>/<filename>")
def serve_base(asset_type: str, filename: str):
    """Compatibility endpoint for AssetManagerPanel's baseSrc() helper."""
    # Return 404 — base images are not part of this pipeline yet
    return jsonify({"error": "not found"}), 404


# ── Entry point ───────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"Asset Pipeline Server starting on http://localhost:{PORT}")
    print(f"  Public dir:  {PUBLIC_DIR}")
    print(f"  ComfyUI:     {COMFYUI_URL}")
    print(f"  Anthropic:   {'configured' if check_anthropic() else 'NOT SET (set ANTHROPIC_API_KEY)'}")
    app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)
