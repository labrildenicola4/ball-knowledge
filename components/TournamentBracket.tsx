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
  const homeWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;

  return (
    <Link href={`/match/${match.id}`}>
      <div
        className="rounded-lg p-3 transition-all hover:scale-[1.02] cursor-pointer"
        style={{
          backgroundColor: theme.bgTertiary,
          border: `1px solid ${theme.border}`,
          minWidth: '180px',
        }}
      >
        {/* Home Team */}
        <div
          className="flex items-center justify-between gap-2 pb-2"
          style={{
            borderBottom: `1px solid ${theme.border}`,
            opacity: awayWon ? 0.5 : 1,
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.homeLogo && (
              <img src={match.homeLogo} alt={match.home} className="h-5 w-5 object-contain flex-shrink-0" />
            )}
            <span
              className="text-sm font-medium truncate"
              style={{ color: homeWon ? theme.accent : theme.text }}
            >
              {match.home}
            </span>
          </div>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: homeWon ? theme.accent : theme.text }}
          >
            {match.homeScore ?? '-'}
          </span>
        </div>

        {/* Away Team */}
        <div
          className="flex items-center justify-between gap-2 pt-2"
          style={{ opacity: homeWon ? 0.5 : 1 }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.awayLogo && (
              <img src={match.awayLogo} alt={match.away} className="h-5 w-5 object-contain flex-shrink-0" />
            )}
            <span
              className="text-sm font-medium truncate"
              style={{ color: awayWon ? theme.accent : theme.text }}
            >
              {match.away}
            </span>
          </div>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: awayWon ? theme.accent : theme.text }}
          >
            {match.awayScore ?? '-'}
          </span>
        </div>

        {/* Match Info */}
        <div
          className="mt-2 pt-2 text-center"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <span className="text-xs" style={{ color: theme.textSecondary }}>
            {match.date} • {match.status === 'NS' ? match.time : match.status}
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
      className="rounded-lg p-3 flex items-center justify-center"
      style={{
        backgroundColor: theme.bgTertiary,
        border: `1px dashed ${theme.border}`,
        minWidth: '180px',
        minHeight: '100px',
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

  // For mobile, we'll show a vertical layout grouped by round
  return (
    <div className="flex flex-col gap-6">
      {stages.map((stage) => {
        const matches = bracket[stage] || [];
        const expectedMatches = stage === 'FINAL' ? 1 : stage === 'SEMI_FINALS' ? 2 : stage === 'QUARTER_FINALS' ? 4 : 8;

        return (
          <section key={stage}>
            {/* Stage Header */}
            <div className="flex items-center gap-3 mb-3">
              <h3
                className="text-base font-semibold"
                style={{ color: theme.text }}
              >
                {stageNames[stage] || stage}
              </h3>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs"
                style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
              >
                {matches.length}/{expectedMatches}
              </span>
            </div>

            {/* Matches Grid */}
            {matches.length > 0 ? (
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: stage === 'FINAL'
                    ? '1fr'
                    : 'repeat(auto-fill, minmax(180px, 1fr))',
                }}
              >
                {matches.map((match) => (
                  <BracketMatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-lg py-6 text-center"
                style={{ backgroundColor: theme.bgSecondary }}
              >
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  Matches not yet scheduled
                </p>
              </div>
            )}

            {/* Connector line to next round */}
            {stage !== 'FINAL' && matches.length > 0 && (
              <div className="flex justify-center my-4">
                <div
                  className="w-0.5 h-6"
                  style={{ backgroundColor: theme.border }}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// Desktop horizontal bracket view (optional enhancement)
export function HorizontalBracket({ bracket, stages, stageNames }: TournamentBracketProps) {
  const { theme } = useTheme();

  // Split stages for left and right sides of bracket
  const leftStages = ['LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS'];
  const rightStages = [...leftStages].reverse();

  return (
    <div className="hidden lg:flex items-center justify-center gap-4 overflow-x-auto py-4">
      {/* Left side of bracket */}
      {leftStages.map((stage) => {
        const matches = bracket[stage] || [];
        const halfMatches = matches.slice(0, Math.ceil(matches.length / 2));

        return (
          <div key={`left-${stage}`} className="flex flex-col gap-4">
            <h4
              className="text-xs font-medium text-center uppercase tracking-wider"
              style={{ color: theme.textSecondary }}
            >
              {stageNames[stage]}
            </h4>
            {halfMatches.map((match) => (
              <BracketMatchCard key={match.id} match={match} />
            ))}
            {halfMatches.length === 0 && <EmptyMatchCard />}
          </div>
        );
      })}

      {/* Final in center */}
      <div className="flex flex-col gap-4 mx-8">
        <h4
          className="text-sm font-bold text-center uppercase tracking-wider"
          style={{ color: theme.gold }}
        >
          Final
        </h4>
        {bracket['FINAL']?.[0] ? (
          <BracketMatchCard match={bracket['FINAL'][0]} />
        ) : (
          <EmptyMatchCard />
        )}
      </div>

      {/* Right side of bracket */}
      {rightStages.map((stage) => {
        const matches = bracket[stage] || [];
        const halfMatches = matches.slice(Math.ceil(matches.length / 2));

        return (
          <div key={`right-${stage}`} className="flex flex-col gap-4">
            <h4
              className="text-xs font-medium text-center uppercase tracking-wider"
              style={{ color: theme.textSecondary }}
            >
              {stageNames[stage]}
            </h4>
            {halfMatches.map((match) => (
              <BracketMatchCard key={match.id} match={match} />
            ))}
            {halfMatches.length === 0 && <EmptyMatchCard />}
          </div>
        );
      })}
    </div>
  );
}
