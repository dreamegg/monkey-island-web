import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../engine/GameEngine';
import { renderScene } from '../engine/CanvasRenderer';
import { hitTest, getHoverTarget, getVerbLabel } from '../engine/SceneManager';
import { clampToWalkArea } from '../engine/Pathfinding';
import { CANVAS_W, CANVAS_H } from '../engine/types';
import { getRoom } from '../engine/RoomLoader';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const roomId = useGameStore((s) => s.roomId);
  const playerPos = useGameStore((s) => s.playerPos);
  const facing = useGameStore((s) => s.facing);
  const isMoving = useGameStore((s) => s.isMoving);
  const frame = useGameStore((s) => s.frame);
  const hoveredObject = useGameStore((s) => s.hoveredObject);
  const selectedVerb = useGameStore((s) => s.selectedVerb);
  const dialogueActive = useGameStore((s) => s.dialogueActive);

  const tickFrame = useGameStore((s) => s.tickFrame);
  const tickMovement = useGameStore((s) => s.tickMovement);
  const walkTo = useGameStore((s) => s.walkTo);
  const useExit = useGameStore((s) => s.useExit);
  const interactWithObject = useGameStore((s) => s.interactWithObject);
  const setHoveredObject = useGameStore((s) => s.setHoveredObject);
  const setCursorAction = useGameStore((s) => s.setCursorAction);
  const setPendingAction = useGameStore((s) => s.setPendingAction);
  const moveByKey = useGameStore((s) => s.moveByKey);
  const startDialogue = useGameStore((s) => s.startDialogue);
  const setMessage = useGameStore((s) => s.setMessage);

  // WASD keyboard movement
  useEffect(() => {
    const keys = new Set<string>();
    const STEP = 0.015;

    const tick = setInterval(() => {
      if (useGameStore.getState().dialogueActive) return;
      let dx = 0;
      let dy = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) dx -= STEP;
      if (keys.has('d') || keys.has('ArrowRight')) dx += STEP;
      if (keys.has('w') || keys.has('ArrowUp')) dy -= STEP;
      if (keys.has('s') || keys.has('ArrowDown')) dy += STEP;
      if (dx !== 0 || dy !== 0) moveByKey(dx, dy);
    }, 30);

    const onDown = (e: KeyboardEvent) => {
      if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keys.add(e.key);
      }
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.key);

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      clearInterval(tick);
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [moveByKey]);

  // Animation frame tick
  useEffect(() => {
    const id = setInterval(tickFrame, 100);
    return () => clearInterval(id);
  }, [tickFrame]);

  // Movement tick
  useEffect(() => {
    const id = setInterval(tickMovement, 30);
    return () => clearInterval(id);
  }, [tickMovement]);

  // Render scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderScene(ctx, roomId, playerPos, facing, isMoving, frame, hoveredObject, dialogueActive);
  }, [frame, roomId, playerPos, facing, isMoving, hoveredObject, dialogueActive]);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;
      return { cx, cy, nx: cx / CANVAS_W, ny: cy / CANVAS_H };
    },
    [],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dialogueActive) return;

      const coords = getCanvasCoords(e);
      if (!coords) return;
      const { cx, cy, nx, ny } = coords;

      const hit = hitTest(roomId, cx, cy);

      if (hit?.type === 'exit' && hit.exit) {
        useExit(hit.exit.id);
        return;
      }

      if (hit?.type === 'npc' && hit.npc) {
        const npc = hit.npc;
        const verb = useGameStore.getState().selectedVerb;
        if (verb === 'talk' || verb === 'look') {
          if (verb === 'look' && npc.actions.look) {
            const lookAction = npc.actions.look;
            if (typeof lookAction === 'string') setMessage(lookAction);
          } else {
            startDialogue(npc.dialogue);
          }
        } else {
          // Default: start dialogue for any verb on NPC
          startDialogue(npc.dialogue);
        }
        return;
      }

      if (hit?.type === 'object' && hit.object) {
        interactWithObject(hit.object.id);
        setCursorAction(`${getVerbLabel(selectedVerb)} ${hit.object.name}`);
        return;
      }

      // Walk to point
      const room = getRoom(roomId);
      if (!room) return;
      const clamped = clampToWalkArea({ x: nx, y: ny }, room.walkArea);
      walkTo(clamped);
      setPendingAction(null);
      setCursorAction('');
    },
    [roomId, selectedVerb, dialogueActive, getCanvasCoords, useExit, interactWithObject, walkTo, setPendingAction, setCursorAction, startDialogue, setMessage],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dialogueActive) return;

      const coords = getCanvasCoords(e);
      if (!coords) return;
      const { cx, cy } = coords;

      const target = getHoverTarget(roomId, cx, cy);
      if (target) {
        setHoveredObject(target.id);
        setCursorAction(`${getVerbLabel(selectedVerb)} ${target.name}`);
      } else {
        setHoveredObject(null);
        setCursorAction('');
      }
    },
    [roomId, selectedVerb, dialogueActive, getCanvasCoords, setHoveredObject, setCursorAction],
  );

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      style={{
        width: '100%',
        display: 'block',
        cursor: hoveredObject ? 'pointer' : 'crosshair',
        imageRendering: 'pixelated',
      }}
    />
  );
}
