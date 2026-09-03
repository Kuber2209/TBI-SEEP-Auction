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
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved preference or system default
    const saved = localStorage.getItem('seep-theme') as Theme | null;
    if (saved === 'dark') {
      setThemeState('dark');
      document.documentElement.classList.add('dark');
    } else {
      setThemeState('light');
      document.documentElement.classList.remove('dark');
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
