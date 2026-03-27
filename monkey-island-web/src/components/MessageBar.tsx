import { useGameStore } from '../engine/GameEngine';
import { PALETTE } from '../engine/types';

export default function MessageBar() {
  const message = useGameStore((s) => s.message);

  return (
    <div
      style={{
        background: PALETTE.dialogBg,
        borderTop: `2px solid ${PALETTE.uiBorder}`,
        padding: '16px 28px',
        minHeight: 72,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <span style={{ color: PALETTE.msgText, fontSize: 20, lineHeight: 1.6 }}>
        {message}
      </span>
    </div>
  );
}
