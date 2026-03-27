import type { Room, WalkArea, SceneObject, Exit, NPC } from './types';
import { ROOMS as TS_ROOMS } from '../data/rooms';

// JSON schema for /public/rooms/{roomId}.json
export interface RoomJson {
  id: string;
  name: string;
  walkArea: WalkArea;
  objects: SceneObject[];
  exits: Exit[];
  npcs?: NPC[];
}

// Unified registry — initialized with all TypeScript rooms
const registry: Record<string, Room> = { ...TS_ROOMS };

export function getRoom(roomId: string): Room | undefined {
  return registry[roomId];
}

export function getAllRooms(): Record<string, Room> {
  return { ...registry };
}

// Load a JSON room from /public/rooms/{roomId}.json.
// Overrides any existing entry (including TypeScript rooms) when found.
export async function loadJsonRoom(roomId: string): Promise<Room | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}rooms/${roomId}.json`);
    if (!res.ok) return null;
    const data: RoomJson = await res.json();
    const room = jsonToRoom(data);
    registry[roomId] = room;
    return room;
  } catch {
    return null;
  }
}

// Attempt to load JSON versions for multiple rooms in parallel.
// Silently skips rooms that have no JSON file.
export async function preloadJsonRooms(roomIds: string[]): Promise<void> {
  await Promise.all(roomIds.map(loadJsonRoom));
}

function jsonToRoom(data: RoomJson): Room {
  return {
    id: data.id,
    name: data.name,
    walkArea: data.walkArea,
    objects: data.objects,
    exits: data.exits,
    npcs: data.npcs,
    // JSON rooms rely on background images loaded by CanvasRenderer.
    // This procedural fallback is used only when no image is available.
    render: (ctx, w, h) => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffd54f44';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(data.name, w / 2, h / 2);
      ctx.textAlign = 'start';
    },
  };
}
