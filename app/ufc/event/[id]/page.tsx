'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Calendar, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useSafeBack } from '@/lib/use-safe-back';
import { BottomNav } from '@/components/BottomNav';
import { UFCFightCard } from '@/components/ufc/UFCFightCard';
import { UFCEvent } from '@/lib/types/ufc';
import { PullToRefresh } from '@/components/PullToRefresh';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

export default function UFCEventPage() {
  const params = useParams();
  const goBack = useSafeBack('/ufc');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const eventId = params.id as string;

  const { data, error, isLoading, mutate } = useSWR<{ event: UFCEvent }>(
    eventId ? `/api/ufc/events/${eventId}` : null,
    fetcher,
    { refreshInterval: (data) => data?.event.status === 'in_progress' ? 15000 : 0 }
  );

  const event = data?.event;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" style={{ color: theme.accent }} />
        <p className="mt-4 text-[12px]" style={{ color: theme.textSecondary }}>Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-[14px]" style={{ color: theme.red }}>Event not found</p>
        <button onClick={goBack} className="mt-4 rounded-lg px-4 py-2 text-[12px] glass-pill">Go back</button>
      </div>
    );
  }

  // Group fights by card segment
  const mainCard = event.fights.filter(f => f.cardSegment === 'Main Card' || !f.cardSegment);
  const prelims = event.fights.filter(f => f.cardSegment === 'Prelims');
  const earlyPrelims = event.fights.filter(f => f.cardSegment === 'Early Prelims');

  const sections = [
    { title: 'Main Card', fights: mainCard },
    { title: 'Prelims', fights: prelims },
    { title: 'Early Prelims', fights: earlyPrelims },
  ].filter(s => s.fights.length > 0);

  return (
    <div className="flex min-h-screen flex-col transition-theme">
      <header className="safe-top flex items-center gap-3 px-4 py-3 glass-header">
        <button onClick={goBack} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>UFC</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>{event.shortName}</p>
        </div>
        <button onClick={toggleDarkMode} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Event Info */}
      <section className="px-4 py-4 glass-section">
        <h1 className="text-xl font-bold mb-2" style={{ color: theme.text }}>{event.name}</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: theme.textSecondary }} />
            <span className="text-[12px]" style={{ color: theme.textSecondary }}>{event.date}</span>
          </div>
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: theme.textSecondary }} />
              <span className="text-[12px]" style={{ color: theme.textSecondary }}>{event.venue}{event.city ? `, ${event.city}` : ''}</span>
            </div>
          )}
        </div>
      </section>

      <main className="flex-1 overflow-y-auto pb-24 px-3 md:px-4 py-4">
        <PullToRefresh onRefresh={async () => { await mutate(); }}>
          <div className="flex flex-col gap-4">
            {sections.map(section => (
              <section key={section.title} className="rounded-xl overflow-hidden glass-section">
                <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` }}>
                  <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                    {section.title}
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-3.5 p-3.5">
                  {[...section.fights].reverse().map(fight => (
                    <UFCFightCard key={fight.id} fight={fight} eventId={event.id} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
