'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { BasketballStanding, BasketballRanking } from '@/lib/types/basketball';

interface BasketballStandingsProps {
  standings: BasketballStanding[];
  conferenceName: string;
}

export function BasketballStandings({ standings, conferenceName }: BasketballStandingsProps) {
  const { theme, darkMode } = useTheme();

  if (!standings || standings.length === 0) {
    return (
      <div
        className={`rounded-xl p-6 text-center ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <p className="text-[12px]" style={{ color: theme.textSecondary }}>
          No standings available
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2
        className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: theme.textSecondary }}
      >
        {conferenceName} Standings
      </h2>

      {/* Mobile View */}
      <div
        className={`lg:hidden overflow-hidden rounded-xl ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-[28px_1fr_50px_50px] px-3 py-2 text-[9px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary, color: theme.textSecondary }}
        >
          <span>#</span>
          <span>Team</span>
          <span className="text-center">Conf</span>
          <span className="text-center">All</span>
        </div>

        {/* Rows */}
        {standings.map((standing, index) => (
          <div
            key={standing.team.id}
            className="grid grid-cols-[28px_1fr_50px_50px] items-center px-3 py-3"
            style={{ borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
          >
            <span
              className="font-mono text-xs"
              style={{
                color: index < 4 ? theme.accent : theme.textSecondary,
                fontWeight: index < 4 ? 600 : 400,
              }}
            >
              {index + 1}
            </span>

            <Link
              href={`/basketball/team/${standing.team.id}`}
              className="flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-80"
              style={{ color: theme.text }}
            >
              {standing.team.logo && (
                <img src={standing.team.logo} alt={standing.team.name} className="h-5 w-5 object-contain logo-glow" />
              )}
              <span className="truncate">{standing.team.shortDisplayName || standing.team.name}</span>
              {standing.team.rank && standing.team.rank <= 25 && (
                <span className="text-[9px] font-bold" style={{ color: theme.accent }}>
                  #{standing.team.rank}
                </span>
              )}
            </Link>

            <span className="font-mono text-center text-xs" style={{ color: theme.textSecondary }}>
              {standing.conferenceRecord.wins}-{standing.conferenceRecord.losses}
            </span>

            <span className="font-mono text-center text-xs" style={{ color: theme.textSecondary }}>
              {standing.overallRecord.wins}-{standing.overallRecord.losses}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div
        className={`hidden lg:block overflow-hidden rounded-xl ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-[40px_1fr_80px_80px_80px] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary, color: theme.textSecondary }}
        >
          <span>#</span>
          <span>Team</span>
          <span className="text-center">Conf</span>
          <span className="text-center">Overall</span>
          <span className="text-center">Streak</span>
        </div>

        {/* Rows */}
        {standings.map((standing, index) => (
          <div
            key={`desktop-${standing.team.id}`}
            className="grid grid-cols-[40px_1fr_80px_80px_80px] items-center px-4 py-3 hover:bg-opacity-50"
            style={{ borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
          >
            <span
              className="font-mono text-sm"
              style={{
                color: index < 4 ? theme.accent : theme.textSecondary,
                fontWeight: index < 4 ? 600 : 400,
              }}
            >
              {index + 1}
            </span>

            <Link
              href={`/basketball/team/${standing.team.id}`}
              className="flex items-center gap-3 text-[14px] font-medium transition-opacity hover:opacity-80"
              style={{ color: theme.text }}
            >
              {standing.team.logo && (
                <img src={standing.team.logo} alt={standing.team.name} className="h-6 w-6 object-contain logo-glow" />
              )}
              <span className="truncate">{standing.team.displayName || standing.team.name}</span>
              {standing.team.rank && standing.team.rank <= 25 && (
                <span className="text-[10px] font-bold" style={{ color: theme.accent }}>
                  #{standing.team.rank}
                </span>
              )}
            </Link>

            <span className="font-mono text-center text-sm" style={{ color: theme.textSecondary }}>
              {standing.conferenceRecord.wins}-{standing.conferenceRecord.losses}
            </span>

            <span className="font-mono text-center text-sm" style={{ color: theme.textSecondary }}>
              {standing.overallRecord.wins}-{standing.overallRecord.losses}
            </span>

            <span
              className="font-mono text-center text-sm"
              style={{
                color: standing.streak.startsWith('W') ? theme.green : standing.streak.startsWith('L') ? theme.red : theme.textSecondary,
              }}
            >
              {standing.streak}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BasketballRankingsProps {
  rankings: BasketballRanking[];
}

export function BasketballRankings({ rankings }: BasketballRankingsProps) {
  const { theme, darkMode } = useTheme();

  if (!rankings || rankings.length === 0) {
    return null;
  }

  return (
    <div>
      <h2
        className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: theme.textSecondary }}
      >
        AP Top 25
      </h2>

      <div
        className={`overflow-hidden rounded-xl ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-[40px_1fr_80px_60px] px-4 py-2 text-[9px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary, color: theme.textSecondary }}
        >
          <span>Rank</span>
          <span>Team</span>
          <span className="text-center">Record</span>
          <span className="text-center">Trend</span>
        </div>

        {/* Rows */}
        {rankings.map((ranking) => (
          <div
            key={ranking.team.id}
            className="grid grid-cols-[40px_1fr_80px_60px] items-center px-4 py-3"
            style={{ borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
          >
            <span className="font-mono text-sm font-semibold" style={{ color: theme.accent }}>
              {ranking.rank}
            </span>

            <Link
              href={`/basketball/team/${ranking.team.id}`}
              className="flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-80"
              style={{ color: theme.text }}
            >
              {ranking.team.logo && (
                <img src={ranking.team.logo} alt={ranking.team.name} className="h-5 w-5 object-contain logo-glow" />
              )}
              <span className="truncate">{ranking.team.name}</span>
            </Link>

            <span className="font-mono text-center text-xs" style={{ color: theme.textSecondary }}>
              {ranking.record}
            </span>

            <div className="flex items-center justify-center gap-1">
              {ranking.trend === 'up' && (
                <span className="text-[10px]" style={{ color: theme.green }}>
                  +{(ranking.previousRank || 0) - ranking.rank}
                </span>
              )}
              {ranking.trend === 'down' && (
                <span className="text-[10px]" style={{ color: theme.red }}>
                  -{ranking.rank - (ranking.previousRank || 0)}
                </span>
              )}
              {ranking.trend === 'same' && (
                <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                  -
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
