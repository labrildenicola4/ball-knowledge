'use client';

import { useTheme } from '@/lib/theme';

/* ── Base shimmer block ── */
function Shimmer({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  const { darkMode } = useTheme();
  return (
    <div
      className={`skeleton-shimmer rounded ${className}`}
      style={{
        backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        ...style,
      }}
    />
  );
}

/* ── Game card skeleton (matches MatchCard / NBAGameCard layout) ── */
export function GameCardSkeleton() {
  const { theme, darkMode } = useTheme();
  return (
    <div
      className={`rounded-2xl p-4 ${darkMode ? 'glass-match-card' : ''}`}
      style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      {/* Top row: league badge + time */}
      <div className="flex items-center justify-between mb-4">
        <Shimmer className="rounded-full" style={{ width: 80, height: 18 }} />
        <Shimmer className="rounded-full" style={{ width: 50, height: 18 }} />
      </div>
      {/* Teams + score */}
      <div className="flex items-center justify-between">
        {/* Away team */}
        <div className="flex items-center gap-3 flex-1">
          <Shimmer className="rounded-full" style={{ width: 36, height: 36 }} />
          <Shimmer style={{ width: 90, height: 14 }} />
        </div>
        {/* Score */}
        <div className="flex items-center gap-2 mx-4">
          <Shimmer style={{ width: 24, height: 24, borderRadius: 4 }} />
          <Shimmer style={{ width: 8, height: 8, borderRadius: 99 }} />
          <Shimmer style={{ width: 24, height: 24, borderRadius: 4 }} />
        </div>
        {/* Home team */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <Shimmer style={{ width: 90, height: 14 }} />
          <Shimmer className="rounded-full" style={{ width: 36, height: 36 }} />
        </div>
      </div>
      {/* Bottom row: status */}
      <div className="flex justify-center mt-4">
        <Shimmer className="rounded-full" style={{ width: 100, height: 14 }} />
      </div>
    </div>
  );
}

/* ── Section skeleton (header + N game cards) ── */
export function SectionSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <Shimmer className="rounded-full" style={{ width: 120, height: 16 }} />
      </div>
      {/* Cards */}
      {Array.from({ length: cards }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Standings skeleton ── */
export function StandingsSkeleton({ rows = 8 }: { rows?: number }) {
  const { theme, darkMode } = useTheme();
  return (
    <div
      className={`rounded-2xl overflow-hidden ${darkMode ? 'glass-section' : ''}`}
      style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : theme.border}` }}>
        <Shimmer style={{ width: 30, height: 14 }} />
        <Shimmer style={{ width: 140, height: 14 }} />
        <div className="ml-auto flex gap-4">
          <Shimmer style={{ width: 20, height: 14 }} />
          <Shimmer style={{ width: 20, height: 14 }} />
          <Shimmer style={{ width: 20, height: 14 }} />
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}` }}>
          <Shimmer style={{ width: 16, height: 14 }} />
          <Shimmer className="rounded-full" style={{ width: 24, height: 24 }} />
          <Shimmer style={{ width: 100 + Math.random() * 40, height: 14 }} />
          <div className="ml-auto flex gap-4">
            <Shimmer style={{ width: 20, height: 14 }} />
            <Shimmer style={{ width: 20, height: 14 }} />
            <Shimmer style={{ width: 20, height: 14 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Full page loading skeleton ── */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <SectionSkeleton cards={2} />
      <SectionSkeleton cards={3} />
    </div>
  );
}
