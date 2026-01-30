'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Sun, Moon, Search, X } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { searchAll, type SearchableTeam, type SearchableLeague, type SearchableMLBTeam, type SearchableNBATeam } from '@/lib/search-data';

export function Header() {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ teams: SearchableTeam[]; leagues: SearchableLeague[]; mlbTeams: SearchableMLBTeam[]; nbaTeams: SearchableNBATeam[] }>({
    teams: [],
    leagues: [],
    mlbTeams: [],
    nbaTeams: [],
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
        setQuery('');
        setResults({ teams: [], leagues: [], mlbTeams: [], nbaTeams: [] });
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search as user types
  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = searchAll(query);
      setResults(searchResults);
    } else {
      setResults({ teams: [], leagues: [], mlbTeams: [], nbaTeams: [] });
    }
  }, [query]);

  const handleTeamClick = (team: SearchableTeam) => {
    router.push(`/team/${team.id}`);
    setSearchOpen(false);
    setQuery('');
  };

  const handleLeagueClick = (league: SearchableLeague) => {
    // Navigate to standings for that league
    router.push(`/standings?league=${league.id}`);
    setSearchOpen(false);
    setQuery('');
  };

  const handleMLBTeamClick = (team: SearchableMLBTeam) => {
    router.push(`/mlb/team/${team.id}`);
    setSearchOpen(false);
    setQuery('');
  };

  const handleNBATeamClick = (team: SearchableNBATeam) => {
    router.push(`/nba/team/${team.id}`);
    setSearchOpen(false);
    setQuery('');
  };

  const hasResults = results.teams.length > 0 || results.leagues.length > 0 || results.mlbTeams.length > 0 || results.nbaTeams.length > 0;

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md transition-theme"
      style={{
        backgroundColor: darkMode ? 'rgba(10, 15, 10, 0.95)' : 'rgba(245, 242, 232, 0.95)',
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo - hide when search is open on mobile */}
        <div className={`flex items-center gap-3 ${searchOpen ? 'hidden sm:flex' : 'flex'}`}>
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

        {/* Search and Controls */}
        <div ref={containerRef} className={`flex items-center gap-3 ${searchOpen ? 'flex-1 sm:flex-none' : ''}`}>
          {/* Search Bar */}
          {searchOpen ? (
            <div className="relative flex-1 sm:w-72">
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
              >
                <Search size={18} style={{ color: theme.textSecondary }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search teams, leagues..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: theme.text }}
                />
                <button onClick={() => { setSearchOpen(false); setQuery(''); }}>
                  <X size={18} style={{ color: theme.textSecondary }} />
                </button>
              </div>

              {/* Results Dropdown */}
              {query.length >= 2 && (
                <div
                  className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-xl shadow-lg"
                  style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
                >
                  {!hasResults ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm" style={{ color: theme.textSecondary }}>
                        No results for "{query}"
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Leagues */}
                      {results.leagues.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: theme.bgTertiary }}
                          >
                            Leagues
                          </div>
                          {results.leagues.map((league) => (
                            <button
                              key={league.id}
                              onClick={() => handleLeagueClick(league)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <img
                                src={league.logo}
                                alt={league.name}
                                className="h-6 w-6 object-contain"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {league.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {league.country}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Soccer Teams */}
                      {results.teams.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: theme.bgTertiary }}
                          >
                            ⚽ Soccer Teams
                          </div>
                          {results.teams.map((team) => (
                            <button
                              key={team.id}
                              onClick={() => handleTeamClick(team)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="h-8 w-8 object-contain"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {team.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {team.league}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* MLB Teams */}
                      {results.mlbTeams.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: theme.bgTertiary }}
                          >
                            ⚾ MLB Teams
                          </div>
                          {results.mlbTeams.map((team) => (
                            <button
                              key={`mlb-${team.id}`}
                              onClick={() => handleMLBTeamClick(team)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="h-8 w-8 object-contain"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {team.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {team.league} {team.division}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* NBA Teams */}
                      {results.nbaTeams.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: theme.bgTertiary }}
                          >
                            🏀 NBA Teams
                          </div>
                          {results.nbaTeams.map((team) => (
                            <button
                              key={`nba-${team.id}`}
                              onClick={() => handleNBATeamClick(team)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="h-8 w-8 object-contain"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {team.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {team.conference} - {team.division}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              style={{ border: `1px solid ${theme.border}` }}
              aria-label="Search"
            >
              <Search size={20} color={theme.text} />
            </button>
          )}

          {/* Theme Toggle */}
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
