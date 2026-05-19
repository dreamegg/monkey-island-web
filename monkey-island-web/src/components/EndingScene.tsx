import { useState, useEffect, useCallback } from 'react';
import { PALETTE } from '../engine/types';
import { ap } from '../utils/paths';

interface EndingLine {
  speaker: string;
  text: string;
  portrait?: string;
  side: 'left' | 'right' | 'center';
}

const ENDING_SCRIPT: EndingLine[] = [
  { speaker: '', text: '드디어... 배가 준비되었다.', side: 'center' },
  { speaker: '', text: '가이브러쉬는 바람을 가르며 멜레 섬을 떠났다.', side: 'center' },
  {
    speaker: '가이브러쉬',
    text: '원숭이 섬... 드디어 가는구나!',
    portrait: '/assets/portraits/guybrush_happy.png',
    side: 'left',
  },
  {
    speaker: '가이브러쉬',
    text: '검술 시련도 이겼고, 우상도 돌려드렸고, 보물도 찾았다.',
    portrait: '/assets/portraits/guybrush_determined.png',
    side: 'left',
  },
  {
    speaker: '가이브러쉬',
    text: '이제 르척을 상대하러 가야 해. 두렵지 않다!',
    portrait: '/assets/portraits/guybrush_determined.png',
    side: 'left',
  },
  { speaker: '', text: '...멀리서 유령선의 등불이 어둠 속에 빛난다.', side: 'center' },
  {
    speaker: '르척',
    text: '크크크... 가이브러쉬 쓰리퍼드. 내가 기다리고 있었다.',
    portrait: '/assets/portraits/lechuck_sinister.png',
    side: 'right',
  },
  { speaker: '', text: '원숭이 섬의 비밀...', side: 'center' },
  { speaker: '', text: '모험은 이제 시작이다!', side: 'center' },
  { speaker: '', text: '☠ THE END ☠', side: 'center' },
];

interface Props {
  onRestart: () => void;
}

export default function EndingScene({ onRestart }: Props) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);

  const line = ENDING_SCRIPT[lineIndex];
  const done = lineIndex >= ENDING_SCRIPT.length - 1 && !typing;

  const advance = useCallback(() => {
    if (typing) {
      setDisplayed(line.text);
      setTyping(false);
      return;
    }
    if (lineIndex < ENDING_SCRIPT.length - 1) {
      setLineIndex((i) => i + 1);
      setDisplayed('');
      setTyping(true);
    }
  }, [typing, lineIndex, line]);

  useEffect(() => {
    if (!typing) return;
    if (displayed.length >= line.text.length) {
      setTyping(false);
      return;
    }
    const delay = line.side === 'center' ? 60 : 40;
    const id = setTimeout(() => setDisplayed(line.text.slice(0, displayed.length + 1)), delay);
    return () => clearTimeout(id);
  }, [typing, displayed, line]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  const speakerColor = (speaker: string) => {
    if (speaker === '가이브러쉬') return '#ffd54f';
    if (speaker === '르척') return '#cf6679';
    return PALETTE.msgText;
  };

  return (
    <div
      onClick={done ? undefined : advance}
      style={{
        background: '#000',
        width: '100%',
        maxWidth: 1640,
        margin: '0 auto',
        height: 600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        cursor: done ? 'default' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Stars background */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, #0a1a2e 0%, #000 100%)' }} />
      {[...Array(40)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 7 + 13) % 97}%`,
          top: `${(i * 11 + 7) % 85}%`,
          width: 2, height: 2,
          background: '#fff',
          opacity: 0.4 + (i % 3) * 0.2,
          borderRadius: '50%',
        }} />
      ))}

      {/* Title */}
      <div style={{ position: 'absolute', top: 24, color: PALETTE.uiBorder, fontSize: 14, zIndex: 1 }}>
        ☠ 원숭이 섬의 비밀
      </div>

      {/* Dialogue card */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        background: 'rgba(10,5,0,0.92)',
        border: `2px solid ${PALETTE.uiBorder}`,
        borderRadius: 4,
        padding: '24px 32px',
        maxWidth: 740,
        width: '90%',
      }}>
        {line.side === 'center' ? (
          <p style={{ color: PALETTE.msgText, fontSize: 14, textAlign: 'center', margin: 0, lineHeight: 2 }}>
            {displayed}
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexDirection: line.side === 'right' ? 'row-reverse' : 'row' }}>
            {line.portrait && (
              <div style={{ width: 96, height: 96, border: `2px solid ${PALETTE.uiBorder}`, background: PALETTE.uiBg, flexShrink: 0, imageRendering: 'pixelated' as const, overflow: 'hidden' }}>
                <img src={ap(line.portrait)} alt={line.speaker} style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' as const }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div>
              <div style={{ color: speakerColor(line.speaker), fontSize: 11, marginBottom: 8 }}>{line.speaker}</div>
              <p style={{ color: PALETTE.uiText, fontSize: 13, margin: 0, lineHeight: 1.9 }}>{displayed}</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 6, marginTop: 20 }}>
        {ENDING_SCRIPT.map((_, i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= lineIndex ? PALETTE.uiBorder : '#333' }} />
        ))}
      </div>

      {/* Buttons */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: 24, display: 'flex', gap: 16 }}>
        {!done && (
          <button onClick={advance} style={{ background: PALETTE.uiVerb, color: PALETTE.uiText, border: `1px solid ${PALETTE.uiBorder}`, padding: '8px 20px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            {typing ? '▶ 건너뛰기' : '▶ 다음'}
          </button>
        )}
        {done && (
          <button onClick={onRestart} style={{ background: '#4a0000', color: '#ffd54f', border: `2px solid ${PALETTE.uiBorder}`, padding: '10px 28px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            ☠ 다시 시작
          </button>
        )}
      </div>
    </div>
  );
}
