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

// Single team pitch component
function TeamPitch({
  team,
  teamName,
  isHome,
}: {
  team: TeamLineupData;
  teamName: string;
  isHome: boolean;
}) {
  const { theme } = useTheme();
  const formation = parseFormation(team.formation);
  const playerRows = positionPlayers(team.lineup, formation);

  return (
    <div className="flex-1">
      {/* Team header */}
      <div className="mb-2 text-center">
        <p className="text-[12px] font-semibold" style={{ color: theme.text }}>
          {teamName} {team.formation && <span style={{ color: theme.textSecondary }}>({team.formation})</span>}
        </p>
        {team.coach && (
          <p className="text-[10px]" style={{ color: theme.textSecondary }}>
            {team.coach}
          </p>
        )}
      </div>

      {/* Pitch */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          backgroundColor: '#2d8a4e',
          height: '200px',
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Pitch markings */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 200"
          preserveAspectRatio="none"
        >
          <rect x="5" y="5" width="190" height="190" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <rect x="50" y="155" width="100" height="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <rect x="70" y="175" width="60" height="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <path d="M 70 155 Q 100 135 130 155" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <circle cx="100" cy="145" r="2" fill="rgba(255,255,255,0.3)" />
        </svg>

        {/* Players */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 px-2">
          {playerRows.map((row, rowIndex) => {
            const isGoalkeeper = rowIndex === 0;
            return (
              <div
                key={rowIndex}
                className="flex justify-center items-center gap-1"
                style={{ order: playerRows.length - rowIndex }}
              >
                {row.map((player) => (
                  <div key={player.id} className="flex flex-col items-center" style={{ minWidth: '28px' }}>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm"
                      style={{
                        backgroundColor: isGoalkeeper ? '#f59e0b' : '#ffffff',
                        color: isGoalkeeper ? '#ffffff' : '#1a1a1a',
                        border: '1.5px solid rgba(0,0,0,0.15)',
                      }}
                    >
                      {player.shirtNumber ?? '?'}
                    </div>
                    <span
                      className="mt-0.5 text-[7px] font-medium text-center px-0.5 rounded"
                      style={{
                        color: '#ffffff',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        maxWidth: '45px',
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

      {/* Bench */}
      {team.bench.length > 0 && (
        <div className="mt-2">
          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: theme.textSecondary }}>
            Subs ({team.bench.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {team.bench.slice(0, 7).map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{ backgroundColor: theme.bgTertiary }}
              >
                <span className="text-[9px] font-mono font-semibold" style={{ color: theme.textSecondary }}>
                  {player.shirtNumber ?? '-'}
                </span>
                <span className="text-[9px]" style={{ color: theme.text }}>
                  {getShortName(player.name)}
                </span>
              </div>
            ))}
            {team.bench.length > 7 && (
              <span className="text-[9px] px-1.5 py-0.5" style={{ color: theme.textSecondary }}>
                +{team.bench.length - 7}
              </span>
            )}
          </div>
        </div>
      )}
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
      {/* DESKTOP: Both teams side by side */}
      <div className="hidden lg:flex gap-4">
        <TeamPitch team={home} teamName={homeShortName} isHome={true} />
        <TeamPitch team={away} teamName={awayShortName} isHome={false} />
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
