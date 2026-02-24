// Sport types and rank/belt configuration

export const SPORT_TYPES = [
  { id: 'bjj', label: 'BJJ' },
  { id: 'grappling', label: 'Грэпплинг' },
  { id: 'freestyle', label: 'Вольная борьба' },
  { id: 'grecoroman', label: 'Греко-римская' },
  { id: 'sambo', label: 'Самбо' },
  { id: 'judo', label: 'Дзюдо' },
  { id: 'mma', label: 'ММА' },
]

export const BELT_SPORTS = ['bjj', 'grappling']

export const BELTS = ['Белый', 'Синий', 'Фиолетовый', 'Коричневый', 'Черный']

export const RANKS = ['Без разряда', '3 юн.', '2 юн.', '1 юн.', '3 взр.', '2 взр.', '1 взр.', 'КМС', 'МС', 'МСМК', 'ЗМС']

export function isBeltSport(sportType) {
  return BELT_SPORTS.includes(sportType)
}

export function getRankOptions(sportType) {
  return isBeltSport(sportType) ? BELTS : RANKS
}

export function getRankLabel(sportType) {
  return isBeltSport(sportType) ? 'Пояс' : 'Разряд'
}

export function getSportLabel(sportType) {
  return SPORT_TYPES.find(s => s.id === sportType)?.label || sportType || '—'
}

// Weight categories for internal tournaments
export const WEIGHT_CLASSES = [
  'До 57 кг', 'До 62 кг', 'До 68 кг', 'До 74 кг',
  'До 82 кг', 'До 90 кг', 'До 100 кг', 'Свыше 100 кг', 'Абсолютка',
]

// Generate single elimination bracket
export function generateBracket(participantIds) {
  const n = participantIds.length
  if (n < 2) return { rounds: [], participants: participantIds }

  // Shuffle randomly
  const shuffled = [...participantIds].sort(() => Math.random() - 0.5)

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)))
  const numRounds = Math.ceil(Math.log2(n))

  // Pad with nulls for byes
  const slots = [...shuffled]
  while (slots.length < bracketSize) slots.push(null)

  // Build rounds
  const rounds = []

  // Round 1
  const r1 = []
  for (let i = 0; i < bracketSize; i += 2) {
    const s1 = slots[i]
    const s2 = slots[i + 1]
    const isBye = !s1 || !s2
    r1.push({ s1, s2, winner: isBye ? (s1 || s2) : null })
  }
  rounds.push(r1)

  // Subsequent rounds
  for (let r = 1; r < numRounds; r++) {
    const prevRound = rounds[r - 1]
    const round = []
    for (let i = 0; i < prevRound.length; i += 2) {
      const m1 = prevRound[i]
      const m2 = prevRound[i + 1]
      // Propagate bye winners
      const s1 = m1.winner && (!m1.s1 || !m1.s2) ? m1.winner : null
      const s2 = m2?.winner && (!m2.s1 || !m2.s2) ? m2.winner : null
      round.push({ s1, s2, winner: null })
    }
    rounds.push(round)
  }

  return { rounds, participants: shuffled }
}

// Propagate winner to next round
export function setMatchWinner(brackets, roundIdx, matchIdx, winnerId) {
  const rounds = brackets.rounds.map(r => r.map(m => ({ ...m })))
  rounds[roundIdx][matchIdx].winner = winnerId

  // Propagate to next round
  if (roundIdx < rounds.length - 1) {
    const nextMatchIdx = Math.floor(matchIdx / 2)
    const isTopSlot = matchIdx % 2 === 0
    if (isTopSlot) {
      rounds[roundIdx + 1][nextMatchIdx].s1 = winnerId
    } else {
      rounds[roundIdx + 1][nextMatchIdx].s2 = winnerId
    }
  }

  return { ...brackets, rounds }
}
