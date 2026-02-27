'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, Star } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useSafeBack } from '@/lib/use-safe-back';
import { useFavorites } from '@/lib/use-favorites';
import type { FavoriteType } from '@/lib/use-favorites';
import { SafeImage } from '@/components/SafeImage';
import { PullToRefresh } from '@/components/PullToRefresh';
import { tapLight, tapMedium } from '@/lib/haptics';

interface PlayerData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  jersey: string | null;
  position: string;
  team: { id: string; name: string; abbreviation: string; logo: string; color: string } | null;
  headshot: string;
  height: string;
  weight: string;
  age: number | null;
  birthDate: string | null;
  birthPlace: string;
  nationality: string;
  experience: number | null;
  college: string | null;
  draft: string | null;
  sport: string;
  currentStats: Record<string, string | number> | null;
  careerStats: Array<{ season: string; stats: Record<string, string | number> }> | null;
  statLabels: string[] | null;
  extras: Record<string, any>;
}

// Mapping from sport key → favorite type for sports that support player favorites
const FAVORITE_TYPE_MAP: Record<string, FavoriteType> = {
  f1: 'f1_driver',
  golf: 'golfer',
  ufc: 'ufc_fighter',
};

// Sport → team page base path
const TEAM_PAGE_MAP: Record<string, string> = {
  nba: '/nba/team',
  nfl: '/nfl/team',
  mlb: '/mlb/team',
  nhl: '/nhl/team',
  ncaab: '/basketball/team',
  cfb: '/football/team',
  soccer: '/team',
};

// Sport → game page base path
const GAME_LINK_MAP: Record<string, string> = {
  nba: '/nba/game',
  nfl: '/nfl/game',
  mlb: '/mlb/game',
  nhl: '/nhl/game',
  ncaab: '/basketball/game',
  cfb: '/football/game',
  soccer: '/match',
};

// Sport display names
const SPORT_DISPLAY: Record<string, string> = {
  nba: 'NBA',
  nfl: 'NFL',
  mlb: 'MLB',
  nhl: 'NHL',
  ncaab: 'College Basketball',
  cfb: 'College Football',
  soccer: 'Soccer',
  f1: 'Formula 1',
  golf: 'Golf',
  ufc: 'UFC',
};

// Fallback back routes
const SPORT_BACK_ROUTE: Record<string, string> = {
  nba: '/nba',
  nfl: '/nfl',
  mlb: '/mlb',
  nhl: '/nhl',
  ncaab: '/basketball',
  cfb: '/football',
  soccer: '/soccer',
  f1: '/f1',
  golf: '/golf',
  ufc: '/ufc',
};

// Top stats to show per sport (limit display to most relevant)
const TOP_STAT_KEYS: Record<string, string[]> = {
  nba: ['GP', 'MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'FG%', '3P%', 'FT%'],
  nfl: ['GP', 'YDS', 'TD', 'INT', 'CMP', 'ATT', 'QBR', 'RTG', 'REC', 'RYDS'],
  mlb: ['GP', 'AB', 'AVG', 'HR', 'RBI', 'R', 'OBP', 'SLG', 'OPS', 'SB'],
  nhl: ['GP', 'G', 'A', 'PTS', '+/-', 'PIM', 'SOG', 'S%', 'PPG', 'SHG'],
  ncaab: ['GP', 'MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'FG%', '3P%', 'FT%'],
  cfb: ['GP', 'YDS', 'TD', 'INT', 'CMP', 'ATT', 'QBR', 'RTG', 'REC', 'RYDS'],
  soccer: ['APP', 'G', 'A', 'MIN', 'SH', 'SOT', 'PAS', 'KP', 'TKL'],
  f1: [],
  golf: [],
  ufc: [],
};

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Player not found' : 'Failed to fetch');
  return res.json();
});

export default function PlayerPage() {
  const params = useParams();
  const sport = params.sport as string;
  const playerId = params.id as string;
  const goBack = useSafeBack(SPORT_BACK_ROUTE[sport] || '/');
  const { theme, darkMode } = useTheme();
  const { toggleFavorite, isFavorite } = useFavorites();

  const { data: player, error, isLoading, mutate } = useSWR<PlayerData>(
    sport && playerId ? `/api/player/${sport}/${playerId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const { data: gamelogData } = useSWR(
    sport && playerId && !['f1', 'ufc', 'golf', 'soccer'].includes(sport)
      ? `/api/player/${sport}/${playerId}/gamelog`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const favoriteType = FAVORITE_TYPE_MAP[sport];
  const isFav = favoriteType ? isFavorite(favoriteType, parseInt(playerId)) : false;

  const handleFavoriteToggle = () => {
    if (!favoriteType) return;
    tapMedium();
    toggleFavorite(favoriteType, parseInt(playerId));
  };

  const hasGameLog = !!(gamelogData?.games?.length > 0);
  const hasCareer = !!(player?.careerStats && player.careerStats.length > 0 && player?.statLabels);
  const [statsTab, setStatsTab] = useState<'gamelog' | 'career'>('gamelog');

  useEffect(() => {
    if (!hasGameLog && hasCareer) setStatsTab('career');
  }, [hasGameLog, hasCareer]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
        <p className="mt-4 text-[12px]" style={{ color: theme.textSecondary }}>Loading player...</p>
      </div>
    );
  }

  // Error state
  if (error || !player) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>{error?.message || 'Player not found'}</p>
        <button
          onClick={goBack}
          className={`mt-4 rounded-lg px-4 py-2 text-[12px] ${darkMode ? 'glass-pill' : ''}`}
          style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          Go back
        </button>
      </div>
    );
  }

  const teamPageBase = TEAM_PAGE_MAP[sport];
  const topKeys = TOP_STAT_KEYS[sport] || [];

  // Filter currentStats to show only relevant stats (top 10 or all if no mapping)
  const displayStats = getDisplayStats(player.currentStats, topKeys);

  return (
    <PullToRefresh onRefresh={async () => { await mutate(); }}>
      <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>

        {/* Header */}
        <header
          className="safe-top flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          <button
            onClick={goBack}
            className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
            style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
          >
            <ChevronLeft size={18} style={{ color: theme.text }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold truncate" style={{ color: theme.accent }}>
              {SPORT_DISPLAY[sport] || sport.toUpperCase()}
            </p>
            <p className="text-[13px] truncate" style={{ color: theme.textSecondary }}>
              {player.name}
            </p>
          </div>
          {favoriteType && (
            <button
              onClick={handleFavoriteToggle}
              className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
              style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
            >
              <Star
                size={18}
                fill={isFav ? theme.gold : 'none'}
                style={{ color: isFav ? theme.gold : theme.textSecondary }}
              />
            </button>
          )}
        </header>

        {/* Hero Section */}
        <section
          className={`px-4 py-6 text-center ${darkMode ? 'glass-section' : ''}`}
          style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
        >
          {/* Headshot */}
          <div
            className="mx-auto mb-3 h-[120px] w-[120px] overflow-hidden rounded-full"
            style={{
              border: `3px solid ${player.team?.color ? `#${player.team.color.replace('#', '')}` : theme.accent}`,
            }}
          >
            {player.headshot ? (
              <SafeImage src={player.headshot} alt={player.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ backgroundColor: theme.bgTertiary }} />
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>
            {player.name}
          </h1>

          {/* Team + logo */}
          {player.team && (
            <div className="mt-1 flex items-center justify-center gap-2">
              {player.team.logo && (
                <SafeImage src={player.team.logo} alt={player.team.name} className="h-5 w-5 object-contain" />
              )}
              {teamPageBase ? (
                <Link href={`${teamPageBase}/${player.team.id}`}>
                  <span className="text-[13px]" style={{ color: theme.accent }}>{player.team.name}</span>
                </Link>
              ) : (
                <span className="text-[13px]" style={{ color: theme.textSecondary }}>{player.team.name}</span>
              )}
            </div>
          )}

          {/* Jersey + Position pills */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {player.jersey && (
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-semibold ${darkMode ? 'glass-pill' : ''}`}
                style={darkMode ? undefined : { backgroundColor: 'rgba(255,255,255,0.6)', border: `1px solid ${theme.border}` }}
              >
                <span style={{ color: theme.text }}>#{player.jersey}</span>
              </span>
            )}
            {player.position && (
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-medium ${darkMode ? 'glass-pill' : ''}`}
                style={darkMode ? undefined : { backgroundColor: 'rgba(255,255,255,0.6)', border: `1px solid ${theme.border}` }}
              >
                <span style={{ color: theme.textSecondary }}>{player.position}</span>
              </span>
            )}
          </div>
        </section>

        {/* Bio Pills */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-4 py-3 justify-center" style={{ minWidth: 'max-content' }}>
            {player.age != null && (
              <BioPill label="Age" value={String(player.age)} darkMode={darkMode} theme={theme} />
            )}
            {player.height && (
              <BioPill label="Height" value={player.height} darkMode={darkMode} theme={theme} />
            )}
            {player.weight && (
              <BioPill label="Weight" value={player.weight} darkMode={darkMode} theme={theme} />
            )}
            {player.nationality && (
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${darkMode ? 'glass-pill' : ''}`}
                style={darkMode ? undefined : { backgroundColor: 'rgba(255,255,255,0.6)', border: `1px solid ${theme.border}` }}
              >
                {player.extras?.flagUrl && (
                  <SafeImage src={player.extras.flagUrl} alt={player.nationality} className="h-3.5 w-5 object-contain" />
                )}
                <span className="text-[11px]" style={{ color: theme.textSecondary }}>{player.nationality}</span>
              </div>
            )}
            {player.experience != null && (
              <BioPill label="Exp" value={`${player.experience} yr${player.experience !== 1 ? 's' : ''}`} darkMode={darkMode} theme={theme} />
            )}
            {player.college && (
              <BioPill label="College" value={player.college} darkMode={darkMode} theme={theme} />
            )}
            {player.draft && (
              <BioPill label="Draft" value={player.draft} darkMode={darkMode} theme={theme} />
            )}
            {player.extras?.['constructorName'] && (
              <BioPill label="Constructor" value={player.extras['constructorName']} darkMode={darkMode} theme={theme} />
            )}
            {player.extras?.reach && (
              <BioPill label="Reach" value={player.extras.reach} darkMode={darkMode} theme={theme} />
            )}
            {player.extras?.stance && (
              <BioPill label="Stance" value={player.extras.stance} darkMode={darkMode} theme={theme} />
            )}
            {player.extras?.worldRanking && (
              <BioPill label="World Rank" value={`#${player.extras.worldRanking}`} darkMode={darkMode} theme={theme} />
            )}
          </div>
        </div>

        {/* Current Season Stats */}
        <section className="px-4 py-3">
          <h2 className="text-[13px] font-semibold mb-2" style={{ color: theme.text }}>
            Current Season
          </h2>
          {displayStats && displayStats.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {displayStats.map(({ label, value }) => (
                <div
                  key={label}
                  className={`rounded-lg p-3 text-center ${darkMode ? 'glass-card' : ''}`}
                  style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                >
                  <p className="text-[16px] font-bold" style={{ color: theme.text }}>
                    {value}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: theme.textSecondary }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`rounded-lg py-8 text-center ${darkMode ? 'glass-card' : ''}`}
              style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
            >
              <p className="text-[13px]" style={{ color: theme.textSecondary }}>No stats available</p>
            </div>
          )}
        </section>

        {/* Game Log / Career Stats — tabbed */}
        {(hasGameLog || hasCareer) && (
          <section className="px-4 py-3 pb-6">
            {hasGameLog && hasCareer ? (
              <div className="flex gap-2 mb-3 justify-center">
                {(['gamelog', 'career'] as const).map(tab => {
                  const isActive = statsTab === tab;
                  const label = tab === 'gamelog' ? 'Game Log' : 'Career';
                  return (
                    <button
                      key={tab}
                      onClick={() => { tapLight(); setStatsTab(tab); }}
                      className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${darkMode && !isActive ? 'glass-pill' : ''}`}
                      style={
                        isActive
                          ? darkMode
                            ? { backgroundColor: 'rgba(120, 160, 100, 0.15)', color: theme.text, border: '1px solid rgba(120, 160, 100, 0.2)' }
                            : { backgroundColor: theme.accent, color: '#fff' }
                          : darkMode
                            ? undefined
                            : { backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textSecondary }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <h2 className="text-[13px] font-semibold mb-2" style={{ color: theme.text }}>
                {hasGameLog ? 'Game Log' : 'Career Stats'}
              </h2>
            )}

            {statsTab === 'gamelog' && hasGameLog && (
              <div
                className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-[11px]" style={{ minWidth: Math.max(500, ((gamelogData.labels?.length || 0) + 3) * 55) }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
                        <th className="sticky left-0 z-10 px-3 py-2 text-left font-semibold"
                          style={{
                            color: theme.textSecondary,
                            backgroundColor: darkMode ? 'rgba(10, 15, 10, 0.95)' : theme.bgSecondary,
                          }}
                        >
                          DATE
                        </th>
                        <th className="px-2 py-2 text-left font-semibold" style={{ color: theme.textSecondary }}>
                          OPP
                        </th>
                        <th className="px-2 py-2 text-center font-semibold" style={{ color: theme.textSecondary }}>
                          W/L
                        </th>
                        {(gamelogData.labels || []).map((label: string) => (
                          <th key={label} className="px-2 py-2 text-center font-semibold" style={{ color: theme.textSecondary }}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gamelogData.games.map((game: any, idx: number) => {
                        const d = new Date(game.date);
                        const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
                        const gameLinkBase = GAME_LINK_MAP[sport];
                        return (
                          <tr
                            key={game.eventId}
                            style={{
                              backgroundColor: idx % 2 === 0
                                ? 'transparent'
                                : darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                              borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.04)' : theme.border}`,
                            }}
                          >
                            <td
                              className="sticky left-0 z-10 px-3 py-2 font-medium whitespace-nowrap"
                              style={{
                                color: theme.text,
                                backgroundColor: darkMode
                                  ? (idx % 2 === 0 ? 'rgba(10, 15, 10, 0.95)' : 'rgba(14, 20, 14, 0.95)')
                                  : (idx % 2 === 0 ? theme.bgSecondary : 'rgba(245, 242, 232, 0.98)'),
                              }}
                            >
                              {dateStr}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-left">
                              {gameLinkBase ? (
                                <Link href={`${gameLinkBase}/${game.eventId}`} style={{ color: theme.accent }}>
                                  {game.atVs} {game.opponent.abbreviation}
                                </Link>
                              ) : (
                                <span style={{ color: theme.text }}>{game.atVs} {game.opponent.abbreviation}</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center whitespace-nowrap">
                              <span style={{
                                color: game.result === 'W' ? theme.green : game.result === 'L' ? theme.red : theme.textSecondary,
                                fontWeight: 600,
                              }}>
                                {game.result}
                              </span>
                              {game.score && (
                                <span className="ml-1" style={{ color: theme.textSecondary }}>{game.score}</span>
                              )}
                            </td>
                            {(gamelogData.labels || []).map((label: string) => (
                              <td key={label} className="px-2 py-2 text-center whitespace-nowrap" style={{ color: theme.text }}>
                                {game.stats?.[label] ?? '-'}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {statsTab === 'career' && hasCareer && (
              <div
                className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-[11px]" style={{ minWidth: Math.max(400, player.statLabels!.length * 55) }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
                        <th className="sticky left-0 z-10 px-3 py-2 text-left font-semibold"
                          style={{
                            color: theme.textSecondary,
                            backgroundColor: darkMode ? 'rgba(10, 15, 10, 0.95)' : theme.bgSecondary,
                          }}
                        >
                          Season
                        </th>
                        {player.statLabels!.map(label => (
                          <th key={label} className="px-2 py-2 text-center font-semibold" style={{ color: theme.textSecondary }}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {player.careerStats!.map((season, idx) => (
                        <tr
                          key={season.season}
                          style={{
                            backgroundColor: idx % 2 === 0
                              ? 'transparent'
                              : darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                            borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.04)' : theme.border}`,
                          }}
                        >
                          <td
                            className="sticky left-0 z-10 px-3 py-2 font-medium whitespace-nowrap"
                            style={{
                              color: theme.text,
                              backgroundColor: darkMode
                                ? (idx % 2 === 0 ? 'rgba(10, 15, 10, 0.95)' : 'rgba(14, 20, 14, 0.95)')
                                : (idx % 2 === 0 ? theme.bgSecondary : 'rgba(245, 242, 232, 0.98)'),
                            }}
                          >
                            {season.season}
                          </td>
                          {player.statLabels!.map(label => (
                            <td key={label} className="px-2 py-2 text-center whitespace-nowrap" style={{ color: theme.text }}>
                              {season.stats[label] ?? '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </PullToRefresh>
  );
}

// Bio pill sub-component
function BioPill({ label, value, darkMode, theme }: {
  label: string;
  value: string;
  darkMode: boolean;
  theme: any;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-full px-3 py-1.5 ${darkMode ? 'glass-pill' : ''}`}
      style={darkMode ? undefined : { backgroundColor: 'rgba(255,255,255,0.6)', border: `1px solid ${theme.border}` }}
    >
      <span className="text-[10px]" style={{ color: theme.textSecondary }}>{label}</span>
      <span className="text-[11px] font-medium" style={{ color: theme.text }}>{value}</span>
    </div>
  );
}

// Helper to pick the most relevant stats for display
function getDisplayStats(
  currentStats: Record<string, string | number> | null,
  topKeys: string[]
): Array<{ label: string; value: string | number }> | null {
  if (!currentStats) return null;

  const entries = Object.entries(currentStats);
  if (entries.length === 0) return null;

  // If we have a preferred order, use it; otherwise show first 9
  if (topKeys.length > 0) {
    const ordered: Array<{ label: string; value: string | number }> = [];
    for (const key of topKeys) {
      if (currentStats[key] !== undefined) {
        ordered.push({ label: key, value: currentStats[key] });
      }
    }
    // Add any remaining stats not in topKeys (up to 9 total)
    if (ordered.length < 9) {
      for (const [key, value] of entries) {
        if (!topKeys.includes(key) && !key.startsWith('P_') && ordered.length < 9) {
          ordered.push({ label: key, value });
        }
      }
    }
    return ordered.length > 0 ? ordered : null;
  }

  // No preferred keys — show first 9
  return entries.slice(0, 9).map(([label, value]) => ({ label, value }));
}
