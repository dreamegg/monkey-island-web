#!/usr/bin/env python3
"""
Room Builder — unified analysis pipeline
=========================================
background image → depth map + segmentation + Claude Vision → complete game room JSON

Outputs (per room):
  public/room-configs/{roomId}.json        — depth config + walk area polygon
  public/room-configs/{roomId}_depth.png   — depth map for runtime scaling
  public/room-configs/{roomId}_debug.png   — depth + walk area visualization
  public/rooms/{roomId}.json               — game room (objects, exits, npcs)

Usage:
    # Single image with Claude Vision object identification
    python room_builder.py \\
        --image ../../monkey-island-web/public/assets/backgrounds/harbor.png \\
        --room-id harbor --room-name "항구" \\
        --context "A Caribbean harbor with docks, ships and pirate activity"

    # Batch: all PNGs in a directory
    python room_builder.py \\
        --batch ../../monkey-island-web/public/assets/backgrounds/ \\
        --room-names "harbor:항구,tavern:술집,forest:숲"

    # Depth + segmentation only (no Claude Vision — no API key needed)
    python room_builder.py --image ... --skip-claude

    # Depth only (fastest)
    python room_builder.py --image ... --skip-segmentation --skip-claude

Requirements:
    pip install anthropic torch transformers opencv-python pillow numpy
    export ANTHROPIC_API_KEY=sk-ant-...
"""

import argparse
import base64
import json
import os
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# ── Game engine constants ─────────────────────────────────────────
CANVAS_W = 1600
CANVAS_H = 800

# ── Claude Vision system prompt ───────────────────────────────────

OBJECT_SYSTEM = """\
당신은 한국어 SCUMM 스타일 어드벤처 게임(원숭이 섬 스타일)의 게임 디자이너입니다.

배경 이미지와 AI 세그멘테이션으로 감지된 오브젝트 목록이 제공됩니다.
이미지에서 실제로 보이며 상호작용 가능한 오브젝트들을 게임 오브젝트로 변환해주세요.

각 유효한 오브젝트에 대해 다음 JSON 형식을 사용하세요:

{
  "id": "snake_case_english_id",
  "name": "한국어 표시 이름",
  "x": 0.5,      // 정규화된 중심 X (0.0-1.0), 세그멘테이션 centroid 사용
  "y": 0.65,     // 정규화된 중심 Y (0.0-1.0), 세그멘테이션 centroid 사용
  "w": 80,       // 픽셀 너비 = bbox.w * 1600 (최소 40)
  "h": 80,       // 픽셀 높이 = bbox.h * 800  (최소 40)
  "pickable": false,
  "item": null,  // pickable이면: {"id": "item_id", "name": "한국어", "icon": "이모지"}
  "actions": {
    "look": "한국어 외관 설명 (1-2 문장)",
    // pick_up: pickable 오브젝트에만
    // "pick_up": [
    //   {"cmd": "give_item", "id": "item_id", "name": "한국어", "icon": "이모지"},
    //   {"cmd": "hide_object", "id": "object_id"}
    // ],
    // use: 상호작용 가능한 오브젝트에 (문자열 또는 script 배열)
    // "use": "한국어 사용 반응"
  }
}

규칙:
- 오브젝트 id와 item id: 영어 snake_case만 사용 (예: wooden_barrel, old_rope)
- 모든 name/text 값은 자연스러운 한국어여야 합니다
- 배경 요소(하늘, 벽, 바닥, 물 등)는 건너뛰세요 — 단, 상호작용 가능한 경우 제외
- look 액션은 항상 포함
- 들고 다닐 수 있는 아이템에만 pick_up 포함 (item 필드도 함께)
- 작동시킬 수 있는 오브젝트에만 use 포함
- 가장 흥미롭고 상호작용 가능한 오브젝트 최대 8개로 제한
- 오브젝트가 전혀 없으면 빈 배열 [] 반환
- JSON 배열만 출력하세요. 마크다운 없이, 설명 없이.
"""


# ── Image encoding ────────────────────────────────────────────────

def encode_image_base64(image_path: str) -> tuple[str, str]:
    """Encode image file as base64 string for Claude Vision API."""
    suffix = Path(image_path).suffix.lower()
    media_map = {".png": "image/png", ".jpg": "image/jpeg",
                 ".jpeg": "image/jpeg", ".webp": "image/webp"}
    media_type = media_map.get(suffix, "image/png")
    with open(image_path, "rb") as f:
        data = base64.standard_b64encode(f.read()).decode("utf-8")
    return data, media_type


# ── Claude Vision call ────────────────────────────────────────────

def generate_game_objects(
    client,
    image_path: str,
    seg_objects: list[dict],
    room_context: str = "",
    room_id: str = "",
) -> list[dict]:
    """Send image + segmentation results to Claude Vision, get Korean game objects."""
    print("    → Claude Vision: identifying game objects...")

    image_data, media_type = encode_image_base64(image_path)

    # Build concise segmentation summary (top 20 candidates by confidence)
    seg_summary = [
        {
            "label": o["label"],
            "score": round(o.get("score", 0), 3),
            "confidence": round(o.get("confidence", 0), 3),
            "centroid": o.get("centroid", {}),
            "bbox": o.get("bbox", {}),
            "areaPct": round(o.get("areaPct", 0), 2),
            "meanDepth": round(o.get("meanDepth", 0.5), 3),
        }
        for o in seg_objects[:20]
    ]

    context_prefix = ""
    if room_context:
        context_prefix = f"방 설명: {room_context}\n방 ID: {room_id}\n\n"

    user_content = []
    if context_prefix:
        user_content.append({"type": "text", "text": context_prefix})

    user_content.append({
        "type": "image",
        "source": {"type": "base64", "media_type": media_type, "data": image_data},
    })

    if seg_summary:
        user_content.append({
            "type": "text",
            "text": (
                f"감지된 세그멘테이션 오브젝트 ({len(seg_summary)}개):\n"
                f"{json.dumps(seg_summary, ensure_ascii=False, indent=2)}\n\n"
                "위 이미지에서 보이는 상호작용 가능한 오브젝트들을 게임 JSON 배열로 출력하세요.\n"
                "각 오브젝트의 x, y 좌표는 세그멘테이션 centroid를 사용하고,\n"
                "w = bbox.w * 1600, h = bbox.h * 800 으로 계산하세요 (최소 40).\n"
                "JSON 배열만 출력 (마크다운 없이)."
            ),
        })
    else:
        # No segmentation data — ask Claude to identify objects directly from the image
        user_content.append({
            "type": "text",
            "text": (
                "이 이미지를 직접 분석하여 어드벤처 게임에서 상호작용할 수 있는 오브젝트들을 찾아주세요.\n"
                "각 오브젝트의 위치를 이미지 내 상대적 위치(0.0-1.0)로 추정하세요.\n"
                "크기는 오브젝트의 시각적 크기에 맞게 픽셀 단위로 추정하세요 (w: 40-400, h: 40-400).\n"
                "JSON 배열만 출력 (마크다운 없이)."
            ),
        })

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        system=OBJECT_SYSTEM,
        messages=[{"role": "user", "content": user_content}],
    )

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0].strip()

    try:
        objects = json.loads(text)
        if isinstance(objects, list):
            print(f"    → Identified {len(objects)} game objects")
            return objects
        return []
    except json.JSONDecodeError as e:
        print(f"    [warn] JSON parse failed: {e}")
        print(f"    Raw response (first 300 chars): {text[:300]}")
        return []


# ── Fallback: segmentation → raw game objects ────────────────────

def seg_to_raw_objects(seg_objects: list[dict]) -> list[dict]:
    """Convert segmentation results to raw (English-labeled) game objects."""
    raw = []
    for obj in seg_objects[:8]:
        label = obj["label"]
        c = obj.get("centroid", {"x": 0.5, "y": 0.65})
        bbox = obj.get("bbox", {"w": 0.05, "h": 0.05})
        obj_id = label.replace(" ", "_").replace(",", "").lower()[:24]
        w = max(40, int(bbox.get("w", 0.05) * CANVAS_W))
        h = max(40, int(bbox.get("h", 0.05) * CANVAS_H))
        raw.append({
            "id": obj_id,
            "name": label,
            "x": round(float(c.get("x", 0.5)), 4),
            "y": round(float(c.get("y", 0.65)), 4),
            "w": w,
            "h": h,
            "pickable": False,
            "actions": {"look": f"A {label}."},
        })
    return raw


# ── Room JSON builder ─────────────────────────────────────────────

def build_room_json(
    room_id: str,
    room_name: str,
    game_objects: list[dict],
    walk_polygon: list[list[float]],
) -> dict:
    """Build the room JSON for the game engine from Claude Vision output."""
    # Convert polygon to rect bounding box (game engine rect fallback)
    if walk_polygon and len(walk_polygon) >= 3:
        xs = [p[0] for p in walk_polygon]
        ys = [p[1] for p in walk_polygon]
        walk_rect = {
            "x1": round(min(xs), 3),
            "y1": round(min(ys), 3),
            "x2": round(max(xs), 3),
            "y2": round(max(ys), 3),
        }
    else:
        walk_rect = {"x1": 0.0, "y1": 0.60, "x2": 1.0, "y2": 0.95}

    objects = []
    for raw in game_objects:
        game_obj: dict = {
            "id": raw["id"],
            "name": raw["name"],
            "x": round(float(raw.get("x", 0.5)), 4),
            "y": round(float(raw.get("y", 0.65)), 4),
            "w": max(40, int(raw.get("w", 80))),
            "h": max(40, int(raw.get("h", 80))),
            "actions": raw.get("actions", {"look": "별다른 특징이 없다."}),
        }
        if raw.get("item"):
            game_obj["item"] = raw["item"]
        objects.append(game_obj)

    return {
        "id": room_id,
        "name": room_name,
        "walkArea": walk_rect,
        "objects": objects,
        "exits": [],
        "npcs": [],
    }


# ── Full pipeline for one room ────────────────────────────────────

def build_room_from_image(
    image_path: str,
    room_id: str,
    room_name: str,
    output_dir: Path,
    rooms_dir: Path,
    depth_pipe=None,
    seg_pipe=None,
    client=None,
    room_context: str = "",
    threshold: float = 55.0,
) -> dict:
    """Full pipeline: one background image → depth config + room JSON."""
    print(f"\n{'='*60}")
    print(f"  Room:  {room_id} ({room_name})")
    print(f"  Image: {image_path}")
    print(f"{'='*60}")

    from analyze import (
        estimate_depth, extract_walk_area, compute_depth_config,
        save_depth_map, save_debug_image,
    )

    # ── 1. Depth estimation ───────────────────────────────────────
    print("  [1/4] Depth estimation...")
    depth = estimate_depth(depth_pipe, image_path)
    walk_polygon = extract_walk_area(depth, threshold)
    depth_config = compute_depth_config(depth, walk_polygon)
    print(f"    Horizon Y: {depth_config['horizonY']:.3f}  "
          f"Scale: {depth_config['farScale']} → {depth_config['nearScale']}")

    depth_map_filename = f"{room_id}_depth.png"
    save_depth_map(depth, str(output_dir / depth_map_filename))

    room_config: dict = {
        "roomId": room_id,
        "depthConfig": depth_config,
        "walkArea": walk_polygon,
        "depthMapPath": f"/room-configs/{depth_map_filename}",
    }
    config_path = output_dir / f"{room_id}.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(room_config, f, indent=2, ensure_ascii=False)

    save_debug_image(
        image_path, depth, walk_polygon, {"depthConfig": depth_config},
        str(output_dir / f"{room_id}_debug.png"),
    )
    print(f"    Saved: {room_id}.json, {depth_map_filename}, {room_id}_debug.png")

    # ── 2. Semantic segmentation ──────────────────────────────────
    seg_objects: list[dict] = []
    if seg_pipe is not None:
        print("  [2/4] Semantic segmentation...")
        from segment import segment_room
        seg_data = segment_room(seg_pipe, image_path, room_id, output_dir, depth)
        seg_objects = seg_data.get("objects", [])

        # Use refined walk area if segmentation produced a floor polygon
        if seg_data.get("floorPolygon"):
            walk_polygon = seg_data["floorPolygon"]
            print(f"    Using segmentation floor polygon ({len(walk_polygon)} pts)")

        # Reload config in case segment.py updated it
        with open(config_path, encoding="utf-8") as f:
            room_config = json.load(f)
        walk_polygon = room_config.get("walkArea", walk_polygon)
        print(f"    {len(seg_objects)} object candidates")
    else:
        print("  [2/4] Segmentation skipped")

    # ── 3. Claude Vision object identification ────────────────────
    game_objects: list[dict] = []
    if client is not None and seg_objects:
        print("  [3/4] Claude Vision: generating Korean game objects...")
        game_objects = generate_game_objects(
            client, image_path, seg_objects, room_context, room_id,
        )
    elif client is not None and not seg_objects:
        # No segmentation data — still send image to Claude with a broader prompt
        print("  [3/4] Claude Vision: no seg data, analysing image directly...")
        game_objects = generate_game_objects(
            client, image_path, [], room_context, room_id,
        )
    elif seg_objects:
        print("  [3/4] Claude Vision skipped — using raw segmentation labels")
        game_objects = seg_to_raw_objects(seg_objects)
    else:
        print("  [3/4] Skipped (no Claude client, no segmentation)")

    # ── 4. Write room JSON ────────────────────────────────────────
    print("  [4/4] Writing room JSON...")
    rooms_dir.mkdir(parents=True, exist_ok=True)
    room_json = build_room_json(room_id, room_name, game_objects, walk_polygon)
    room_path = rooms_dir / f"{room_id}.json"
    with open(room_path, "w", encoding="utf-8") as f:
        json.dump(room_json, f, indent=2, ensure_ascii=False)
    print(f"    Saved: {room_path}  ({len(game_objects)} objects)")

    return {"config": room_config, "room": room_json}


# ── CLI ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Unified room builder: image → depth + segmentation + Claude Vision → game JSON",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--image", help="Single background image to process")
    parser.add_argument("--room-id", help="Room ID (default: image filename stem)")
    parser.add_argument("--room-name", default="", help="Korean display name (default: room-id)")
    parser.add_argument("--context", default="", help="Room description for Claude Vision context")
    parser.add_argument("--batch", help="Directory of PNG backgrounds to process")
    parser.add_argument(
        "--room-names", default="",
        help="Comma-separated room_id:이름 pairs for batch mode (e.g. harbor:항구,tavern:술집)",
    )
    parser.add_argument(
        "--output", "-o",
        default="../../monkey-island-web/public/room-configs",
        help="Depth config output directory (default: public/room-configs)",
    )
    parser.add_argument(
        "--rooms-dir",
        default="../../monkey-island-web/public/rooms",
        help="Room JSON output directory (default: public/rooms)",
    )
    parser.add_argument(
        "--device", default="cpu", choices=["cuda", "cpu", "mps"],
        help="Inference device for AI models (default: cpu)",
    )
    parser.add_argument(
        "--threshold", type=float, default=55,
        help="Walk area depth percentile threshold (default: 55)",
    )
    parser.add_argument(
        "--skip-segmentation", action="store_true",
        help="Skip Mask2Former segmentation (faster; depth only)",
    )
    parser.add_argument(
        "--skip-claude", action="store_true",
        help="Skip Claude Vision API (use raw segmentation labels instead)",
    )
    args = parser.parse_args()

    output_dir = Path(args.output)
    rooms_dir = Path(args.rooms_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    rooms_dir.mkdir(parents=True, exist_ok=True)

    # ── Load models ───────────────────────────────────────────────
    print("Loading depth model...")
    from analyze import load_depth_model
    depth_pipe = load_depth_model(args.device)

    seg_pipe = None
    if not args.skip_segmentation:
        from segment import load_seg_model
        seg_pipe = load_seg_model(args.device)

    client = None
    if not args.skip_claude:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if api_key:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            print("Claude Vision API: ready")
        else:
            print("[warn] ANTHROPIC_API_KEY not set — Claude Vision step will be skipped")

    # ── Parse room-names map for batch mode ───────────────────────
    name_map: dict[str, str] = {}
    if args.room_names:
        for pair in args.room_names.split(","):
            pair = pair.strip()
            if ":" in pair:
                rid, rname = pair.split(":", 1)
                name_map[rid.strip()] = rname.strip()

    # ── Single image ──────────────────────────────────────────────
    if args.image:
        rid = args.room_id or Path(args.image).stem
        rname = args.room_name or name_map.get(rid, rid)
        build_room_from_image(
            args.image, rid, rname,
            output_dir, rooms_dir,
            depth_pipe=depth_pipe,
            seg_pipe=seg_pipe,
            client=client,
            room_context=args.context,
            threshold=args.threshold,
        )
        print("\nDone.")
        print("\nNext steps:")
        print(f"  1. Add '{rid}' to App.tsx ALL_ROOMS array")
        print(f"  2. Verify exits in public/rooms/{rid}.json")
        print(f"  3. npm run dev  — reload and test")

    # ── Batch mode ────────────────────────────────────────────────
    elif args.batch:
        batch_dir = Path(args.batch)
        images = sorted(batch_dir.glob("*.png"))
        if not images:
            print(f"No PNG files found in {batch_dir}", file=sys.stderr)
            sys.exit(1)

        results = []
        for img_path in images:
            rid = img_path.stem
            rname = name_map.get(rid, rid)
            result = build_room_from_image(
                str(img_path), rid, rname,
                output_dir, rooms_dir,
                depth_pipe=depth_pipe,
                seg_pipe=seg_pipe,
                client=client,
                threshold=args.threshold,
            )
            results.append(result)

        print(f"\nDone — {len(results)} rooms processed")
        print(f"  Depth configs: {output_dir}")
        print(f"  Room JSONs:    {rooms_dir}")
        room_ids = [Path(img).stem for img in images]
        print(f"\nAdd to App.tsx ALL_ROOMS:\n  {room_ids}")

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
