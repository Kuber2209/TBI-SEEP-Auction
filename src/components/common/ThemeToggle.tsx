'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render placeholder to prevent layout shift before hydration
    return (
      <button
        aria-label="Toggle theme"
        disabled
        className={`p-2 rounded-[10px] bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-white/[0.08] text-slate-400 opacity-50 ${className}`}
      >
        <span className="w-4 h-4 block" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`p-2 rounded-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-navy-900 dark:hover:bg-navy-850 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] text-slate-600 dark:text-slate-300 transition-colors duration-150 ease-out active:scale-[0.96] flex items-center justify-center ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300" strokeWidth={1.75} />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 hover:text-slate-900" strokeWidth={1.75} />
      )}
    </button>
  );
}
