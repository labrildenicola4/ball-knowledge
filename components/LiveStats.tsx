'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { tapLight } from '@/lib/haptics';

export interface MatchStat {
  label: string;
  home: number;
  away: number;
  type?: 'default' | 'decimal'; // decimal for xG
}

export interface LiveStatsData {
  all: MatchStat[];
  firstHalf?: MatchStat[];
  secondHalf?: MatchStat[];
}

interface LiveStatsProps {
  stats: LiveStatsData | null;
  homeShortName: string;
  awayShortName: string;
  matchStatus?: string;
  isLoading?: boolean;
}

type TabType = 'all' | '1st' | '2nd';

export function LiveStats({ stats, homeShortName, awayShortName, matchStatus, isLoading }: LiveStatsProps) {
  const { theme, darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Show loading spinner while data is being fetched
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

  if (!stats || stats.all.length === 0) {
    const isFinished = matchStatus === 'FT';
    const message = isFinished
      ? 'Match stats not available'
      : 'Live stats will appear here during the match';

    return (
      <div
        className={`rounded-xl p-6 text-center ${darkMode ? 'glass-card' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <p className="text-[12px]" style={{ color: theme.textSecondary }}>
          {message}
        </p>
      </div>
    );
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'ALL' },
    { key: '1st', label: '1ST' },
    { key: '2nd', label: '2ND' },
  ];

  const getStatsForTab = (): MatchStat[] => {
    switch (activeTab) {
      case '1st':
        return stats.firstHalf || [];
      case '2nd':
        return stats.secondHalf || [];
      default:
        return stats.all;
    }
  };

  const currentStats = getStatsForTab();

  return (
    <div>
      {/* Tab Selector */}
      <div
        className={`flex rounded-full p-1 mb-6 ${darkMode ? 'glass-pill' : ''}`}
        style={darkMode ? undefined : { backgroundColor: theme.bgTertiary }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { tapLight(); setActiveTab(tab.key); }}
            className={`flex-1 py-2 px-4 rounded-full text-[11px] font-semibold transition-all ${darkMode ? (activeTab === tab.key ? 'glass-pill-active' : '') : ''}`}
            style={{
              ...(darkMode ? {} : { backgroundColor: activeTab === tab.key ? theme.bgSecondary : 'transparent', border: activeTab === tab.key ? `1px solid ${theme.border}` : '1px solid transparent' }),
              color: activeTab === tab.key ? theme.text : theme.textSecondary,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats List */}
      <div className="space-y-5">
        {currentStats.map((stat, index) => (
          <StatRow
            key={index}
            stat={stat}
            homeShortName={homeShortName}
            awayShortName={awayShortName}
          />
        ))}
      </div>

      {currentStats.length === 0 && (
        <div className="text-center py-4">
          <p className="text-[12px]" style={{ color: theme.textSecondary }}>
            No stats available for this period
          </p>
        </div>
      )}
    </div>
  );
}

interface StatRowProps {
  stat: MatchStat;
  homeShortName: string;
  awayShortName: string;
}

function StatRow({ stat, homeShortName, awayShortName }: StatRowProps) {
  const { theme, darkMode } = useTheme();

  const formatValue = (value: number): string => {
    if (stat.type === 'decimal') {
      return value.toFixed(2);
    }
    return String(value);
  };

  // Calculate bar widths - each bar grows from center outward
  const total = stat.home + stat.away;
  const maxBarWidth = 45; // percentage (leaves room for center gap)

  let homeBarWidth = 0;
  let awayBarWidth = 0;

  if (total > 0) {
    // Proportional: the team with more gets full bar, other is proportional
    const homeRatio = stat.home / total;
    const awayRatio = stat.away / total;
    homeBarWidth = homeRatio * maxBarWidth * 2;
    awayBarWidth = awayRatio * maxBarWidth * 2;
  }

  return (
    <div>
      {/* Values and Label Row */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[15px] font-medium w-12"
          style={{ color: theme.text }}
        >
          {formatValue(stat.home)}
        </span>
        <span
          className="text-[11px] font-medium uppercase tracking-wide text-center flex-1"
          style={{ color: theme.textSecondary }}
        >
          {stat.label}
        </span>
        <span
          className="text-[15px] font-medium w-12 text-right"
          style={{ color: theme.text }}
        >
          {formatValue(stat.away)}
        </span>
      </div>

      {/* Bar Row */}
      <div className="flex items-center gap-1">
        {/* Home Bar (grows right to left) */}
        <div className="flex-1 flex justify-end">
          <div
            className="h-2 rounded-full"
            style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.4)' : theme.bgTertiary, width: '100%' }}
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

        {/* Away Bar (grows left to right) */}
        <div className="flex-1">
          <div
            className="h-2 rounded-full"
            style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.4)' : theme.bgTertiary, width: '100%' }}
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
