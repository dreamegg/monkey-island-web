import { useGameStore } from '../engine/GameEngine';
import { PALETTE } from '../engine/types';

export default function InventoryBar() {
  const inventory = useGameStore((s) => s.inventory);

  return (
    <div
      style={{
        flex: 1,
        borderLeft: `2px solid ${PALETTE.uiBorder}`,
        padding: 12,
      }}
    >
      <div
        style={{
          color: '#8d6e63',
          fontSize: 16,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        인벤토리
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          minHeight: 120,
        }}
      >
        {inventory.map((item) => (
          <div
            key={item.id}
            style={{
              background: PALETTE.uiVerb,
              border: `1px solid ${PALETTE.uiBorder}`,
              borderRadius: 2,
              padding: 8,
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: 18,
              color: PALETTE.uiText,
            }}
            title={item.name}
          >
            <div style={{ fontSize: 32 }}>{item.icon}</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>{item.name}</div>
          </div>
        ))}
        {inventory.length === 0 && (
          <div
            style={{
              color: '#4a2800',
              fontSize: 16,
              gridColumn: '1/-1',
              textAlign: 'center',
              paddingTop: 32,
            }}
          >
            (비어있음)
          </div>
        )}
      </div>
    </div>
  );
}
