'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ChevronLeft, ChevronDown, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { BasketballStandings, BasketballRankings } from '@/components/basketball/BasketballStandings';
import { BasketballStanding, BasketballRanking } from '@/lib/types/basketball';
import { POWER_CONFERENCES, MID_MAJOR_CONFERENCES, ConferenceConfig } from '@/lib/constants/basketball-conferences';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BasketballStandingsPage() {
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const [selectedConference, setSelectedConference] = useState<string>('');
  const [showConferenceDropdown, setShowConferenceDropdown] = useState(false);

  const { data, isLoading } = useSWR<{
    standings: { conference: string; standings: BasketballStanding[] }[];
    rankings: BasketballRanking[];
  }>(
    selectedConference
      ? `/api/basketball/standings?conference=${selectedConference}`
      : '/api/basketball/standings',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  const allConferences: ConferenceConfig[] = [...POWER_CONFERENCES, ...MID_MAJOR_CONFERENCES];

  const currentConference = selectedConference
    ? allConferences.find(c => c.id === selectedConference)
    : null;

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.text }}>Standings</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>NCAA Basketball</p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Conference Selector */}
      <div className="px-4 py-4" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
        <div className="relative">
          <button
            onClick={() => setShowConferenceDropdown(!showConferenceDropdown)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left ${darkMode ? 'glass-pill' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <span className="text-sm font-medium" style={{ color: theme.text }}>
              {currentConference?.name || 'All Conferences'}
            </span>
            <ChevronDown
              size={18}
              style={{
                color: theme.textSecondary,
                transform: showConferenceDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {showConferenceDropdown && (
            <div
              className={`absolute z-20 mt-2 w-full rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? { zIndex: 50 } : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, zIndex: 50 }}
            >
              <button
                onClick={() => {
                  setSelectedConference('');
                  setShowConferenceDropdown(false);
                }}
                className="w-full px-4 py-3 text-left text-sm hover:opacity-80"
                style={{
                  color: !selectedConference ? theme.accent : theme.text,
                  backgroundColor: !selectedConference ? (darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary) : 'transparent',
                }}
              >
                All Conferences
              </button>

              <div className="px-4 py-2 text-[9px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Power Conferences
              </div>
              {POWER_CONFERENCES.map(conf => (
                <button
                  key={conf.id}
                  onClick={() => {
                    setSelectedConference(conf.id);
                    setShowConferenceDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:opacity-80"
                  style={{
                    color: selectedConference === conf.id ? theme.accent : theme.text,
                    backgroundColor: selectedConference === conf.id ? (darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary) : 'transparent',
                  }}
                >
                  {conf.name}
                </button>
              ))}

              <div className="px-4 py-2 text-[9px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                Mid-Major Conferences
              </div>
              {MID_MAJOR_CONFERENCES.map(conf => (
                <button
                  key={conf.id}
                  onClick={() => {
                    setSelectedConference(conf.id);
                    setShowConferenceDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:opacity-80"
                  style={{
                    color: selectedConference === conf.id ? theme.accent : theme.text,
                    backgroundColor: selectedConference === conf.id ? (darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary) : 'transparent',
                  }}
                >
                  {conf.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
              Loading standings...
            </p>
          </div>
        ) : (
          <>
            {/* AP Top 25 */}
            {!selectedConference && data?.rankings && data.rankings.length > 0 && (
              <BasketballRankings rankings={data.rankings} />
            )}

            {/* Conference Standings */}
            {data?.standings?.map(({ conference, standings }) => (
              <BasketballStandings
                key={conference}
                standings={standings}
                conferenceName={conference}
              />
            ))}

            {(!data?.standings || data.standings.length === 0) && (
              <div
                className={`rounded-xl p-6 text-center ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                  No standings available
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
