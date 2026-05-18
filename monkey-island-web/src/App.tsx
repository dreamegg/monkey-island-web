import { useEffect, useState } from 'react';
import { useGameStore } from './engine/GameEngine';
import { PALETTE, VERBS } from './engine/types';
import { getRoom, preloadJsonRooms } from './engine/RoomLoader';
import { preloadAllBackgrounds } from './utils/assetLoader';
import { preloadCharacterSprites } from './utils/spriteAnimator';
import { playRoomMusic, playIntroMusic, stopMusic } from './utils/audioManager';
import { initDialogues } from './data/dialogues';
import { preloadJsonDialogues } from './engine/DialogueLoader';
import { preloadAllDepthConfigs } from './engine/DepthSystem';
import GameCanvas from './components/GameCanvas';
import VerbPanel from './components/VerbPanel';
import InventoryBar from './components/InventoryBar';
import MessageBar from './components/MessageBar';
import IntroScene from './components/IntroScene';
import DialogueBox from './components/DialogueBox';
import InsultCombatBox from './components/InsultCombatBox';

const ALL_ROOMS = [
  'harbor', 'tavern', 'forest', 'beach', 'cave',
  'village_road', 'governor_mansion', 'mansion_interior',
  'stan_shop', 'sword_master_area', 'prison',
];

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    preloadAllBackgrounds();
    preloadCharacterSprites();
    initDialogues();
    preloadAllDepthConfigs(ALL_ROOMS);
    preloadJsonRooms(ALL_ROOMS);
    preloadJsonDialogues(ALL_ROOMS);
  }, []);

  useEffect(() => {
    if (showIntro) playIntroMusic();
  }, [showIntro]);

  const roomId = useGameStore((s) => s.roomId);
  const dialogueActive = useGameStore((s) => s.dialogueActive);
  const insultCombat = useGameStore((s) => s.insultCombat);
  const cursorAction = useGameStore((s) => s.cursorAction);
  const selectedVerb = useGameStore((s) => s.selectedVerb);
  const flags = useGameStore((s) => s.flags);
  const saveGame = useGameStore((s) => s.saveGame);
  const loadGame = useGameStore((s) => s.loadGame);

  useEffect(() => {
    if (!showIntro) playRoomMusic(roomId);
  }, [roomId, showIntro]);

  const currentRoom = getRoom(roomId);
  const verbLabel = VERBS.find((v) => v.id === selectedVerb)?.label ?? '';

  // Trial progress indicator
  const trial1 = flags['trial1_complete'];
  const trial2 = flags['trial2_complete'];
  const trial3 = flags['trial3_complete'];
  const trialsComplete = flags['trials_complete'];

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
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `2px solid ${PALETTE.uiBorder}`,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ color: PALETTE.uiText, fontSize: 18 }}>
          ☠ 원숭이 섬의 비밀
        </span>

        {/* Trial progress */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color: '#8d6e63', fontSize: 11 }}>시련:</span>
          <span title="1. 검술 마스터 결투" style={{ fontSize: 14, opacity: trial1 ? 1 : 0.3 }}>⚔</span>
          <span title="2. 우상 도둑질" style={{ fontSize: 14, opacity: trial2 ? 1 : 0.3 }}>🗿</span>
          <span title="3. 보물 사냥" style={{ fontSize: 14, opacity: trial3 ? 1 : 0.3 }}>💰</span>
          {trialsComplete && <span style={{ color: '#ffd54f', fontSize: 11 }}>☠완수!</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#8d6e63', fontSize: 14 }}>
            {currentRoom?.name}
          </span>
          {/* Save / Load */}
          <button
            onClick={saveGame}
            style={{
              background: PALETTE.uiVerb,
              color: PALETTE.uiText,
              border: `1px solid ${PALETTE.uiBorder}`,
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            title="게임 저장"
          >
            💾 저장
          </button>
          <button
            onClick={loadGame}
            style={{
              background: PALETTE.uiVerb,
              color: PALETTE.uiText,
              border: `1px solid ${PALETTE.uiBorder}`,
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            title="게임 불러오기"
          >
            📂 불러오기
          </button>
        </div>
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
        {dialogueActive && <DialogueBox />}
        {insultCombat?.active && <InsultCombatBox />}
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
