import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: ThemeMode;
  background: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentGlow: string;
  success: string;
  warning: string;
  danger: string;
  gradientStart: string;
  gradientEnd: string;
  inputBg: string;
  chipBg: string;
  shadowColor: string;
}

const darkColors: ThemeColors = {
  mode: 'dark',
  background: '#090B10',
  cardBg: 'rgba(22, 27, 38, 0.75)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  accent: '#6366F1',
  accentGlow: 'rgba(99, 102, 241, 0.25)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  gradientStart: 'rgba(30, 41, 59, 0.65)',
  gradientEnd: 'rgba(15, 23, 42, 0.85)',
  inputBg: 'rgba(15, 23, 42, 0.75)',
  chipBg: 'rgba(255, 255, 255, 0.06)',
  shadowColor: '#000000',
};

const lightColors: ThemeColors = {
  mode: 'light',
  background: '#F1F5F9',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(226, 232, 240, 0.9)',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  accent: '#4F46E5',
  accentGlow: 'rgba(79, 70, 229, 0.15)',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  gradientStart: 'rgba(255, 255, 255, 0.95)',
  gradientEnd: 'rgba(241, 245, 249, 0.9)',
  inputBg: '#FFFFFF',
  chipBg: 'rgba(241, 245, 249, 0.9)',
  shadowColor: '#64748B',
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEME_STORAGE_KEY = '@better_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useRNColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setThemeState(stored);
        } else if (systemScheme) {
          setThemeState(systemScheme);
        }
      } catch (e) {
        console.error('Error loading theme:', e);
      }
    };
    loadStoredTheme();
  }, [systemScheme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(console.error);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
