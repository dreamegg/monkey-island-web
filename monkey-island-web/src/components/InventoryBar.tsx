import { useGameStore } from '../engine/GameEngine';
import { PALETTE } from '../engine/types';

export default function InventoryBar() {
  const inventory = useGameStore((s) => s.inventory);
  const selectedInventoryItem = useGameStore((s) => s.selectedInventoryItem);
  const selectedVerb = useGameStore((s) => s.selectedVerb);
  const selectInventoryItem = useGameStore((s) => s.selectInventoryItem);

  const handleItemClick = (item: (typeof inventory)[number]) => {
    if (selectedVerb === 'use') {
      selectInventoryItem(selectedInventoryItem?.id === item.id ? null : item);
    }
  };

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
        {selectedInventoryItem
          ? `🎯 ${selectedInventoryItem.name} 사용 대상 선택...`
          : '인벤토리'}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          minHeight: 120,
        }}
      >
        {inventory.map((item) => {
          const isSelected = selectedInventoryItem?.id === item.id;
          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                background: isSelected ? PALETTE.uiVerbActive + '33' : PALETTE.uiVerb,
                border: `2px solid ${isSelected ? PALETTE.uiVerbActive : PALETTE.uiBorder}`,
                borderRadius: 2,
                padding: 8,
                textAlign: 'center',
                cursor: selectedVerb === 'use' ? 'pointer' : 'default',
                fontSize: 18,
                color: PALETTE.uiText,
                transform: isSelected ? 'scale(1.05)' : 'none',
                transition: 'all 0.1s ease',
                boxShadow: isSelected ? `0 0 8px ${PALETTE.uiVerbActive}88` : 'none',
              }}
              title={item.name}
            >
              <div style={{ fontSize: 28 }}>{item.icon}</div>
              <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.2 }}>{item.name}</div>
            </div>
          );
        })}
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
      {selectedVerb === 'use' && inventory.length > 0 && (
        <div style={{ color: '#8d6e63', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
          아이템을 선택 후 장면을 클릭하세요
        </div>
      )}
    </div>
  );
}
