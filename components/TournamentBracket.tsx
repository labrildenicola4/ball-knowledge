'use client';

import Link from 'next/link';
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

interface TournamentBracketProps {
  bracket: Record<string, BracketMatch[]>;
  stages: string[];
  stageNames: Record<string, string>;
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const { theme } = useTheme();
  const isFinished = match.status === 'FT';
  const isLive = ['1H', '2H', 'HT', 'ET', 'PT'].includes(match.status);
  const homeWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;

  return (
    <Link href={`/match/${match.id}`} className="block w-full">
      <div className="flex flex-col items-center w-full">
        {/* Date/Time Outside Box */}
        <span className="text-[10px] mb-1" style={{ color: isLive ? theme.accent : theme.textSecondary }}>
          {isLive ? `● ${match.status} ${match.time}` : isFinished ? match.status : `${match.date} • ${match.time}`}
        </span>

        {/* Match Box */}
        <div
          className="rounded p-2 transition-all hover:scale-[1.02] cursor-pointer w-full"
          style={{
            backgroundColor: theme.bgTertiary,
            border: `1px solid ${isLive ? theme.accent : theme.border}`,
          }}
        >
          {/* Home Team */}
          <div
            className="flex items-center justify-between gap-1.5 pb-1.5"
            style={{
              borderBottom: `1px solid ${theme.border}`,
              opacity: awayWon ? 0.5 : 1,
            }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {match.homeLogo && (
                <img src={match.homeLogo} alt={match.home} className="h-4 w-4 object-contain flex-shrink-0" />
              )}
              <span
                className="text-xs font-medium truncate"
                style={{ color: homeWon ? theme.accent : theme.text }}
              >
                {match.home}
              </span>
            </div>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: homeWon ? theme.accent : theme.text }}
            >
              {match.homeScore ?? '-'}
            </span>
          </div>

          {/* Away Team */}
          <div
            className="flex items-center justify-between gap-1.5 pt-1.5"
            style={{ opacity: homeWon ? 0.5 : 1 }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {match.awayLogo && (
                <img src={match.awayLogo} alt={match.away} className="h-4 w-4 object-contain flex-shrink-0" />
              )}
              <span
                className="text-xs font-medium truncate"
                style={{ color: awayWon ? theme.accent : theme.text }}
              >
                {match.away}
              </span>
            </div>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: awayWon ? theme.accent : theme.text }}
            >
              {match.awayScore ?? '-'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyMatchCard() {
  const { theme } = useTheme();

  return (
    <div
      className="rounded p-1.5 flex items-center justify-center w-full"
      style={{
        backgroundColor: theme.bgTertiary,
        border: `1px dashed ${theme.border}`,
        minHeight: '36px',
        opacity: 0.5,
      }}
    >
      <span className="text-[10px]" style={{ color: theme.textSecondary }}>
        TBD
      </span>
    </div>
  );
}

// Connector lines component
function BracketConnector({ theme, height }: { theme: any; height: string }) {
  return (
    <div className="flex items-center" style={{ width: '12px', height }}>
      <svg width="12" height="100%" viewBox="0 0 12 100" preserveAspectRatio="none">
        {/* Top line going right then down to middle */}
        <path
          d="M 0 25 L 6 25 L 6 50"
          fill="none"
          stroke={theme.border}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {/* Bottom line going right then up to middle */}
        <path
          d="M 0 75 L 6 75 L 6 50"
          fill="none"
          stroke={theme.border}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {/* Middle line going right to next match */}
        <path
          d="M 6 50 L 12 50"
          fill="none"
          stroke={theme.border}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export function TournamentBracket({ bracket, stages, stageNames }: TournamentBracketProps) {
  const { theme } = useTheme();

  const r16 = bracket['LAST_16'] || [];
  const qf = bracket['QUARTER_FINALS'] || [];
  const sf = bracket['SEMI_FINALS'] || [];
  const final = bracket['FINAL'] || [];

  // Fill arrays to expected lengths for layout
  const r16Matches = [...r16, ...Array(8 - r16.length).fill(null)].slice(0, 8);
  const qfMatches = [...qf, ...Array(4 - qf.length).fill(null)].slice(0, 4);
  const sfMatches = [...sf, ...Array(2 - sf.length).fill(null)].slice(0, 2);
  const finalMatch = final[0] || null;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px] w-full px-2">
        {/* Stage Headers */}
        <div className="flex mb-2">
          <div className="flex-1 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
              {stageNames['LAST_16']}
            </span>
          </div>
          <div style={{ width: '12px' }} />
          <div className="flex-1 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
              {stageNames['QUARTER_FINALS']}
            </span>
          </div>
          <div style={{ width: '12px' }} />
          <div className="flex-1 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
              {stageNames['SEMI_FINALS']}
            </span>
          </div>
          <div style={{ width: '12px' }} />
          <div className="flex-1 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.gold }}>
              {stageNames['FINAL']}
            </span>
          </div>
        </div>

        {/* Bracket Grid */}
        <div className="flex items-stretch" style={{ minHeight: '500px' }}>
          {/* Round of 16 */}
          <div className="flex-1 flex flex-col justify-around py-2">
            {r16Matches.map((match, i) => (
              <div key={`r16-${i}`} className="px-1">
                {match ? <BracketMatchCard match={match} /> : <EmptyMatchCard />}
              </div>
            ))}
          </div>

          {/* R16 to QF Connectors */}
          <div className="flex flex-col justify-around py-2" style={{ width: '12px' }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={`r16-qf-${i}`} className="flex-1 flex items-center">
                <svg width="12" height="100%" preserveAspectRatio="none">
                  <line x1="0" y1="25%" x2="6" y2="25%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="6" y1="25%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="75%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="6" y1="50%" x2="12" y2="50%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            ))}
          </div>

          {/* Quarterfinals */}
          <div className="flex-1 flex flex-col justify-around py-2">
            {qfMatches.map((match, i) => (
              <div key={`qf-${i}`} className="px-1 flex items-center" style={{ flex: 2 }}>
                {match ? <BracketMatchCard match={match} /> : <EmptyMatchCard />}
              </div>
            ))}
          </div>

          {/* QF to SF Connectors */}
          <div className="flex flex-col justify-around py-2" style={{ width: '12px' }}>
            {[0, 1].map((i) => (
              <div key={`qf-sf-${i}`} className="flex-1 flex items-center">
                <svg width="12" height="100%" preserveAspectRatio="none">
                  <line x1="0" y1="25%" x2="6" y2="25%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="6" y1="25%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="75%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="6" y1="50%" x2="12" y2="50%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            ))}
          </div>

          {/* Semifinals */}
          <div className="flex-1 flex flex-col justify-around py-2">
            {sfMatches.map((match, i) => (
              <div key={`sf-${i}`} className="px-1 flex items-center" style={{ flex: 4 }}>
                {match ? <BracketMatchCard match={match} /> : <EmptyMatchCard />}
              </div>
            ))}
          </div>

          {/* SF to Final Connector */}
          <div className="flex flex-col justify-center py-2" style={{ width: '12px' }}>
            <svg width="12" height="100%" preserveAspectRatio="none">
              <line x1="0" y1="25%" x2="6" y2="25%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1="6" y1="25%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1="0" y1="75%" x2="6" y2="75%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1="6" y1="50%" x2="12" y2="50%" stroke={theme.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          {/* Final */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <div className="px-1">
              {finalMatch ? <BracketMatchCard match={finalMatch} /> : <EmptyMatchCard />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
