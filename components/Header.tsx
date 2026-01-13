'use client';

import { Trophy, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function Header() {
  const { darkMode, toggleDarkMode, theme } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md transition-theme"
      style={{
        backgroundColor: darkMode ? 'rgba(10, 15, 10, 0.95)' : 'rgba(245, 242, 235, 0.95)',
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.accent }}
          >
            <Trophy size={18} color="#fff" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-wide">
              Ball Knowledge
            </h1>
            <p
              className="text-[8px] uppercase tracking-[2px]"
              style={{ color: theme.textSecondary }}
            >
              Pure Data
            </p>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ border: `1px solid ${theme.border}` }}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
