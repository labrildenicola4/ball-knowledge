'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { MLBStanding } from '@/lib/types/mlb';
import { SafeImage } from '@/components/SafeImage';

interface MLBStandingsProps {
  standings: MLBStanding[];
  divisionName: string;
}

export function MLBStandings({ standings, divisionName }: MLBStandingsProps) {
  const { theme, darkMode } = useTheme();

  return (
    <div
      className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
      style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      {/* Division Header */}
      <div
        className="px-4 py-3"
        style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
      >
        <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
          {divisionName}
        </h3>
      </div>

      {/* Column Headers */}
      <div
        className="grid items-center px-3 py-2 text-[9px] font-semibold uppercase tracking-wider"
        style={{
          gridTemplateColumns: '1fr 35px 35px 45px 45px 50px 50px 45px 45px',
          borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
          color: theme.textSecondary,
        }}
      >
        <span>Team</span>
        <span className="text-center">W</span>
        <span className="text-center">L</span>
        <span className="text-center">PCT</span>
        <span className="text-center">GB</span>
        <span className="text-center">Home</span>
        <span className="text-center">Away</span>
        <span className="text-center">L10</span>
        <span className="text-center">STRK</span>
      </div>

      {/* Teams */}
      {standings.map((standing, idx) => (
        <Link
          key={standing.team.id}
          href={`/mlb/team/${standing.team.id}`}
          className="block"
        >
          <div
            className="grid items-center px-3 py-2.5 text-[11px] hover:opacity-80 transition-opacity"
            style={{
              gridTemplateColumns: '1fr 35px 35px 45px 45px 50px 50px 45px 45px',
              borderTop: idx > 0 ? `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` : 'none',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="text-[10px] w-4 text-center"
                style={{ color: theme.textSecondary }}
              >
                {idx + 1}
              </span>
              {standing.team.logo && (
                <SafeImage
                  src={standing.team.logo}
                  alt={standing.team.name}
                  className="h-5 w-5 object-contain logo-glow"
                />
              )}
              <span className="font-medium truncate" style={{ color: theme.text }}>
                {standing.team.shortDisplayName}
              </span>
            </div>
            <span className="text-center font-mono font-semibold" style={{ color: theme.text }}>
              {standing.wins}
            </span>
            <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
              {standing.losses}
            </span>
            <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
              {standing.pct}
            </span>
            <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
              {standing.gamesBack}
            </span>
            <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
              {standing.homeRecord}
            </span>
            <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
              {standing.awayRecord}
            </span>
            <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
              {standing.last10}
            </span>
            <span
              className="text-center font-mono text-[10px]"
              style={{
                color: standing.streak.startsWith('W') ? theme.green :
                       standing.streak.startsWith('L') ? theme.red :
                       theme.textSecondary,
              }}
            >
              {standing.streak}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
