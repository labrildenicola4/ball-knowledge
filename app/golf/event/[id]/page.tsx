'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSafeBack } from '@/lib/use-safe-back';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Calendar, Sun, Moon, Trophy } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { GolfTournament } from '@/lib/types/golf';
import { PullToRefresh } from '@/components/PullToRefresh';
import { SafeImage } from '@/components/SafeImage';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

// Helper to construct ESPN golf headshot URL from player ID
const getGolfHeadshot = (id: string) =>
  `https://a.espncdn.com/i/headshots/golf/players/full/${id}.png`;

// Tour branding
const TOUR_META: Record<string, { name: string; shortName: string; color: string }> = {
  pga: { name: 'PGA Tour', shortName: 'PGA', color: '#003F2D' },
  eur: { name: 'DP World Tour', shortName: 'DPWT', color: '#1a3c6e' },
  lpga: { name: 'LPGA Tour', shortName: 'LPGA', color: '#00205B' },
  liv: { name: 'LIV Golf', shortName: 'LIV', color: '#000000' },
};

export default function GolfEventPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const goBack = useSafeBack('/golf');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const eventId = params.id as string;
  const tour = searchParams.get('tour') || 'pga';
  const meta = TOUR_META[tour] || TOUR_META.pga;

  const { data, error, isLoading, mutate } = useSWR<{ event: GolfTournament }>(
    eventId ? `/api/golf/events/${eventId}?tour=${tour}` : null,
    fetcher,
    { refreshInterval: (data) => data?.event.status === 'in_progress' ? 30000 : 0 }
  );

  const tournament = data?.event;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" style={{ color: theme.accent }} />
        <p className="mt-4 text-[12px]" style={{ color: theme.textSecondary }}>Loading tournament...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-[14px]" style={{ color: theme.red }}>Tournament not found</p>
        <button onClick={goBack} className="mt-4 rounded-lg px-4 py-2 text-[12px] glass-pill">Go back</button>
      </div>
    );
  }

  const getScoreColor = (score: string) => {
    if (score.startsWith('-')) return theme.red;
    if (score === 'E') return theme.text;
    if (score.startsWith('+')) return theme.blue;
    return theme.text;
  };

  // Determine how many rounds to show
  const maxRounds = Math.max(...tournament.leaderboard.map(p => p.rounds.length), 0);

  return (
    <div className="flex min-h-screen flex-col transition-theme">
      <header className="safe-top flex items-center gap-3 px-4 py-3 glass-header">
        <button onClick={goBack} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <div
            className="flex h-6 w-auto px-1.5 items-center justify-center rounded"
            style={{ backgroundColor: meta.color }}
          >
            <span className="text-[9px] font-bold text-white">{meta.shortName}</span>
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: theme.textSecondary }}>{tournament.shortName}</p>
          </div>
          {tournament.isMajor && (
            <Trophy size={14} style={{ color: '#D4AF37' }} />
          )}
        </div>
        <button onClick={toggleDarkMode} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Tournament Info */}
      <section className="px-4 py-4 glass-section">
        <h1 className="text-xl font-bold mb-2" style={{ color: theme.text }}>{tournament.name}</h1>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: theme.textSecondary }} />
            <span className="text-[12px]" style={{ color: theme.textSecondary }}>
              {tournament.date}{tournament.currentRound ? ` · Round ${tournament.currentRound}` : ''}
            </span>
          </div>
          {tournament.venue && (
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: theme.textSecondary }} />
              <span className="text-[12px]" style={{ color: theme.textSecondary }}>
                {tournament.venue}{tournament.city ? `, ${tournament.city}` : ''}
              </span>
            </div>
          )}
        </div>
        {tournament.purse && (
          <p className="mt-1 text-[11px]" style={{ color: theme.textSecondary }}>Purse: {tournament.purse}</p>
        )}
      </section>

      <main className="flex-1 overflow-y-auto pb-24 px-3 md:px-4 py-4">
        <PullToRefresh onRefresh={async () => { await mutate(); }}>
          {/* Leaderboard */}
          <div className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
            <div className="px-4 py-3" style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}>
              <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Leaderboard
              </h2>
            </div>

            {/* Column Headers */}
            <div className="overflow-x-auto">
              <div className="min-w-[530px]">
                <div className="grid items-center px-3 py-2 text-[9px] font-semibold uppercase tracking-wider"
                  style={{
                    gridTemplateColumns: `32px 28px 1fr 45px 40px 35px ${Array(maxRounds).fill('35px').join(' ')}`,
                    backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary,
                    color: theme.textSecondary,
                  }}>
                  <span>Pos</span>
                  <span></span>
                  <span>Player</span>
                  <span className="text-center">Score</span>
                  <span className="text-center">Today</span>
                  <span className="text-center">Thru</span>
                  {Array.from({ length: maxRounds }).map((_, i) => (
                    <span key={i} className="text-center">R{i + 1}</span>
                  ))}
                </div>

                {/* Player Rows */}
                {tournament.leaderboard.map((player, idx) => (
                  <Link key={player.id} href={`/player/golf/${player.id}`} className="contents">
                  <div
                    className="grid items-center px-3 py-2.5 text-[11px]"
                    style={{
                      gridTemplateColumns: `32px 28px 1fr 45px 40px 35px ${Array(maxRounds).fill('35px').join(' ')}`,
                      borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                      opacity: player.status === 'cut' ? 0.5 : 1,
                    }}>
                    <span className="font-mono font-bold text-[12px]"
                      style={{ color: idx < 3 ? theme.accent : theme.text }}>
                      {player.position}
                    </span>
                    <div
                      className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.1)' : theme.bgTertiary }}
                    >
                      <SafeImage
                        src={getGolfHeadshot(player.id)}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {player.countryFlag && (
                        <SafeImage src={player.countryFlag} alt="" className="h-3 w-4 object-contain flex-shrink-0" />
                      )}
                      <span className="font-medium truncate" style={{ color: theme.text }}>
                        {player.name}
                      </span>
                    </div>
                    <span className="text-center font-mono font-semibold text-[12px]"
                      style={{ color: getScoreColor(player.score) }}>
                      {player.score}
                    </span>
                    <span className="text-center font-mono" style={{ color: player.today ? getScoreColor(player.today) : theme.textSecondary }}>
                      {player.today || '-'}
                    </span>
                    <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
                      {player.thru || '-'}
                    </span>
                    {Array.from({ length: maxRounds }).map((_, i) => (
                      <span key={i} className="text-center font-mono" style={{ color: theme.textSecondary }}>
                        {player.rounds[i] ?? '-'}
                      </span>
                    ))}
                  </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
