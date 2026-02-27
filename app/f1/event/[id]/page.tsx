'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSafeBack } from '@/lib/use-safe-back';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Calendar, Flag, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { F1Event, F1Session } from '@/lib/types/f1';
import { PullToRefresh } from '@/components/PullToRefresh';
import { TrackMap } from '@/components/f1/TrackMap';
import { SectionSkeleton } from '@/components/Skeleton';
import { SafeImage } from '@/components/SafeImage';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York',
    });
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    });
  } catch {
    return dateStr;
  }
}

const PODIUM_COLORS: Record<number, string> = {
  0: '#D4AF37', // Gold
  1: '#C0C0C0', // Silver
  2: '#CD7F32', // Bronze
};

export default function F1EventPage() {
  const params = useParams();
  const goBack = useSafeBack('/f1');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const eventId = params.id as string;

  const { data, error, isLoading, mutate } = useSWR<{ event: F1Event }>(
    eventId ? `/api/f1/events/${eventId}` : null,
    fetcher,
    { refreshInterval: (data) => data?.event.status === 'in_progress' ? 15000 : 30000 }
  );

  const event = data?.event;

  // Determine default active session tab
  const defaultSessionId = useMemo(() => {
    if (!event) return '';
    const live = event.sessions.find(s => s.status === 'in_progress');
    if (live) return live.id;
    const completed = [...event.sessions].reverse().find(s => s.status === 'final');
    if (completed) return completed.id;
    return event.sessions[0]?.id || '';
  }, [event]);

  const [activeSessionId, setActiveSessionId] = useState<string>('');

  // Use default if user hasn't selected yet
  const currentSessionId = activeSessionId || defaultSessionId;
  const activeSession = event?.sessions.find(s => s.id === currentSessionId);

  // Derived state
  const isLive = event?.sessions.some(s => s.status === 'in_progress') ?? false;
  const liveSession = event?.sessions.find(s => s.status === 'in_progress');
  const allComplete = event?.sessions.every(s => s.status === 'final') ?? false;

  const borderColor = darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
        <header className="safe-top flex items-center gap-3 px-4 py-3 glass-header">
          <button onClick={goBack} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
            style={{ border: `1px solid ${borderColor}` }}>
            <ChevronLeft size={18} style={{ color: theme.text }} />
          </button>
          <div className="flex-1">
            <p className="text-[15px] font-semibold" style={{ color: '#E10600' }}>Formula 1</p>
          </div>
        </header>
        <div className="flex-1 px-4 py-6">
          <SectionSkeleton cards={4} />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>Event not found</p>
        <button onClick={goBack} className="mt-4 rounded-lg px-4 py-2 text-[12px] glass-pill">Go back</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
      {/* Header */}
      <header className="safe-top flex items-center gap-3 px-4 py-3 glass-header">
        <button onClick={goBack} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${borderColor}` }}>
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: '#E10600' }}>Formula 1</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>{event.shortName}</p>
        </div>
        <button onClick={toggleDarkMode} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${borderColor}` }}>
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <PullToRefresh onRefresh={async () => { await mutate(); }}>
          <div className="flex flex-col gap-4 px-3 md:px-4 py-4">

            {/* ───── HERO SECTION ───── */}
            <section
              className={`rounded-xl px-4 py-6 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
            >
              <TrackMap circuitName={event.circuit} />

              <h1 className="text-xl font-bold mt-4 mb-1" style={{ color: theme.text }}>
                {event.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                {event.circuit && (
                  <div className="flex items-center gap-1.5">
                    <Flag size={12} style={{ color: theme.textSecondary }} />
                    <span className="text-[13px]" style={{ color: theme.textSecondary }}>{event.circuit}</span>
                  </div>
                )}
                {event.country && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} style={{ color: theme.textSecondary }} />
                    <span className="text-[13px]" style={{ color: theme.textSecondary }}>
                      {event.city ? `${event.city}, ` : ''}{event.country}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold glass-badge-live animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  LIVE
                </span>
              ) : allComplete ? (
                <span className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold glass-badge"
                  style={{ color: theme.green }}>
                  Complete
                </span>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <Calendar size={12} style={{ color: theme.textSecondary }} />
                  <span className="text-[12px]" style={{ color: theme.textSecondary }}>
                    {formatDate(event.date)} · {event.startTime}
                  </span>
                </div>
              )}
            </section>

            {event.sessions.length === 0 ? (
              <section
                className={`rounded-xl px-4 py-8 text-center ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <p className="text-[14px] font-medium mb-2" style={{ color: theme.text }}>
                  Session schedule not yet available
                </p>
                <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                  Practice, qualifying, and race times will appear closer to the event
                </p>
              </section>
            ) : (
              <>
                {/* ───── LIVE TOP 5 BANNER ───── */}
                {liveSession && liveSession.results && liveSession.results.length > 0 && (
                  <section
                    className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                    style={{
                      borderLeft: '4px solid #E10600',
                      ...(!darkMode ? { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderLeft: '4px solid #E10600' } : {}),
                    }}
                  >
                    <div className="flex items-center gap-2 px-4 py-3">
                      <span className="h-2 w-2 rounded-full bg-[#E10600] animate-pulse" />
                      <h3 className="text-[13px] font-semibold" style={{ color: theme.text }}>
                        {liveSession.name} — Live
                      </h3>
                    </div>
                    {liveSession.results.slice(0, 5).map((driver, idx) => (
                      <Link key={driver.id || idx} href={`/player/f1/${driver.id}`} className="contents">
                      <div
                        className="flex items-center gap-3 px-4 py-2"
                        style={{ borderTop: `1px solid ${borderColor}` }}
                      >
                        <span
                          className="w-6 text-center text-[13px] font-bold font-mono"
                          style={{ color: PODIUM_COLORS[idx] || theme.textSecondary }}
                        >
                          {driver.position ?? idx + 1}
                        </span>
                        <span className="flex-1 text-[12px] font-medium truncate" style={{ color: theme.text }}>
                          {driver.name}
                        </span>
                        <span className="text-[11px] font-mono" style={{ color: theme.textSecondary }}>
                          {driver.time || driver.status || ''}
                        </span>
                      </div>
                      </Link>
                    ))}
                  </section>
                )}

                {/* ───── SESSION TABS ───── */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                  {event.sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`tap-highlight flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-medium transition-colors flex-shrink-0 ${
                        currentSessionId === session.id ? 'glass-pill-active' : 'glass-pill'
                      }`}
                      style={{
                        color: currentSessionId === session.id
                          ? (darkMode ? '#fff' : theme.text)
                          : theme.textSecondary,
                      }}
                    >
                      {session.status === 'in_progress' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#E10600] animate-pulse flex-shrink-0" />
                      )}
                      {session.shortName}
                      {session.status === 'scheduled' && (
                        <span className="text-[10px] opacity-70 ml-0.5">{session.startTime}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ───── SELECTED SESSION CONTENT ───── */}
                {activeSession && (
                  <SessionContent
                    session={activeSession}
                    theme={theme}
                    darkMode={darkMode}
                    borderColor={borderColor}
                  />
                )}

                {/* ───── WEEKEND SCHEDULE ───── */}
                <section
                  className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                  style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                >
                  <div className="px-4 py-3" style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}>
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                      Weekend Schedule
                    </h2>
                  </div>
                  {event.sessions.map((session, idx) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{ borderTop: idx === 0 ? 'none' : `1px solid ${borderColor}` }}
                    >
                      <div>
                        <p className="text-[12px] font-medium" style={{ color: theme.text }}>{session.name}</p>
                        <p className="text-[10px]" style={{ color: theme.textSecondary }}>{formatShortDate(session.date)}</p>
                      </div>
                      {session.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold glass-badge-live animate-pulse">
                          <span className="h-1 w-1 rounded-full bg-white" />
                          LIVE
                        </span>
                      ) : session.status === 'final' ? (
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium glass-badge"
                          style={{ color: theme.green }}>
                          Complete
                        </span>
                      ) : (
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium glass-badge"
                          style={{ color: theme.textSecondary }}>
                          {session.startTime}
                        </span>
                      )}
                    </div>
                  ))}
                </section>
              </>
            )}

          </div>
        </PullToRefresh>
      </main>

      <BottomNav />
    </div>
  );
}

/* ───────────────────────────────────────────────
   Session Content Component
   ─────────────────────────────────────────────── */

function SessionContent({
  session,
  theme,
  darkMode,
  borderColor,
}: {
  session: F1Session;
  theme: any;
  darkMode: boolean;
  borderColor: string;
}) {
  const isLive = session.status === 'in_progress';
  const isFinal = session.status === 'final';
  const hasResults = session.results && session.results.length > 0;

  // Scheduled — no results yet
  if (session.status === 'scheduled') {
    return (
      <div
        className={`rounded-xl px-4 py-6 text-center ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <p className="text-[14px] font-semibold mb-1" style={{ color: theme.text }}>{session.name}</p>
        <p className="text-[12px] mb-3" style={{ color: theme.textSecondary }}>
          {formatShortDate(session.date)} · {session.startTime} ET
        </p>
        <p className="text-[11px]" style={{ color: theme.textSecondary }}>
          Session has not started yet
        </p>
      </div>
    );
  }

  // In progress or final with results
  if (!hasResults) {
    return (
      <div
        className={`rounded-xl px-4 py-6 text-center ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <p className="text-[12px]" style={{ color: theme.textSecondary }}>
          No results available yet
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
      style={{
        ...(isLive ? { borderLeft: '4px solid #E10600' } : {}),
        ...(!darkMode ? {
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          ...(isLive ? { borderLeft: '4px solid #E10600' } : {}),
        } : {}),
      }}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 px-4 py-3"
        style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}>
        {isLive && <span className="h-2 w-2 rounded-full bg-[#E10600] animate-pulse" />}
        <h3 className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
          {session.name} {isLive ? '— Live' : 'Results'}
        </h3>
      </div>

      {/* Column Headers */}
      <div
        className="grid items-center px-4 py-2 text-[9px] font-semibold uppercase tracking-wider"
        style={{
          gridTemplateColumns: '28px 1fr 80px 52px',
          color: theme.textSecondary,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <span className="text-center">Pos</span>
        <span>Driver</span>
        <span className="truncate">Team</span>
        <span className="text-right">Time</span>
      </div>

      {/* Driver Rows */}
      {session.results!.map((driver, idx) => {
        const posColor = isFinal
          ? (PODIUM_COLORS[idx] || theme.text)
          : (PODIUM_COLORS[idx] || theme.textSecondary);

        return (
          <Link key={driver.id || idx} href={`/player/f1/${driver.id}`} className="contents">
          <div
            className="grid items-center px-4 py-2.5"
            style={{
              gridTemplateColumns: '28px 1fr 80px 52px',
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <span
              className="text-center text-[12px] font-bold font-mono"
              style={{ color: posColor }}
            >
              {driver.position ?? idx + 1}
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              {driver.flag && (
                <SafeImage
                  src={driver.flag}
                  alt=""
                  className="h-3 w-4.5 object-contain flex-shrink-0"
                  loading="lazy"
                />
              )}
              <span className="text-[12px] font-medium truncate" style={{ color: theme.text }}>
                {driver.name}
              </span>
            </div>
            <span className="text-[11px] truncate" style={{ color: theme.textSecondary }}>
              {driver.team || ''}
            </span>
            <span className="text-right text-[10px] font-mono" style={{ color: theme.textSecondary }}>
              {driver.time || driver.status || ''}
            </span>
          </div>
          </Link>
        );
      })}
    </div>
  );
}
