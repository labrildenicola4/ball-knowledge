'use client';

import { useTheme } from '@/lib/theme';

interface Standing {
  position: number;
  teamId: number;
  team: string;
  logo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: string;
  points: number;
  form: string[];
}

interface MatchStandingsProps {
  standings: Standing[];
  homeTeamId: number;
  awayTeamId: number;
  leagueName: string;
}

export function MatchStandings({ standings, homeTeamId, awayTeamId, leagueName }: MatchStandingsProps) {
  const { theme } = useTheme();

  const isHighlighted = (teamId: number) => teamId === homeTeamId || teamId === awayTeamId;

  return (
    <div>
      <h3
        className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: theme.textSecondary }}
      >
        {leagueName} Table
      </h3>

      <div
        className="overflow-hidden rounded-xl"
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-[28px_1fr_32px_32px_40px] px-3 py-2 text-[9px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
        >
          <span>#</span>
          <span>Club</span>
          <span className="text-center">P</span>
          <span className="text-center">GD</span>
          <span className="text-center">Pts</span>
        </div>

        {/* Rows */}
        {standings.map((team) => {
          const highlighted = isHighlighted(team.teamId);
          return (
            <div
              key={team.teamId}
              className="grid grid-cols-[28px_1fr_32px_32px_40px] items-center px-3 py-2.5"
              style={{
                borderTop: `1px solid ${theme.border}`,
                backgroundColor: highlighted ? `${theme.accent}30` : 'transparent',
                borderLeft: highlighted ? `3px solid ${theme.accent}` : '3px solid transparent',
              }}
            >
              <span
                className="font-mono text-xs"
                style={{
                  color: team.position <= 4 ? theme.accent : theme.textSecondary,
                  fontWeight: team.position <= 4 || highlighted ? 600 : 400,
                }}
              >
                {team.position}
              </span>

              <span
                className="flex items-center gap-2 text-[12px]"
                style={{ fontWeight: highlighted ? 600 : 400, color: theme.text }}
              >
                {team.logo && (
                  <img src={team.logo} alt={team.team} className="h-4 w-4 object-contain" />
                )}
                <span className="truncate">{team.team}</span>
              </span>

              <span
                className="font-mono text-center text-[11px]"
                style={{ color: theme.textSecondary }}
              >
                {team.played}
              </span>

              <span
                className="font-mono text-center text-[11px]"
                style={{
                  color: team.gd.startsWith('+') ? theme.accent : team.gd.startsWith('-') ? theme.red : theme.textSecondary,
                }}
              >
                {team.gd}
              </span>

              <span
                className="font-mono text-center text-[12px]"
                style={{ fontWeight: highlighted ? 700 : 600, color: theme.text }}
              >
                {team.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
