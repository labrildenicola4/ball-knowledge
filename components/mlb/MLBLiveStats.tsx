'use client';

import { useTheme } from '@/lib/theme';
import { MLBTeam, MLBTeamStats } from '@/lib/types/mlb';
import { SafeImage } from '@/components/SafeImage';

interface MLBLiveStatsProps {
  homeTeam: MLBTeam;
  awayTeam: MLBTeam;
  homeStats: MLBTeamStats | null;
  awayStats: MLBTeamStats | null;
  lineScore?: {
    home: (number | null)[];
    away: (number | null)[];
  };
  isLoading?: boolean;
}

interface StatBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  format?: (v: number) => string;
}

function StatBar({ label, homeValue, awayValue, format = (v) => String(v) }: StatBarProps) {
  const { theme, darkMode } = useTheme();
  const total = homeValue + awayValue || 1;
  const homePercent = (homeValue / total) * 100;
  const awayPercent = (awayValue / total) * 100;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold" style={{ color: theme.text }}>
          {format(awayValue)}
        </span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
          {label}
        </span>
        <span className="text-sm font-semibold" style={{ color: theme.text }}>
          {format(homeValue)}
        </span>
      </div>
      <div className="flex h-1.5 gap-1 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.4)' : theme.bgTertiary }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${awayPercent}%`,
            backgroundColor: theme.accent,
          }}
        />
        <div
          className="h-full transition-all"
          style={{
            width: `${homePercent}%`,
            backgroundColor: theme.green,
          }}
        />
      </div>
    </div>
  );
}

export function MLBLiveStats({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
  lineScore,
  isLoading,
}: MLBLiveStatsProps) {
  const { theme, darkMode } = useTheme();

  if (isLoading) {
    return (
      <div
        className={`rounded-xl p-8 text-center ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <div
          className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
        <p className="mt-3 text-[12px]" style={{ color: theme.textSecondary }}>
          Loading stats...
        </p>
      </div>
    );
  }

  // If no stats available yet, show line score if available
  if (!homeStats || !awayStats) {
    return (
      <div
        className={`rounded-xl p-6 ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        {lineScore && (lineScore.home.length > 0 || lineScore.away.length > 0) ? (
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-wider mb-4" style={{ color: theme.textSecondary }}>
              Line Score
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
                    <th className="text-left py-2 pr-4" style={{ color: theme.textSecondary }}>Team</th>
                    {Array.from({ length: Math.max(lineScore.home.length, lineScore.away.length, 9) }).map((_, i) => (
                      <th key={i} className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>
                        {i + 1}
                      </th>
                    ))}
                    <th className="text-center px-2 py-2 font-bold" style={{ color: theme.text }}>R</th>
                    <th className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>H</th>
                    <th className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>E</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        {awayTeam.logo && (
                          <SafeImage src={awayTeam.logo} alt="" className="h-4 w-4 object-contain logo-glow" />
                        )}
                        <span style={{ color: theme.text }}>{awayTeam.abbreviation}</span>
                      </div>
                    </td>
                    {Array.from({ length: Math.max(lineScore.home.length, lineScore.away.length, 9) }).map((_, i) => (
                      <td key={i} className="text-center px-2 py-2" style={{ color: theme.text }}>
                        {lineScore.away[i] ?? '-'}
                      </td>
                    ))}
                    <td className="text-center px-2 py-2 font-bold" style={{ color: theme.text }}>
                      {awayTeam.score ?? 0}
                    </td>
                    <td className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>
                      {awayTeam.hits ?? 0}
                    </td>
                    <td className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>
                      {awayTeam.errors ?? 0}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        {homeTeam.logo && (
                          <SafeImage src={homeTeam.logo} alt="" className="h-4 w-4 object-contain logo-glow" />
                        )}
                        <span style={{ color: theme.text }}>{homeTeam.abbreviation}</span>
                      </div>
                    </td>
                    {Array.from({ length: Math.max(lineScore.home.length, lineScore.away.length, 9) }).map((_, i) => (
                      <td key={i} className="text-center px-2 py-2" style={{ color: theme.text }}>
                        {lineScore.home[i] ?? '-'}
                      </td>
                    ))}
                    <td className="text-center px-2 py-2 font-bold" style={{ color: theme.text }}>
                      {homeTeam.score ?? 0}
                    </td>
                    <td className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>
                      {homeTeam.hits ?? 0}
                    </td>
                    <td className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>
                      {homeTeam.errors ?? 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-center" style={{ color: theme.textSecondary }}>
            Stats will appear once the game starts
          </p>
        )}
      </div>
    );
  }

  const hasLineScore = lineScore && (lineScore.home.length > 0 || lineScore.away.length > 0);

  return (
    <div className="space-y-4">
      {/* Line Score - Always show prominently when available */}
      {hasLineScore && (
        <div
          className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
          style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          <h3 className="text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textSecondary }}>
            Line Score
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
                  <th className="text-left py-2 pr-4" style={{ color: theme.textSecondary }}>Team</th>
                  {Array.from({ length: Math.max(lineScore!.home.length, lineScore!.away.length, 9) }).map((_, i) => (
                    <th key={i} className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>
                      {i + 1}
                    </th>
                  ))}
                  <th className="text-center px-2 py-2 font-bold" style={{ color: theme.text }}>R</th>
                  <th className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>H</th>
                  <th className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>E</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      {awayTeam.logo && (
                        <SafeImage src={awayTeam.logo} alt="" className="h-4 w-4 object-contain logo-glow" />
                      )}
                      <span style={{ color: theme.text }}>{awayTeam.abbreviation}</span>
                    </div>
                  </td>
                  {Array.from({ length: Math.max(lineScore!.home.length, lineScore!.away.length, 9) }).map((_, i) => (
                    <td key={i} className="text-center px-2 py-2" style={{ color: theme.text }}>
                      {lineScore!.away[i] ?? '-'}
                    </td>
                  ))}
                  <td className="text-center px-2 py-2 font-bold" style={{ color: theme.text }}>
                    {awayTeam.score ?? 0}
                  </td>
                  <td className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>
                    {awayTeam.hits ?? 0}
                  </td>
                  <td className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>
                    {awayTeam.errors ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      {homeTeam.logo && (
                        <SafeImage src={homeTeam.logo} alt="" className="h-4 w-4 object-contain logo-glow" />
                      )}
                      <span style={{ color: theme.text }}>{homeTeam.abbreviation}</span>
                    </div>
                  </td>
                  {Array.from({ length: Math.max(lineScore!.home.length, lineScore!.away.length, 9) }).map((_, i) => (
                    <td key={i} className="text-center px-2 py-2" style={{ color: theme.text }}>
                      {lineScore!.home[i] ?? '-'}
                    </td>
                  ))}
                  <td className="text-center px-2 py-2 font-bold" style={{ color: theme.text }}>
                    {homeTeam.score ?? 0}
                  </td>
                  <td className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>
                    {homeTeam.hits ?? 0}
                  </td>
                  <td className="text-center px-2 py-2" style={{ color: theme.textSecondary }}>
                    {homeTeam.errors ?? 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Headers */}
      <div
        className={`flex items-center justify-between rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-3">
          {awayTeam.logo && (
            <SafeImage src={awayTeam.logo} alt={awayTeam.name} className="h-8 w-8 object-contain logo-glow" />
          )}
          <div>
            <p className="text-sm font-medium" style={{ color: theme.text }}>
              {awayTeam.shortDisplayName}
            </p>
            <p className="text-[10px]" style={{ color: theme.textSecondary }}>Away</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: theme.text }}>
              {homeTeam.shortDisplayName}
            </p>
            <p className="text-[10px]" style={{ color: theme.textSecondary }}>Home</p>
          </div>
          {homeTeam.logo && (
            <SafeImage src={homeTeam.logo} alt={homeTeam.name} className="h-8 w-8 object-contain logo-glow" />
          )}
        </div>
      </div>

      {/* Stats Comparison */}
      <div
        className={`rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <h3 className="text-[12px] font-semibold uppercase tracking-wider mb-4" style={{ color: theme.textSecondary }}>
          Team Stats
        </h3>
        <div className="space-y-1">
          <StatBar label="Runs" homeValue={homeStats.runs} awayValue={awayStats.runs} />
          <StatBar label="Hits" homeValue={homeStats.hits} awayValue={awayStats.hits} />
          <StatBar label="Errors" homeValue={homeStats.errors} awayValue={awayStats.errors} />
          <StatBar label="LOB" homeValue={homeStats.leftOnBase} awayValue={awayStats.leftOnBase} />
          {homeStats.homeRuns !== undefined && awayStats.homeRuns !== undefined && (
            <StatBar label="Home Runs" homeValue={homeStats.homeRuns} awayValue={awayStats.homeRuns} />
          )}
        </div>
      </div>
    </div>
  );
}
