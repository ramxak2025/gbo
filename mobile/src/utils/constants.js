import { Dimensions, Platform } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const IS_IOS = Platform.OS === 'ios';

export const API_BASE = 'https://iborcuha.ru/api';

export const COLORS = {
  dark: {
    bg: '#050505',
    card: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.07)',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.5)',
    accent: '#8b5cf6',
    accentLight: 'rgba(139,92,246,0.15)',
    success: '#22c55e',
    danger: '#ef4444',
    tabBar: 'rgba(255,255,255,0.08)',
    tabBarBorder: 'rgba(255,255,255,0.06)',
    inputBg: 'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(255,255,255,0.1)',
    modalBg: 'rgba(20,20,20,0.95)',
    headerBg: 'rgba(5,5,5,0.55)',
  },
  light: {
    bg: '#f5f5f7',
    card: 'rgba(255,255,255,0.7)',
    cardBorder: 'rgba(255,255,255,0.6)',
    text: '#1a1a1a',
    textSecondary: '#6b7280',
    accent: '#7c3aed',
    accentLight: 'rgba(124,58,237,0.1)',
    success: '#16a34a',
    danger: '#dc2626',
    tabBar: 'rgba(255,255,255,0.5)',
    tabBarBorder: 'rgba(255,255,255,0.6)',
    inputBg: 'rgba(0,0,0,0.03)',
    inputBorder: 'rgba(0,0,0,0.08)',
    modalBg: 'rgba(245,245,247,0.95)',
    headerBg: 'rgba(245,245,247,0.6)',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 22,
  xxl: 32,
};
