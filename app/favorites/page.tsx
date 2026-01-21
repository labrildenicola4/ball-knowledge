'use client';

import { useState, useEffect } from 'react';
import { Star, Heart, LogOut, User } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/lib/theme';
import { createBrowserClient } from '@supabase/ssr';
import { User as SupabaseUser } from '@supabase/supabase-js';
import LoginButton from '@/components/LoginButton';

interface TeamInfo {
  teamId: number;
  team: string;
  logo?: string;
  position: number;
  points: number;
  form: string[];
}

export default function MyStuffPage() {
  const { theme } = useTheme();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
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
          const { data } = await supabase
            .from('user_favorites')
            .select('favorite_id')
            .eq('favorite_type', 'team');

          if (data) {
            const favIds = data.map(f => f.favorite_id);
            setFavorites(favIds);

            if (favIds.length > 0) {
              await fetchTeamDetails(favIds);
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
        setTeams([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTeamDetails = async (favoriteIds: number[]) => {
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
      setTeams(favoriteTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (teamId: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('favorite_type', 'team')
      .eq('favorite_id', teamId);

    if (!error) {
      setFavorites(prev => prev.filter(id => id !== teamId));
      setTeams(prev => prev.filter(t => t.teamId !== teamId));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setFavorites([]);
    setTeams([]);
  };

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

        {/* Favorite Teams Section */}
        <h2
          className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: theme.textSecondary }}
        >
          Favorite Teams
        </h2>

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
        ) : favorites.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl py-12"
            style={{ backgroundColor: theme.bgSecondary }}
          >
            <Star size={48} color={theme.textSecondary} />
            <p className="mt-4 text-[14px] font-medium" style={{ color: theme.text }}>
              No favorite teams yet
            </p>
            <p className="mt-2 text-center text-[12px]" style={{ color: theme.textSecondary }}>
              Go to the standings table and tap the heart icon<br />next to a team to add it to your favorites
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {teams.map((team) => (
              <div
                key={team.teamId}
                className="flex items-center gap-3 rounded-xl p-4"
                style={{
                  backgroundColor: theme.bgSecondary,
                  border: `1px solid ${theme.border}`,
                }}
              >
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
                    onClick={() => removeFavorite(team.teamId)}
                    className="ml-2 flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.bgTertiary }}
                  >
                    <Heart
                      size={16}
                      color={theme.gold}
                      fill={theme.gold}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
