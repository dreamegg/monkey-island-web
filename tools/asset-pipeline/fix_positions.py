#!/usr/bin/env python3
"""
fix_positions.py
Update room JSON files and depth config JSONs with corrected walk areas,
object positions, exit positions, and NPC positions based on visual analysis
of the actual 640x400 background images.

Coordinate rules:
  - x, y positions: normalized 0-1 (top-left origin)
      x = pixel_x / 640,  y = pixel_y / 400
  - w, h in room JSON: game pixels
      w = image_px_w * 2.5,  h = image_px_h * 2.0
  - Object x,y: TOP-LEFT corner of hitbox
  - NPC x,y: center-bottom (feet position)
"""

import json
import os
import copy

ROOMS_DIR = os.path.join(os.path.dirname(__file__), "../../monkey-island-web/public/rooms")
DEPTH_DIR = os.path.join(os.path.dirname(__file__), "../../monkey-island-web/public/room-configs")

# ---------------------------------------------------------------------------
# Corrections spec — only geometry/position fields are listed here.
# Keys not mentioned are left untouched.
# ---------------------------------------------------------------------------

ROOM_CORRECTIONS = {
    # ── HARBOR ────────────────────────────────────────────────────────────
    "harbor": {
        "walkArea": {"x1": 0.02, "y1": 0.64, "x2": 0.72, "y2": 0.92},
        "objects": {
            "sign":      {"x": 0.08, "y": 0.50, "w": 50,  "h": 25},
            "barrel":    {"x": 0.12, "y": 0.68, "w": 65,  "h": 40},
            "ship":      {"x": 0.48, "y": 0.10, "w": 250, "h": 250},
            "anchor":    {"x": 0.58, "y": 0.68, "w": 20,  "h": 40},
            "rope_coil": {"x": 0.50, "y": 0.70, "w": 28,  "h": 22},
        },
        "exits": {
            "tavern_door":  {"x": 0.0,  "y": 0.48, "w": 25,  "h": 150, "walkTo": {"x": 0.05, "y": 0.78}},
            "forest_path":  {"x": 0.68, "y": 0.62, "w": 35,  "h": 130, "walkTo": {"x": 0.70, "y": 0.78}},
        },
        "npcs": {
            "three_pirates": {"x": 0.28, "y": 0.78},
        },
    },

    # ── TAVERN ────────────────────────────────────────────────────────────
    "tavern": {
        "walkArea": {"x1": 0.03, "y1": 0.62, "x2": 0.88, "y2": 0.95},
        "objects": {
            "mug":           {"x": 0.68, "y": 0.62, "w": 35,  "h": 35},
            "map":           {"x": 0.35, "y": 0.22, "w": 75,  "h": 60},
            "bottles":       {"x": 0.77, "y": 0.16, "w": 130, "h": 80},
            "wanted_poster": {"x": 0.10, "y": 0.20, "w": 50,  "h": 65},
        },
        "exits": {
            "harbor_door":       {"x": 0.0,  "y": 0.30, "w": 20,  "h": 170, "walkTo": {"x": 0.04, "y": 0.80}},
            "village_road_door": {"x": 0.86, "y": 0.35, "w": 30,  "h": 160, "walkTo": {"x": 0.88, "y": 0.80}},
        },
        "npcs": {
            "bartender": {"x": 0.75, "y": 0.75},
        },
    },

    # ── FOREST ────────────────────────────────────────────────────────────
    "forest": {
        "walkArea": {"x1": 0.15, "y1": 0.70, "x2": 0.85, "y2": 0.95},
        "objects": {
            "mushroom_glow":  {"x": 0.33, "y": 0.73, "w": 30,  "h": 38},
            "stone_idol":     {"x": 0.43, "y": 0.65, "w": 40,  "h": 55},
            "wooden_bridge":  {"x": 0.38, "y": 0.70, "w": 120, "h": 25},
        },
        "exits": {
            "harbor_back":       {"x": 0.0,  "y": 0.58, "w": 30,  "h": 150, "walkTo": {"x": 0.05, "y": 0.82}},
            "beach_path":        {"x": 0.83, "y": 0.58, "w": 30,  "h": 140, "walkTo": {"x": 0.82, "y": 0.82}},
            "sword_master_path": {"x": 0.40, "y": 0.60, "w": 80,  "h": 70,  "walkTo": {"x": 0.48, "y": 0.72}},
        },
        "npcs": {
            "voodoo_lady": {"x": 0.50, "y": 0.80},
        },
    },

    # ── BEACH ─────────────────────────────────────────────────────────────
    "beach": {
        "walkArea": {"x1": 0.03, "y1": 0.72, "x2": 0.88, "y2": 0.95},
        "objects": {
            "palm_tree":    {"x": 0.08, "y": 0.0,  "w": 55,  "h": 460},
            "skull_rock":   {"x": 0.62, "y": 0.52, "w": 150, "h": 130},
            "campfire":     {"x": 0.22, "y": 0.82, "w": 35,  "h": 25},
            "old_chest":    {"x": 0.14, "y": 0.80, "w": 55,  "h": 38},
            "x_marks_spot": {"x": 0.44, "y": 0.84, "w": 55,  "h": 30},
        },
        "exits": {
            "forest_back":    {"x": 0.85, "y": 0.62, "w": 40,  "h": 140, "walkTo": {"x": 0.84, "y": 0.82}},
            "cave_entrance":  {"x": 0.03, "y": 0.50, "w": 70,  "h": 130, "walkTo": {"x": 0.10, "y": 0.82}},
        },
        # no NPCs in beach
    },

    # ── CAVE ──────────────────────────────────────────────────────────────
    "cave": {
        "walkArea": {"x1": 0.05, "y1": 0.68, "x2": 0.92, "y2": 0.95},
        "objects": {
            "crystal_shard":    {"x": 0.68, "y": 0.72, "w": 30,  "h": 35},
            "cave_key":         {"x": 0.45, "y": 0.76, "w": 20,  "h": 18},
            "underground_pool": {"x": 0.28, "y": 0.70, "w": 330, "h": 100},
        },
        "exits": {
            "beach_back": {"x": 0.28, "y": 0.12, "w": 270, "h": 120, "walkTo": {"x": 0.50, "y": 0.80}},
        },
    },

    # ── VILLAGE ROAD ──────────────────────────────────────────────────────
    "village_road": {
        "walkArea": {"x1": 0.0, "y1": 0.55, "x2": 1.0, "y2": 0.95},
        "objects": {
            "notice_board": {"x": 0.35, "y": 0.60, "w": 115, "h": 70},
        },
        "exits": {
            "to_tavern":  {"x": 0.0,  "y": 0.50, "w": 22,  "h": 200, "walkTo": {"x": 0.04, "y": 0.82}},
            "to_mansion": {"x": 0.35, "y": 0.50, "w": 230, "h": 65,  "walkTo": {"x": 0.50, "y": 0.58}},
            "to_stan":    {"x": 0.93, "y": 0.50, "w": 22,  "h": 200, "walkTo": {"x": 0.92, "y": 0.82}},
            "to_prison":  {"x": 0.38, "y": 0.57, "w": 60,  "h": 90,  "walkTo": {"x": 0.45, "y": 0.72}},
        },
        "npcs": {
            "sheriff": {"x": 0.68, "y": 0.80},
        },
    },

    # ── GOVERNOR MANSION (exterior) ───────────────────────────────────────
    "governor_mansion": {
        "walkArea": {"x1": 0.02, "y1": 0.70, "x2": 0.98, "y2": 0.96},
        "objects": {
            "mansion_door":   {"x": 0.39, "y": 0.28, "w": 80,  "h": 240},
            "mansion_window": {"x": 0.15, "y": 0.16, "w": 80,  "h": 95},
            "garden_hedge":   {"x": 0.02, "y": 0.58, "w": 180, "h": 130},
            "fountain":       {"x": 0.40, "y": 0.64, "w": 140, "h": 50},
        },
        "exits": {
            "back_to_village": {"x": 0.0, "y": 0.55, "w": 20, "h": 220, "walkTo": {"x": 0.04, "y": 0.85}},
        },
        "npcs": {
            "mansion_guard": {"x": 0.50, "y": 0.83},
        },
    },

    # ── MANSION INTERIOR ──────────────────────────────────────────────────
    "mansion_interior": {
        "walkArea": {"x1": 0.02, "y1": 0.55, "x2": 0.98, "y2": 0.96},
        "objects": {
            "governors_idol":    {"x": 0.33, "y": 0.08, "w": 80,  "h": 230},
            "trophy_case":       {"x": 0.58, "y": 0.02, "w": 180, "h": 175},
            "governor_portrait": {"x": 0.28, "y": 0.02, "w": 200, "h": 230},
            "exit_window":       {"x": 0.63, "y": 0.02, "w": 175, "h": 185},
        },
        "exits": {
            "window_escape": {"x": 0.63, "y": 0.02, "w": 175, "h": 185, "walkTo": {"x": 0.50, "y": 0.78}},
        },
    },

    # ── STAN'S SHOP ───────────────────────────────────────────────────────
    "stan_shop": {
        "walkArea": {"x1": 0.0, "y1": 0.68, "x2": 1.0, "y2": 0.96},
        "objects": {
            "small_ship":    {"x": 0.04, "y": 0.30, "w": 175, "h": 190},
            "medium_ship":   {"x": 0.33, "y": 0.28, "w": 200, "h": 200},
            "large_ship":    {"x": 0.62, "y": 0.25, "w": 220, "h": 215},
            "shovel":        {"x": 0.05, "y": 0.72, "w": 22,  "h": 90},
            "discount_sign": {"x": 0.30, "y": 0.10, "w": 270, "h": 120},
        },
        "exits": {
            "back_to_village_from_stan": {"x": 0.0, "y": 0.48, "w": 20, "h": 210, "walkTo": {"x": 0.04, "y": 0.82}},
        },
        "npcs": {
            "stan": {"x": 0.84, "y": 0.84},
        },
    },

    # ── SWORD MASTER AREA ─────────────────────────────────────────────────
    "sword_master_area": {
        "walkArea": {"x1": 0.05, "y1": 0.65, "x2": 0.95, "y2": 0.96},
        "objects": {
            "training_dummy": {"x": 0.08, "y": 0.48, "w": 110, "h": 150},
            "sword_rack":     {"x": 0.38, "y": 0.55, "w": 100, "h": 120},
            "crossed_swords": {"x": 0.36, "y": 0.02, "w": 195, "h": 75},
        },
        "exits": {
            "back_to_forest": {"x": 0.0, "y": 0.55, "w": 25, "h": 165, "walkTo": {"x": 0.05, "y": 0.82}},
        },
        "npcs": {
            "carla": {"x": 0.50, "y": 0.84},
        },
    },

    # ── PRISON ────────────────────────────────────────────────────────────
    "prison": {
        "walkArea": {"x1": 0.44, "y1": 0.70, "x2": 0.97, "y2": 0.96},
        "objects": {
            "cell_bars":    {"x": 0.0,  "y": 0.0,  "w": 555, "h": 620},
            "hanging_keys": {"x": 0.82, "y": 0.40, "w": 70,  "h": 90},
            "sheriff_desk": {"x": 0.50, "y": 0.62, "w": 420, "h": 240},
        },
        "exits": {
            "back_to_village_from_prison": {"x": 0.87, "y": 0.55, "w": 45, "h": 185, "walkTo": {"x": 0.88, "y": 0.82}},
        },
        "npcs": {
            "otis": {"x": 0.20, "y": 0.68},
        },
    },
}

# ---------------------------------------------------------------------------
# Depth config corrections
# ---------------------------------------------------------------------------

DEPTH_CORRECTIONS = {
    "harbor": {
        "depthConfig": {"horizonY": 0.60, "nearY": 0.92, "nearScale": 1.7, "farScale": 0.75},
        "walkArea": [[0.02, 0.64], [0.72, 0.64], [0.72, 0.92], [0.02, 0.92]],
    },
    "tavern": {
        "depthConfig": {"horizonY": 0.48, "nearY": 0.95, "nearScale": 1.85, "farScale": 0.55},
        "walkArea": [[0.03, 0.62], [0.88, 0.62], [0.88, 0.95], [0.03, 0.95]],
    },
    "forest": {
        "depthConfig": {"horizonY": 0.68, "nearY": 0.95, "nearScale": 1.65, "farScale": 0.45},
        "walkArea": [[0.28, 0.70], [0.60, 0.70], [0.85, 0.95], [0.15, 0.95]],
    },
    "beach": {
        "depthConfig": {"horizonY": 0.65, "nearY": 0.95, "nearScale": 1.75, "farScale": 0.50},
        "walkArea": [[0.03, 0.72], [0.88, 0.72], [0.88, 0.95], [0.03, 0.95]],
    },
    "cave": {
        "depthConfig": {"horizonY": 0.35, "nearY": 0.95, "nearScale": 1.60, "farScale": 0.52},
        "walkArea": [[0.05, 0.68], [0.92, 0.68], [0.92, 0.95], [0.05, 0.95]],
    },
    "village_road": {
        "depthConfig": {"horizonY": 0.52, "nearY": 0.95, "nearScale": 1.82, "farScale": 0.40},
        "walkArea": [[0.35, 0.55], [0.65, 0.55], [1.0, 0.95], [0.0, 0.95]],
    },
    "governor_mansion": {
        "depthConfig": {"horizonY": 0.20, "nearY": 0.96, "nearScale": 1.55, "farScale": 0.78},
        "walkArea": [[0.02, 0.70], [0.98, 0.70], [0.98, 0.96], [0.02, 0.96]],
    },
    "mansion_interior": {
        "depthConfig": {"horizonY": 0.40, "nearY": 0.96, "nearScale": 1.88, "farScale": 0.62},
        "walkArea": [[0.02, 0.55], [0.98, 0.55], [0.98, 0.96], [0.02, 0.96]],
    },
    "stan_shop": {
        "depthConfig": {"horizonY": 0.35, "nearY": 0.96, "nearScale": 1.72, "farScale": 0.45},
        "walkArea": [[0.0, 0.68], [1.0, 0.68], [1.0, 0.96], [0.0, 0.96]],
    },
    "sword_master_area": {
        "depthConfig": {"horizonY": 0.45, "nearY": 0.96, "nearScale": 1.68, "farScale": 0.50},
        "walkArea": [[0.28, 0.65], [0.68, 0.65], [0.92, 0.96], [0.08, 0.96]],
    },
    "prison": {
        "depthConfig": {"horizonY": 0.50, "nearY": 0.96, "nearScale": 1.58, "farScale": 0.65},
        "walkArea": [[0.44, 0.70], [0.97, 0.70], [0.97, 0.96], [0.44, 0.96]],
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def changes_for(label, old_val, new_val):
    """Return a human-readable list of changed fields."""
    diffs = []
    if isinstance(old_val, dict) and isinstance(new_val, dict):
        for k, nv in new_val.items():
            ov = old_val.get(k)
            if ov != nv:
                diffs.append(f"  {label}.{k}: {ov!r} → {nv!r}")
    else:
        if old_val != new_val:
            diffs.append(f"  {label}: {old_val!r} → {new_val!r}")
    return diffs


def apply_room_corrections(data, corrections):
    """Apply geometry corrections to a room JSON dict. Returns list of change descriptions."""
    log = []

    # walkArea
    if "walkArea" in corrections:
        old = copy.deepcopy(data.get("walkArea"))
        data["walkArea"] = corrections["walkArea"]
        log += changes_for("walkArea", old, corrections["walkArea"])

    # objects
    if "objects" in corrections:
        obj_corrections = corrections["objects"]
        for obj in data.get("objects", []):
            oid = obj.get("id")
            if oid in obj_corrections:
                geo = obj_corrections[oid]
                old = {k: obj.get(k) for k in geo}
                obj.update(geo)
                log += changes_for(f"objects[{oid}]", old, geo)

    # exits
    if "exits" in corrections:
        exit_corrections = corrections["exits"]
        for ex in data.get("exits", []):
            eid = ex.get("id")
            if eid in exit_corrections:
                geo = exit_corrections[eid]
                # walkTo is nested
                old = {}
                for k, v in geo.items():
                    if k == "walkTo":
                        old["walkTo"] = copy.deepcopy(ex.get("walkTo"))
                        ex["walkTo"] = v
                    else:
                        old[k] = ex.get(k)
                        ex[k] = v
                log += changes_for(f"exits[{eid}]", old, geo)

    # npcs
    if "npcs" in corrections:
        npc_corrections = corrections["npcs"]
        for npc in data.get("npcs", []):
            nid = npc.get("id")
            if nid in npc_corrections:
                geo = npc_corrections[nid]
                old = {k: npc.get(k) for k in geo}
                npc.update(geo)
                log += changes_for(f"npcs[{nid}]", old, geo)

    return log


def apply_depth_corrections(data, corrections):
    """Apply corrections to a depth config JSON dict. Returns list of change descriptions."""
    log = []

    if "depthConfig" in corrections:
        dc_new = corrections["depthConfig"]
        dc_old = copy.deepcopy(data.get("depthConfig", {}))
        for k, nv in dc_new.items():
            ov = dc_old.get(k)
            if ov != nv:
                log.append(f"  depthConfig.{k}: {ov!r} → {nv!r}")
        data.setdefault("depthConfig", {}).update(dc_new)

    if "walkArea" in corrections:
        old_wa = data.get("walkArea")
        data["walkArea"] = corrections["walkArea"]
        if old_wa != corrections["walkArea"]:
            log.append(f"  walkArea: replaced with {len(corrections['walkArea'])}-point polygon")

    return log


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    rooms_updated = 0
    depths_updated = 0
    total_changes = 0

    print("=" * 60)
    print("fix_positions.py — updating room JSONs + depth configs")
    print("=" * 60)

    # ── Room JSONs ────────────────────────────────────────────────────────
    for room_id, corrections in ROOM_CORRECTIONS.items():
        path = os.path.join(ROOMS_DIR, f"{room_id}.json")
        if not os.path.exists(path):
            print(f"\n[SKIP] Room file not found: {path}")
            continue

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        log = apply_room_corrections(data, corrections)

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")

        n = len(log)
        total_changes += n
        rooms_updated += 1
        print(f"\n[ROOM] {room_id}.json — {n} field(s) changed")
        for line in log:
            print(line)

    # ── Depth configs ─────────────────────────────────────────────────────
    for room_id, corrections in DEPTH_CORRECTIONS.items():
        path = os.path.join(DEPTH_DIR, f"{room_id}.json")
        if not os.path.exists(path):
            print(f"\n[SKIP] Depth config not found: {path}")
            continue

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        log = apply_depth_corrections(data, corrections)

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")

        n = len(log)
        total_changes += n
        depths_updated += 1
        print(f"\n[DEPTH] {room_id}.json — {n} field(s) changed")
        for line in log:
            print(line)

    print("\n" + "=" * 60)
    print(f"SUMMARY: {rooms_updated} room(s) + {depths_updated} depth config(s) updated")
    print(f"         {total_changes} individual field change(s) applied")
    print("=" * 60)


if __name__ == "__main__":
    main()
