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
  blue: string;
}

const darkTheme: Theme = {
  bg: '#0a0f0a',
  bgSecondary: '#141a14',
  bgTertiary: '#1c241c',
  text: '#ffffff',
  textSecondary: '#d0d8c8',
  accent: '#4a5d3a',
  gold: '#c4a35a',
  sepia: '#8b7355',
  border: '#2a352a',
  pitch: '#1a2a1a',
  pitchLines: '#2a3a2a',
  red: '#e54545',
  green: '#5a8c5a',
  blue: '#5a7a9c',
};

const lightTheme: Theme = {
  bg: '#f5f2e8',             // Warm cream background
  bgSecondary: '#faf8f3',    // Slightly lighter cream (not pure white)
  bgTertiary: '#ebe7db',     // Warm beige
  text: '#3a4a32',           // Dark olive green
  textSecondary: '#4a5240',  // Dark olive secondary text
  accent: '#4a5d3a',         // Forest green accent
  gold: '#8a6d25',           // Darker gold for light mode
  sepia: '#5b4530',          // Darker sepia
  border: '#d8d2c2',         // Warm border
  pitch: '#3d5c3d',
  pitchLines: '#4a6c4a',
  red: '#a83030',            // Darker red for contrast
  green: '#3d7a3d',          // Darker green
  blue: '#4a6a8a',           // Muted blue for light mode
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
