import { create } from 'zustand';
import type { VerbId, Facing, Position, Item, PendingAction } from './types';
import { getRoom, loadJsonRoom } from './RoomLoader';
import { clampToWalkArea } from './Pathfinding';
import { executeVerbAction } from './VerbSystem';
import {
  getDialogueTree,
  getDialogueNode,
  getAvailableChoices,
  markChoiceUsed,
} from './DialogueEngine';
import { loadRoomDepthConfig } from './DepthSystem';
import {
  getCombatConfig,
  shuffleChoices,
  pickRandomInsult,
  type InsultPair,
} from './InsultCombat';
import {
  type GameConfig,
  MONKEY_ISLAND_CONFIG,
  getActiveConfig,
  setActiveConfig,
} from './GameConfig';

// ── Insult combat runtime state ───────────────────────────
export interface InsultCombatState {
  active: boolean;
  opponentId: string;
  opponentName: string;
  playerHP: number;
  npcHP: number;
  playerMaxHP: number;
  npcMaxHP: number;
  currentInsult: InsultPair | null;
  currentChoices: string[];
  usedInsultIds: string[];
  feedback: string | null;
  feedbackCorrect: boolean;
  result: 'ongoing' | 'player_won' | 'player_lost';
}

interface GameState {
  gameConfig: GameConfig;
  playerSprite: string;
  roomId: string;
  playerPos: Position;
  targetPos: Position | null;
  facing: Facing;
  isMoving: boolean;
  frame: number;
  selectedVerb: VerbId;
  hoveredObject: string | null;
  cursorAction: string;
  message: string;
  inventory: Item[];
  selectedInventoryItem: Item | null;
  pickedObjects: string[];
  pendingAction: PendingAction | null;
  dialogueActive: boolean;
  currentDialogue: string | null;
  currentNode: string | null;
  dialogueNpcId: string | null;
  pickupAnimStart: number | null;
  flags: Record<string, boolean>;
  insultCombat: InsultCombatState | null;
}

interface GameActions {
  selectVerb: (verb: VerbId) => void;
  walkTo: (pos: Position) => void;
  tickMovement: () => void;
  tickFrame: () => void;
  moveByKey: (dx: number, dy: number) => void;
  interactWithObject: (objectId: string) => void;
  useExit: (exitId: string) => void;
  setPendingAction: (action: PendingAction | null) => void;
  setHoveredObject: (id: string | null) => void;
  setCursorAction: (action: string) => void;
  setMessage: (msg: string) => void;
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  selectInventoryItem: (item: Item | null) => void;
  hideObject: (objectId: string) => void;
  changeRoom: (roomId: string, entryX: number) => void;
  startDialogue: (dialogueId: string, npcId?: string) => void;
  triggerPickupAnim: () => void;
  advanceDialogue: () => void;
  selectChoice: (choiceIndex: number) => void;
  endDialogue: () => void;
  setFlag: (flag: string, value: boolean) => void;
  getFlag: (flag: string) => boolean;
  loadRoom: (roomId: string) => Promise<void>;
  saveGame: () => void;
  loadGame: () => boolean;
  startInsultCombat: (opponentId: string) => void;
  answerInsult: (choiceText: string) => void;
  dismissCombatResult: () => void;
  initializeGame: (config: GameConfig) => void;
}

export type GameStore = GameState & GameActions;

const MOVE_SPEED = 0.012;

export const useGameStore = create<GameStore>((set, get) => ({
  gameConfig: MONKEY_ISLAND_CONFIG,
  playerSprite: MONKEY_ISLAND_CONFIG.playerSprite,
  roomId: MONKEY_ISLAND_CONFIG.startRoom,
  playerPos: MONKEY_ISLAND_CONFIG.startPos,
  targetPos: null,
  facing: 'right',
  isMoving: false,
  frame: 0,
  selectedVerb: 'look',
  hoveredObject: null,
  cursorAction: '',
  message: MONKEY_ISLAND_CONFIG.startMessage,
  inventory: [],
  selectedInventoryItem: null,
  pickedObjects: [],
  pendingAction: null,
  dialogueActive: false,
  currentDialogue: null,
  currentNode: null,
  dialogueNpcId: null,
  pickupAnimStart: null,
  flags: {},
  insultCombat: null,

  selectVerb: (verb) => set({ selectedVerb: verb, selectedInventoryItem: null }),

  walkTo: (pos) => {
    const { roomId } = get();
    const room = getRoom(roomId);
    if (!room) return;
    const clamped = clampToWalkArea(pos, room.walkArea, roomId);
    set({ targetPos: clamped, isMoving: true });
  },

  tickMovement: () => {
    const { targetPos, playerPos, pendingAction } = get();
    if (!targetPos) return;

    const dx = targetPos.x - playerPos.x;
    const dy = targetPos.y - playerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < MOVE_SPEED) {
      set({ playerPos: targetPos, targetPos: null, isMoving: false });
      if (pendingAction) {
        const { type, data } = pendingAction;
        set({ pendingAction: null });
        if (type === 'interact' && data.obj && data.verb) {
          executeVerbAction(data.obj, data.verb, get, set);
        }
        if (type === 'exit' && data.exit) {
          const exit = data.exit;
          const entryX = exit.walkTo.x < 0.5 ? 0.92 : 0.08;
          get().changeRoom(exit.to, entryX);
        }
      }
      return;
    }

    const newFacing: Facing = dx > 0.01 ? 'right' : dx < -0.01 ? 'left' : get().facing;
    set({
      playerPos: {
        x: playerPos.x + (dx / dist) * MOVE_SPEED,
        y: playerPos.y + (dy / dist) * MOVE_SPEED,
      },
      facing: newFacing,
      isMoving: true,
    });
  },

  tickFrame: () => set((s) => ({ frame: s.frame + 1 })),

  moveByKey: (dx, dy) => {
    const { playerPos, roomId } = get();
    const room = getRoom(roomId);
    if (!room) return;
    const newPos = clampToWalkArea(
      { x: playerPos.x + dx, y: playerPos.y + dy },
      room.walkArea,
      roomId,
    );
    const newFacing: Facing = dx > 0 ? 'right' : dx < 0 ? 'left' : get().facing;
    set({
      playerPos: newPos,
      targetPos: null,
      pendingAction: null,
      facing: newFacing,
      isMoving: dx !== 0 || dy !== 0,
    });
  },

  interactWithObject: (objectId) => {
    const state = get();
    const room = getRoom(state.roomId);
    if (!room) return;
    const obj = room.objects.find((o) => o.id === objectId);
    if (!obj) return;

    const walkTarget = clampToWalkArea(
      { x: obj.x + obj.w / CANVAS_W / 2, y: room.walkArea.y1 + 0.05 },
      room.walkArea,
      state.roomId,
    );
    set({
      targetPos: walkTarget,
      isMoving: true,
      pendingAction: { type: 'interact', data: { obj, verb: state.selectedVerb } },
    });
  },

  useExit: (exitId) => {
    const state = get();
    const room = getRoom(state.roomId);
    if (!room) return;
    const exit = room.exits.find((e) => e.id === exitId);
    if (!exit) return;

    const walkTarget = clampToWalkArea(exit.walkTo, room.walkArea, state.roomId);
    set({
      targetPos: walkTarget,
      isMoving: true,
      pendingAction: { type: 'exit', data: { exit } },
      message: `${exit.name}(으)로 이동 중...`,
    });
  },

  setPendingAction: (action) => set({ pendingAction: action }),

  setHoveredObject: (id) => set({ hoveredObject: id }),
  setCursorAction: (action) => set({ cursorAction: action }),
  setMessage: (msg) => set({ message: msg }),

  addItem: (item) =>
    set((s) => {
      if (s.inventory.find((i) => i.id === item.id)) return s;
      return { inventory: [...s.inventory, item] };
    }),

  removeItem: (itemId) =>
    set((s) => ({ inventory: s.inventory.filter((i) => i.id !== itemId) })),

  selectInventoryItem: (item) =>
    set((s) => ({
      selectedInventoryItem: s.selectedInventoryItem?.id === item?.id ? null : item,
      cursorAction: item ? `${item.icon} ${item.name} 사용 대상 선택...` : '',
    })),

  hideObject: (objectId) =>
    set((s) => ({
      pickedObjects: s.pickedObjects.includes(objectId)
        ? s.pickedObjects
        : [...s.pickedObjects, objectId],
    })),

  changeRoom: (roomId, entryX) => {
    const newRoom = getRoom(roomId);
    if (!newRoom) return;
    loadRoomDepthConfig(roomId);
    set({
      roomId,
      playerPos: { x: entryX, y: 0.85 },
      targetPos: null,
      isMoving: false,
      pendingAction: null,
      selectedInventoryItem: null,
      message: `${newRoom.name}에 도착했다.`,
    });
  },

  startDialogue: (dialogueId, npcId) => {
    const tree = getDialogueTree(dialogueId);
    if (!tree) return;
    const startNode = getDialogueNode(dialogueId, tree.startNode);
    if (startNode?.onEnter) startNode.onEnter();
    set({
      dialogueActive: true,
      currentDialogue: dialogueId,
      currentNode: tree.startNode,
      dialogueNpcId: npcId ?? null,
      targetPos: null,
      isMoving: false,
      pendingAction: null,
    });
  },

  triggerPickupAnim: () => set({ pickupAnimStart: performance.now() }),

  advanceDialogue: () => {
    const { currentDialogue, currentNode } = get();
    if (!currentDialogue || !currentNode) return;
    const node = getDialogueNode(currentDialogue, currentNode);
    if (!node) {
      get().endDialogue();
      return;
    }
    const choices = getAvailableChoices(currentDialogue, currentNode);
    if (choices.length > 0) return;
    if (node.next) {
      const nextNode = getDialogueNode(currentDialogue, node.next);
      if (nextNode?.onEnter) nextNode.onEnter();
      set({ currentNode: node.next });
    } else {
      get().endDialogue();
    }
  },

  selectChoice: (choiceIndex) => {
    const { currentDialogue, currentNode } = get();
    if (!currentDialogue || !currentNode) return;
    const choices = getAvailableChoices(currentDialogue, currentNode);
    const choice = choices[choiceIndex];
    if (!choice) return;
    if (choice.once) {
      markChoiceUsed(currentDialogue, currentNode, choice.text);
    }
    const nextNode = getDialogueNode(currentDialogue, choice.next);
    if (nextNode?.onEnter) nextNode.onEnter();
    set({ currentNode: choice.next });
  },

  endDialogue: () => {
    set({
      dialogueActive: false,
      currentDialogue: null,
      currentNode: null,
      dialogueNpcId: null,
    });
  },

  loadRoom: async (roomId) => {
    await loadJsonRoom(roomId);
  },

  setFlag: (flag, value) => {
    set((s) => ({ flags: { ...s.flags, [flag]: value } }));
  },

  getFlag: (flag) => {
    return get().flags[flag] ?? false;
  },

  // ── Save / Load ───────────────────────────────────────────
  saveGame: () => {
    const { roomId, playerPos, facing, inventory, flags, pickedObjects, gameConfig } = get();
    const data = { roomId, playerPos, facing, inventory, flags, pickedObjects };
    try {
      localStorage.setItem(gameConfig.saveKey, JSON.stringify(data));
      set({ message: '💾 게임이 저장되었습니다.' });
    } catch {
      set({ message: '저장에 실패했습니다.' });
    }
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(get().gameConfig.saveKey);
      if (!raw) {
        set({ message: '저장된 게임이 없습니다.' });
        return false;
      }
      const data = JSON.parse(raw);
      const newRoom = getRoom(data.roomId);
      if (!newRoom) return false;
      set({
        roomId: data.roomId,
        playerPos: data.playerPos,
        facing: data.facing,
        inventory: data.inventory ?? [],
        flags: data.flags ?? {},
        pickedObjects: data.pickedObjects ?? [],
        targetPos: null,
        isMoving: false,
        pendingAction: null,
        dialogueActive: false,
        currentDialogue: null,
        currentNode: null,
        selectedInventoryItem: null,
        message: '💾 게임을 불러왔습니다.',
      });
      return true;
    } catch {
      set({ message: '불러오기에 실패했습니다.' });
      return false;
    }
  },

  // ── Insult Combat ─────────────────────────────────────────
  startInsultCombat: (opponentId) => {
    const config = getCombatConfig(opponentId);
    const firstInsult = pickRandomInsult(config.insultPool, []);
    if (!firstInsult) return;

    set({
      dialogueActive: false,
      currentDialogue: null,
      currentNode: null,
      insultCombat: {
        active: true,
        opponentId: config.opponentId,
        opponentName: config.opponentName,
        playerHP: config.playerMaxHP,
        npcHP: config.npcMaxHP,
        playerMaxHP: config.playerMaxHP,
        npcMaxHP: config.npcMaxHP,
        currentInsult: firstInsult,
        currentChoices: shuffleChoices(firstInsult),
        usedInsultIds: [firstInsult.id],
        feedback: null,
        feedbackCorrect: false,
        result: 'ongoing',
      },
    });
  },

  answerInsult: (choiceText) => {
    const { insultCombat } = get();
    if (!insultCombat || insultCombat.result !== 'ongoing') return;
    if (!insultCombat.currentInsult) return;

    const correct = choiceText === insultCombat.currentInsult.comeback;
    const newPlayerHP = correct ? insultCombat.playerHP : insultCombat.playerHP - 1;
    const newNpcHP = correct ? insultCombat.npcHP - 1 : insultCombat.npcHP;
    const feedback = correct
      ? '정확한 응수! 상대방이 당황했다!'
      : '틀린 응수! 상대가 공격했다!';

    if (newNpcHP <= 0) {
      // Player wins
      const { opponentId } = insultCombat;
      set({ insultCombat: { ...insultCombat, npcHP: 0, feedback, feedbackCorrect: correct, result: 'player_won' } });
      // Reward by opponent
      setTimeout(() => {
        const store = get();
        if (opponentId === 'carla') {
          store.addItem({ id: 'sword_certificate', name: '검술 수료증', icon: '📜' });
          store.setFlag('trial1_complete', true);
        }
        if (opponentId === 'practice_pirate' || opponentId === 'harbor_pirate') {
          store.setFlag('defeated_street_pirate', true);
        }
      }, 100);
      return;
    }

    if (newPlayerHP <= 0) {
      set({ insultCombat: { ...insultCombat, playerHP: 0, feedback, feedbackCorrect: correct, result: 'player_lost' } });
      return;
    }

    // Pick next insult
    const config = getCombatConfig(insultCombat.opponentId);
    const nextInsult = pickRandomInsult(config.insultPool, insultCombat.usedInsultIds);

    // Show feedback briefly, then advance
    set({
      insultCombat: {
        ...insultCombat,
        playerHP: newPlayerHP,
        npcHP: newNpcHP,
        feedback,
        feedbackCorrect: correct,
        currentInsult: nextInsult,
        currentChoices: nextInsult ? shuffleChoices(nextInsult) : [],
        usedInsultIds: nextInsult
          ? [...insultCombat.usedInsultIds, nextInsult.id]
          : insultCombat.usedInsultIds,
      },
    });
  },

  dismissCombatResult: () => {
    const { insultCombat } = get();
    if (!insultCombat) return;
    const won = insultCombat.result === 'player_won';
    const opponentId = insultCombat.opponentId;
    set({ insultCombat: null });
    if (won) {
      if (opponentId === 'carla') {
        set({ message: '칼라를 이겼다! 📜 검술 수료증을 받았다. 1차 시련 완수!' });
      } else {
        set({ message: '결투에서 이겼다! 욕설 기술이 늘었다.' });
      }
    } else {
      if (opponentId === 'carla') {
        set({ message: '칼라에게 졌다. 더 많은 욕설을 배우고 다시 도전하라!' });
      } else {
        set({ message: '결투에서 졌다... 다시 도전하라!' });
      }
    }
  },

  initializeGame: (config: GameConfig) => {
    setActiveConfig(config);
    set({
      gameConfig: config,
      playerSprite: config.playerSprite,
      roomId: config.startRoom,
      playerPos: config.startPos,
      targetPos: null,
      facing: 'right',
      isMoving: false,
      frame: 0,
      selectedVerb: 'look',
      hoveredObject: null,
      cursorAction: '',
      message: config.startMessage,
      inventory: [],
      selectedInventoryItem: null,
      pickedObjects: [],
      pendingAction: null,
      dialogueActive: false,
      currentDialogue: null,
      currentNode: null,
      flags: {},
      insultCombat: null,
    });
  },
}));

const CANVAS_W = 1600;
