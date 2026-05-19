import { PALETTE, CANVAS_W, CANVAS_H } from './types';
import type { NPC } from './types';
import { drawCharacter } from '../utils/canvas';
import { getRoom } from './RoomLoader';
import { getImage } from '../utils/assetLoader';
import { drawCharacterSprite, type AnimationState } from '../utils/spriteAnimator';
import { getScaleAt } from './DepthSystem';

export function renderScene(
  ctx: CanvasRenderingContext2D,
  roomId: string,
  playerPos: { x: number; y: number },
  facing: 'left' | 'right',
  isMoving: boolean,
  hoveredObject: string | null,
  dialogueActive: boolean = false,
  elapsedMs: number = 0,
  playerSprite: string = 'guybrush',
  dialogueNpcId: string | null = null,
  animState?: AnimationState,
) {
  const room = getRoom(roomId);
  if (!room) return;

  ctx.imageSmoothingEnabled = false;

  // Draw room background (image if available, else procedural)
  const bgImg = getImage(`/assets/backgrounds/${roomId}.png`);
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, CANVAS_W, CANVAS_H);
  } else {
    room.render(ctx, CANVAS_W, CANVAS_H);
  }

  // Draw NPCs (with depth-based scaling)
  if (room.npcs) {
    for (const npc of room.npcs) {
      const npcScale = getScaleAt(roomId, npc.x, npc.y);
      const isTalking = npc.id === dialogueNpcId;
      const autoFacing: 'left' | 'right' = npc.x > playerPos.x ? 'left' : 'right';
      const npcFacing = npc.facing ?? autoFacing;
      renderNPC(ctx, npc, elapsedMs, npcScale, isTalking, npcFacing);
    }
  }

  // Highlight hovered object
  if (hoveredObject) {
    const obj =
      room.objects.find((o) => o.id === hoveredObject) ||
      room.exits.find((e) => e.id === hoveredObject) ||
      room.npcs?.find((n) => n.id === hoveredObject);
    if (obj) {
      ctx.strokeStyle = PALETTE.uiVerbActive;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      if ('w' in obj && 'h' in obj) {
        ctx.strokeRect(
          obj.x * CANVAS_W - 2,
          obj.y * CANVAS_H - 2,
          ((obj as { w: number }).w || 30) + 4,
          ((obj as { h: number }).h || 30) + 4,
        );
      } else {
        // NPC highlight
        ctx.strokeRect(
          obj.x * CANVAS_W - 20,
          obj.y * CANVAS_H - 80,
          40,
          90,
        );
      }
      ctx.setLineDash([]);
    }
  }

  // Draw character (with depth-based perspective scaling)
  const charScale = getScaleAt(roomId, playerPos.x, playerPos.y);

  const resolvedAnim: AnimationState = animState ?? (dialogueActive ? 'talk' : isMoving ? 'walk' : 'idle');

  const drewSprite = drawCharacterSprite(
    ctx,
    playerSprite,
    playerPos.x * CANVAS_W,
    playerPos.y * CANVAS_H,
    facing,
    resolvedAnim,
    elapsedMs,
    charScale,
  );

  if (!drewSprite) {
    // Procedural fallback: derive a simple counter-based frame from elapsed time
    const fallbackFrame = isMoving ? Math.floor(elapsedMs / 150) % 4 : 0;
    drawCharacter(
      ctx,
      playerPos.x * CANVAS_W,
      playerPos.y * CANVAS_H,
      facing,
      fallbackFrame,
      charScale,
    );
  }

  // Dim scene when dialogue is active
  if (dialogueActive) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

// Per-sprite body colors for procedural fallback
const NPC_COLORS: Record<string, { body: string; head: string }> = {
  guybrush:      { body: PALETTE.shirt,  head: PALETTE.skin },
  lechuck:       { body: '#1a0a2e',      head: '#4a3060' },
  elaine:        { body: '#8b0000',      head: PALETTE.skin },
  bartender:     { body: '#2d4a1e',      head: PALETTE.skin },
  voodoo_lady:   { body: '#4a0e6e',      head: '#7a5c8a' },
  three_pirates: { body: '#3d2b00',      head: PALETTE.skin },
  carla:         { body: '#b22222',      head: PALETTE.skin },
  stan:          { body: '#e0c030',      head: PALETTE.skin },
  sheriff:       { body: '#1a3a5c',      head: PALETTE.skin },
  otis:          { body: '#5c5c5c',      head: PALETTE.skin },
  mansion_guard: { body: '#2c2c6e',      head: PALETTE.skin },
};

function renderNPC(
  ctx: CanvasRenderingContext2D,
  npc: NPC,
  elapsedMs: number,
  scale: number = 1.0,
  isTalking: boolean = false,
  facing: 'left' | 'right' = 'right',
) {
  const px = npc.x * CANVAS_W;
  const py = npc.y * CANVAS_H;

  const npcAnimState: AnimationState = isTalking ? 'talk' : 'idle';
  const drewNpc = drawCharacterSprite(ctx, npc.sprite, px, py, facing, npcAnimState, elapsedMs, scale);
  if (drewNpc) return;

  // Procedural NPC fallback
  const s = 3 * scale;
  const bobY = isTalking
    ? Math.sin(elapsedMs * 0.012) * 1.5
    : Math.sin(elapsedMs * 0.004) * 1;

  const colors = NPC_COLORS[npc.sprite] ?? { body: '#555', head: PALETTE.skin };

  ctx.save();
  if (facing === 'left') {
    ctx.translate(px * 2, 0);
    ctx.scale(-1, 1);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14 * s, 6 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = colors.body;
  ctx.fillRect(px - 4 * s, py - 2 * s + bobY, 8 * s, 14 * s);

  // Head
  ctx.fillStyle = colors.head;
  ctx.fillRect(px - 3 * s, py - 8 * s + bobY, 6 * s, 6 * s);

  // Eyes
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(px - 1.5 * s, py - 6 * s + bobY, 1.2 * s, 1.5 * s);
  ctx.fillRect(px + 0.5 * s, py - 6 * s + bobY, 1.2 * s, 1.5 * s);

  // Talking mouth
  if (isTalking) {
    const mouthOpen = Math.sin(elapsedMs * 0.015) > 0;
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(px - 1.2 * s, py - 3.5 * s + bobY, 2.4 * s, mouthOpen ? 1.5 * s : 0.5 * s);
  }

  ctx.restore();

  // Name tag above NPC
  ctx.fillStyle = PALETTE.uiText;
  ctx.font = `bold ${Math.round(16 * scale)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, px, py - 10 * s + bobY);
  ctx.textAlign = 'start';
}
