// Tournament configurations

export interface TournamentConfig {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  sport: 'basketball' | 'football' | 'soccer';
  type: 'knockout' | 'bracket' | 'playoff';
  active: boolean; // Whether the tournament is currently in season
  startMonth?: number; // Month when tournament typically starts (0-indexed)
  endMonth?: number; // Month when tournament typically ends
}

export const TOURNAMENTS: TournamentConfig[] = [
  // College Basketball
  {
    id: 'march-madness',
    slug: 'march-madness',
    name: 'NCAA March Madness',
    shortName: 'March Madness',
    sport: 'basketball',
    type: 'bracket',
    active: false, // Set to true during tournament
    startMonth: 2, // March
    endMonth: 3, // April
  },
  // Soccer
  {
    id: 'champions-league',
    slug: 'champions-league',
    name: 'UEFA Champions League',
    shortName: 'UCL',
    sport: 'soccer',
    type: 'knockout',
    active: true,
    startMonth: 8, // September
    endMonth: 5, // June
  },
  {
    id: 'europa-league',
    slug: 'europa-league',
    name: 'UEFA Europa League',
    shortName: 'UEL',
    sport: 'soccer',
    type: 'knockout',
    active: true,
    startMonth: 8, // September
    endMonth: 4, // May
  },
  {
    id: 'copa-libertadores',
    slug: 'copa-libertadores',
    name: 'Copa Libertadores',
    shortName: 'Libertadores',
    sport: 'soccer',
    type: 'knockout',
    active: true,
    startMonth: 1, // February
    endMonth: 10, // November
  },
  // Future: NBA/MLB Playoffs
  {
    id: 'nba-playoffs',
    slug: 'nba-playoffs',
    name: 'NBA Playoffs',
    shortName: 'NBA Playoffs',
    sport: 'basketball',
    type: 'playoff',
    active: false,
    startMonth: 3, // April
    endMonth: 5, // June
  },
];

// Lookup helpers
export function getTournamentBySlug(slug: string): TournamentConfig | undefined {
  return TOURNAMENTS.find(t => t.slug === slug);
}

export function getTournamentById(id: string): TournamentConfig | undefined {
  return TOURNAMENTS.find(t => t.id === id);
}

export function getActiveTournaments(): TournamentConfig[] {
  return TOURNAMENTS.filter(t => t.active);
}

export function getTournamentsBySport(sport: 'basketball' | 'football' | 'soccer'): TournamentConfig[] {
  return TOURNAMENTS.filter(t => t.sport === sport);
}
