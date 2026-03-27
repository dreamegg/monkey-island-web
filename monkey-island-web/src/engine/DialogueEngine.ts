// ═══════════════════════════════════════════════════════════
// Dialogue Engine - Tree-based dialogue system
// ═══════════════════════════════════════════════════════════

export interface DialogueChoice {
  text: string;
  next: string;
  condition?: () => boolean;
  once?: boolean;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  portrait?: string;
  text: string;
  choices?: DialogueChoice[];
  next?: string;
  onEnter?: () => void;
}

export interface DialogueTree {
  id: string;
  startNode: string;
  nodes: Record<string, DialogueNode>;
}

const dialogueTrees = new Map<string, DialogueTree>();
const usedChoices = new Set<string>();

export function registerDialogueTree(tree: DialogueTree): void {
  dialogueTrees.set(tree.id, tree);
}

export function getDialogueTree(id: string): DialogueTree | undefined {
  return dialogueTrees.get(id);
}

export function getDialogueNode(
  treeId: string,
  nodeId: string,
): DialogueNode | undefined {
  const tree = dialogueTrees.get(treeId);
  if (!tree) return undefined;
  return tree.nodes[nodeId];
}

export function getAvailableChoices(
  treeId: string,
  nodeId: string,
): DialogueChoice[] {
  const node = getDialogueNode(treeId, nodeId);
  if (!node || !node.choices) return [];

  return node.choices.filter((choice) => {
    if (choice.condition && !choice.condition()) return false;
    if (choice.once && usedChoices.has(`${treeId}:${nodeId}:${choice.text}`)) {
      return false;
    }
    return true;
  });
}

export function markChoiceUsed(
  treeId: string,
  nodeId: string,
  choiceText: string,
): void {
  usedChoices.add(`${treeId}:${nodeId}:${choiceText}`);
}

export function resetDialogueState(): void {
  usedChoices.clear();
}
