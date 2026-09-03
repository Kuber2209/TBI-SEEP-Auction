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
        className={`p-2 rounded-md bg-[#eff4f0] border border-[#cad7cc] text-[#56695e] opacity-50 ${className}`}
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
      className={`p-2 rounded-md bg-[#eff4f0] hover:bg-[#e5ece6] border border-[#cad7cc] hover:border-[#1a5c3e] text-[#203126] hover:text-[#1a5c3e] transition-colors duration-150 ease-out shadow-sm flex items-center justify-center ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#1a5c3e]" strokeWidth={1.75} />
      ) : (
        <Moon className="w-4 h-4 text-[#56695e] hover:text-[#203126]" strokeWidth={1.75} />
      )}
    </button>
  );
}
