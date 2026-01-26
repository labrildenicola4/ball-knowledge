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

// Parse formation string (e.g., "4-3-3") into array of numbers [4, 3, 3]
function parseFormation(formation: string | null): number[] {
  if (!formation) return [4, 4, 2];
  const parts = formation.split('-').map(n => parseInt(n, 10)).filter(n => !isNaN(n));
  return parts.length > 0 ? parts : [4, 4, 2];
}

// Get short name from full name
function getShortName(fullName: string): string {
  const parts = fullName.split(' ');
  if (parts.length === 1) return fullName;
  const lastName = parts[parts.length - 1];
  return lastName.length > 2 ? lastName : parts[0];
}

// Position players based on formation
function positionPlayers(players: LineupPlayer[], formation: number[]): LineupPlayer[][] {
  const goalkeeper = players.find(p =>
    p.position?.toLowerCase().includes('goalkeeper') ||
    p.position?.toLowerCase() === 'g'
  );

  const outfieldPlayers = players.filter(p =>
    !p.position?.toLowerCase().includes('goalkeeper') &&
    p.position?.toLowerCase() !== 'g'
  );

  const rows: LineupPlayer[][] = [];

  if (goalkeeper) {
    rows.push([goalkeeper]);
  } else if (players.length > 0) {
    rows.push([players[0]]);
  }

  let playerIndex = 0;
  for (const count of formation) {
    const row: LineupPlayer[] = [];
    for (let i = 0; i < count && playerIndex < outfieldPlayers.length; i++) {
      row.push(outfieldPlayers[playerIndex]);
      playerIndex++;
    }
    if (row.length > 0) {
      rows.push(row);
    }
  }

  return rows;
}

// Sidebar bench component for desktop
function SideBench({
  team,
  teamName,
  isHome,
}: {
  team: TeamLineupData;
  teamName: string;
  isHome: boolean;
}) {
  const { theme } = useTheme();

  return (
    <div
      className="w-44 flex flex-col rounded-xl overflow-hidden"
      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 text-center"
        style={{ backgroundColor: theme.bgTertiary, borderBottom: `1px solid ${theme.border}` }}
      >
        <p className="text-[11px] font-semibold" style={{ color: theme.text }}>
          {teamName}
        </p>
        {team.formation && (
          <p className="text-[10px]" style={{ color: theme.textSecondary }}>
            {team.formation}
          </p>
        )}
        {team.coach && (
          <p className="text-[9px] mt-1" style={{ color: theme.textSecondary }}>
            {team.coach}
          </p>
        )}
      </div>

      {/* Subs header */}
      <div
        className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider"
        style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
      >
        Subs ({team.bench.length})
      </div>

      {/* Bench players */}
      <div className="flex-1 overflow-y-auto">
        {team.bench.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-2 px-2 py-1.5"
            style={{ borderBottom: `1px solid ${theme.border}` }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold flex-shrink-0"
              style={{
                backgroundColor: theme.bgTertiary,
                color: theme.textSecondary,
              }}
            >
              {player.shirtNumber ?? '-'}
            </span>
            <span className="text-[10px] truncate" style={{ color: theme.text }}>
              {player.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Full pitch with both teams - desktop view
function FullPitch({
  home,
  away,
  homeShortName,
  awayShortName,
}: {
  home: TeamLineupData;
  away: TeamLineupData;
  homeShortName: string;
  awayShortName: string;
}) {
  const { theme } = useTheme();
  const homeFormation = parseFormation(home.formation);
  const awayFormation = parseFormation(away.formation);
  const homeRows = positionPlayers(home.lineup, homeFormation);
  const awayRows = positionPlayers(away.lineup, awayFormation);

  // Team colors (you could make these dynamic based on team)
  const homeColor = '#ffffff';
  const awayColor = '#1a1a1a';
  const homeTextColor = '#1a1a1a';
  const awayTextColor = '#ffffff';

  return (
    <div
      className="relative rounded-xl overflow-hidden flex-1"
      style={{
        backgroundColor: '#2d8a4e',
        minHeight: '500px',
        border: `1px solid ${theme.border}`,
      }}
    >
      {/* Full pitch markings */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 600"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Outer boundary */}
        <rect x="20" y="20" width="360" height="560" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />

        {/* Center line */}
        <line x1="20" y1="300" x2="380" y2="300" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />

        {/* Center circle */}
        <circle cx="200" cy="300" r="50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <circle cx="200" cy="300" r="3" fill="rgba(255,255,255,0.4)" />

        {/* Top penalty area (away) */}
        <rect x="100" y="20" width="200" height="80" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <rect x="150" y="20" width="100" height="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <path d="M 140 100 Q 200 130 260 100" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <circle cx="200" cy="65" r="3" fill="rgba(255,255,255,0.4)" />

        {/* Bottom penalty area (home) */}
        <rect x="100" y="500" width="200" height="80" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <rect x="150" y="550" width="100" height="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <path d="M 140 500 Q 200 470 260 500" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <circle cx="200" cy="535" r="3" fill="rgba(255,255,255,0.4)" />

        {/* Corner arcs */}
        <path d="M 20 30 Q 30 20 40 20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <path d="M 360 20 Q 380 20 380 40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <path d="M 20 570 Q 20 580 30 580" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <path d="M 380 560 Q 380 580 370 580" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      </svg>

      {/* Away team (top half) - attacking downward */}
      <div className="absolute top-0 left-0 right-0 h-1/2 flex flex-col justify-between py-4 px-4">
        {awayRows.map((row, rowIndex) => {
          const isGoalkeeper = rowIndex === 0;
          return (
            <div
              key={`away-${rowIndex}`}
              className="flex justify-center items-center gap-3"
            >
              {row.map((player) => (
                <div key={player.id} className="flex flex-col items-center" style={{ minWidth: '40px' }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shadow-md"
                    style={{
                      backgroundColor: isGoalkeeper ? '#f59e0b' : awayColor,
                      color: isGoalkeeper ? '#ffffff' : awayTextColor,
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    {player.shirtNumber ?? '?'}
                  </div>
                  <span
                    className="mt-1 text-[9px] font-medium text-center px-1 rounded"
                    style={{
                      color: '#ffffff',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      maxWidth: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getShortName(player.name)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Home team (bottom half) - attacking upward */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 flex flex-col-reverse justify-between py-4 px-4">
        {homeRows.map((row, rowIndex) => {
          const isGoalkeeper = rowIndex === 0;
          return (
            <div
              key={`home-${rowIndex}`}
              className="flex justify-center items-center gap-3"
            >
              {row.map((player) => (
                <div key={player.id} className="flex flex-col items-center" style={{ minWidth: '40px' }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shadow-md"
                    style={{
                      backgroundColor: isGoalkeeper ? '#f59e0b' : homeColor,
                      color: isGoalkeeper ? '#ffffff' : homeTextColor,
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    {player.shirtNumber ?? '?'}
                  </div>
                  <span
                    className="mt-1 text-[9px] font-medium text-center px-1 rounded"
                    style={{
                      color: '#ffffff',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      maxWidth: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getShortName(player.name)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

    </div>
  );
}

export function MatchLineup({ home, away, homeShortName, awayShortName, matchStatus }: MatchLineupProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const hasLineups = home.lineup.length > 0 || away.lineup.length > 0;

  if (!hasLineups) {
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
  const formation = parseFormation(currentTeam.formation);
  const playerRows = positionPlayers(currentTeam.lineup, formation);

  return (
    <div>
      {/* DESKTOP: Full pitch with benches on sides */}
      <div className="hidden lg:flex gap-4 items-stretch">
        {/* Home bench - left side */}
        <SideBench team={home} teamName={homeShortName} isHome={true} />

        {/* Full pitch with both teams */}
        <FullPitch
          home={home}
          away={away}
          homeShortName={homeShortName}
          awayShortName={awayShortName}
        />

        {/* Away bench - right side */}
        <SideBench team={away} teamName={awayShortName} isHome={false} />
      </div>

      {/* MOBILE: Tabbed view */}
      <div className="lg:hidden">
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
          <div className="mb-3 px-1">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Manager
            </p>
            <p className="text-[13px] font-medium" style={{ color: theme.text }}>
              {currentTeam.coach}
            </p>
          </div>
        )}

        {/* Pitch */}
        <div
          className="relative rounded-xl overflow-hidden mb-4"
          style={{
            backgroundColor: '#2d8a4e',
            height: '220px',
            border: `1px solid ${theme.border}`,
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 220"
            preserveAspectRatio="none"
          >
            <rect x="8" y="8" width="384" height="204" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
            <rect x="130" y="170" width="140" height="42" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
            <rect x="160" y="195" width="80" height="17" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
            <path d="M 160 170 Q 200 145 240 170" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
            <circle cx="200" cy="155" r="2" fill="rgba(255,255,255,0.35)" />
            <line x1="8" y1="8" x2="392" y2="8" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
          </svg>

          <div className="absolute inset-0 flex flex-col justify-between py-2 px-3">
            {playerRows.map((row, rowIndex) => {
              const isGoalkeeper = rowIndex === 0;
              return (
                <div
                  key={rowIndex}
                  className="flex justify-center items-center gap-2"
                  style={{ order: playerRows.length - rowIndex }}
                >
                  {row.map((player) => (
                    <div key={player.id} className="flex flex-col items-center" style={{ minWidth: '32px' }}>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shadow-sm"
                        style={{
                          backgroundColor: isGoalkeeper ? '#f59e0b' : '#ffffff',
                          color: isGoalkeeper ? '#ffffff' : '#1a1a1a',
                          border: '2px solid rgba(0,0,0,0.15)',
                        }}
                      >
                        {player.shirtNumber ?? '?'}
                      </div>
                      <span
                        className="mt-0.5 text-[8px] font-medium text-center leading-tight px-1 rounded"
                        style={{
                          color: '#ffffff',
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          maxWidth: '55px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getShortName(player.name)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
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
              Substitutes ({currentTeam.bench.length})
            </div>
            <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: theme.border }}>
              {currentTeam.bench.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center px-3 py-2"
                  style={{ backgroundColor: theme.bgSecondary }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold mr-2"
                    style={{
                      backgroundColor: theme.bgTertiary,
                      color: theme.textSecondary,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    {player.shirtNumber ?? '-'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate" style={{ color: theme.text }}>
                      {player.name}
                    </p>
                    <p className="text-[9px]" style={{ color: theme.textSecondary }}>
                      {player.position?.replace('Centre-', 'C-').replace('Left ', 'L').replace('Right ', 'R') || ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
