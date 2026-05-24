import { Platform } from 'react-native';

export const colors = {
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  secondary: '#F1EFE8',
  textPrimary: '#2C2C2A',
  textGrey: '#888780',
  border: '#E5E3DC',
  teal: '#1D9E75',
  tealLight: '#E8F5F0',
  tealDark: '#0F6E56',
  amber: '#BA7517',
  amberLight: '#FDF3E3',
  red: '#A32D2D',
  redLight: '#FAEAEA',
  blue: '#2F5FA0',
} as const;

export const fonts = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export type Urgency = 'critical' | 'warning' | 'good';
