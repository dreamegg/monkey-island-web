import type { SceneObject, VerbId } from './types';
import type { GameStore } from './GameEngine';
import { runScript } from './ScriptRunner';

type SetFn = (partial: Partial<GameStore> | ((s: GameStore) => Partial<GameStore>)) => void;
type GetFn = () => GameStore;

const FALLBACK_MESSAGES = [
  '그건 작동하지 않는다.',
  '그렇게 할 수 없다.',
  '아무 일도 일어나지 않았다.',
  '좋은 생각이지만... 안 된다.',
];

export function executeVerbAction(
  obj: SceneObject,
  verb: VerbId,
  get: GetFn,
  set: SetFn,
) {
  const state = get();
  const selectedItem = state.selectedInventoryItem;

  // Use selected inventory item on this object
  if (selectedItem && verb === 'use' && obj.useWith?.[selectedItem.id]) {
    set({ selectedInventoryItem: null, cursorAction: '' });
    runScript(obj.useWith[selectedItem.id], get());
    return;
  }

  // Clicked with a selected item but no matching useWith handler
  if (selectedItem && verb === 'use') {
    set({
      selectedInventoryItem: null,
      cursorAction: '',
      message: `${selectedItem.icon} ${selectedItem.name}을(를) ${obj.name}에 사용할 수 없다.`,
    });
    return;
  }

  const action = obj.actions?.[verb];
  if (action) {
    // Legacy item pickup: obj.item present → direct acquisition
    if (verb === 'pick_up' && obj.item) {
      if (!state.inventory.find((i) => i.id === obj.item!.id)) {
        state.addItem(obj.item);
        state.hideObject(obj.id);
        set({ message: `${obj.item.icon} ${obj.item.name}을(를) 획득했다!` });
        return;
      } else {
        set({ message: `이미 ${obj.item.name}을(를) 가지고 있다.` });
        return;
      }
    }
    runScript(action, get());
  } else {
    const msg = FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
    set({ message: msg });
  }
}
