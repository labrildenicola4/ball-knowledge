'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSafeBack } from '@/lib/use-safe-back';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Sun, Moon, TrendingUp, Users, Trophy, Heart } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { NHLTeamInfo, NHLStandings, NHLPlayer } from '@/lib/types/nhl';
import { createBrowserClient } from '@supabase/ssr';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { SafeImage } from '@/components/SafeImage';

interface ExtendedNHLTeamInfo extends NHLTeamInfo {
  roster: NHLPlayer[];
  standings: NHLStandings | null;
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Team not found' : 'Failed to fetch');
  return res.json();
});

export default function NHLTeamPage() {
  const params = useParams();
  const goBack = useSafeBack('/nhl');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const teamId = params.id as string;

  const [activeTab, setActiveTab] = useState<'schedule' | 'roster' | 'standings'>('schedule');
  const [selectedConference, setSelectedConference] = useState<'Eastern' | 'Western'>('Eastern');

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
          .eq('favorite_type', 'nhl_team')
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
        .eq('favorite_type', 'nhl_team')
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
          favorite_type: 'nhl_team',
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

  const { data: teamInfo, error, isLoading } = useSWR<ExtendedNHLTeamInfo>(
    teamId ? `/api/nhl/team/${teamId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // Determine which conference the team is in
  useEffect(() => {
    if (teamInfo?.standings) {
      const teamConf = teamInfo.standings.conferences?.find(conf =>
        conf.divisions.some(div =>
          div.teams.some(t => t.team.id === teamId)
        )
      );
      if (teamConf) {
        const confName = teamConf.name.includes('Eastern') ? 'Eastern' : 'Western';
        setSelectedConference(confName);
      }
    }
  }, [teamInfo?.standings, teamId]);

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
          onClick={goBack}
          className={`mt-4 rounded-lg px-4 py-2 text-[12px] ${darkMode ? 'glass-pill' : ''}`}
          style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          Go back
        </button>
      </div>
    );
  }

  const { team, conference, division, record, roster, schedule, venue, standings } = teamInfo;

  // Find team's standing across all divisions in standings
  const teamStanding = standings?.conferences
    ?.flatMap(c => c.divisions)
    ?.flatMap(d => d.teams)
    ?.find(t => t.team.id === teamId);

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}>
      {/* Header */}
      <header className="safe-top flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
        <button
          onClick={goBack}
          className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
        >
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>NHL</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>{conference || division}</p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
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
        <div className="mx-auto mb-3 h-20 w-20">
          {team.logo ? (
            <SafeImage src={team.logo} alt={team.name} className="h-full w-full object-contain logo-glow" />
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
          {conference}{division ? ` - ${division}` : ''}
        </p>

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
              <div className="w-px h-10" style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border }} />
              <div className="text-center">
                <p className="text-xl font-mono font-bold" style={{ color: theme.text }}>
                  {teamStanding.points}
                </p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  Points
                </p>
              </div>
              <div className="w-px h-10" style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border }} />
              <div className="text-center">
                <p className="text-xl font-mono font-bold" style={{ color: theme.text }}>
                  {teamStanding.goalDiff > 0 ? `+${teamStanding.goalDiff}` : teamStanding.goalDiff}
                </p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  Goal Diff
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
                        {upcomingGames.map((game, index) => (
                          <Link
                            key={game.id}
                            href={`/nhl/game/${game.id}`}
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
                                <SafeImage src={game.opponent.logo} alt={game.opponent.name} className="h-5 w-5 object-contain logo-glow" />
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
                        {completedGames.map((game, index) => (
                          <Link
                            key={game.id}
                            href={`/nhl/game/${game.id}`}
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
                                <SafeImage src={game.opponent.logo} alt={game.opponent.name} className="h-5 w-5 object-contain logo-glow" />
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
              <div
                className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                {roster.map((player, index) => (
                  <Link key={player.id} href={`/player/nhl/${player.id}`} className="contents">
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderTop: index === 0 ? 'none' : `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                    }}
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}>
                      {player.headshot ? (
                        <SafeImage
                          src={player.headshot}
                          alt={player.name}
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[9px]" style={{ color: theme.textSecondary }}>
                          #{player.jersey}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium truncate" style={{ color: theme.text }}>
                        {player.name}
                      </p>
                      <p className="text-[10px]" style={{ color: theme.textSecondary }}>
                        #{player.jersey} {player.position}
                      </p>
                    </div>
                  </div>
                  </Link>
                ))}
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
        {activeTab === 'standings' && standings && (
          <section className="px-4 py-4">
            {/* Conference Toggle */}
            <div className="flex gap-2 mb-4">
              {['Eastern', 'Western'].map((conf) => (
                <button
                  key={conf}
                  onClick={() => setSelectedConference(conf as 'Eastern' | 'Western')}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors ${darkMode ? (selectedConference === conf ? '' : 'glass-pill') : ''}`}
                  style={{
                    backgroundColor: darkMode ? (selectedConference === conf ? theme.accent : undefined) : (selectedConference === conf ? theme.accent : theme.bgSecondary),
                    color: selectedConference === conf ? '#fff' : theme.textSecondary,
                  }}
                >
                  {conf} Conference
                </button>
              ))}
            </div>

            {/* Division Standings */}
            {(() => {
              const currentConf = standings.conferences?.find(c =>
                c.name.includes(selectedConference)
              );
              if (!currentConf) return null;

              return (
                <div className="flex flex-col gap-4">
                  {currentConf.divisions.map((division) => (
                    <div
                      key={division.id}
                      className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                      style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                    >
                      {/* Division Name */}
                      <div
                        className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: theme.textSecondary, borderBottom: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}
                      >
                        {division.name}
                      </div>

                      {/* Header */}
                      <div
                        className="flex items-center px-4 py-2 text-[9px] font-semibold uppercase"
                        style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary, color: theme.textSecondary }}
                      >
                        <span className="w-6">#</span>
                        <span className="flex-1">Team</span>
                        <span className="w-8 text-center">W</span>
                        <span className="w-8 text-center">L</span>
                        <span className="w-9 text-center">OTL</span>
                        <span className="w-9 text-center">PTS</span>
                      </div>

                      {/* Teams */}
                      {division.teams.map((standingTeam, index) => {
                        const isCurrentTeam = standingTeam.team.id === teamId;
                        const isPlayoffSpot = index < 3;
                        const isPlayoffCutoff = index === 2;

                        return (
                          <div key={standingTeam.team.id}>
                            <Link
                              href={`/nhl/team/${standingTeam.team.id}`}
                              className="flex items-center px-4 py-2.5 hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: isCurrentTeam ? `${theme.accent}15` : 'transparent',
                                borderTop: index === 0 ? 'none' : `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                              }}
                            >
                              <span
                                className="w-6 text-[11px] font-mono font-bold"
                                style={{ color: isPlayoffSpot ? theme.green : theme.textSecondary }}
                              >
                                {index + 1}
                              </span>
                              <div className="flex-1 flex items-center gap-2 min-w-0">
                                <SafeImage
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
                              <span className="w-9 text-center text-[12px] font-mono" style={{ color: theme.text }}>
                                {standingTeam.otLosses}
                              </span>
                              <span className="w-9 text-center text-[12px] font-mono font-bold" style={{ color: theme.accent }}>
                                {standingTeam.points}
                              </span>
                            </Link>

                            {/* Playoff Cutoff Line */}
                            {isPlayoffCutoff && (
                              <div className="flex items-center gap-2 px-4 py-1" style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}>
                                <div className="flex-1 h-px" style={{ backgroundColor: theme.green }} />
                                <span className="text-[8px] uppercase font-semibold" style={{ color: theme.green }}>
                                  Playoff Line
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
                    className="flex items-center justify-center gap-4 px-4 py-2 text-[9px]"
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.green }} />
                      <span style={{ color: theme.textSecondary }}>Top 3 (Auto Playoff)</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
