// Theme provider — wraps app, handles club theme + global theme class
// src/components/ui/ThemeProvider.tsx

import React, { useEffect, createContext, useContext, useState, useCallback } from 'react';
import { injectClubTheme, restoreClubTheme, clearClubTheme } from '../../lib/clubColors.ts';

const THEME_CLASS_KEY = 'fd-theme-class';
const VALID_THEMES = ['dirA', 'dirB', 'dirV4'] as const;
type ThemeClass = typeof VALID_THEMES[number];

interface ThemeContextType {
  themeClass: ThemeClass;
  setThemeClass: (t: ThemeClass) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children, career }: { children: React.ReactNode; career: any }) {
  const [themeClass, setThemeClassState] = useState<ThemeClass>(() => {
    try {
      const saved = localStorage.getItem(THEME_CLASS_KEY);
      return (saved as ThemeClass) ?? 'dirV4';
    } catch { return 'dirV4'; }
  });
  const [reduceMotion, setReduceMotionState] = useState(() => {
    try { return localStorage.getItem('fd-reduce-motion') === 'true'; } catch { return false; }
  });

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.className = document.documentElement.className
      .split(' ')
      .filter(c => !VALID_THEMES.includes(c as ThemeClass))
      .join(' ') + ' ' + themeClass;
    localStorage.setItem(THEME_CLASS_KEY, themeClass);
  }, [themeClass]);

  // Reduce motion
  useEffect(() => {
    document.documentElement.style.setProperty('--fd-transition', reduceMotion ? '0ms' : '180ms cubic-bezier(.22,1,.36,1)');
    localStorage.setItem('fd-reduce-motion', String(reduceMotion));
  }, [reduceMotion]);

  // Club theme injection
  useEffect(() => {
    if (career?.clubId) {
      const club = { colors: career.clubColors, id: career.clubId };
      injectClubTheme(club);
    } else {
      clearClubTheme();
    }
  }, [career?.clubId, career?.clubColors]);

  // Restore persisted club theme on mount
  useEffect(() => { restoreClubTheme(); }, []);

  const setThemeClass = useCallback((t: ThemeClass) => setThemeClassState(t), []);
  const setReduceMotion = useCallback((v: boolean) => setReduceMotionState(v), []);

  return (
    <ThemeContext.Provider value={{ themeClass, setThemeClass, reduceMotion, setReduceMotion }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}