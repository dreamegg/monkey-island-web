import { S } from '../shared/styles';
import { getAllRooms } from '../../engine/RoomLoader';
import { PALETTE } from '../../engine/types';
import { hasDepthConfig } from '../../engine/DepthSystem';

const ROOMS = getAllRooms();

export default function RoomMapPanel() {
  const rooms = Object.values(ROOMS);
  const roomIds = Object.keys(ROOMS);

  const edges: { from: string; to: string; exitName: string }[] = [];
  rooms.forEach((room) => {
    room.exits.forEach((exit) => {
      edges.push({ from: room.id, to: exit.to, exitName: exit.name });
    });
  });

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
        {edges.map((e, i) => {
          const from = nodePos[e.from];
          const to = nodePos[e.to];
          if (!from || !to) return null;
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
