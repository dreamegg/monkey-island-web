import { useEffect, useState } from 'react';
import { useGameStore } from './engine/GameEngine';
import { PALETTE, VERBS } from './engine/types';
import { getRoom, preloadJsonRooms } from './engine/RoomLoader';
import { preloadAllBackgrounds } from './utils/assetLoader';
import { preloadCharacterSprites } from './utils/spriteAnimator';
import { playRoomMusic, playIntroMusic, stopMusic } from './utils/audioManager';
import { initDialogues } from './data/dialogues';
import { preloadAllDepthConfigs } from './engine/DepthSystem';
import GameCanvas from './components/GameCanvas';
import VerbPanel from './components/VerbPanel';
import InventoryBar from './components/InventoryBar';
import MessageBar from './components/MessageBar';
import IntroScene from './components/IntroScene';
import DialogueBox from './components/DialogueBox';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    preloadAllBackgrounds();
    preloadCharacterSprites();
    initDialogues();
    preloadAllDepthConfigs(['harbor', 'tavern', 'forest', 'beach', 'cave']);
    preloadJsonRooms(['harbor', 'tavern', 'forest', 'beach', 'cave']);
  }, []);

  // Play intro music when showing intro scene
  useEffect(() => {
    if (showIntro) playIntroMusic();
  }, [showIntro]);

  const roomId = useGameStore((s) => s.roomId);
  const dialogueActive = useGameStore((s) => s.dialogueActive);

  // Play room-specific background music
  useEffect(() => {
    if (!showIntro) playRoomMusic(roomId);
  }, [roomId, showIntro]);
  const cursorAction = useGameStore((s) => s.cursorAction);
  const selectedVerb = useGameStore((s) => s.selectedVerb);

  const currentRoom = getRoom(roomId);
  const verbLabel = VERBS.find((v) => v.id === selectedVerb)?.label ?? '';

  if (showIntro) {
    return <IntroScene onFinish={() => { stopMusic(); setShowIntro(false); }} />;
  }

  return (
    <div
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
        position: 'relative',
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          background: `linear-gradient(180deg, #2a1400, ${PALETTE.uiBg})`,
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `2px solid ${PALETTE.uiBorder}`,
        }}
      >
        <span style={{ color: PALETTE.uiText, fontSize: 22 }}>
          ☠ 원숭이 섬의 비밀
        </span>
        <span style={{ color: '#8d6e63', fontSize: 18 }}>
          {currentRoom?.name}
        </span>
      </div>

      {/* Action Text */}
      <div
        style={{
          background: PALETTE.uiBg,
          padding: '8px 24px',
          minHeight: 44,
          borderBottom: `1px solid ${PALETTE.uiBorder}`,
        }}
      >
        <span style={{ color: PALETTE.uiVerbActive, fontSize: 20 }}>
          {cursorAction || `${verbLabel}...`}
        </span>
      </div>

      {/* Game Canvas */}
      <div style={{ position: 'relative' }}>
        <GameCanvas />
        {/* Dialogue Overlay */}
        {dialogueActive && <DialogueBox />}
      </div>

      {/* Bottom Panel */}
      <div
        style={{
          background: PALETTE.uiBg,
          borderTop: `2px solid ${PALETTE.uiBorder}`,
          display: 'flex',
          gap: 0,
        }}
      >
        <VerbPanel />
        <InventoryBar />
      </div>

      {/* Message Box */}
      <MessageBar />
    </div>
  );
}
