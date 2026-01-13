import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ball Knowledge palette
        olive: {
          50: '#f6f7f4',
          100: '#e8ebe3',
          200: '#d2d8c8',
          300: '#b3bea3',
          400: '#94a27e',
          500: '#4a5d3a', // Primary
          600: '#3d4d30',
          700: '#323f28',
          800: '#2a3422',
          900: '#1a2018',
        },
        cream: {
          50: '#fdfcfa',
          100: '#f5f2eb',
          200: '#ebe7dc',
          300: '#e0dbd0',
          400: '#d0c9b8',
        },
        navy: {
          800: '#1a2a3a',
          900: '#0f1a24',
        },
        gold: '#c4a35a',
        sepia: '#8b7355',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
