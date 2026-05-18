// ═══════════════════════════════════════════════════════════
// Insult Combat System — MI1-style sword fighting via insults
// ═══════════════════════════════════════════════════════════

export interface InsultPair {
  id: string;
  insult: string;      // What the opponent says
  comeback: string;    // The correct player response
  wrongComebacks: string[];
}

export const ALL_INSULT_PAIRS: InsultPair[] = [
  {
    id: 'worst_swordsman',
    insult: '넌 내가 본 자 중 가장 형편없는 검객이야!',
    comeback: '내 형편없음도 당신의 최고보다 낫소!',
    wrongComebacks: ['고맙소, 연습 중이오!', '그건 동의하기 어렵소!'],
  },
  {
    id: 'fear_name',
    insult: '내 이름을 들으면 모든 악당이 공포로 떤다!',
    comeback: '당연하지—웃다가 배가 아프거든!',
    wrongComebacks: ['정말 무서운 이름이군요!', '나도 그 이름을 알겠소!'],
  },
  {
    id: 'mother_fights',
    insult: '우리 어머니도 당신보다는 잘 싸운다!',
    comeback: '어머니한테 싸우는 법을 배웠소?',
    wrongComebacks: ['어머니 욕은 하지 마시오!', '그분은 대단하시겠군!'],
  },
  {
    id: 'twelve_men',
    insult: '내 검은 이미 열두 명의 적을 쓰러뜨렸다!',
    comeback: '그리고 당신 얼굴은 열두 개의 거울을 깨뜨렸지!',
    wrongComebacks: ['대단하군요!', '그게 자랑이오?'],
  },
  {
    id: 'courage',
    insult: '적어도 나한테는 결투할 용기가 있소!',
    comeback: '그 용기가 지성만큼 있다면 죽지는 않겠지!',
    wrongComebacks: ['용기 있는 말이오!', '나도 용기가 있소!'],
  },
  {
    id: 'coward',
    insult: '당신 같은 겁쟁이는 처음 봤다!',
    comeback: '거울을 보시오—당신이 첫 번째요!',
    wrongComebacks: ['그렇지 않소!', '그건 심한 말이오!'],
  },
  {
    id: 'veteran',
    insult: '나는 20년 경력의 베테랑 검객이오!',
    comeback: '20년 동안 그것밖에 못 배웠소?',
    wrongComebacks: ['정말 대단하군요!', '경험을 존중합니다!'],
  },
  {
    id: 'blood',
    insult: '이 결투가 끝나면 당신의 피로 바다를 물들이겠소!',
    comeback: '벌써 물이 들었군—당신 얼굴 때문에!',
    wrongComebacks: ['무서운 말이군요!', '그렇게 하지 마시오!'],
  },
];

export interface InsultCombatConfig {
  opponentId: string;
  opponentName: string;
  playerMaxHP: number;
  npcMaxHP: number;
  insultPool: InsultPair[];
}

export const COMBAT_CONFIGS: Record<string, InsultCombatConfig> = {
  practice_pirate: {
    opponentId: 'practice_pirate',
    opponentName: '거리의 해적',
    playerMaxHP: 4,
    npcMaxHP: 3,
    insultPool: ALL_INSULT_PAIRS.slice(0, 4),
  },
  harbor_pirate: {
    opponentId: 'harbor_pirate',
    opponentName: '부두 해적',
    playerMaxHP: 4,
    npcMaxHP: 3,
    insultPool: ALL_INSULT_PAIRS.slice(0, 5),
  },
  carla: {
    opponentId: 'carla',
    opponentName: '칼라 (검술 마스터)',
    playerMaxHP: 3,
    npcMaxHP: 5,
    insultPool: ALL_INSULT_PAIRS,
  },
};

export function getCombatConfig(opponentId: string): InsultCombatConfig {
  return (
    COMBAT_CONFIGS[opponentId] ?? {
      opponentId,
      opponentName: '해적',
      playerMaxHP: 4,
      npcMaxHP: 3,
      insultPool: ALL_INSULT_PAIRS.slice(0, 3),
    }
  );
}

export function shuffleChoices(pair: InsultPair): string[] {
  const all = [pair.comeback, ...pair.wrongComebacks];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

export function pickRandomInsult(pool: InsultPair[], exclude: string[]): InsultPair | null {
  const available = pool.filter((p) => !exclude.includes(p.id));
  if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)] ?? null;
  return available[Math.floor(Math.random() * available.length)];
}
