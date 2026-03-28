#!/usr/bin/env python3
"""
Room Depth Analyzer for Monkey Island Web Engine

Analyzes background images using AI depth estimation (Depth Anything V2)
to automatically generate:
  1. Depth map PNG for runtime perspective scaling
  2. Walk area polygon (walkable ground regions)
  3. Room configuration JSON

Usage:
    # Single image
    python analyze.py --image ../../monkey-island-web/public/assets/backgrounds/harbor.png --room-id harbor

    # All backgrounds in a directory (batch)
    python analyze.py --batch ../../monkey-island-web/public/assets/backgrounds/

    # Custom output directory
    python analyze.py --batch ... --output ./output/

    # Use CPU if no GPU available
    python analyze.py --batch ... --device cpu
"""

import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def load_depth_model(device: str = "cuda"):
    """Load Depth Anything V2 Small model."""
    from transformers import pipeline

    print(f"Loading Depth Anything V2 model (device={device})...")
    return pipeline(
        "depth-estimation",
        model="depth-anything/Depth-Anything-V2-Small-hf",
        device=0 if device == "cuda" else -1,
    )


def estimate_depth(pipe, image_path: str) -> np.ndarray:
    """Run monocular depth estimation. Returns normalized depth (0=far, 1=near)."""
    image = Image.open(image_path).convert("RGB")
    result = pipe(image)
    depth = np.array(result["depth"], dtype=np.float32)

    d_min, d_max = depth.min(), depth.max()
    if d_max - d_min > 1e-6:
        depth = (depth - d_min) / (d_max - d_min)
    else:
        depth = np.full_like(depth, 0.5)
    return depth


def extract_walk_area(
    depth: np.ndarray, threshold_pct: float = 55
) -> list[list[float]]:
    """Extract walkable area polygon from depth map.

    Ground/walkable surfaces are typically the nearest depth regions.
    We threshold, clean up, then extract the largest contour as a polygon.
    """
    h, w = depth.shape
    threshold = np.percentile(depth, threshold_pct)
    walk_mask = (depth > threshold).astype(np.uint8) * 255

    # Morphological cleanup — remove noise and fill holes
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    walk_mask = cv2.morphologyEx(walk_mask, cv2.MORPH_CLOSE, kernel)
    walk_mask = cv2.morphologyEx(walk_mask, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(
        walk_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        return [[0.0, 0.7], [1.0, 0.7], [1.0, 1.0], [0.0, 1.0]]

    largest = max(contours, key=cv2.contourArea)
    epsilon = 0.012 * cv2.arcLength(largest, True)
    approx = cv2.approxPolyDP(largest, epsilon, True)

    polygon = [
        [round(float(p[0][0]) / w, 4), round(float(p[0][1]) / h, 4)]
        for p in approx
    ]
    return polygon


def compute_depth_config(depth: np.ndarray, walk_polygon: list) -> dict:
    """Derive perspective scaling parameters from the depth map."""
    h, w = depth.shape

    walk_ys = [p[1] for p in walk_polygon]
    min_walk_y = min(walk_ys)
    max_walk_y = max(walk_ys)

    far_row = max(0, int(min_walk_y * h))
    near_row = min(int(max_walk_y * h), h - 1)

    # Average depth at far vs near edges of walk area
    far_band = depth[max(far_row - 3, 0) : far_row + 4, :]
    near_band = depth[max(near_row - 3, 0) : near_row + 4, :]
    far_depth = float(np.mean(far_band)) if far_band.size else 0.3
    near_depth = float(np.mean(near_band)) if near_band.size else 0.8

    depth_range = abs(near_depth - far_depth)

    # Scale factors tuned for pixel-art adventure games
    if depth_range > 0.1:
        near_scale = round(1.4 + depth_range * 0.8, 2)
        far_scale = round(max(0.3, 0.65 - depth_range * 0.4), 2)
    else:
        # Flat/indoor scene — minimal perspective
        near_scale = 1.2
        far_scale = 0.85

    return {
        "horizonY": round(float(min_walk_y), 3),
        "nearY": round(float(max_walk_y), 3),
        "nearScale": near_scale,
        "farScale": far_scale,
        "walkThreshold": round(float(np.percentile(depth, 55)), 3),
    }


def save_depth_map(depth: np.ndarray, path: str, downscale: int = 4):
    """Save a small grayscale depth map PNG for runtime sampling."""
    h, w = depth.shape
    depth_u8 = (depth * 255).astype(np.uint8)
    small = cv2.resize(
        depth_u8, (w // downscale, h // downscale), interpolation=cv2.INTER_AREA
    )
    Image.fromarray(small).save(path)


def save_debug_image(
    image_path: str,
    depth: np.ndarray,
    walk_polygon: list,
    config: dict,
    output_path: str,
):
    """Visualisation: depth heatmap + walk polygon + scale markers."""
    original = cv2.imread(image_path)
    h, w = original.shape[:2]

    dh, dw = depth.shape
    depth_resized = cv2.resize(depth, (w, h), interpolation=cv2.INTER_LINEAR)
    depth_colored = cv2.applyColorMap(
        (depth_resized * 255).astype(np.uint8), cv2.COLORMAP_INFERNO
    )

    overlay = cv2.addWeighted(original, 0.35, depth_colored, 0.65, 0)

    # Walk polygon — green outline + translucent fill
    pts = np.array(
        [[int(p[0] * w), int(p[1] * h)] for p in walk_polygon], np.int32
    )
    fill_layer = overlay.copy()
    cv2.fillPoly(fill_layer, [pts], (0, 200, 0))
    overlay = cv2.addWeighted(overlay, 0.7, fill_layer, 0.3, 0)
    cv2.polylines(overlay, [pts], True, (0, 255, 0), 2)

    # Draw scale markers along center vertical
    dc = config["depthConfig"]
    for frac in [0.0, 0.25, 0.5, 0.75, 1.0]:
        y_norm = dc["horizonY"] + frac * (dc["nearY"] - dc["horizonY"])
        scale = dc["farScale"] + frac * (dc["nearScale"] - dc["farScale"])
        py = int(y_norm * h)
        cv2.line(overlay, (0, py), (w, py), (255, 255, 0), 1)
        cv2.putText(
            overlay,
            f"scale={scale:.2f}",
            (10, py - 4),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 0),
            1,
        )

    cv2.imwrite(output_path, overlay)


def analyze_room(
    pipe, image_path: str, room_id: str, output_dir: Path,
    with_segmentation: bool = False, device: str = "cuda",
) -> dict:
    """Full analysis pipeline for one room background."""
    print(f"\n{'='*50}")
    print(f"  Analyzing: {room_id}")
    print(f"  Source:    {image_path}")
    print(f"{'='*50}")

    depth = estimate_depth(pipe, image_path)
    print(f"  Depth map shape: {depth.shape}")

    walk_polygon = extract_walk_area(depth)
    print(f"  Walk area vertices: {len(walk_polygon)}")

    depth_config = compute_depth_config(depth, walk_polygon)
    print(
        f"  Scale range: {depth_config['farScale']} (far) → {depth_config['nearScale']} (near)"
    )
    print(
        f"  Horizon Y: {depth_config['horizonY']}, Near Y: {depth_config['nearY']}"
    )

    # Save depth map (small, for runtime)
    depth_map_filename = f"{room_id}_depth.png"
    save_depth_map(depth, str(output_dir / depth_map_filename))
    print(f"  Saved: {depth_map_filename}")

    # Save debug visualisation
    debug_filename = f"{room_id}_debug.png"
    config_preview = {"depthConfig": depth_config}
    save_debug_image(
        image_path, depth, walk_polygon, config_preview, str(output_dir / debug_filename)
    )
    print(f"  Saved: {debug_filename}")

    # Build room config
    config = {
        "roomId": room_id,
        "depthConfig": depth_config,
        "walkArea": walk_polygon,
        "depthMapPath": f"/room-configs/{depth_map_filename}",
    }

    config_path = output_dir / f"{room_id}.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"  Saved: {config_path.name}")

    # Optional segmentation pass
    if with_segmentation:
        try:
            from segment import load_seg_model, segment_room
            seg_pipe = load_seg_model(device)
            segment_room(seg_pipe, image_path, room_id, output_dir, depth)
        except Exception as e:
            print(f"  [warn] Segmentation failed: {e}")

    return config


def main():
    parser = argparse.ArgumentParser(
        description="Analyze room backgrounds for depth & perspective"
    )
    parser.add_argument("--image", help="Single background image to analyze")
    parser.add_argument("--room-id", help="Room ID (default: filename stem)")
    parser.add_argument("--batch", help="Directory of PNGs to batch-process")
    parser.add_argument(
        "--output",
        "-o",
        default="../../monkey-island-web/public/room-configs",
        help="Output directory (default: public/room-configs)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=55,
        help="Walk area depth percentile threshold (default: 55)",
    )
    parser.add_argument(
        "--device",
        default="cuda",
        choices=["cuda", "cpu", "mps"],
        help="Inference device (default: cuda)",
    )
    parser.add_argument(
        "--with-segmentation",
        action="store_true",
        help="Also run semantic segmentation after depth analysis",
    )
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    pipe = load_depth_model(args.device)

    if args.batch:
        batch_dir = Path(args.batch)
        images = sorted(batch_dir.glob("*.png"))
        if not images:
            print(f"No PNG files found in {batch_dir}")
            sys.exit(1)

        configs = []
        for img_path in images:
            rid = img_path.stem
            cfg = analyze_room(pipe, str(img_path), rid, output_dir,
                               with_segmentation=args.with_segmentation,
                               device=args.device)
            configs.append(cfg)

        # Combined index file
        combined = output_dir / "all_rooms.json"
        with open(combined, "w", encoding="utf-8") as f:
            json.dump(configs, f, indent=2, ensure_ascii=False)

        print(f"\nDone — {len(configs)} rooms processed → {output_dir}")

    elif args.image:
        rid = args.room_id or Path(args.image).stem
        analyze_room(pipe, args.image, rid, output_dir,
                     with_segmentation=args.with_segmentation,
                     device=args.device)
        print("\nDone.")

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
