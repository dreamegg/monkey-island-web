#!/usr/bin/env python3
"""
Room Segmentation Tool
======================
Classifies background images into floor / objects / background using
semantic segmentation (Mask2Former on ADE20K panoptic) combined with
the existing depth map for depth-contrast object detection.

Outputs (per room):
  {roomId}_segmentation.json    — structured segment data + floor polygon
  {roomId}_segmentation.png     — color-coded overlay visualization
  {roomId}.json (updated)       — walkArea polygon refined from floor mask

Usage:
    python segment.py --image ../../monkey-island-web/public/assets/backgrounds/harbor.png \\
                      --room-id harbor \\
                      --depth-dir ../../monkey-island-web/public/room-configs

    python segment.py --batch ../../monkey-island-web/public/assets/backgrounds/ \\
                      --depth-dir ../../monkey-island-web/public/room-configs
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# ── ADE20K class classification ────────────────────────────────
# Mask2Former-ADE20K uses 150 panoptic classes.
# We classify each into floor / background / object-candidate.

FLOOR_LABELS = {
    "floor", "floor, flooring", "ground", "earth, ground",
    "land", "road", "sidewalk, pavement", "path", "grass",
    "sand", "rug", "mat", "carpet", "stairway", "stairs",
    "field", "dirt track",
}

BACKGROUND_LABELS = {
    "sky", "wall", "ceiling", "mountain", "hill", "rock",
    "building", "house", "skyscraper", "sea", "water",
    "river", "waterfall", "ocean", "lake", "pond", "pool",
    "tree", "palm, palm tree", "plant", "flower", "bush",
    "fence", "railing", "pillar, column", "arch",
    "curtain", "blind, screen", "windowpane", "window",
}

# Anything not in floor/background and large enough is an object candidate.

# ── Segmentation model loader ───────────────────────────────────

_seg_pipe = None

def load_seg_model(device: str = "cuda"):
    """Load Mask2Former panoptic segmentation pipeline (lazy)."""
    global _seg_pipe
    if _seg_pipe is not None:
        return _seg_pipe

    from transformers import pipeline as hf_pipeline

    device_id = 0 if device == "cuda" else -1
    print("  Loading Mask2Former panoptic segmentation model...")
    _seg_pipe = hf_pipeline(
        "image-segmentation",
        model="facebook/mask2former-swin-tiny-ade-panoptic",
        device=device_id,
    )
    print("  Mask2Former ready.")
    return _seg_pipe


# ── Classification helpers ──────────────────────────────────────

def classify_label(label: str) -> str:
    """Map ADE20K label → 'floor' | 'background' | 'object'."""
    lower = label.lower().strip()
    if lower in FLOOR_LABELS or any(lower.startswith(f) for f in ("floor", "ground", "path")):
        return "floor"
    if lower in BACKGROUND_LABELS:
        return "background"
    return "object"


def mask_to_bbox(mask_arr: np.ndarray) -> dict | None:
    """Bounding box (normalized 0-1) of a binary mask."""
    rows = np.any(mask_arr, axis=1)
    cols = np.any(mask_arr, axis=0)
    if not rows.any():
        return None
    r_min, r_max = np.where(rows)[0][[0, -1]]
    c_min, c_max = np.where(cols)[0][[0, -1]]
    h, w = mask_arr.shape
    return {
        "x": round(float(c_min) / w, 4),
        "y": round(float(r_min) / h, 4),
        "w": round(float(c_max - c_min) / w, 4),
        "h": round(float(r_max - r_min) / h, 4),
    }


def mask_to_bbox_pixels(mask_arr: np.ndarray) -> dict | None:
    """Bounding box in pixel coordinates."""
    rows = np.any(mask_arr, axis=1)
    cols = np.any(mask_arr, axis=0)
    if not rows.any():
        return None
    r_min, r_max = np.where(rows)[0][[0, -1]]
    c_min, c_max = np.where(cols)[0][[0, -1]]
    return {
        "x": int(c_min), "y": int(r_min),
        "w": int(c_max - c_min), "h": int(r_max - r_min),
    }


def mask_centroid(mask_arr: np.ndarray) -> dict:
    h, w = mask_arr.shape
    ys, xs = np.where(mask_arr)
    if len(xs) == 0:
        return {"x": 0.5, "y": 0.5}
    return {
        "x": round(float(xs.mean()) / w, 4),
        "y": round(float(ys.mean()) / h, 4),
    }


def mask_to_polygon(mask_arr: np.ndarray, max_pts: int = 48) -> list[list[float]]:
    """Largest contour of a binary mask → normalized polygon."""
    h, w = mask_arr.shape
    m8 = mask_arr.astype(np.uint8) * 255

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    m8 = cv2.morphologyEx(m8, cv2.MORPH_CLOSE, kernel)
    m8 = cv2.morphologyEx(m8, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(m8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return []

    largest = max(contours, key=cv2.contourArea)
    epsilon = 0.008 * cv2.arcLength(largest, True)
    approx = cv2.approxPolyDP(largest, epsilon, True)

    pts = [[round(float(p[0][0]) / w, 4), round(float(p[0][1]) / h, 4)] for p in approx]
    # Downsample if too many points
    if len(pts) > max_pts:
        step = len(pts) // max_pts
        pts = pts[::step]
    return pts


def merge_floor_masks(masks: list[np.ndarray], image_shape: tuple) -> np.ndarray:
    """Union of all floor masks into one binary array."""
    h, w = image_shape[:2]
    combined = np.zeros((h, w), dtype=np.uint8)
    for m in masks:
        resized = cv2.resize(m.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
        combined = np.maximum(combined, resized)
    return combined


def depth_contrast_at_mask(
    depth: np.ndarray, mask_arr: np.ndarray, pad: int = 8
) -> float:
    """Mean absolute depth difference between mask pixels and surrounding ring."""
    if mask_arr.sum() == 0:
        return 0.0

    dh, dw = depth.shape
    mh, mw = mask_arr.shape
    if dh != mh or dw != mw:
        mask_r = cv2.resize(mask_arr.astype(np.uint8), (dw, dh), interpolation=cv2.INTER_NEAREST).astype(bool)
    else:
        mask_r = mask_arr.astype(bool)

    kernel = np.ones((pad * 2 + 1, pad * 2 + 1), np.uint8)
    dilated = cv2.dilate(mask_r.astype(np.uint8), kernel) > 0
    ring = dilated & ~mask_r

    mask_depth = float(depth[mask_r].mean()) if mask_r.any() else 0.5
    ring_depth = float(depth[ring].mean()) if ring.any() else mask_depth
    return round(abs(mask_depth - ring_depth), 4)


# ── Main segmentation pipeline ──────────────────────────────────

def segment_room(
    pipe,
    image_path: str,
    room_id: str,
    output_dir: Path,
    depth: np.ndarray | None = None,
) -> dict:
    """Run full segmentation pipeline for one room background."""
    print(f"\n  Segmenting: {room_id}")

    image = Image.open(image_path).convert("RGB")
    img_w, img_h = image.size
    img_arr = np.array(image)

    # ── Run Mask2Former ──────────────────────────────────────────
    print("    Running Mask2Former...")
    results = pipe(image)
    print(f"    Got {len(results)} segments")

    floor_masks: list[np.ndarray] = []
    object_segments: list[dict] = []
    background_segments: list[dict] = []
    stats = {"total": len(results), "floor": 0, "object": 0, "background": 0, "discarded": 0}

    for i, seg in enumerate(results):
        label = seg.get("label", "unknown")
        score = float(seg.get("score", 1.0))
        mask_pil = seg.get("mask")
        if mask_pil is None:
            stats["discarded"] += 1
            continue

        mask_arr = np.array(mask_pil, dtype=bool)
        # Resize to image dims if needed
        if mask_arr.shape != (img_h, img_w):
            mask_arr = cv2.resize(
                mask_arr.astype(np.uint8), (img_w, img_h), interpolation=cv2.INTER_NEAREST
            ).astype(bool)

        area_pct = round(float(mask_arr.sum()) / (img_h * img_w) * 100, 3)

        # Discard tiny segments
        if area_pct < 0.05:
            stats["discarded"] += 1
            continue

        kind = classify_label(label)
        bbox = mask_to_bbox(mask_arr)
        centroid = mask_centroid(mask_arr)

        # Depth info
        mean_depth = 0.5
        depth_contrast = 0.0
        if depth is not None:
            mask_d = cv2.resize(mask_arr.astype(np.uint8), (depth.shape[1], depth.shape[0]),
                                interpolation=cv2.INTER_NEAREST).astype(bool)
            if mask_d.any():
                mean_depth = round(float(depth[mask_d].mean()), 4)
            depth_contrast = depth_contrast_at_mask(depth, mask_arr)

        if kind == "floor":
            floor_masks.append(mask_arr)
            stats["floor"] += 1

        elif kind == "background":
            background_segments.append({
                "segmentId": i, "label": label,
                "score": round(score, 3), "areaPct": area_pct,
                "bbox": bbox, "centroid": centroid,
            })
            stats["background"] += 1

        else:  # object candidate
            bbox_px = mask_to_bbox_pixels(mask_arr)
            object_segments.append({
                "segmentId": i,
                "label": label,
                "score": round(score, 3),
                "areaPct": area_pct,
                "bbox": bbox,
                "bboxPixels": bbox_px,
                "centroid": centroid,
                "meanDepth": mean_depth,
                "depthContrast": depth_contrast,
                "confidence": round(min(1.0, score * (1 + depth_contrast * 2)), 3),
            })
            stats["object"] += 1

    # Sort objects by confidence desc
    object_segments.sort(key=lambda x: x["confidence"], reverse=True)

    # ── Floor polygon ────────────────────────────────────────────
    floor_polygon: list[list[float]] = []
    floor_mask_path = ""

    if floor_masks:
        combined_floor = merge_floor_masks(floor_masks, (img_h, img_w))
        floor_polygon = mask_to_polygon(combined_floor)
        print(f"    Floor polygon: {len(floor_polygon)} vertices")

        # Save floor mask as PNG for DevTools overlay
        floor_mask_filename = f"{room_id}_floor_mask.png"
        floor_vis = (combined_floor * 255).astype(np.uint8)
        Image.fromarray(floor_vis).save(str(output_dir / floor_mask_filename))
        floor_mask_path = f"/room-configs/{floor_mask_filename}"
    else:
        print("    No floor segments detected — using depth fallback")

    # ── Segmentation visualization ───────────────────────────────
    seg_vis = img_arr.copy()
    overlay = seg_vis.copy()

    # Floor: teal fill
    if floor_masks:
        combined_floor_vis = merge_floor_masks(floor_masks, (img_h, img_w))
        floor_layer = np.zeros_like(seg_vis)
        floor_layer[combined_floor_vis.astype(bool)] = [0, 200, 180]
        overlay = cv2.addWeighted(overlay, 0.65, floor_layer, 0.35, 0)

    # Background: dark blue tint
    for bseg in background_segments:
        # We don't have per-segment mask here, skip visual per-bg
        pass

    # Objects: orange bboxes
    colors = [(255, 140, 0), (255, 80, 80), (255, 200, 0), (180, 255, 0),
              (255, 0, 200), (0, 200, 255), (200, 100, 255), (255, 180, 100)]
    for j, oseg in enumerate(object_segments[:12]):
        bbox = oseg["bbox"]
        if not bbox:
            continue
        color = colors[j % len(colors)]
        x1 = int(bbox["x"] * img_w)
        y1 = int(bbox["y"] * img_h)
        x2 = int((bbox["x"] + bbox["w"]) * img_w)
        y2 = int((bbox["y"] + bbox["h"]) * img_h)
        thickness = 3 if oseg["confidence"] >= 0.5 else 1
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, thickness)
        label_text = f"{oseg['label'][:12]} {oseg['confidence']:.2f}"
        cv2.putText(overlay, label_text, (x1, max(y1 - 4, 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

    # Floor polygon outline
    if floor_polygon:
        pts = np.array([[int(p[0] * img_w), int(p[1] * img_h)] for p in floor_polygon], np.int32)
        cv2.polylines(overlay, [pts], True, (0, 255, 200), 2)

    seg_vis_filename = f"{room_id}_segmentation.png"
    cv2.imwrite(str(output_dir / seg_vis_filename), cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
    print(f"    Saved: {seg_vis_filename}")

    # ── Build output JSON ────────────────────────────────────────
    seg_data = {
        "roomId": room_id,
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "floorPolygon": floor_polygon,
        "floorMaskPath": floor_mask_path,
        "objects": object_segments,
        "backgroundRegions": background_segments,
        "stats": stats,
    }

    seg_path = output_dir / f"{room_id}_segmentation.json"
    with open(seg_path, "w", encoding="utf-8") as f:
        json.dump(seg_data, f, indent=2, ensure_ascii=False)
    print(f"    Saved: {seg_path.name}")

    # ── Update room config with improved walk area ───────────────
    room_config_path = output_dir / f"{room_id}.json"
    if room_config_path.exists() and floor_polygon:
        with open(room_config_path, encoding="utf-8") as f:
            room_config = json.load(f)

        room_config["walkAreaDepth"] = room_config.get("walkArea", [])
        room_config["walkAreaSegmentation"] = floor_polygon

        # Merged walk area: intersection approximated by taking segmentation polygon
        # clipped to the vertical range of the depth-based polygon.
        depth_poly = room_config.get("walkAreaDepth", [])
        merged = merge_walk_polygons(depth_poly, floor_polygon, img_h, img_w)
        room_config["walkArea"] = merged
        room_config["walkAreaSource"] = "merged"

        with open(room_config_path, "w", encoding="utf-8") as f:
            json.dump(room_config, f, indent=2, ensure_ascii=False)
        print(f"    Updated walk area in {room_id}.json (source: merged)")

    return seg_data


# ── Polygon merge: intersection approximation ───────────────────

def merge_walk_polygons(
    depth_poly: list,
    seg_poly: list,
    img_h: int,
    img_w: int,
) -> list:
    """Approximate intersection of two polygons via rasterization + contour extraction."""
    if not depth_poly or not seg_poly:
        return seg_poly or depth_poly

    # Rasterize both polygons
    def poly_to_mask(poly):
        mask = np.zeros((img_h, img_w), dtype=np.uint8)
        pts = np.array([[int(p[0] * img_w), int(p[1] * img_h)] for p in poly], np.int32)
        if len(pts) >= 3:
            cv2.fillPoly(mask, [pts], 255)
        return mask

    m1 = poly_to_mask(depth_poly)
    m2 = poly_to_mask(seg_poly)
    intersection = cv2.bitwise_and(m1, m2)

    # Fall back to union if intersection is too small (<20% of smaller mask)
    smaller_area = min(m1.sum(), m2.sum())
    if intersection.sum() < smaller_area * 0.2:
        print("    Walk area merge: using union (intersection too small)")
        intersection = cv2.bitwise_or(m1, m2)

    polygon = mask_to_polygon(intersection)
    return polygon if polygon else (seg_poly or depth_poly)


# ── CLI ─────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Segment room backgrounds into floor/objects/background")
    parser.add_argument("--image", help="Single background image")
    parser.add_argument("--room-id", help="Room ID (default: filename stem)")
    parser.add_argument("--batch", help="Directory of PNGs to batch-process")
    parser.add_argument(
        "--output", "-o",
        default="../../monkey-island-web/public/room-configs",
        help="Output directory (default: public/room-configs)",
    )
    parser.add_argument(
        "--depth-dir",
        help="Directory containing existing depth maps (default: same as --output)",
    )
    parser.add_argument(
        "--device", default="cuda", choices=["cuda", "cpu", "mps"],
        help="Inference device (default: cuda)",
    )
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    depth_dir = Path(args.depth_dir) if args.depth_dir else output_dir

    pipe = load_seg_model(args.device)

    def load_depth(room_id: str) -> np.ndarray | None:
        depth_path = depth_dir / f"{room_id}_depth.png"
        if not depth_path.exists():
            return None
        d = np.array(Image.open(depth_path).convert("L"), dtype=np.float32) / 255.0
        return d

    if args.batch:
        batch_dir = Path(args.batch)
        images = sorted(batch_dir.glob("*.png"))
        if not images:
            print(f"No PNG files found in {batch_dir}")
            sys.exit(1)
        for img_path in images:
            rid = img_path.stem
            depth = load_depth(rid)
            segment_room(pipe, str(img_path), rid, output_dir, depth)
        print(f"\nDone — {len(images)} rooms segmented → {output_dir}")

    elif args.image:
        rid = args.room_id or Path(args.image).stem
        depth = load_depth(rid)
        segment_room(pipe, args.image, rid, output_dir, depth)
        print("\nDone.")

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
