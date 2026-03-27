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

interface GameState {
  // Scene
  roomId: string;
  // Player
  playerPos: Position;
  targetPos: Position | null;
  facing: Facing;
  isMoving: boolean;
  frame: number;
  // UI
  selectedVerb: VerbId;
  hoveredObject: string | null;
  cursorAction: string;
  message: string;
  // Inventory
  inventory: Item[];
  // Internal
  pendingAction: PendingAction | null;
  // Dialogue
  dialogueActive: boolean;
  currentDialogue: string | null;
  currentNode: string | null;
  // Game flags
  flags: Record<string, boolean>;
}

interface GameActions {
  // Verb
  selectVerb: (verb: VerbId) => void;
  // Movement
  walkTo: (pos: Position) => void;
  tickMovement: () => void;
  tickFrame: () => void;
  moveByKey: (dx: number, dy: number) => void;
  // Interaction
  interactWithObject: (objectId: string) => void;
  useExit: (exitId: string) => void;
  setPendingAction: (action: PendingAction | null) => void;
  // Hover
  setHoveredObject: (id: string | null) => void;
  setCursorAction: (action: string) => void;
  // Message
  setMessage: (msg: string) => void;
  // Inventory
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  // Room
  changeRoom: (roomId: string, entryX: number) => void;
  // Dialogue
  startDialogue: (dialogueId: string) => void;
  advanceDialogue: () => void;
  selectChoice: (choiceIndex: number) => void;
  endDialogue: () => void;
  // Flags
  setFlag: (flag: string, value: boolean) => void;
  getFlag: (flag: string) => boolean;
  // Room loader
  loadRoom: (roomId: string) => Promise<void>;
}

export type GameStore = GameState & GameActions;

const MOVE_SPEED = 0.012;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  roomId: 'harbor',
  playerPos: { x: 0.5, y: 0.85 },
  targetPos: null,
  facing: 'right',
  isMoving: false,
  frame: 0,
  selectedVerb: 'look',
  hoveredObject: null,
  cursorAction: '',
  message: '원숭이 섬의 비밀에 오신 것을 환영합니다! 해적이 되기 위한 모험을 시작하세요.',
  inventory: [],
  pendingAction: null,
  dialogueActive: false,
  currentDialogue: null,
  currentNode: null,
  flags: {},

  // Actions
  selectVerb: (verb) => set({ selectedVerb: verb }),

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
      // Execute pending action on arrival
      if (pendingAction) {
        const { type, data } = pendingAction;
        set({ pendingAction: null });
        if (type === 'interact' && data.obj && data.verb) {
          executeVerbAction(data.obj, data.verb, get, set);
        }
        if (type === 'exit' && data.exit) {
          const exit = data.exit;
          // Entry position depends on which side of the room the player enters from
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

  changeRoom: (roomId, entryX) => {
    const newRoom = getRoom(roomId);
    if (!newRoom) return;
    // Preload depth config for the new room (fire & forget)
    loadRoomDepthConfig(roomId);
    set({
      roomId,
      playerPos: { x: entryX, y: 0.85 },
      targetPos: null,
      isMoving: false,
      pendingAction: null,
      message: `${newRoom.name}에 도착했다.`,
    });
  },

  // Dialogue actions
  startDialogue: (dialogueId) => {
    const tree = getDialogueTree(dialogueId);
    if (!tree) return;
    const startNode = getDialogueNode(dialogueId, tree.startNode);
    if (startNode?.onEnter) startNode.onEnter();
    set({
      dialogueActive: true,
      currentDialogue: dialogueId,
      currentNode: tree.startNode,
      targetPos: null,
      isMoving: false,
      pendingAction: null,
    });
  },

  advanceDialogue: () => {
    const { currentDialogue, currentNode } = get();
    if (!currentDialogue || !currentNode) return;
    const node = getDialogueNode(currentDialogue, currentNode);
    if (!node) {
      get().endDialogue();
      return;
    }
    // If node has choices, don't auto-advance
    const choices = getAvailableChoices(currentDialogue, currentNode);
    if (choices.length > 0) return;
    // Auto-advance to next node
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
    });
  },

  // Room loader
  loadRoom: async (roomId) => {
    await loadJsonRoom(roomId);
  },

  // Flag actions
  setFlag: (flag, value) => {
    set((s) => ({ flags: { ...s.flags, [flag]: value } }));
  },

  getFlag: (flag) => {
    return get().flags[flag] ?? false;
  },
}));

const CANVAS_W = 1600;
