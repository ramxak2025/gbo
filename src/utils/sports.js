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

// Sport-specific victory outcomes
export const VICTORY_TYPES = {
  bjj: [
    { id: 'submission', label: 'Сабмишн' },
    { id: 'points', label: 'По очкам' },
    { id: 'advantage', label: 'По преимуществу' },
    { id: 'dq', label: 'Дисквалификация' },
  ],
  grappling: [
    { id: 'submission', label: 'Сабмишн' },
    { id: 'points', label: 'По очкам' },
    { id: 'dq', label: 'Дисквалификация' },
  ],
  freestyle: [
    { id: 'pin', label: 'Туше' },
    { id: 'tech_sup', label: 'Тех. превосходство' },
    { id: 'points', label: 'По очкам' },
    { id: 'dq', label: 'Дисквалификация' },
  ],
  grecoroman: [
    { id: 'pin', label: 'Туше' },
    { id: 'tech_sup', label: 'Тех. превосходство' },
    { id: 'points', label: 'По очкам' },
    { id: 'dq', label: 'Дисквалификация' },
  ],
  sambo: [
    { id: 'submission', label: 'Болевой' },
    { id: 'throw', label: 'Чистый бросок' },
    { id: 'points', label: 'По очкам' },
    { id: 'dq', label: 'Дисквалификация' },
  ],
  judo: [
    { id: 'ippon', label: 'Иппон' },
    { id: 'wazaari', label: 'Вадза-ари' },
    { id: 'submission', label: 'Болевой/Удушение' },
    { id: 'dq', label: 'Дисквалификация' },
  ],
  mma: [
    { id: 'ko', label: 'Нокаут' },
    { id: 'tko', label: 'ТКО' },
    { id: 'submission', label: 'Сабмишн' },
    { id: 'decision', label: 'Решение судей' },
    { id: 'dq', label: 'Дисквалификация' },
  ],
}

export function getVictoryTypes(sportType) {
  return VICTORY_TYPES[sportType] || [
    { id: 'points', label: 'По очкам' },
    { id: 'dq', label: 'Дисквалификация' },
  ]
}

export function getVictoryLabel(sportType, victoryType) {
  const types = getVictoryTypes(sportType)
  return types.find(t => t.id === victoryType)?.label || victoryType || ''
}

// Weight categories for internal tournaments
export const WEIGHT_CLASSES = [
  'До 57 кг', 'До 62 кг', 'До 68 кг', 'До 74 кг',
  'До 82 кг', 'До 90 кг', 'До 100 кг', 'Свыше 100 кг', 'Абсолютка',
]

// Standard tournament seeding order — distributes byes evenly across bracket
function generateSeedOrder(size) {
  if (size === 1) return [0]
  if (size === 2) return [0, 1]
  const half = generateSeedOrder(size / 2)
  const result = []
  for (const pos of half) {
    result.push(pos)
    result.push(size - 1 - pos)
  }
  return result
}

// Check if a match position is completely dead (no real participants will ever arrive)
function isMatchDead(rounds, roundIdx, matchIdx) {
  const match = rounds[roundIdx]?.[matchIdx]
  if (!match) return true
  if (roundIdx === 0) return !match.s1 && !match.s2
  const feeder1 = matchIdx * 2
  const feeder2 = matchIdx * 2 + 1
  return isMatchDead(rounds, roundIdx - 1, feeder1) && isMatchDead(rounds, roundIdx - 1, feeder2)
}

// Check if a specific slot in a match will never be filled (feeder match is dead)
function isSlotDead(rounds, roundIdx, matchIdx, slot) {
  if (roundIdx === 0) return true // Round 1 null = genuine bye
  const feederIdx = matchIdx * 2 + (slot === 's2' ? 1 : 0)
  return isMatchDead(rounds, roundIdx - 1, feederIdx)
}

// Generate single elimination bracket
export function generateBracket(participantIds) {
  const n = participantIds.length
  if (n < 2) return { rounds: [], participants: participantIds }

  // Shuffle randomly
  const shuffled = [...participantIds].sort(() => Math.random() - 0.5)

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)))
  const numRounds = Math.ceil(Math.log2(n))

  // Place participants using standard seeding order (distributes byes evenly)
  const seedOrder = generateSeedOrder(bracketSize)
  const slots = seedOrder.map(pos => shuffled[pos] || null)

  // Build rounds
  const rounds = []

  // Round 1: resolve bye matches immediately
  const r1 = []
  for (let i = 0; i < bracketSize; i += 2) {
    const s1 = slots[i]
    const s2 = slots[i + 1]
    const isBye = !s1 || !s2
    r1.push({ s1, s2, winner: isBye ? (s1 || s2 || null) : null })
  }
  rounds.push(r1)

  // Create empty subsequent rounds
  for (let r = 1; r < numRounds; r++) {
    const prevLen = rounds[r - 1].length
    const round = []
    for (let i = 0; i < prevLen / 2; i++) {
      round.push({ s1: null, s2: null, winner: null })
    }
    rounds.push(round)
  }

  // Propagate bye winners, but only auto-resolve when the empty slot is genuinely dead
  let changed = true
  while (changed) {
    changed = false
    for (let r = 0; r < rounds.length; r++) {
      for (let m = 0; m < rounds[r].length; m++) {
        const match = rounds[r][m]
        // Propagate winner to next round
        if (match.winner && r < rounds.length - 1) {
          const nextM = Math.floor(m / 2)
          const slot = m % 2 === 0 ? 's1' : 's2'
          if (rounds[r + 1][nextM][slot] !== match.winner) {
            rounds[r + 1][nextM][slot] = match.winner
            changed = true
          }
        }
        // Auto-resolve only if the empty slot is a genuine dead bye
        if (!match.winner && match.s1 && !match.s2 && isSlotDead(rounds, r, m, 's2')) {
          match.winner = match.s1
          changed = true
        } else if (!match.winner && !match.s1 && match.s2 && isSlotDead(rounds, r, m, 's1')) {
          match.winner = match.s2
          changed = true
        }
      }
    }
  }

  return { rounds, participants: shuffled }
}

// Propagate winner to next round
export function setMatchWinner(brackets, roundIdx, matchIdx, winnerId) {
  const rounds = brackets.rounds.map(r => r.map(m => ({ ...m })))
  rounds[roundIdx][matchIdx].winner = winnerId

  // Propagate through the bracket, only auto-resolve genuine dead-slot byes
  let r = roundIdx
  let m = matchIdx
  let w = winnerId
  while (r < rounds.length - 1 && w) {
    const nextM = Math.floor(m / 2)
    const slot = m % 2 === 0 ? 's1' : 's2'
    rounds[r + 1][nextM][slot] = w

    const next = rounds[r + 1][nextM]
    if (!next.winner && next.s1 && !next.s2 && isSlotDead(rounds, r + 1, nextM, 's2')) {
      next.winner = next.s1
      w = next.s1
      r++
      m = nextM
    } else if (!next.winner && !next.s1 && next.s2 && isSlotDead(rounds, r + 1, nextM, 's1')) {
      next.winner = next.s2
      w = next.s2
      r++
      m = nextM
    } else {
      break
    }
  }

  return { ...brackets, rounds }
}
