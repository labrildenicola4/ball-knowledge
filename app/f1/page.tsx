'use client';

import { useState, useRef, useEffect } from 'react';
import { useSafeBack } from '@/lib/use-safe-back';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronLeft, Sun, Moon, Calendar, Users, Building2, Heart } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { F1EventCard } from '@/components/f1/F1EventCard';
import { F1Event, F1CalendarEntry, F1StandingsResponse } from '@/lib/types/f1';
import { PullToRefresh } from '@/components/PullToRefresh';
import { SectionSkeleton } from '@/components/Skeleton';
import { useFavorites } from '@/lib/use-favorites';
import { SafeImage } from '@/components/SafeImage';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type Tab = 'calendar' | 'drivers' | 'constructors';

function formatCalendarDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function groupByMonth(entries: F1CalendarEntry[]): { month: string; races: F1CalendarEntry[] }[] {
  const groups: Record<string, F1CalendarEntry[]> = {};
  for (const entry of entries) {
    try {
      const month = new Date(entry.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[month]) groups[month] = [];
      groups[month].push(entry);
    } catch {
      const fallback = 'Unknown';
      if (!groups[fallback]) groups[fallback] = [];
      groups[fallback].push(entry);
    }
  }
  return Object.entries(groups).map(([month, races]) => ({ month, races }));
}

export default function F1Page() {
  const goBack = useSafeBack('/all');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const { toggleFavorite, isFavorite, isLoggedIn } = useFavorites();
  const currentRaceRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, mutate } = useSWR<{ events: F1Event[]; calendar: F1CalendarEntry[] }>(
    '/api/f1/events',
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: standingsData, isLoading: standingsLoading } = useSWR<F1StandingsResponse>(
    activeTab === 'drivers' || activeTab === 'constructors' ? '/api/f1/standings' : null,
    fetcher
  );

  const events = data?.events || [];
  const calendar = data?.calendar || [];
  const currentEvent = events[0] || null;
  const driverStandings = standingsData?.driverStandings || [];
  const constructorStandings = standingsData?.constructorStandings || [];

  // Auto-scroll to current/next race on mount
  useEffect(() => {
    if (activeTab === 'calendar' && calendar.length > 0 && currentRaceRef.current) {
      setTimeout(() => {
        currentRaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [activeTab, calendar.length]);

  // Find the first non-complete race for scroll target
  const nextRaceId = calendar.find(e => e.status !== 'complete')?.id;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'calendar', label: 'Calendar', icon: <Calendar size={14} /> },
    { key: 'drivers', label: 'Drivers', icon: <Users size={14} /> },
    { key: 'constructors', label: 'Constructors', icon: <Building2 size={14} /> },
  ];

  return (
    <div className="flex min-h-screen flex-col transition-theme">
      <header className="safe-top flex items-center gap-3 px-4 py-3 glass-header">
        <button onClick={goBack} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold" style={{ color: theme.text }}>Formula 1</h1>
        </div>
        <button onClick={toggleDarkMode} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
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
        <PullToRefresh onRefresh={async () => { await mutate(); }}>
          {/* ---- CALENDAR TAB ---- */}
          {activeTab === 'calendar' && (
            isLoading ? (
              <SectionSkeleton cards={3} />
            ) : calendar.length === 0 && events.length === 0 ? (
              <div className="rounded-xl py-8 text-center glass-card">
                <p className="text-sm" style={{ color: theme.textSecondary }}>No race data available</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Featured Current Race Card */}
                {currentEvent && (
                  <F1EventCard event={currentEvent} />
                )}

                {/* Full Season Calendar */}
                {calendar.length > 0 && (
                  <section className="rounded-xl overflow-hidden glass-card">
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                        {calendar[0]?.date ? new Date(calendar[0].date).getFullYear() : ''} Season
                      </h3>
                      <p className="text-[11px] mt-0.5" style={{ color: theme.textSecondary }}>
                        {calendar.filter(r => r.status === 'complete').length} of {calendar.length} races complete
                      </p>
                    </div>

                    {groupByMonth(calendar).map(group => (
                      <div key={group.month}>
                        <div className="px-4 py-2"
                          style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}>
                          <h4 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                            {group.month}
                          </h4>
                        </div>
                        {group.races.map((entry) => {
                          const isNextRace = entry.id === nextRaceId;
                          return (
                            <Link key={entry.id} href={`/f1/event/${entry.id}`}>
                              <div
                                ref={isNextRace ? currentRaceRef : undefined}
                                className="flex items-center gap-3 px-4 py-3 card-press"
                                style={{
                                  borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                                  backgroundColor: entry.status === 'in_progress'
                                    ? (darkMode ? 'rgba(225, 6, 0, 0.08)' : 'rgba(225, 6, 0, 0.04)')
                                    : isNextRace
                                    ? (darkMode ? 'rgba(120, 160, 100, 0.05)' : 'rgba(0, 0, 0, 0.02)')
                                    : undefined,
                                }}
                              >
                                <span className="w-6 text-center text-[11px] font-bold tabular-nums"
                                  style={{ color: entry.status === 'complete' ? theme.textSecondary : theme.text }}>
                                  {entry.round}
                                </span>
                                {entry.countryFlag && (
                                  <SafeImage src={entry.countryFlag} alt="" className="h-4 w-6 object-contain flex-shrink-0" loading="lazy" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-medium truncate"
                                    style={{ color: entry.status === 'complete' ? theme.textSecondary : theme.text }}>
                                    {entry.shortName || entry.name}
                                  </p>
                                  <p className="text-[10px] truncate" style={{ color: theme.textSecondary }}>
                                    {[entry.circuit, entry.city].filter(Boolean).join(' · ') || formatCalendarDate(entry.date)}
                                  </p>
                                </div>
                                {entry.status === 'in_progress' ? (
                                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold glass-badge-live animate-pulse flex-shrink-0">
                                    <span className="h-1 w-1 rounded-full bg-white" /> LIVE
                                  </span>
                                ) : entry.status === 'complete' ? (
                                  <span className="text-[11px] font-medium flex-shrink-0" style={{ color: theme.green }}>✓</span>
                                ) : (
                                  <span className="text-[10px] font-mono tabular-nums flex-shrink-0" style={{ color: theme.textSecondary }}>
                                    {formatCalendarDate(entry.date)}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </section>
                )}
              </div>
            )
          )}

          {/* ---- DRIVERS TAB ---- */}
          {activeTab === 'drivers' && (
            <div className="flex flex-col gap-3">
              {standingsLoading ? (
                <SectionSkeleton cards={6} />
              ) : driverStandings.length === 0 ? (
                <div className="rounded-xl py-8 text-center glass-card">
                  <p className="text-sm" style={{ color: theme.textSecondary }}>No standings available</p>
                </div>
              ) : (
                <section className="rounded-xl overflow-hidden glass-card">
                  <div className="px-4 py-3">
                    <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                      Driver Championship
                    </h3>
                  </div>

                  {/* Column Headers */}
                  <div
                    className="grid items-center px-4 py-2 text-[9px] font-semibold uppercase tracking-wider"
                    style={{
                      gridTemplateColumns: isLoggedIn ? '30px 1fr 90px 44px 30px 32px 32px 28px' : '30px 1fr 90px 44px 30px 32px 32px',
                      color: theme.textSecondary,
                      borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                    }}
                  >
                    <span className="text-center">Pos</span>
                    <span>Driver</span>
                    <span className="truncate">Team</span>
                    <span className="text-right">PTS</span>
                    <span className="text-center">W</span>
                    <span className="text-center">P5</span>
                    <span className="text-center">P10</span>
                    {isLoggedIn && <span></span>}
                  </div>

                  {/* Driver Rows */}
                  {driverStandings.map((d, idx) => (
                    <Link key={d.driver.id || idx} href={`/player/f1/${d.driver.id}`} className="contents">
                    <div
                      className="grid items-center px-4 py-2.5"
                      style={{
                        gridTemplateColumns: isLoggedIn ? '30px 1fr 90px 44px 30px 32px 32px 28px' : '30px 1fr 90px 44px 30px 32px 32px',
                        borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                      }}
                    >
                      <span
                        className="text-center text-[12px] font-bold tabular-nums"
                        style={{ color: idx === 0 ? '#D4AF37' : theme.textSecondary }}
                      >
                        {d.position}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <SafeImage
                          src={`https://a.espncdn.com/i/headshots/rpm/players/full/${d.driver.id}.png`}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                          style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : theme.bgTertiary }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          loading="lazy"
                        />
                        {d.driver.flag && (
                          <SafeImage
                            src={d.driver.flag}
                            alt=""
                            className="h-3.5 w-5 object-contain flex-shrink-0"
                            loading="lazy"
                          />
                        )}
                        <span className="text-[12px] font-medium truncate" style={{ color: theme.text }}>
                          {d.driver.name}
                        </span>
                      </div>
                      <span className="text-[11px] truncate" style={{ color: theme.textSecondary }}>
                        {d.team || ''}
                      </span>
                      <div className="text-right">
                        <span
                          className="text-[12px] font-bold tabular-nums block"
                          style={{ color: idx < 3 ? '#D4AF37' : theme.text }}
                        >
                          {d.points}
                        </span>
                        {d.behind > 0 && (
                          <span className="text-[9px] tabular-nums block" style={{ color: theme.textSecondary }}>
                            -{d.behind} pts
                          </span>
                        )}
                      </div>
                      <span className="text-center text-[11px] tabular-nums" style={{ color: theme.textSecondary }}>
                        {d.wins}
                      </span>
                      <span className="text-center text-[11px] tabular-nums" style={{ color: theme.textSecondary }}>
                        {d.top5}
                      </span>
                      <span className="text-center text-[11px] tabular-nums" style={{ color: theme.textSecondary }}>
                        {d.top10}
                      </span>
                      {isLoggedIn && d.driver.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite('f1_driver', Number(d.driver.id)); }}
                          className="tap-highlight flex h-7 w-7 items-center justify-center rounded-full glass-pill"
                        >
                          <Heart
                            size={12}
                            color={theme.gold}
                            fill={isFavorite('f1_driver', Number(d.driver.id)) ? theme.gold : 'none'}
                          />
                        </button>
                      )}
                    </div>
                    </Link>
                  ))}
                </section>
              )}
            </div>
          )}

          {/* ---- CONSTRUCTORS TAB ---- */}
          {activeTab === 'constructors' && (
            <div className="flex flex-col gap-3">
              {standingsLoading ? (
                <SectionSkeleton cards={6} />
              ) : constructorStandings.length === 0 ? (
                <div className="rounded-xl py-8 text-center glass-card">
                  <p className="text-sm" style={{ color: theme.textSecondary }}>No standings available</p>
                </div>
              ) : (
                <section className="rounded-xl overflow-hidden glass-card">
                  <div className="px-4 py-3">
                    <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                      Constructor Championship
                    </h3>
                  </div>

                  {/* Column Headers */}
                  <div
                    className="grid items-center px-4 py-2 text-[9px] font-semibold uppercase tracking-wider"
                    style={{
                      gridTemplateColumns: isLoggedIn ? '30px 1fr 58px 30px 28px' : '30px 1fr 58px 30px',
                      color: theme.textSecondary,
                      borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                    }}
                  >
                    <span className="text-center">Pos</span>
                    <span>Team</span>
                    <span className="text-right">PTS</span>
                    <span className="text-center">W</span>
                    {isLoggedIn && <span></span>}
                  </div>

                  {/* Constructor Rows */}
                  {constructorStandings.map((c, idx) => (
                    <div
                      key={c.team.id || idx}
                      className="grid items-center px-4 py-2.5"
                      style={{
                        gridTemplateColumns: isLoggedIn ? '30px 1fr 58px 30px 28px' : '30px 1fr 58px 30px',
                        borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                      }}
                    >
                      <span
                        className="text-center text-[12px] font-bold tabular-nums"
                        style={{ color: idx === 0 ? '#D4AF37' : theme.textSecondary }}
                      >
                        {c.position}
                      </span>
                      <span className="text-[12px] font-medium truncate" style={{ color: theme.text }}>
                        {c.team.name}
                      </span>
                      <div className="text-right">
                        <span
                          className="text-[12px] font-bold tabular-nums block"
                          style={{ color: idx < 3 ? '#D4AF37' : theme.text }}
                        >
                          {c.points}
                        </span>
                        {c.behind > 0 && (
                          <span className="text-[9px] tabular-nums block" style={{ color: theme.textSecondary }}>
                            -{c.behind} pts
                          </span>
                        )}
                      </div>
                      <span className="text-center text-[11px] tabular-nums" style={{ color: theme.textSecondary }}>
                        {c.wins}
                      </span>
                      {isLoggedIn && c.team.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite('f1_constructor', Number(c.team.id)); }}
                          className="tap-highlight flex h-7 w-7 items-center justify-center rounded-full glass-pill"
                        >
                          <Heart
                            size={12}
                            color={theme.gold}
                            fill={isFavorite('f1_constructor', Number(c.team.id)) ? theme.gold : 'none'}
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}
        </PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
