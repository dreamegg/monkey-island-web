import { useEffect, useState } from 'react';
import { useGameStore, useGameStore as gameStore } from './engine/GameEngine';
import { PALETTE, VERBS } from './engine/types';
import { getRoom, preloadJsonRooms } from './engine/RoomLoader';
import { preloadAllBackgrounds } from './utils/assetLoader';
import { preloadCharacterSprites } from './utils/spriteAnimator';
import { playRoomMusic, playIntroMusic, stopMusic } from './utils/audioManager';
import { initDialogues } from './data/dialogues';
import { preloadJsonDialogues } from './engine/DialogueLoader';
import { preloadAllDepthConfigs } from './engine/DepthSystem';
import { loadGameConfig } from './engine/GameConfig';
import GameCanvas from './components/GameCanvas';
import VerbPanel from './components/VerbPanel';
import InventoryBar from './components/InventoryBar';
import MessageBar from './components/MessageBar';
import IntroScene from './components/IntroScene';
import EndingScene from './components/EndingScene';
import DialogueBox from './components/DialogueBox';
import InsultCombatBox from './components/InsultCombatBox';

function preloadGame(rooms: string[]) {
  preloadAllBackgrounds();
  preloadCharacterSprites();
  initDialogues();
  preloadAllDepthConfigs(rooms);
  preloadJsonRooms(rooms);
  preloadJsonDialogues(rooms);
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [showEnding, setShowEnding] = useState(false);

  const gameConfig = useGameStore((s) => s.gameConfig);
  const initializeGame = useGameStore((s) => s.initializeGame);

  // Load game from ?game=xxx URL param → public/games/xxx/config.json
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game');

    if (gameId && gameId !== 'monkey_island') {
      loadGameConfig(gameId, import.meta.env.BASE_URL).then((config) => {
        if (config) {
          initializeGame(config);
          preloadGame(config.rooms);
        } else {
          console.warn(`Game config not found: games/${gameId}/config.json — using default`);
          preloadGame(gameConfig.rooms);
        }
      });
    } else {
      preloadGame(gameConfig.rooms);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Trigger ending when player buys a ship
  useEffect(() => {
    if (!showIntro && !showEnding && flags['has_ship']) {
      stopMusic();
      setShowEnding(true);
    }
  }, [flags, showIntro, showEnding]);

  const currentRoom = getRoom(roomId);
  const verbLabel = VERBS.find((v) => v.id === selectedVerb)?.label ?? '';

  const trials = gameConfig.trials ?? [];
  const trialsComplete = gameConfig.trialsCompleteFlag
    ? flags[gameConfig.trialsCompleteFlag]
    : false;

  if (showIntro) {
    return <IntroScene onFinish={() => { stopMusic(); setShowIntro(false); }} />;
  }

  if (showEnding) {
    return <EndingScene onRestart={() => {
      setShowEnding(false);
      setShowIntro(true);
      useGameStore.getState().initializeGame(gameConfig);
    }} />;
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
          ☠ {gameConfig.title}
        </span>

        {/* Trial / milestone progress (optional) */}
        {trials.length > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: '#8d6e63', fontSize: 11 }}>시련:</span>
            {trials.map((t) => (
              <span
                key={t.flag}
                title={t.label}
                style={{ fontSize: 14, opacity: flags[t.flag] ? 1 : 0.3 }}
              >
                {t.icon}
              </span>
            ))}
            {trialsComplete && (
              <span style={{ color: '#ffd54f', fontSize: 11 }}>☠완수!</span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#8d6e63', fontSize: 14 }}>
            {currentRoom?.name}
          </span>
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
