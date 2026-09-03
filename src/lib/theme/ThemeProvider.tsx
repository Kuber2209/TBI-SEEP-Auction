'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved preference or system default
    const saved = localStorage.getItem('seep-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setThemeState(initial);
      document.documentElement.classList.toggle('dark', prefersDark);
    }
    setMounted(true);
  }, []);

  const setThemeWithTransitionSuppression = (newTheme: Theme) => {
    // Suppress transitions during theme swap per better-ui/animations.md
    const style = document.createElement('style');
    style.append(
      document.createTextNode('*,*::before,*::after{transition:none !important}')
    );
    document.head.append(style);

    // Apply new theme
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    setThemeState(newTheme);
    localStorage.setItem('seep-theme', newTheme);

    // Force synchronous layout reflow so the new palette applies instantly
    const _reflow = document.body.offsetHeight;

    // Restore transitions on the next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove();
      });
    });
  };

  const toggleTheme = () => {
    setThemeWithTransitionSuppression(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeWithTransitionSuppression,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
