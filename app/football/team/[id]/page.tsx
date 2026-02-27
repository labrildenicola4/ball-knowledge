'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSafeBack } from '@/lib/use-safe-back';
import Link from 'next/link';
import useSWR from 'swr';
import { ChevronLeft, MapPin, Trophy, Sun, Moon, Heart, TrendingUp, Users } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';
import { CollegeFootballTeamInfo, CollegeFootballPlayer } from '@/lib/types/college-football';
import { createBrowserClient } from '@supabase/ssr';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { SafeImage } from '@/components/SafeImage';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(res.status === 404 ? 'Team not found' : 'Failed to fetch');
  return res.json();
});

export default function CollegeFootballTeamPage() {
  const params = useParams();
  const goBack = useSafeBack('/football');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const teamId = params.id as string;

  const [activeTab, setActiveTab] = useState<'schedule' | 'roster'>('schedule');

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

  const { team, conference, record, conferenceRecord, rank, schedule, venue, roster } = teamInfo;

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
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>NCAA Football</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>{conference.name}</p>
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
        className={`px-4 py-8 text-center ${darkMode ? 'glass-section' : ''}`}
        style={darkMode ? (team.color ? { backgroundColor: `${team.color}20` } : undefined) : { backgroundColor: team.color ? `${team.color}20` : theme.bgSecondary }}
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
            style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border }}
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

      {/* Tabs */}
      <div className="flex gap-2 py-3 px-4">
        {[
          { key: 'schedule', label: 'Schedule', icon: TrendingUp },
          { key: 'roster', label: 'Roster', icon: Users },
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
              <div
                className={`rounded-xl overflow-hidden ${darkMode ? 'glass-card' : ''}`}
                style={darkMode ? undefined : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                {schedule.slice(0, 10).map((game, index) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      borderTop: index === 0 ? 'none' : `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
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
                        <SafeImage
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
                  <Link key={player.id} href={`/player/cfb/${player.id}`} className="contents">
                  <div
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{
                      borderTop: index === 0 ? 'none' : `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}`,
                    }}
                  >
                    <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}>
                      {player.headshot ? (
                        <SafeImage
                          src={player.headshot}
                          alt={player.name}
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[8px]" style={{ color: theme.textSecondary }}>
                          #{player.jersey}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: theme.text }}>
                        {player.name}
                      </p>
                      <p className="text-[10px]" style={{ color: theme.textSecondary }}>
                        {[player.position, player.jersey ? `#${player.jersey}` : '', player.year].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {(player.height || player.weight) && (
                      <span className="text-[10px] flex-shrink-0" style={{ color: theme.textSecondary }}>
                        {[player.height, player.weight ? `${player.weight} lbs` : ''].filter(Boolean).join(', ')}
                      </span>
                    )}
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
      </div>

      <BottomNav />
    </div>
  );
}
