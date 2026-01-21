'use client';

import { useState, useEffect } from 'react';
import { Star, Heart } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/lib/theme';
import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import LoginButton from '@/components/LoginButton';

export default function FavoritesPage() {
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Load favorites
          const { data } = await supabase
            .from('user_favorites')
            .select('favorite_id')
            .eq('favorite_type', 'team');

          if (data) {
            setFavorites(data.map(f => f.favorite_id));
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setFavorites([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show sign-in screen if not logged in
  if (!user && !loading) {
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
              <Star size={32} color={theme.accent} />
            </div>
            <h2 className="mb-2 text-xl font-semibold" style={{ color: theme.text }}>
              Save Your Favorites
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

  // Show loading
  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
      >
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-r-transparent"
            style={{ borderColor: theme.accent, borderRightColor: 'transparent' }}
          />
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
        <h2
          className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: theme.textSecondary }}
        >
          My Favorite Teams
        </h2>

        {favorites.length === 0 ? (
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
            <p style={{ color: theme.text }}>You have {favorites.length} favorite team(s)</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
