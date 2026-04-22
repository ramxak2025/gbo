/**
 * iBorcuha Design System — iOS 26 Liquid Glass inspired
 *
 * Современная дизайн-система с нативными эффектами, жидким стеклом,
 * динамическими градиентами и spring-анимациями.
 */

export const colors = {
  // Акцентные (красный → оранжевый градиент)
  accent: {
    50: '#fff1f1',
    100: '#ffe0e0',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    gradient: ['#ef4444', '#dc2626', '#b91c1c'] as const,
    warmGradient: ['#f97316', '#ef4444', '#dc2626'] as const,
  },

  // Тёмная тема (iOS 26 inspired)
  dark: {
    bg: '#0a0a0f',
    bgElevated: '#15151f',
    bgCard: 'rgba(255, 255, 255, 0.05)',
    bgCardHover: 'rgba(255, 255, 255, 0.08)',
    bgGlass: 'rgba(20, 20, 30, 0.6)',
    bgGlassStrong: 'rgba(20, 20, 30, 0.85)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.14)',
    borderHighlight: 'rgba(255, 255, 255, 0.25)', // inner glow
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.45)',
    textQuaternary: 'rgba(255, 255, 255, 0.25)',
  },

  // Светлая тема
  light: {
    bg: '#f2f2f7',
    bgElevated: '#ffffff',
    bgCard: 'rgba(255, 255, 255, 0.72)',
    bgCardHover: 'rgba(255, 255, 255, 0.9)',
    bgGlass: 'rgba(255, 255, 255, 0.7)',
    bgGlassStrong: 'rgba(255, 255, 255, 0.92)',
    border: 'rgba(0, 0, 0, 0.06)',
    borderStrong: 'rgba(0, 0, 0, 0.12)',
    borderHighlight: 'rgba(255, 255, 255, 0.9)',
    text: '#000000',
    textSecondary: 'rgba(0, 0, 0, 0.65)',
    textTertiary: 'rgba(0, 0, 0, 0.4)',
    textQuaternary: 'rgba(0, 0, 0, 0.2)',
  },

  // Семантические
  semantic: {
    success: '#22c55e',
    successBg: 'rgba(34, 197, 94, 0.15)',
    warning: '#fbbf24',
    warningBg: 'rgba(251, 191, 36, 0.15)',
    danger: '#f87171',
    dangerBg: 'rgba(248, 113, 113, 0.15)',
    info: '#3b82f6',
    infoBg: 'rgba(59, 130, 246, 0.15)',
    purple: '#a855f7',
    purpleBg: 'rgba(168, 85, 247, 0.15)',
  },

  // Градиенты для hero-секций и кнопок
  gradients: {
    // Основной брендовый
    brand: ['#dc2626', '#b91c1c', '#991b1b'] as const,
    // Огонь (победа, champion)
    fire: ['#fbbf24', '#f97316', '#dc2626'] as const,
    // Тренер
    trainer: ['#a855f7', '#6366f1', '#3b82f6'] as const,
    // Ученик
    student: ['#22c55e', '#10b981', '#0ea5e9'] as const,
    // Супер-админ
    admin: ['#f59e0b', '#dc2626', '#7c3aed'] as const,
    // Глубина/фон
    depth: ['rgba(220, 38, 38, 0.15)', 'rgba(99, 102, 241, 0.15)', 'rgba(34, 197, 94, 0.1)'] as const,
    // Glass highlight (inner)
    glassHighlight: ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.05)'] as const,
    glassHighlightDark: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)'] as const,
  },
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const typography = {
  hero: { fontSize: 34, fontWeight: '900' as const, letterSpacing: -1 },
  title1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  title2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  title3: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '500' as const },
  bodyBold: { fontSize: 16, fontWeight: '700' as const },
  callout: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.3 },
  micro: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5 },
} as const;

// Spring-пресеты для Reanimated 3 (нативные 60fps)
export const springs = {
  // Быстрый отклик нажатий
  snappy: { damping: 20, stiffness: 400, mass: 0.7 },
  // Упругий bounce (для появлений)
  bounce: { damping: 12, stiffness: 180, mass: 1 },
  // Плавный smooth
  smooth: { damping: 25, stiffness: 200, mass: 1 },
  // Gentle (для перехода между экранами)
  gentle: { damping: 30, stiffness: 120, mass: 1 },
  // Liquid (текучий, для жидкого стекла)
  liquid: { damping: 18, stiffness: 150, mass: 1.2 },
} as const;

// Timing-пресеты
export const timings = {
  quick: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
} as const;

// Shadows — iOS 26 depth system
export const shadows = {
  // Лёгкая тень для карточек
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  // Поднятый (модалки, нав)
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 16,
  },
  // Свечение акцентного цвета
  glow: {
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  // Swallow (мелкие элементы)
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export function getTheme(dark: boolean) {
  return dark ? colors.dark : colors.light;
}

export default { colors, radius, spacing, typography, springs, timings, shadows, getTheme };
