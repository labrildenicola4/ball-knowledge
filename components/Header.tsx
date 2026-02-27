'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Sun, Moon, Search, X } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { tapLight } from '@/lib/haptics';
import Link from 'next/link';
import { searchAll, type SearchableTeam, type SearchableSoccerLeague, type SearchableAmericanLeague, type SearchableMLBTeam, type SearchableNBATeam, type SearchableNFLTeam, type SearchableNHLTeam, type SearchableCollegeBasketballTeam, type SearchableCollegeFootballTeam, type SearchableF1Driver, type SearchableGolfer, type SearchableUFCFighter } from '@/lib/search-data';
import { SafeImage } from '@/components/SafeImage';

export function Header() {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ teams: SearchableTeam[]; leagues: SearchableSoccerLeague[]; americanLeagues: SearchableAmericanLeague[]; mlbTeams: SearchableMLBTeam[]; nbaTeams: SearchableNBATeam[]; nflTeams: SearchableNFLTeam[]; nhlTeams: SearchableNHLTeam[]; collegeBasketballTeams: SearchableCollegeBasketballTeam[]; collegeFootballTeams: SearchableCollegeFootballTeam[]; f1Drivers: SearchableF1Driver[]; golfers: SearchableGolfer[]; ufcFighters: SearchableUFCFighter[] }>({
    teams: [],
    leagues: [],
    americanLeagues: [],
    mlbTeams: [],
    nbaTeams: [],
    nflTeams: [],
    nhlTeams: [],
    collegeBasketballTeams: [],
    collegeFootballTeams: [],
    f1Drivers: [],
    golfers: [],
    ufcFighters: [],
  });
  const [playerResults, setPlayerResults] = useState<Array<{ id: string; name: string; sport: string; sportDisplay: string; team: string; headshot: string; jersey: string }>>([]);
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
        setResults({ teams: [], leagues: [], americanLeagues: [], mlbTeams: [], nbaTeams: [], nflTeams: [], nhlTeams: [], collegeBasketballTeams: [], collegeFootballTeams: [], f1Drivers: [], golfers: [], ufcFighters: [] });
        setPlayerResults([]);
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
      setResults({ teams: [], leagues: [], americanLeagues: [], mlbTeams: [], nbaTeams: [], nflTeams: [], nhlTeams: [], collegeBasketballTeams: [], collegeFootballTeams: [], f1Drivers: [], golfers: [], ufcFighters: [] });
    }

    if (query.length >= 3) {
      fetch(`/api/search/players?q=${encodeURIComponent(query)}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => setPlayerResults(data))
        .catch(() => setPlayerResults([]));
    } else {
      setPlayerResults([]);
    }
  }, [query]);

  const handleTeamClick = (team: SearchableTeam) => {
    router.push(`/team/${team.id}`);
    setSearchOpen(false);
    setQuery('');
  };

  const handleLeagueClick = (league: SearchableSoccerLeague) => {
    // Navigate to league page
    router.push(`/league/${league.slug}`);
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

  const handleNFLTeamClick = (team: SearchableNFLTeam) => {
    router.push(`/nfl/team/${team.id}`);
    setSearchOpen(false);
    setQuery('');
  };

  const handleNHLTeamClick = (team: SearchableNHLTeam) => {
    router.push(`/nhl/team/${team.id}`);
    setSearchOpen(false);
    setQuery('');
  };

  const handleCollegeBasketballTeamClick = (team: SearchableCollegeBasketballTeam) => {
    router.push(`/basketball/team/${team.id}`);
    setSearchOpen(false);
    setQuery('');
  };

  const handleCollegeFootballTeamClick = (team: SearchableCollegeFootballTeam) => {
    router.push(`/football/team/${team.id}`);
    setSearchOpen(false);
    setQuery('');
  };

  const handleAmericanLeagueClick = (league: SearchableAmericanLeague) => {
    router.push(league.href);
    setSearchOpen(false);
    setQuery('');
  };

  const hasResults = results.teams.length > 0 || results.leagues.length > 0 || results.americanLeagues.length > 0 || results.mlbTeams.length > 0 || results.nbaTeams.length > 0 || results.nflTeams.length > 0 || results.nhlTeams.length > 0 || results.collegeBasketballTeams.length > 0 || results.collegeFootballTeams.length > 0 || results.f1Drivers.length > 0 || results.golfers.length > 0 || results.ufcFighters.length > 0 || playerResults.length > 0;

  return (
    <header
      className="sticky top-0 z-50 transition-theme glass-header"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
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
                className="flex items-center gap-2 rounded-full px-4 py-2 glass-pill"
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
                <button onClick={() => { setSearchOpen(false); setQuery(''); }} className="tap-highlight flex h-11 w-11 items-center justify-center">
                  <X size={18} style={{ color: theme.textSecondary }} />
                </button>
              </div>

              {/* Results Dropdown */}
              {query.length >= 2 && (
                <div
                  className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-xl shadow-lg glass-dropdown"
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
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            Leagues & Cups
                          </div>
                          {results.leagues.map((league) => (
                            <button
                              key={league.id}
                              onClick={() => handleLeagueClick(league)}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={league.logo}
                                alt={league.name}
                                className="h-8 w-8 object-contain logo-glow"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {league.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {league.country} • {league.type === 'cup' ? 'Cup' : 'League'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* American Sports Leagues */}
                      {results.americanLeagues.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            American Sports
                          </div>
                          {results.americanLeagues.map((league) => (
                            <button
                              key={league.id}
                              onClick={() => handleAmericanLeagueClick(league)}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={league.logo}
                                alt={league.name}
                                className="h-8 w-8 object-contain logo-glow"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {league.shortName}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {league.name}
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
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            Soccer
                          </div>
                          {results.teams.map((team) => (
                            <button
                              key={team.id}
                              onClick={() => handleTeamClick(team)}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={team.logo}
                                alt={team.name}
                                className="h-8 w-8 object-contain logo-glow"
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
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            MLB
                          </div>
                          {results.mlbTeams.map((team) => (
                            <button
                              key={`mlb-${team.id}`}
                              onClick={() => handleMLBTeamClick(team)}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={team.logo}
                                alt={team.name}
                                className="h-8 w-8 object-contain logo-glow"
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
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            NBA
                          </div>
                          {results.nbaTeams.map((team) => (
                            <button
                              key={`nba-${team.id}`}
                              onClick={() => handleNBATeamClick(team)}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={team.logo}
                                alt={team.name}
                                className="h-8 w-8 object-contain logo-glow"
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

                      {/* NFL Teams */}
                      {results.nflTeams.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            NFL
                          </div>
                          {results.nflTeams.map((team) => (
                            <button
                              key={`nfl-${team.id}`}
                              onClick={() => handleNFLTeamClick(team)}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={team.logo}
                                alt={team.name}
                                className="h-8 w-8 object-contain logo-glow"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {team.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {team.conference} {team.division}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* NHL Teams */}
                      {results.nhlTeams.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            NHL
                          </div>
                          {results.nhlTeams.map((team) => (
                            <button
                              key={`nhl-${team.id}`}
                              onClick={() => handleNHLTeamClick(team)}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={team.logo}
                                alt={team.name}
                                className="h-8 w-8 object-contain logo-glow"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {team.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {team.conference} {team.division}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* College Basketball Teams */}
                      {results.collegeBasketballTeams.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            NCAA Basketball
                          </div>
                          {results.collegeBasketballTeams.map((team) => (
                            <button
                              key={`ncaab-${team.id}`}
                              onClick={() => handleCollegeBasketballTeamClick(team)}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={team.logo}
                                alt={team.name}
                                className="h-8 w-8 object-contain logo-glow"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {team.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {team.conference}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* College Football Teams */}
                      {results.collegeFootballTeams.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            NCAA Football
                          </div>
                          {results.collegeFootballTeams.map((team) => (
                            <button
                              key={`ncaaf-${team.id}`}
                              onClick={() => handleCollegeFootballTeamClick(team)}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={team.logo}
                                alt={team.name}
                                className="h-8 w-8 object-contain logo-glow"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {team.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {team.conference}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Players (dynamic ESPN search) */}
                      {playerResults.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            Players
                          </div>
                          {playerResults.map((player) => (
                            <Link
                              key={`player-${player.sport}-${player.id}`}
                              href={`/player/${player.sport}/${player.id}`}
                              onClick={() => { setQuery(''); setSearchOpen(false); }}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={player.headshot}
                                alt={player.name}
                                className="h-8 w-8 rounded-full object-cover"
                                style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : theme.bgTertiary }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {player.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {player.team}{player.team && ' · '}{player.sportDisplay}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* F1 Drivers */}
                      {results.f1Drivers.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            F1 Drivers
                          </div>
                          {results.f1Drivers.map((driver) => (
                            <Link
                              key={`f1-${driver.id}`}
                              href={`/player/f1/${driver.id}`}
                              onClick={() => { setQuery(''); setSearchOpen(false); }}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={driver.headshot}
                                alt={driver.name}
                                className="h-8 w-8 rounded-full object-cover"
                                style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : theme.bgTertiary }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {driver.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {driver.team} · {driver.nationality}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Golfers */}
                      {results.golfers.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            Golfers
                          </div>
                          {results.golfers.map((golfer) => (
                            <Link
                              key={`golf-${golfer.id}`}
                              href={`/player/golf/${golfer.id}`}
                              onClick={() => { setQuery(''); setSearchOpen(false); }}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={golfer.headshot}
                                alt={golfer.name}
                                className="h-8 w-8 rounded-full object-cover"
                                style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : theme.bgTertiary }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {golfer.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {golfer.country}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* UFC Fighters */}
                      {results.ufcFighters.length > 0 && (
                        <div>
                          <div
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: theme.textSecondary, backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.3)' : theme.bgTertiary }}
                          >
                            UFC Fighters
                          </div>
                          {results.ufcFighters.map((fighter) => (
                            <Link
                              key={`ufc-${fighter.id}`}
                              href={`/player/ufc/${fighter.id}`}
                              onClick={() => { setQuery(''); setSearchOpen(false); }}
                              className="card-press flex w-full items-center gap-3 px-4 py-3 text-left hover:opacity-80"
                              style={{ borderBottom: `1px solid ${theme.border}` }}
                            >
                              <SafeImage
                                src={fighter.headshot}
                                alt={fighter.name}
                                className="h-8 w-8 rounded-full object-cover"
                                style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : theme.bgTertiary }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>
                                  {fighter.name}
                                </p>
                                <p className="text-xs" style={{ color: theme.textSecondary }}>
                                  {fighter.weightClass} · {fighter.country}
                                </p>
                              </div>
                            </Link>
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
              className="tap-highlight flex h-11 w-11 items-center justify-center rounded-full transition-colors glass-pill"
              aria-label="Search"
            >
              <Search size={20} color={theme.text} />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => { tapLight(); toggleDarkMode(); }}
            className="tap-highlight flex h-11 w-11 items-center justify-center rounded-full transition-colors glass-pill"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={20} color={theme.text} /> : <Moon size={20} color={theme.text} />}
          </button>
        </div>
      </div>
    </header>
  );
}
