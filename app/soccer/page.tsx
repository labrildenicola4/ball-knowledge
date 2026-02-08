'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/lib/theme';
import { getThemedLogo, shouldUseWhiteFilter } from '@/lib/constants/dark-mode-logos';

// Leagues ordered by importance
const SOCCER_LEAGUES = [
  // Top 5 European Leagues
  { slug: 'premier-league', name: 'Premier League', shortName: 'EPL', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { slug: 'la-liga', name: 'La Liga', shortName: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { slug: 'serie-a', name: 'Serie A', shortName: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { slug: 'bundesliga', name: 'Bundesliga', shortName: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { slug: 'ligue-1', name: 'Ligue 1', shortName: 'Ligue 1', country: 'France', logo: 'https://media.api-sports.io/football/leagues/61.png' },
  // Champions League
  { slug: 'champions-league', name: 'UEFA Champions League', shortName: 'UCL', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/2.png' },
];

const OTHER_COMPETITIONS = [
  // Other European Competitions
  { slug: 'europa-league', name: 'UEFA Europa League', shortName: 'UEL', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/3.png' },
  // Other Top Leagues
  { slug: 'primeira-liga', name: 'Primeira Liga', shortName: 'Liga Portugal', country: 'Portugal', logo: 'https://media.api-sports.io/football/leagues/94.png' },
  { slug: 'eredivisie', name: 'Eredivisie', shortName: 'Eredivisie', country: 'Netherlands', logo: 'https://media.api-sports.io/football/leagues/88.png' },
  { slug: 'championship', name: 'EFL Championship', shortName: 'Championship', country: 'England', logo: 'https://media.api-sports.io/football/leagues/40.png' },
  { slug: 'brasileirao', name: 'Brasileirão Série A', shortName: 'Brasileirão', country: 'Brazil', logo: 'https://media.api-sports.io/football/leagues/71.png' },
  { slug: 'copa-libertadores', name: 'Copa Libertadores', shortName: 'Libertadores', country: 'South America', logo: 'https://media.api-sports.io/football/leagues/13.png' },
];

const DOMESTIC_CUPS = [
  { slug: 'fa-cup', name: 'FA Cup', shortName: 'FA Cup', country: 'England', logo: 'https://media.api-sports.io/football/leagues/45.png' },
  { slug: 'copa-del-rey', name: 'Copa del Rey', shortName: 'Copa del Rey', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/143.png' },
  { slug: 'coppa-italia', name: 'Coppa Italia', shortName: 'Coppa Italia', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/137.png' },
  { slug: 'dfb-pokal', name: 'DFB-Pokal', shortName: 'DFB-Pokal', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/81.png' },
  { slug: 'coupe-de-france', name: 'Coupe de France', shortName: 'Coupe de France', country: 'France', logo: 'https://media.api-sports.io/football/leagues/66.png' },
];

function LeagueCard({ league }: { league: typeof SOCCER_LEAGUES[0] }) {
  const { theme, darkMode } = useTheme();
  const logoSrc = getThemedLogo(league.slug, league.logo, darkMode);
  const useWhiteFilter = darkMode && shouldUseWhiteFilter(league.slug);

  return (
    <Link
      href={`/league/${league.slug}`}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:opacity-80"
      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      <img
        src={logoSrc}
        alt={league.name}
        className="h-10 w-10 object-contain logo-glow"
        style={{ filter: useWhiteFilter ? 'brightness(0) invert(1)' : undefined }}
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block truncate" style={{ color: theme.text }}>
          {league.name}
        </span>
        <span className="text-[11px]" style={{ color: theme.textSecondary }}>
          {league.country}
        </span>
      </div>
      <ChevronRight size={16} style={{ color: theme.textSecondary }} />
    </Link>
  );
}

export default function SoccerHubPage() {
  const { theme } = useTheme();

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      <Header />

      {/* Header */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/all"
            className="flex items-center justify-center rounded-full p-1.5 -ml-1.5 hover:opacity-70 transition-opacity"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <ChevronLeft size={20} style={{ color: theme.text }} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
              Soccer
            </h1>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              {dateStr}
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {/* Top Leagues */}
        <section className="mb-6">
          <h2
            className="text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.textSecondary }}
          >
            Top Leagues
          </h2>
          <div className="flex flex-col gap-2">
            {SOCCER_LEAGUES.map(league => (
              <LeagueCard key={league.slug} league={league} />
            ))}
          </div>
        </section>

        {/* Other Competitions */}
        <section className="mb-6">
          <h2
            className="text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.textSecondary }}
          >
            Other Competitions
          </h2>
          <div className="flex flex-col gap-2">
            {OTHER_COMPETITIONS.map(league => (
              <LeagueCard key={league.slug} league={league} />
            ))}
          </div>
        </section>

        {/* Domestic Cups */}
        <section className="mb-6">
          <h2
            className="text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.textSecondary }}
          >
            Domestic Cups
          </h2>
          <div className="flex flex-col gap-2">
            {DOMESTIC_CUPS.map(league => (
              <LeagueCard key={league.slug} league={league} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
