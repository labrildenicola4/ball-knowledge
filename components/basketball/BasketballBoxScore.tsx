'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { BasketballBoxScore as BoxScoreType, BasketballPlayerStats, BasketballTeam } from '@/lib/types/basketball';

interface BasketballBoxScoreProps {
  boxScore: BoxScoreType | null;
  isLoading?: boolean;
}

interface PlayerRowProps {
  player: BasketballPlayerStats;
  showExtended?: boolean;
}

function PlayerRow({ player, showExtended }: PlayerRowProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`grid items-center px-3 py-2 text-[11px] ${player.starter ? '' : 'opacity-70'}`}
      style={{
        gridTemplateColumns: showExtended
          ? '1fr 35px 35px 35px 35px 35px 35px 35px 50px 50px 50px'
          : '1fr 35px 35px 35px 35px 35px',
        borderTop: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium truncate" style={{ color: theme.text }}>
          {player.name}
        </span>
        <span className="text-[9px]" style={{ color: theme.textSecondary }}>
          {player.position}
        </span>
      </div>
      <span className="text-center font-mono font-semibold" style={{ color: theme.text }}>
        {player.points}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.rebounds}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.assists}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.steals}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.blocks}
      </span>
      {showExtended && (
        <>
          <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
            {player.turnovers}
          </span>
          <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
            {player.minutes}
          </span>
          <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
            {player.fieldGoalsMade}-{player.fieldGoalsAttempted}
          </span>
          <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
            {player.threePointMade}-{player.threePointAttempted}
          </span>
          <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
            {player.freeThrowsMade}-{player.freeThrowsAttempted}
          </span>
        </>
      )}
    </div>
  );
}

interface TeamBoxScoreProps {
  team: BasketballTeam;
  players: BasketballPlayerStats[];
  showExtended: boolean;
}

function TeamBoxScore({ team, players, showExtended }: TeamBoxScoreProps) {
  const { theme } = useTheme();

  const starters = players.filter(p => p.starter);
  const bench = players.filter(p => !p.starter);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      {/* Team Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: theme.bgTertiary }}
      >
        {team.logo && (
          <img src={team.logo} alt={team.name} className="h-6 w-6 object-contain logo-glow" />
        )}
        <span className="text-sm font-medium" style={{ color: theme.text }}>
          {team.displayName}
        </span>
        {team.rank && (
          <span className="text-[10px] font-bold" style={{ color: theme.accent }}>
            #{team.rank}
          </span>
        )}
      </div>

      {/* Column Headers */}
      <div
        className="grid items-center px-3 py-2 text-[9px] font-semibold uppercase tracking-wider"
        style={{
          gridTemplateColumns: showExtended
            ? '1fr 35px 35px 35px 35px 35px 35px 35px 50px 50px 50px'
            : '1fr 35px 35px 35px 35px 35px',
          backgroundColor: theme.bgTertiary,
          color: theme.textSecondary,
        }}
      >
        <span>Player</span>
        <span className="text-center">PTS</span>
        <span className="text-center">REB</span>
        <span className="text-center">AST</span>
        <span className="text-center">STL</span>
        <span className="text-center">BLK</span>
        {showExtended && (
          <>
            <span className="text-center">TO</span>
            <span className="text-center">MIN</span>
            <span className="text-center">FG</span>
            <span className="text-center">3PT</span>
            <span className="text-center">FT</span>
          </>
        )}
      </div>

      {/* Starters */}
      {starters.length > 0 && (
        <>
          <div
            className="px-3 py-1 text-[9px] font-medium uppercase"
            style={{ backgroundColor: theme.bg, color: theme.textSecondary }}
          >
            Starters
          </div>
          {starters.map(player => (
            <PlayerRow key={player.id} player={player} showExtended={showExtended} />
          ))}
        </>
      )}

      {/* Bench */}
      {bench.length > 0 && (
        <>
          <div
            className="px-3 py-1 text-[9px] font-medium uppercase"
            style={{ backgroundColor: theme.bg, color: theme.textSecondary }}
          >
            Bench
          </div>
          {bench.map(player => (
            <PlayerRow key={player.id} player={player} showExtended={showExtended} />
          ))}
        </>
      )}
    </div>
  );
}

export function BasketballBoxScore({ boxScore, isLoading }: BasketballBoxScoreProps) {
  const { theme } = useTheme();
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
  const [showExtended, setShowExtended] = useState(false);

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
          Loading box score...
        </p>
      </div>
    );
  }

  if (!boxScore) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
      >
        <p className="text-[12px]" style={{ color: theme.textSecondary }}>
          Box score will appear once the game starts
        </p>
      </div>
    );
  }

  const currentData = activeTeam === 'home' ? boxScore.homeTeam : boxScore.awayTeam;

  return (
    <div>
      {/* Team Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTeam('home')}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{
            backgroundColor: activeTeam === 'home' ? theme.bgSecondary : 'transparent',
            border: `1px solid ${activeTeam === 'home' ? theme.border : 'transparent'}`,
            color: activeTeam === 'home' ? theme.text : theme.textSecondary,
          }}
        >
          {boxScore.homeTeam.team.logo && (
            <img
              src={boxScore.homeTeam.team.logo}
              alt=""
              className="h-5 w-5 object-contain logo-glow"
            />
          )}
          {boxScore.homeTeam.team.shortDisplayName}
        </button>
        <button
          onClick={() => setActiveTeam('away')}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{
            backgroundColor: activeTeam === 'away' ? theme.bgSecondary : 'transparent',
            border: `1px solid ${activeTeam === 'away' ? theme.border : 'transparent'}`,
            color: activeTeam === 'away' ? theme.text : theme.textSecondary,
          }}
        >
          {boxScore.awayTeam.team.logo && (
            <img
              src={boxScore.awayTeam.team.logo}
              alt=""
              className="h-5 w-5 object-contain logo-glow"
            />
          )}
          {boxScore.awayTeam.team.shortDisplayName}
        </button>
      </div>

      {/* Expand/Collapse Toggle */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowExtended(!showExtended)}
          className="text-[10px] px-2 py-1 rounded"
          style={{
            backgroundColor: theme.bgTertiary,
            color: theme.textSecondary,
          }}
        >
          {showExtended ? 'Show Less' : 'Show More'}
        </button>
      </div>

      {/* Box Score Table */}
      <TeamBoxScore
        team={currentData.team}
        players={currentData.players}
        showExtended={showExtended}
      />
    </div>
  );
}
