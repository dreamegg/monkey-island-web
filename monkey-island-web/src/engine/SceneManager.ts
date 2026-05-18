import { getRoom } from './RoomLoader';
import { CANVAS_W, CANVAS_H, VERBS } from './types';
import type { SceneObject, Exit, VerbId, NPC } from './types';
import { useGameStore } from './GameEngine';

export interface HitTestResult {
  type: 'object' | 'exit' | 'npc';
  object?: SceneObject;
  exit?: Exit;
  npc?: NPC;
}

const NPC_HIT_W = 40;
const NPC_HIT_H = 90;

function getVisibleObjects(roomId: string): SceneObject[] {
  const room = getRoom(roomId);
  if (!room) return [];
  const pickedObjects = useGameStore.getState().pickedObjects;
  return room.objects.filter((o) => !pickedObjects.includes(o.id));
}

export function hitTest(
  roomId: string,
  canvasX: number,
  canvasY: number,
): HitTestResult | null {
  const room = getRoom(roomId);
  if (!room) return null;

  // NPCs first (priority over objects)
  if (room.npcs) {
    for (const npc of room.npcs) {
      const nx = npc.x * CANVAS_W - NPC_HIT_W / 2;
      const ny = npc.y * CANVAS_H - NPC_HIT_H;
      if (
        canvasX >= nx &&
        canvasX <= nx + NPC_HIT_W &&
        canvasY >= ny &&
        canvasY <= ny + NPC_HIT_H
      ) {
        return { type: 'npc', npc };
      }
    }
  }

  // Exits
  for (const exit of room.exits) {
    if (
      canvasX >= exit.x * CANVAS_W &&
      canvasX <= exit.x * CANVAS_W + exit.w &&
      canvasY >= exit.y * CANVAS_H &&
      canvasY <= exit.y * CANVAS_H + exit.h
    ) {
      return { type: 'exit', exit };
    }
  }

  // Objects (filter picked-up ones)
  for (const obj of getVisibleObjects(roomId)) {
    if (
      canvasX >= obj.x * CANVAS_W &&
      canvasX <= obj.x * CANVAS_W + obj.w &&
      canvasY >= obj.y * CANVAS_H &&
      canvasY <= obj.y * CANVAS_H + obj.h
    ) {
      return { type: 'object', object: obj };
    }
  }

  return null;
}

export function getHoverTarget(
  roomId: string,
  canvasX: number,
  canvasY: number,
): { id: string; name: string } | null {
  const room = getRoom(roomId);
  if (!room) return null;

  // NPCs
  if (room.npcs) {
    for (const npc of room.npcs) {
      const nx = npc.x * CANVAS_W - NPC_HIT_W / 2;
      const ny = npc.y * CANVAS_H - NPC_HIT_H;
      if (
        canvasX >= nx &&
        canvasX <= nx + NPC_HIT_W &&
        canvasY >= ny &&
        canvasY <= ny + NPC_HIT_H
      ) {
        return { id: npc.id, name: npc.name };
      }
    }
  }

  const visibleObjects = getVisibleObjects(roomId);
  const allTargets = [
    ...visibleObjects.map((o) => ({ ...o, w: o.w || 30, h: o.h || 30 })),
    ...room.exits.map((e) => ({ ...e, w: e.w || 30, h: e.h || 30 })),
  ];

  for (const target of allTargets) {
    if (
      canvasX >= target.x * CANVAS_W &&
      canvasX <= target.x * CANVAS_W + target.w &&
      canvasY >= target.y * CANVAS_H &&
      canvasY <= target.y * CANVAS_H + target.h
    ) {
      return { id: target.id, name: target.name };
    }
  }

  return null;
}

export function getVerbLabel(verbId: VerbId): string {
  return VERBS.find((v) => v.id === verbId)?.label ?? '';
}
