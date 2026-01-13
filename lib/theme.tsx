'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  theme: Theme;
}

interface Theme {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  text: string;
  textSecondary: string;
  accent: string;
  gold: string;
  sepia: string;
  border: string;
  pitch: string;
  pitchLines: string;
  red: string;
  green: string;
}

const darkTheme: Theme = {
  bg: '#0a0f0a',
  bgSecondary: '#141a14',
  bgTertiary: '#1c241c',
  text: '#f5f2eb',
  textSecondary: '#a8b5a0',
  accent: '#4a5d3a',
  gold: '#c4a35a',
  sepia: '#8b7355',
  border: '#2a352a',
  pitch: '#1a2a1a',
  pitchLines: '#2a3a2a',
  red: '#c45a5a',
  green: '#5a8c5a',
};

const lightTheme: Theme = {
  bg: '#f5f2eb',
  bgSecondary: '#ebe7dc',
  bgTertiary: '#e0dbd0',
  text: '#1a2018',
  textSecondary: '#5c6858',
  accent: '#4a5d3a',
  gold: '#c4a35a',
  sepia: '#8b7355',
  border: '#d0c9b8',
  pitch: '#3d5c3d',
  pitchLines: '#4a6c4a',
  red: '#c45a5a',
  green: '#5a8c5a',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(JSON.parse(saved));
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Update document class for Tailwind
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
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
