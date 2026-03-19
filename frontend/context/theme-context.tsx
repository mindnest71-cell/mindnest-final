import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DarkColors, LightColors } from '@/constants/theme';

const THEME_STORAGE_KEY = 'theme_mode';

export type ThemeScheme = 'light' | 'dark';

type ThemeContextValue = {
  colorScheme: ThemeScheme;
  colors: typeof LightColors;
  setColorScheme: (scheme: ThemeScheme) => void;
  toggleColorScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: 'light',
  colors: LightColors,
  setColorScheme: () => undefined,
  toggleColorScheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ThemeScheme>('light');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored === 'light' || stored === 'dark') {
          setColorSchemeState(stored);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const setColorScheme = (scheme: ThemeScheme) => {
    setColorSchemeState(scheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, scheme).catch(() => undefined);
  };

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const colors = useMemo(
    () => (colorScheme === 'dark' ? DarkColors : LightColors),
    [colorScheme]
  );

  const value = useMemo(
    () => ({ colorScheme, colors, setColorScheme, toggleColorScheme }),
    [colorScheme, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
