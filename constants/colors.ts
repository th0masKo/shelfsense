export const colors = {
  background: {
    primary: '#FAFAF8',
    secondary: '#F1EFE8',
    surface: '#FFFFFF',
  },
  text: {
    primary: '#2C2C2A',
    secondary: '#888780',
  },
  border: '#E5E3DC',
  accent: {
    teal: '#1D9E75',
    tealDeep: '#0F6E56',
    amber: '#BA7517',
    red: '#A32D2D',
    blue: '#2F5FA0',
  },
} as const;

export type ColorKey = keyof typeof colors;

