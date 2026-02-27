'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { SafeImage } from '@/components/SafeImage';

export interface ConferenceStandingsTeam {
  id: string;
  name: string;
  shortName?: string;
  abbreviation?: string;
  logo: string;
  conferenceWins: number;
  conferenceLosses: number;
  overallWins: number;
  overallLosses: number;
  rank?: number;
}

interface ConferenceStandingsTableProps {
  teams: ConferenceStandingsTeam[];
  sport: 'basketball' | 'football' | 'nba' | 'mlb';
  highlightTeamId?: string;
  emptyMessage?: string;
}

export function ConferenceStandingsTable({ teams, sport, highlightTeamId, emptyMessage }: ConferenceStandingsTableProps) {
  const { theme, darkMode } = useTheme();

  const getTeamHref = (teamId: string) => {
    switch (sport) {
      case 'basketball':
        return `/basketball/team/${teamId}`;
      case 'football':
        return `/football/team/${teamId}`;
      case 'nba':
        return `/nba/team/${teamId}`;
      case 'mlb':
        return `/mlb/team/${teamId}`;
      default:
        return '#';
    }
  };

  if (teams.length === 0) {
    return (
      <div
        className={`rounded-xl p-6 text-center ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <p className="text-[12px]" style={{ color: theme.textSecondary }}>
          {emptyMessage || 'Standings not available'}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
      style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      {/* Header */}
      <div
        className="flex items-center px-4 py-2 text-[10px] font-semibold uppercase"
        style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary, color: theme.textSecondary }}
      >
        <span className="w-7">#</span>
        <span className="flex-1">Team</span>
        <span className="w-14 text-center">Conf</span>
        <span className="w-16 text-center">Overall</span>
      </div>

      {/* Teams */}
      {teams.map((team, index) => {
        const isHighlighted = team.id === highlightTeamId;

        return (
          <Link
            key={team.id}
            href={getTeamHref(team.id)}
            className="flex items-center px-4 py-2.5 hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: isHighlighted ? `${theme.accent}15` : 'transparent',
              borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
            }}
          >
            <span
              className="w-7 text-[12px] font-bold"
              style={{ color: theme.textSecondary }}
            >
              {index + 1}
            </span>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              {team.rank && team.rank <= 25 && (
                <span
                  className="text-[10px] font-bold"
                  style={{ color: theme.gold }}
                >
                  #{team.rank}
                </span>
              )}
              <SafeImage
                src={team.logo}
                alt={team.name}
                className="h-6 w-6 object-contain logo-glow flex-shrink-0"
              />
              <span
                className="text-[13px] font-medium truncate"
                style={{ color: isHighlighted ? theme.accent : theme.text }}
              >
                {team.shortName || team.abbreviation || team.name}
              </span>
            </div>
            <span
              className="w-14 text-center text-[12px] font-mono"
              style={{ color: theme.accent }}
            >
              {team.conferenceWins}-{team.conferenceLosses}
            </span>
            <span
              className="w-16 text-center text-[12px] font-mono"
              style={{ color: theme.text }}
            >
              {team.overallWins}-{team.overallLosses}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
