'use client';

import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { TournamentBracket } from '@/components/TournamentBracket';
import { useTheme } from '@/lib/theme';

interface BracketMatch {
  id: number;
  home: string;
  away: string;
  homeId: number;
  awayId: number;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  date: string;
  time: string;
  venue: string;
}

interface BracketData {
  competition: string;
  competitionName: string;
  stages: string[];
  stageNames: Record<string, string>;
  bracket: Record<string, BracketMatch[]>;
  isHypothetical?: boolean;
}

const competitions = [
  { id: 'championsleague', name: 'Champions League', icon: '🏆' },
  { id: 'copalibertadores', name: 'Copa Libertadores', icon: '🏆' },
];

export default function BracketPage() {
  const { theme, darkMode } = useTheme();
  const [selectedCompetition, setSelectedCompetition] = useState('championsleague');
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBracket() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bracket?competition=${selectedCompetition}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch bracket');
        }

        setBracketData(data);
      } catch (err) {
        console.error('Error fetching bracket:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bracket');
      } finally {
        setLoading(false);
      }
    }

    fetchBracket();
  }, [selectedCompetition]);

  // Count total knockout matches
  const totalMatches = bracketData
    ? Object.values(bracketData.bracket).reduce((sum, matches) => sum + matches.length, 0)
    : 0;

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}
    >
      <Header />

      {/* Competition Selector */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={20} style={{ color: theme.gold }} />
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            Knockout Bracket
          </h1>
        </div>

        <div className="flex gap-2">
          {competitions.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setSelectedCompetition(comp.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${darkMode ? (selectedCompetition === comp.id ? 'glass-pill-active' : 'glass-pill') : ''}`}
              style={{
                backgroundColor: darkMode ? (selectedCompetition === comp.id ? theme.accent : undefined) : (selectedCompetition === comp.id ? theme.accent : theme.bgSecondary),
                color: selectedCompetition === comp.id ? '#fff' : theme.textSecondary,
                border: darkMode ? undefined : `1px solid ${selectedCompetition === comp.id ? theme.accent : theme.border}`,
              }}
            >
              <span>{comp.icon}</span>
              {comp.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bracket Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-3 text-sm" style={{ color: theme.textSecondary }}>
              Loading bracket...
            </p>
          </div>
        ) : error ? (
          <div
            className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
          >
            <p className="text-sm" style={{ color: theme.red }}>
              {error}
            </p>
            <button
              onClick={() => setSelectedCompetition(selectedCompetition)}
              className="mt-3 rounded-lg px-4 py-2 text-sm"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              Try Again
            </button>
          </div>
        ) : bracketData && totalMatches > 0 ? (
          <>
            {/* Hypothetical Banner */}
            {bracketData.isHypothetical && (
              <div
                className="rounded-lg px-4 py-3 mb-4"
                style={{ backgroundColor: theme.gold + '20', border: `1px solid ${theme.gold}` }}
              >
                <p className="text-sm font-medium" style={{ color: theme.gold }}>
                  Hypothetical Bracket
                </p>
                <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                  Based on current league standings. Actual knockout draw will differ.
                </p>
              </div>
            )}

            {/* Competition Header */}
            <div className="mb-4">
              <h2 className="text-lg font-medium" style={{ color: theme.text }}>
                {bracketData.competitionName}
              </h2>
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                {totalMatches} knockout {totalMatches === 1 ? 'match' : 'matches'}
                {bracketData.isHypothetical && ' (projected)'}
              </p>
            </div>

            {/* Bracket Visualization */}
            <TournamentBracket
              bracket={bracketData.bracket}
              stages={bracketData.stages}
              stageNames={bracketData.stageNames}
            />
          </>
        ) : (
          <div
            className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
          >
            <Trophy size={32} className="mx-auto mb-3" style={{ color: theme.textSecondary }} />
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              No knockout matches available yet
            </p>
            <p className="mt-2 text-xs" style={{ color: theme.textSecondary }}>
              Knockout rounds will appear here once the group stage is complete
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
