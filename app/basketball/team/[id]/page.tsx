'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Sun, Moon, TrendingUp, Users, Trophy, Heart, BarChart3 } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { ConferenceStandingsTable, ConferenceStandingsTeam } from '@/components/ConferenceStandingsTable';
import { BasketballTeamInfo, BasketballRanking } from '@/lib/types/basketball';
import { createBrowserClient } from '@supabase/ssr';
import { User as SupabaseUser } from '@supabase/supabase-js';
import {
  CollegeBasketballPlayer,
  CollegeBasketballTeamSeasonStats,
  CollegeBasketballGameResult,
  CollegeBasketballConferenceStandings,
} from '@/lib/api-espn-basketball';

interface ExtendedTeamInfo extends BasketballTeamInfo {
  roster: CollegeBasketballPlayer[];
  stats: CollegeBasketballTeamSeasonStats | null;
  recentForm: CollegeBasketballGameResult[];
  standings: CollegeBasketballConferenceStandings | null;
  top25: BasketballRanking[];
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Team not found' : 'Failed to fetch');
  return res.json();
});

export default function BasketballTeamPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const teamId = params.id as string;

  const [activeTab, setActiveTab] = useState<'schedule' | 'roster' | 'standings'>('schedule');
  const [standingsView, setStandingsView] = useState<'conference' | 'top25'>('conference');

  // Favorites state
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check auth and load favorite status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user && teamId) {
        const { data } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('favorite_type', 'ncaab_team')
          .eq('favorite_id', Number(teamId))
          .maybeSingle();

        setIsFavorite(!!data);
      }
    };

    checkAuth();
  }, [teamId]);

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!user) {
      alert('Please sign in to save favorites');
      return;
    }

    if (isFavorite) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('favorite_type', 'ncaab_team')
        .eq('favorite_id', Number(teamId));

      if (error) {
        console.error('Error removing favorite:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('user_favorites')
        .upsert({
          user_id: user.id,
          favorite_type: 'ncaab_team',
          favorite_id: Number(teamId),
        }, {
          onConflict: 'user_id,favorite_type,favorite_id',
        });

      if (error) {
        console.error('Error adding favorite:', error);
        return;
      }
    }

    setIsFavorite(!isFavorite);
  };

  const { data: teamInfo, error, isLoading } = useSWR<ExtendedTeamInfo>(
    teamId ? `/api/basketball/team/${teamId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
          style={{ color: theme.accent }}
        />
        <p className="mt-4 text-[12px]" style={{ color: theme.textSecondary }}>Loading team...</p>
      </div>
    );
  }

  if (error || !teamInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>{error?.message || 'Team not found'}</p>
        <button
          onClick={() => router.back()}
          className={`mt-4 rounded-lg px-4 py-2 text-[12px] ${darkMode ? 'glass-pill' : ''}`}
          style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          Go back
        </button>
      </div>
    );
  }

  const { team, conference, record, conferenceRecord, rank, schedule, venue, roster, stats, recentForm, standings, top25 } = teamInfo;

  // Find team's position in standings
  const teamStanding = standings?.teams?.find(t => t.id === teamId);
  const teamRank = standings?.teams?.findIndex(t => t.id === teamId);

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>NCAA Basketball</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>{conference.name}</p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Team Hero */}
      <section
        className={`px-4 py-6 text-center ${darkMode ? 'glass-section' : ''}`}
        style={darkMode ? (team.color ? { backgroundColor: `${team.color}20` } : undefined) : { backgroundColor: team.color ? `${team.color}20` : theme.bgSecondary }}
      >
        {rank && rank <= 25 && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 mb-3 text-[11px] font-bold"
            style={{ backgroundColor: theme.gold, color: '#000' }}
          >
            <Trophy size={12} />
            #{rank} Ranked
          </span>
        )}

        <div className="mx-auto mb-3 h-20 w-20">
          {team.logo ? (
            <img src={team.logo} alt={team.name} className="h-full w-full object-contain logo-glow" />
          ) : (
            <div
              className="h-full w-full rounded-full"
              style={{ backgroundColor: team.color || theme.bgTertiary }}
            />
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-[26px]" />
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>
            {team.displayName}
          </h1>
          <button onClick={toggleFavorite} className="p-1">
            <Heart
              size={18}
              fill={isFavorite ? '#d68b94' : 'none'}
              style={{ color: '#d68b94' }}
            />
          </button>
        </div>

        <p className="text-sm mb-3" style={{ color: theme.textSecondary }}>
          {conference.shortName}
        </p>

        {/* Recent Form */}
        {recentForm && recentForm.length > 0 && (
          <div className="flex justify-center gap-1.5 mb-4">
            {recentForm.map((game) => (
              <div
                key={game.id}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: game.win ? theme.green : theme.red,
                  color: '#fff',
                }}
                title={`${game.isHome ? 'vs' : '@'} ${game.opponent} ${game.score}`}
              >
                {game.win ? 'W' : 'L'}
              </div>
            ))}
          </div>
        )}

        {/* Records */}
        <div className="flex justify-center gap-4">
          <div className="text-center">
            <p className="text-xl font-mono font-bold" style={{ color: theme.text }}>
              {record || '-'}
            </p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Overall
            </p>
          </div>
          <div className="w-px h-10" style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border }} />
          <div className="text-center">
            <p className="text-xl font-mono font-bold" style={{ color: theme.text }}>
              {conferenceRecord || (teamStanding ? `${teamStanding.conferenceWins}-${teamStanding.conferenceLosses}` : '-')}
            </p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Conference
            </p>
          </div>
          {teamRank !== undefined && teamRank >= 0 && (
            <>
              <div className="w-px h-10" style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border }} />
              <div className="text-center">
                <p className="text-xl font-mono font-bold" style={{ color: theme.text }}>
                  #{teamRank + 1}
                </p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  In Conf.
                </p>
              </div>
            </>
          )}
        </div>

        {venue && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <MapPin size={12} style={{ color: theme.textSecondary }} />
            <span className="text-[11px]" style={{ color: theme.textSecondary }}>
              {venue.name}, {venue.city}
            </span>
          </div>
        )}
      </section>

      {/* Team Stats */}
      {stats && (
        <section className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} style={{ color: theme.accent }} />
            <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Team Stats
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'PPG', value: stats.pointsPerGame.value },
              { label: 'RPG', value: stats.reboundsPerGame.value },
              { label: 'APG', value: stats.assistsPerGame.value },
              { label: 'FG%', value: stats.fieldGoalPct.value },
              { label: '3P%', value: stats.threePointPct.value },
              { label: 'FT%', value: stats.freeThrowPct.value },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-lg p-2 text-center ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary }}
              >
                <p className="text-lg font-mono font-bold" style={{ color: theme.text }}>
                  {stat.value}
                </p>
                <p className="text-[9px] uppercase" style={{ color: theme.textSecondary }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="flex gap-2 py-3 px-4">
        {[
          { key: 'schedule', label: 'Schedule', icon: TrendingUp },
          { key: 'roster', label: 'Roster', icon: Users },
          { key: 'standings', label: 'Standings', icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors ${darkMode ? (activeTab === tab.key ? 'glass-pill-active' : 'glass-pill') : ''}`}
              style={{
                color: activeTab === tab.key ? theme.accent : theme.textSecondary,
                borderBottom: darkMode ? 'none' : (activeTab === tab.key ? `2px solid ${theme.accent}` : '2px solid transparent'),
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <section className="px-4 py-4">
            {schedule && schedule.length > 0 ? (
              <>
                {/* Upcoming Games */}
                {(() => {
                  const upcomingGames = schedule.filter(g => g.status !== 'final');
                  if (upcomingGames.length === 0) return null;
                  return (
                    <div className="mb-4">
                      <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textSecondary }}>
                        Upcoming ({upcomingGames.length})
                      </h3>
                      <div
                        className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                      >
                        {upcomingGames.slice(0, 10).map((game, index) => (
                          <Link
                            key={game.id}
                            href={`/basketball/game/${game.id}`}
                            className="flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
                            style={{
                              borderTop: index === 0 ? 'none' : `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-medium w-14" style={{ color: theme.textSecondary }}>
                                {game.date}
                              </span>
                              <span className="text-[10px] w-4" style={{ color: theme.textSecondary }}>
                                {game.isHome ? 'vs' : '@'}
                              </span>
                              {game.opponent.logo && (
                                <img src={game.opponent.logo} alt={game.opponent.name} className="h-5 w-5 object-contain logo-glow" />
                              )}
                              <span className="text-sm font-medium" style={{ color: theme.text }}>
                                {game.opponent.shortDisplayName || game.opponent.name}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Completed Games */}
                {(() => {
                  const completedGames = schedule.filter(g => g.status === 'final').reverse();
                  if (completedGames.length === 0) return null;
                  return (
                    <div>
                      <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textSecondary }}>
                        Completed ({completedGames.length})
                      </h3>
                      <div
                        className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                        style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                      >
                        {completedGames.slice(0, 10).map((game, index) => (
                          <Link
                            key={game.id}
                            href={`/basketball/game/${game.id}`}
                            className="flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
                            style={{
                              borderTop: index === 0 ? 'none' : `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-medium w-14" style={{ color: theme.textSecondary }}>
                                {game.date}
                              </span>
                              <span className="text-[10px] w-4" style={{ color: theme.textSecondary }}>
                                {game.isHome ? 'vs' : '@'}
                              </span>
                              {game.opponent.logo && (
                                <img src={game.opponent.logo} alt={game.opponent.name} className="h-5 w-5 object-contain logo-glow" />
                              )}
                              <span className="text-sm font-medium" style={{ color: theme.text }}>
                                {game.opponent.shortDisplayName || game.opponent.name}
                              </span>
                            </div>
                            {game.result && (
                              <span
                                className="text-sm font-mono"
                                style={{ color: game.result.win ? theme.green : theme.red }}
                              >
                                {game.result.win ? 'W' : 'L'} {game.result.score}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div
                className={`rounded-xl p-6 text-center ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                  No games scheduled
                </p>
              </div>
            )}
          </section>
        )}

        {/* Roster Tab */}
        {activeTab === 'roster' && (
          <section className="px-4 py-4">
            {roster && roster.length > 0 ? (
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="inline-block min-w-full">
                  {/* Stats Header */}
                  <div
                    className="flex items-center px-2 py-2 rounded-t-xl text-[8px] font-semibold uppercase whitespace-nowrap"
                    style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary, color: theme.textSecondary }}
                  >
                    <span className="w-[120px] flex-shrink-0">Player</span>
                    <span className="w-7 text-center flex-shrink-0">GP</span>
                    <span className="w-9 text-center flex-shrink-0">PPG</span>
                    <span className="w-8 text-center flex-shrink-0">RPG</span>
                    <span className="w-8 text-center flex-shrink-0">APG</span>
                    <span className="w-10 text-center flex-shrink-0">FG%</span>
                    <span className="w-10 text-center flex-shrink-0">3P%</span>
                  </div>

                  <div
                    className={`rounded-b-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                    style={darkMode ? { borderTop: 'none' } : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderTop: 'none' }}
                  >
                    {roster.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center px-2 py-2 whitespace-nowrap"
                        style={{
                          borderTop: index === 0 ? 'none' : `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                        }}
                      >
                        {/* Player Info */}
                        <div className="w-[120px] flex-shrink-0 flex items-center gap-1.5">
                          <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}>
                            {player.headshot ? (
                              <img src={player.headshot} alt={player.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[8px]" style={{ color: theme.textSecondary }}>
                                #{player.jersey}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <p className="text-[10px] font-medium truncate" style={{ color: theme.text }}>
                              {player.name}
                            </p>
                            <p className="text-[8px]" style={{ color: theme.textSecondary }}>
                              {player.position || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        {player.stats ? (
                          <>
                            <span className="w-7 text-center text-[10px] font-mono flex-shrink-0" style={{ color: theme.textSecondary }}>
                              {player.stats.gamesPlayed}
                            </span>
                            <span className="w-9 text-center text-[10px] font-mono font-semibold flex-shrink-0" style={{ color: theme.accent }}>
                              {player.stats.pointsPerGame.toFixed(1)}
                            </span>
                            <span className="w-8 text-center text-[10px] font-mono flex-shrink-0" style={{ color: theme.text }}>
                              {player.stats.reboundsPerGame.toFixed(1)}
                            </span>
                            <span className="w-8 text-center text-[10px] font-mono flex-shrink-0" style={{ color: theme.text }}>
                              {player.stats.assistsPerGame.toFixed(1)}
                            </span>
                            <span className="w-10 text-center text-[10px] font-mono flex-shrink-0" style={{ color: theme.text }}>
                              {player.stats.fieldGoalPct.toFixed(1)}
                            </span>
                            <span className="w-10 text-center text-[10px] font-mono flex-shrink-0" style={{ color: theme.text }}>
                              {player.stats.threePointPct.toFixed(1)}
                            </span>
                          </>
                        ) : (
                          <span className="flex-1 text-center text-[9px]" style={{ color: theme.textSecondary }}>
                            No stats
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`rounded-xl p-6 text-center ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                  Roster not available
                </p>
              </div>
            )}
          </section>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <section className="px-4 py-4">
            {/* Standings Toggle */}
            <div className="flex gap-2 mb-4">
              {[
                { key: 'conference', label: conference.shortName || 'Conference' },
                { key: 'top25', label: 'AP Top 25' },
              ].map((view) => (
                <button
                  key={view.key}
                  onClick={() => setStandingsView(view.key as 'conference' | 'top25')}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors ${darkMode ? (standingsView === view.key ? '' : 'glass-pill') : ''}`}
                  style={{
                    backgroundColor: darkMode
                      ? (standingsView === view.key ? theme.accent : undefined)
                      : (standingsView === view.key ? theme.accent : theme.bgSecondary),
                    color: standingsView === view.key ? '#fff' : theme.textSecondary,
                  }}
                >
                  {view.label}
                </button>
              ))}
            </div>

            {/* Conference Standings */}
            {standingsView === 'conference' && (
              <ConferenceStandingsTable
                teams={(standings?.teams || []).map((t): ConferenceStandingsTeam => ({
                  id: t.id,
                  name: t.name,
                  shortName: t.abbreviation,
                  logo: t.logo,
                  conferenceWins: t.conferenceWins || 0,
                  conferenceLosses: t.conferenceLosses || 0,
                  overallWins: t.overallWins || 0,
                  overallLosses: t.overallLosses || 0,
                }))}
                sport="basketball"
                highlightTeamId={teamId}
                emptyMessage="Conference standings not available"
              />
            )}

            {/* Top 25 Rankings */}
            {standingsView === 'top25' && (
              <>
                {top25 && top25.length > 0 ? (
                  <div
                    className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                    style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    {/* Header */}
                    <div
                      className="flex items-center px-4 py-2 text-[9px] font-semibold uppercase"
                      style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary, color: theme.textSecondary }}
                    >
                      <span className="w-6">#</span>
                      <span className="flex-1">Team</span>
                      <span className="w-16 text-center">Record</span>
                      <span className="w-10 text-center">Trend</span>
                    </div>

                    {/* Teams */}
                    {top25.map((ranking, index) => {
                      const isCurrentTeam = ranking.team.id === teamId;
                      const trendDiff = (ranking.previousRank ?? ranking.rank) - ranking.rank;

                      return (
                        <Link
                          key={ranking.team.id}
                          href={`/basketball/team/${ranking.team.id}`}
                          className="flex items-center px-4 py-2.5 hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: isCurrentTeam ? `${theme.accent}15` : 'transparent',
                            borderTop: index === 0 ? 'none' : `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                          }}
                        >
                          <span
                            className="w-6 text-[11px] font-mono font-bold"
                            style={{ color: theme.gold }}
                          >
                            {ranking.rank}
                          </span>
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <img
                              src={ranking.team.logo}
                              alt={ranking.team.name}
                              className="h-5 w-5 object-contain logo-glow flex-shrink-0"
                            />
                            <span
                              className="text-[12px] font-medium truncate"
                              style={{ color: isCurrentTeam ? theme.accent : theme.text }}
                            >
                              {ranking.team.shortDisplayName || ranking.team.name}
                            </span>
                          </div>
                          <span className="w-16 text-center text-[12px] font-mono" style={{ color: theme.text }}>
                            {ranking.record}
                          </span>
                          <span
                            className="w-10 text-center text-[11px] font-mono"
                            style={{
                              color: ranking.trend === 'up' ? theme.green : ranking.trend === 'down' ? theme.red : theme.textSecondary,
                            }}
                          >
                            {ranking.trend === 'up' && trendDiff > 0 ? `+${trendDiff}` : ranking.trend === 'down' && trendDiff < 0 ? trendDiff : '-'}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className={`rounded-xl p-6 text-center ${darkMode ? 'glass-card' : ''}`}
                    style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                      AP Top 25 rankings not available
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
