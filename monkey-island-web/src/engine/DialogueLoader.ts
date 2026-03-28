// ═══════════════════════════════════════════════════════════
// Dialogue Loader — loads JSON dialogue trees from
//   /public/dialogues/{id}.json
// and registers them with DialogueEngine.
//
// JSON format mirrors DialogueTree but uses data-only types:
//   - onEnter: ScriptCommand[]  (converted to () => void)
//   - choices[].condition: string flag + optional negate bool
// ═══════════════════════════════════════════════════════════

import type { ScriptCommand } from './types';
import type { DialogueTree, DialogueNode, DialogueChoice } from './DialogueEngine';
import { registerDialogueTree } from './DialogueEngine';
import { runScript } from './ScriptRunner';
import { useGameStore } from './GameEngine';

// ── JSON-safe types (no functions) ──────────────────────────

interface DialogueChoiceJson {
  text: string;
  next: string;
  condition?: string;   // flag name
  negate?: boolean;     // negate the flag check
  once?: boolean;
}

interface DialogueNodeJson {
  id: string;
  speaker: string;
  portrait?: string;
  text: string;
  choices?: DialogueChoiceJson[];
  next?: string;
  onEnter?: ScriptCommand[];
}

interface DialogueTreeJson {
  id: string;
  startNode: string;
  nodes: Record<string, DialogueNodeJson>;
}

// ── Cache ────────────────────────────────────────────────────

const loadedIds = new Set<string>();
const loadingPromises = new Map<string, Promise<boolean>>();

// ── Public API ───────────────────────────────────────────────

/**
 * Load + register a dialogue tree from /public/dialogues/{id}.json.
 * Returns true on success, false if not found / error.
 * Safe to call multiple times — deduplicates by id.
 */
export function loadJsonDialogue(id: string): Promise<boolean> {
  if (loadedIds.has(id)) return Promise.resolve(true);
  if (loadingPromises.has(id)) return loadingPromises.get(id)!;

  const promise = (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}dialogues/${id}.json`);
      if (!res.ok) return false;
      const data: DialogueTreeJson = await res.json();
      const tree = jsonToDialogueTree(data);
      registerDialogueTree(tree);
      loadedIds.add(id);
      return true;
    } catch {
      return false;
    }
  })();

  loadingPromises.set(id, promise);
  return promise;
}

/**
 * Preload multiple JSON dialogue trees in parallel.
 */
export async function preloadJsonDialogues(ids: string[]): Promise<void> {
  await Promise.allSettled(ids.map(loadJsonDialogue));
}

// ── Conversion helpers ───────────────────────────────────────

function jsonToDialogueTree(data: DialogueTreeJson): DialogueTree {
  const nodes: Record<string, DialogueNode> = {};
  for (const [key, nodeJson] of Object.entries(data.nodes)) {
    nodes[key] = jsonToDialogueNode(nodeJson);
  }
  return { id: data.id, startNode: data.startNode, nodes };
}

function jsonToDialogueNode(nodeJson: DialogueNodeJson): DialogueNode {
  const node: DialogueNode = {
    id: nodeJson.id,
    speaker: nodeJson.speaker,
    text: nodeJson.text,
  };

  if (nodeJson.portrait) node.portrait = nodeJson.portrait;
  if (nodeJson.next) node.next = nodeJson.next;

  if (nodeJson.onEnter && nodeJson.onEnter.length > 0) {
    const cmds = nodeJson.onEnter;
    node.onEnter = () => {
      const state = useGameStore.getState();
      runScript(cmds, {
        setMessage: state.setMessage,
        setFlag: state.setFlag,
        getFlag: state.getFlag,
        addItem: state.addItem,
        removeItem: state.removeItem,
        changeRoom: (roomId, entryX) => state.changeRoom(roomId, entryX),
        startDialogue: state.startDialogue,
      });
    };
  }

  if (nodeJson.choices) {
    node.choices = nodeJson.choices.map(convertChoice);
  }

  return node;
}

function convertChoice(choiceJson: DialogueChoiceJson): DialogueChoice {
  const choice: DialogueChoice = {
    text: choiceJson.text,
    next: choiceJson.next,
  };

  if (choiceJson.once) choice.once = true;

  if (choiceJson.condition) {
    const flagName = choiceJson.condition;
    const negate = choiceJson.negate ?? false;
    choice.condition = () => {
      const value = useGameStore.getState().getFlag(flagName);
      return negate ? !value : value;
    };
  }

  return choice;
}
