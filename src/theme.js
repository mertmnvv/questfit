/**
 * QuestFit — Global Tasarım Sistemi
 * Light & Dark Mode destekli tema
 */
import { Platform } from 'react-native';

const lightColors = {
  background: '#F4F6F5',
  card: '#FFFFFF',
  cardLight: '#F8F9FA',
  accent: '#40C057',
  accentDark: '#2F9E44',
  primary: '#2B8A3E',
  primaryDark: '#237032',
  text: '#212529',
  textSecondary: '#495057',
  textMuted: '#ADB5BD',
  overlay: 'rgba(0, 0, 0, 0.4)',
  border: '#DEE2E6',
  error: '#FA5252',
  success: '#40C057',
  danger: '#C92A2A', // Koyu kırmızı uyarılar
};

const darkColors = {
  background: '#0D1117',
  card: '#161B22',
  cardLight: '#1C2333',
  accent: '#40C057',
  accentDark: '#2F9E44',
  primary: '#3ECF6E',
  primaryDark: '#2F9E44',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  overlay: 'rgba(0, 0, 0, 0.6)',
  border: '#30363D',
  error: '#F85149',
  success: '#3FB950',
  danger: '#F85149',
};

// Default olarak light mode — userStore üzerinden değiştirilecek
let currentTheme = 'light';

export const setTheme = (theme) => {
  currentTheme = theme;
};

export const getTheme = () => currentTheme;

export const getColors = (theme) => {
  return theme === 'dark' ? darkColors : lightColors;
};

// Geriye dönük uyumluluk — COLORS'u statik olarak export et (light mode)
// Ekranlar useTheme() hook'uyla dinamik renk alacak
export const COLORS = lightColors;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 42,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Ortak stil mixinleri
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'Dungeon',
    bold: 'Dungeon',
    medium: 'Dungeon',
  },
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: lightColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: lightColors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};
