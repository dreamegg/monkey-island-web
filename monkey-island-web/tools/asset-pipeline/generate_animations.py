#!/usr/bin/env python3
"""Generate character walk cycle animation frames using FLUX.1-dev."""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from generate import generate_single

# Guybrush walk cycle: idle + 4 walk frames (right-facing, engine mirrors for left)
FRAMES = {
    "guybrush_idle": {
        "seed": 2100,
        "desc": (
            "young lanky blonde pirate hero, wearing red long-sleeved shirt, "
            "blue baggy pants, brown leather boots, transparent white background, "
            "single character centered, full body visible, side view facing right, "
            "standing still relaxed pose, arms at sides, weight on both feet"
        ),
    },
    "guybrush_walk1": {
        "seed": 2101,
        "desc": (
            "young lanky blonde pirate hero, wearing red long-sleeved shirt, "
            "blue baggy pants, brown leather boots, transparent white background, "
            "single character centered, full body visible, side view facing right, "
            "walking pose right foot forward, left arm forward right arm back, mid-stride"
        ),
    },
    "guybrush_walk2": {
        "seed": 2102,
        "desc": (
            "young lanky blonde pirate hero, wearing red long-sleeved shirt, "
            "blue baggy pants, brown leather boots, transparent white background, "
            "single character centered, full body visible, side view facing right, "
            "walking pose legs together passing position, arms at center"
        ),
    },
    "guybrush_walk3": {
        "seed": 2103,
        "desc": (
            "young lanky blonde pirate hero, wearing red long-sleeved shirt, "
            "blue baggy pants, brown leather boots, transparent white background, "
            "single character centered, full body visible, side view facing right, "
            "walking pose left foot forward, right arm forward left arm back, mid-stride"
        ),
    },
    "guybrush_walk4": {
        "seed": 2104,
        "desc": (
            "young lanky blonde pirate hero, wearing red long-sleeved shirt, "
            "blue baggy pants, brown leather boots, transparent white background, "
            "single character centered, full body visible, side view facing right, "
            "walking pose legs wide apart, arms swinging, full extension stride"
        ),
    },
    # LeChuck - ghost pirate floating animation
    "lechuck_idle": {
        "seed": 2200,
        "desc": (
            "ghost pirate captain, glowing ethereal blue-green aura, large tattered "
            "pirate coat, massive black beard of shadow, glowing red eyes, "
            "transparent white background, single character centered, full body, "
            "side view facing right, menacing stance floating slightly"
        ),
    },
    "lechuck_walk1": {
        "seed": 2201,
        "desc": (
            "ghost pirate captain, glowing ethereal blue-green aura, large tattered "
            "pirate coat, massive black beard of shadow, glowing red eyes, "
            "transparent white background, single character centered, full body, "
            "side view facing right, floating forward right arm reaching, cape trailing"
        ),
    },
    "lechuck_walk2": {
        "seed": 2202,
        "desc": (
            "ghost pirate captain, glowing ethereal blue-green aura, large tattered "
            "pirate coat, massive black beard of shadow, glowing red eyes, "
            "transparent white background, single character centered, full body, "
            "side view facing right, floating forward arms at sides, ethereal trail"
        ),
    },
    # Elaine walk cycle
    "elaine_idle": {
        "seed": 2300,
        "desc": (
            "confident female governor, auburn hair, elegant blue dress with gold trim, "
            "cape, boots, transparent white background, single character centered, "
            "full body visible, side view facing right, confident standing pose hands on hips"
        ),
    },
    "elaine_walk1": {
        "seed": 2301,
        "desc": (
            "confident female governor, auburn hair, elegant blue dress with gold trim, "
            "cape, boots, transparent white background, single character centered, "
            "full body visible, side view facing right, walking right foot forward mid-stride"
        ),
    },
    "elaine_walk2": {
        "seed": 2302,
        "desc": (
            "confident female governor, auburn hair, elegant blue dress with gold trim, "
            "cape, boots, transparent white background, single character centered, "
            "full body visible, side view facing right, walking left foot forward mid-stride"
        ),
    },
}


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--character", default="all", choices=["guybrush", "lechuck", "elaine", "all"])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    frames_to_gen = {}
    for name, data in FRAMES.items():
        if args.character == "all" or name.startswith(args.character):
            frames_to_gen[name] = data

    print(f"[anim] Will generate {len(frames_to_gen)} frames")
    total = 0

    for name, data in frames_to_gen.items():
        print(f"\n{'='*60}")
        print(f"[anim] Generating: {name}")
        result = generate_single(
            asset_type="character",
            name=name,
            description=data["desc"],
            seed=data["seed"],
            dry_run=args.dry_run,
            skip_process=True,
        )
        print(f"[anim] -> {result}")
        total += 1

    print(f"\n{'='*60}")
    print(f"[done] Generated {total} animation frames")


if __name__ == "__main__":
    main()
