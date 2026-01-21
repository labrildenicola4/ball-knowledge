'use client';

import { Trophy, Sun, Moon, LogOut, User } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import LoginButton from './LoginButton';

interface HeaderProps {
  user?: any;
}

export function Header({ user: initialUser }: HeaderProps) {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const [user, setUser] = useState(initialUser);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    if (!user) checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md transition-theme"
      style={{
        backgroundColor: darkMode ? 'rgba(10, 15, 10, 0.95)' : 'rgba(245, 242, 232, 0.95)',
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.accent }}
          >
            <Trophy size={20} color="#fff" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-wide" style={{ color: theme.text }}>
              Ball Knowledge
            </h1>
            <p
              className="text-xs uppercase tracking-[2px]"
              style={{ color: theme.textSecondary }}
            >
              Pure Data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mounted && (
            user ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                  style={{ backgroundColor: theme.bgSecondary }}
                >
                  <img
                    src={user.user_metadata?.avatar_url}
                    alt="Avatar"
                    className="h-6 w-6 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.email}&background=random`;
                    }}
                  />
                  <span className="text-sm hidden sm:inline" style={{ color: theme.text }}>
                    {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
                  style={{ backgroundColor: theme.bgSecondary }}
                  aria-label="Logout"
                >
                  <LogOut size={18} style={{ color: theme.textSecondary }} />
                </button>
              </div>
            ) : (
              <LoginButton />
            )
          )}

          <button
            onClick={toggleDarkMode}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
            style={{ border: `1px solid ${theme.border}` }}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={20} color={theme.text} /> : <Moon size={20} color={theme.text} />}
          </button>
        </div>
      </div>
    </header>
  );
}
