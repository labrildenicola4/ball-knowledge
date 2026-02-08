'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Heart, LogOut, User } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/lib/theme';
import { createBrowserClient } from '@supabase/ssr';
import { User as SupabaseUser } from '@supabase/supabase-js';
import LoginButton from '@/components/LoginButton';
import {
  MLB_TEAMS,
  NBA_TEAMS,
  NFL_TEAMS,
  COLLEGE_BASKETBALL_TEAMS,
  COLLEGE_FOOTBALL_TEAMS,
  SEARCHABLE_SOCCER_LEAGUES,
} from '@/lib/search-data';

interface TeamInfo {
  teamId: number;
  team: string;
  logo?: string;
  position: number;
  points: number;
  form: string[];
}

interface Favorite {
  favorite_type: string;
  favorite_id: number;
}

export default function MyStuffPage() {
  const { theme } = useTheme();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [soccerTeams, setSoccerTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Fetch ALL favorites (not just teams)
          const { data, error } = await supabase
            .from('user_favorites')
            .select('favorite_type, favorite_id');

          if (error) {
            console.error('Error fetching favorites:', error);
            return;
          }

          if (data && data.length > 0) {
            setFavorites(data);

            // Fetch soccer team details (needs API call for standings info)
            const soccerTeamIds = data
              .filter(f => f.favorite_type === 'team')
              .map(f => f.favorite_id);

            if (soccerTeamIds.length > 0) {
              await fetchSoccerTeamDetails(soccerTeamIds);
            }
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setFavorites([]);
        setSoccerTeams([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSoccerTeamDetails = async (favoriteIds: number[]) => {
    setLoading(true);
    try {
      const leagueIds = ['laliga', 'premier', 'seriea', 'bundesliga', 'ligue1'];
      const responses = await Promise.all(
        leagueIds.map(league =>
          fetch(`/api/standings?league=${league}`)
            .then(res => res.ok ? res.json() : { standings: [] })
            .catch(() => ({ standings: [] }))
        )
      );

      const allTeams: TeamInfo[] = responses.flatMap(r => r.standings || []);
      const favoriteTeams = allTeams.filter(team => favoriteIds.includes(team.teamId));
      setSoccerTeams(favoriteTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteType: string, favoriteId: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('favorite_type', favoriteType)
      .eq('favorite_id', favoriteId);

    if (!error) {
      setFavorites(prev => prev.filter(f => !(f.favorite_type === favoriteType && f.favorite_id === favoriteId)));
      if (favoriteType === 'team') {
        setSoccerTeams(prev => prev.filter(t => t.teamId !== favoriteId));
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setFavorites([]);
    setSoccerTeams([]);
  };

  // Get favorites by type - handle both string and number IDs
  const getFavoriteIds = (type: string): (string | number)[] =>
    favorites.filter(f => f.favorite_type === type).map(f => f.favorite_id);

  const mlbFavoriteIds = getFavoriteIds('mlb_team');
  const nbaFavoriteIds = getFavoriteIds('nba_team');
  const nflFavoriteIds = getFavoriteIds('nfl_team');
  const ncaabFavoriteIds = getFavoriteIds('ncaab_team');
  const ncaafFavoriteIds = getFavoriteIds('ncaaf_team');
  const leagueFavoriteIds = getFavoriteIds('league');

  // Helper to check if ID matches (handles string/number comparison)
  const idMatches = (teamId: string, favoriteIds: (string | number)[]) =>
    favoriteIds.some(fid => String(fid) === teamId || Number(fid) === Number(teamId));

  // Get favorite data from static lists
  const mlbFavorites = MLB_TEAMS.filter(t => idMatches(t.id, mlbFavoriteIds));
  const nbaFavorites = NBA_TEAMS.filter(t => idMatches(t.id, nbaFavoriteIds));
  const nflFavorites = NFL_TEAMS.filter(t => idMatches(t.id, nflFavoriteIds));
  const ncaabFavorites = COLLEGE_BASKETBALL_TEAMS.filter(t => idMatches(t.id, ncaabFavoriteIds));
  const ncaafFavorites = COLLEGE_FOOTBALL_TEAMS.filter(t => idMatches(t.id, ncaafFavoriteIds));
  const leagueFavorites = SEARCHABLE_SOCCER_LEAGUES.filter(l => idMatches(l.id, leagueFavoriteIds));

  const hasAnyFavorites = favorites.length > 0;

  // Show sign-in screen if not logged in
  if (!user) {
    return (
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
      >
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-6">
          <div
            className="flex flex-col items-center rounded-2xl p-8 text-center"
            style={{ backgroundColor: theme.bgSecondary, maxWidth: '360px' }}
          >
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.bgTertiary }}
            >
              <User size={32} color={theme.accent} />
            </div>
            <h2 className="mb-2 text-xl font-semibold" style={{ color: theme.text }}>
              Sign In
            </h2>
            <p className="mb-6 text-sm" style={{ color: theme.textSecondary }}>
              Sign in to save your favorite teams, leagues, and tournaments. Access them from any device.
            </p>
            <LoginButton />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Logged in view
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      <Header />
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {/* User Profile Section */}
        <div
          className="mb-6 flex items-center justify-between rounded-xl p-4"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-3">
            <img
              src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`}
              alt="Avatar"
              className="h-12 w-12 rounded-full"
            />
            <div>
              <p className="text-[14px] font-medium" style={{ color: theme.text }}>
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium"
            style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-r-transparent"
              style={{ borderColor: theme.accent, borderRightColor: 'transparent' }}
            />
            <p className="mt-2 text-[12px]" style={{ color: theme.textSecondary }}>
              Loading favorites...
            </p>
          </div>
        ) : !hasAnyFavorites ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl py-12"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <Star size={48} color={theme.textSecondary} />
            <p className="mt-4 text-[14px] font-medium" style={{ color: theme.text }}>
              No favorites yet
            </p>
            <p className="mt-2 text-center text-[12px]" style={{ color: theme.textSecondary }}>
              Tap the heart icon on any team or league<br />to add it to your favorites
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Soccer Teams Section */}
            {soccerTeams.length > 0 && (
              <section>
                <h2
                  className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  Soccer Teams
                </h2>
                <div className="flex flex-col gap-2">
                  {soccerTeams.map((team) => (
                    <div
                      key={team.teamId}
                      className="flex items-center gap-3 rounded-xl p-4"
                      style={{
                        backgroundColor: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <Link href={`/team/${team.teamId}`} className="flex items-center gap-3 flex-1">
                        {team.logo && (
                          <img
                            src={team.logo}
                            alt={team.team}
                            className="h-10 w-10 object-contain"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                            {team.team}
                          </p>
                          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                            {team.position}{team.position === 1 ? 'st' : team.position === 2 ? 'nd' : team.position === 3 ? 'rd' : 'th'} place
                            {' '}&bull;{' '}
                            {team.points} pts
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        {team.form && (
                          <div className="flex gap-1">
                            {team.form.slice(0, 5).map((result, i) => (
                              <span
                                key={i}
                                className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-semibold text-white"
                                style={{
                                  backgroundColor:
                                    result === 'W'
                                      ? theme.green
                                      : result === 'D'
                                      ? theme.gold
                                      : theme.red,
                                }}
                              >
                                {result}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => removeFavorite('team', team.teamId)}
                          className="ml-2 flex h-8 w-8 items-center justify-center rounded-full"
                          style={{ backgroundColor: theme.bgTertiary }}
                        >
                          <Heart size={16} color={theme.gold} fill={theme.gold} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* MLB Teams Section */}
            {mlbFavorites.length > 0 && (
              <section>
                <h2
                  className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  MLB Teams
                </h2>
                <div className="flex flex-col gap-2">
                  {mlbFavorites.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 rounded-xl p-4"
                      style={{
                        backgroundColor: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <Link href={`/mlb/team/${team.id}`} className="flex items-center gap-3 flex-1">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="h-10 w-10 object-contain"
                        />
                        <div className="flex-1">
                          <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                            {team.name}
                          </p>
                          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                            {team.league} {team.division}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFavorite('mlb_team', Number(team.id))}
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: theme.bgTertiary }}
                      >
                        <Heart size={16} color={theme.gold} fill={theme.gold} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* NBA Teams Section */}
            {nbaFavorites.length > 0 && (
              <section>
                <h2
                  className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  NBA Teams
                </h2>
                <div className="flex flex-col gap-2">
                  {nbaFavorites.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 rounded-xl p-4"
                      style={{
                        backgroundColor: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <Link href={`/nba/team/${team.id}`} className="flex items-center gap-3 flex-1">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="h-10 w-10 object-contain"
                        />
                        <div className="flex-1">
                          <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                            {team.name}
                          </p>
                          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                            {team.conference} &bull; {team.division}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFavorite('nba_team', Number(team.id))}
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: theme.bgTertiary }}
                      >
                        <Heart size={16} color={theme.gold} fill={theme.gold} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* NFL Teams Section */}
            {nflFavorites.length > 0 && (
              <section>
                <h2
                  className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  NFL Teams
                </h2>
                <div className="flex flex-col gap-2">
                  {nflFavorites.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 rounded-xl p-4"
                      style={{
                        backgroundColor: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <Link href={`/nfl/team/${team.id}`} className="flex items-center gap-3 flex-1">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="h-10 w-10 object-contain"
                        />
                        <div className="flex-1">
                          <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                            {team.name}
                          </p>
                          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                            {team.conference} &bull; {team.division}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFavorite('nfl_team', Number(team.id))}
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: theme.bgTertiary }}
                      >
                        <Heart size={16} color={theme.gold} fill={theme.gold} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* NCAA Basketball Teams Section */}
            {ncaabFavorites.length > 0 && (
              <section>
                <h2
                  className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  NCAA Basketball
                </h2>
                <div className="flex flex-col gap-2">
                  {ncaabFavorites.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 rounded-xl p-4"
                      style={{
                        backgroundColor: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <Link href={`/basketball/team/${team.id}`} className="flex items-center gap-3 flex-1">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="h-10 w-10 object-contain"
                        />
                        <div className="flex-1">
                          <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                            {team.name}
                          </p>
                          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                            {team.conference}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFavorite('ncaab_team', Number(team.id))}
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: theme.bgTertiary }}
                      >
                        <Heart size={16} color={theme.gold} fill={theme.gold} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* NCAA Football Teams Section */}
            {ncaafFavorites.length > 0 && (
              <section>
                <h2
                  className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  NCAA Football
                </h2>
                <div className="flex flex-col gap-2">
                  {ncaafFavorites.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 rounded-xl p-4"
                      style={{
                        backgroundColor: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <Link href={`/football/team/${team.id}`} className="flex items-center gap-3 flex-1">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="h-10 w-10 object-contain"
                        />
                        <div className="flex-1">
                          <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                            {team.name}
                          </p>
                          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                            {team.conference}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFavorite('ncaaf_team', Number(team.id))}
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: theme.bgTertiary }}
                      >
                        <Heart size={16} color={theme.gold} fill={theme.gold} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Leagues Section */}
            {leagueFavorites.length > 0 && (
              <section>
                <h2
                  className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  Leagues
                </h2>
                <div className="flex flex-col gap-2">
                  {leagueFavorites.map((league) => (
                    <div
                      key={league.id}
                      className="flex items-center gap-3 rounded-xl p-4"
                      style={{
                        backgroundColor: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <Link href={`/league/${league.slug}`} className="flex items-center gap-3 flex-1">
                        <img
                          src={league.logo}
                          alt={league.name}
                          className="h-10 w-10 object-contain"
                        />
                        <div className="flex-1">
                          <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                            {league.name}
                          </p>
                          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                            {league.country} &bull; {league.type === 'cup' ? 'Cup' : 'League'}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFavorite('league', Number(league.id) || 0)}
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: theme.bgTertiary }}
                      >
                        <Heart size={16} color={theme.gold} fill={theme.gold} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
