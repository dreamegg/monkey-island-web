# Phase 1: Monkey Island Web Engine -- Project Initialization

> **Created:** 2026-03-24
> **Status:** Draft -- Awaiting Confirmation
> **Scope:** Vite project setup + prototype migration to modular TypeScript + Zustand
> **Estimated complexity:** MEDIUM (single prototype file decomposed into ~15 target files)

---

## Context

A working 818-line JSX prototype (`scumm-engine.jsx`) implements a 2-room SCUMM-style adventure with canvas rendering, verb system, character movement, inventory, and room transitions. A scaffolded Vite project (`monkey-island-web/`) exists with `package.json` and tooling but no `src/` directory, `index.html`, or build config. This plan migrates the prototype into a properly structured TypeScript project following the PRD architecture.

## Work Objectives

1. Make the Vite project buildable and runnable (`npm run dev` works)
2. Decompose the monolithic prototype into typed, modular engine files
3. Replace React `useState` with Zustand store for all game state
4. Achieve full feature parity with the prototype (2 rooms, 9 verbs, walk, inventory, transitions, messages)

## Guardrails

**Must Have:**
- All existing gameplay preserved: harbor + tavern rooms, verb interactions, character movement, inventory pickup, room transitions, message display
- TypeScript strict mode
- Zustand as sole state manager (no useState for game state)
- Canvas rendering remains procedural (no image assets needed)
- `npm run dev` launches playable game
- `npm run build` produces deployable bundle

**Must NOT Have:**
- DialogueEngine, ScriptRunner, AudioManager, SaveManager (Phase 2+)
- JSON room loader (room data stays as inline TypeScript for now)
- Any new gameplay features beyond the prototype
- Image asset files (keep procedural canvas drawing)

---

## Task Flow

### Step 1: Vite + TypeScript Project Skeleton

Create the build configuration files and entry points that make the project runnable.

**Files to create:**

1. **`monkey-island-web/index.html`**
   - Standard Vite React entry HTML
   - `<div id="root">` mount point
   - `<script type="module" src="/src/main.tsx">`
   - `<title>` set to game name

2. **`monkey-island-web/vite.config.ts`**
   - `@vitejs/plugin-react`
   - `base: './'` for relative paths (GitHub Pages compatible)

3. **`monkey-island-web/tsconfig.json`**
   - `strict: true`, `jsx: "react-jsx"`, `target: "ES2020"`, `module: "ESNext"`
   - `moduleResolution: "bundler"`, path includes `src`
   - `include: ["src"]`

4. **`monkey-island-web/tsconfig.node.json`**
   - For vite.config.ts -- `include: ["vite.config.ts"]`

5. **`monkey-island-web/src/main.tsx`**
   - ReactDOM.createRoot, render `<App />`

6. **`monkey-island-web/src/App.tsx`**
   - Imports and renders the `<GameCanvas />` component wrapped in a game container div

**Acceptance criteria:**
- `cd monkey-island-web && npm install && npm run dev` starts without errors
- Browser shows a blank page with no console errors
- `npm run build` succeeds with no TypeScript errors

---

### Step 2: Type Definitions + Zustand Game Store

Define all shared types and create the central Zustand store that replaces every `useState` from the prototype.

**Files to create:**

1. **`monkey-island-web/src/engine/types.ts`**
   - `Palette` type (Record<string, string>) with the PALETTE constant exported
   - `Verb` interface: `{ id: string; label: string; icon: string }`
   - `VERBS` constant exported (9 verbs from prototype)
   - `WalkArea` interface: `{ x1: number; y1: number; x2: number; y2: number }`
   - `SceneObject` interface: `{ id: string; name: string; x: number; y: number; w: number; h: number; actions: Record<string, string>; item?: ItemDef }`
   - `Exit` interface: `{ id: string; name: string; to: string; x: number; y: number; w: number; h: number; walkTo: { x: number; y: number } }`
   - `Room` interface: `{ id: string; name: string; render: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; walkArea: WalkArea; objects: SceneObject[]; exits: Exit[] }`
   - `ItemDef` interface: `{ id: string; name: string; icon: string }`
   - `Position` type: `{ x: number; y: number }`
   - `Facing` type: `'left' | 'right'`
   - `PendingAction` type for walk-then-act pattern

2. **`monkey-island-web/src/engine/GameEngine.ts`**
   - Zustand store (`useGameStore`) containing all state from the prototype:
     - `room: string` (current room ID)
     - `playerPos: Position`
     - `targetPos: Position | null`
     - `facing: Facing`
     - `selectedVerb: string`
     - `message: string`
     - `inventory: ItemDef[]`
     - `hoveredObject: string | null`
     - `frame: number`
     - `isMoving: boolean`
     - `pendingAction: PendingAction | null`
     - `cursorAction: string`
   - Actions (store methods):
     - `setRoom(roomId)`, `setPlayerPos(pos)`, `setTargetPos(pos)`, `setFacing(dir)`
     - `setSelectedVerb(verb)`, `setMessage(msg)`, `addInventoryItem(item)`, `setHoveredObject(id)`
     - `incrementFrame()`, `setIsMoving(bool)`, `setPendingAction(action)`, `setCursorAction(text)`
     - `clampToWalkArea(x, y, room): Position` -- utility using room walkArea
     - `executeAction(obj, verb)` -- migrated from prototype
     - `changeRoom(exit)` -- migrated from prototype

**Acceptance criteria:**
- All prototype state variables have typed Zustand equivalents
- Store can be imported and used from any component
- No `useState` needed for game state in components

---

### Step 3: Canvas Rendering -- Room Backgrounds + Character Sprite

Extract all procedural drawing code into dedicated renderer modules.

**Files to create:**

1. **`monkey-island-web/src/engine/CanvasRenderer.ts`**
   - `drawStars(ctx, w, h)` -- migrated from prototype
   - `renderHarbor(ctx, w, h)` -- migrated from prototype (lines 60-147)
   - `renderTavern(ctx, w, h)` -- migrated from prototype (lines 149-229)
   - `drawCharacter(ctx, x, y, facing, frame)` -- migrated from prototype (lines 367-420)
   - `renderScene(ctx, room, gameState)` -- orchestrator that:
     1. Calls room.render(ctx, w, h)
     2. Draws object highlight if hoveredObject is set
     3. Calls drawCharacter at playerPos
   - All functions properly typed with `CanvasRenderingContext2D`

2. **`monkey-island-web/src/utils/canvas.ts`**
   - `CANVAS_W = 800`, `CANVAS_H = 400` constants
   - `getCanvasCoords(e: MouseEvent, canvas: HTMLCanvasElement): { cx, cy, nx, ny }` -- mouse-to-canvas coordinate conversion (extracted from handleCanvasClick/handleCanvasMove)

**Acceptance criteria:**
- Harbor and tavern rooms render identically to the prototype
- Character draws with correct animation bobbing
- Hovered objects get dashed highlight border
- No rendering logic remains in React components

---

### Step 4: Room Data + Scene Manager + Verb System + Inventory + Pathfinding

Create the game logic modules that handle room data, object interactions, and movement.

**Files to create:**

1. **`monkey-island-web/src/data/rooms.ts`**
   - Exports `ROOMS: Record<string, Room>` -- the harbor and tavern room definitions from prototype lines 232-352
   - References render functions from CanvasRenderer
   - All object actions, exits, walkAreas typed per `types.ts`

2. **`monkey-island-web/src/engine/SceneManager.ts`**
   - `getCurrentRoom(): Room` -- looks up current room from store + ROOMS
   - `changeRoom(exit: Exit): void` -- sets new room, calculates entry position, clears movement state, sets arrival message
   - `findObjectAtPoint(cx, cy): SceneObject | null` -- hit testing
   - `findExitAtPoint(cx, cy): Exit | null` -- hit testing

3. **`monkey-island-web/src/engine/VerbSystem.ts`**
   - `executeAction(obj: SceneObject, verbId: string): void` -- looks up action text, handles inventory pickup, fallback messages
   - `getActionLabel(verbId: string, objectName?: string): string` -- cursor action text builder

4. **`monkey-island-web/src/engine/Inventory.ts`**
   - `addItem(item: ItemDef): void` -- adds to store if not duplicate
   - `hasItem(itemId: string): boolean`
   - `getItems(): ItemDef[]`

5. **`monkey-island-web/src/engine/Pathfinding.ts`**
   - `clampToWalkArea(x, y, walkArea: WalkArea): Position` -- the simple rectangular clamp from prototype
   - `calculateWalkTarget(objectPos, walkArea): Position` -- walk-to position for object interaction

**Acceptance criteria:**
- Room data matches prototype exactly (all objects, exits, actions, items)
- Verb + object produces same messages as prototype
- Inventory pickup works for barrel (grog) and mug
- Walk area clamping behaves identically

---

### Step 5: React Components -- GameCanvas, VerbPanel, InventoryBar, MessageBar

Build the UI layer as thin React components that read from Zustand and delegate logic to engine modules.

**Files to create:**

1. **`monkey-island-web/src/components/GameCanvas.tsx`**
   - Owns the `<canvas>` element with ref
   - `useEffect` for animation loop (incrementFrame every 100ms)
   - `useEffect` for movement interpolation (30ms interval, same speed=0.012 logic)
   - `useEffect` for rendering (calls `renderScene` from CanvasRenderer)
   - `onClick` handler: checks exits, objects, then walk-to-point (uses SceneManager + Pathfinding)
   - `onMouseMove` handler: updates hoveredObject + cursorAction
   - Reads all needed state from `useGameStore`
   - Canvas styled with `imageRendering: pixelated`, responsive width

2. **`monkey-island-web/src/components/VerbPanel.tsx`**
   - 3x3 grid of verb buttons
   - Highlights selected verb
   - Hover effects matching prototype styling
   - Reads `selectedVerb` and calls `setSelectedVerb` from store

3. **`monkey-island-web/src/components/InventoryBar.tsx`**
   - Displays inventory items in 3-column grid
   - Shows "(empty)" when no items
   - Each item shows icon + name
   - Reads `inventory` from store

4. **`monkey-island-web/src/components/MessageBar.tsx`**
   - Displays current message text
   - Styled with dark background, green text per prototype

5. **Update `monkey-island-web/src/App.tsx`**
   - Compose the full game layout:
     - Title bar (game name + current room name)
     - Action text bar (cursorAction or selected verb)
     - GameCanvas
     - Bottom panel: VerbPanel (55% width) + InventoryBar (45% width)
     - MessageBar
   - All styling matches prototype (PALETTE colors, border, font family, max-width 820px)

**Acceptance criteria:**
- Visual layout is pixel-identical to the prototype
- All 9 verb buttons work, selection highlights correctly
- Inventory displays picked-up items with icons
- Messages appear in the bottom bar
- Canvas is responsive (scales with container width)

---

### Step 6: Integration Testing + Feature Parity Verification

Verify the migrated project matches prototype behavior end-to-end.

**Verification checklist (manual):**

- [ ] `npm run dev` starts, game loads in browser
- [ ] Harbor room renders correctly (sky, stars, moon, sea, dock, ship, sign, barrel, torch)
- [ ] Tavern room renders correctly (walls, floor, bar, bottles, chandelier, table, mug, map, door)
- [ ] Guybrush character renders with animation bob when walking
- [ ] Click to walk: character moves to clicked point within walk area
- [ ] Walk area clamping: cannot walk outside defined bounds
- [ ] Verb selection: all 9 verbs selectable, visual highlight updates
- [ ] Object interaction: "Look at sign" shows description, "Open barrel" shows spider text
- [ ] Walk-then-act: character walks to object, then executes action on arrival
- [ ] Inventory: "Pick up" barrel gives grog, "Pick up" mug gives mug item
- [ ] Inventory display: items appear with icons in inventory panel
- [ ] Room transition: walk to left edge of harbor enters tavern
- [ ] Room transition: walk through door in tavern returns to harbor
- [ ] Entry positions correct after room change
- [ ] Fallback messages: invalid verb+object combos show random Korean fallback text
- [ ] Hover highlight: dashed border appears around objects on mouseover
- [ ] Cursor action text updates on hover (verb + object name)
- [ ] Title bar shows current room name
- [ ] `npm run build` produces clean build with no errors

**Acceptance criteria:**
- All checklist items pass
- No TypeScript errors or warnings
- No console errors in browser
- Build output is deployable

---

## Success Criteria

1. `npm run dev` launches a playable game identical to the prototype
2. Zero `useState` for game state -- all managed by Zustand
3. Codebase is modular: ~15 files, each under 150 lines, single responsibility
4. TypeScript strict mode with no type errors
5. `npm run build` succeeds and produces a static bundle

---

## File Summary

| # | File | Purpose | Source Lines (approx) |
|---|------|---------|-----------------------|
| 1 | `index.html` | Vite entry HTML | new |
| 2 | `vite.config.ts` | Build configuration | new |
| 3 | `tsconfig.json` | TypeScript config | new |
| 4 | `tsconfig.node.json` | Node TS config | new |
| 5 | `src/main.tsx` | React mount | new |
| 6 | `src/App.tsx` | Game layout shell | new (~120 lines) |
| 7 | `src/engine/types.ts` | Type defs + constants | extracted (~80 lines) |
| 8 | `src/engine/GameEngine.ts` | Zustand store | extracted (~100 lines) |
| 9 | `src/engine/CanvasRenderer.ts` | All drawing functions | migrated (~230 lines) |
| 10 | `src/engine/SceneManager.ts` | Room lookup, hit testing | extracted (~60 lines) |
| 11 | `src/engine/VerbSystem.ts` | Action execution | extracted (~40 lines) |
| 12 | `src/engine/Inventory.ts` | Inventory operations | extracted (~25 lines) |
| 13 | `src/engine/Pathfinding.ts` | Walk area clamping | extracted (~20 lines) |
| 14 | `src/data/rooms.ts` | Room definitions | migrated (~130 lines) |
| 15 | `src/components/GameCanvas.tsx` | Canvas + input handling | migrated (~120 lines) |
| 16 | `src/components/VerbPanel.tsx` | Verb buttons UI | extracted (~60 lines) |
| 17 | `src/components/InventoryBar.tsx` | Inventory display | extracted (~50 lines) |
| 18 | `src/components/MessageBar.tsx` | Message display | extracted (~25 lines) |
| 19 | `src/utils/canvas.ts` | Canvas utilities | extracted (~20 lines) |

**Total: 19 files, ~6 steps, estimated ~1100 lines of TypeScript**
