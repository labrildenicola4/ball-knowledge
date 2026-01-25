'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme';

export interface LineupPlayer {
  id: number;
  name: string;
  position: string;
  shirtNumber: number | null;
}

interface TeamLineupData {
  lineup: LineupPlayer[];
  bench: LineupPlayer[];
  formation: string | null;
  coach: string | null;
}

interface MatchLineupProps {
  home: TeamLineupData;
  away: TeamLineupData;
  homeShortName: string;
  awayShortName: string;
  matchStatus?: string;
}

type TabType = 'home' | 'away';

export function MatchLineup({ home, away, homeShortName, awayShortName, matchStatus }: MatchLineupProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const hasLineups = home.lineup.length > 0 || away.lineup.length > 0;

  if (!hasLineups) {
    // Show different message based on match status
    const isFinished = matchStatus === 'FT';
    const isLive = ['LIVE', '1H', '2H', 'HT'].includes(matchStatus || '');

    let message = 'Lineups will be available closer to kickoff';
    if (isFinished || isLive) {
      message = 'Lineup data not available for this match';
    }

    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <p className="text-[12px]" style={{ color: theme.textSecondary }}>
          {message}
        </p>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; formation: string | null }[] = [
    { key: 'home', label: homeShortName, formation: home.formation },
    { key: 'away', label: awayShortName, formation: away.formation },
  ];

  const currentTeam = activeTab === 'home' ? home : away;
  const currentName = activeTab === 'home' ? homeShortName : awayShortName;

  // Group players by position for starting XI
  const groupByPosition = (players: LineupPlayer[]) => {
    const groups: Record<string, LineupPlayer[]> = {
      Goalkeeper: [],
      Defender: [],
      Midfielder: [],
      Attacker: [],
    };

    players.forEach(player => {
      const pos = player.position || 'Unknown';
      if (pos.includes('Goalkeeper')) groups.Goalkeeper.push(player);
      else if (pos.includes('Back') || pos.includes('Defender')) groups.Defender.push(player);
      else if (pos.includes('Midfield')) groups.Midfielder.push(player);
      else if (pos.includes('Forward') || pos.includes('Winger') || pos.includes('Attacker')) groups.Attacker.push(player);
      else groups.Midfielder.push(player); // Default to midfield
    });

    return groups;
  };

  const positionGroups = groupByPosition(currentTeam.lineup);

  return (
    <div>
      {/* Tab Selector */}
      <div
        className="flex rounded-full p-1 mb-4"
        style={{ backgroundColor: theme.bgTertiary }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-4 rounded-full text-[11px] font-semibold transition-all"
            style={{
              backgroundColor: activeTab === tab.key ? theme.bgSecondary : 'transparent',
              color: activeTab === tab.key ? theme.text : theme.textSecondary,
              border: activeTab === tab.key ? `1px solid ${theme.border}` : '1px solid transparent',
            }}
          >
            <span>{tab.label}</span>
            {tab.formation && (
              <span className="ml-1 opacity-60">({tab.formation})</span>
            )}
          </button>
        ))}
      </div>

      {/* Coach */}
      {currentTeam.coach && (
        <div className="mb-4 px-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
            Manager
          </p>
          <p className="text-[13px] font-medium" style={{ color: theme.text }}>
            {currentTeam.coach}
          </p>
        </div>
      )}

      {/* Starting XI */}
      <div
        className="rounded-xl overflow-hidden mb-4"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <div
          className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
        >
          Starting XI {currentTeam.formation && `• ${currentTeam.formation}`}
        </div>

        {/* Players grouped by position */}
        {['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'].map((position) => {
          const players = positionGroups[position];
          if (players.length === 0) return null;

          return (
            <div key={position}>
              {/* Position header */}
              <div
                className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider"
                style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}
              >
                {position}s
              </div>
              {/* Players in this position */}
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center px-3 py-2.5"
                  style={{ borderTop: `1px solid ${theme.border}` }}
                >
                  <span
                    className="w-8 text-center font-mono text-[13px] font-semibold"
                    style={{ color: theme.accent }}
                  >
                    {player.shirtNumber ?? '-'}
                  </span>
                  <span className="flex-1 text-[13px]" style={{ color: theme.text }}>
                    {player.name}
                  </span>
                  <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                    {player.position?.replace('Centre-', 'C-').replace('Left ', 'L').replace('Right ', 'R') || ''}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Substitutes */}
      {currentTeam.bench.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          <div
            className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
          >
            Substitutes
          </div>

          {currentTeam.bench.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center px-3 py-2"
              style={{ borderTop: idx > 0 ? `1px solid ${theme.border}` : undefined }}
            >
              <span
                className="w-8 text-center font-mono text-[12px]"
                style={{ color: theme.textSecondary }}
              >
                {player.shirtNumber ?? '-'}
              </span>
              <span className="flex-1 text-[12px]" style={{ color: theme.textSecondary }}>
                {player.name}
              </span>
              <span className="text-[9px]" style={{ color: theme.textSecondary, opacity: 0.7 }}>
                {player.position?.replace('Centre-', 'C-').replace('Left ', 'L').replace('Right ', 'R') || ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
