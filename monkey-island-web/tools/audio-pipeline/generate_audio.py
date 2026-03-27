#!/usr/bin/env python3
"""Generate game background music tracks using ACE-Step.

Usage:
    python generate_audio.py --track harbor
    python generate_audio.py --all
    python generate_audio.py --list
"""

import argparse
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "public" / "audio"

# Game music track definitions
TRACKS = {
    "harbor": {
        "prompt": (
            "retro chiptune pirate adventure theme, 8-bit style, "
            "upbeat sea shanty melody, nautical feel, moonlit dock atmosphere, "
            "NES-era game music, loopable background music, no vocals, "
            "medium tempo 120 BPM"
        ),
        "duration": 60.0,
        "seed": 3001,
    },
    "tavern": {
        "prompt": (
            "retro chiptune tavern music, 8-bit style, "
            "lively pub atmosphere, accordion and fiddle melody feel, "
            "warm and jovial, pirate drinking song instrumental, "
            "NES-era game music, loopable, no vocals, "
            "upbeat tempo 130 BPM"
        ),
        "duration": 60.0,
        "seed": 3002,
    },
    "forest": {
        "prompt": (
            "retro chiptune mysterious forest theme, 8-bit style, "
            "tropical jungle ambient, eerie and adventurous, "
            "bird calls in melody, suspenseful undertone, "
            "NES-era game music, loopable, no vocals, "
            "slow tempo 90 BPM"
        ),
        "duration": 60.0,
        "seed": 3003,
    },
    "beach": {
        "prompt": (
            "retro chiptune tropical beach theme, 8-bit style, "
            "relaxed Caribbean island melody, gentle waves rhythm, "
            "steel drum feel, peaceful and sunny, "
            "NES-era game music, loopable, no vocals, "
            "medium tempo 110 BPM"
        ),
        "duration": 60.0,
        "seed": 3004,
    },
    "cave": {
        "prompt": (
            "retro chiptune dark cave dungeon theme, 8-bit style, "
            "ominous and tense, deep echoing bass, dripping water rhythm, "
            "mysterious underground exploration, "
            "NES-era game music, loopable, no vocals, "
            "slow tempo 80 BPM"
        ),
        "duration": 60.0,
        "seed": 3005,
    },
    "intro": {
        "prompt": (
            "retro chiptune epic pirate adventure opening theme, 8-bit style, "
            "grand orchestral feel, heroic and cinematic, "
            "building from quiet to dramatic, treasure map discovery, "
            "NES-era game music, no vocals, "
            "medium tempo 100 BPM"
        ),
        "duration": 90.0,
        "seed": 3006,
    },
    "battle": {
        "prompt": (
            "retro chiptune intense battle theme, 8-bit style, "
            "fast-paced sword fight music, urgent and exciting, "
            "pirate duel energy, aggressive drums, "
            "NES-era game music, loopable, no vocals, "
            "fast tempo 150 BPM"
        ),
        "duration": 45.0,
        "seed": 3007,
    },
    "lechuck": {
        "prompt": (
            "retro chiptune villain theme, 8-bit style, "
            "dark menacing ghost pirate boss music, "
            "deep organ-like bass, threatening and powerful, "
            "NES-era game music, loopable, no vocals, "
            "slow heavy tempo 85 BPM"
        ),
        "duration": 60.0,
        "seed": 3008,
    },
}


def load_pipeline():
    """Load ACE-Step pipeline with CPU offload for 16GB VRAM."""
    from acestep.pipeline_ace_step import ACEStepPipeline

    print("[audio] Loading ACE-Step pipeline...")
    pipeline = ACEStepPipeline(
        checkpoint_dir=None,  # auto-download from HuggingFace
        device_id=0,
        dtype="bfloat16",
        cpu_offload=True,  # safe for 16GB VRAM
    )
    print("[audio] Pipeline loaded!")
    return pipeline


def generate_track(pipeline, name: str, config: dict):
    """Generate a single music track."""
    out_dir = OUTPUT_DIR / "music"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{name}.wav"

    print(f"\n{'='*60}")
    print(f"[audio] Generating: {name}")
    print(f"[audio] Duration: {config['duration']}s")
    print(f"[audio] Prompt: {config['prompt'][:80]}...")

    results = pipeline(
        prompt=config["prompt"],
        lyrics="",
        audio_duration=config["duration"],
        infer_step=60,
        guidance_scale=15.0,
        scheduler_type="euler",
        cfg_type="apg",
        task="text2music",
        save_path=str(out_dir),
        format="wav",
        manual_seeds=[config["seed"]],
    )

    # Rename the output file to our desired name
    if results and len(results) > 0:
        generated = Path(results[0])
        if generated.exists():
            generated.rename(out_path)
            print(f"[audio] Saved: {out_path}")
            return out_path
        else:
            print(f"[audio] WARNING: Generated file not found: {generated}")
    else:
        print(f"[audio] WARNING: No results returned")
    return None


def main():
    parser = argparse.ArgumentParser(description="Generate game music with ACE-Step")
    parser.add_argument("--track", type=str, choices=list(TRACKS.keys()),
                        help="Generate a specific track")
    parser.add_argument("--all", action="store_true", help="Generate all tracks")
    parser.add_argument("--list", action="store_true", help="List available tracks")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts only")
    args = parser.parse_args()

    if args.list:
        print("Available tracks:")
        for name, config in TRACKS.items():
            print(f"  {name:12s} ({config['duration']}s) - {config['prompt'][:60]}...")
        return

    tracks = list(TRACKS.keys()) if args.all else ([args.track] if args.track else [])
    if not tracks:
        parser.print_help()
        return

    if args.dry_run:
        for name in tracks:
            config = TRACKS[name]
            print(f"\n[dry-run] {name}:")
            print(f"  duration: {config['duration']}s")
            print(f"  seed: {config['seed']}")
            print(f"  prompt: {config['prompt']}")
        return

    pipeline = load_pipeline()

    generated = 0
    for name in tracks:
        result = generate_track(pipeline, name, TRACKS[name])
        if result:
            generated += 1

    print(f"\n{'='*60}")
    print(f"[done] Generated {generated}/{len(tracks)} tracks")


if __name__ == "__main__":
    main()
