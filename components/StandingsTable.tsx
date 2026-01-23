'use client';

import { Star, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { useFavorites } from '@/lib/use-favorites';

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

interface StandingsTableProps {
  standings: Standing[];
  leagueName: string;
}

export function StandingsTable({ standings, leagueName }: StandingsTableProps) {
  const { theme } = useTheme();
  const { isFavorite, toggleFavorite, isLoggedIn } = useFavorites();
  const router = useRouter();

  const handleFavoriteClick = (teamId: number) => {
    if (!isLoggedIn) {
      router.push('/favorites');
      return;
    }
    toggleFavorite('team', teamId);
  };

  return (
    <div>
      <h2
        className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: theme.textSecondary }}
      >
        {leagueName} Standings
      </h2>

      <div
        className="overflow-hidden rounded-xl transition-theme"
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-[28px_1fr_36px_36px_44px_28px] px-3 py-2 text-[9px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
        >
          <span>#</span>
          <span>Club</span>
          <span className="text-center">W</span>
          <span className="text-center">D</span>
          <span className="text-center">Pts</span>
          <span></span>
        </div>

        {/* Rows */}
        {standings.map((team) => (
          <div
            key={team.teamId}
            className="grid grid-cols-[28px_1fr_36px_36px_44px_28px] items-center px-3 py-3 transition-theme"
            style={{ borderTop: `1px solid ${theme.border}` }}
          >
            <span
              className="font-mono text-xs"
              style={{
                color: team.position <= 4 ? theme.accent : theme.textSecondary,
                fontWeight: team.position <= 4 ? 600 : 400,
              }}
            >
              {team.position}
            </span>

            <Link
              href={`/team/${team.teamId}`}
              className="flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-80"
              style={{ color: theme.text }}
            >
              {team.logo && (
                <img src={team.logo} alt={team.team} className="h-5 w-5 object-contain" />
              )}
              <span className="truncate">{team.team}</span>
              {isFavorite('team', team.teamId) && (
                <Star size={10} fill={theme.gold} color={theme.gold} />
              )}
            </Link>

            <span
              className="font-mono text-center text-xs"
              style={{ color: theme.textSecondary }}
            >
              {team.won}
            </span>

            <span
              className="font-mono text-center text-xs"
              style={{ color: theme.textSecondary }}
            >
              {team.drawn}
            </span>

            <span className="font-mono text-center text-[13px] font-semibold">
              {team.points}
            </span>

            <button
              onClick={(e) => {
                e.preventDefault();
                handleFavoriteClick(team.teamId);
              }}
              className="flex items-center justify-center p-1"
            >
              <Heart
                size={14}
                color={isFavorite('team', team.teamId) ? theme.gold : theme.textSecondary}
                fill={isFavorite('team', team.teamId) ? theme.gold : 'transparent'}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
