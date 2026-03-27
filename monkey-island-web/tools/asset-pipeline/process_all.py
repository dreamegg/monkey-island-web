#!/usr/bin/env python3
"""Process all raw assets into final game-ready images."""
from pathlib import Path
from process import process_asset

BASE = Path(__file__).resolve().parent.parent.parent / "src" / "assets"

TYPES = {
    "backgrounds": {"target_size": (320, 200), "palette_colors": 32, "transparent": False, "upscale": 2},
    "sprites":     {"target_size": (32, 48),   "palette_colors": 16, "transparent": True,  "upscale": 2},
    "objects":     {"target_size": (32, 32),   "palette_colors": 16, "transparent": True,  "upscale": 2},
    "portraits":   {"target_size": (64, 64),   "palette_colors": 16, "transparent": False, "upscale": 2},
    "inventory":   {"target_size": (24, 24),   "palette_colors": 16, "transparent": True,  "upscale": 2},
}

total = 0
for subdir, config in TYPES.items():
    raw_dir = BASE / subdir / "raw"
    out_dir = BASE / subdir
    if not raw_dir.exists():
        print(f"[skip] {subdir}/raw/ not found")
        continue
    for png in sorted(raw_dir.glob("*.png")):
        out_path = out_dir / png.name
        print(f"\n--- {subdir}/{png.name} ---")
        process_asset(str(png), output_path=str(out_path), **config)
        total += 1

print(f"\n=== Done! Processed {total} assets ===")
