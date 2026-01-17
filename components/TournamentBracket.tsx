'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { ChevronRight } from 'lucide-react';

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

function BracketMatchCard({ match, compact }: { match: BracketMatch; compact?: boolean }) {
  const { theme } = useTheme();
  const isFinished = match.status === 'FT';
  const homeWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;

  return (
    <Link href={`/match/${match.id}`}>
      <div
        className="rounded-lg p-2 transition-all hover:scale-[1.02] cursor-pointer"
        style={{
          backgroundColor: theme.bgTertiary,
          border: `1px solid ${theme.border}`,
          width: compact ? '140px' : '160px',
        }}
      >
        {/* Home Team */}
        <div
          className="flex items-center justify-between gap-1 pb-1.5"
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
          className="flex items-center justify-between gap-1 pt-1.5"
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
    </Link>
  );
}

function EmptyMatchCard() {
  const { theme } = useTheme();

  return (
    <div
      className="rounded-lg p-2 flex items-center justify-center"
      style={{
        backgroundColor: theme.bgTertiary,
        border: `1px dashed ${theme.border}`,
        width: '140px',
        height: '52px',
        opacity: 0.5,
      }}
    >
      <span className="text-xs" style={{ color: theme.textSecondary }}>
        TBD
      </span>
    </div>
  );
}

export function TournamentBracket({ bracket, stages, stageNames }: TournamentBracketProps) {
  const { theme } = useTheme();

  // Horizontal left-to-right bracket: R16 → QF → SF → Final
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start gap-2 min-w-max">
        {stages.map((stage, stageIndex) => {
          const matches = bracket[stage] || [];
          const isLast = stageIndex === stages.length - 1;

          return (
            <div key={stage} className="flex items-center">
              {/* Stage Column */}
              <div className="flex flex-col items-center">
                {/* Stage Header */}
                <h3
                  className="text-xs font-semibold uppercase tracking-wide mb-3 text-center"
                  style={{ color: stage === 'FINAL' ? theme.gold : theme.textSecondary }}
                >
                  {stageNames[stage] || stage}
                </h3>

                {/* Matches */}
                <div
                  className="flex flex-col gap-3"
                  style={{
                    // Increase vertical spacing as we progress to give bracket feel
                    gap: stage === 'LAST_16' ? '8px' : stage === 'QUARTER_FINALS' ? '24px' : stage === 'SEMI_FINALS' ? '60px' : '0px',
                  }}
                >
                  {matches.length > 0 ? (
                    matches.map((match) => (
                      <BracketMatchCard key={match.id} match={match} compact />
                    ))
                  ) : (
                    <EmptyMatchCard />
                  )}
                </div>
              </div>

              {/* Arrow connector to next round */}
              {!isLast && (
                <div className="flex items-center px-2">
                  <ChevronRight size={20} style={{ color: theme.border }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
