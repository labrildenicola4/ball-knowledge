'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { memo, useState } from 'react';
import useSWR from 'swr';
import { ChevronLeft, Calendar, Trophy, BarChart3, Sun, Moon, Heart } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { PullToRefresh } from '@/components/PullToRefresh';
import { SectionSkeleton } from '@/components/Skeleton';
import { GolfTournament, GolfTourSlug, GolfLeadersResponse, GolfRankingsResponse } from '@/lib/types/golf';
import { useFavorites } from '@/lib/use-favorites';
import { SafeImage } from '@/components/SafeImage';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Helper to construct ESPN golf headshot URL from player ID
const getGolfHeadshot = (id: string) =>
  `https://a.espncdn.com/i/headshots/golf/players/full/${id}.png`;

// Tour metadata
const TOUR_META: Record<string, { name: string; shortName: string; color: string; hasStats: boolean }> = {
  pga: { name: 'PGA Tour', shortName: 'PGA', color: '#003F2D', hasStats: true },
  eur: { name: 'DP World Tour', shortName: 'DPWT', color: '#1a3c6e', hasStats: false },
  lpga: { name: 'LPGA Tour', shortName: 'LPGA', color: '#00205B', hasStats: true },
  liv: { name: 'LIV Golf', shortName: 'LIV', color: '#000000', hasStats: false },
};

type Tab = 'schedule' | 'rankings' | 'stats';

// Which stat categories to show
const STAT_CATEGORIES = ['yardsPerDrive', 'driveAccuracyPct', 'greensInRegPct', 'strokesPerHole', 'birdiesPerRound', 'scoringAverage'];

// ---------------------------------------------------------------------------
// Live Leaderboard Preview – top 5 for the current event
// ---------------------------------------------------------------------------
const LeaderboardPreview = memo(function LeaderboardPreview({
  tournament,
  tourColor,
}: {
  tournament: GolfTournament;
  tourColor: string;
}) {
  const { theme, darkMode } = useTheme();
  const top5 = tournament.leaderboard.slice(0, 5);

  const getScoreColor = (score: string) => {
    if (score.startsWith('-')) return theme.red;
    if (score === 'E') return theme.text;
    if (score.startsWith('+')) return theme.blue;
    return theme.text;
  };

  return (
    <Link href={`/golf/event/${tournament.id}?tour=${tournament.tour || 'pga'}`}>
      <div className="card-press cursor-pointer glass-match-card p-4 md:p-5 transition-theme">
        {/* Header with live badge */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-[10px] font-medium uppercase"
              style={{ backgroundColor: tourColor, color: '#fff' }}
            >
              {tournament.tour?.toUpperCase() || 'PGA'}
            </span>
            {tournament.currentRound && (
              <span className="text-[11px] font-medium" style={{ color: theme.textSecondary }}>
                Round {tournament.currentRound}
              </span>
            )}
            {tournament.isMajor && (
              <Trophy size={12} style={{ color: '#D4AF37' }} />
            )}
          </div>
          <span className="font-mono rounded-lg px-3 py-1 text-[12px] glass-badge-live" style={{ color: '#fff' }}>
            ● LIVE
          </span>
        </div>

        {/* Tournament Name */}
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: theme.text }}>
          {tournament.name}
        </h3>
        {(tournament.venue || tournament.course) && (
          <p className="text-[12px] mb-3" style={{ color: theme.textSecondary }}>
            {[tournament.course, tournament.city].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Top 5 Leaderboard Preview */}
        {top5.length > 0 && (
          <div
            className="rounded-lg overflow-hidden mt-2"
            style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
          >
            {/* Column headers */}
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

            {top5.map((player, idx) => (
              <div
                key={player.id}
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
                    <SafeImage
                      src={player.countryFlag}
                      alt=""
                      className="h-3.5 w-5 object-contain flex-shrink-0"
                    />
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
            ))}
          </div>
        )}

        {tournament.purse && (
          <p className="mt-2 text-[10px]" style={{ color: theme.textSecondary }}>
            Purse: {tournament.purse}
          </p>
        )}
      </div>
    </Link>
  );
});

// ---------------------------------------------------------------------------
// Schedule Event Row
// ---------------------------------------------------------------------------
const ScheduleEventRow = memo(function ScheduleEventRow({
  tournament,
  tourColor,
  tourSlug,
}: {
  tournament: GolfTournament;
  tourColor: string;
  tourSlug: string;
}) {
  const { theme, darkMode } = useTheme();
  const isLive = tournament.status === 'in_progress';
  const isFinal = tournament.status === 'final';
  const leader = tournament.leaderboard[0];

  const dateDisplay = (() => {
    try {
      const d = new Date(tournament.date);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'America/New_York',
      });
    } catch {
      return tournament.date;
    }
  })();

  return (
    <Link href={`/golf/event/${tournament.id}?tour=${tourSlug}`}>
      <div
        className="flex items-center gap-3 rounded-xl p-3 transition-colors card-press cursor-pointer glass-card"
        style={{ opacity: isFinal ? 0.7 : 1 }}
      >
        {/* Date */}
        <div className="flex flex-col items-center w-12 flex-shrink-0">
          <span className="text-[11px] font-medium" style={{ color: theme.textSecondary }}>
            {dateDisplay}
          </span>
        </div>

        {/* Name + info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium truncate" style={{ color: theme.text }}>
              {tournament.name}
            </span>
            {tournament.isMajor && (
              <Trophy size={11} style={{ color: '#D4AF37' }} className="flex-shrink-0" />
            )}
          </div>
          {tournament.venue && (
            <span className="text-[11px] block truncate" style={{ color: theme.textSecondary }}>
              {[tournament.venue, tournament.city].filter(Boolean).join(', ')}
            </span>
          )}
          {leader && isFinal && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className="h-4 w-4 rounded-full overflow-hidden flex-shrink-0"
                style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.1)' : theme.bgTertiary }}
              >
                <SafeImage
                  src={getGolfHeadshot(leader.id)}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <span className="text-[11px]" style={{ color: theme.accent }}>
                {leader.name} ({leader.score})
              </span>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          {isLive ? (
            <span className="font-mono rounded-lg px-2.5 py-1 text-[10px] glass-badge-live" style={{ color: '#fff' }}>
              ● LIVE
            </span>
          ) : isFinal ? (
            <span className="text-[10px] font-medium rounded-lg px-2.5 py-1 glass-badge" style={{ color: theme.textSecondary }}>
              Final
            </span>
          ) : (
            <span className="text-[10px] font-medium rounded-lg px-2.5 py-1 glass-badge" style={{ color: theme.textSecondary }}>
              Upcoming
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

// ---------------------------------------------------------------------------
// Main Tour Page
// ---------------------------------------------------------------------------
export default function GolfTourPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const slug = params.slug as string;
  const meta = TOUR_META[slug] || TOUR_META.pga;

  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const { toggleFavorite, isFavorite, isLoggedIn } = useFavorites();

  // Current/upcoming events (with leaderboard for live)
  const { data: eventsData, isLoading: eventsLoading, mutate: mutateEvents } = useSWR<{ events: GolfTournament[] }>(
    `/api/golf/events?tour=${slug}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  // Full season schedule
  const { data: scheduleData, isLoading: scheduleLoading } = useSWR<{ events: GolfTournament[] }>(
    activeTab === 'schedule' ? `/api/golf/schedule?tour=${slug}` : null,
    fetcher,
    { refreshInterval: 300000 }
  );

  // Rankings (FedEx Cup Standings – single ranked list)
  const { data: rankingsData, isLoading: rankingsLoading } = useSWR<GolfRankingsResponse>(
    activeTab === 'rankings' && meta.hasStats ? `/api/golf/rankings?tour=${slug}` : null,
    fetcher
  );

  // Stats / Leaders (top 10 per category with headshots & flags – v3 leaders)
  const { data: leadersData, isLoading: leadersLoading } = useSWR<GolfLeadersResponse>(
    activeTab === 'stats' && meta.hasStats ? `/api/golf/leaders?tour=${slug}` : null,
    fetcher
  );

  const currentEvents = eventsData?.events || [];
  const scheduleEvents = scheduleData?.events || [];

  // Find live events
  const liveEvents = currentEvents.filter(e => e.status === 'in_progress');
  const upcomingEvents = scheduleEvents.filter(e => e.status === 'scheduled');
  const completedEvents = scheduleEvents.filter(e => e.status === 'final').reverse(); // most recent first

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'schedule', label: 'Schedule', icon: <Calendar size={14} /> },
    ...(meta.hasStats ? [
      { key: 'rankings' as Tab, label: 'Rankings', icon: <Trophy size={14} /> },
      { key: 'stats' as Tab, label: 'Stats', icon: <BarChart3 size={14} /> },
    ] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col transition-theme">
      <header className="safe-top flex items-center gap-3 px-4 py-3 glass-header">
        <button
          onClick={() => router.push('/golf')}
          className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ backgroundColor: meta.color }}
          >
            <span className="text-[9px] font-bold text-white">{meta.shortName}</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: theme.text }}>{meta.name}</h1>
          </div>
        </div>
        <button
          onClick={toggleDarkMode}
          className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Tab Bar */}
      <div className="flex gap-2 px-4 py-3">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tap-highlight flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
              activeTab === tab.key ? 'glass-pill-active' : 'glass-pill'
            }`}
            style={{
              color: activeTab === tab.key ? (darkMode ? '#fff' : theme.text) : theme.textSecondary,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-24 px-3 md:px-4 py-2">
        <PullToRefresh onRefresh={async () => { await mutateEvents(); }}>
          {/* ---- SCHEDULE TAB ---- */}
          {activeTab === 'schedule' && (
            <div className="flex flex-col gap-4">
              {/* Live Events with Leaderboard Preview */}
              {liveEvents.length > 0 && (
                <section>
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1"
                    style={{ color: theme.red }}
                  >
                    Live Now
                  </h2>
                  <div className="flex flex-col gap-3">
                    {liveEvents.map(event => (
                      <LeaderboardPreview
                        key={event.id}
                        tournament={event}
                        tourColor={meta.color}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Upcoming */}
              {(scheduleLoading && upcomingEvents.length === 0) ? (
                <SectionSkeleton cards={4} />
              ) : upcomingEvents.length > 0 ? (
                <section>
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Upcoming
                  </h2>
                  <div className="flex flex-col gap-2">
                    {upcomingEvents.map(event => (
                      <ScheduleEventRow
                        key={event.id}
                        tournament={event}
                        tourColor={meta.color}
                        tourSlug={slug}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Completed */}
              {completedEvents.length > 0 && (
                <section>
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Completed
                  </h2>
                  <div className="flex flex-col gap-2">
                    {completedEvents.slice(0, 10).map(event => (
                      <ScheduleEventRow
                        key={event.id}
                        tournament={event}
                        tourColor={meta.color}
                        tourSlug={slug}
                      />
                    ))}
                  </div>
                </section>
              )}

              {!scheduleLoading && upcomingEvents.length === 0 && completedEvents.length === 0 && liveEvents.length === 0 && (
                <div className="rounded-xl py-8 text-center glass-card">
                  <p className="text-sm" style={{ color: theme.textSecondary }}>No events found</p>
                </div>
              )}
            </div>
          )}

          {/* ---- RANKINGS TAB ---- */}
          {activeTab === 'rankings' && meta.hasStats && (
            <div className="flex flex-col gap-3">
              {rankingsLoading ? (
                <SectionSkeleton cards={6} />
              ) : !rankingsData?.players?.length ? (
                <div className="rounded-xl py-8 text-center glass-card">
                  <p className="text-sm" style={{ color: theme.textSecondary }}>No rankings available</p>
                </div>
              ) : (
                <section className="rounded-xl overflow-hidden glass-card">
                  {/* Title */}
                  <div className="px-4 py-3">
                    <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                      {rankingsData.title}
                    </h3>
                  </div>

                  {/* Column Headers */}
                  <div
                    className="grid items-center px-4 py-2 text-[9px] font-semibold uppercase tracking-wider"
                    style={{
                      gridTemplateColumns: isLoggedIn ? '28px 32px 1fr 58px 36px 30px 36px 62px 28px' : '28px 32px 1fr 58px 36px 30px 36px 62px',
                      color: theme.textSecondary,
                      borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                    }}
                  >
                    <span className="text-center">#</span>
                    <span></span>
                    <span>Player</span>
                    <span className="text-right">Points</span>
                    <span className="text-center">Evts</span>
                    <span className="text-center">W</span>
                    <span className="text-center">T10</span>
                    <span className="text-right">Earnings</span>
                    {isLoggedIn && <span></span>}
                  </div>

                  {/* Player Rows */}
                  {rankingsData.players.map((p, idx) => (
                    <div
                      key={p.player.id || idx}
                      className="grid items-center px-4 py-2.5"
                      style={{
                        gridTemplateColumns: isLoggedIn ? '28px 32px 1fr 58px 36px 30px 36px 62px 28px' : '28px 32px 1fr 58px 36px 30px 36px 62px',
                        borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                      }}
                    >
                      <span
                        className="text-center text-[12px] font-bold tabular-nums"
                        style={{ color: idx === 0 ? '#D4AF37' : theme.textSecondary }}
                      >
                        {p.rank}
                      </span>
                      {p.player.headshot ? (
                        <SafeImage
                          src={p.player.headshot}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="h-7 w-7 rounded-full"
                          style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.1)' : theme.bgTertiary }}
                        />
                      )}
                      <p className="text-[12px] font-medium truncate pl-1" style={{ color: theme.text }}>
                        {p.player.name}
                      </p>
                      <span
                        className="text-right text-[12px] font-bold tabular-nums"
                        style={{ color: idx < 3 ? '#D4AF37' : theme.text }}
                      >
                        {p.points}
                      </span>
                      <span className="text-center text-[11px] tabular-nums" style={{ color: theme.textSecondary }}>
                        {p.events}
                      </span>
                      <span className="text-center text-[11px] tabular-nums" style={{ color: theme.textSecondary }}>
                        {p.wins}
                      </span>
                      <span className="text-center text-[11px] tabular-nums" style={{ color: theme.textSecondary }}>
                        {p.topTens}
                      </span>
                      <span className="text-right text-[11px] tabular-nums" style={{ color: theme.textSecondary }}>
                        {p.earnings}
                      </span>
                      {isLoggedIn && p.player.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite('golfer', Number(p.player.id)); }}
                          className="tap-highlight flex h-7 w-7 items-center justify-center rounded-full glass-pill"
                        >
                          <Heart
                            size={12}
                            color={theme.gold}
                            fill={isFavorite('golfer', Number(p.player.id)) ? theme.gold : 'none'}
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}

          {/* ---- STATS TAB ---- */}
          {activeTab === 'stats' && meta.hasStats && (
            <div className="flex flex-col gap-3">
              {leadersLoading ? (
                <SectionSkeleton cards={4} />
              ) : !leadersData?.categories?.length ? (
                <div className="rounded-xl py-8 text-center glass-card">
                  <p className="text-sm" style={{ color: theme.textSecondary }}>No stats available</p>
                </div>
              ) : (
                leadersData.categories
                  .filter(cat => STAT_CATEGORIES.includes(cat.name))
                  .sort((a, b) => STAT_CATEGORIES.indexOf(a.name) - STAT_CATEGORIES.indexOf(b.name))
                  .map(cat => (
                    <section key={cat.name} className="rounded-xl overflow-hidden glass-card">
                      <div className="px-4 py-3">
                        <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                          {cat.displayName}
                        </h3>
                      </div>
                      {cat.leaders.map((leader, idx) => (
                        <div
                          key={leader.player.id || idx}
                          className="flex items-center gap-3 px-4 py-2.5"
                          style={{ borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
                        >
                          <span
                            className="w-5 text-center text-sm font-bold"
                            style={{ color: idx === 0 ? '#D4AF37' : theme.textSecondary }}
                          >
                            {leader.rank}
                          </span>
                          <div className="relative">
                            {leader.player.headshot ? (
                              <SafeImage
                                src={leader.player.headshot}
                                alt=""
                                className="h-9 w-9 rounded-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full" style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.1)' : theme.bgTertiary }} />
                            )}
                            {leader.player.flag && (
                              <SafeImage
                                src={leader.player.flag}
                                alt={leader.player.country || ''}
                                className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full object-contain bg-white p-0.5"
                                loading="lazy"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate" style={{ color: theme.text }}>
                              {leader.player.name}
                            </p>
                            {leader.player.country && (
                              <p className="text-[10px]" style={{ color: theme.textSecondary }}>
                                {leader.player.country}
                              </p>
                            )}
                          </div>
                          <span
                            className="text-[14px] font-bold tabular-nums"
                            style={{ color: idx === 0 ? '#D4AF37' : theme.text }}
                          >
                            {leader.displayValue}
                          </span>
                        </div>
                      ))}
                    </section>
                  ))
              )}
            </div>
          )}
        </PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
