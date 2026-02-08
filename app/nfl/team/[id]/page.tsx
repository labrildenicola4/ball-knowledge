'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Sun, Moon, TrendingUp, Trophy, Heart, BarChart3, Users } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { NFLTeamInfo, NFLTeamScheduleGame, NFLStandings, NFLStanding, NFLPlayer } from '@/lib/types/nfl';
import { createBrowserClient } from '@supabase/ssr';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface RecentGame {
  id: string;
  win: boolean;
  score: string;
  opponent: string;
  isHome: boolean;
}

interface ExtendedTeamInfo extends NFLTeamInfo {
  schedule: NFLTeamScheduleGame[];
  standings: NFLStandings;
  recentForm: RecentGame[];
  roster: NFLPlayer[];
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Team not found' : 'Failed to fetch');
  return res.json();
});

export default function NFLTeamPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const teamId = params.id as string;

  const [activeTab, setActiveTab] = useState<'schedule' | 'roster' | 'stats' | 'standings'>('schedule');
  const [selectedConference, setSelectedConference] = useState<'AFC' | 'NFC'>('AFC');

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
          .eq('favorite_type', 'nfl_team')
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
        .eq('favorite_type', 'nfl_team')
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
          favorite_type: 'nfl_team',
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
    teamId ? `/api/nfl/team/${teamId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // Fetch team stats when Stats tab is active
  const { data: teamStats } = useSWR<{
    passing: Array<{ player: { id: string; name: string; headshot: string; position: string }; displayValue: string; value: number }>;
    rushing: Array<{ player: { id: string; name: string; headshot: string; position: string }; displayValue: string; value: number }>;
    receiving: Array<{ player: { id: string; name: string; headshot: string; position: string }; displayValue: string; value: number }>;
    defense: Array<{ player: { id: string; name: string; headshot: string; position: string }; displayValue: string; value: number }>;
  }>(
    activeTab === 'stats' && teamId ? `/api/nfl/team/${teamId}/stats` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Set selected conference based on team's conference
  useEffect(() => {
    if (teamInfo?.conference) {
      const conf = teamInfo.conference.includes('AFC') ? 'AFC' : 'NFC';
      setSelectedConference(conf);
    }
  }, [teamInfo?.conference]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
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
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <p className="text-[14px]" style={{ color: theme.red }}>{error?.message || 'Team not found'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg px-4 py-2 text-[12px]"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          Go back
        </button>
      </div>
    );
  }

  const { team, conference, division, record, venue, schedule, standings, recentForm, roster } = teamInfo;

  // Parse record for display (e.g., "10-7" -> wins/losses)
  const recordParts = record?.split('-') || [];
  const wins = parseInt(recordParts[0]) || 0;
  const losses = parseInt(recordParts[1]) || 0;

  // Find team's standing in their division
  const teamStanding = standings?.conferences
    ?.flatMap(c => c.divisions)
    ?.flatMap(d => d.teams)
    ?.find(t => t.team.id === teamId);

  // Get current conference for standings
  const currentConf = standings?.conferences?.find(c =>
    c.name.toUpperCase().includes(selectedConference)
  );

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: theme.bg }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>NFL</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>{division || conference}</p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      {/* Team Hero */}
      <section
        className="px-4 py-6 text-center"
        style={{ backgroundColor: team.color ? `${team.color}20` : theme.bgSecondary }}
      >
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
          {division || conference}
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
          {teamStanding && (
            <>
              <div className="w-px h-10" style={{ backgroundColor: theme.border }} />
              <div className="text-center">
                <p className="text-xl font-mono font-bold" style={{ color: theme.text }}>
                  {teamStanding.divisionWins}-{teamStanding.divisionLosses}
                </p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  Division
                </p>
              </div>
              <div className="w-px h-10" style={{ backgroundColor: theme.border }} />
              <div className="text-center">
                <p className="text-xl font-mono font-bold" style={{ color: theme.text }}>
                  {teamStanding.conferenceWins}-{teamStanding.conferenceLosses}
                </p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  Conference
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

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: `1px solid ${theme.border}` }}>
        {[
          { key: 'schedule', label: 'Schedule', icon: TrendingUp },
          { key: 'roster', label: 'Roster', icon: Users },
          { key: 'stats', label: 'Stats', icon: BarChart3 },
          { key: 'standings', label: 'Standings', icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-medium transition-colors"
              style={{
                color: activeTab === tab.key ? theme.accent : theme.textSecondary,
                borderBottom: activeTab === tab.key ? `2px solid ${theme.accent}` : '2px solid transparent',
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
                        className="rounded-xl overflow-hidden"
                        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                      >
                        {upcomingGames.map((game, index) => (
                          <Link
                            key={game.id}
                            href={`/nfl/game/${game.id}`}
                            className="flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
                            style={{
                              borderTop: index === 0 ? 'none' : `1px solid ${theme.border}`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-medium w-14" style={{ color: theme.textSecondary }}>
                                {game.date}
                              </span>
                              {game.week && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}>
                                  {typeof game.week === 'string' ? game.week : `Wk ${game.week}`}
                                </span>
                              )}
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
                        className="rounded-xl overflow-hidden"
                        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                      >
                        {completedGames.map((game, index) => (
                          <Link
                            key={game.id}
                            href={`/nfl/game/${game.id}`}
                            className="flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
                            style={{
                              borderTop: index === 0 ? 'none' : `1px solid ${theme.border}`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-medium w-14" style={{ color: theme.textSecondary }}>
                                {game.date}
                              </span>
                              {game.week && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}>
                                  {typeof game.week === 'string' ? game.week : `Wk ${game.week}`}
                                </span>
                              )}
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
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
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
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                {roster.map((player, idx) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: idx > 0 ? `1px solid ${theme.border}` : 'none' }}
                  >
                    {player.headshot ? (
                      <img src={player.headshot} alt={player.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}>
                        {player.jersey || '#'}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: theme.text }}>{player.name}</p>
                      <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                        #{player.jersey} · {player.position}
                        {player.experience && ` · ${player.experience}`}
                        {player.college && ` · ${player.college}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: theme.textSecondary }}>
                No roster data available
              </div>
            )}
          </section>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <section className="px-4 py-4">
            {teamStats ? (
              <div className="space-y-4">
                {/* Passing Yards */}
                {teamStats.passing.length > 0 && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    <div
                      className="px-4 py-2 text-[10px] font-semibold uppercase"
                      style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                    >
                      Passing Yards
                    </div>
                    {teamStats.passing.map((player, index) => (
                      <div
                        key={player.player.id || index}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderTop: index === 0 ? 'none' : `1px solid ${theme.border}` }}
                      >
                        <span
                          className="w-5 text-center text-[11px] font-bold"
                          style={{ color: index === 0 ? theme.gold : theme.textSecondary }}
                        >
                          {index + 1}
                        </span>
                        {player.player.headshot && (
                          <img
                            src={player.player.headshot}
                            alt={player.player.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: theme.text }}>
                            {player.player.name}
                          </p>
                          <p className="text-[10px]" style={{ color: theme.textSecondary }}>
                            {player.player.position}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[14px] font-mono font-semibold" style={{ color: theme.accent }}>
                            {player.value?.toLocaleString() || '0'}
                          </span>
                          <p className="text-[9px] max-w-[120px] truncate" style={{ color: theme.textSecondary }}>
                            {player.displayValue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rushing Yards */}
                {teamStats.rushing.length > 0 && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    <div
                      className="px-4 py-2 text-[10px] font-semibold uppercase"
                      style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                    >
                      Rushing Yards
                    </div>
                    {teamStats.rushing.map((player, index) => (
                      <div
                        key={player.player.id || index}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderTop: index === 0 ? 'none' : `1px solid ${theme.border}` }}
                      >
                        <span
                          className="w-5 text-center text-[11px] font-bold"
                          style={{ color: index === 0 ? theme.gold : theme.textSecondary }}
                        >
                          {index + 1}
                        </span>
                        {player.player.headshot && (
                          <img
                            src={player.player.headshot}
                            alt={player.player.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: theme.text }}>
                            {player.player.name}
                          </p>
                          <p className="text-[10px]" style={{ color: theme.textSecondary }}>
                            {player.player.position}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[14px] font-mono font-semibold" style={{ color: theme.accent }}>
                            {player.value?.toLocaleString() || '0'}
                          </span>
                          <p className="text-[9px] max-w-[120px] truncate" style={{ color: theme.textSecondary }}>
                            {player.displayValue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Receiving Yards */}
                {teamStats.receiving.length > 0 && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    <div
                      className="px-4 py-2 text-[10px] font-semibold uppercase"
                      style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                    >
                      Receiving Yards
                    </div>
                    {teamStats.receiving.map((player, index) => (
                      <div
                        key={player.player.id || index}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderTop: index === 0 ? 'none' : `1px solid ${theme.border}` }}
                      >
                        <span
                          className="w-5 text-center text-[11px] font-bold"
                          style={{ color: index === 0 ? theme.gold : theme.textSecondary }}
                        >
                          {index + 1}
                        </span>
                        {player.player.headshot && (
                          <img
                            src={player.player.headshot}
                            alt={player.player.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: theme.text }}>
                            {player.player.name}
                          </p>
                          <p className="text-[10px]" style={{ color: theme.textSecondary }}>
                            {player.player.position}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[14px] font-mono font-semibold" style={{ color: theme.accent }}>
                            {player.value?.toLocaleString() || '0'}
                          </span>
                          <p className="text-[9px] max-w-[120px] truncate" style={{ color: theme.textSecondary }}>
                            {player.displayValue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tackles */}
                {teamStats.defense.length > 0 && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    <div
                      className="px-4 py-2 text-[10px] font-semibold uppercase"
                      style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                    >
                      Total Tackles
                    </div>
                    {teamStats.defense.map((player, index) => (
                      <div
                        key={player.player.id || index}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderTop: index === 0 ? 'none' : `1px solid ${theme.border}` }}
                      >
                        <span
                          className="w-5 text-center text-[11px] font-bold"
                          style={{ color: index === 0 ? theme.gold : theme.textSecondary }}
                        >
                          {index + 1}
                        </span>
                        {player.player.headshot && (
                          <img
                            src={player.player.headshot}
                            alt={player.player.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: theme.text }}>
                            {player.player.name}
                          </p>
                          <p className="text-[10px]" style={{ color: theme.textSecondary }}>
                            {player.player.position}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[14px] font-mono font-semibold" style={{ color: theme.accent }}>
                            {player.value?.toLocaleString() || '0'}
                          </span>
                          <p className="text-[9px] max-w-[120px] truncate" style={{ color: theme.textSecondary }}>
                            {player.displayValue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state if no stats */}
                {teamStats.passing.length === 0 && teamStats.rushing.length === 0 &&
                 teamStats.receiving.length === 0 && teamStats.defense.length === 0 && (
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                  >
                    <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                      No stats available for this team
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div
                  className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                  style={{ color: theme.accent }}
                />
              </div>
            )}
          </section>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && standings && (
          <section className="px-4 py-4">
            {/* Conference Toggle */}
            <div className="flex gap-2 mb-4">
              {(['AFC', 'NFC'] as const).map((conf) => (
                <button
                  key={conf}
                  onClick={() => setSelectedConference(conf)}
                  className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors"
                  style={{
                    backgroundColor: selectedConference === conf ? theme.accent : theme.bgSecondary,
                    color: selectedConference === conf ? '#fff' : theme.textSecondary,
                  }}
                >
                  {conf}
                </button>
              ))}
            </div>

            {/* Divisions */}
            {currentConf?.divisions.map((division) => (
              <div
                key={division.id}
                className="rounded-xl overflow-hidden mb-4"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                {/* Division Header */}
                <div
                  className="px-4 py-2 text-[10px] font-semibold uppercase"
                  style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
                >
                  {division.name.replace('American Football Conference ', '').replace('National Football Conference ', '')}
                </div>

                {/* Column Headers */}
                <div
                  className="flex items-center px-4 py-2 text-[9px] font-semibold uppercase"
                  style={{ color: theme.textSecondary, borderBottom: `1px solid ${theme.border}` }}
                >
                  <span className="flex-1 pl-2">Team</span>
                  <span className="w-8 text-center">W</span>
                  <span className="w-8 text-center">L</span>
                  <span className="w-8 text-center">T</span>
                  <span className="w-12 text-center">PCT</span>
                  <span className="w-10 text-center">PF</span>
                  <span className="w-10 text-center">PA</span>
                </div>

                {/* Teams */}
                {division.teams.map((standingTeam, index) => {
                  const isCurrentTeam = standingTeam.team.id === teamId;
                  const isDivisionLeader = index === 0;
                  // NFL playoffs: 7 teams per conference (4 division winners + 3 wild cards)
                  const isPlayoffTeam = standingTeam.seed !== undefined && standingTeam.seed >= 1 && standingTeam.seed <= 7;

                  return (
                    <div key={standingTeam.team.id}>
                      <Link
                        href={`/nfl/team/${standingTeam.team.id}`}
                        className="flex items-center px-4 py-2.5 hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: isCurrentTeam ? `${theme.accent}15` : 'transparent',
                          borderTop: index === 0 ? 'none' : `1px solid ${theme.border}`,
                        }}
                      >
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          {/* Playoff Seed Badge */}
                          {isPlayoffTeam && (
                            <span
                              className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                              style={{ backgroundColor: theme.green, color: '#fff' }}
                            >
                              {standingTeam.seed}
                            </span>
                          )}
                          <img
                            src={standingTeam.team.logo}
                            alt={standingTeam.team.name}
                            className="h-5 w-5 object-contain logo-glow flex-shrink-0"
                          />
                          <span
                            className="text-[12px] font-medium truncate"
                            style={{ color: isCurrentTeam ? theme.accent : theme.text }}
                          >
                            {standingTeam.team.abbreviation}
                          </span>
                        </div>
                        <span className="w-8 text-center text-[12px] font-mono" style={{ color: theme.text }}>
                          {standingTeam.wins}
                        </span>
                        <span className="w-8 text-center text-[12px] font-mono" style={{ color: theme.text }}>
                          {standingTeam.losses}
                        </span>
                        <span className="w-8 text-center text-[12px] font-mono" style={{ color: theme.textSecondary }}>
                          {standingTeam.ties || 0}
                        </span>
                        <span className="w-12 text-center text-[12px] font-mono" style={{ color: theme.text }}>
                          {standingTeam.pct}
                        </span>
                        <span className="w-10 text-center text-[11px] font-mono" style={{ color: theme.textSecondary }}>
                          {standingTeam.pointsFor}
                        </span>
                        <span className="w-10 text-center text-[11px] font-mono" style={{ color: theme.textSecondary }}>
                          {standingTeam.pointsAgainst}
                        </span>
                      </Link>

                      {/* Division Leader Line */}
                      {isDivisionLeader && division.teams.length > 1 && (
                        <div className="flex items-center gap-2 px-4 py-1" style={{ backgroundColor: theme.bgTertiary }}>
                          <div className="flex-1 h-px" style={{ backgroundColor: theme.green }} />
                          <span className="text-[8px] uppercase font-semibold" style={{ color: theme.green }}>
                            Division Leader
                          </span>
                          <div className="flex-1 h-px" style={{ backgroundColor: theme.green }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div
              className="flex items-center justify-center gap-4 py-2 text-[9px]"
            >
              <div className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ backgroundColor: theme.green, color: '#fff' }}
                >
                  #
                </div>
                <span style={{ color: theme.textSecondary }}>Playoff Seed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.green }} />
                <span style={{ color: theme.textSecondary }}>Division Leader</span>
              </div>
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
