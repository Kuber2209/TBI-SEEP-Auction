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
        className={`p-2 rounded-md bg-[#f9f8f6] border border-[#e2e5ea] text-[#6b7a8d] opacity-50 ${className}`}
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
      className={`p-2 rounded-md bg-[#f9f8f6] hover:bg-[#f1f4f7] border border-[#e2e5ea] hover:border-[#cbd5e1] text-[#33404f] hover:text-[#1a5c3e] transition-colors duration-150 ease-out shadow-sm flex items-center justify-center ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#1a5c3e]" strokeWidth={1.75} />
      ) : (
        <Moon className="w-4 h-4 text-[#6b7a8d] hover:text-[#33404f]" strokeWidth={1.75} />
      )}
    </button>
  );
}
