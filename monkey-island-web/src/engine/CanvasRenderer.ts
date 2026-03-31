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
      renderNPC(ctx, npc, elapsedMs, npcScale);
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

  const animState: AnimationState = dialogueActive ? 'talk' : isMoving ? 'walk' : 'idle';

  const drewSprite = drawCharacterSprite(
    ctx,
    'guybrush',
    playerPos.x * CANVAS_W,
    playerPos.y * CANVAS_H,
    facing,
    animState,
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

function renderNPC(
  ctx: CanvasRenderingContext2D,
  npc: NPC,
  elapsedMs: number,
  scale: number = 1.0,
) {
  const px = npc.x * CANVAS_W;
  const py = npc.y * CANVAS_H;

  // Try animated sprite via spriteAnimator
  const npcFacing = (npc as any).facing ?? 'right';
  const drewNpc = drawCharacterSprite(ctx, npc.sprite, px, py, npcFacing, 'idle', elapsedMs, scale);
  if (drewNpc) return;

  // Procedural NPC fallback
  const s = 3 * scale;
  const bobY = Math.sin(elapsedMs * 0.004) * 1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14 * s, 6 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#555';
  ctx.fillRect(px - 4 * s, py - 2 * s + bobY, 8 * s, 14 * s);

  // Head
  ctx.fillStyle = PALETTE.skin;
  ctx.fillRect(px - 3 * s, py - 8 * s + bobY, 6 * s, 6 * s);

  // Eyes
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(px - 1.5 * s, py - 6 * s + bobY, 1.2 * s, 1.5 * s);
  ctx.fillRect(px + 0.5 * s, py - 6 * s + bobY, 1.2 * s, 1.5 * s);

  // Name tag above NPC
  ctx.fillStyle = PALETTE.uiText;
  ctx.font = `bold ${Math.round(16 * scale)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, px, py - 10 * s + bobY);
  ctx.textAlign = 'start';
}
