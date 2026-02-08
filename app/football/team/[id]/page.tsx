'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Trophy, Sun, Moon, Heart } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { CollegeFootballTeamInfo } from '@/lib/types/college-football';
import { createBrowserClient } from '@supabase/ssr';
import { User as SupabaseUser } from '@supabase/supabase-js';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Team not found' : 'Failed to fetch');
  return res.json();
});

export default function CollegeFootballTeamPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const teamId = params.id as string;

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
          .eq('favorite_type', 'ncaaf_team')
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
        .eq('favorite_type', 'ncaaf_team')
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
          favorite_type: 'ncaaf_team',
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

  const { data: teamInfo, error, isLoading } = useSWR<CollegeFootballTeamInfo>(
    teamId ? `/api/football/team/${teamId}` : null,
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

  const { team, conference, record, conferenceRecord, rank, schedule, venue } = teamInfo;

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
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>NCAA Football</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>{conference.name}</p>
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
        className="px-4 py-8 text-center"
        style={{ backgroundColor: team.color ? `${team.color}20` : theme.bgSecondary }}
      >
        {rank && rank <= 25 && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 mb-4 text-[11px] font-bold"
            style={{ backgroundColor: theme.gold, color: '#000' }}
          >
            <Trophy size={12} />
            #{rank} Ranked
          </span>
        )}

        <div className="mx-auto mb-4 h-24 w-24">
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
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>
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

        <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>
          {conference.shortName}
        </p>

        <div className="flex justify-center gap-6">
          <div>
            <p className="text-2xl font-mono font-bold" style={{ color: theme.text }}>
              {record || '-'}
            </p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Overall
            </p>
          </div>
          <div
            className="w-px"
            style={{ backgroundColor: theme.border }}
          />
          <div>
            <p className="text-2xl font-mono font-bold" style={{ color: theme.text }}>
              {conferenceRecord || '-'}
            </p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
              Conference
            </p>
          </div>
        </div>

        {venue && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <MapPin size={14} style={{ color: theme.textSecondary }} />
            <span className="text-[12px]" style={{ color: theme.textSecondary }}>
              {venue.name}, {venue.city}
              {venue.capacity && ` (${venue.capacity.toLocaleString()})`}
            </span>
          </div>
        )}
      </section>

      {/* Upcoming Games */}
      <section className="px-4 py-6">
        <h2
          className="text-[10px] font-semibold uppercase tracking-wider mb-4"
          style={{ color: theme.textSecondary }}
        >
          Upcoming Games
        </h2>

        {schedule && schedule.length > 0 ? (
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            {schedule.slice(0, 5).map((game, index) => (
              <div
                key={game.id}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderTop: index === 0 ? 'none' : `1px solid ${theme.border}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-medium w-16"
                    style={{ color: theme.textSecondary }}
                  >
                    {game.date}
                  </span>
                  <span
                    className="text-[11px] w-4"
                    style={{ color: theme.textSecondary }}
                  >
                    {game.isHome ? 'vs' : '@'}
                  </span>
                  {game.opponent.logo && (
                    <img
                      src={game.opponent.logo}
                      alt={game.opponent.name}
                      className="h-5 w-5 object-contain logo-glow"
                    />
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
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl p-6 text-center"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <p className="text-[12px]" style={{ color: theme.textSecondary }}>
              No upcoming games
            </p>
          </div>
        )}
      </section>

      <BottomNav />
    </div>
  );
}
