'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { MLBBoxScore as BoxScoreType, MLBPlayerBattingStats, MLBPlayerPitchingStats, MLBTeam } from '@/lib/types/mlb';

interface MLBBoxScoreProps {
  boxScore: BoxScoreType | null;
  isLoading?: boolean;
}

interface BatterRowProps {
  player: MLBPlayerBattingStats;
}

function BatterRow({ player }: BatterRowProps) {
  const { theme } = useTheme();

  return (
    <div
      className="grid items-center px-3 py-2 text-[11px]"
      style={{
        gridTemplateColumns: '1fr 30px 30px 30px 30px 30px 30px 30px 45px',
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
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.atBats}
      </span>
      <span className="text-center font-mono font-semibold" style={{ color: theme.text }}>
        {player.runs}
      </span>
      <span className="text-center font-mono font-semibold" style={{ color: theme.text }}>
        {player.hits}
      </span>
      <span className="text-center font-mono font-semibold" style={{ color: theme.text }}>
        {player.rbi}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.walks}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.strikeouts}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.homeRuns}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.avg}
      </span>
    </div>
  );
}

interface PitcherRowProps {
  player: MLBPlayerPitchingStats;
}

function PitcherRow({ player }: PitcherRowProps) {
  const { theme } = useTheme();

  return (
    <div
      className="grid items-center px-3 py-2 text-[11px]"
      style={{
        gridTemplateColumns: '1fr 35px 30px 30px 30px 30px 30px 45px',
        borderTop: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium truncate" style={{ color: theme.text }}>
          {player.name}
        </span>
        {player.isWinner && (
          <span className="text-[9px] font-bold" style={{ color: theme.green }}>W</span>
        )}
        {player.isLoser && (
          <span className="text-[9px] font-bold" style={{ color: theme.red }}>L</span>
        )}
        {player.isSave && (
          <span className="text-[9px] font-bold" style={{ color: theme.accent }}>S</span>
        )}
      </div>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.inningsPitched}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.hits}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.runs}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.earnedRuns}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.walks}
      </span>
      <span className="text-center font-mono font-semibold" style={{ color: theme.text }}>
        {player.strikeouts}
      </span>
      <span className="text-center font-mono" style={{ color: theme.textSecondary }}>
        {player.era}
      </span>
    </div>
  );
}

interface TeamBoxScoreProps {
  team: MLBTeam;
  batting: MLBPlayerBattingStats[];
  pitching: MLBPlayerPitchingStats[];
  showPitching: boolean;
}

function TeamBoxScore({ team, batting, pitching, showPitching }: TeamBoxScoreProps) {
  const { theme } = useTheme();

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
      </div>

      {showPitching ? (
        <>
          {/* Pitching Headers */}
          <div
            className="grid items-center px-3 py-2 text-[9px] font-semibold uppercase tracking-wider"
            style={{
              gridTemplateColumns: '1fr 35px 30px 30px 30px 30px 30px 45px',
              backgroundColor: theme.bgTertiary,
              color: theme.textSecondary,
            }}
          >
            <span>Pitcher</span>
            <span className="text-center">IP</span>
            <span className="text-center">H</span>
            <span className="text-center">R</span>
            <span className="text-center">ER</span>
            <span className="text-center">BB</span>
            <span className="text-center">K</span>
            <span className="text-center">ERA</span>
          </div>

          {/* Pitchers */}
          {pitching.map(player => (
            <PitcherRow key={player.id} player={player} />
          ))}
        </>
      ) : (
        <>
          {/* Batting Headers */}
          <div
            className="grid items-center px-3 py-2 text-[9px] font-semibold uppercase tracking-wider"
            style={{
              gridTemplateColumns: '1fr 30px 30px 30px 30px 30px 30px 30px 45px',
              backgroundColor: theme.bgTertiary,
              color: theme.textSecondary,
            }}
          >
            <span>Batter</span>
            <span className="text-center">AB</span>
            <span className="text-center">R</span>
            <span className="text-center">H</span>
            <span className="text-center">RBI</span>
            <span className="text-center">BB</span>
            <span className="text-center">K</span>
            <span className="text-center">HR</span>
            <span className="text-center">AVG</span>
          </div>

          {/* Batters */}
          {batting.map(player => (
            <BatterRow key={player.id} player={player} />
          ))}
        </>
      )}
    </div>
  );
}

export function MLBBoxScore({ boxScore, isLoading }: MLBBoxScoreProps) {
  const { theme } = useTheme();
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
  const [showPitching, setShowPitching] = useState(false);

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

      {/* Batting/Pitching Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setShowPitching(false)}
          className="px-4 py-2 text-[11px] font-medium rounded-lg transition-all"
          style={{
            backgroundColor: !showPitching ? theme.accent : theme.bgTertiary,
            color: !showPitching ? '#fff' : theme.textSecondary,
          }}
        >
          Batting
        </button>
        <button
          onClick={() => setShowPitching(true)}
          className="px-4 py-2 text-[11px] font-medium rounded-lg transition-all"
          style={{
            backgroundColor: showPitching ? theme.accent : theme.bgTertiary,
            color: showPitching ? '#fff' : theme.textSecondary,
          }}
        >
          Pitching
        </button>
      </div>

      {/* Box Score Table */}
      <TeamBoxScore
        team={currentData.team}
        batting={currentData.batting}
        pitching={currentData.pitching}
        showPitching={showPitching}
      />
    </div>
  );
}
