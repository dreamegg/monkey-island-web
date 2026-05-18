#!/usr/bin/env python3
"""
Full Story → Game Pipeline
===========================
Runs the complete pipeline end-to-end:
  1. story-analyzer: story text → structure JSON + room/dialogue JSON files
  2. asset-pipeline:  structure → FLUX images via ComfyUI
  3. depth-analyzer:  images → depth maps + walk areas + game objects (Claude Vision)

Usage:
    python pipeline.py story.txt \\
        --model flux1-dev-fp8.safetensors \\
        --lora pixelart.safetensors \\
        --analyze

    # Skip already-generated steps:
    python pipeline.py story.txt --skip-story --skip-images --analyze
    python pipeline.py story.txt --skip-story --skip-analysis

Requirements:
    export ANTHROPIC_API_KEY=sk-ant-...
    ComfyUI running at http://127.0.0.1:8188
    pip install anthropic requests Pillow torch transformers opencv-python numpy
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent / "monkey-island-web" / "public"
STORY_ANALYZER = Path(__file__).parent.parent / "story-analyzer" / "analyze.py"
GENERATE = Path(__file__).parent / "generate.py"
ROOM_BUILDER = Path(__file__).parent.parent / "depth-analyzer" / "room_builder.py"


def run(cmd: list, label: str):
    print(f"\n{'='*60}")
    print(f"  STEP: {label}")
    print(f"{'='*60}")
    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        print(f"[warn] '{label}' exited with code {result.returncode}", file=sys.stderr)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(
        description="Full Story → FLUX images → Game JSON pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("story_file", help="Story text file (UTF-8)")

    # Skip flags
    parser.add_argument("--skip-story", action="store_true", help="Skip story-analyzer step")
    parser.add_argument("--skip-images", action="store_true", help="Skip FLUX image generation step")
    parser.add_argument("--skip-analysis", action="store_true", help="Skip room_builder analysis step")

    # story-analyzer options
    parser.add_argument("--room-ids", default="", help="Filter rooms to process (comma-separated)")

    # ComfyUI / FLUX options
    parser.add_argument("--comfyui-url", default="http://127.0.0.1:8188")
    parser.add_argument("--model", default="flux1-dev-fp8.safetensors")
    parser.add_argument("--lora", default="", help="LoRA filename (optional)")
    parser.add_argument("--lora-strength", type=float, default=0.85)
    parser.add_argument("--steps", type=int, default=20)
    parser.add_argument("--width", type=int, default=1600)
    parser.add_argument("--height", type=int, default=800)
    parser.add_argument("--seed", type=int, default=None)

    # Analysis options
    parser.add_argument("--device", default="cpu", choices=["cuda", "cpu", "mps"])
    parser.add_argument("--skip-segmentation", action="store_true")
    parser.add_argument("--skip-claude", action="store_true")

    args = parser.parse_args()

    story_path = Path(args.story_file)
    if not story_path.exists():
        print(f"[error] Story file not found: {story_path}", file=sys.stderr)
        sys.exit(1)

    structure_path = story_path.parent / f"{story_path.stem}_structure.json"

    # ── Step 1: Story analysis ────────────────────────────────────
    if not args.skip_story:
        cmd = [
            sys.executable, str(STORY_ANALYZER),
            str(story_path),
            "--structure-only",
        ]
        if not run(cmd, "Story analysis → structure JSON"):
            print("[error] Story analysis failed. Aborting.", file=sys.stderr)
            sys.exit(1)
        # story-analyzer --structure-only prints to stdout; we need to capture it
        result = subprocess.run(
            [sys.executable, str(STORY_ANALYZER), str(story_path), "--structure-only"],
            capture_output=True, text=True,
        )
        # Parse from stdout (skip non-JSON lines)
        lines = result.stdout.strip().splitlines()
        json_start = next((i for i, l in enumerate(lines) if l.strip().startswith("{")), None)
        if json_start is None:
            print("[error] Could not parse structure from story-analyzer output", file=sys.stderr)
            print(result.stdout[:500])
            sys.exit(1)
        structure = json.loads("\n".join(lines[json_start:]))
        structure_path.write_text(json.dumps(structure, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  Structure saved → {structure_path}")

        # Also run full story analyzer to generate room + dialogue JSONs
        cmd2 = [sys.executable, str(STORY_ANALYZER), str(story_path)]
        if args.room_ids:
            cmd2 += ["--room-ids", args.room_ids]
        run(cmd2, "Generate room + dialogue JSON files")

    else:
        if not structure_path.exists():
            print(f"[error] --skip-story set but {structure_path} not found.", file=sys.stderr)
            sys.exit(1)
        with open(structure_path, encoding="utf-8") as f:
            structure = json.load(f)
        print(f"  Loaded existing structure: {structure_path}")

    rooms = structure.get("rooms", [])
    if args.room_ids:
        filter_set = set(args.room_ids.split(","))
        rooms = [r for r in rooms if r["id"] in filter_set]
    print(f"\n  Rooms to process: {[r['id'] for r in rooms]}")

    # ── Step 2: Image generation ──────────────────────────────────
    if not args.skip_images:
        backgrounds_dir = ROOT / "assets" / "backgrounds"
        for room in rooms:
            room_id = room["id"]
            room_name = room.get("name", room_id)
            # Use imagePrompt from structure if available, else description
            prompt = room.get("imagePrompt") or room.get("description", room_name)

            cmd = [
                sys.executable, str(GENERATE),
                "--room-id", room_id,
                "--room-name", room_name,
                "--prompt", prompt,
                "--output", str(backgrounds_dir),
                "--comfyui-url", args.comfyui_url,
                "--model", args.model,
                "--steps", str(args.steps),
                "--width", str(args.width),
                "--height", str(args.height),
            ]
            if args.lora:
                cmd += ["--lora", args.lora, "--lora-strength", str(args.lora_strength)]
            if args.seed is not None:
                cmd += ["--seed", str(args.seed)]

            run(cmd, f"Generate image: {room_id}")

    # ── Step 3: Depth + segmentation + Claude Vision ──────────────
    if not args.skip_analysis:
        backgrounds_dir = ROOT / "assets" / "backgrounds"
        depth_dir = ROOT / "room-configs"
        rooms_dir = ROOT / "rooms"

        for room in rooms:
            room_id = room["id"]
            room_name = room.get("name", room_id)
            img_path = backgrounds_dir / f"{room_id}.png"

            if not img_path.exists():
                print(f"  [skip] No image found for {room_id}: {img_path}")
                continue

            cmd = [
                sys.executable, str(ROOM_BUILDER),
                "--image", str(img_path),
                "--room-id", room_id,
                "--room-name", room_name,
                "--context", room.get("description", ""),
                "--output", str(depth_dir),
                "--rooms-dir", str(rooms_dir),
                "--device", args.device,
            ]
            if args.skip_segmentation:
                cmd.append("--skip-segmentation")
            if args.skip_claude:
                cmd.append("--skip-claude")

            run(cmd, f"Room analysis: {room_id}")

    # ── Summary ───────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("  PIPELINE COMPLETE")
    print(f"{'='*60}")
    room_ids = [r["id"] for r in rooms]
    print(f"\n  Generated rooms: {room_ids}")
    print("\n  Add to App.tsx ALL_ROOMS:")
    print(f"    {room_ids}")
    print("\n  Then: npm run dev")


if __name__ == "__main__":
    main()
