import { useGameStore } from '../engine/GameEngine';
import { VERBS, PALETTE } from '../engine/types';

export default function VerbPanel() {
  const selectedVerb = useGameStore((s) => s.selectedVerb);
  const selectVerb = useGameStore((s) => s.selectVerb);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 4,
        padding: 12,
        flex: '0 0 55%',
      }}
    >
      {VERBS.map((verb) => {
        const isActive = selectedVerb === verb.id;
        return (
          <button
            key={verb.id}
            onClick={() => selectVerb(verb.id)}
            style={{
              background: isActive ? PALETTE.uiVerbActive : PALETTE.uiVerb,
              color: isActive ? '#000' : PALETTE.uiText,
              border: `1px solid ${PALETTE.uiBorder}`,
              borderRadius: 2,
              padding: '10px 8px',
              fontSize: 18,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.1s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.target as HTMLElement).style.background = PALETTE.uiVerbHover;
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.target as HTMLElement).style.background = PALETTE.uiVerb;
            }}
          >
            {verb.icon} {verb.label}
          </button>
        );
      })}
    </div>
  );
}
