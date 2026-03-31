import { useState, useEffect, useRef, useCallback } from 'react';
import { S } from '../shared/styles';
import { getAllRooms } from '../../engine/RoomLoader';
import { PALETTE, CANVAS_W, CANVAS_H, VERBS } from '../../engine/types';
import type { SceneObject, Exit, NPC, WalkArea, Script, VerbId } from '../../engine/types';
import {
  getRoomConfig,
  getScaleAt,
  getWalkPolygon,
  hasDepthConfig,
} from '../../engine/DepthSystem';
import {
  getSegmentation,
  getObjectCandidates,
} from '../../engine/SegmentationSystem';
import { getImage, loadImage } from '../../utils/assetLoader';
import { ap } from '../../utils/paths';

const ROOMS = getAllRooms();

// ── Types ────────────────────────────────────────────────────

type ElementRef =
  | { type: 'object'; id: string }
  | { type: 'exit'; id: string }
  | { type: 'npc'; id: string }
  | { type: 'walkVertex'; index: number };

type EditMode = 'select' | 'addObject' | 'addExit' | 'addNpc';

interface RoomDraft {
  id: string;
  name: string;
  walkArea: WalkArea;
  objects: SceneObject[];
  exits: Exit[];
  npcs: NPC[];
}

function roomToDraft(roomId: string): RoomDraft {
  const room = ROOMS[roomId];
  return {
    id: room.id,
    name: room.name,
    walkArea: { ...room.walkArea },
    objects: room.objects.map((o) => ({ ...o, actions: { ...o.actions }, item: o.item ? { ...o.item } : undefined })),
    exits: room.exits.map((e) => ({ ...e, walkTo: { ...e.walkTo } })),
    npcs: (room.npcs ?? []).map((n) => ({ ...n, actions: { ...n.actions } })),
  };
}

// ── History (undo/redo) ──────────────────────────────────────

function useHistory(initial: RoomDraft) {
  const [past, setPast] = useState<RoomDraft[]>([]);
  const [present, setPresent] = useState<RoomDraft>(initial);
  const [future, setFuture] = useState<RoomDraft[]>([]);

  const commit = useCallback((next: RoomDraft) => {
    setPast((p) => [...p.slice(-30), present]);
    setPresent(next);
    setFuture([]);
  }, [present]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    setFuture((f) => [present, ...f]);
    setPresent(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    setPast((p) => [...p, present]);
    setPresent(future[0]);
    setFuture((f) => f.slice(1));
  }, [future, present]);

  const reset = useCallback((draft: RoomDraft) => {
    setPast([]);
    setPresent(draft);
    setFuture([]);
  }, []);

  return { draft: present, commit, undo, redo, reset, canUndo: past.length > 0, canRedo: future.length > 0 };
}

// ── Main Panel ───────────────────────────────────────────────

export default function RoomEditorPanel() {
  const roomIds = Object.keys(ROOMS);
  const [selectedRoom, setSelectedRoom] = useState(roomIds[0]);
  const { draft, commit, undo, redo, reset, canUndo, canRedo } = useHistory(roomToDraft(roomIds[0]));

  const [overlays, setOverlays] = useState({
    walkArea: true,
    objects: true,
    exits: true,
    npcs: true,
    depthMap: false,
    segmentation: false,
    scalePreview: false,
    grid: false,
  });
  const [selected, setSelected] = useState<ElementRef | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('select');
  const [mousePos, setMousePos] = useState<{ nx: number; ny: number } | null>(null);
  const [dragging, setDragging] = useState<{ ref: ElementRef; startNx: number; startNy: number; origX: number; origY: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const room = ROOMS[selectedRoom];

  // Room change
  useEffect(() => {
    setSelected(null);
    setEditMode('select');
    reset(roomToDraft(selectedRoom));
    loadImage(ap(`/room-configs/${selectedRoom}_depth.png`)).catch(() => {});
  }, [selectedRoom, reset]);

  const toggleOverlay = (key: keyof typeof overlays) =>
    setOverlays((o) => ({ ...o, [key]: !o[key] }));

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selected && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleDelete();
        }
      }
      if (e.key === 'Escape') { setSelected(null); setEditMode('select'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selected, draft]);

  // ── Hit testing ────────────────────────────────────────────

  function hitTest(cx: number, cy: number): ElementRef | null {
    // Walk area vertices first (small targets, high priority)
    const polygon = getWalkPolygon(selectedRoom);
    if (polygon && overlays.walkArea) {
      for (let i = 0; i < polygon.length; i++) {
        const vx = polygon[i][0] * CANVAS_W, vy = polygon[i][1] * CANVAS_H;
        if (Math.abs(cx - vx) < 8 && Math.abs(cy - vy) < 8) {
          return { type: 'walkVertex', index: i };
        }
      }
    }
    // NPCs
    for (const npc of draft.npcs) {
      if (cx >= npc.x * CANVAS_W - 20 && cx <= npc.x * CANVAS_W + 20 &&
          cy >= npc.y * CANVAS_H - 80 && cy <= npc.y * CANVAS_H + 10) {
        return { type: 'npc', id: npc.id };
      }
    }
    // Objects
    for (const obj of draft.objects) {
      if (cx >= obj.x * CANVAS_W && cx <= obj.x * CANVAS_W + obj.w &&
          cy >= obj.y * CANVAS_H && cy <= obj.y * CANVAS_H + obj.h) {
        return { type: 'object', id: obj.id };
      }
    }
    // Exits
    for (const exit of draft.exits) {
      if (cx >= exit.x * CANVAS_W && cx <= exit.x * CANVAS_W + exit.w &&
          cy >= exit.y * CANVAS_H && cy <= exit.y * CANVAS_H + exit.h) {
        return { type: 'exit', id: exit.id };
      }
    }
    return null;
  }

  // ── Mouse handlers ─────────────────────────────────────────

  const toCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      cx: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      cy: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
      nx: (e.clientX - rect.left) / rect.width,
      ny: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { cx, cy, nx, ny } = toCanvas(e);

    if (editMode !== 'select') {
      handleAddElement(nx, ny);
      return;
    }

    const hit = hitTest(cx, cy);
    setSelected(hit);

    if (hit) {
      if (hit.type === 'object') {
        const obj = draft.objects.find((o) => o.id === hit.id)!;
        setDragging({ ref: hit, startNx: nx, startNy: ny, origX: obj.x, origY: obj.y });
      } else if (hit.type === 'exit') {
        const exit = draft.exits.find((ex) => ex.id === hit.id)!;
        setDragging({ ref: hit, startNx: nx, startNy: ny, origX: exit.x, origY: exit.y });
      } else if (hit.type === 'npc') {
        const npc = draft.npcs.find((n) => n.id === hit.id)!;
        setDragging({ ref: hit, startNx: nx, startNy: ny, origX: npc.x, origY: npc.y });
      }
    }
  }, [editMode, draft, selectedRoom, overlays.walkArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { nx, ny } = toCanvas(e);
    setMousePos({ nx, ny });

    if (!dragging) return;
    const dx = nx - dragging.startNx;
    const dy = ny - dragging.startNy;
    const newX = Math.max(0, Math.min(1, dragging.origX + dx));
    const newY = Math.max(0, Math.min(1, dragging.origY + dy));

    // Live preview (mutate draft directly for smooth drag, commit on mouseUp)
    const ref = dragging.ref;
    if (ref.type === 'object') {
      const obj = draft.objects.find((o) => o.id === ref.id);
      if (obj) { obj.x = newX; obj.y = newY; }
    } else if (ref.type === 'exit') {
      const exit = draft.exits.find((ex) => ex.id === ref.id);
      if (exit) { exit.x = newX; exit.y = newY; }
    } else if (ref.type === 'npc') {
      const npc = draft.npcs.find((n) => n.id === ref.id);
      if (npc) { npc.x = newX; npc.y = newY; }
    }
  }, [dragging, draft]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      // Commit the final position
      commit({ ...draft, objects: [...draft.objects], exits: [...draft.exits], npcs: [...draft.npcs] });
      setDragging(null);
    }
  }, [dragging, draft, commit]);

  // ── Add/Delete ─────────────────────────────────────────────

  function handleAddElement(nx: number, ny: number) {
    const next = { ...draft };
    if (editMode === 'addObject') {
      const id = `obj_${Date.now()}`;
      next.objects = [...draft.objects, {
        id, name: '새 오브젝트', x: nx, y: ny, w: 60, h: 60,
        actions: { look: '흥미로운 물건이다.' },
      }];
      setSelected({ type: 'object', id });
    } else if (editMode === 'addExit') {
      const id = `exit_${Date.now()}`;
      next.exits = [...draft.exits, {
        id, name: '새 출구', to: '', x: nx, y: ny, w: 80, h: 120,
        walkTo: { x: nx, y: ny },
      }];
      setSelected({ type: 'exit', id });
    } else if (editMode === 'addNpc') {
      const id = `npc_${Date.now()}`;
      next.npcs = [...draft.npcs, {
        id, name: '새 NPC', x: nx, y: ny, sprite: '', dialogue: '',
        actions: { talk: '...' },
      }];
      setSelected({ type: 'npc', id });
    }
    commit(next);
    setEditMode('select');
  }

  function handleDelete() {
    if (!selected || selected.type === 'walkVertex') return;
    const next = { ...draft };
    if (selected.type === 'object') next.objects = draft.objects.filter((o) => o.id !== selected.id);
    else if (selected.type === 'exit') next.exits = draft.exits.filter((e) => e.id !== selected.id);
    else if (selected.type === 'npc') next.npcs = draft.npcs.filter((n) => n.id !== selected.id);
    commit(next);
    setSelected(null);
  }

  // ── Property update ────────────────────────────────────────

  function updateObject(id: string, patch: Partial<SceneObject>) {
    const next = {
      ...draft,
      objects: draft.objects.map((o) => o.id === id ? { ...o, ...patch } : o),
    };
    commit(next);
  }

  function updateExit(id: string, patch: Partial<Exit>) {
    const next = {
      ...draft,
      exits: draft.exits.map((e) => e.id === id ? { ...e, ...patch } : e),
    };
    commit(next);
  }

  function updateNpc(id: string, patch: Partial<NPC>) {
    const next = {
      ...draft,
      npcs: draft.npcs.map((n) => n.id === id ? { ...n, ...patch } : n),
    };
    commit(next);
  }

  // ── JSON Export ────────────────────────────────────────────

  function exportJson() {
    const json = {
      id: draft.id,
      name: draft.name,
      walkArea: draft.walkArea,
      objects: draft.objects,
      exits: draft.exits,
      npcs: draft.npcs.length > 0 ? draft.npcs : undefined,
    };
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Canvas render ──────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !room) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Background
    const bgImg = getImage(`/assets/backgrounds/${selectedRoom}.png`);
    if (bgImg) ctx.drawImage(bgImg, 0, 0, CANVAS_W, CANVAS_H);
    else room.render(ctx, CANVAS_W, CANVAS_H);

    // Grid
    if (overlays.grid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
      for (let y = 0; y < CANVAS_H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px monospace';
      for (let x = 0; x < CANVAS_W; x += 160) {
        for (let y = 0; y < CANVAS_H; y += 160) {
          ctx.fillText(`${(x/CANVAS_W).toFixed(2)},${(y/CANVAS_H).toFixed(2)}`, x + 2, y + 12);
        }
      }
    }

    // Walk area
    if (overlays.walkArea) {
      const polygon = getWalkPolygon(selectedRoom);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
      ctx.lineWidth = 2;
      if (polygon && polygon.length > 2) {
        ctx.beginPath();
        ctx.moveTo(polygon[0][0] * CANVAS_W, polygon[0][1] * CANVAS_H);
        for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i][0] * CANVAS_W, polygon[i][1] * CANVAS_H);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        polygon.forEach(([x, y], i) => {
          const isSelected = selected?.type === 'walkVertex' && selected.index === i;
          ctx.fillStyle = isSelected ? '#ff0' : '#0f0';
          const sz = isSelected ? 5 : 3;
          ctx.fillRect(x * CANVAS_W - sz, y * CANVAS_H - sz, sz * 2, sz * 2);
        });
      } else {
        const wa = draft.walkArea;
        const rx = wa.x1 * CANVAS_W, ry = wa.y1 * CANVAS_H;
        const rw = (wa.x2 - wa.x1) * CANVAS_W, rh = (wa.y2 - wa.y1) * CANVAS_H;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      }
    }

    // Objects
    if (overlays.objects) {
      draft.objects.forEach((obj) => {
        const ox = obj.x * CANVAS_W, oy = obj.y * CANVAS_H;
        const isSel = selected?.type === 'object' && selected.id === obj.id;
        ctx.strokeStyle = isSel ? '#fff' : 'rgba(255, 200, 0, 0.9)';
        ctx.fillStyle = isSel ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 200, 0, 0.2)';
        ctx.lineWidth = isSel ? 3 : 2;
        ctx.fillRect(ox, oy, obj.w, obj.h);
        ctx.strokeRect(ox, oy, obj.w, obj.h);
        ctx.fillStyle = isSel ? '#fff' : '#ffc800';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(obj.name, ox, oy - 4);
        if (isSel) {
          // Resize handle (bottom-right)
          ctx.fillStyle = '#fff';
          ctx.fillRect(ox + obj.w - 5, oy + obj.h - 5, 10, 10);
        }
      });
    }

    // Exits
    if (overlays.exits) {
      draft.exits.forEach((exit) => {
        const ex = exit.x * CANVAS_W, ey = exit.y * CANVAS_H;
        const isSel = selected?.type === 'exit' && selected.id === exit.id;
        ctx.strokeStyle = isSel ? '#fff' : 'rgba(0, 150, 255, 0.9)';
        ctx.fillStyle = isSel ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 150, 255, 0.2)';
        ctx.lineWidth = isSel ? 3 : 2;
        ctx.fillRect(ex, ey, exit.w, exit.h);
        ctx.strokeRect(ex, ey, exit.w, exit.h);
        ctx.fillStyle = isSel ? '#fff' : '#0096ff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`→ ${exit.name}`, ex, ey - 4);
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(exit.walkTo.x * CANVAS_W, exit.walkTo.y * CANVAS_H, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // NPCs
    if (overlays.npcs) {
      draft.npcs.forEach((npc) => {
        const nx = npc.x * CANVAS_W, ny = npc.y * CANVAS_H;
        const isSel = selected?.type === 'npc' && selected.id === npc.id;
        ctx.strokeStyle = isSel ? '#fff' : 'rgba(255, 0, 200, 0.9)';
        ctx.fillStyle = isSel ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 0, 200, 0.2)';
        ctx.lineWidth = isSel ? 3 : 2;
        ctx.strokeRect(nx - 20, ny - 80, 40, 90);
        ctx.fillRect(nx - 20, ny - 80, 40, 90);
        ctx.fillStyle = isSel ? '#fff' : '#ff00c8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(npc.name, nx - 20, ny - 84);
      });
    }

    // Scale preview
    if (overlays.scalePreview && hasDepthConfig(selectedRoom)) {
      const config = getRoomConfig(selectedRoom);
      if (config) {
        const { horizonY, nearY } = config.depthConfig;
        for (let frac = 0; frac <= 1; frac += 0.25) {
          const ny = horizonY + frac * (nearY - horizonY);
          const scale = getScaleAt(selectedRoom, 0.5, ny);
          const py = ny * CANVAS_H;
          const charH = 96 * scale, charW = 40 * scale;
          ctx.strokeStyle = `rgba(255,255,255,${0.3 + frac * 0.4})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(CANVAS_W * 0.5 - charW / 2, py - charH, charW, charH);
          ctx.fillStyle = '#fff';
          ctx.font = '11px monospace';
          ctx.fillText(`×${scale.toFixed(2)}`, CANVAS_W * 0.5 + charW / 2 + 6, py - charH / 2);
        }
      }
    }

    // Depth map heatmap
    if (overlays.depthMap) {
      const depthImg = getImage(ap(`/room-configs/${selectedRoom}_depth.png`));
      if (depthImg) {
        const off = document.createElement('canvas');
        off.width = CANVAS_W; off.height = CANVAS_H;
        const offCtx = off.getContext('2d')!;
        offCtx.drawImage(depthImg, 0, 0, CANVAS_W, CANVAS_H);
        const imgData = offCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = d[i];
          d[i] = Math.min(255, v * 2);
          d[i + 1] = v > 127 ? (255 - v) * 2 : v * 2;
          d[i + 2] = Math.max(0, 255 - v * 2);
          d[i + 3] = 140;
        }
        offCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(off, 0, 0);
      }
    }

    // Segmentation overlay
    if (overlays.segmentation) {
      const seg = getSegmentation(selectedRoom);
      if (seg) {
        if (seg.floorPolygon.length >= 3) {
          const pts = seg.floorPolygon.map(([nx, ny]) => [nx * CANVAS_W, ny * CANVAS_H] as [number, number]);
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          pts.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
          ctx.closePath();
          ctx.fillStyle = 'rgba(0, 220, 200, 0.25)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 220, 200, 0.9)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        const objColors = ['#ff8c00', '#ff5050', '#ffc800', '#b4ff00', '#ff00cc', '#00ccff'];
        seg.objects.slice(0, 12).forEach((obj, i) => {
          const b = obj.bbox;
          if (!b) return;
          const x = b.x * CANVAS_W, y = b.y * CANVAS_H;
          const w = b.w * CANVAS_W, h = b.h * CANVAS_H;
          const color = objColors[i % objColors.length];
          ctx.strokeStyle = color + (obj.confidence >= 0.5 ? 'cc' : '66');
          ctx.lineWidth = obj.confidence >= 0.5 ? 2 : 1;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = color + '33';
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = color;
          ctx.font = '11px monospace';
          ctx.fillText(`${obj.label} ${obj.confidence.toFixed(2)}`, x + 2, y - 3 < 10 ? y + 12 : y - 3);
        });
      }
    }

    // Edit mode cursor hint
    if (editMode !== 'select' && mousePos) {
      const px = mousePos.nx * CANVAS_W, py = mousePos.ny * CANVAS_H;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      if (editMode === 'addObject') ctx.strokeRect(px - 30, py - 30, 60, 60);
      else if (editMode === 'addExit') ctx.strokeRect(px - 40, py - 60, 80, 120);
      else if (editMode === 'addNpc') ctx.strokeRect(px - 20, py - 80, 40, 90);
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      const label = editMode === 'addObject' ? 'Click to add object' : editMode === 'addExit' ? 'Click to add exit' : 'Click to add NPC';
      ctx.fillText(label, px + 30, py - 30);
    }
  }, [selectedRoom, overlays, room, selected, draft, mousePos, editMode]);

  const depthConfig = getRoomConfig(selectedRoom);

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      {/* Toolbar */}
      <div style={{ ...S.panel, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ color: '#aaa' }}>Room:</label>
        <select style={S.select} value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
          {roomIds.map((id) => (
            <option key={id} value={id}>{id} — {ROOMS[id].name}</option>
          ))}
        </select>

        <span style={{ color: '#333' }}>|</span>

        {/* Edit mode buttons */}
        <ToolBtn label="Select" active={editMode === 'select'} onClick={() => setEditMode('select')} color="#888" />
        <ToolBtn label="+ Object" active={editMode === 'addObject'} onClick={() => setEditMode('addObject')} color="#ffc800" />
        <ToolBtn label="+ Exit" active={editMode === 'addExit'} onClick={() => setEditMode('addExit')} color="#0096ff" />
        <ToolBtn label="+ NPC" active={editMode === 'addNpc'} onClick={() => setEditMode('addNpc')} color="#ff00c8" />

        <span style={{ color: '#333' }}>|</span>

        <ToolBtn label="Undo" active={false} onClick={undo} color="#888" disabled={!canUndo} />
        <ToolBtn label="Redo" active={false} onClick={redo} color="#888" disabled={!canRedo} />

        {selected && selected.type !== 'walkVertex' && (
          <ToolBtn label="Delete" active={false} onClick={handleDelete} color="#f44336" />
        )}

        <span style={{ color: '#333' }}>|</span>
        <ToolBtn label="Export JSON" active={false} onClick={exportJson} color="#4caf50" />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {Object.entries(overlays).map(([key, val]) => (
            <label key={key} style={{ color: val ? '#fff' : '#555', cursor: 'pointer', fontSize: 11 }}>
              <input type="checkbox" checked={val} onChange={() => toggleOverlay(key as keyof typeof overlays)} style={{ marginRight: 3 }} />
              {key}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Canvas */}
        <div style={S.panel}>
          <div style={S.panelTitle}>Room Preview <span style={{ fontWeight: 400, color: '#666', fontSize: 12 }}>(drag to move elements)</span></div>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setMousePos(null); handleMouseUp(); }}
            style={{
              width: '100%',
              imageRendering: 'pixelated',
              borderRadius: 4,
              cursor: editMode !== 'select' ? 'crosshair' : dragging ? 'grabbing' : 'default',
            }}
          />
          {mousePos && (
            <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 12, color: '#aaa' }}>
              pos: ({mousePos.nx.toFixed(3)}, {mousePos.ny.toFixed(3)})
              {' | '}px: ({Math.round(mousePos.nx * CANVAS_W)}, {Math.round(mousePos.ny * CANVAS_H)})
              {hasDepthConfig(selectedRoom) && (
                <> {' | '} scale: ×{getScaleAt(selectedRoom, mousePos.nx, mousePos.ny).toFixed(2)}</>
              )}
            </div>
          )}
        </div>

        {/* Property Panel */}
        <div>
          {selected ? (
            <PropertyPanel
              selected={selected}
              draft={draft}
              roomIds={roomIds}
              onUpdateObject={updateObject}
              onUpdateExit={updateExit}
              onUpdateNpc={updateNpc}
              onDelete={handleDelete}
            />
          ) : (
            <RoomOverviewPanel draft={draft} depthConfig={depthConfig} selectedRoom={selectedRoom} />
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────

function ToolBtn({ label, active, onClick, color, disabled }: {
  label: string; active: boolean; onClick: () => void; color: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '5px 12px',
        background: active ? color + '33' : 'transparent',
        color: disabled ? '#444' : active ? color : '#aaa',
        border: `1px solid ${active ? color : '#444'}`,
        borderRadius: 4,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

function PropertyPanel({ selected, draft, roomIds, onUpdateObject, onUpdateExit, onUpdateNpc, onDelete }: {
  selected: ElementRef;
  draft: RoomDraft;
  roomIds: string[];
  onUpdateObject: (id: string, patch: Partial<SceneObject>) => void;
  onUpdateExit: (id: string, patch: Partial<Exit>) => void;
  onUpdateNpc: (id: string, patch: Partial<NPC>) => void;
  onDelete: () => void;
}) {
  if (selected.type === 'object') {
    const obj = draft.objects.find((o) => o.id === selected.id);
    if (!obj) return null;
    return (
      <div style={S.panel}>
        <div style={S.panelTitle}>
          <span style={S.badge('#ffc800')}>OBJ</span> {obj.name}
        </div>
        <PropGrid>
          <PropField label="ID" value={obj.id} onChange={(v) => onUpdateObject(obj.id, { id: v })} />
          <PropField label="Name" value={obj.name} onChange={(v) => onUpdateObject(obj.id, { name: v })} />
          <PropField label="X" value={obj.x.toFixed(3)} onChange={(v) => onUpdateObject(obj.id, { x: parseFloat(v) || 0 })} type="number" />
          <PropField label="Y" value={obj.y.toFixed(3)} onChange={(v) => onUpdateObject(obj.id, { y: parseFloat(v) || 0 })} type="number" />
          <PropField label="W (px)" value={String(obj.w)} onChange={(v) => onUpdateObject(obj.id, { w: parseInt(v) || 60 })} type="number" />
          <PropField label="H (px)" value={String(obj.h)} onChange={(v) => onUpdateObject(obj.id, { h: parseInt(v) || 60 })} type="number" />
        </PropGrid>
        <div style={{ marginTop: 12 }}>
          <div style={{ color: '#aaa', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Actions</div>
          {VERBS.map((verb) => (
            <div key={verb.id} style={{ marginBottom: 6 }}>
              <label style={{ color: PALETTE.uiVerbActive, fontSize: 11, fontWeight: 600 }}>{verb.label} ({verb.id})</label>
              <input
                style={{ ...inputStyle, marginTop: 2 }}
                value={typeof obj.actions[verb.id] === 'string' ? obj.actions[verb.id] as string : obj.actions[verb.id] ? JSON.stringify(obj.actions[verb.id]) : ''}
                placeholder="response text or [script]"
                onChange={(e) => {
                  const val = e.target.value;
                  const actions = { ...obj.actions };
                  if (val === '') delete actions[verb.id];
                  else actions[verb.id] = val;
                  onUpdateObject(obj.id, { actions });
                }}
              />
            </div>
          ))}
        </div>
        <button onClick={onDelete} style={{ ...deleteBtn, marginTop: 12 }}>Delete Object</button>
      </div>
    );
  }

  if (selected.type === 'exit') {
    const exit = draft.exits.find((e) => e.id === selected.id);
    if (!exit) return null;
    return (
      <div style={S.panel}>
        <div style={S.panelTitle}>
          <span style={S.badge('#0096ff')}>EXIT</span> {exit.name}
        </div>
        <PropGrid>
          <PropField label="ID" value={exit.id} onChange={(v) => onUpdateExit(exit.id, { id: v })} />
          <PropField label="Name" value={exit.name} onChange={(v) => onUpdateExit(exit.id, { name: v })} />
          <PropField label="To Room" value={exit.to} onChange={(v) => onUpdateExit(exit.id, { to: v })} select={roomIds} />
          <PropField label="X" value={exit.x.toFixed(3)} onChange={(v) => onUpdateExit(exit.id, { x: parseFloat(v) || 0 })} type="number" />
          <PropField label="Y" value={exit.y.toFixed(3)} onChange={(v) => onUpdateExit(exit.id, { y: parseFloat(v) || 0 })} type="number" />
          <PropField label="W (px)" value={String(exit.w)} onChange={(v) => onUpdateExit(exit.id, { w: parseInt(v) || 80 })} type="number" />
          <PropField label="H (px)" value={String(exit.h)} onChange={(v) => onUpdateExit(exit.id, { h: parseInt(v) || 120 })} type="number" />
          <PropField label="WalkTo X" value={exit.walkTo.x.toFixed(3)} onChange={(v) => onUpdateExit(exit.id, { walkTo: { ...exit.walkTo, x: parseFloat(v) || 0 } })} type="number" />
          <PropField label="WalkTo Y" value={exit.walkTo.y.toFixed(3)} onChange={(v) => onUpdateExit(exit.id, { walkTo: { ...exit.walkTo, y: parseFloat(v) || 0 } })} type="number" />
        </PropGrid>
        <button onClick={onDelete} style={{ ...deleteBtn, marginTop: 12 }}>Delete Exit</button>
      </div>
    );
  }

  if (selected.type === 'npc') {
    const npc = draft.npcs.find((n) => n.id === selected.id);
    if (!npc) return null;
    return (
      <div style={S.panel}>
        <div style={S.panelTitle}>
          <span style={S.badge('#ff00c8')}>NPC</span> {npc.name}
        </div>
        <PropGrid>
          <PropField label="ID" value={npc.id} onChange={(v) => onUpdateNpc(npc.id, { id: v })} />
          <PropField label="Name" value={npc.name} onChange={(v) => onUpdateNpc(npc.id, { name: v })} />
          <PropField label="X" value={npc.x.toFixed(3)} onChange={(v) => onUpdateNpc(npc.id, { x: parseFloat(v) || 0 })} type="number" />
          <PropField label="Y" value={npc.y.toFixed(3)} onChange={(v) => onUpdateNpc(npc.id, { y: parseFloat(v) || 0 })} type="number" />
          <PropField label="Sprite" value={npc.sprite} onChange={(v) => onUpdateNpc(npc.id, { sprite: v })} />
          <PropField label="Dialogue" value={npc.dialogue} onChange={(v) => onUpdateNpc(npc.id, { dialogue: v })} />
        </PropGrid>
        <button onClick={onDelete} style={{ ...deleteBtn, marginTop: 12 }}>Delete NPC</button>
      </div>
    );
  }

  if (selected.type === 'walkVertex') {
    return (
      <div style={S.panel}>
        <div style={S.panelTitle}>
          <span style={S.badge('#0f0')}>VERTEX</span> Walk Area #{selected.index}
        </div>
        <div style={{ color: '#888', fontSize: 12 }}>Walk area polygon vertex editing coming in next update.</div>
      </div>
    );
  }

  return null;
}

function RoomOverviewPanel({ draft, depthConfig, selectedRoom }: {
  draft: RoomDraft;
  depthConfig: ReturnType<typeof getRoomConfig>;
  selectedRoom: string;
}) {
  return (
    <>
      <div style={S.panel}>
        <div style={S.panelTitle}>Depth Config</div>
        {depthConfig ? (
          <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 2 }}>
            <div>horizonY: <b>{depthConfig.depthConfig.horizonY}</b></div>
            <div>nearY: <b>{depthConfig.depthConfig.nearY}</b></div>
            <div>farScale: <b>{depthConfig.depthConfig.farScale}</b></div>
            <div>nearScale: <b>{depthConfig.depthConfig.nearScale}</b></div>
            <div>walkThreshold: <b>{depthConfig.depthConfig.walkThreshold}</b></div>
            <div>walkArea vertices: <b>{depthConfig.walkArea.length}</b></div>
          </div>
        ) : (
          <div style={{ color: '#888', fontSize: 12 }}>No depth config. Run depth-analyzer to generate.</div>
        )}
      </div>

      <div style={S.panel}>
        <div style={S.panelTitle}>Objects ({draft.objects.length})</div>
        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          {draft.objects.map((obj) => (
            <div key={obj.id} style={{ padding: '4px 0', fontSize: 12, borderBottom: '1px solid #2a2a3e' }}>
              <span style={S.badge('#ffc800')}>OBJ</span>
              <b>{obj.name}</b>
              <span style={{ color: '#666', marginLeft: 8 }}>({obj.x.toFixed(2)}, {obj.y.toFixed(2)}) {obj.w}×{obj.h}px</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.panel}>
        <div style={S.panelTitle}>Exits ({draft.exits.length})</div>
        {draft.exits.map((exit) => (
          <div key={exit.id} style={{ padding: '4px 0', fontSize: 12, borderBottom: '1px solid #2a2a3e' }}>
            <span style={S.badge('#0096ff')}>EXIT</span>
            <b>{exit.name}</b> → {exit.to}
          </div>
        ))}
      </div>

      {draft.npcs.length > 0 && (
        <div style={S.panel}>
          <div style={S.panelTitle}>NPCs ({draft.npcs.length})</div>
          {draft.npcs.map((npc) => (
            <div key={npc.id} style={{ padding: '4px 0', fontSize: 12, borderBottom: '1px solid #2a2a3e' }}>
              <span style={S.badge('#ff00c8')}>NPC</span>
              <b>{npc.name}</b>
            </div>
          ))}
        </div>
      )}

      {(() => {
        const seg = getSegmentation(selectedRoom);
        if (!seg) return null;
        const objs = getObjectCandidates(selectedRoom);
        return (
          <div style={S.panel}>
            <div style={S.panelTitle}>
              Segmentation
              <span style={{ color: '#555', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                {seg.stats.floor}f / {seg.stats.object}obj / {seg.stats.background}bg / {seg.stats.discarded}disc
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
              Floor polygon: {seg.floorPolygon.length} vertices | generated {seg.generatedAt.slice(0, 10)}
            </div>
            <div style={{ maxHeight: 180, overflow: 'auto' }}>
              {objs.slice(0, 10).map((obj) => (
                <div key={obj.segmentId}
                  style={{ padding: '4px 0', fontSize: 12, borderBottom: '1px solid #2a2a3e', display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ ...S.badge(obj.confidence >= 0.5 ? '#ff8c00' : '#555'), minWidth: 36, textAlign: 'center' }}>
                    {obj.confidence.toFixed(2)}
                  </span>
                  <b style={{ color: '#ddd' }}>{obj.label}</b>
                  <span style={{ color: '#888', fontSize: 11 }}>
                    {obj.areaPct.toFixed(1)}% | depth {obj.meanDepth.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </>
  );
}

// ── Shared UI primitives ─────────────────────────────────────

function PropGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px 8px', alignItems: 'center' }}>{children}</div>;
}

function PropField({ label, value, onChange, type, select }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  select?: string[];
}) {
  return (
    <>
      <label style={{ color: '#888', fontSize: 11, textAlign: 'right' }}>{label}</label>
      {select ? (
        <select style={{ ...inputStyle }} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">--</option>
          {select.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          style={inputStyle}
          type={type || 'text'}
          value={value}
          step={type === 'number' ? '0.001' : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#2a2a3e',
  color: '#fff',
  border: '1px solid #555',
  borderRadius: 3,
  padding: '4px 8px',
  fontSize: 12,
  width: '100%',
  boxSizing: 'border-box',
};

const deleteBtn: React.CSSProperties = {
  background: '#f44336',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '6px 16px',
  fontSize: 12,
  cursor: 'pointer',
  width: '100%',
};
