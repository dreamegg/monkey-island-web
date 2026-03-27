import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../engine/GameEngine';
import { getDialogueNode, getAvailableChoices } from '../engine/DialogueEngine';
import { PALETTE } from '../engine/types';

const TYPEWRITER_SPEED = 35; // ms per character

export default function DialogueBox() {
  const dialogueActive = useGameStore((s) => s.dialogueActive);
  const currentDialogue = useGameStore((s) => s.currentDialogue);
  const currentNode = useGameStore((s) => s.currentNode);
  const advanceDialogue = useGameStore((s) => s.advanceDialogue);
  const selectChoice = useGameStore((s) => s.selectChoice);
  const endDialogue = useGameStore((s) => s.endDialogue);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [fullText, setFullText] = useState('');

  const node =
    currentDialogue && currentNode
      ? getDialogueNode(currentDialogue, currentNode)
      : null;

  // Typewriter effect
  useEffect(() => {
    if (!node) return;
    setFullText(node.text);
    setDisplayedText('');
    setIsTyping(true);
  }, [node?.id, currentDialogue, currentNode]);

  useEffect(() => {
    if (!isTyping || !fullText) return;
    if (displayedText.length >= fullText.length) {
      setIsTyping(false);
      return;
    }
    const timer = setTimeout(() => {
      setDisplayedText(fullText.slice(0, displayedText.length + 1));
    }, TYPEWRITER_SPEED);
    return () => clearTimeout(timer);
  }, [isTyping, displayedText, fullText]);

  const skipTypewriter = useCallback(() => {
    if (isTyping) {
      setDisplayedText(fullText);
      setIsTyping(false);
    }
  }, [isTyping, fullText]);

  const handleAdvance = useCallback(() => {
    if (isTyping) {
      skipTypewriter();
      return;
    }
    advanceDialogue();
  }, [isTyping, skipTypewriter, advanceDialogue]);

  const handleChoiceClick = useCallback(
    (index: number) => {
      if (isTyping) {
        skipTypewriter();
        return;
      }
      selectChoice(index);
    },
    [isTyping, skipTypewriter, selectChoice],
  );

  // Keyboard handler
  useEffect(() => {
    if (!dialogueActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAdvance();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        endDialogue();
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        handleChoiceClick(index);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialogueActive, handleAdvance, handleChoiceClick, endDialogue]);

  if (!dialogueActive || !node) return null;

  const choices =
    currentDialogue && currentNode
      ? getAvailableChoices(currentDialogue, currentNode)
      : [];
  const showChoices = !isTyping && choices.length > 0;
  const showContinue = !isTyping && choices.length === 0 && node.next;
  const showEnd = !isTyping && choices.length === 0 && !node.next;

  // Speaker name color map
  const speakerColors: Record<string, string> = {
    '가이브러시': PALETTE.hair,
    '세 해적': '#ff7043',
    '바텐더': '#a1887f',
    '부두교 여사제': '#ce93d8',
  };
  const speakerColor = speakerColors[node.speaker] ?? PALETTE.uiText;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10, 10, 10, 0.95)',
        borderTop: `3px solid ${PALETTE.uiBorder}`,
        padding: '20px 28px',
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 100,
      }}
      onClick={handleAdvance}
    >
      {/* Speaker row with portrait */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Portrait */}
        {node.portrait && (
          <div
            style={{
              width: 128,
              height: 128,
              border: `2px solid ${PALETTE.uiBorder}`,
              background: PALETTE.uiBg,
              flexShrink: 0,
              imageRendering: 'pixelated',
              overflow: 'hidden',
            }}
          >
            <img
              src={node.portrait}
              alt={node.speaker}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                imageRendering: 'pixelated',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Text area */}
        <div style={{ flex: 1 }}>
          {/* Speaker name */}
          <div
            style={{
              color: speakerColor,
              fontSize: 22,
              marginBottom: 8,
              fontFamily: "'Press Start 2P', 'Courier New', monospace",
            }}
          >
            {node.speaker}
          </div>

          {/* Dialogue text */}
          <div
            style={{
              color: PALETTE.msgText,
              fontSize: 20,
              lineHeight: 1.8,
              fontFamily: "'Press Start 2P', 'Courier New', monospace",
              minHeight: 60,
            }}
          >
            {displayedText}
            {isTyping && (
              <span style={{ color: PALETTE.uiVerbActive }}>_</span>
            )}
          </div>
        </div>
      </div>

      {/* Choices */}
      {showChoices && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 8,
            marginLeft: 148,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {choices.map((choice, i) => (
            <button
              key={`${choice.text}-${i}`}
              onClick={() => handleChoiceClick(i)}
              style={{
                background: PALETTE.uiVerb,
                border: `1px solid ${PALETTE.uiBorder}`,
                color: PALETTE.uiText,
                padding: '10px 18px',
                fontSize: 18,
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                cursor: 'pointer',
                textAlign: 'left',
                lineHeight: 1.6,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background =
                  PALETTE.uiVerbHover;
                (e.target as HTMLElement).style.color = PALETTE.uiVerbActive;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = PALETTE.uiVerb;
                (e.target as HTMLElement).style.color = PALETTE.uiText;
              }}
            >
              {i + 1}. {choice.text}
            </button>
          ))}
        </div>
      )}

      {/* Continue prompt */}
      {showContinue && (
        <div
          style={{
            color: PALETTE.uiBorder,
            fontSize: 16,
            textAlign: 'center',
            marginTop: 8,
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
          }}
        >
          [ Enter 키를 눌러 계속... ]
        </div>
      )}

      {/* End prompt */}
      {showEnd && (
        <div
          style={{
            color: PALETTE.uiBorder,
            fontSize: 16,
            textAlign: 'center',
            marginTop: 8,
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
          }}
        >
          [ Enter 키를 눌러 대화 종료 ]
        </div>
      )}
    </div>
  );
}
