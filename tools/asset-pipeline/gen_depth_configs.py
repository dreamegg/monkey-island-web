#!/usr/bin/env python3
"""Generate depth config JSON files for rooms that don't have them."""
import json, os

OUTDIR = os.path.join(os.path.dirname(__file__), '../../monkey-island-web/public/room-configs')
os.makedirs(OUTDIR, exist_ok=True)

# Room depth configs — tuned per room type
# walkArea: polygon points [x, y] normalized 0-1
# horizonY: where perspective vanishing point is (0=top, 1=bottom)
# nearScale: character scale at bottom of screen
# farScale: character scale at horizon

configs = {
  "village_road": {
    "roomId": "village_road",
    "depthConfig": {
      "horizonY": 0.45,
      "nearY": 0.95,
      "nearScale": 1.8,
      "farScale": 0.45,
      "walkThreshold": 0.12
    },
    "walkArea": [
      [0.1, 0.55], [0.28, 0.55], [0.35, 0.45],
      [0.65, 0.45], [0.72, 0.55], [0.9, 0.55],
      [0.9, 0.92], [0.1, 0.92]
    ]
  },
  "governor_mansion": {
    "roomId": "governor_mansion",
    "depthConfig": {
      "horizonY": 0.35,
      "nearY": 0.95,
      "nearScale": 1.7,
      "farScale": 0.5,
      "walkThreshold": 0.1
    },
    "walkArea": [
      [0.05, 0.6], [0.3, 0.6], [0.35, 0.55],
      [0.65, 0.55], [0.7, 0.6], [0.95, 0.6],
      [0.95, 0.92], [0.05, 0.92]
    ]
  },
  "mansion_interior": {
    "roomId": "mansion_interior",
    "depthConfig": {
      "horizonY": 0.5,
      "nearY": 0.98,
      "nearScale": 2.0,
      "farScale": 0.55,
      "walkThreshold": 0.15
    },
    "walkArea": [
      [0.05, 0.58], [0.12, 0.52], [0.88, 0.52],
      [0.95, 0.58], [0.95, 0.92], [0.05, 0.92]
    ]
  },
  "stan_shop": {
    "roomId": "stan_shop",
    "depthConfig": {
      "horizonY": 0.3,
      "nearY": 0.95,
      "nearScale": 1.75,
      "farScale": 0.42,
      "walkThreshold": 0.1
    },
    "walkArea": [
      [0.02, 0.58], [0.15, 0.55], [0.85, 0.55],
      [0.98, 0.58], [0.98, 0.92], [0.02, 0.92]
    ]
  },
  "sword_master_area": {
    "roomId": "sword_master_area",
    "depthConfig": {
      "horizonY": 0.4,
      "nearY": 0.95,
      "nearScale": 1.65,
      "farScale": 0.48,
      "walkThreshold": 0.12
    },
    "walkArea": [
      [0.05, 0.6], [0.18, 0.55], [0.82, 0.55],
      [0.95, 0.6], [0.95, 0.92], [0.05, 0.92]
    ]
  },
  "prison": {
    "roomId": "prison",
    "depthConfig": {
      "horizonY": 0.48,
      "nearY": 0.95,
      "nearScale": 1.6,
      "farScale": 0.6,
      "walkThreshold": 0.1
    },
    "walkArea": [
      [0.3, 0.58], [0.38, 0.52], [0.98, 0.52],
      [0.98, 0.92], [0.3, 0.92]
    ]
  }
}

for room_id, cfg in configs.items():
    outpath = os.path.join(OUTDIR, f'{room_id}.json')
    with open(outpath, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    print(f'  WRITE: {room_id}.json')

print(f'\nDone: {len(configs)} depth configs written.')
