import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';

export const colors = {
  light: {
    background: '#F5F3FF',
    surface: '#FFFFFF',
    primary: '#8A2BE2',
    secondary: '#B57EDC',
    accent: '#BB86FC',
    text: '#1E1E1E',
    muted: '#E0D7FF',
  },
  dark: {
    background: '#1A1325',
    surface: '#2C1F3A',
    primary: '#6C4AB6',
    secondary: '#B57EDC',
    accent: '#BB86FC',
    text: '#F5F5F5',
    muted: '#9B59B6',
  },
} as const;

export type ThemeColors = typeof colors.light;

export function useTheme() {
  const scheme = useColorScheme();
  const [theme, setTheme] = useState(scheme === 'dark' ? colors.dark : colors.light);

  useEffect(() => {
    setTheme(scheme === 'dark' ? colors.dark : colors.light);
  }, [scheme]);

  return { colors: theme, isDark: scheme === 'dark' };
}