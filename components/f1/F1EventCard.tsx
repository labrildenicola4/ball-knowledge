'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { F1Event } from '@/lib/types/f1';

interface F1EventCardProps {
  event: F1Event;
}

export const F1EventCard = memo(function F1EventCard({ event }: F1EventCardProps) {
  const { theme, darkMode } = useTheme();
  const isLive = event.status === 'in_progress';
  const isFinal = event.status === 'final';

  // Find next upcoming or live session
  const activeSession = event.sessions.find(s => s.status === 'in_progress') ||
    event.sessions.find(s => s.status === 'scheduled');

  return (
    <Link href={`/f1/event/${event.id}`}>
      <div className="card-press cursor-pointer p-4 md:p-5 transition-theme glass-match-card">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded px-2 py-0.5 text-[10px] font-medium uppercase"
              style={{ backgroundColor: '#E10600', color: '#fff' }}>
              F1
            </span>
            <span className="text-[11px] font-medium" style={{ color: theme.textSecondary }}>
              {event.date}
            </span>
          </div>
          <span className={`font-mono rounded-lg px-3 py-1 text-[12px] ${isLive ? 'glass-badge-live' : 'glass-badge'}`}
            style={{ color: isLive ? '#fff' : theme.textSecondary }}>
            {isLive ? '● LIVE' : isFinal ? 'Complete' : event.startTime}
          </span>
        </div>

        {/* Event Name */}
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: theme.text }}>
          {event.name}
        </h3>

        {/* Circuit Info */}
        {(event.circuit || event.country) && (
          <p className="text-[12px] mb-3" style={{ color: theme.textSecondary }}>
            {[event.circuit, event.city, event.country].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Session Indicators */}
        <div className="flex gap-2 flex-wrap">
          {event.sessions.map(session => (
            <span key={session.id} className="text-[10px] px-2 py-1 rounded"
              style={{
                backgroundColor: session.status === 'in_progress' ? theme.red :
                  session.status === 'final' ? (darkMode ? 'rgba(120, 160, 100, 0.15)' : theme.bgTertiary) :
                  (darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary),
                color: session.status === 'in_progress' ? '#fff' :
                  session.status === 'final' ? theme.green : theme.textSecondary,
                fontWeight: session.status === 'in_progress' ? 600 : 400,
              }}>
              {session.shortName}
            </span>
          ))}
        </div>

        {/* Active session info */}
        {activeSession && (
          <p className="mt-2 text-[11px]" style={{ color: theme.textSecondary }}>
            {activeSession.status === 'in_progress' ? `${activeSession.name} in progress` :
              `Next: ${activeSession.name} · ${activeSession.startTime}`}
          </p>
        )}
      </div>
    </Link>
  );
});
