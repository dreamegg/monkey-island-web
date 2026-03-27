import { useState, useEffect, useCallback } from 'react';
import { PALETTE } from '../engine/types';

interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
  side: 'left' | 'right' | 'center';
}

const INTRO_SCRIPT: DialogueLine[] = [
  {
    speaker: '',
    text: '카리브해의 어느 작은 섬...',
    side: 'center',
  },
  {
    speaker: '',
    text: '멜레 섬의 항구에 한 청년이 도착한다.',
    side: 'center',
  },
  {
    speaker: '가이브러쉬',
    text: '안녕하세요! 제 이름은 가이브러쉬 쓰리퍼드입니다.',
    portrait: '/assets/portraits/guybrush_neutral.png',
    side: 'left',
  },
  {
    speaker: '가이브러쉬',
    text: '저는 해적이 되고 싶어요!',
    portrait: '/assets/portraits/guybrush_determined.png',
    side: 'left',
  },
  {
    speaker: '늙은 해적',
    text: '해적이 되고 싶다고? 허허... 요즘 젊은 것들은...',
    portrait: '/assets/portraits/bartender_suspicious.png',
    side: 'right',
  },
  {
    speaker: '늙은 해적',
    text: '해적이 되려면 세 가지 시련을 통과해야 한다네.',
    portrait: '/assets/portraits/bartender_suspicious.png',
    side: 'right',
  },
  {
    speaker: '가이브러쉬',
    text: '세 가지 시련이요? 뭔데요?',
    portrait: '/assets/portraits/guybrush_surprised.png',
    side: 'left',
  },
  {
    speaker: '늙은 해적',
    text: '첫째, 검술의 달인이 될 것. 둘째, 보물을 훔칠 것.',
    portrait: '/assets/portraits/bartender_suspicious.png',
    side: 'right',
  },
  {
    speaker: '늙은 해적',
    text: '셋째... 원숭이 섬의 비밀을 풀 것.',
    portrait: '/assets/portraits/bartender_suspicious.png',
    side: 'right',
  },
  {
    speaker: '가이브러쉬',
    text: '원숭이 섬...? 뭔가 무시무시한 느낌인데...',
    portrait: '/assets/portraits/guybrush_surprised.png',
    side: 'left',
  },
  {
    speaker: '늙은 해적',
    text: '그리고 조심하게... 유령 해적 르척이 이 근처를 배회하고 있다네.',
    portrait: '/assets/portraits/bartender_suspicious.png',
    side: 'right',
  },
  {
    speaker: '',
    text: '이렇게 가이브러쉬의 모험이 시작되었다...',
    side: 'center',
  },
];

function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(id);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

export default function IntroScene({ onFinish }: { onFinish: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [bgLoaded, setBgLoaded] = useState(false);

  const line = INTRO_SCRIPT[lineIndex];
  const { displayed, done, skip } = useTypewriter(line.text, 45);

  // Preload intro background
  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.src = '/assets/backgrounds/harbor.png';
  }, []);

  // Fade in effect
  useEffect(() => {
    setFadeIn(true);
    const t = setTimeout(() => setFadeIn(false), 300);
    return () => clearTimeout(t);
  }, [lineIndex]);

  const advance = useCallback(() => {
    if (!done) {
      skip();
      return;
    }
    if (lineIndex < INTRO_SCRIPT.length - 1) {
      setLineIndex((i) => i + 1);
    } else {
      onFinish();
    }
  }, [done, skip, lineIndex, onFinish]);

  // Click or key to advance
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['Enter', ' ', 'Escape'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'Escape') {
          onFinish();
        } else {
          advance();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, onFinish]);

  const isCenter = line.side === 'center';

  return (
    <div
      onClick={advance}
      style={{
        background: '#000',
        width: '100%',
        maxWidth: 1640,
        margin: '0 auto',
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        border: `3px solid ${PALETTE.uiBorder}`,
        borderRadius: 4,
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Background image */}
      <div
        style={{
          width: '100%',
          height: 800,
          position: 'relative',
          background: PALETTE.sky,
          overflow: 'hidden',
        }}
      >
        {bgLoaded && (
          <img
            src="/assets/backgrounds/harbor.png"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              imageRendering: 'pixelated',
              filter: 'brightness(0.6)',
              display: 'block',
            }}
          />
        )}

        {/* Cinematic bars */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            background: 'linear-gradient(180deg, #000 60%, transparent)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background: 'linear-gradient(0deg, #000 60%, transparent)',
          }}
        />

        {/* Title overlay (first two lines) */}
        {lineIndex < 2 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: lineIndex === 0 ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
              transition: 'background 0.5s',
            }}
          >
            {lineIndex === 0 && (
              <div
                style={{
                  color: PALETTE.uiText,
                  fontSize: 48,
                  textShadow: '0 0 30px #ff8f00, 0 4px 8px rgba(0,0,0,0.8)',
                  marginBottom: 40,
                  letterSpacing: 4,
                }}
              >
                ☠ 원숭이 섬의 비밀 ☠
              </div>
            )}
            <div
              style={{
                color: '#fff',
                fontSize: 24,
                textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                opacity: fadeIn ? 0 : 1,
                transition: 'opacity 0.5s',
              }}
            >
              {displayed}
            </div>
          </div>
        )}

        {/* Dialogue box (from line 2 onwards) */}
        {lineIndex >= 2 && (
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 40,
              right: 40,
              display: 'flex',
              alignItems: line.side === 'right' ? 'flex-end' : 'flex-start',
              flexDirection: line.side === 'right' ? 'row-reverse' : 'row',
              gap: 24,
              opacity: fadeIn ? 0 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            {/* Portrait */}
            {line.portrait && (
              <div
                style={{
                  width: 160,
                  height: 160,
                  flexShrink: 0,
                  border: `3px solid ${PALETTE.uiBorder}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#1a0a00',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.8)',
                }}
              >
                <img
                  src={line.portrait}
                  alt={line.speaker}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    imageRendering: 'pixelated',
                  }}
                />
              </div>
            )}

            {/* Text bubble */}
            <div
              style={{
                flex: 1,
                background: 'rgba(10, 5, 0, 0.92)',
                border: `2px solid ${PALETTE.uiBorder}`,
                borderRadius: 8,
                padding: '20px 28px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
              }}
            >
              {line.speaker && (
                <div
                  style={{
                    color: line.side === 'left' ? '#4fc3f7' : '#ffab40',
                    fontSize: 18,
                    marginBottom: 12,
                  }}
                >
                  {line.speaker}
                </div>
              )}
              <div
                style={{
                  color: '#fff',
                  fontSize: 20,
                  lineHeight: 1.8,
                  minHeight: 60,
                }}
              >
                {displayed}
                {!done && (
                  <span
                    style={{
                      animation: 'blink 0.5s infinite',
                      color: PALETTE.uiVerbActive,
                    }}
                  >
                    _
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Center narration (for ending line) */}
        {lineIndex >= 2 && isCenter && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.6)',
              opacity: fadeIn ? 0 : 1,
              transition: 'opacity 0.5s',
            }}
          >
            <div
              style={{
                color: PALETTE.uiText,
                fontSize: 28,
                textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                textAlign: 'center',
                maxWidth: 1000,
                lineHeight: 2,
              }}
            >
              {displayed}
            </div>
          </div>
        )}
      </div>

      {/* Bottom hint bar */}
      <div
        style={{
          background: PALETTE.uiBg,
          borderTop: `2px solid ${PALETTE.uiBorder}`,
          padding: '12px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#8d6e63', fontSize: 16 }}>
          {lineIndex + 1} / {INTRO_SCRIPT.length}
        </span>
        <span style={{ color: PALETTE.uiText, fontSize: 16 }}>
          클릭 또는 Enter로 계속 | ESC로 건너뛰기
        </span>
      </div>

      {/* Blink animation */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
