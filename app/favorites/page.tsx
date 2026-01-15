'use client';

import { useState, useEffect } from 'react';
import { Star, Heart, Trash2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MatchCard } from '@/components/MatchCard';
import { useTheme } from '@/lib/theme';
import { useFavorites } from '@/lib/use-favorites';

interface Match {
  id: number;
  league: string;
  home: string;
  away: string;
  homeId?: number;
  awayId?: number;
  homeScore: number | null;
  awayScore: number | null;
  homeLogo: string;
  awayLogo: string;
  status: string;
  time: string;
}

interface Standing {
  position: number;
  teamId: number;
  team: string;
  logo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: string;
  points: number;
  form: string[];
}

export default function FavoritesPage() {
  const { theme } = useTheme();
  const { favorites, removeFavorite } = useFavorites();
  const [matches, setMatches] = useState<Match[]>([]);
  const [favoriteTeams, setFavoriteTeams] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'teams'>('matches');

  useEffect(() => {
    async function fetchFavoriteData() {
      if (favorites.length === 0) {
        setLoading(false);
        setMatches([]);
        setFavoriteTeams([]);
        return;
      }

      setLoading(true);
      try {
        // Fetch standings from all leagues to find favorite teams
        const leagueIds = ['laliga', 'premier', 'seriea', 'bundesliga', 'ligue1'];
        const standingsResponses = await Promise.all(
          leagueIds.map(league =>
            fetch(`/api/standings?league=${league}`)
              .then(res => res.ok ? res.json() : { standings: [] })
              .catch(() => ({ standings: [] }))
          )
        );

        const allStandings: Standing[] = standingsResponses.flatMap(r => r.standings || []);
        const favTeams = allStandings.filter(team => favorites.includes(team.teamId));
        setFavoriteTeams(favTeams);

        // Fetch all fixtures and filter for favorite teams
        const matchResponses = await Promise.all(
          leagueIds.map(league =>
            fetch(`/api/fixtures?league=${league}`)
              .then(res => res.ok ? res.json() : { matches: [] })
              .catch(() => ({ matches: [] }))
          )
        );
        const allMatches: Match[] = matchResponses.flatMap(r => r.matches || []);

        // Filter matches involving favorite teams
        const favoriteMatches = allMatches.filter(match =>
          favorites.includes(match.homeId || 0) || favorites.includes(match.awayId || 0)
        );

        // Remove duplicates and sort by date/time
        const uniqueMatches = Array.from(
          new Map(favoriteMatches.map(m => [m.id, m])).values()
        ).sort((a, b) => a.time.localeCompare(b.time));

        setMatches(uniqueMatches);
      } catch (err) {
        console.error('Error fetching favorite data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFavoriteData();
  }, [favorites]);

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}
    >
      <Header />

      {/* Tabs */}
      <div
        className="flex gap-2 px-4 py-3"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <button
          onClick={() => setActiveTab('matches')}
          className="flex-1 rounded-lg py-2 text-[12px] font-medium"
          style={{
            backgroundColor: activeTab === 'matches' ? theme.accent : theme.bgSecondary,
            color: activeTab === 'matches' ? '#fff' : theme.textSecondary,
          }}
        >
          Upcoming Matches
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className="flex-1 rounded-lg py-2 text-[12px] font-medium"
          style={{
            backgroundColor: activeTab === 'teams' ? theme.accent : theme.bgSecondary,
            color: activeTab === 'teams' ? '#fff' : theme.textSecondary,
          }}
        >
          My Teams ({favorites.length})
        </button>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4">
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
        ) : loading ? (
          <div className="py-8 text-center">
            <div
              className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
              style={{ color: theme.accent }}
            />
            <p className="mt-2 text-[12px]" style={{ color: theme.textSecondary }}>
              Loading favorites...
            </p>
          </div>
        ) : activeTab === 'matches' ? (
          <>
            <h2
              className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: theme.textSecondary }}
            >
              Next 7 Days
            </h2>
            {matches.length === 0 ? (
              <div
                className="rounded-lg py-8 text-center"
                style={{ backgroundColor: theme.bgSecondary }}
              >
                <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                  No upcoming matches for your favorite teams
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2
              className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: theme.textSecondary }}
            >
              Favorite Teams
            </h2>
            <div className="flex flex-col gap-2">
              {favoriteTeams.map((team) => (
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
                    <p className="text-[13px] font-medium">{team.team}</p>
                    <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                      {team.position}{team.position === 1 ? 'st' : team.position === 2 ? 'nd' : team.position === 3 ? 'rd' : 'th'} place
                      {' '}&bull;{' '}
                      {team.points} pts
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
