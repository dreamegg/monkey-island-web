import { useGameStore } from '../engine/GameEngine';
import { PALETTE } from '../engine/types';

export default function InsultCombatBox() {
  const insultCombat = useGameStore((s) => s.insultCombat);
  const answerInsult = useGameStore((s) => s.answerInsult);
  const dismissCombatResult = useGameStore((s) => s.dismissCombatResult);

  if (!insultCombat?.active) return null;

  const { opponentName, playerHP, npcHP, playerMaxHP, npcMaxHP,
          currentInsult, currentChoices, feedback, feedbackCorrect, result } = insultCombat;

  const hpBar = (current: number, max: number, color: string) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 20, height: 20,
            background: i < current ? color : '#333',
            border: `1px solid ${i < current ? color : '#555'}`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
      }}
    >
      <div
        style={{
          background: PALETTE.uiBg,
          border: `3px solid ${PALETTE.uiBorder}`,
          borderRadius: 4,
          padding: 24,
          maxWidth: 700,
          width: '90%',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ color: PALETTE.uiVerbActive, fontSize: 18, marginBottom: 8 }}>
            ⚔ 욕설 검술 결투 ⚔
          </div>
          <div style={{ color: '#8d6e63', fontSize: 13 }}>vs. {opponentName}</div>
        </div>

        {/* HP bars */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#4caf50', fontSize: 11, marginBottom: 4 }}>가이브러시</div>
            {hpBar(playerHP, playerMaxHP, '#4caf50')}
          </div>
          <div style={{ color: PALETTE.uiText, fontSize: 20 }}>⚔</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#f44336', fontSize: 11, marginBottom: 4 }}>{opponentName}</div>
            {hpBar(npcHP, npcMaxHP, '#f44336')}
          </div>
        </div>

        {/* Combat result */}
        {result !== 'ongoing' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                color: result === 'player_won' ? '#4caf50' : '#f44336',
                fontSize: 22,
                marginBottom: 16,
                padding: 16,
                border: `2px solid ${result === 'player_won' ? '#4caf50' : '#f44336'}`,
                borderRadius: 4,
              }}
            >
              {result === 'player_won' ? '🏆 승리!' : '💀 패배...'}
            </div>
            <div style={{ color: PALETTE.uiText, fontSize: 13, marginBottom: 20 }}>
              {result === 'player_won'
                ? '재치 있는 응수로 상대를 이겼다!'
                : '말이 막혔다... 다시 도전하라!'}
            </div>
            <button
              onClick={dismissCombatResult}
              style={{
                background: PALETTE.uiVerbActive,
                color: PALETTE.black,
                border: 'none',
                padding: '10px 28px',
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                borderRadius: 2,
              }}
            >
              계속
            </button>
          </div>
        )}

        {/* Ongoing combat */}
        {result === 'ongoing' && currentInsult && (
          <>
            {/* Insult text */}
            <div
              style={{
                background: '#1a0a00',
                border: `2px solid ${PALETTE.uiBorder}`,
                borderRadius: 4,
                padding: 16,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#8d6e63', fontSize: 11, marginBottom: 8 }}>
                {opponentName}:
              </div>
              <div style={{ color: PALETTE.uiText, fontSize: 14, lineHeight: 1.6 }}>
                "{currentInsult.insult}"
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                style={{
                  color: feedbackCorrect ? '#4caf50' : '#f44336',
                  fontSize: 12,
                  textAlign: 'center',
                  marginBottom: 12,
                  padding: '6px 12px',
                  background: feedbackCorrect ? '#4caf5022' : '#f4433622',
                  borderRadius: 2,
                }}
              >
                {feedback}
              </div>
            )}

            {/* Comeback choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentChoices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => answerInsult(choice)}
                  style={{
                    background: PALETTE.uiVerb,
                    color: PALETTE.uiText,
                    border: `1px solid ${PALETTE.uiBorder}`,
                    padding: '10px 16px',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    borderRadius: 2,
                    lineHeight: 1.5,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background = PALETTE.uiVerbHover;
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = PALETTE.uiVerb;
                  }}
                >
                  {i + 1}. "{choice}"
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
