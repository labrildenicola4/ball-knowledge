'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Sun, Moon, TrendingUp, Users, BarChart3, Trophy, Heart, Calendar } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { MLBTeamInfo, MLBPlayer, MLBTeamSeasonStats, MLBGameResult, MLBTeamScheduleGame } from '@/lib/types/mlb';
import { createBrowserClient } from '@supabase/ssr';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ExtendedTeamInfo extends MLBTeamInfo {
  roster: MLBPlayer[];
  stats: MLBTeamSeasonStats | null;
  recentForm: MLBGameResult[];
  schedule: MLBTeamScheduleGame[];
  standings: {
    divisions: Array<{
      name: string;
      teams: Array<{
        team: { id: string; displayName: string; logo: string };
        wins: number;
        losses: number;
        pct: string;
        gamesBack: string;
      }>;
    }>;
  };
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Team not found' : 'Failed to fetch');
  return res.json();
});

export default function MLBTeamPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const teamId = params.id as string;

  const [activeTab, setActiveTab] = useState<'schedule' | 'roster' | 'stats'>('schedule');

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
          .eq('favorite_type', 'mlb_team')
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
        .eq('favorite_type', 'mlb_team')
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
          favorite_type: 'mlb_team',
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
    teamId ? `/api/mlb/team/${teamId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

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

  const { team, division, record, schedule, venue, roster, stats, recentForm, standings } = teamInfo;

  // Find team's standing in their division
  const teamDivision = standings?.divisions?.find(d =>
    d.teams.some(t => t.team.id === teamId)
  );
  const teamStanding = teamDivision?.teams.find(t => t.team.id === teamId);
  const teamRank = teamDivision?.teams.findIndex(t => t.team.id === teamId);

  // Split schedule into upcoming and completed
  const upcomingGames = schedule.filter(g => g.status === 'scheduled').slice(0, 10);
  const completedGames = schedule.filter(g => g.status === 'final').slice(-10).reverse();

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
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>MLB</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>{division.name}</p>
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
          {division.shortName || division.name}
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
                  {teamStanding.gamesBack === '0' || teamStanding.gamesBack === '-' ? '-' : teamStanding.gamesBack}
                </p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  Games Back
                </p>
              </div>
              <div className="w-px h-10" style={{ backgroundColor: theme.border }} />
              <div className="text-center">
                <p className="text-xl font-mono font-bold" style={{ color: theme.text }}>
                  #{(teamRank ?? 0) + 1}
                </p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                  In Div.
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
        <section className="px-4 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} style={{ color: theme.accent }} />
            <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Team Stats
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'AVG', value: stats.batting.avg.displayValue },
              { label: 'HR', value: stats.batting.homeRuns.displayValue },
              { label: 'RBI', value: stats.batting.rbi.displayValue },
              { label: 'ERA', value: stats.pitching.era.displayValue },
            ].map(stat => (
              <div key={stat.label} className="text-center rounded-lg py-2" style={{ backgroundColor: theme.bgSecondary }}>
                <p className="text-[10px] uppercase" style={{ color: theme.textSecondary }}>{stat.label}</p>
                <p className="text-sm font-bold" style={{ color: theme.text }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        {[
          { key: 'schedule' as const, label: 'Schedule', icon: Calendar },
          { key: 'roster' as const, label: 'Roster', icon: Users },
          { key: 'stats' as const, label: 'Stats', icon: BarChart3 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: isActive ? theme.accent : theme.bgSecondary,
                color: isActive ? '#fff' : theme.textSecondary,
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4">
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Upcoming Games */}
            {upcomingGames.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textSecondary }}>
                  Upcoming
                </h3>
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                  {upcomingGames.map((game, idx) => (
                    <Link key={game.id} href={`/mlb/game/${game.id}`}>
                      <div
                        className="flex items-center gap-3 px-4 py-3 hover:opacity-80 transition-opacity"
                        style={{ borderTop: idx > 0 ? `1px solid ${theme.border}` : 'none' }}
                      >
                        <div className="text-[11px] w-16" style={{ color: theme.textSecondary }}>{game.date}</div>
                        <span className="text-[10px] w-6" style={{ color: theme.textSecondary }}>{game.isHome ? 'vs' : '@'}</span>
                        {game.opponent.logo && <img src={game.opponent.logo} alt="" className="h-5 w-5 object-contain logo-glow" />}
                        <span className="text-sm font-medium flex-1" style={{ color: theme.text }}>{game.opponent.shortDisplayName}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Games */}
            {completedGames.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textSecondary }}>
                  Recent Games
                </h3>
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                  {completedGames.map((game, idx) => (
                    <Link key={game.id} href={`/mlb/game/${game.id}`}>
                      <div
                        className="flex items-center gap-3 px-4 py-3 hover:opacity-80 transition-opacity"
                        style={{ borderTop: idx > 0 ? `1px solid ${theme.border}` : 'none' }}
                      >
                        <div className="text-[11px] w-16" style={{ color: theme.textSecondary }}>{game.date}</div>
                        <span className="text-[10px] w-6" style={{ color: theme.textSecondary }}>{game.isHome ? 'vs' : '@'}</span>
                        {game.opponent.logo && <img src={game.opponent.logo} alt="" className="h-5 w-5 object-contain logo-glow" />}
                        <span className="text-sm font-medium flex-1" style={{ color: theme.text }}>{game.opponent.shortDisplayName}</span>
                        {game.result && (
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: game.result.win ? `${theme.green}30` : `${theme.red}30`,
                              color: game.result.win ? theme.green : theme.red,
                            }}
                          >
                            {game.result.win ? 'W' : 'L'} {game.result.score}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'roster' && (
          <div>
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
                        {player.batHand && ` · Bats: ${player.batHand}`}
                        {player.throwHand && ` · Throws: ${player.throwHand}`}
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
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Batting Stats */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textSecondary }}>
                Batting
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Batting Average', value: stats.batting.avg.displayValue },
                  { label: 'Home Runs', value: stats.batting.homeRuns.displayValue },
                  { label: 'RBI', value: stats.batting.rbi.displayValue },
                  { label: 'Runs', value: stats.batting.runs.displayValue },
                  { label: 'Stolen Bases', value: stats.batting.stolenBases.displayValue },
                  { label: 'OBP', value: stats.batting.obp.displayValue },
                  { label: 'SLG', value: stats.batting.slg.displayValue },
                  { label: 'OPS', value: stats.batting.ops.displayValue },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg p-3" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                    <p className="text-[10px] uppercase mb-1" style={{ color: theme.textSecondary }}>{stat.label}</p>
                    <p className="text-lg font-bold font-mono" style={{ color: theme.text }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pitching Stats */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textSecondary }}>
                Pitching
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'ERA', value: stats.pitching.era.displayValue },
                  { label: 'Wins', value: stats.pitching.wins.displayValue },
                  { label: 'Losses', value: stats.pitching.losses.displayValue },
                  { label: 'Saves', value: stats.pitching.saves.displayValue },
                  { label: 'Strikeouts', value: stats.pitching.strikeouts.displayValue },
                  { label: 'WHIP', value: stats.pitching.whip.displayValue },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg p-3" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                    <p className="text-[10px] uppercase mb-1" style={{ color: theme.textSecondary }}>{stat.label}</p>
                    <p className="text-lg font-bold font-mono" style={{ color: theme.text }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
