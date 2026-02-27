'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { GolfTournament } from '@/lib/types/golf';
import { SafeImage } from '@/components/SafeImage';

// Tour branding
const TOUR_COLORS: Record<string, { bg: string; label: string }> = {
  pga: { bg: '#003F2D', label: 'PGA' },
  eur: { bg: '#1a3c6e', label: 'DPWT' },
  lpga: { bg: '#00205B', label: 'LPGA' },
  liv: { bg: '#000000', label: 'LIV' },
};

interface GolfEventCardProps {
  tournament: GolfTournament;
  /** Show the compact version (no leaderboard preview) */
  compact?: boolean;
}

export const GolfEventCard = memo(function GolfEventCard({ tournament, compact }: GolfEventCardProps) {
  const { theme, darkMode } = useTheme();
  const isLive = tournament.status === 'in_progress';
  const isFinal = tournament.status === 'final';
  const leader = tournament.leaderboard[0];
  const tourBranding = TOUR_COLORS[tournament.tour || 'pga'] || TOUR_COLORS.pga;
  const top5 = tournament.leaderboard.slice(0, 5);

  const getScoreColor = (score: string) => {
    if (score.startsWith('-')) return theme.red;
    if (score === 'E') return theme.text;
    if (score.startsWith('+')) return theme.blue;
    return theme.text;
  };

  return (
    <Link href={`/golf/event/${tournament.id}?tour=${tournament.tour || 'pga'}`}>
      <div className="card-press cursor-pointer p-4 md:p-5 transition-theme glass-match-card">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-[10px] font-medium uppercase"
              style={{ backgroundColor: tourBranding.bg, color: '#fff' }}
            >
              {tourBranding.label}
            </span>
            {tournament.currentRound && isLive && (
              <span className="text-[11px] font-medium" style={{ color: theme.textSecondary }}>
                Round {tournament.currentRound}
              </span>
            )}
            {tournament.isMajor && (
              <Trophy size={12} style={{ color: '#D4AF37' }} />
            )}
          </div>
          <span
            className={`font-mono rounded-lg px-3 py-1 text-[12px] ${isLive ? 'glass-badge-live' : 'glass-badge'}`}
            style={{ color: isLive ? '#fff' : theme.textSecondary }}
          >
            {isLive ? '● In Progress' : isFinal ? 'Final' : tournament.date}
          </span>
        </div>

        {/* Tournament Name */}
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: theme.text }}>
          {tournament.name}
        </h3>

        {/* Venue Info */}
        {(tournament.venue || tournament.course) && (
          <p className="text-[12px] mb-3" style={{ color: theme.textSecondary }}>
            {[tournament.course, tournament.city].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Top 5 Leaderboard Preview for live events */}
        {isLive && !compact && top5.length > 0 ? (
          <div
            className="rounded-lg overflow-hidden mt-2"
            style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
          >
            {/* Column headers */}
            <div
              className="grid items-center px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider"
              style={{
                gridTemplateColumns: '30px 1fr 45px 40px 35px',
                color: theme.textSecondary,
                backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.5)' : theme.bgTertiary,
              }}
            >
              <span>Pos</span>
              <span>Player</span>
              <span className="text-center">Score</span>
              <span className="text-center">Today</span>
              <span className="text-center">Thru</span>
            </div>

            {top5.map((player, idx) => (
              <Link key={player.id} href={`/player/golf/${player.id}`} className="contents">
              <div
                className="grid items-center px-3 py-2 text-[11px]"
                style={{
                  gridTemplateColumns: '30px 1fr 45px 40px 35px',
                  borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                }}
              >
                <span
                  className="font-mono font-bold text-[12px]"
                  style={{ color: idx === 0 ? '#D4AF37' : theme.text }}
                >
                  {player.position}
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  {player.countryFlag && (
                    <SafeImage src={player.countryFlag} alt="" className="h-3 w-4 object-contain flex-shrink-0" />
                  )}
                  <span className="font-medium truncate" style={{ color: theme.text }}>
                    {player.shortName}
                  </span>
                </div>
                <span
                  className="text-center font-mono font-semibold text-[12px]"
                  style={{ color: getScoreColor(player.score) }}
                >
                  {player.score}
                </span>
                <span
                  className="text-center font-mono"
                  style={{ color: player.today ? getScoreColor(player.today) : theme.textSecondary }}
                >
                  {player.today || '-'}
                </span>
                <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
                  {player.thru || '-'}
                </span>
              </div>
              </Link>
            ))}
          </div>
        ) : leader && (isLive || isFinal) ? (
          /* Simple leader row for final / compact mode */
          <div
            className="flex items-center justify-between rounded-lg p-3 mt-2"
            style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                {leader.position}
              </span>
              <span className="text-sm font-medium" style={{ color: theme.text }}>
                {leader.name}
              </span>
            </div>
            <span
              className="text-sm font-mono font-semibold"
              style={{ color: getScoreColor(leader.score) }}
            >
              {leader.score}
            </span>
          </div>
        ) : null}

        {/* Purse */}
        {tournament.purse && (
          <p className="mt-2 text-[10px]" style={{ color: theme.textSecondary }}>
            Purse: {tournament.purse}
          </p>
        )}
      </div>
    </Link>
  );
});
