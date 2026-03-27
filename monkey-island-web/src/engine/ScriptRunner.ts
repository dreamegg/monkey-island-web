import type { Script, ScriptCommand, Item } from './types';

// Minimal interface to avoid circular dependency with GameEngine
export interface ScriptContext {
  setMessage: (msg: string) => void;
  setFlag: (flag: string, value: boolean) => void;
  getFlag: (flag: string) => boolean;
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  changeRoom: (roomId: string, entryX: number) => void;
  startDialogue: (id: string) => void;
}

export function runScript(script: Script, ctx: ScriptContext): void {
  if (typeof script === 'string') {
    ctx.setMessage(script);
    return;
  }
  for (const cmd of script) {
    executeCommand(cmd, ctx);
  }
}

function executeCommand(cmd: ScriptCommand, ctx: ScriptContext): void {
  switch (cmd.cmd) {
    case 'say':
      ctx.setMessage(cmd.text);
      break;
    case 'set_flag':
      ctx.setFlag(cmd.flag, cmd.value);
      break;
    case 'give_item':
      ctx.addItem({ id: cmd.id, name: cmd.name, icon: cmd.icon });
      ctx.setMessage(`${cmd.icon} ${cmd.name}을(를) 획득했다!`);
      break;
    case 'remove_item':
      ctx.removeItem(cmd.id);
      break;
    case 'change_room':
      ctx.changeRoom(cmd.room, cmd.entryX ?? 0.5);
      break;
    case 'start_dialogue':
      ctx.startDialogue(cmd.id);
      break;
    case 'if': {
      const flagValue = ctx.getFlag(cmd.flag);
      const condition = cmd.negate ? !flagValue : flagValue;
      const branch = condition ? cmd.then : cmd.else;
      if (branch) {
        for (const c of branch) executeCommand(c, ctx);
      }
      break;
    }
  }
}
