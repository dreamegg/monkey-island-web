import type { DialogueTree } from '../engine/DialogueEngine';
import { registerDialogueTree } from '../engine/DialogueEngine';
import { useGameStore } from '../engine/GameEngine';

// ── Helper ──────────────────────────────────────────────────
function setFlag(flag: string, value: boolean = true) {
  useGameStore.getState().setFlag(flag, value);
}

function getFlag(flag: string): boolean {
  return useGameStore.getState().getFlag(flag);
}

function addItem(id: string, name: string, icon: string) {
  useGameStore.getState().addItem({ id, name, icon });
}

// ── Three Pirates at Harbor ─────────────────────────────────
const threePirates: DialogueTree = {
  id: 'three_pirates',
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '어이, 꼬마! 뭘 멍하니 서있는 거야?',
      choices: [
        { text: '저는 해적이 되고 싶습니다!', next: 'want_pirate' },
        { text: '여기가 어디죠?', next: 'where' },
        { text: '아무것도 아닙니다. 실례합니다.', next: 'bye' },
      ],
    },
    want_pirate: {
      id: 'want_pirate',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '해적이 되고 싶다고? 하하하! 그러려면 세 가지 시련을 통과해야 해!',
      next: 'trials',
    },
    trials: {
      id: 'trials',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '첫째, 검술을 마스터할 것! 둘째, 도둑질의 기술을 익힐 것! 셋째, 보물 사냥의 달인이 될 것!',
      onEnter: () => setFlag('knows_trials'),
      next: 'trials_detail',
    },
    trials_detail: {
      id: 'trials_detail',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '세 가지 시련을 모두 통과하면 진정한 해적으로 인정받게 될 거다!',
      choices: [
        { text: '검술은 어디서 배울 수 있나요?', next: 'sword_hint' },
        { text: '도둑질이라니... 뭘 훔쳐야 하죠?', next: 'theft_hint' },
        { text: '보물 사냥은 어떻게 하나요?', next: 'treasure_hint' },
        { text: '알겠습니다. 해보겠습니다!', next: 'accept' },
      ],
    },
    sword_hint: {
      id: 'sword_hint',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '섬 어딘가에 검술의 달인이 살고 있다더군. 선술집 바텐더에게 물어봐.',
      next: 'trials_detail',
    },
    theft_hint: {
      id: 'theft_hint',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '총독 관저에서 우상을 훔쳐와야 해. 쉽지 않을 거다!',
      next: 'trials_detail',
    },
    treasure_hint: {
      id: 'treasure_hint',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '숲 속 어딘가에 보물 지도가 있다는 소문이 있어. 해변 동굴을 조사해 봐.',
      next: 'trials_detail',
    },
    accept: {
      id: 'accept',
      speaker: '가이브러시',
      portrait: '/assets/portraits/guybrush.png',
      text: '좋아, 해적이 되기 위해 세 가지 시련을 통과하겠어!',
      next: 'goodbye',
    },
    goodbye: {
      id: 'goodbye',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '행운을 빈다, 꼬마! ...뭐, 살아남기만 하면 되는 거지.',
    },
    where: {
      id: 'where',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '여기는 멜레 섬의 항구다. 카리브해에서 가장 악명 높은 해적들의 본거지지!',
      choices: [
        { text: '저는 해적이 되고 싶습니다!', next: 'want_pirate' },
        { text: '그렇군요. 감사합니다.', next: 'bye' },
      ],
    },
    bye: {
      id: 'bye',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '흥, 어디든 가 봐라.',
    },
  },
};

// ── Bartender at Tavern ─────────────────────────────────────
const bartender: DialogueTree = {
  id: 'bartender',
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '...뭘 원하지? 여기선 돈 없으면 물도 안 줘.',
      choices: [
        { text: '그로그 맥주 한 잔 주세요.', next: 'grog' },
        { text: '이 섬에 대해 알려주세요.', next: 'island' },
        { text: '르척에 대해 들은 적 있나요?', next: 'lechuck' },
        {
          text: '검술의 달인이 어디 있는지 아시나요?',
          next: 'sword_master',
          condition: () => getFlag('knows_trials'),
        },
        { text: '아무것도요. 실례합니다.', next: 'bye' },
      ],
    },
    grog: {
      id: 'grog',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '그로그? 한 잔에 동전 2닢이다. ...돈이 없어 보이는데?',
      choices: [
        { text: '외상은 안 되나요?', next: 'no_credit' },
        { text: '다른 걸 물어볼게요.', next: 'start' },
      ],
    },
    no_credit: {
      id: 'no_credit',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '하! 외상이라고? 해적한테 외상을 줬다가 돈을 받은 적이 한 번도 없다.',
      next: 'start',
    },
    island: {
      id: 'island',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '멜레 섬은 예전엔 평화로웠지. 르척이 나타나기 전까진 말이야...',
      choices: [
        { text: '르척이 누구죠?', next: 'lechuck' },
        { text: '다른 걸 물어볼게요.', next: 'start' },
      ],
    },
    lechuck: {
      id: 'lechuck',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '르척?! 그 이름을 함부로 입에 담지 마! 유령 해적이야. 죽어서도 바다를 떠돌며 공포를 퍼뜨리고 있지.',
      choices: [
        { text: '어떻게 하면 르척을 물리칠 수 있죠?', next: 'defeat_lechuck' },
        { text: '무섭군요... 다른 걸 물어볼게요.', next: 'start' },
      ],
    },
    defeat_lechuck: {
      id: 'defeat_lechuck',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '르척을 물리치겠다고? 미쳤군! ...숲 속에 부두교 여사제가 있어. 그녀라면 방법을 알지도 몰라.',
      onEnter: () => setFlag('knows_voodoo_lady'),
      next: 'voodoo_hint',
    },
    voodoo_hint: {
      id: 'voodoo_hint',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '숲을 지나면 그녀의 오두막이 있을 거다. 조심해, 숲에는 이상한 것들이 많으니까.',
      choices: [
        { text: '감사합니다.', next: 'bye' },
        { text: '다른 것도 물어볼게요.', next: 'start' },
      ],
    },
    sword_master: {
      id: 'sword_master',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '검술의 달인? 캐리 섬에 산다고 들었는데... 먼저 숲에서 연습을 해야 할 거야.',
      onEnter: () => setFlag('knows_sword_master'),
      choices: [
        { text: '다른 것도 물어볼게요.', next: 'start' },
        { text: '감사합니다.', next: 'bye' },
      ],
    },
    bye: {
      id: 'bye',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '흥... 다음엔 돈을 가지고 와.',
    },
  },
};

// ── Voodoo Lady in Forest ───────────────────────────────────
const voodooLady: DialogueTree = {
  id: 'voodoo_lady',
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '오... 널 기다리고 있었단다, 가이브러시 쓰립우드. 네가 올 줄 알았어.',
      choices: [
        { text: '제 이름을 어떻게 아시죠?!', next: 'know_name' },
        { text: '르척에 대해 알려주세요.', next: 'about_lechuck' },
        {
          text: '부두교의 힘으로 도와주실 수 있나요?',
          next: 'voodoo_help',
        },
        { text: '실례합니다. 가보겠습니다.', next: 'bye' },
      ],
    },
    know_name: {
      id: 'know_name',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '부두교의 힘은 모든 것을 보여준단다. 네 운명이... 르척과 얽혀있는 것도.',
      choices: [
        { text: '르척에 대해 알려주세요.', next: 'about_lechuck' },
        { text: '제 운명이요?', next: 'destiny' },
      ],
    },
    destiny: {
      id: 'destiny',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '너는 르척을 물리칠 운명이야. 하지만 그전에 준비가 필요해.',
      next: 'about_lechuck',
    },
    about_lechuck: {
      id: 'about_lechuck',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '르척은 유령 해적... 한때는 살아있는 해적이었지만, 원숭이 섬의 저주로 유령이 되었어.',
      choices: [
        { text: '어떻게 하면 물리칠 수 있죠?', next: 'how_defeat' },
        { text: '원숭이 섬이 뭐죠?', next: 'monkey_island' },
      ],
    },
    how_defeat: {
      id: 'how_defeat',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '르척을 물리치려면 부두교의 부적이 필요해. 이것을 가져가렴.',
      onEnter: () => {
        addItem('voodoo_talisman', '부두교 부적', '🔮');
        setFlag('has_talisman');
      },
      next: 'talisman_given',
    },
    talisman_given: {
      id: 'talisman_given',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '이 부적은 유령에게 효과가 있단다. 르척의 유령선을 찾으면 사용해.',
      onEnter: () => setFlag('knows_lechuck_weakness'),
      choices: [
        { text: '감사합니다!', next: 'warn' },
        { text: '유령선은 어디에 있나요?', next: 'ghost_ship' },
      ],
    },
    ghost_ship: {
      id: 'ghost_ship',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '르척의 유령선은 원숭이 섬 근처를 떠돌고 있어. 하지만 먼저 배를 구해야겠지.',
      next: 'warn',
    },
    monkey_island: {
      id: 'monkey_island',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '원숭이 섬... 저주받은 섬이야. 르척이 그곳에서 어둠의 힘을 얻었지.',
      choices: [
        { text: '어떻게 하면 르척을 물리칠 수 있죠?', next: 'how_defeat' },
        { text: '알겠습니다.', next: 'warn' },
      ],
    },
    warn: {
      id: 'warn',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '조심하렴, 가이브러시. 르척의 유령선은 위험해. 준비가 되면 다시 와.',
    },
    bye: {
      id: 'bye',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '운명은 피할 수 없단다... 곧 다시 만나게 될 거야.',
    },
  },
};

// ── Register all dialogue trees ─────────────────────────────
export function initDialogues(): void {
  registerDialogueTree(threePirates);
  registerDialogueTree(bartender);
  registerDialogueTree(voodooLady);
}
