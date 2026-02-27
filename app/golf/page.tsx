'use client';

import Link from 'next/link';
import { useSafeBack } from '@/lib/use-safe-back';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/lib/theme';
import { GolfTournament, GolfRankingsResponse } from '@/lib/types/golf';
import { SafeImage } from '@/components/SafeImage';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Helper to construct ESPN golf headshot URL from player ID
const getGolfHeadshot = (id: string) =>
  `https://a.espncdn.com/i/headshots/golf/players/full/${id}.png`;

// Golf tours with branding
const GOLF_TOURS = [
  {
    slug: 'pga',
    name: 'PGA Tour',
    shortName: 'PGA',
    description: 'United States',
    color: '#003F2D',
    logo: 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-golf.png',
  },
  {
    slug: 'eur',
    name: 'DP World Tour',
    shortName: 'DPWT',
    description: 'Europe & International',
    color: '#1a3c6e',
    logo: 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-golf.png',
  },
  {
    slug: 'lpga',
    name: 'LPGA Tour',
    shortName: 'LPGA',
    description: 'Women\'s Professional Golf',
    color: '#00205B',
    logo: 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-golf.png',
  },
  {
    slug: 'liv',
    name: 'LIV Golf',
    shortName: 'LIV',
    description: 'Team-Based Golf',
    color: '#000000',
    logo: 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-golf.png',
  },
];

// The 4 Men's Majors
const MENS_MAJORS = [
  { name: 'The Masters', month: 'April', venue: 'Augusta National', color: '#006B3C' },
  { name: 'PGA Championship', month: 'May', venue: 'Various', color: '#003F2D' },
  { name: 'U.S. Open', month: 'June', venue: 'Various', color: '#1C3F6E' },
  { name: 'The Open Championship', month: 'July', venue: 'Various (UK)', color: '#1B2A4A' },
];

function TourCard({ tour }: { tour: typeof GOLF_TOURS[0] }) {
  const { theme, darkMode } = useTheme();

  return (
    <Link
      href={`/golf/tour/${tour.slug}`}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:opacity-80 glass-card"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: tour.color }}
      >
        <span className="text-[11px] font-bold text-white">{tour.shortName}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block truncate" style={{ color: theme.text }}>
          {tour.name}
        </span>
        <span className="text-[11px]" style={{ color: theme.textSecondary }}>
          {tour.description}
        </span>
      </div>
      <ChevronRight size={16} style={{ color: theme.textSecondary }} />
    </Link>
  );
}

function MajorCard({ major }: { major: typeof MENS_MAJORS[0] }) {
  const { theme, darkMode } = useTheme();

  return (
    <div
      className="rounded-xl p-3 glass-card"
      style={{ borderLeft: `3px solid ${major.color}` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={12} style={{ color: major.color }} />
        <span className="text-[13px] font-semibold" style={{ color: theme.text }}>
          {major.name}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px]" style={{ color: theme.textSecondary }}>
        <span>{major.month}</span>
        <span>·</span>
        <span>{major.venue}</span>
      </div>
    </div>
  );
}

export default function GolfHubPage() {
  const { theme, darkMode } = useTheme();
  const goBack = useSafeBack('/all');

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Fetch current PGA events (with leaderboards for live tournaments)
  const { data: eventsData } = useSWR<{ events: GolfTournament[] }>(
    '/api/golf/events?tour=pga',
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: false }
  );

  // Fetch PGA rankings (FedEx Cup standings with headshots)
  const { data: rankingsData } = useSWR<GolfRankingsResponse>(
    '/api/golf/rankings?tour=pga',
    fetcher,
    { revalidateOnFocus: false }
  );

  const currentEvents = eventsData?.events || [];
  const liveEvent = currentEvents.find(e => e.status === 'in_progress');
  const topPlayers = rankingsData?.players?.slice(0, 10) || [];

  const getScoreColor = (score: string) => {
    if (score.startsWith('-')) return theme.red;
    if (score === 'E') return theme.text;
    if (score.startsWith('+')) return theme.blue;
    return theme.text;
  };

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: 'transparent' }}
    >
      <Header />

      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="tap-highlight flex items-center justify-center rounded-full p-2.5 -ml-1.5 hover:opacity-70 transition-opacity glass-card"
          >
            <ChevronLeft size={20} style={{ color: theme.text }} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
              Golf
            </h1>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              {dateStr}
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {/* Live / Current Tournament with Leaderboard */}
        {liveEvent && liveEvent.leaderboard.length > 0 && (
          <section className="mb-6">
            <h2
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: theme.red }}
            >
              Live Now
            </h2>
            <Link href={`/golf/event/${liveEvent.id}?tour=${liveEvent.tour || 'pga'}`}>
              <div className="card-press cursor-pointer glass-match-card p-4 transition-theme">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-medium uppercase"
                      style={{ backgroundColor: '#003F2D', color: '#fff' }}
                    >
                      PGA
                    </span>
                    {liveEvent.currentRound && (
                      <span className="text-[11px] font-medium" style={{ color: theme.textSecondary }}>
                        Round {liveEvent.currentRound}
                      </span>
                    )}
                    {liveEvent.isMajor && <Trophy size={12} style={{ color: '#D4AF37' }} />}
                  </div>
                  <span className="font-mono rounded-lg px-3 py-1 text-[12px] glass-badge-live" style={{ color: '#fff' }}>
                    ● LIVE
                  </span>
                </div>

                <h3 className="text-[16px] font-semibold mb-1" style={{ color: theme.text }}>
                  {liveEvent.name}
                </h3>
                {(liveEvent.venue || liveEvent.course) && (
                  <p className="text-[12px] mb-3" style={{ color: theme.textSecondary }}>
                    {[liveEvent.course, liveEvent.city].filter(Boolean).join(' · ')}
                  </p>
                )}

                {/* Leaderboard Preview with Headshots */}
                <div
                  className="rounded-lg overflow-hidden mt-2"
                  style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                >
                  <div
                    className="grid items-center px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider"
                    style={{
                      gridTemplateColumns: '26px 28px 1fr 50px 40px 35px',
                      color: theme.textSecondary,
                      backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.5)' : theme.bgTertiary,
                    }}
                  >
                    <span>Pos</span>
                    <span></span>
                    <span>Player</span>
                    <span className="text-center">Score</span>
                    <span className="text-center">Today</span>
                    <span className="text-center">Thru</span>
                  </div>

                  {liveEvent.leaderboard.slice(0, 5).map((player, idx) => (
                    <Link key={player.id} href={`/player/golf/${player.id}`} className="contents">
                    <div
                      className="grid items-center px-3 py-2 text-[11px]"
                      style={{
                        gridTemplateColumns: '26px 28px 1fr 50px 40px 35px',
                        borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                      }}
                    >
                      <span
                        className="font-mono font-bold text-[12px]"
                        style={{ color: idx === 0 ? '#D4AF37' : theme.text }}
                      >
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
                          <SafeImage src={player.countryFlag} alt="" className="h-3.5 w-5 object-contain flex-shrink-0" />
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

                {liveEvent.purse && (
                  <p className="mt-2 text-[10px]" style={{ color: theme.textSecondary }}>
                    Purse: {liveEvent.purse}
                  </p>
                )}
              </div>
            </Link>
          </section>
        )}

        {/* Top PGA Players */}
        {topPlayers.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: theme.textSecondary }}
              >
                Top PGA Players
              </h2>
              <Link
                href="/golf/tour/pga"
                className="text-[11px] font-medium"
                style={{ color: theme.accent }}
              >
                Full Rankings →
              </Link>
            </div>
            <div className="rounded-xl overflow-hidden glass-card">
              {topPlayers.map((p, idx) => (
                <Link key={p.player.id || idx} href={`/player/golf/${p.player.id}`} className="contents">
                <div
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderTop: idx === 0 ? 'none' : `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                  }}
                >
                  <span
                    className="w-5 text-center text-[12px] font-bold tabular-nums flex-shrink-0"
                    style={{ color: idx === 0 ? '#D4AF37' : theme.textSecondary }}
                  >
                    {p.rank}
                  </span>
                  <div
                    className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.1)' : theme.bgTertiary }}
                  >
                    {p.player.headshot ? (
                      <SafeImage
                        src={p.player.headshot}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <SafeImage
                        src={getGolfHeadshot(p.player.id)}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: theme.text }}>
                      {p.player.name}
                    </p>
                    <p className="text-[10px]" style={{ color: theme.textSecondary }}>
                      {p.points} pts · {p.wins} wins
                    </p>
                  </div>
                  <span
                    className="text-[11px] font-mono tabular-nums flex-shrink-0"
                    style={{ color: theme.textSecondary }}
                  >
                    {p.earnings}
                  </span>
                </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tours */}
        <section className="mb-6">
          <h2
            className="text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.textSecondary }}
          >
            Tours
          </h2>
          <div className="flex flex-col gap-2">
            {GOLF_TOURS.map(tour => (
              <TourCard key={tour.slug} tour={tour} />
            ))}
          </div>
        </section>

        {/* Majors */}
        <section className="mb-6">
          <h2
            className="text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.textSecondary }}
          >
            Major Championships
          </h2>
          <div className="flex flex-col gap-2">
            {MENS_MAJORS.map(major => (
              <MajorCard key={major.name} major={major} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
