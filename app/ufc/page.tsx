'use client';

import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronLeft, ChevronDown, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useSafeBack } from '@/lib/use-safe-back';
import { BottomNav } from '@/components/BottomNav';
import { UFCFightCard } from '@/components/ufc/UFCFightCard';
import { UFCEvent, UFCCalendarEvent } from '@/lib/types/ufc';
import { PullToRefresh } from '@/components/PullToRefresh';
import { SectionSkeleton } from '@/components/Skeleton';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function formatCalendarDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function groupByMonth(entries: UFCCalendarEvent[]): { month: string; events: UFCCalendarEvent[] }[] {
  const groups: Record<string, UFCCalendarEvent[]> = {};
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
  return Object.entries(groups).map(([month, events]) => ({ month, events }));
}

export default function UFCPage() {
  const goBack = useSafeBack('/all');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const nextEventRef = useRef<HTMLDivElement>(null);
  const [featuredExpanded, setFeaturedExpanded] = useState(true);

  const { data, isLoading, mutate } = useSWR<{ events: UFCEvent[]; calendar: UFCCalendarEvent[] }>(
    '/api/ufc/events',
    fetcher,
    { refreshInterval: 30000 }
  );

  const events = data?.events || [];
  const calendar = data?.calendar || [];

  // Find first non-complete event as scroll target
  const nextEventId = calendar.find(e => e.status !== 'complete')?.id;

  // Auto-scroll to current/next event on mount
  useEffect(() => {
    if (calendar.length > 0 && nextEventRef.current) {
      setTimeout(() => {
        nextEventRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [calendar.length]);

  // Check if a calendar event has a matching loaded event (with fight cards)
  const getLoadedEvent = (calId: string) => events.find(e => e.id === calId);

  // Derive featured event: prefer in_progress, fallback to first event
  const featuredEvent = events.find(e => e.status === 'in_progress') || events[0] || null;

  return (
    <div className="flex min-h-screen flex-col transition-theme">
      <header className="safe-top flex items-center gap-3 px-4 py-3 glass-header">
        <button onClick={goBack} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold" style={{ color: theme.text }}>UFC</h1>
          <p className="text-[11px]" style={{ color: theme.textSecondary }}>Fight Cards</p>
        </div>
        <button onClick={toggleDarkMode} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-3 md:px-4 py-4">
        <PullToRefresh onRefresh={async () => { await mutate(); }}>
          {isLoading ? (
            <SectionSkeleton cards={4} />
          ) : calendar.length === 0 && events.length === 0 ? (
            <div className="rounded-xl py-8 text-center glass-card">
              <p className="text-sm" style={{ color: theme.textSecondary }}>No events available</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Featured Event */}
              {featuredEvent && featuredEvent.fights.length > 0 && (
                <section className="rounded-xl overflow-hidden glass-card">
                  <button
                    onClick={() => setFeaturedExpanded(prev => !prev)}
                    className="w-full flex items-center justify-between px-4 py-2.5"
                    style={{ borderBottom: featuredExpanded ? `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` : undefined }}
                  >
                    <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                      Up Next
                    </h2>
                    <ChevronDown
                      size={16}
                      style={{
                        color: theme.textSecondary,
                        transform: featuredExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>
                  {featuredExpanded && (
                    <>
                      <div className="px-4 py-3">
                        <Link href={`/ufc/event/${featuredEvent.id}`}>
                          <p className="text-[14px] font-medium" style={{ color: theme.text }}>{featuredEvent.name}</p>
                        </Link>
                        <p className="text-[11px] mt-0.5" style={{ color: theme.textSecondary }}>
                          {formatCalendarDate(featuredEvent.date)}{featuredEvent.venue ? ` · ${featuredEvent.venue}` : ''}{featuredEvent.city ? `, ${featuredEvent.city}` : ''}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-3.5 p-3.5 pt-0">
                        {[...featuredEvent.fights].reverse().map(fight => (
                          <UFCFightCard key={fight.id} fight={fight} eventId={featuredEvent.id} />
                        ))}
                      </div>
                    </>
                  )}
                </section>
              )}

              {/* Full Season Calendar */}
              {calendar.length > 0 && (
                <section className="rounded-xl overflow-hidden glass-card">
                  <div className="px-4 py-3">
                    <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                      {calendar[0]?.date ? new Date(calendar[0].date).getFullYear() : ''} Season
                    </h3>
                    <p className="text-[11px] mt-0.5" style={{ color: theme.textSecondary }}>
                      {calendar.filter(e => e.status === 'complete').length} of {calendar.length} events complete
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
                      {group.events.map((entry) => {
                        const isNext = entry.id === nextEventId;
                        const loadedEvent = getLoadedEvent(entry.id);
                        const broadcast = loadedEvent?.fights[0]?.broadcast;
                        return (
                          <Link key={entry.id} href={`/ufc/event/${entry.id}`}>
                            <div
                              ref={isNext ? nextEventRef : undefined}
                              className="flex items-center gap-3 px-4 py-3 card-press"
                              style={{
                                borderTop: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                                backgroundColor: entry.status === 'in_progress'
                                  ? (darkMode ? 'rgba(220, 38, 38, 0.08)' : 'rgba(220, 38, 38, 0.04)')
                                  : isNext
                                  ? (darkMode ? 'rgba(120, 160, 100, 0.05)' : 'rgba(0, 0, 0, 0.02)')
                                  : undefined,
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium truncate"
                                  style={{ color: entry.status === 'complete' ? theme.textSecondary : theme.text }}>
                                  {entry.shortName || entry.name}
                                </p>
                                <p className="text-[10px] truncate" style={{ color: theme.textSecondary }}>
                                  {[entry.venue, entry.city].filter(Boolean).join(' · ') || formatCalendarDate(entry.date)}
                                </p>
                              </div>
                              {broadcast && entry.status !== 'complete' && (
                                <span className="rounded px-1.5 py-0.5 text-[9px] font-medium glass-pill flex-shrink-0"
                                  style={{ color: theme.textSecondary }}>
                                  {broadcast}
                                </span>
                              )}
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
          )}
        </PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
