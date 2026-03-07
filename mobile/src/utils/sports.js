export const SPORT_TYPES = [
  { id: 'bjj', label: 'BJJ' },
  { id: 'grappling', label: 'Грэпплинг' },
  { id: 'freestyle', label: 'Вольная борьба' },
  { id: 'grecoroman', label: 'Греко-римская' },
  { id: 'sambo', label: 'Самбо' },
  { id: 'judo', label: 'Дзюдо' },
  { id: 'mma', label: 'ММА' },
];

export const BELT_SPORTS = ['bjj', 'grappling'];
export const BELTS = ['Белый', 'Синий', 'Фиолетовый', 'Коричневый', 'Черный'];
export const RANKS = ['Без разряда', '3 юн.', '2 юн.', '1 юн.', '3 взр.', '2 взр.', '1 взр.', 'КМС', 'МС', 'МСМК', 'ЗМС'];

export const BELT_COLORS = {
  'Белый': '#e5e5e5', 'Синий': '#3b82f6', 'Фиолетовый': '#8b5cf6',
  'Коричневый': '#92400e', 'Черный': '#1a1a1a',
};

export function isBeltSport(t) { return BELT_SPORTS.includes(t); }
export function getRankOptions(t) { return isBeltSport(t) ? BELTS : RANKS; }
export function getRankLabel(t) { return isBeltSport(t) ? 'Пояс' : 'Разряд'; }
export function getSportLabel(t) { return SPORT_TYPES.find(s => s.id === t)?.label || t || '—'; }
