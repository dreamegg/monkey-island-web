// ═══════════════════════════════════════════════════════════
// Game Config — per-game settings extracted from engine
//
// To create a new game:
//   1. Write public/games/{gameId}/config.json
//   2. Load via ?game={gameId} URL param (App.tsx handles this)
//   3. Add room JSONs to public/rooms/ and dialogue JSONs to public/dialogues/
//   4. Add backgrounds to public/assets/backgrounds/
// ═══════════════════════════════════════════════════════════

export interface TrialConfig {
  flag: string;
  icon: string;
  label: string;
}

export interface GameConfig {
  id: string;
  title: string;
  saveKey: string;
  startRoom: string;
  startPos: { x: number; y: number };
  startMessage: string;
  playerSprite: string;        // sprite key used by spriteAnimator
  rooms: string[];             // all room IDs to preload
  trials?: TrialConfig[];      // optional milestone/trial system
  trialsCompleteFlag?: string;
  usesInsultCombat?: boolean;
  language?: string;           // UI hint (default: 'ko')
}

// ── Default: Monkey Island ─────────────────────────────────

export const MONKEY_ISLAND_CONFIG: GameConfig = {
  id: 'monkey_island',
  title: '원숭이 섬의 비밀',
  saveKey: 'monkey_island_save',
  startRoom: 'harbor',
  startPos: { x: 0.5, y: 0.85 },
  startMessage: '원숭이 섬의 비밀에 오신 것을 환영합니다! 해적이 되기 위한 모험을 시작하세요.',
  playerSprite: 'guybrush',
  rooms: [
    'harbor', 'tavern', 'forest', 'beach', 'cave',
    'village_road', 'governor_mansion', 'mansion_interior',
    'stan_shop', 'sword_master_area', 'prison',
  ],
  trials: [
    { flag: 'trial1_complete', icon: '⚔', label: '검술 마스터 결투' },
    { flag: 'trial2_complete', icon: '🗿', label: '우상 도둑질' },
    { flag: 'trial3_complete', icon: '💰', label: '보물 사냥' },
  ],
  trialsCompleteFlag: 'trials_complete',
  usesInsultCombat: true,
  language: 'ko',
};

// ── Active config (mutable singleton) ─────────────────────

let _active: GameConfig = MONKEY_ISLAND_CONFIG;

export function getActiveConfig(): GameConfig {
  return _active;
}

export function setActiveConfig(config: GameConfig): void {
  _active = config;
}

// ── JSON loader (public/games/{gameId}/config.json) ────────

export async function loadGameConfig(
  gameId: string,
  base: string,
): Promise<GameConfig | null> {
  try {
    const res = await fetch(`${base}games/${gameId}/config.json`);
    if (!res.ok) return null;
    const config: GameConfig = await res.json();
    return config;
  } catch {
    return null;
  }
}
