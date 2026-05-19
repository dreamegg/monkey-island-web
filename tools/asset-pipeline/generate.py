#!/usr/bin/env python3
"""
Background Image Generator — ComfyUI FLUX API client
======================================================
Generates SCUMM-style adventure game backgrounds using a local FLUX model
via the ComfyUI API, then optionally chains into the room analysis pipeline.

Usage:
    # Single room from prompt
    python generate.py \\
        --room-id harbor --room-name "항구" \\
        --prompt "pixel art Caribbean harbor, wooden docks, pirate ships, sunset, SCUMM style"

    # From story-analyzer structure JSON
    python generate.py --from-structure structure.json

    # With PixelArt LoRA
    python generate.py --room-id tavern --room-name "술집" \\
        --prompt "..." --lora pixelart_xl.safetensors --lora-strength 0.85

    # Generate + auto-analyze (full pipeline)
    python generate.py --room-id harbor --room-name "항구" \\
        --prompt "..." --analyze

Requirements:
    pip install requests pillow
    ComfyUI running locally (default: http://127.0.0.1:8188)
    FLUX model installed in ComfyUI/models/checkpoints/
"""

import argparse
import json
import random
import sys
import time
from pathlib import Path

import requests
from PIL import Image

# ── Default configuration ─────────────────────────────────────────

DEFAULT_COMFYUI_URL = "http://127.0.0.1:8188"
DEFAULT_MODEL = "flux1-dev-fp8.safetensors"
DEFAULT_WIDTH = 1600
DEFAULT_HEIGHT = 800
DEFAULT_STEPS = 20
DEFAULT_CFG = 1.0          # FLUX.1 uses cfg=1 (guidance distillation)

WORKFLOWS_DIR = Path(__file__).parent / "workflows"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "monkey-island-web" / "public" / "assets" / "backgrounds"

# ── Base prompt template for Monkey Island style ──────────────────

STYLE_SUFFIX = (
    ", pixel art, 16-bit SCUMM adventure game background, "
    "point-and-click adventure game scene, no characters, wide establishing shot, "
    "detailed background, Caribbean island aesthetic, LucasArts style"
)

# ── ComfyUI API helpers ───────────────────────────────────────────

def check_comfyui(base_url: str) -> bool:
    """Check if ComfyUI is running and reachable."""
    try:
        r = requests.get(f"{base_url}/system_stats", timeout=5)
        return r.status_code == 200
    except Exception:
        return False


def queue_prompt(base_url: str, workflow: dict, client_id: str = "monkey_island") -> str:
    """Submit a workflow to ComfyUI queue. Returns prompt_id."""
    payload = {"prompt": workflow, "client_id": client_id}
    r = requests.post(f"{base_url}/prompt", json=payload, timeout=30)
    r.raise_for_status()
    return r.json()["prompt_id"]


def wait_for_result(base_url: str, prompt_id: str, timeout: int = 300) -> dict:
    """Poll /history until the prompt is done. Returns history entry."""
    start = time.time()
    while time.time() - start < timeout:
        r = requests.get(f"{base_url}/history/{prompt_id}", timeout=10)
        if r.status_code == 200:
            history = r.json()
            if prompt_id in history:
                entry = history[prompt_id]
                # Status can be 'success', 'error', or missing (still running)
                status = entry.get("status", {})
                if status.get("completed", False) or entry.get("outputs"):
                    return entry
        time.sleep(2)
    raise TimeoutError(f"ComfyUI job {prompt_id} timed out after {timeout}s")


def download_output_image(base_url: str, history_entry: dict) -> bytes | None:
    """Extract and download the first output image from a history entry."""
    outputs = history_entry.get("outputs", {})
    for node_id, node_output in outputs.items():
        images = node_output.get("images", [])
        for img_info in images:
            filename = img_info.get("filename")
            subfolder = img_info.get("subfolder", "")
            img_type = img_info.get("type", "output")
            if filename:
                params = {"filename": filename, "subfolder": subfolder, "type": img_type}
                r = requests.get(f"{base_url}/view", params=params, timeout=30)
                if r.status_code == 200:
                    return r.content
    return None


# ── Workflow builder ──────────────────────────────────────────────

def load_workflow(lora: str | None) -> dict:
    """Load the appropriate workflow JSON template."""
    if lora:
        wf_path = WORKFLOWS_DIR / "flux_background_lora.json"
    else:
        wf_path = WORKFLOWS_DIR / "flux_background.json"

    with open(wf_path, encoding="utf-8") as f:
        return json.load(f)


def build_workflow(
    prompt: str,
    model: str,
    width: int,
    height: int,
    steps: int,
    cfg: float,
    seed: int,
    lora: str | None = None,
    lora_strength: float = 0.85,
) -> dict:
    """Fill in workflow template placeholders and return the final dict."""
    workflow = load_workflow(lora)

    # Stringify then replace — handles nested values cleanly
    wf_str = json.dumps(workflow)
    replacements = {
        '"__PROMPT__"': json.dumps(prompt),
        '"__MODEL__"': json.dumps(model),
        '"__WIDTH__"': str(width),
        '"__HEIGHT__"': str(height),
        '"__STEPS__"': str(steps),
        '"__CFG__"': str(cfg),
        '"__SEED__"': str(seed),
    }
    if lora:
        replacements['"__LORA__"'] = json.dumps(lora)
        replacements['"__LORA_STRENGTH__"'] = str(lora_strength)

    for placeholder, value in replacements.items():
        wf_str = wf_str.replace(placeholder, value)

    return json.loads(wf_str)


# ── Main generation function ──────────────────────────────────────

def generate_background(
    room_id: str,
    room_name: str,
    prompt: str,
    output_dir: Path,
    comfyui_url: str = DEFAULT_COMFYUI_URL,
    model: str = DEFAULT_MODEL,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    steps: int = DEFAULT_STEPS,
    cfg: float = DEFAULT_CFG,
    seed: int | None = None,
    lora: str | None = None,
    lora_strength: float = 0.85,
    add_style_suffix: bool = True,
) -> Path:
    """Generate one background image and save it. Returns output path."""
    if seed is None:
        seed = random.randint(0, 2**32 - 1)

    full_prompt = prompt + STYLE_SUFFIX if add_style_suffix else prompt

    print(f"\n  Room:   {room_id} ({room_name})")
    print(f"  Prompt: {full_prompt[:120]}{'...' if len(full_prompt) > 120 else ''}")
    print(f"  Model:  {model}  Size: {width}x{height}  Steps: {steps}  Seed: {seed}")
    if lora:
        print(f"  LoRA:   {lora}  strength={lora_strength}")

    # ── Build and submit workflow ─────────────────────────────────
    workflow = build_workflow(full_prompt, model, width, height, steps, cfg, seed, lora, lora_strength)

    print("  → Queuing prompt in ComfyUI...")
    prompt_id = queue_prompt(comfyui_url, workflow)
    print(f"  → Prompt ID: {prompt_id}  (waiting...)")

    # ── Wait for completion ───────────────────────────────────────
    history = wait_for_result(comfyui_url, prompt_id)

    status = history.get("status", {})
    if status.get("status_str") == "error":
        messages = status.get("messages", [])
        raise RuntimeError(f"ComfyUI error: {messages}")

    # ── Download + save ───────────────────────────────────────────
    img_bytes = download_output_image(comfyui_url, history)
    if not img_bytes:
        raise RuntimeError(f"No output image found in history for {prompt_id}")

    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / f"{room_id}.png"

    # Resize to exact canvas dimensions if needed
    from io import BytesIO
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    if img.size != (width, height):
        img = img.resize((width, height), Image.LANCZOS)
    img.save(str(out_path), "PNG", optimize=True)

    print(f"  ✓ Saved: {out_path}  ({img.width}x{img.height})")
    return out_path


# ── Story structure mode ──────────────────────────────────────────

def generate_from_structure(
    structure_path: Path,
    output_dir: Path,
    comfyui_url: str,
    model: str,
    width: int,
    height: int,
    steps: int,
    cfg: float,
    seed: int | None,
    lora: str | None,
    lora_strength: float,
    filter_ids: list[str],
    analyze: bool,
    analyze_args: dict,
) -> None:
    """Generate backgrounds for all rooms in a story-analyzer structure JSON."""
    with open(structure_path, encoding="utf-8") as f:
        structure = json.load(f)

    rooms = structure.get("rooms", [])
    if not rooms:
        print("No rooms found in structure JSON.", file=sys.stderr)
        sys.exit(1)

    if filter_ids:
        rooms = [r for r in rooms if r["id"] in filter_ids]

    print(f"Generating {len(rooms)} room background(s) from {structure_path.name}")

    generated = []
    for room in rooms:
        room_id = room["id"]
        room_name = room.get("name", room_id)
        description = room.get("description", room_name)

        # Build a richer prompt from the structure
        npcs = room.get("npcs", [])
        items = room.get("items", [])
        npc_hint = f", with {', '.join(npcs[:3])}" if npcs else ""
        item_hint = f", featuring {', '.join(items[:3])}" if items else ""
        prompt = f"{description}{npc_hint}{item_hint}"

        try:
            out_path = generate_background(
                room_id, room_name, prompt, output_dir,
                comfyui_url=comfyui_url, model=model,
                width=width, height=height,
                steps=steps, cfg=cfg,
                seed=seed, lora=lora, lora_strength=lora_strength,
            )
            generated.append((room_id, room_name, str(out_path)))

            if analyze:
                _run_analysis(room_id, room_name, str(out_path), **analyze_args)

        except Exception as e:
            print(f"  [error] {room_id}: {e}", file=sys.stderr)

    print(f"\nDone — {len(generated)} images generated")
    print("Add these room IDs to App.tsx ALL_ROOMS:")
    print(f"  {[r[0] for r in generated]}")


def _run_analysis(room_id: str, room_name: str, image_path: str, **kwargs):
    """Call room_builder.py for depth + segmentation + Claude Vision."""
    import subprocess
    builder = Path(__file__).parent.parent / "depth-analyzer" / "room_builder.py"
    cmd = [
        sys.executable, str(builder),
        "--image", image_path,
        "--room-id", room_id,
        "--room-name", room_name,
        "--output", kwargs.get("depth_output", "../../monkey-island-web/public/room-configs"),
        "--rooms-dir", kwargs.get("rooms_dir", "../../monkey-island-web/public/rooms"),
        "--device", kwargs.get("device", "cpu"),
    ]
    if kwargs.get("skip_segmentation"):
        cmd.append("--skip-segmentation")
    if kwargs.get("skip_claude"):
        cmd.append("--skip-claude")
    print(f"\n  → Running room analysis for {room_id}...")
    subprocess.run(cmd, check=False)


# ── CLI ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate SCUMM-style backgrounds via local ComfyUI FLUX API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    # Input modes
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--prompt", help="Text prompt for image generation")
    input_group.add_argument(
        "--from-structure",
        metavar="JSON",
        help="story-analyzer structure JSON (generates all rooms)",
    )

    # Room info (required with --prompt)
    parser.add_argument("--room-id", help="Room ID (snake_case)")
    parser.add_argument("--room-name", default="", help="Korean display name")
    parser.add_argument(
        "--room-ids",
        default="",
        help="Comma-separated room IDs to filter (--from-structure only)",
    )

    # ComfyUI settings
    parser.add_argument(
        "--comfyui-url",
        default=DEFAULT_COMFYUI_URL,
        help=f"ComfyUI server URL (default: {DEFAULT_COMFYUI_URL})",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"FLUX checkpoint filename in ComfyUI models/ (default: {DEFAULT_MODEL})",
    )
    parser.add_argument("--lora", default="", help="LoRA filename (optional)")
    parser.add_argument(
        "--lora-strength", type=float, default=0.85, help="LoRA weight (default: 0.85)"
    )

    # Generation settings
    parser.add_argument("--width", type=int, default=DEFAULT_WIDTH, help=f"Image width (default: {DEFAULT_WIDTH})")
    parser.add_argument("--height", type=int, default=DEFAULT_HEIGHT, help=f"Image height (default: {DEFAULT_HEIGHT})")
    parser.add_argument("--steps", type=int, default=DEFAULT_STEPS, help=f"Sampling steps (default: {DEFAULT_STEPS})")
    parser.add_argument("--cfg", type=float, default=DEFAULT_CFG, help=f"CFG scale (default: {DEFAULT_CFG})")
    parser.add_argument("--seed", type=int, default=None, help="Random seed (random if omitted)")
    parser.add_argument("--no-style-suffix", action="store_true", help="Don't append pixel-art style suffix to prompt")

    # Output
    parser.add_argument(
        "--output", "-o",
        default=str(OUTPUT_DIR),
        help="Output directory for PNGs (default: public/assets/backgrounds)",
    )

    # Pipeline chaining
    parser.add_argument(
        "--analyze",
        action="store_true",
        help="After generation, run room_builder.py (depth + segmentation + Claude Vision)",
    )
    parser.add_argument(
        "--skip-segmentation",
        action="store_true",
        help="(--analyze) Skip Mask2Former segmentation",
    )
    parser.add_argument(
        "--skip-claude",
        action="store_true",
        help="(--analyze) Skip Claude Vision API",
    )
    parser.add_argument(
        "--device",
        default="cpu",
        choices=["cuda", "cpu", "mps"],
        help="(--analyze) Inference device for AI models (default: cpu)",
    )

    args = parser.parse_args()

    output_dir = Path(args.output)
    lora = args.lora or None

    # ── Check ComfyUI ─────────────────────────────────────────────
    print(f"Checking ComfyUI at {args.comfyui_url}...")
    if not check_comfyui(args.comfyui_url):
        print(
            f"[error] Cannot reach ComfyUI at {args.comfyui_url}\n"
            "Make sure ComfyUI is running: python main.py --listen",
            file=sys.stderr,
        )
        sys.exit(1)
    print("  ComfyUI: OK")

    analyze_args = {
        "depth_output": str(Path(output_dir).parent.parent / "room-configs"),
        "rooms_dir": str(Path(output_dir).parent.parent / "rooms"),
        "device": args.device,
        "skip_segmentation": args.skip_segmentation,
        "skip_claude": args.skip_claude,
    }

    # ── from-structure mode ───────────────────────────────────────
    if args.from_structure:
        filter_ids = [r.strip() for r in args.room_ids.split(",") if r.strip()]
        generate_from_structure(
            Path(args.from_structure),
            output_dir,
            comfyui_url=args.comfyui_url,
            model=args.model,
            width=args.width,
            height=args.height,
            steps=args.steps,
            cfg=args.cfg,
            seed=args.seed,
            lora=lora,
            lora_strength=args.lora_strength,
            filter_ids=filter_ids,
            analyze=args.analyze,
            analyze_args=analyze_args,
        )
        return

    # ── Single prompt mode ────────────────────────────────────────
    if not args.room_id:
        parser.error("--room-id is required when using --prompt")

    out_path = generate_background(
        room_id=args.room_id,
        room_name=args.room_name or args.room_id,
        prompt=args.prompt,
        output_dir=output_dir,
        comfyui_url=args.comfyui_url,
        model=args.model,
        width=args.width,
        height=args.height,
        steps=args.steps,
        cfg=args.cfg,
        seed=args.seed,
        lora=lora,
        lora_strength=args.lora_strength,
        add_style_suffix=not args.no_style_suffix,
    )

    if args.analyze:
        _run_analysis(
            args.room_id,
            args.room_name or args.room_id,
            str(out_path),
            **analyze_args,
        )

    print("\nDone.")
    print(f"  Image: {out_path}")
    if not args.analyze:
        print(f"\nNext: run room analysis:")
        print(
            f"  python ../depth-analyzer/room_builder.py \\\n"
            f"    --image {out_path} \\\n"
            f"    --room-id {args.room_id} --room-name \"{args.room_name or args.room_id}\""
        )
    print(f"\nThen add '{args.room_id}' to App.tsx ALL_ROOMS and npm run dev")


if __name__ == "__main__":
    main()
