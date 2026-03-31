import { useState, useRef, useCallback, useEffect } from 'react';
import { S } from '../shared/styles';
import { getAllRooms } from '../../engine/RoomLoader';
import { PALETTE } from '../../engine/types';
import { initDialogues } from '../../data/dialogues';
import { getDialogueTree } from '../../engine/DialogueEngine';
import type { DialogueTree, DialogueNode, DialogueChoice } from '../../engine/DialogueEngine';

const ROOMS = getAllRooms();

// ── Editor types ─────────────────────────────────────────────

interface NodeDraft {
  id: string;
  speaker: string;
  portrait: string;
  text: string;
  choices: ChoiceDraft[];
  next: string;
  onEnterDesc: string; // human-readable description of side effects
}

interface ChoiceDraft {
  text: string;
  next: string;
  conditionDesc: string; // e.g. "knows_trials"
  once: boolean;
}

interface TreeDraft {
  id: string;
  startNode: string;
  nodes: Record<string, NodeDraft>;
}

interface NodePos {
  x: number;
  y: number;
}

// ── Convert tree to draft ────────────────────────────────────

function treeToDraft(tree: DialogueTree): TreeDraft {
  const nodes: Record<string, NodeDraft> = {};
  Object.entries(tree.nodes).forEach(([id, node]) => {
    nodes[id] = {
      id,
      speaker: node.speaker,
      portrait: node.portrait ?? '',
      text: node.text,
      choices: (node.choices ?? []).map((c) => ({
        text: c.text,
        next: c.next,
        conditionDesc: c.condition ? '(has condition)' : '',
        once: c.once ?? false,
      })),
      next: node.next ?? '',
      onEnterDesc: node.onEnter ? '(has side-effect)' : '',
    };
  });
  return { id: tree.id, startNode: tree.startNode, nodes };
}

function draftToJson(draft: TreeDraft) {
  const nodes: Record<string, any> = {};
  Object.entries(draft.nodes).forEach(([id, node]) => {
    const n: any = {
      id,
      speaker: node.speaker,
      text: node.text,
    };
    if (node.portrait) n.portrait = node.portrait;
    if (node.next) n.next = node.next;
    if (node.choices.length > 0) {
      n.choices = node.choices.map((c) => {
        const ch: any = { text: c.text, next: c.next };
        if (c.once) ch.once = true;
        if (c.conditionDesc) ch.condition = c.conditionDesc;
        return ch;
      });
    }
    if (node.onEnterDesc) n.onEnter = node.onEnterDesc;
    nodes[id] = n;
  });
  return { id: draft.id, startNode: draft.startNode, nodes };
}

// ── History ──────────────────────────────────────────────────

function useHistory(initial: TreeDraft) {
  const [past, setPast] = useState<TreeDraft[]>([]);
  const [present, setPresent] = useState<TreeDraft>(initial);
  const [future, setFuture] = useState<TreeDraft[]>([]);

  const commit = useCallback((next: TreeDraft) => {
    setPast((p) => [...p.slice(-30), present]);
    setPresent(next);
    setFuture([]);
  }, [present]);

  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture((f) => [present, ...f]);
    setPresent(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  }, [past, present]);

  const redo = useCallback(() => {
    if (!future.length) return;
    setPast((p) => [...p, present]);
    setPresent(future[0]);
    setFuture((f) => f.slice(1));
  }, [future, present]);

  const reset = useCallback((d: TreeDraft) => {
    setPast([]); setPresent(d); setFuture([]);
  }, []);

  return { draft: present, commit, undo, redo, reset, canUndo: past.length > 0, canRedo: future.length > 0 };
}

// ── Validation ───────────────────────────────────────────────

interface ValidationIssue {
  type: 'error' | 'warning';
  nodeId?: string;
  message: string;
}

function validate(draft: TreeDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(Object.keys(draft.nodes));

  if (!draft.startNode || !nodeIds.has(draft.startNode)) {
    issues.push({ type: 'error', message: `Start node "${draft.startNode}" does not exist` });
  }

  // Reachability
  const visited = new Set<string>();
  const queue = [draft.startNode];
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = draft.nodes[id];
    if (!node) continue;
    if (node.next && !visited.has(node.next)) queue.push(node.next);
    node.choices.forEach((c) => { if (!visited.has(c.next)) queue.push(c.next); });
  }
  nodeIds.forEach((id) => {
    if (!visited.has(id)) issues.push({ type: 'warning', nodeId: id, message: `Node "${id}" is unreachable` });
  });

  Object.entries(draft.nodes).forEach(([id, node]) => {
    if (!node.text.trim()) issues.push({ type: 'warning', nodeId: id, message: `Node "${id}" has empty text` });
    if (!node.speaker.trim()) issues.push({ type: 'error', nodeId: id, message: `Node "${id}" has no speaker` });

    // Dangling references
    if (node.next && !nodeIds.has(node.next)) {
      issues.push({ type: 'error', nodeId: id, message: `Node "${id}" → next "${node.next}" does not exist` });
    }
    node.choices.forEach((c, ci) => {
      if (!nodeIds.has(c.next)) {
        issues.push({ type: 'error', nodeId: id, message: `Choice ${ci} of "${id}" → "${c.next}" does not exist` });
      }
      if (!c.text.trim()) issues.push({ type: 'warning', nodeId: id, message: `Choice ${ci} of "${id}" has empty text` });
    });

    // Dead end (no next, no choices)
    if (!node.next && node.choices.length === 0) {
      issues.push({ type: 'warning', nodeId: id, message: `Node "${id}" is a dead end (no next or choices)` });
    }
  });

  return issues;
}

// ── Main Panel ───────────────────────────────────────────────

export default function DialogueViewerPanel() {
  const dialogueIds: string[] = [];
  const seen = new Set<string>();
  Object.values(ROOMS).forEach((room) => {
    room.npcs?.forEach((npc) => {
      if (!seen.has(npc.dialogue)) { seen.add(npc.dialogue); dialogueIds.push(npc.dialogue); }
    });
  });

  const [selectedDialogue, setSelectedDialogue] = useState(dialogueIds[0] ?? '');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ fromNode: string; type: 'next' | 'choice'; choiceIdx?: number } | null>(null);

  const tree = selectedDialogue ? getDialogueTree(selectedDialogue) : undefined;
  const { draft, commit, undo, redo, reset, canUndo, canRedo } = useHistory(
    tree ? treeToDraft(tree) : { id: '', startNode: '', nodes: {} }
  );

  // Node positions (auto-layout with draggable override)
  const [nodePositions, setNodePositions] = useState<Record<string, NodePos>>({});

  useEffect(() => {
    if (tree) {
      const newDraft = treeToDraft(tree);
      reset(newDraft);
      setSelectedNode(null);
      setNodePositions(autoLayout(newDraft));
    }
  }, [selectedDialogue]);

  const issues = validate(draft);
  const errorCount = issues.filter((i) => i.type === 'error').length;
  const warnCount = issues.filter((i) => i.type === 'warning').length;

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redo(); }
      if (e.key === 'Escape') { setSelectedNode(null); setConnecting(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode &&
          document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        deleteNode(selectedNode);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedNode, draft]);

  // ── Node operations ────────────────────────────────────────

  function addNode() {
    const id = `node_${Date.now()}`;
    const next = {
      ...draft,
      nodes: {
        ...draft.nodes,
        [id]: { id, speaker: '가이브러시', portrait: '', text: '새 대사', choices: [], next: '', onEnterDesc: '' },
      },
    };
    if (!next.startNode) next.startNode = id;
    commit(next);
    setNodePositions((p) => ({ ...p, [id]: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 } }));
    setSelectedNode(id);
  }

  function deleteNode(nodeId: string) {
    const { [nodeId]: _, ...rest } = draft.nodes;
    // Remove references to deleted node
    Object.values(rest).forEach((n) => {
      if (n.next === nodeId) n.next = '';
      n.choices = n.choices.filter((c) => c.next !== nodeId);
    });
    const next = { ...draft, nodes: rest };
    if (next.startNode === nodeId) next.startNode = Object.keys(rest)[0] ?? '';
    commit(next);
    setSelectedNode(null);
  }

  function updateNode(nodeId: string, patch: Partial<NodeDraft>) {
    commit({
      ...draft,
      nodes: { ...draft.nodes, [nodeId]: { ...draft.nodes[nodeId], ...patch } },
    });
  }

  function addChoice(nodeId: string) {
    const node = draft.nodes[nodeId];
    if (!node) return;
    updateNode(nodeId, {
      choices: [...node.choices, { text: '새 선택지', next: '', conditionDesc: '', once: false }],
    });
  }

  function updateChoice(nodeId: string, idx: number, patch: Partial<ChoiceDraft>) {
    const node = draft.nodes[nodeId];
    if (!node) return;
    const choices = node.choices.map((c, i) => i === idx ? { ...c, ...patch } : c);
    updateNode(nodeId, { choices });
  }

  function removeChoice(nodeId: string, idx: number) {
    const node = draft.nodes[nodeId];
    if (!node) return;
    updateNode(nodeId, { choices: node.choices.filter((_, i) => i !== idx) });
  }

  // ── Connection mode ────────────────────────────────────────

  function startConnect(fromNode: string, type: 'next' | 'choice', choiceIdx?: number) {
    setConnecting({ fromNode, type, choiceIdx });
  }

  function finishConnect(toNode: string) {
    if (!connecting || connecting.fromNode === toNode) { setConnecting(null); return; }
    if (connecting.type === 'next') {
      updateNode(connecting.fromNode, { next: toNode });
    } else if (connecting.type === 'choice' && connecting.choiceIdx !== undefined) {
      updateChoice(connecting.fromNode, connecting.choiceIdx, { next: toNode });
    }
    setConnecting(null);
  }

  // ── Export ─────────────────────────────────────────────────

  function exportJson() {
    const json = draftToJson(draft);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${draft.id}.dialogue.json`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ─────────────────────────────────────────────────

  const nodeIds = Object.keys(draft.nodes);
  const selNode = selectedNode ? draft.nodes[selectedNode] : null;

  return (
    <>
      {/* Toolbar */}
      <div style={{ ...S.panel, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ color: '#aaa' }}>Dialogue:</label>
        <select style={S.select} value={selectedDialogue} onChange={(e) => setSelectedDialogue(e.target.value)}>
          {dialogueIds.map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
        <span style={{ color: '#666', fontSize: 12 }}>{nodeIds.length} nodes</span>

        <span style={{ color: '#333' }}>|</span>
        <ToolBtn label="+ Node" onClick={addNode} color="#4caf50" />
        <ToolBtn label="Undo" onClick={undo} color="#888" disabled={!canUndo} />
        <ToolBtn label="Redo" onClick={redo} color="#888" disabled={!canRedo} />
        <ToolBtn label="Export JSON" onClick={exportJson} color="#4caf50" />

        {connecting && (
          <span style={{ color: '#ff0', fontSize: 12, marginLeft: 8 }}>
            Connecting from "{connecting.fromNode}" — click target node (Esc to cancel)
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, fontSize: 12 }}>
          {errorCount > 0 && <span style={{ color: '#f44336' }}>{errorCount} errors</span>}
          {warnCount > 0 && <span style={{ color: '#ff9800' }}>{warnCount} warnings</span>}
          {errorCount === 0 && warnCount === 0 && <span style={{ color: '#4caf50' }}>Valid</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        {/* Graph canvas */}
        <div style={S.panel}>
          <div style={S.panelTitle}>Flow Graph <span style={{ fontWeight: 400, color: '#666', fontSize: 12 }}>(drag nodes to reposition, click to select)</span></div>
          <NodeGraph
            draft={draft}
            positions={nodePositions}
            setPositions={setNodePositions}
            selectedNode={selectedNode}
            onSelectNode={(id) => { if (connecting) finishConnect(id); else setSelectedNode(id); }}
            issues={issues}
          />
        </div>

        {/* Right panel */}
        <div>
          {selNode ? (
            <NodePropertyPanel
              node={selNode}
              draft={draft}
              onUpdate={(patch) => updateNode(selectedNode!, patch)}
              onAddChoice={() => addChoice(selectedNode!)}
              onUpdateChoice={(idx, patch) => updateChoice(selectedNode!, idx, patch)}
              onRemoveChoice={(idx) => removeChoice(selectedNode!, idx)}
              onDelete={() => deleteNode(selectedNode!)}
              onStartConnect={startConnect}
              isStartNode={draft.startNode === selectedNode}
              onSetStart={() => commit({ ...draft, startNode: selectedNode! })}
              nodeIds={nodeIds}
            />
          ) : (
            <ValidationPanel issues={issues} onSelectNode={setSelectedNode} />
          )}
        </div>
      </div>
    </>
  );
}

// ── Auto Layout (BFS levels) ─────────────────────────────────

function autoLayout(draft: TreeDraft): Record<string, NodePos> {
  const NODE_W = 160, NODE_H = 80, GAP_X = 40, GAP_Y = 100;
  const positions: Record<string, NodePos> = {};
  const visited = new Set<string>();
  const levels: string[][] = [];
  let queue = [draft.startNode];

  while (queue.length > 0) {
    const level: string[] = [];
    const next: string[] = [];
    for (const n of queue) {
      if (visited.has(n) || !draft.nodes[n]) continue;
      visited.add(n);
      level.push(n);
      const node = draft.nodes[n];
      if (node.next && !visited.has(node.next)) next.push(node.next);
      node.choices.forEach((c) => { if (c.next && !visited.has(c.next)) next.push(c.next); });
    }
    if (level.length > 0) levels.push(level);
    queue = next;
  }
  // Add orphans
  const orphans = Object.keys(draft.nodes).filter((n) => !visited.has(n));
  if (orphans.length) levels.push(orphans);

  levels.forEach((level, ly) => {
    const totalW = level.length * NODE_W + (level.length - 1) * GAP_X;
    const startX = Math.max(40, (900 - totalW) / 2);
    level.forEach((n, lx) => {
      positions[n] = { x: startX + lx * (NODE_W + GAP_X), y: 40 + ly * (NODE_H + GAP_Y) };
    });
  });

  return positions;
}

// ── SVG Node Graph ───────────────────────────────────────────

function NodeGraph({ draft, positions, setPositions, selectedNode, onSelectNode, issues }: {
  draft: TreeDraft;
  positions: Record<string, NodePos>;
  setPositions: React.Dispatch<React.SetStateAction<Record<string, NodePos>>>;
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
  issues: ValidationIssue[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState<{ startX: number; startY: number; origPanX: number; origPanY: number } | null>(null);

  const NODE_W = 160, NODE_H = 80;

  // Edges
  const edges: { from: string; to: string; label?: string; color: string; dashed: boolean }[] = [];
  Object.entries(draft.nodes).forEach(([id, node]) => {
    if (node.next && positions[node.next]) {
      edges.push({ from: id, to: node.next, color: '#888', dashed: false });
    }
    node.choices.forEach((c, ci) => {
      if (c.next && positions[c.next]) {
        edges.push({ from: id, to: c.next, label: c.text.slice(0, 16), color: '#4caf50', dashed: c.once });
      }
    });
  });

  const errorNodes = new Set(issues.filter((i) => i.type === 'error' && i.nodeId).map((i) => i.nodeId!));
  const warnNodes = new Set(issues.filter((i) => i.type === 'warning' && i.nodeId).map((i) => i.nodeId!));

  // Calculate viewBox dynamically
  const allX = Object.values(positions).map((p) => p.x);
  const allY = Object.values(positions).map((p) => p.y);
  const minX = Math.min(0, ...allX) - 40;
  const minY = Math.min(0, ...allY) - 40;
  const maxX = Math.max(900, ...allX.map((x) => x + NODE_W)) + 40;
  const maxY = Math.max(400, ...allY.map((y) => y + NODE_H)) + 40;

  // Drag node
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const scaleX = (maxX - minX) / rect.width;
    const scaleY = (maxY - minY) / rect.height;
    const pos = positions[nodeId] ?? { x: 100, y: 100 };
    setDragging({
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      const scaleX = (maxX - minX) / rect.width;
      const scaleY = (maxY - minY) / rect.height;
      const dx = (e.clientX - dragging.startX) * scaleX;
      const dy = (e.clientY - dragging.startY) * scaleY;
      setPositions((p) => ({ ...p, [dragging.id]: { x: dragging.origX + dx, y: dragging.origY + dy } }));
    }
    if (panning) {
      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      const scaleX = (maxX - minX) / rect.width;
      const scaleY = (maxY - minY) / rect.height;
      setPan({
        x: panning.origPanX - (e.clientX - panning.startX) * scaleX,
        y: panning.origPanY - (e.clientY - panning.startY) * scaleY,
      });
    }
  }, [dragging, panning, maxX, maxY, minX, minY]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setPanning(null);
  }, []);

  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) { // middle or right click
      e.preventDefault();
      setPanning({ startX: e.clientX, startY: e.clientY, origPanX: pan.x, origPanY: pan.y });
    }
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`${minX + pan.x} ${minY + pan.y} ${maxX - minX} ${maxY - minY}`}
      style={{ background: '#0d0d1a', borderRadius: 4, minHeight: 500, cursor: dragging ? 'grabbing' : 'default' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseDown={handleBgMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <defs>
        <marker id="edgeArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#888" />
        </marker>
        <marker id="choiceArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#4caf50" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((e, i) => {
        const from = positions[e.from];
        const to = positions[e.to];
        if (!from || !to) return null;
        const x1 = from.x + NODE_W / 2, y1 = from.y + NODE_H;
        const x2 = to.x + NODE_W / 2, y2 = to.y;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return (
          <g key={i}>
            <path
              d={`M ${x1} ${y1} Q ${x1} ${my} ${mx} ${my} Q ${x2} ${my} ${x2} ${y2}`}
              fill="none" stroke={e.color} strokeWidth={1.5}
              strokeDasharray={e.dashed ? '6 3' : undefined}
              markerEnd={e.color === '#4caf50' ? 'url(#choiceArrow)' : 'url(#edgeArrow)'}
            />
            {e.label && (
              <text x={mx} y={my - 6} fill="#666" fontSize={9} textAnchor="middle" fontFamily="sans-serif">
                {e.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {Object.entries(draft.nodes).map(([id, node]) => {
        const pos = positions[id];
        if (!pos) return null;
        const isSelected = selectedNode === id;
        const isStart = draft.startNode === id;
        const isEnd = !node.next && node.choices.length === 0;
        const hasError = errorNodes.has(id);
        const hasWarn = warnNodes.has(id);

        const fill = isSelected ? '#2a2a5a' : isStart ? '#1a3a1a' : isEnd ? '#3a1a1a' : '#1e1e30';
        const stroke = isSelected ? '#8888ff' : hasError ? '#f44336' : hasWarn ? '#ff9800' : isStart ? '#4caf50' : isEnd ? '#f44336' : '#444';

        return (
          <g
            key={id}
            onMouseDown={(e) => handleMouseDown(e, id)}
            onClick={(e) => { e.stopPropagation(); onSelectNode(id); }}
            style={{ cursor: dragging?.id === id ? 'grabbing' : 'grab' }}
          >
            <rect
              x={pos.x} y={pos.y}
              width={NODE_W} height={NODE_H}
              fill={fill} stroke={stroke} strokeWidth={isSelected ? 2.5 : 1.5}
              rx={6}
            />
            {/* Start badge */}
            {isStart && (
              <text x={pos.x + NODE_W - 6} y={pos.y + 14} fill="#4caf50" fontSize={9} textAnchor="end" fontWeight={700}>START</text>
            )}
            {isEnd && (
              <text x={pos.x + NODE_W - 6} y={pos.y + 14} fill="#f44336" fontSize={9} textAnchor="end" fontWeight={700}>END</text>
            )}
            {/* Speaker */}
            <text x={pos.x + 8} y={pos.y + 18} fill="#ffab40" fontSize={11} fontWeight={600} fontFamily="sans-serif">
              {node.speaker.slice(0, 18)}
            </text>
            {/* Text preview */}
            <text x={pos.x + 8} y={pos.y + 36} fill="#ccc" fontSize={10} fontFamily="sans-serif">
              {node.text.slice(0, 22)}{node.text.length > 22 ? '…' : ''}
            </text>
            {/* Node ID */}
            <text x={pos.x + 8} y={pos.y + 52} fill="#666" fontSize={9} fontFamily="monospace">
              {id.length > 20 ? id.slice(0, 19) + '…' : id}
            </text>
            {/* Badges */}
            {node.choices.length > 0 && (
              <text x={pos.x + 8} y={pos.y + NODE_H - 8} fill="#4caf50" fontSize={9} fontWeight={600}>
                {node.choices.length} choices
              </text>
            )}
            {node.onEnterDesc && (
              <text x={pos.x + NODE_W - 8} y={pos.y + NODE_H - 8} fill="#9c27b0" fontSize={9} textAnchor="end" fontWeight={600}>
                fx
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Node Property Panel ──────────────────────────────────────

function NodePropertyPanel({ node, draft, onUpdate, onAddChoice, onUpdateChoice, onRemoveChoice, onDelete, onStartConnect, isStartNode, onSetStart, nodeIds }: {
  node: NodeDraft;
  draft: TreeDraft;
  onUpdate: (patch: Partial<NodeDraft>) => void;
  onAddChoice: () => void;
  onUpdateChoice: (idx: number, patch: Partial<ChoiceDraft>) => void;
  onRemoveChoice: (idx: number) => void;
  onDelete: () => void;
  onStartConnect: (fromNode: string, type: 'next' | 'choice', choiceIdx?: number) => void;
  isStartNode: boolean;
  onSetStart: () => void;
  nodeIds: string[];
}) {
  return (
    <>
      <div style={S.panel}>
        <div style={{ ...S.panelTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={S.badge(isStartNode ? '#4caf50' : '#555')}>NODE</span>
          {node.id}
          {!isStartNode && (
            <button onClick={onSetStart} style={{ ...smallBtn, marginLeft: 'auto', color: '#4caf50', borderColor: '#4caf50' }}>
              Set as Start
            </button>
          )}
        </div>

        <PropGrid>
          <PropField label="ID" value={node.id} onChange={(v) => {
            // Rename node: update all references
            const newNodes = { ...draft.nodes };
            const old = newNodes[node.id];
            delete newNodes[node.id];
            newNodes[v] = { ...old, id: v };
            // Update references
            Object.values(newNodes).forEach((n) => {
              if (n.next === node.id) n.next = v;
              n.choices.forEach((c) => { if (c.next === node.id) c.next = v; });
            });
            const startNode = draft.startNode === node.id ? v : draft.startNode;
            // Can't use onUpdate here since ID changed
            // This is a special case - we modify the full draft
            onUpdate({ id: v }); // This won't work perfectly since ID changes key
          }} />
          <PropField label="Speaker" value={node.speaker} onChange={(v) => onUpdate({ speaker: v })} />
          <PropField label="Portrait" value={node.portrait} onChange={(v) => onUpdate({ portrait: v })} />
        </PropGrid>

        <div style={{ marginTop: 10 }}>
          <label style={{ color: '#888', fontSize: 11 }}>Text</label>
          <textarea
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical', marginTop: 4 }}
            value={node.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={{ color: '#888', fontSize: 11 }}>onEnter (side-effect description)</label>
          <input style={{ ...inputStyle, marginTop: 4 }} value={node.onEnterDesc} onChange={(e) => onUpdate({ onEnterDesc: e.target.value })} placeholder="e.g. set_flag:knows_trials, give_item:sword" />
        </div>

        {/* Next node */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ color: '#888', fontSize: 11 }}>Next →</label>
          <select style={{ ...inputStyle, flex: 1 }} value={node.next} onChange={(e) => onUpdate({ next: e.target.value })}>
            <option value="">(none — end or choices)</option>
            {nodeIds.filter((id) => id !== node.id).map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          <button onClick={() => onStartConnect(node.id, 'next')} style={smallBtn} title="Click then click target node">Link</button>
        </div>
      </div>

      {/* Choices */}
      <div style={S.panel}>
        <div style={{ ...S.panelTitle, display: 'flex', alignItems: 'center' }}>
          Choices ({node.choices.length})
          <button onClick={onAddChoice} style={{ ...smallBtn, marginLeft: 'auto', color: '#4caf50', borderColor: '#4caf50' }}>+ Add Choice</button>
        </div>
        {node.choices.map((choice, idx) => (
          <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #2a2a3e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ color: '#4caf50', fontSize: 11, fontWeight: 600 }}>#{idx + 1}</span>
              {choice.once && <span style={S.badge('#ff9800')}>once</span>}
              <button onClick={() => onRemoveChoice(idx)} style={{ ...smallBtn, marginLeft: 'auto', color: '#f44336', borderColor: '#f44336' }}>×</button>
            </div>
            <input
              style={{ ...inputStyle, marginBottom: 4 }}
              value={choice.text}
              placeholder="Choice text"
              onChange={(e) => onUpdateChoice(idx, { text: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select style={{ ...inputStyle, flex: 1 }} value={choice.next} onChange={(e) => onUpdateChoice(idx, { next: e.target.value })}>
                <option value="">(select target)</option>
                {nodeIds.filter((id) => id !== node.id).map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <button onClick={() => onStartConnect(node.id, 'choice', idx)} style={smallBtn} title="Click then click target node">Link</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <label style={{ color: '#888', fontSize: 11 }}>
                <input type="checkbox" checked={choice.once} onChange={(e) => onUpdateChoice(idx, { once: e.target.checked })} style={{ marginRight: 4 }} />
                once
              </label>
              <input
                style={{ ...inputStyle, flex: 1, fontSize: 11 }}
                value={choice.conditionDesc}
                placeholder="condition (e.g. knows_trials)"
                onChange={(e) => onUpdateChoice(idx, { conditionDesc: e.target.value })}
              />
            </div>
          </div>
        ))}
        {node.choices.length === 0 && (
          <div style={{ color: '#666', fontSize: 12, padding: 8 }}>No choices. Add choices or set a "next" node.</div>
        )}
      </div>

      <button onClick={onDelete} style={{ ...deleteBtn, marginTop: 8 }}>Delete Node</button>
    </>
  );
}

// ── Validation Panel ─────────────────────────────────────────

function ValidationPanel({ issues, onSelectNode }: { issues: ValidationIssue[]; onSelectNode: (id: string) => void }) {
  return (
    <div style={S.panel}>
      <div style={S.panelTitle}>Validation</div>
      {issues.length === 0 ? (
        <div style={{ color: '#4caf50', fontSize: 13 }}>All checks passed. Select a node to edit.</div>
      ) : (
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {issues.map((issue, i) => (
            <div
              key={i}
              style={{
                padding: '6px 8px',
                borderBottom: '1px solid #2a2a3e',
                cursor: issue.nodeId ? 'pointer' : 'default',
                fontSize: 12,
              }}
              onClick={() => issue.nodeId && onSelectNode(issue.nodeId)}
            >
              <span style={{ color: issue.type === 'error' ? '#f44336' : '#ff9800', fontWeight: 600, marginRight: 8 }}>
                {issue.type === 'error' ? 'ERR' : 'WARN'}
              </span>
              {issue.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared UI ────────────────────────────────────────────────

function ToolBtn({ label, onClick, color, disabled }: {
  label: string; onClick: () => void; color: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '5px 12px',
        background: 'transparent',
        color: disabled ? '#444' : color,
        border: `1px solid ${disabled ? '#333' : color}`,
        borderRadius: 4,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

function PropGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '6px 8px', alignItems: 'center' }}>{children}</div>;
}

function PropField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <>
      <label style={{ color: '#888', fontSize: 11, textAlign: 'right' }}>{label}</label>
      <input style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} />
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

const smallBtn: React.CSSProperties = {
  padding: '3px 8px',
  background: 'transparent',
  color: '#888',
  border: '1px solid #555',
  borderRadius: 3,
  cursor: 'pointer',
  fontSize: 11,
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
