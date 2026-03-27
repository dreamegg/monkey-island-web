import type { Position, WalkArea } from './types';
import { isWalkableAt, nearestWalkablePoint, hasDepthConfig } from './DepthSystem';

/**
 * Clamp a position to the walkable area.
 * If a depth-based polygon config exists for the room, uses that;
 * otherwise falls back to the legacy rectangle walkArea.
 */
export function clampToWalkArea(
  pos: Position,
  walkArea: WalkArea,
  roomId?: string,
): Position {
  // Prefer polygon walk area from depth analysis
  if (roomId && hasDepthConfig(roomId)) {
    if (isWalkableAt(roomId, pos.x, pos.y)) return pos;
    return nearestWalkablePoint(roomId, pos.x, pos.y);
  }

  // Legacy rectangle fallback
  return {
    x: Math.max(walkArea.x1, Math.min(walkArea.x2, pos.x)),
    y: Math.max(walkArea.y1, Math.min(walkArea.y2, pos.y)),
  };
}
