// ═══════════════════════════════════════════════════════════
// Shared Type Definitions
// ═══════════════════════════════════════════════════════════

export type VerbId =
  | 'look'
  | 'pick_up'
  | 'use'
  | 'open'
  | 'close'
  | 'read'
  | 'talk'
  | 'push'
  | 'pull'
  | 'give';

export type Facing = 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface WalkArea {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Item {
  id: string;
  name: string;
  icon: string;
}

// Script command system — verb actions can be a plain string (legacy)
// or an array of commands executed in sequence.
export type ScriptCommand =
  | { cmd: 'say'; text: string }
  | { cmd: 'set_flag'; flag: string; value: boolean }
  | { cmd: 'give_item'; id: string; name: string; icon: string }
  | { cmd: 'remove_item'; id: string }
  | { cmd: 'change_room'; room: string; entryX?: number }
  | { cmd: 'start_dialogue'; id: string }
  | { cmd: 'if'; flag: string; negate?: boolean; then: ScriptCommand[]; else?: ScriptCommand[] };

export type Script = string | ScriptCommand[];

export interface ObjectActions {
  [verb: string]: Script | undefined;
}

export interface SceneObject {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  actions: ObjectActions;
  item?: Item;
}

export interface Exit {
  id: string;
  name: string;
  to: string;
  x: number;
  y: number;
  w: number;
  h: number;
  walkTo: Position;
}

export interface NPC {
  id: string;
  name: string;
  x: number;
  y: number;
  sprite: string;
  dialogue: string;
  actions: ObjectActions;
}

export interface Room {
  id: string;
  name: string;
  render: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  walkArea: WalkArea;
  objects: SceneObject[];
  exits: Exit[];
  npcs?: NPC[];
}

export interface Verb {
  id: VerbId;
  label: string;
  icon: string;
}

export interface PendingAction {
  type: 'interact' | 'exit';
  data: {
    obj?: SceneObject;
    verb?: VerbId;
    exit?: Exit;
  };
}

export const CANVAS_W = 1600;
export const CANVAS_H = 800;

export const PALETTE = {
  sky: '#1a1a2e',
  skyMid: '#16213e',
  sea: '#0f3460',
  seaLight: '#1a5276',
  sand: '#c4a35a',
  sandDark: '#a68b3d',
  wood: '#5d4037',
  woodLight: '#795548',
  woodDark: '#3e2723',
  leaf: '#2e7d32',
  leafLight: '#4caf50',
  leafDark: '#1b5e20',
  stone: '#607d8b',
  stoneDark: '#455a64',
  torch: '#ff9800',
  torchGlow: '#ffeb3b',
  sign: '#8d6e63',
  rope: '#a1887f',
  water: '#0d47a1',
  moon: '#fdd835',
  star: '#fff9c4',
  skin: '#ffccbc',
  shirt: '#e53935',
  pants: '#1565c0',
  hair: '#ffeb3b',
  black: '#000000',
  white: '#ffffff',
  uiBg: '#1a0a00',
  uiBorder: '#8b6914',
  uiText: '#ffd54f',
  uiVerb: '#4a2800',
  uiVerbHover: '#6d3f00',
  uiVerbActive: '#ff8f00',
  dialogBg: '#0a0a0a',
  msgText: '#c8e6c9',
} as const;

export const VERBS: Verb[] = [
  { id: 'look', label: '살펴보기', icon: '👁' },
  { id: 'pick_up', label: '집기', icon: '✋' },
  { id: 'use', label: '사용', icon: '⚙' },
  { id: 'open', label: '열기', icon: '📦' },
  { id: 'read', label: '읽기', icon: '📜' },
  { id: 'talk', label: '말하기', icon: '💬' },
  { id: 'push', label: '밀기', icon: '👉' },
  { id: 'pull', label: '당기기', icon: '👈' },
  { id: 'give', label: '주기', icon: '🎁' },
];
