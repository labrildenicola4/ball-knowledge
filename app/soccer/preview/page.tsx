'use client';

import { useTheme } from '@/lib/theme';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { getThemedLogo, shouldUseWhiteFilter } from '@/lib/constants/dark-mode-logos';

const SAMPLE_LOGOS = [
  { slug: 'premier-league', name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { slug: 'la-liga', name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { slug: 'serie-a', name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { slug: 'bundesliga', name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { slug: 'ligue-1', name: 'Ligue 1', logo: 'https://media.api-sports.io/football/leagues/61.png' },
  { slug: 'champions-league', name: 'Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png' },
];

// Legacy - keeping for old preview sections
const WHITE_FILTER_LEAGUES = ['Ligue 1', 'Champions League'];

export default function LogoPreviewPage() {
  const { theme, darkMode } = useTheme();

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}
    >
      <Header />

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        <h1 className="text-xl font-bold mb-6" style={{ color: theme.text }}>
          Logo Background Options Preview
        </h1>

        {/* OPTION MAIN - FINAL IMPLEMENTATION */}
        <section className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.green }}
          >
            ★ OPTION MAIN (IMPLEMENTED)
          </h2>
          <p className="text-xs mb-3" style={{ color: theme.textSecondary }}>
            EPL → custom white logo | UCL & Ligue 1 → white filter | Others → original
          </p>
          <div
            className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <div className="flex flex-wrap gap-4">
              {SAMPLE_LOGOS.map(league => {
                const logoSrc = getThemedLogo(league.slug, league.logo, darkMode);
                const useFilter = darkMode && shouldUseWhiteFilter(league.slug);
                const hasCustomLogo = logoSrc !== league.logo;
                return (
                  <div key={league.name} className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 flex items-center justify-center">
                      <img
                        src={logoSrc}
                        alt={league.name}
                        className="h-10 w-10 object-contain logo-glow"
                        style={{ filter: useFilter ? 'brightness(0) invert(1)' : undefined }}
                      />
                    </div>
                    <span className="text-[10px] text-center" style={{ color: theme.textSecondary }}>
                      {league.name}
                    </span>
                    {(hasCustomLogo || useFilter) && (
                      <span className="text-[8px]" style={{ color: theme.accent }}>
                        {hasCustomLogo ? '(custom logo)' : '(white filter)'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Option 1: White Circular Background */}
        <section className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.accent }}
          >
            Option 1: White Circular Background
          </h2>
          <div
            className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <div className="flex flex-wrap gap-4">
              {SAMPLE_LOGOS.map(league => (
                <div key={league.name} className="flex flex-col items-center gap-2">
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="h-10 w-10 object-contain logo-glow"
                    />
                  </div>
                  <span className="text-[10px] text-center" style={{ color: theme.textSecondary }}>
                    {league.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Option 5: Semi-transparent Light Background */}
        <section className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.accent }}
          >
            Option 5: Semi-transparent Background
          </h2>
          <div
            className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <div className="flex flex-wrap gap-4">
              {SAMPLE_LOGOS.map(league => (
                <div key={league.name} className="flex flex-col items-center gap-2">
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="h-10 w-10 object-contain logo-glow"
                    />
                  </div>
                  <span className="text-[10px] text-center" style={{ color: theme.textSecondary }}>
                    {league.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bonus: Option 1 with rounded square */}
        <section className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.accent }}
          >
            Option 1B: White Rounded Square
          </h2>
          <div
            className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <div className="flex flex-wrap gap-4">
              {SAMPLE_LOGOS.map(league => (
                <div key={league.name} className="flex flex-col items-center gap-2">
                  <div
                    className="h-14 w-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="h-10 w-10 object-contain logo-glow"
                    />
                  </div>
                  <span className="text-[10px] text-center" style={{ color: theme.textSecondary }}>
                    {league.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bonus: Subtle off-white background */}
        <section className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.accent }}
          >
            Option 1C: Off-white/Light Gray Background
          </h2>
          <div
            className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <div className="flex flex-wrap gap-4">
              {SAMPLE_LOGOS.map(league => (
                <div key={league.name} className="flex flex-col items-center gap-2">
                  <div
                    className="h-14 w-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#f0f0f0' }}
                  >
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="h-10 w-10 object-contain logo-glow"
                    />
                  </div>
                  <span className="text-[10px] text-center" style={{ color: theme.textSecondary }}>
                    {league.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Option 8: MIXED APPROACH - Recommended */}
        <section className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.green }}
          >
            ★ Option 8: Mixed Approach (RECOMMENDED)
          </h2>
          <p className="text-xs mb-3" style={{ color: theme.textSecondary }}>
            UCL & Ligue 1 → white filter | EPL, La Liga, Serie A, Bundesliga → white background
          </p>
          <div
            className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <div className="flex flex-wrap gap-4">
              {SAMPLE_LOGOS.map(league => {
                const useFilter = WHITE_FILTER_LEAGUES.includes(league.name);
                return (
                  <div key={league.name} className="flex flex-col items-center gap-2">
                    <div
                      className="h-14 w-14 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: useFilter ? 'transparent' : '#ffffff' }}
                    >
                      <img
                        src={league.logo}
                        alt={league.name}
                        className="h-10 w-10 object-contain logo-glow"
                        style={{ filter: darkMode && useFilter ? 'brightness(0) invert(1)' : undefined }}
                      />
                    </div>
                    <span className="text-[10px] text-center" style={{ color: theme.textSecondary }}>
                      {league.name}
                    </span>
                    <span className="text-[8px]" style={{ color: theme.accent }}>
                      {useFilter ? '(filter)' : '(white bg)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Option 6: White Silhouette (used elsewhere in codebase) */}
        <section className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.green }}
          >
            ★ Option 6: White Silhouette (brightness(0) invert(1)) - RECOMMENDED
          </h2>
          <p className="text-xs mb-3" style={{ color: theme.textSecondary }}>
            Already used in MatchCard.tsx and team pages. Creates a clean white version.
          </p>
          <div
            className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <div className="flex flex-wrap gap-4">
              {SAMPLE_LOGOS.map(league => (
                <div key={league.name} className="flex flex-col items-center gap-2">
                  <div className="h-14 w-14 flex items-center justify-center">
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="h-10 w-10 object-contain logo-glow"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                  </div>
                  <span className="text-[10px] text-center" style={{ color: theme.textSecondary }}>
                    {league.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Option 7: Conditional - only apply in dark mode */}
        <section className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.accent }}
          >
            Option 7: Dark Mode Only (toggle theme to compare)
          </h2>
          <p className="text-xs mb-3" style={{ color: theme.textSecondary }}>
            Filter only applies when dark mode is active. Toggle theme to see difference.
          </p>
          <div
            className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <div className="flex flex-wrap gap-4">
              {SAMPLE_LOGOS.map(league => (
                <div key={league.name} className="flex flex-col items-center gap-2">
                  <div className="h-14 w-14 flex items-center justify-center">
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="h-10 w-10 object-contain logo-glow"
                      style={{ filter: darkMode ? 'brightness(0) invert(1)' : undefined }}
                    />
                  </div>
                  <span className="text-[10px] text-center" style={{ color: theme.textSecondary }}>
                    {league.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Current (no background) for comparison */}
        <section className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.textSecondary }}
          >
            Current (No Background)
          </h2>
          <div
            className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <div className="flex flex-wrap gap-4">
              {SAMPLE_LOGOS.map(league => (
                <div key={league.name} className="flex flex-col items-center gap-2">
                  <div className="h-14 w-14 flex items-center justify-center">
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="h-10 w-10 object-contain logo-glow"
                    />
                  </div>
                  <span className="text-[10px] text-center" style={{ color: theme.textSecondary }}>
                    {league.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
