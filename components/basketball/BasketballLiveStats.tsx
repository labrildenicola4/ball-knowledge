'use client';

import { useTheme } from '@/lib/theme';
import { BasketballTeamStats, BasketballTeam } from '@/lib/types/basketball';

interface BasketballLiveStatsProps {
  homeTeam: BasketballTeam;
  awayTeam: BasketballTeam;
  homeStats: BasketballTeamStats | null;
  awayStats: BasketballTeamStats | null;
  isLoading?: boolean;
}

interface StatRowProps {
  label: string;
  home: number | string;
  away: number | string;
  isPercentage?: boolean;
}

function StatRow({ label, home, away, isPercentage }: StatRowProps) {
  const { theme } = useTheme();

  const homeVal = typeof home === 'string' ? parseFloat(home) || 0 : home;
  const awayVal = typeof away === 'string' ? parseFloat(away) || 0 : away;

  const total = homeVal + awayVal;
  const maxBarWidth = 45;

  let homeBarWidth = 0;
  let awayBarWidth = 0;

  if (total > 0) {
    const homeRatio = homeVal / total;
    const awayRatio = awayVal / total;
    homeBarWidth = homeRatio * maxBarWidth * 2;
    awayBarWidth = awayRatio * maxBarWidth * 2;
  }

  const formatValue = (val: number | string) => {
    if (isPercentage) {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return `${(num * 100).toFixed(1)}%`;
    }
    return String(val);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[15px] font-medium w-12" style={{ color: theme.text }}>
          {formatValue(home)}
        </span>
        <span
          className="text-[11px] font-medium uppercase tracking-wide text-center flex-1"
          style={{ color: theme.textSecondary }}
        >
          {label}
        </span>
        <span className="text-[15px] font-medium w-12 text-right" style={{ color: theme.text }}>
          {formatValue(away)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex-1 flex justify-end">
          <div
            className="h-2 rounded-full"
            style={{ backgroundColor: theme.bgTertiary, width: '100%' }}
          >
            <div
              className="h-2 rounded-full ml-auto transition-all duration-500"
              style={{
                width: `${homeBarWidth}%`,
                backgroundColor: theme.red,
              }}
            />
          </div>
        </div>

        <div className="flex-1">
          <div
            className="h-2 rounded-full"
            style={{ backgroundColor: theme.bgTertiary, width: '100%' }}
          >
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${awayBarWidth}%`,
                backgroundColor: theme.blue,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BasketballLiveStats({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
  isLoading,
}: BasketballLiveStatsProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
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

  if (!homeStats || !awayStats) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <p className="text-[12px]" style={{ color: theme.textSecondary }}>
          Stats will appear once the game starts
        </p>
      </div>
    );
  }

  const stats = [
    { label: 'Points', home: homeStats.points, away: awayStats.points },
    { label: 'FG%', home: homeStats.fieldGoalPct, away: awayStats.fieldGoalPct, isPercentage: false },
    { label: '3P%', home: homeStats.threePointPct, away: awayStats.threePointPct, isPercentage: false },
    { label: 'FT%', home: homeStats.freeThrowPct, away: awayStats.freeThrowPct, isPercentage: false },
    { label: 'Rebounds', home: homeStats.rebounds, away: awayStats.rebounds },
    { label: 'Off. Rebounds', home: homeStats.offensiveRebounds, away: awayStats.offensiveRebounds },
    { label: 'Assists', home: homeStats.assists, away: awayStats.assists },
    { label: 'Steals', home: homeStats.steals, away: awayStats.steals },
    { label: 'Blocks', home: homeStats.blocks, away: awayStats.blocks },
    { label: 'Turnovers', home: homeStats.turnovers, away: awayStats.turnovers },
    { label: 'Fouls', home: homeStats.fouls, away: awayStats.fouls },
  ];

  return (
    <div>
      {/* Team Headers */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {homeTeam.logo && (
            <img src={homeTeam.logo} alt={homeTeam.name} className="h-6 w-6 object-contain" />
          )}
          <span className="text-[12px] font-medium" style={{ color: theme.text }}>
            {homeTeam.shortDisplayName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium" style={{ color: theme.text }}>
            {awayTeam.shortDisplayName}
          </span>
          {awayTeam.logo && (
            <img src={awayTeam.logo} alt={awayTeam.name} className="h-6 w-6 object-contain" />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-5">
        {stats.map((stat) => (
          <StatRow
            key={stat.label}
            label={stat.label}
            home={stat.home}
            away={stat.away}
            isPercentage={stat.isPercentage}
          />
        ))}
      </div>
    </div>
  );
}
