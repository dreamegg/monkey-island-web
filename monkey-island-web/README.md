# 🏴‍☠️ Monkey Island Web Engine

A SCUMM-style point-and-click adventure game engine for the web, inspired by *The Secret of Monkey Island* (1990).

Built with React + Canvas, featuring pixel art assets generated locally via FLUX + PixelArt LoRA.

## Features

- Classic SCUMM verb panel (Look, Pick up, Use, Open, Talk, etc.)
- Room-based scene management with transitions
- Character movement with walkbox constraints
- Object interaction (verb + object combos)
- Inventory system
- Dialogue tree engine
- Pixel art rendering pipeline (FLUX.1 + LoRA)

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Rendering**: HTML5 Canvas (pixelated)
- **Asset Pipeline**: Python + FLUX.1-dev + PixelArt LoRA
- **Deployment**: GitHub Pages / Vercel

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── engine/          # Core game engine modules
├── data/            # Room, dialogue, puzzle definitions
├── assets/          # Backgrounds, sprites, audio
├── components/      # React UI components
└── utils/           # Helpers
tools/
└── asset-pipeline/  # FLUX image generation scripts
docs/
└── PRD.md           # Product Requirements Document
```

## License

MIT
