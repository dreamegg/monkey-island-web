import { S } from '../shared/styles';
import { getAllRooms } from '../../engine/RoomLoader';

const ROOMS = getAllRooms();

export default function ItemManagerPanel() {
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
