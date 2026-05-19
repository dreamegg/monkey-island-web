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

function removeItem(id: string) {
  useGameStore.getState().removeItem(id);
}

function hasItem(id: string): boolean {
  return useGameStore.getState().inventory.some((i) => i.id === id);
}

function startCombat(opponentId: string) {
  useGameStore.getState().endDialogue();
  useGameStore.getState().startInsultCombat(opponentId);
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
        {
          text: '세 가지 시련을 모두 완수했습니다! 📜🗿💰',
          next: 'all_trials_done',
          condition: () =>
            getFlag('trial1_complete') &&
            getFlag('trial2_complete') &&
            getFlag('trial3_complete') &&
            !getFlag('trials_complete'),
        },
        { text: '아무것도 아닙니다. 실례합니다.', next: 'bye' },
      ],
    },
    all_trials_done: {
      id: 'all_trials_done',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '...뭐?! 검술, 도둑질, 보물 사냥을 다 해냈다고?! 이게 사실이야?',
      next: 'verify_trials',
    },
    verify_trials: {
      id: 'verify_trials',
      speaker: '가이브러시',
      portrait: '/assets/portraits/guybrush.png',
      text: '네, 모두 완수했습니다. 검술 수료증도 있고, 우상도 돌려드리고, 보물도 찾았습니다.',
      next: 'pirates_impressed',
    },
    pirates_impressed: {
      id: 'pirates_impressed',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '...놀랍군. 진짜로 해냈어. 이 섬에서 세 시련을 모두 통과한 건 수십 년만이야!',
      onEnter: () => {
        addItem('pirate_certificate', '해적 수료증', '☠');
        setFlag('trials_complete');
      },
      next: 'give_certificate',
    },
    give_certificate: {
      id: 'give_certificate',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '☠ 해적 수료증을 줄게. 이걸로 스탠 가게에서 배를 싸게 살 수 있다. 진정한 해적이 되었군, 가이브러시!',
      choices: [
        { text: '감사합니다! 원숭이 섬으로 가겠습니다!', next: 'go_monkey_island' },
        { text: '르척에 대해 더 알려주세요.', next: 'lechuck_info' },
      ],
    },
    go_monkey_island: {
      id: 'go_monkey_island',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '원숭이 섬? 정말 미쳤군... 하지만 막을 수 없지. 행운을 빈다, 해적!',
    },
    lechuck_info: {
      id: 'lechuck_info',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '르척은 원숭이 섬 근처 유령선에 있다더군. 부두교 여사제가 약점을 알고 있을 거야. 조심해라.',
      next: 'go_monkey_island',
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
      text: '첫째, 검술 마스터를 이겨라! 둘째, 총독 관저에서 우상을 가져와라! 셋째, 고대 보물을 발굴하라!',
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
      text: '숲 너머 검술 훈련장에 칼라라는 검술 마스터가 있어. 욕설 결투에서 이겨야 해!',
      next: 'trials_detail',
    },
    theft_hint: {
      id: 'theft_hint',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '마을 거리에서 총독 관저에 가봐. 경비를 피해 우상을 가져와야 해. 밧줄이 유용할 거다.',
      next: 'trials_detail',
    },
    treasure_hint: {
      id: 'treasure_hint',
      speaker: '세 해적',
      portrait: '/assets/portraits/three_pirates.png',
      text: '해변 동굴에 자물쇠 상자가 있다더군. 그 안에 보물 지도가 있다는 소문이 있어.',
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
        {
          text: '오티스가 왜 감옥에 있나요?',
          next: 'about_otis',
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
      text: '검술의 달인? 칼라라는 여자야. 숲 너머 훈련장에 있어. 욕설로 싸우는 결투를 하는데... 특이한 방식이지.',
      onEnter: () => setFlag('knows_sword_master'),
      choices: [
        { text: '욕설로 싸운다고요?', next: 'insult_explain' },
        { text: '다른 것도 물어볼게요.', next: 'start' },
        { text: '감사합니다.', next: 'bye' },
      ],
    },
    insult_explain: {
      id: 'insult_explain',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '검을 들고 욕설을 주고받는 거야. 재치 있는 응수로 이겨야 해. 마을에 거리 해적들이 있으니 먼저 연습해봐.',
      choices: [
        { text: '알겠습니다.', next: 'bye' },
        { text: '다른 것도 물어볼게요.', next: 'start' },
      ],
    },
    about_otis: {
      id: 'about_otis',
      speaker: '바텐더',
      portrait: '/assets/portraits/bartender.png',
      text: '오티스? 꽃을 꺾다가 잡혔어. 하하! 보안관이 엄격하거든. 오티스는 바나나를 좋아하는데, 그로그를 주면 좋아할 거야.',
      choices: [
        { text: '알겠습니다.', next: 'bye' },
        { text: '다른 것도 물어볼게요.', next: 'start' },
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
        { text: '부두교의 힘으로 도와주실 수 있나요?', next: 'voodoo_help' },
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
        if (!hasItem('voodoo_talisman')) {
          addItem('voodoo_talisman', '부두교 부적', '🔮');
          setFlag('has_talisman');
        }
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
      text: '르척의 유령선은 원숭이 섬 근처를 떠돌고 있어. 하지만 먼저 배를 구해야겠지. 스탠의 가게에 가봐.',
      next: 'warn',
    },
    voodoo_help: {
      id: 'voodoo_help',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '물론이지. 하지만 대가가 필요해... 빛나는 버섯을 가져다주면 르척을 물리칠 방법을 알려주겠어.',
      choices: [
        {
          text: '(빛나는 버섯을 드린다)',
          next: 'mushroom_given',
          condition: () => hasItem('glowing_mushroom'),
        },
        { text: '버섯을 찾아보겠습니다.', next: 'bye' },
      ],
    },
    mushroom_given: {
      id: 'mushroom_given',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '고맙구나. 이 버섯으로 강력한 부두 의식을 치를 수 있어.',
      onEnter: () => removeItem('glowing_mushroom'),
      next: 'how_defeat',
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
      text: '조심하렴, 가이브러시. 르척의 유령선은 위험해. 세 가지 시련을 먼저 완수하면 도움이 될 거야.',
    },
    bye: {
      id: 'bye',
      speaker: '부두교 여사제',
      portrait: '/assets/portraits/voodoo_lady.png',
      text: '운명은 피할 수 없단다... 곧 다시 만나게 될 거야.',
    },
  },
};

// ── Carla — Sword Master ────────────────────────────────────
const carla: DialogueTree = {
  id: 'carla',
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      speaker: '칼라',
      portrait: '/assets/portraits/carla.png',
      text: '여기까지 오다니. 나와 결투하러 온 거겠지?',
      choices: [
        {
          text: '네! 검술 시련을 받으러 왔습니다!',
          next: 'pre_combat',
          condition: () => !getFlag('trial1_complete'),
        },
        {
          text: '이미 이겼죠. 수료증도 받았고요.',
          next: 'already_won',
          condition: () => getFlag('trial1_complete'),
        },
        { text: '구경하러 왔습니다.', next: 'just_looking' },
      ],
    },
    pre_combat: {
      id: 'pre_combat',
      speaker: '칼라',
      portrait: '/assets/portraits/carla.png',
      text: '좋아. 우리의 결투는 검이 아닌 욕설로 이루어진다. 재치 있는 응수로 상대를 이겨야 해. 준비됐나?',
      choices: [
        { text: '준비됐습니다! 시작하죠!', next: 'combat_start' },
        { text: '잠깐, 더 준비하고 오겠습니다.', next: 'bye' },
      ],
    },
    combat_start: {
      id: 'combat_start',
      speaker: '칼라',
      portrait: '/assets/portraits/carla.png',
      text: '그렇다면... 시작하지!',
      onEnter: () => startCombat('carla'),
    },
    already_won: {
      id: 'already_won',
      speaker: '칼라',
      portrait: '/assets/portraits/carla.png',
      text: '맞아. 인정하기 싫지만... 너는 진짜 검객이야. 원숭이 섬에서도 그 재치를 잃지 마.',
      next: 'bye',
    },
    just_looking: {
      id: 'just_looking',
      speaker: '칼라',
      portrait: '/assets/portraits/carla.png',
      text: '구경이라... 하지만 진짜 해적이 되고 싶다면 언젠간 나와 맞서야 할 거야.',
      next: 'bye',
    },
    bye: {
      id: 'bye',
      speaker: '칼라',
      portrait: '/assets/portraits/carla.png',
      text: '다음에 와라. 준비가 됐을 때.',
    },
  },
};

// ── Stan — Ship Dealer ──────────────────────────────────────
const stan: DialogueTree = {
  id: 'stan',
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      speaker: '스탠',
      portrait: '/assets/portraits/stan.png',
      text: '어서오세요! 스탠의 배 가게입니다! 오늘 특별 할인 중이에요! 어떤 배가 필요하세요?',
      choices: [
        { text: '원숭이 섬까지 갈 배가 필요합니다.', next: 'need_ship' },
        { text: '구경만 할게요.', next: 'look_around' },
        {
          text: '해적 수료증으로 할인 받고 싶습니다.',
          next: 'use_certificate',
          condition: () => hasItem('pirate_certificate'),
        },
        { text: '가보겠습니다.', next: 'bye' },
      ],
    },
    need_ship: {
      id: 'need_ship',
      speaker: '스탠',
      portrait: '/assets/portraits/stan.png',
      text: '원숭이 섬?! 거기까지 갈 배... 중형 갈레온이 딱이에요! 단돈 10,000 피스 오브 에이트!',
      choices: [
        { text: '너무 비싸요!', next: 'negotiate' },
        { text: '해적 수료증이 있습니다!', next: 'use_certificate', condition: () => hasItem('pirate_certificate') },
        { text: '생각해볼게요.', next: 'bye' },
      ],
    },
    negotiate: {
      id: 'negotiate',
      speaker: '스탠',
      portrait: '/assets/portraits/stan.png',
      text: '비싸다고요?! 이건 최상품이에요! ...뭐, 특별히 8,000으로 해드리죠. 그것도 싸게 드리는 거예요!',
      choices: [
        { text: '그래도 비싸요!', next: 'final_offer' },
        { text: '알겠습니다. 살게요.', next: 'buy_ship', condition: () => getFlag('trials_complete') },
        { text: '나중에 올게요.', next: 'bye' },
      ],
    },
    final_offer: {
      id: 'final_offer',
      speaker: '스탠',
      portrait: '/assets/portraits/stan.png',
      text: '하! 5,000이 최저가에요! 이 이하는 절대 안 돼요! ...해적 수료증이 있으면 얘기가 달라지지만.',
      choices: [
        { text: '알겠습니다.', next: 'buy_ship', condition: () => getFlag('trials_complete') },
        { text: '수료증을 구해오겠습니다.', next: 'bye' },
      ],
    },
    use_certificate: {
      id: 'use_certificate',
      speaker: '스탠',
      portrait: '/assets/portraits/stan.png',
      text: '오! 해적 수료증이 있군요! 그렇다면 50% 할인! 중형 갈레온을 5,000에 드리겠습니다! 어떠세요?',
      next: 'buy_ship',
    },
    buy_ship: {
      id: 'buy_ship',
      speaker: '스탠',
      portrait: '/assets/portraits/stan.png',
      text: '훌륭한 선택이에요! ...아, 돈은 나중에 받기로 하죠. 특별 해적 할부로! 중형 갈레온은 부두에 있어요.',
      onEnter: () => {
        setFlag('has_ship');
        removeItem('pirate_certificate');
      },
      next: 'ship_bought',
    },
    ship_bought: {
      id: 'ship_bought',
      speaker: '스탠',
      portrait: '/assets/portraits/stan.png',
      text: '배 이름은... "가이브러시의 복수"는 어떠세요? 제가 글씨도 써드릴게요! 또 오세요!',
    },
    look_around: {
      id: 'look_around',
      speaker: '스탠',
      portrait: '/assets/portraits/stan.png',
      text: '마음껏 구경하세요! 다 최상품이에요! 혹시 마음에 드는 게 있으면 말씀해주세요!',
      next: 'start',
    },
    bye: {
      id: 'bye',
      speaker: '스탠',
      portrait: '/assets/portraits/stan.png',
      text: '또 오세요! 최저가 보장! 다음엔 더 좋은 조건으로 해드릴게요!',
    },
  },
};

// ── Otis — Prisoner ─────────────────────────────────────────
const otis: DialogueTree = {
  id: 'otis',
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      speaker: '오티스',
      portrait: '/assets/portraits/otis.png',
      text: '...야, 거기 지나가는 사람! 음식 좀 구해줄 수 없어? 감옥 밥이 너무 끔찍해!',
      choices: [
        { text: '왜 감옥에 있는 건가요?', next: 'why_jail' },
        {
          text: '그로그를 드릴게요.',
          next: 'give_grog',
          condition: () => hasItem('grog') || hasItem('mug'),
        },
        { text: '안됐군요. 실례합니다.', next: 'bye' },
      ],
    },
    why_jail: {
      id: 'why_jail',
      speaker: '오티스',
      portrait: '/assets/portraits/otis.png',
      text: '어이없지? 술집 정원에서 꽃 한 송이 꺾었다고 잡혀왔어! 보안관이 너무 엄격하다고!',
      choices: [
        {
          text: '그로그를 드릴게요.',
          next: 'give_grog',
          condition: () => hasItem('grog') || hasItem('mug'),
        },
        { text: '그거 정말 억울하군요.', next: 'sympathy' },
        { text: '실례합니다.', next: 'bye' },
      ],
    },
    sympathy: {
      id: 'sympathy',
      speaker: '오티스',
      portrait: '/assets/portraits/otis.png',
      text: '그렇지?! 해적이 꽃 좀 꺾으면 어때서... 빨리 여기서 나가고 싶다. 그로그라도 한 잔 마시고 싶어.',
      choices: [
        {
          text: '그로그를 드릴게요.',
          next: 'give_grog',
          condition: () => hasItem('grog') || hasItem('mug'),
        },
        { text: '미안해요.', next: 'bye' },
      ],
    },
    give_grog: {
      id: 'give_grog',
      speaker: '오티스',
      portrait: '/assets/portraits/otis.png',
      text: '세상에, 그로그를! 감사합니다! 대신 이 바나나를 드릴게요. 간수가 선물로 줬는데 나는 안 먹거든.',
      onEnter: () => {
        if (hasItem('grog')) removeItem('grog');
        else removeItem('mug');
        addItem('banana', '바나나', '🍌');
        setFlag('helped_otis');
      },
      next: 'after_trade',
    },
    after_trade: {
      id: 'after_trade',
      speaker: '오티스',
      portrait: '/assets/portraits/otis.png',
      text: '아... 오랜만에 마시는 그로그! 행복해라. 고마워, 친구. 혹시 탈출할 방법을 알면 알려줘.',
    },
    bye: {
      id: 'bye',
      speaker: '오티스',
      portrait: '/assets/portraits/otis.png',
      text: '...빨리 나가고 싶다. 꽃도 그리운데.',
    },
  },
};

// ── Sheriff ─────────────────────────────────────────────────
const sheriff: DialogueTree = {
  id: 'sheriff',
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      speaker: '보안관',
      portrait: '/assets/portraits/sheriff.png',
      text: '여기서 뭐하는 거요? 이 마을은 법과 질서가 있소.',
      choices: [
        { text: '그냥 지나가는 길입니다.', next: 'passing' },
        { text: '총독을 만나고 싶습니다.', next: 'see_governor' },
        { text: '저는 해적이 되고 싶습니다.', next: 'pirate_wannabe' },
        { text: '실례합니다.', next: 'bye' },
      ],
    },
    passing: {
      id: 'passing',
      speaker: '보안관',
      portrait: '/assets/portraits/sheriff.png',
      text: '알겠소. 하지만 말썽 피우면 감옥이오! 오티스처럼 되기 싫으면 조심해요.',
      next: 'bye',
    },
    see_governor: {
      id: 'see_governor',
      speaker: '보안관',
      portrait: '/assets/portraits/sheriff.png',
      text: '총독님은 현재 방문객을 받지 않소. 세 가지 시련을 완수한 자만 만날 수 있소!',
      choices: [
        { text: '세 가지 시련이요?', next: 'trials_info' },
        { text: '알겠습니다.', next: 'bye' },
      ],
    },
    trials_info: {
      id: 'trials_info',
      speaker: '보안관',
      portrait: '/assets/portraits/sheriff.png',
      text: '검술, 도둑질, 보물 사냥. 항구에 있는 세 해적에게 자세히 물어보시오.',
      next: 'bye',
    },
    pirate_wannabe: {
      id: 'pirate_wannabe',
      speaker: '보안관',
      portrait: '/assets/portraits/sheriff.png',
      text: '해적?! 이 마을에서 말썽 피우면 감옥이오! 법을 지켜요!',
      next: 'bye',
    },
    bye: {
      id: 'bye',
      speaker: '보안관',
      portrait: '/assets/portraits/sheriff.png',
      text: '법을 지키시오. 멜레 섬의 평화를 위해.',
    },
  },
};

// ── Mansion Guard ───────────────────────────────────────────
const mansionGuard: DialogueTree = {
  id: 'mansion_guard',
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      speaker: '관저 경비',
      portrait: '/assets/portraits/sheriff.png',
      text: '멈춰라! 이곳은 총독 관저다. 허가 없이는 들어갈 수 없다.',
      choices: [
        { text: '총독을 만나고 싶습니다.', next: 'want_entry' },
        { text: '실례합니다.', next: 'bye' },
      ],
    },
    want_entry: {
      id: 'want_entry',
      speaker: '관저 경비',
      portrait: '/assets/portraits/sheriff.png',
      text: '세 가지 시련을 완수한 자만 총독님을 만날 수 있다. 아직 그 자격이 없어 보이는군.',
      choices: [
        {
          text: '해적 수료증이 있습니다!',
          next: 'has_certificate',
          condition: () => getFlag('trials_complete'),
        },
        { text: '알겠습니다.', next: 'bye' },
      ],
    },
    has_certificate: {
      id: 'has_certificate',
      speaker: '관저 경비',
      portrait: '/assets/portraits/sheriff.png',
      text: '...수료증이 있군. 통과해도 좋다. 하지만 실례되는 행동은 금물이다!',
      onEnter: () => setFlag('mansion_access_granted'),
      next: 'allowed',
    },
    allowed: {
      id: 'allowed',
      speaker: '관저 경비',
      portrait: '/assets/portraits/sheriff.png',
      text: '들어가시오.',
    },
    bye: {
      id: 'bye',
      speaker: '관저 경비',
      portrait: '/assets/portraits/sheriff.png',
      text: '어서 가시오.',
    },
  },
};

// ── Register all dialogue trees ─────────────────────────────
export function initDialogues(): void {
  registerDialogueTree(threePirates);
  registerDialogueTree(bartender);
  registerDialogueTree(voodooLady);
  registerDialogueTree(carla);
  registerDialogueTree(stan);
  registerDialogueTree(otis);
  registerDialogueTree(sheriff);
  registerDialogueTree(mansionGuard);
}
