export const SPORTS = [
  'BJJ', 'Грэпплинг', 'Вольная борьба',
  'Греко-римская', 'Самбо', 'Дзюдо', 'ММА',
];

const BELT_SPORTS = ['BJJ', 'Грэпплинг'];

const BELTS = ['Белый', 'Синий', 'Фиолетовый', 'Коричневый', 'Черный'];
const RANKS = [
  'Без разряда', '3 юн.', '2 юн.', '1 юн.',
  '3 взр.', '2 взр.', '1 взр.', 'КМС', 'МС', 'МСМК', 'ЗМС',
];

export function isBeltSport(sportType) {
  return BELT_SPORTS.includes(sportType);
}

export function getRankOptions(sportType) {
  return isBeltSport(sportType) ? BELTS : RANKS;
}

export function getRankLabel(sportType) {
  return isBeltSport(sportType) ? 'Пояс' : 'Разряд';
}

export function getSportLabel(sportType) {
  return sportType || 'Не указан';
}

const VICTORY_TYPES = {
  BJJ: [
    { value: 'submission', label: 'Сабмишн' },
    { value: 'points', label: 'По очкам' },
    { value: 'advantage', label: 'По преимуществу' },
    { value: 'dq', label: 'Дисквалификация' },
  ],
  'Грэпплинг': [
    { value: 'submission', label: 'Сабмишн' },
    { value: 'points', label: 'По очкам' },
    { value: 'dq', label: 'Дисквалификация' },
  ],
  'Вольная борьба': [
    { value: 'pin', label: 'Туше' },
    { value: 'tech', label: 'Тех. превосходство' },
    { value: 'points', label: 'По очкам' },
    { value: 'dq', label: 'Дисквалификация' },
  ],
  'Греко-римская': [
    { value: 'pin', label: 'Туше' },
    { value: 'tech', label: 'Тех. превосходство' },
    { value: 'points', label: 'По очкам' },
    { value: 'dq', label: 'Дисквалификация' },
  ],
  'Самбо': [
    { value: 'submission', label: 'Болевой' },
    { value: 'throw', label: 'Чистый бросок' },
    { value: 'points', label: 'По очкам' },
    { value: 'dq', label: 'Дисквалификация' },
  ],
  'Дзюдо': [
    { value: 'ippon', label: 'Иппон' },
    { value: 'wazaari', label: 'Вадза-ари' },
    { value: 'submission', label: 'Болевой/Удушение' },
    { value: 'dq', label: 'Дисквалификация' },
  ],
  'ММА': [
    { value: 'ko', label: 'Нокаут' },
    { value: 'tko', label: 'ТКО' },
    { value: 'submission', label: 'Сабмишн' },
    { value: 'decision', label: 'Решение судей' },
    { value: 'dq', label: 'Дисквалификация' },
  ],
};

export function getVictoryTypes(sportType) {
  return VICTORY_TYPES[sportType] || VICTORY_TYPES.BJJ;
}

export function getVictoryLabel(sportType, victoryType) {
  const types = getVictoryTypes(sportType);
  const found = types.find(t => t.value === victoryType);
  return found ? found.label : victoryType;
}

export const WEIGHT_CLASSES = [
  'До 57 кг', 'До 62 кг', 'До 68 кг', 'До 74 кг',
  'До 82 кг', 'До 90 кг', 'До 100 кг', 'Свыше 100 кг', 'Абсолютка',
];

function generateSeedOrder(size) {
  if (size === 1) return [0];
  const half = size / 2;
  const prev = generateSeedOrder(half);
  const result = [];
  for (const p of prev) {
    result.push(p, size - 1 - p);
  }
  return result;
}

export function generateBracket(participantIds) {
  const n = participantIds.length;
  if (n < 2) return { rounds: [], participants: participantIds };

  let size = 1;
  while (size < n) size *= 2;

  const shuffled = [...participantIds].sort(() => Math.random() - 0.5);
  const seeds = generateSeedOrder(size);
  const slots = new Array(size).fill(null);
  for (let i = 0; i < shuffled.length; i++) {
    slots[seeds[i]] = shuffled[i];
  }

  const numRounds = Math.log2(size);
  const rounds = [];

  // First round
  const firstRound = [];
  for (let i = 0; i < size; i += 2) {
    firstRound.push({ player1: slots[i], player2: slots[i + 1], winner: null });
  }
  rounds.push(firstRound);

  // Subsequent rounds
  for (let r = 1; r < numRounds; r++) {
    const prevRound = rounds[r - 1];
    const round = [];
    for (let i = 0; i < prevRound.length; i += 2) {
      round.push({ player1: null, player2: null, winner: null });
    }
    rounds.push(round);
  }

  // Auto-resolve byes
  for (let i = 0; i < firstRound.length; i++) {
    const m = firstRound[i];
    if (m.player1 && !m.player2) {
      m.winner = m.player1;
      propagateWinner(rounds, 0, i);
    } else if (!m.player1 && m.player2) {
      m.winner = m.player2;
      propagateWinner(rounds, 0, i);
    } else if (!m.player1 && !m.player2) {
      propagateWinner(rounds, 0, i);
    }
  }

  return { rounds, participants: participantIds };
}

function propagateWinner(rounds, roundIdx, matchIdx) {
  if (roundIdx + 1 >= rounds.length) return;
  const nextMatchIdx = Math.floor(matchIdx / 2);
  const slot = matchIdx % 2 === 0 ? 'player1' : 'player2';
  const winner = rounds[roundIdx][matchIdx].winner;
  rounds[roundIdx + 1][nextMatchIdx][slot] = winner;

  const nextMatch = rounds[roundIdx + 1][nextMatchIdx];
  if (nextMatch.player1 === null && nextMatch.player2 === null) {
    // both dead
  } else if (nextMatch.player1 && !nextMatch.player2 && isSlotResolved(rounds, roundIdx + 1, nextMatchIdx, 'player2')) {
    nextMatch.winner = nextMatch.player1;
    propagateWinner(rounds, roundIdx + 1, nextMatchIdx);
  } else if (!nextMatch.player1 && nextMatch.player2 && isSlotResolved(rounds, roundIdx + 1, nextMatchIdx, 'player1')) {
    nextMatch.winner = nextMatch.player2;
    propagateWinner(rounds, roundIdx + 1, nextMatchIdx);
  }
}

function isSlotResolved(rounds, roundIdx, matchIdx, slot) {
  if (roundIdx === 0) return true;
  const sourceMatchIdx = matchIdx * 2 + (slot === 'player2' ? 1 : 0);
  if (sourceMatchIdx >= rounds[roundIdx - 1].length) return true;
  const sourceMatch = rounds[roundIdx - 1][sourceMatchIdx];
  return sourceMatch.winner !== null || (!sourceMatch.player1 && !sourceMatch.player2);
}

export function setMatchWinner(brackets, roundIdx, matchIdx, winnerId) {
  const rounds = brackets.rounds.map(r => r.map(m => ({ ...m })));
  rounds[roundIdx][matchIdx].winner = winnerId;
  propagateWinner(rounds, roundIdx, matchIdx);
  return { ...brackets, rounds };
}
