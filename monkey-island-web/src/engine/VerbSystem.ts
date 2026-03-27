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
  const action = obj.actions?.[verb];
  if (action) {
    // Legacy item pickup: obj.item present → direct acquisition without running script
    if (verb === 'pick_up' && obj.item) {
      const state = get();
      if (!state.inventory.find((i) => i.id === obj.item!.id)) {
        state.addItem(obj.item);
        set({ message: `${obj.item.icon} ${obj.item.name}을(를) 획득했다!` });
        return;
      }
    }
    runScript(action, get());
  } else {
    const msg = FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
    set({ message: msg });
  }
}
