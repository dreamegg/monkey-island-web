#!/usr/bin/env python3
"""
Story Analyzer — Novel text → SCUMM-style JSON game files
=========================================================
Reads a story text (Korean or English) and uses Claude to extract:
  - Room definitions  → public/rooms/{id}.json
  - Dialogue trees    → public/dialogues/{id}.json

Usage:
    python analyze.py story.txt [--output-dir ../../monkey-island-web/public]
    python analyze.py story.txt --room-ids "room1,room2" --dry-run

Requirements:
    pip install anthropic
    export ANTHROPIC_API_KEY=sk-ant-...
"""

import argparse
import json
import os
import sys
from pathlib import Path

import anthropic

# ── Schema documentation injected into every Claude prompt ──

ROOM_SCHEMA = """\
## Room JSON Schema  (/public/rooms/{id}.json)

```json
{
  "id": "string (snake_case, unique)",
  "name": "string (Korean display name, e.g. '항구')",
  "walkArea": {
    "x1": 0.0, "y1": 0.0,   // top-left normalized (0-1)
    "x2": 1.0, "y2": 1.0    // bottom-right normalized (0-1)
  },
  "objects": [
    {
      "id": "string (snake_case)",
      "name": "string (Korean display name)",
      "x": 0.5,   // normalized center X (0-1)
      "y": 0.5,   // normalized center Y (0-1)
      "w": 40,    // pixel width (absolute)
      "h": 40,    // pixel height (absolute)
      "actions": {
        // Keys must be valid SCUMM verbs:
        // look, pick_up, use, open, close, talk, push, pull, give, read
        "look": "string OR ScriptCommand[]",
        "pick_up": [
          {"cmd": "give_item", "id": "item_id", "name": "Korean name", "icon": "emoji"},
          {"cmd": "set_flag", "flag": "has_item_id", "value": true}
        ],
        "use": [
          {
            "cmd": "if", "flag": "some_flag",
            "then": [{"cmd": "say", "text": "Korean success text"}],
            "else": [{"cmd": "say", "text": "Korean failure text"}]
          }
        ]
      },
      "item": { "id": "item_id", "name": "Korean name", "icon": "emoji" }
      // ^ include "item" only if the object can be picked up
    }
  ],
  "exits": [
    {
      "id": "string (snake_case)",
      "name": "string (Korean display name)",
      "to": "roomId",
      "x": 0.0, "y": 0.5,    // normalized position
      "w": 30, "h": 100,      // pixel size
      "walkTo": {"x": 0.05, "y": 0.7}  // where player walks before exit triggers
    }
  ],
  "npcs": [
    {
      "id": "string (snake_case)",
      "name": "string (Korean display name)",
      "x": 0.5, "y": 0.65,
      "sprite": "guybrush",  // sprite key (guybrush, lechuck, or omit for procedural)
      "dialogue": "dialogue_tree_id",  // references /public/dialogues/{id}.json
      "actions": {
        "look": "Korean description string",
        "talk": ""  // empty string triggers dialogue
      }
    }
  ]
}
```

## ScriptCommand types:
- `{"cmd": "say", "text": "Korean text"}` — show message
- `{"cmd": "set_flag", "flag": "name", "value": true|false}` — set game flag
- `{"cmd": "give_item", "id": "id", "name": "Korean", "icon": "emoji"}` — add to inventory
- `{"cmd": "remove_item", "id": "id"}` — remove from inventory
- `{"cmd": "change_room", "room": "roomId", "entryX": 0.5}` — travel to room
- `{"cmd": "start_dialogue", "id": "dialogue_id"}` — start dialogue tree
- `{"cmd": "if", "flag": "name", "negate": false, "then": [...], "else": [...]}` — conditional
"""

DIALOGUE_SCHEMA = """\
## Dialogue JSON Schema  (/public/dialogues/{id}.json)

```json
{
  "id": "dialogue_tree_id",
  "startNode": "start",
  "nodes": {
    "start": {
      "id": "start",
      "speaker": "Korean NPC name",
      "portrait": "/assets/portraits/{name}.png",
      "text": "Korean dialogue text",
      "onEnter": [
        {"cmd": "set_flag", "flag": "met_npc", "value": true}
      ],
      "choices": [
        {
          "text": "Korean player response",
          "next": "next_node_id",
          "condition": "flag_name",   // optional: only show if flag is true
          "negate": false,            // optional: show if flag is false
          "once": false               // optional: hide after used once
        }
      ],
      "next": "next_node_id"  // use instead of choices for linear dialogue
    }
  }
}
```

Rules for dialogue trees:
- Every node referenced in choices[].next or node.next must exist in nodes.
- Use "end" as the terminal node id (no next, no choices).
- "end" node must exist with speaker, text (farewell), no next/choices.
- Portraits path: /assets/portraits/{snake_case_name}.png
"""

EXTRACTION_SYSTEM = f"""\
You are a game designer converting narrative fiction into a SCUMM-style point-and-click adventure game.

Your task: analyze the provided story and output a structured game design document.

Output ONLY valid JSON matching this structure:
{{
  "title": "Korean game title",
  "rooms": [
    {{
      "id": "snake_case_id",
      "name": "Korean display name",
      "description": "Brief description for background art generation",
      "npcs": ["npc_id_1"],
      "items": ["item that can be found here"],
      "connections": ["other_room_id"]
    }}
  ],
  "npcs": [
    {{
      "id": "snake_case_id",
      "name": "Korean name",
      "location": "room_id",
      "personality": "brief personality description",
      "knowledge": ["what they know / can tell the player"],
      "gives": ["item they give if conditions met"]
    }}
  ],
  "items": [
    {{
      "id": "snake_case_id",
      "name": "Korean name",
      "icon": "single emoji",
      "location": "room_id or npc_id",
      "purpose": "what it's used for"
    }}
  ],
  "flags": [
    {{
      "id": "snake_case_flag_name",
      "description": "what this flag tracks"
    }}
  ],
  "player_goals": ["main objective 1", "main objective 2"]
}}

Guidelines:
- Generate 3-7 rooms from the story locations.
- All names must be in Korean.
- Keep it faithful to the source story but adapt it to adventure game structure.
- Items should have meaningful uses (puzzles, unlocking areas, dialogue triggers).
"""

ROOM_SYSTEM = f"""\
You are a game designer creating a JSON room definition for a SCUMM-style Korean adventure game.

{ROOM_SCHEMA}

Rules:
- All Korean text must be natural, natural-sounding Korean.
- Normalized positions (x, y) are 0.0–1.0 where (0,0) is top-left.
- Walk area should cover the bottom 30-40% of the screen (y1 ≈ 0.55–0.65, y2 ≈ 0.80–0.90).
- Place objects at realistic positions in the room.
- NPC x typically 0.3–0.7, y typically 0.6–0.75 (standing on ground).
- Exits at room edges: left exit x≈0.0, right exit x≈0.95, bottom x varies.
- Objects should have at least "look" and one other relevant verb action.
- If an object is a container for an item, include "item" field AND a pick_up script.
- Output ONLY the JSON object, no markdown fences.
"""

DIALOGUE_SYSTEM = f"""\
You are a dialogue writer creating a Korean adventure game dialogue tree.

{DIALOGUE_SCHEMA}

Rules:
- All dialogue text must be in natural Korean.
- The tree must be self-contained — no dangling node references.
- Create branching choices that feel natural and reveal story information progressively.
- Use flag conditions to unlock new dialogue after story events.
- The "end" node should always exist as the farewell/exit node.
- NPC personality should come through in the text style.
- Output ONLY the JSON object, no markdown fences.
"""


# ── Main analysis functions ──────────────────────────────────

def extract_structure(client: anthropic.Anthropic, story_text: str) -> dict:
    """Pass 1: extract high-level game structure from story."""
    print("→ Pass 1: Extracting game structure...")
    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        system=EXTRACTION_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": f"Analyze this story and extract the game structure:\n\n{story_text}"
            }
        ]
    )
    text = response.content[0].text.strip()
    # Strip markdown fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
    return json.loads(text)


def generate_room_json(
    client: anthropic.Anthropic,
    room_info: dict,
    structure: dict,
    story_text: str,
) -> dict:
    """Pass 2: generate full room JSON for one room."""
    room_id = room_info["id"]
    print(f"  → Generating room: {room_id} ({room_info['name']})")

    context = (
        f"Game title: {structure['title']}\n"
        f"Story excerpt: {story_text[:2000]}\n\n"
        f"Full game structure:\n{json.dumps(structure, ensure_ascii=False, indent=2)}\n\n"
        f"Generate the room JSON for: {json.dumps(room_info, ensure_ascii=False, indent=2)}"
    )

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        system=ROOM_SYSTEM,
        messages=[{"role": "user", "content": context}]
    )
    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
    return json.loads(text)


def generate_dialogue_json(
    client: anthropic.Anthropic,
    npc_info: dict,
    structure: dict,
    story_text: str,
) -> dict:
    """Pass 2: generate dialogue tree JSON for one NPC."""
    npc_id = npc_info["id"]
    print(f"  → Generating dialogue: {npc_id} ({npc_info['name']})")

    context = (
        f"Game title: {structure['title']}\n"
        f"Story excerpt: {story_text[:2000]}\n\n"
        f"Full game structure:\n{json.dumps(structure, ensure_ascii=False, indent=2)}\n\n"
        f"Generate the dialogue tree JSON for NPC: {json.dumps(npc_info, ensure_ascii=False, indent=2)}\n"
        f"Dialogue tree id must be: {npc_id}"
    )

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        system=DIALOGUE_SYSTEM,
        messages=[{"role": "user", "content": context}]
    )
    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
    data = json.loads(text)
    # Ensure id matches
    data["id"] = npc_id
    return data


# ── CLI ──────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Convert story text to SCUMM adventure game JSON")
    parser.add_argument("story_file", help="Path to story text file (UTF-8)")
    parser.add_argument(
        "--output-dir",
        default=str(Path(__file__).parent.parent.parent / "monkey-island-web" / "public"),
        help="Game public/ directory (default: ../../monkey-island-web/public)"
    )
    parser.add_argument(
        "--room-ids",
        default="",
        help="Comma-separated room ids to (re-)generate. Omit to generate all."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print JSON to stdout instead of writing files"
    )
    parser.add_argument(
        "--structure-only",
        action="store_true",
        help="Only run pass 1 (structure extraction), print result and exit"
    )
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set.", file=sys.stderr)
        sys.exit(1)

    story_path = Path(args.story_file)
    if not story_path.exists():
        print(f"Error: {story_path} not found.", file=sys.stderr)
        sys.exit(1)

    story_text = story_path.read_text(encoding="utf-8")
    print(f"Story loaded: {len(story_text)} chars from {story_path.name}")

    client = anthropic.Anthropic(api_key=api_key)
    output_dir = Path(args.output_dir)
    rooms_dir = output_dir / "rooms"
    dialogues_dir = output_dir / "dialogues"

    # Pass 1: structure extraction
    structure = extract_structure(client, story_text)
    print(f"\nExtracted: {len(structure['rooms'])} rooms, {len(structure['npcs'])} NPCs")
    print(f"Title: {structure['title']}")

    if args.structure_only:
        print(json.dumps(structure, ensure_ascii=False, indent=2))
        return

    filter_rooms = set(args.room_ids.split(",")) if args.room_ids else set()

    # Pass 2a: generate room JSONs
    print("\n→ Pass 2a: Generating room files...")
    rooms_dir.mkdir(parents=True, exist_ok=True)
    for room_info in structure["rooms"]:
        room_id = room_info["id"]
        if filter_rooms and room_id not in filter_rooms:
            continue
        room_json = generate_room_json(client, room_info, structure, story_text)
        if args.dry_run:
            print(f"\n=== rooms/{room_id}.json ===")
            print(json.dumps(room_json, ensure_ascii=False, indent=2))
        else:
            out_path = rooms_dir / f"{room_id}.json"
            out_path.write_text(json.dumps(room_json, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  ✓ Written: {out_path}")

    # Pass 2b: generate dialogue JSONs for NPCs with dialogue
    print("\n→ Pass 2b: Generating dialogue files...")
    dialogues_dir.mkdir(parents=True, exist_ok=True)
    for npc_info in structure["npcs"]:
        npc_id = npc_info["id"]
        if filter_rooms and npc_info.get("location") not in filter_rooms:
            continue
        dialogue_json = generate_dialogue_json(client, npc_info, structure, story_text)
        if args.dry_run:
            print(f"\n=== dialogues/{npc_id}.json ===")
            print(json.dumps(dialogue_json, ensure_ascii=False, indent=2))
        else:
            out_path = dialogues_dir / f"{npc_id}.json"
            out_path.write_text(json.dumps(dialogue_json, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  ✓ Written: {out_path}")

    print(f"\n✓ Done! Generated {len(structure['rooms'])} rooms + {len(structure['npcs'])} dialogues")
    if not args.dry_run:
        print(f"  Rooms dir:     {rooms_dir}")
        print(f"  Dialogues dir: {dialogues_dir}")
        print("\nNext steps:")
        print("  1. Add new room IDs to App.tsx preloadJsonRooms() + preloadJsonDialogues()")
        print("  2. Run tools/depth-analyzer/analyze.py for depth maps")
        print("  3. Add background images to public/assets/backgrounds/")
        print("  4. npm run deploy")


if __name__ == "__main__":
    main()
