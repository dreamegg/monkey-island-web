import { useState, useEffect, useRef, useCallback } from 'react';
import { getAllRooms } from '../engine/RoomLoader';
const ROOMS = getAllRooms();
import { PALETTE, VERBS, CANVAS_W, CANVAS_H } from '../engine/types';
import type { Room, SceneObject, Exit, NPC } from '../engine/types';
import { initDialogues } from '../data/dialogues';
import {
  getDialogueTree,
  getDialogueNode,
  getAvailableChoices,
} from '../engine/DialogueEngine';
import type { DialogueTree, DialogueNode, DialogueChoice } from '../engine/DialogueEngine';
import {
  preloadAllDepthConfigs,
  getRoomConfig,
  getScaleAt,
  getWalkPolygon,
  hasDepthConfig,
} from '../engine/DepthSystem';
import type { RoomDepthConfig } from '../engine/DepthSystem';
import { preloadAllBackgrounds, getImage } from '../utils/assetLoader';
import { ap } from '../utils/paths';

// ── Styles ──────────────────────────────────────────────────

const S = {
  app: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
  },
  header: {
    background: '#0d0d1a',
    borderBottom: '2px solid #333',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: PALETTE.uiText,
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 14,
  },
  tabs: {
    display: 'flex',
    gap: 4,
  },
  tab: (active: boolean) => ({
    padding: '8px 16px',
    background: active ? '#2a2a4a' : 'transparent',
    color: active ? '#fff' : '#888',
    border: active ? '1px solid #555' : '1px solid transparent',
    borderBottom: active ? '1px solid #2a2a4a' : '1px solid #333',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  }),
  body: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
    background: '#12121f',
  },
  panel: {
    background: '#1e1e30',
    border: '1px solid #333',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  panelTitle: {
    color: PALETTE.uiText,
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 12,
    borderBottom: '1px solid #333',
    paddingBottom: 8,
  },
  select: {
    background: '#2a2a3e',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 13,
  },
  badge: (color: string) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    background: color,
    color: '#fff',
    marginRight: 6,
  }),
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
};

// ── Main App ────────────────────────────────────────────────

type TabId = 'rooms' | 'dialogues' | 'items' | 'map' | 'assets';

export default function DevToolsApp() {
  const [tab, setTab] = useState<TabId>('rooms');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDialogues();
    preloadAllBackgrounds();
    const roomIds = Object.keys(ROOMS);
    preloadAllDepthConfigs(roomIds).then(() => setReady(true));
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'rooms', label: 'Room Editor' },
    { id: 'dialogues', label: 'Dialogue Viewer' },
    { id: 'items', label: 'Items & Inventory' },
    { id: 'map', label: 'Room Map' },
    { id: 'assets', label: 'Assets' },
  ];

  return (
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.title}>DEV TOOLS</span>
        <div style={S.tabs}>
          {tabs.map((t) => (
            <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
          {ready ? 'Depth configs loaded' : 'Loading...'}
        </span>
      </div>
      <div style={S.body}>
        {tab === 'rooms' && <RoomEditorPanel />}
        {tab === 'dialogues' && <DialogueViewerPanel />}
        {tab === 'items' && <ItemManagerPanel />}
        {tab === 'map' && <RoomMapPanel />}
        {tab === 'assets' && <AssetViewerPanel />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Room Editor Panel
// ═══════════════════════════════════════════════════════════

function RoomEditorPanel() {
  const roomIds = Object.keys(ROOMS);
  const [selectedRoom, setSelectedRoom] = useState(roomIds[0]);
  const [overlays, setOverlays] = useState({
    walkArea: true,
    objects: true,
    exits: true,
    npcs: true,
    depthMap: false,
    scalePreview: true,
    grid: false,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const room = ROOMS[selectedRoom];

  const toggleOverlay = (key: keyof typeof overlays) =>
    setOverlays((o) => ({ ...o, [key]: !o[key] }));

  // Render the room preview with overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !room) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Draw background — prefer actual image, fall back to procedural
    const bgImg = getImage(`/assets/backgrounds/${selectedRoom}.png`);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, CANVAS_W, CANVAS_H);
    } else {
      room.render(ctx, CANVAS_W, CANVAS_H);
    }

    // Grid overlay
    if (overlays.grid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
      }
      for (let y = 0; y < CANVAS_H; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
      }
      // Coordinate labels
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px monospace';
      for (let x = 0; x < CANVAS_W; x += 160) {
        for (let y = 0; y < CANVAS_H; y += 160) {
          ctx.fillText(`${(x/CANVAS_W).toFixed(2)},${(y/CANVAS_H).toFixed(2)}`, x + 2, y + 12);
        }
      }
    }

    // Walk area overlay (polygon from depth or rectangle fallback)
    if (overlays.walkArea) {
      const polygon = getWalkPolygon(selectedRoom);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
      ctx.lineWidth = 2;

      if (polygon && polygon.length > 2) {
        ctx.beginPath();
        ctx.moveTo(polygon[0][0] * CANVAS_W, polygon[0][1] * CANVAS_H);
        for (let i = 1; i < polygon.length; i++) {
          ctx.lineTo(polygon[i][0] * CANVAS_W, polygon[i][1] * CANVAS_H);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Vertex markers
        polygon.forEach(([x, y]) => {
          ctx.fillStyle = '#0f0';
          ctx.fillRect(x * CANVAS_W - 3, y * CANVAS_H - 3, 6, 6);
        });
      } else {
        // Rectangle fallback
        const wa = room.walkArea;
        const rx = wa.x1 * CANVAS_W, ry = wa.y1 * CANVAS_H;
        const rw = (wa.x2 - wa.x1) * CANVAS_W, rh = (wa.y2 - wa.y1) * CANVAS_H;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      }
    }

    // Object hotspots
    if (overlays.objects) {
      room.objects.forEach((obj) => {
        const ox = obj.x * CANVAS_W, oy = obj.y * CANVAS_H;
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.9)';
        ctx.fillStyle = 'rgba(255, 200, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.fillRect(ox, oy, obj.w, obj.h);
        ctx.strokeRect(ox, oy, obj.w, obj.h);
        // Label
        ctx.fillStyle = '#ffc800';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(obj.name, ox, oy - 4);
        // ID
        ctx.fillStyle = 'rgba(255,200,0,0.6)';
        ctx.font = '10px monospace';
        ctx.fillText(`[${obj.id}]`, ox, oy + obj.h + 12);
      });
    }

    // Exits
    if (overlays.exits) {
      room.exits.forEach((exit) => {
        const ex = exit.x * CANVAS_W, ey = exit.y * CANVAS_H;
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.9)';
        ctx.fillStyle = 'rgba(0, 150, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.fillRect(ex, ey, exit.w, exit.h);
        ctx.strokeRect(ex, ey, exit.w, exit.h);
        // Label
        ctx.fillStyle = '#0096ff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`→ ${exit.name}`, ex, ey - 4);
        // Walk-to point
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(exit.walkTo.x * CANVAS_W, exit.walkTo.y * CANVAS_H, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // NPCs
    if (overlays.npcs && room.npcs) {
      room.npcs.forEach((npc) => {
        const nx = npc.x * CANVAS_W, ny = npc.y * CANVAS_H;
        ctx.strokeStyle = 'rgba(255, 0, 200, 0.9)';
        ctx.fillStyle = 'rgba(255, 0, 200, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(nx - 20, ny - 80, 40, 90);
        ctx.fillRect(nx - 20, ny - 80, 40, 90);
        ctx.fillStyle = '#ff00c8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(npc.name, nx - 20, ny - 84);
      });
    }

    // Scale preview — show character size at different Y positions
    if (overlays.scalePreview && hasDepthConfig(selectedRoom)) {
      const config = getRoomConfig(selectedRoom);
      if (config) {
        const { horizonY, nearY } = config.depthConfig;
        for (let frac = 0; frac <= 1; frac += 0.25) {
          const ny = horizonY + frac * (nearY - horizonY);
          const scale = getScaleAt(selectedRoom, 0.5, ny);
          const py = ny * CANVAS_H;
          const charH = 96 * scale;
          const charW = 40 * scale;
          // Ghost character outline
          ctx.strokeStyle = `rgba(255,255,255,${0.3 + frac * 0.4})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(CANVAS_W * 0.5 - charW / 2, py - charH, charW, charH);
          // Scale label
          ctx.fillStyle = '#fff';
          ctx.font = '11px monospace';
          ctx.fillText(`×${scale.toFixed(2)}`, CANVAS_W * 0.5 + charW / 2 + 6, py - charH / 2);
        }
      }
    }
  }, [selectedRoom, overlays, room]);

  // Show mouse position on canvas
  const [mousePos, setMousePos] = useState<{ nx: number; ny: number } | null>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setMousePos({ nx, ny });
  }, []);

  const depthConfig = getRoomConfig(selectedRoom);

  return (
    <>
      {/* Room selector + overlay toggles */}
      <div style={{ ...S.panel, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ color: '#aaa' }}>Room:</label>
        <select style={S.select} value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
          {roomIds.map((id) => (
            <option key={id} value={id}>{id} — {ROOMS[id].name}</option>
          ))}
        </select>
        <span style={{ color: '#555' }}>|</span>
        {Object.entries(overlays).map(([key, val]) => (
          <label key={key} style={{ color: val ? '#fff' : '#666', cursor: 'pointer', fontSize: 12 }}>
            <input
              type="checkbox"
              checked={val}
              onChange={() => toggleOverlay(key as keyof typeof overlays)}
              style={{ marginRight: 4 }}
            />
            {key}
          </label>
        ))}
      </div>

      <div style={S.grid2}>
        {/* Canvas preview */}
        <div style={S.panel}>
          <div style={S.panelTitle}>Room Preview</div>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePos(null)}
            style={{
              width: '100%',
              imageRendering: 'pixelated',
              borderRadius: 4,
              cursor: 'crosshair',
            }}
          />
          {mousePos && (
            <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12, color: '#aaa' }}>
              pos: ({mousePos.nx.toFixed(3)}, {mousePos.ny.toFixed(3)})
              {' | '}
              px: ({Math.round(mousePos.nx * CANVAS_W)}, {Math.round(mousePos.ny * CANVAS_H)})
              {hasDepthConfig(selectedRoom) && (
                <> {' | '} scale: ×{getScaleAt(selectedRoom, mousePos.nx, mousePos.ny).toFixed(2)}</>
              )}
            </div>
          )}
        </div>

        {/* Room details */}
        <div>
          {/* Depth config */}
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
              <div style={{ color: '#888', fontSize: 12 }}>
                No depth config found. Run <code>tools/depth-analyzer/analyze.py</code> to generate.
              </div>
            )}
          </div>

          {/* Objects list */}
          <div style={S.panel}>
            <div style={S.panelTitle}>Objects ({room?.objects.length ?? 0})</div>
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {room?.objects.map((obj) => (
                <ObjectRow key={obj.id} obj={obj} />
              ))}
            </div>
          </div>

          {/* Exits */}
          <div style={S.panel}>
            <div style={S.panelTitle}>Exits ({room?.exits.length ?? 0})</div>
            {room?.exits.map((exit) => (
              <div key={exit.id} style={{ padding: '4px 0', fontSize: 12, borderBottom: '1px solid #2a2a3e' }}>
                <span style={S.badge('#0096ff')}>EXIT</span>
                <b>{exit.name}</b> → {exit.to}
                <span style={{ color: '#666', marginLeft: 8 }}>
                  walkTo: ({exit.walkTo.x.toFixed(2)}, {exit.walkTo.y.toFixed(2)})
                </span>
              </div>
            ))}
          </div>

          {/* NPCs */}
          {room?.npcs && room.npcs.length > 0 && (
            <div style={S.panel}>
              <div style={S.panelTitle}>NPCs ({room.npcs.length})</div>
              {room.npcs.map((npc) => (
                <div key={npc.id} style={{ padding: '4px 0', fontSize: 12, borderBottom: '1px solid #2a2a3e' }}>
                  <span style={S.badge('#ff00c8')}>NPC</span>
                  <b>{npc.name}</b>
                  <span style={{ color: '#666', marginLeft: 8 }}>
                    dialogue: {npc.dialogue} | pos: ({npc.x.toFixed(2)}, {npc.y.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ObjectRow({ obj }: { obj: SceneObject }) {
  const [expanded, setExpanded] = useState(false);
  const verbs = Object.keys(obj.actions);

  return (
    <div style={{ borderBottom: '1px solid #2a2a3e', padding: '6px 0' }}>
      <div
        style={{ cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ color: '#666' }}>{expanded ? '▼' : '▶'}</span>
        <span style={S.badge('#ffc800')}>OBJ</span>
        <b>{obj.name}</b>
        <span style={{ color: '#666' }}>
          ({obj.x.toFixed(2)}, {obj.y.toFixed(2)}) {obj.w}×{obj.h}px
        </span>
        {obj.item && <span style={S.badge('#4caf50')}>ITEM: {obj.item.icon} {obj.item.name}</span>}
      </div>
      {expanded && (
        <div style={{ marginLeft: 24, marginTop: 4 }}>
          {verbs.map((v) => (
            <div key={v} style={{ fontSize: 11, color: '#bbb', padding: '2px 0' }}>
              <span style={{ color: PALETTE.uiVerbActive, fontWeight: 600 }}>{v}</span>
              : {typeof obj.actions[v] === 'string' ? obj.actions[v] : '[script]'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Dialogue Viewer Panel
// ═══════════════════════════════════════════════════════════

function DialogueViewerPanel() {
  // Collect all dialogue IDs from NPCs across rooms
  const dialogueIds = new Set<string>();
  Object.values(ROOMS).forEach((room) => {
    room.npcs?.forEach((npc) => dialogueIds.add(npc.dialogue));
  });
  const ids = Array.from(dialogueIds);

  const [selectedDialogue, setSelectedDialogue] = useState(ids[0] ?? '');
  const [highlightNode, setHighlightNode] = useState<string | null>(null);

  const tree = selectedDialogue ? getDialogueTree(selectedDialogue) : undefined;

  return (
    <>
      <div style={{ ...S.panel, display: 'flex', alignItems: 'center', gap: 16 }}>
        <label style={{ color: '#aaa' }}>Dialogue Tree:</label>
        <select style={S.select} value={selectedDialogue} onChange={(e) => setSelectedDialogue(e.target.value)}>
          {ids.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
        {tree && (
          <span style={{ color: '#666', fontSize: 12 }}>
            {Object.keys(tree.nodes).length} nodes | start: {tree.startNode}
          </span>
        )}
      </div>

      {tree && (
        <div style={S.grid2}>
          {/* Flow chart */}
          <div style={S.panel}>
            <div style={S.panelTitle}>Flow Chart</div>
            <DialogueFlowChart tree={tree} highlightNode={highlightNode} onNodeHover={setHighlightNode} />
          </div>

          {/* Node list */}
          <div style={S.panel}>
            <div style={S.panelTitle}>All Nodes</div>
            <div style={{ maxHeight: 600, overflow: 'auto' }}>
              {Object.entries(tree.nodes).map(([nodeId, node]) => (
                <DialogueNodeCard
                  key={nodeId}
                  nodeId={nodeId}
                  node={node}
                  treeId={tree.id}
                  highlighted={highlightNode === nodeId}
                  onHover={setHighlightNode}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DialogueFlowChart({
  tree,
  highlightNode,
  onNodeHover,
}: {
  tree: DialogueTree;
  highlightNode: string | null;
  onNodeHover: (id: string | null) => void;
}) {
  // Build adjacency for layout
  const nodes = Object.keys(tree.nodes);
  const edges: { from: string; to: string; label?: string }[] = [];

  Object.entries(tree.nodes).forEach(([id, node]) => {
    if (node.next) edges.push({ from: id, to: node.next });
    node.choices?.forEach((c) => {
      edges.push({ from: id, to: c.next, label: c.text.slice(0, 20) });
    });
  });

  // Simple BFS layout
  const visited = new Set<string>();
  const levels: string[][] = [];
  let queue = [tree.startNode];
  while (queue.length > 0) {
    const level: string[] = [];
    const next: string[] = [];
    for (const n of queue) {
      if (visited.has(n)) continue;
      visited.add(n);
      level.push(n);
      const node = tree.nodes[n];
      if (node?.next && !visited.has(node.next)) next.push(node.next);
      node?.choices?.forEach((c) => {
        if (!visited.has(c.next)) next.push(c.next);
      });
    }
    if (level.length > 0) levels.push(level);
    queue = next;
  }
  // Add unvisited nodes
  const unvisited = nodes.filter((n) => !visited.has(n));
  if (unvisited.length) levels.push(unvisited);

  const nodePos: Record<string, { x: number; y: number }> = {};
  const NODE_W = 120, NODE_H = 40, GAP_X = 20, GAP_Y = 60;
  levels.forEach((level, ly) => {
    const totalW = level.length * NODE_W + (level.length - 1) * GAP_X;
    const startX = Math.max(10, (800 - totalW) / 2);
    level.forEach((n, lx) => {
      nodePos[n] = { x: startX + lx * (NODE_W + GAP_X), y: 20 + ly * (NODE_H + GAP_Y) };
    });
  });

  const svgH = Math.max(300, levels.length * (NODE_H + GAP_Y) + 60);

  return (
    <svg width="100%" viewBox={`0 0 800 ${svgH}`} style={{ background: '#0d0d1a', borderRadius: 4 }}>
      {/* Edges */}
      {edges.map((e, i) => {
        const from = nodePos[e.from];
        const to = nodePos[e.to];
        if (!from || !to) return null;
        return (
          <line
            key={i}
            x1={from.x + NODE_W / 2} y1={from.y + NODE_H}
            x2={to.x + NODE_W / 2} y2={to.y}
            stroke="#555" strokeWidth={1.5}
            markerEnd="url(#arrow)"
          />
        );
      })}
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#555" />
        </marker>
      </defs>
      {/* Nodes */}
      {Object.entries(nodePos).map(([id, pos]) => {
        const node = tree.nodes[id];
        if (!node) return null;
        const isHighlighted = highlightNode === id;
        const hasChoices = (node.choices?.length ?? 0) > 0;
        const isStart = id === tree.startNode;
        const isEnd = !node.next && !node.choices?.length;
        const fill = isHighlighted ? '#3a3a6a' : isStart ? '#1a3a1a' : isEnd ? '#3a1a1a' : '#1e1e30';
        const stroke = isHighlighted ? '#8888ff' : isStart ? '#4caf50' : isEnd ? '#f44336' : '#555';

        return (
          <g
            key={id}
            onMouseEnter={() => onNodeHover(id)}
            onMouseLeave={() => onNodeHover(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={pos.x} y={pos.y}
              width={NODE_W} height={NODE_H}
              fill={fill} stroke={stroke} strokeWidth={isHighlighted ? 2 : 1}
              rx={4}
            />
            <text x={pos.x + 6} y={pos.y + 16} fill="#fff" fontSize={10} fontFamily="monospace">
              {id.length > 14 ? id.slice(0, 13) + '…' : id}
            </text>
            <text x={pos.x + 6} y={pos.y + 30} fill="#888" fontSize={9} fontFamily="sans-serif">
              {node.speaker.slice(0, 16)}
              {hasChoices ? ` [${node.choices!.length}]` : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DialogueNodeCard({
  nodeId,
  node,
  treeId,
  highlighted,
  onHover,
}: {
  nodeId: string;
  node: DialogueNode;
  treeId: string;
  highlighted: boolean;
  onHover: (id: string | null) => void;
}) {
  const hasChoices = (node.choices?.length ?? 0) > 0;
  const isEnd = !node.next && !hasChoices;

  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid #2a2a3e',
        background: highlighted ? 'rgba(100,100,255,0.1)' : 'transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={() => onHover(nodeId)}
      onMouseLeave={() => onHover(null)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <code style={{ color: '#8888ff', fontSize: 12 }}>{nodeId}</code>
        {node.onEnter && <span style={S.badge('#9c27b0')}>onEnter</span>}
        {isEnd && <span style={S.badge('#f44336')}>END</span>}
        {node.next && <span style={{ color: '#666', fontSize: 11 }}>→ {node.next}</span>}
      </div>
      <div style={{ fontSize: 12 }}>
        <b style={{ color: '#ffab40' }}>{node.speaker}:</b>{' '}
        <span style={{ color: '#ccc' }}>{node.text.slice(0, 80)}{node.text.length > 80 ? '…' : ''}</span>
      </div>
      {hasChoices && (
        <div style={{ marginTop: 4, marginLeft: 16 }}>
          {node.choices!.map((c, i) => (
            <div key={i} style={{ fontSize: 11, color: '#888', padding: '2px 0' }}>
              {c.once && <span style={S.badge('#ff9800')}>once</span>}
              {c.condition && <span style={S.badge('#2196f3')}>cond</span>}
              "{c.text.slice(0, 40)}{c.text.length > 40 ? '…' : ''}" → <code>{c.next}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Items & Inventory Panel
// ═══════════════════════════════════════════════════════════

function ItemManagerPanel() {
  // Collect all items from room objects and dialogue side-effects
  const items: { id: string; name: string; icon: string; source: string; room: string; verb: string }[] = [];

  Object.entries(ROOMS).forEach(([roomId, room]) => {
    room.objects.forEach((obj) => {
      if (obj.item) {
        items.push({
          ...obj.item,
          source: `object: ${obj.id}`,
          room: roomId,
          verb: 'pick_up',
        });
      }
    });
  });

  // Items given via dialogue onEnter (hardcoded knowledge from dialogues.ts)
  const dialogueItems = [
    { id: 'voodoo_talisman', name: '부두교 부적', icon: '🔮', source: 'dialogue: voodoo_lady → how_defeat', room: 'forest', verb: 'dialogue' },
  ];

  return (
    <div style={S.panel}>
      <div style={S.panelTitle}>All Items in Game ({items.length + dialogueItems.length})</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #444', textAlign: 'left' }}>
            <th style={{ padding: 8, color: '#aaa' }}>Icon</th>
            <th style={{ padding: 8, color: '#aaa' }}>ID</th>
            <th style={{ padding: 8, color: '#aaa' }}>Name</th>
            <th style={{ padding: 8, color: '#aaa' }}>Source</th>
            <th style={{ padding: 8, color: '#aaa' }}>Room</th>
            <th style={{ padding: 8, color: '#aaa' }}>Trigger</th>
          </tr>
        </thead>
        <tbody>
          {[...items, ...dialogueItems].map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #2a2a3e' }}>
              <td style={{ padding: 8, fontSize: 20 }}>{item.icon}</td>
              <td style={{ padding: 8 }}><code>{item.id}</code></td>
              <td style={{ padding: 8 }}>{item.name}</td>
              <td style={{ padding: 8, color: '#888' }}>{item.source}</td>
              <td style={{ padding: 8 }}><span style={S.badge('#2a4a5a')}>{item.room}</span></td>
              <td style={{ padding: 8 }}><span style={S.badge(item.verb === 'dialogue' ? '#9c27b0' : '#4caf50')}>{item.verb}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Flag dependencies */}
      <div style={{ ...S.panelTitle, marginTop: 24 }}>Game Flags (from dialogue side-effects)</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {['knows_trials', 'knows_voodoo_lady', 'knows_sword_master', 'knows_lechuck_weakness', 'has_talisman'].map((flag) => (
          <div key={flag} style={{ background: '#2a2a3e', borderRadius: 4, padding: '6px 12px', fontSize: 12 }}>
            <span style={{ color: '#9c27b0', fontWeight: 600 }}>FLAG</span>{' '}
            <code>{flag}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Room Map Panel — transition graph
// ═══════════════════════════════════════════════════════════

function RoomMapPanel() {
  const rooms = Object.values(ROOMS);
  const roomIds = Object.keys(ROOMS);

  // Build edges from exits
  const edges: { from: string; to: string; exitName: string }[] = [];
  rooms.forEach((room) => {
    room.exits.forEach((exit) => {
      edges.push({ from: room.id, to: exit.to, exitName: exit.name });
    });
  });

  // Circular layout
  const CX = 400, CY = 250, RADIUS = 180;
  const nodePos: Record<string, { x: number; y: number }> = {};
  roomIds.forEach((id, i) => {
    const angle = (i / roomIds.length) * Math.PI * 2 - Math.PI / 2;
    nodePos[id] = {
      x: CX + Math.cos(angle) * RADIUS,
      y: CY + Math.sin(angle) * RADIUS,
    };
  });

  return (
    <div style={S.panel}>
      <div style={S.panelTitle}>Room Transition Map</div>
      <svg width="100%" viewBox="0 0 800 500" style={{ background: '#0d0d1a', borderRadius: 4 }}>
        <defs>
          <marker id="mapArrow" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#555" />
          </marker>
        </defs>
        {/* Edges */}
        {edges.map((e, i) => {
          const from = nodePos[e.from];
          const to = nodePos[e.to];
          if (!from || !to) return null;
          // Slight curve for bidirectional edges
          const dx = to.x - from.x, dy = to.y - from.y;
          const mx = (from.x + to.x) / 2 - dy * 0.1;
          const my = (from.y + to.y) / 2 + dx * 0.1;
          return (
            <g key={i}>
              <path
                d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
                fill="none" stroke="#555" strokeWidth={1.5}
                markerEnd="url(#mapArrow)"
              />
              <text x={mx} y={my - 6} fill="#666" fontSize={9} textAnchor="middle" fontFamily="sans-serif">
                {e.exitName}
              </text>
            </g>
          );
        })}
        {/* Room nodes */}
        {roomIds.map((id) => {
          const pos = nodePos[id];
          const room = ROOMS[id];
          const objCount = room.objects.length;
          const npcCount = room.npcs?.length ?? 0;
          return (
            <g key={id}>
              <circle cx={pos.x} cy={pos.y} r={36} fill="#1e1e30" stroke={PALETTE.uiBorder} strokeWidth={2} />
              <text x={pos.x} y={pos.y - 6} fill="#fff" fontSize={11} textAnchor="middle" fontWeight={600}>
                {id}
              </text>
              <text x={pos.x} y={pos.y + 10} fill="#888" fontSize={9} textAnchor="middle">
                {room.name}
              </text>
              <text x={pos.x} y={pos.y + 22} fill="#666" fontSize={8} textAnchor="middle">
                {objCount}obj {npcCount}npc
              </text>
            </g>
          );
        })}
      </svg>

      {/* Summary table */}
      <div style={{ marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #444', textAlign: 'left' }}>
              <th style={{ padding: 6, color: '#aaa' }}>Room</th>
              <th style={{ padding: 6, color: '#aaa' }}>Name</th>
              <th style={{ padding: 6, color: '#aaa' }}>Objects</th>
              <th style={{ padding: 6, color: '#aaa' }}>NPCs</th>
              <th style={{ padding: 6, color: '#aaa' }}>Exits To</th>
              <th style={{ padding: 6, color: '#aaa' }}>Depth Config</th>
            </tr>
          </thead>
          <tbody>
            {roomIds.map((id) => {
              const room = ROOMS[id];
              return (
                <tr key={id} style={{ borderBottom: '1px solid #2a2a3e' }}>
                  <td style={{ padding: 6 }}><code>{id}</code></td>
                  <td style={{ padding: 6 }}>{room.name}</td>
                  <td style={{ padding: 6 }}>{room.objects.length}</td>
                  <td style={{ padding: 6 }}>{room.npcs?.length ?? 0}</td>
                  <td style={{ padding: 6 }}>{room.exits.map((e) => e.to).join(', ')}</td>
                  <td style={{ padding: 6 }}>
                    {hasDepthConfig(id)
                      ? <span style={S.badge('#4caf50')}>loaded</span>
                      : <span style={S.badge('#666')}>none</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Asset Viewer Panel
// ═══════════════════════════════════════════════════════════

const ASSET_CATALOG = {
  backgrounds: ['harbor', 'tavern', 'forest', 'beach', 'cave'],
  sprites: [
    { name: 'guybrush', frames: ['guybrush_idle', 'guybrush_walk1', 'guybrush_walk2', 'guybrush_walk3', 'guybrush_walk4'] },
    { name: 'lechuck', frames: ['lechuck_idle', 'lechuck_walk1', 'lechuck_walk2'] },
    { name: 'elaine', frames: ['elaine_idle', 'elaine_walk1', 'elaine_walk2'] },
    { name: 'bartender', frames: ['bartender'] },
    { name: 'three_pirates', frames: ['three_pirates'] },
    { name: 'voodoo_lady', frames: ['voodoo_lady'] },
  ],
  portraits: [
    'guybrush_neutral', 'guybrush_determined', 'guybrush_surprised',
    'bartender_suspicious',
    'elaine_concerned', 'elaine_confident',
    'lechuck_angry', 'lechuck_sinister',
    'voodoo_lady_mysterious',
  ],
};

const SX = {
  section: { marginBottom: 32 },
  sectionTitle: { color: PALETTE.uiText, fontFamily: "'Press Start 2P', monospace", fontSize: 13, marginBottom: 12, borderBottom: '1px solid #333', paddingBottom: 6 },
  grid: { display: 'flex', flexWrap: 'wrap' as const, gap: 12 },
  bgCard: { background: '#111', border: '1px solid #333', borderRadius: 4, overflow: 'hidden', cursor: 'default' },
  bgImg: { display: 'block', width: 240, height: 120, imageRendering: 'pixelated' as const },
  label: { padding: '4px 8px', fontSize: 11, color: '#aaa', fontFamily: 'monospace' },
  spriteGroup: { marginBottom: 16 },
  spriteName: { color: PALETTE.uiVerbActive, fontSize: 12, fontFamily: 'monospace', marginBottom: 6 },
  spriteRow: { display: 'flex', gap: 8 },
  spriteCard: { background: '#111', border: '1px solid #333', borderRadius: 4, textAlign: 'center' as const, overflow: 'hidden' },
  spriteImg: { display: 'block', width: 64, height: 96, imageRendering: 'pixelated' as const },
  frameLabel: { fontSize: 9, color: '#666', padding: '2px 4px', fontFamily: 'monospace' },
  portraitCard: { background: '#111', border: '1px solid #333', borderRadius: 4, overflow: 'hidden', textAlign: 'center' as const },
  portraitImg: { display: 'block', width: 96, height: 96, imageRendering: 'pixelated' as const },
};

function AssetViewerPanel() {
  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>

      {/* Backgrounds */}
      <div style={SX.section}>
        <div style={SX.sectionTitle}>배경 이미지 (Backgrounds)</div>
        <div style={SX.grid}>
          {ASSET_CATALOG.backgrounds.map((id) => (
            <div key={id} style={SX.bgCard}>
              <img
                src={ap(`/assets/backgrounds/${id}.png`)}
                alt={id}
                style={SX.bgImg}
                onError={(e) => { (e.target as HTMLImageElement).style.background = '#222'; }}
              />
              <div style={SX.label}>{id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sprites */}
      <div style={SX.section}>
        <div style={SX.sectionTitle}>스프라이트 (Sprites)</div>
        {ASSET_CATALOG.sprites.map(({ name, frames }) => (
          <div key={name} style={SX.spriteGroup}>
            <div style={SX.spriteName}>{name}</div>
            <div style={SX.spriteRow}>
              {frames.map((frame) => (
                <div key={frame} style={SX.spriteCard}>
                  <img
                    src={ap(`/assets/sprites/${frame}.png`)}
                    alt={frame}
                    style={SX.spriteImg}
                    onError={(e) => { (e.target as HTMLImageElement).style.background = '#1a1a2e'; }}
                  />
                  <div style={SX.frameLabel}>{frame.replace(`${name}_`, '') || frame}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Portraits */}
      <div style={SX.section}>
        <div style={SX.sectionTitle}>초상화 (Portraits)</div>
        <div style={SX.grid}>
          {ASSET_CATALOG.portraits.map((p) => (
            <div key={p} style={SX.portraitCard}>
              <img
                src={ap(`/assets/portraits/${p}.png`)}
                alt={p}
                style={SX.portraitImg}
                onError={(e) => { (e.target as HTMLImageElement).style.background = '#1a1a2e'; }}
              />
              <div style={{ ...SX.frameLabel, padding: '4px 6px', maxWidth: 96 }}>{p}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Depth Analysis */}
      <div style={SX.section}>
        <div style={SX.sectionTitle}>뎁스 분석 (Depth Maps)</div>
        <div style={{ color: '#666', fontSize: 11, fontFamily: 'monospace', marginBottom: 10 }}>
          초록 영역 = 워크에어리어 폴리곤 | 노란선 = 원근감 스케일 단계
        </div>
        <div style={SX.grid}>
          {ASSET_CATALOG.backgrounds.map((id) => (
            <div key={id} style={SX.bgCard}>
              <img
                src={ap(`/room-configs/${id}_debug.png`)}
                alt={`${id}_depth`}
                style={SX.bgImg}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.background = '#222';
                  el.style.display = 'block';
                  el.alt = '분석 결과 없음';
                }}
              />
              <div style={SX.label}>{id} · depth map</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
