// Consolidated league constants for API-Football
// Source of truth for all league ID and code mappings

export interface LeagueConfig {
  key: string;           // Internal key (e.g., 'premier')
  slug: string;          // URL-friendly slug (e.g., 'premier-league')
  id: number;            // API-Football league ID
  code: string;          // Short code (e.g., 'PL')
  name: string;          // Full display name
  shortName: string;     // Short display name
  country: string;       // Country/region
  type: 'league' | 'cup';
}

// All leagues with full metadata
export const LEAGUES: LeagueConfig[] = [
  // Top 5 European leagues
  { key: 'premier', slug: 'premier-league', id: 39, code: 'PL', name: 'Premier League', shortName: 'EPL', country: 'England', type: 'league' },
  { key: 'laliga', slug: 'la-liga', id: 140, code: 'PD', name: 'La Liga', shortName: 'La Liga', country: 'Spain', type: 'league' },
  { key: 'seriea', slug: 'serie-a', id: 135, code: 'SA', name: 'Serie A', shortName: 'Serie A', country: 'Italy', type: 'league' },
  { key: 'bundesliga', slug: 'bundesliga', id: 78, code: 'BL1', name: 'Bundesliga', shortName: 'Bundesliga', country: 'Germany', type: 'league' },
  { key: 'ligue1', slug: 'ligue-1', id: 61, code: 'FL1', name: 'Ligue 1', shortName: 'Ligue 1', country: 'France', type: 'league' },
  // Additional leagues
  { key: 'primeiraliga', slug: 'primeira-liga', id: 94, code: 'PPL', name: 'Primeira Liga', shortName: 'Liga Portugal', country: 'Portugal', type: 'league' },
  { key: 'eredivisie', slug: 'eredivisie', id: 88, code: 'DED', name: 'Eredivisie', shortName: 'Eredivisie', country: 'Netherlands', type: 'league' },
  { key: 'championship', slug: 'championship', id: 40, code: 'ELC', name: 'EFL Championship', shortName: 'Championship', country: 'England', type: 'league' },
  { key: 'brasileirao', slug: 'brasileirao', id: 71, code: 'BSA', name: 'Brasileirao Serie A', shortName: 'Brasileirao', country: 'Brazil', type: 'league' },
  // Domestic cups
  { key: 'facup', slug: 'fa-cup', id: 45, code: 'FAC', name: 'FA Cup', shortName: 'FA Cup', country: 'England', type: 'cup' },
  { key: 'copadelrey', slug: 'copa-del-rey', id: 143, code: 'CDR', name: 'Copa del Rey', shortName: 'Copa del Rey', country: 'Spain', type: 'cup' },
  { key: 'coppadeitalia', slug: 'coppa-italia', id: 137, code: 'CIT', name: 'Coppa Italia', shortName: 'Coppa Italia', country: 'Italy', type: 'cup' },
  { key: 'dfbpokal', slug: 'dfb-pokal', id: 81, code: 'DFB', name: 'DFB-Pokal', shortName: 'DFB-Pokal', country: 'Germany', type: 'cup' },
  { key: 'coupdefrance', slug: 'coupe-de-france', id: 66, code: 'CDF', name: 'Coupe de France', shortName: 'Coupe de France', country: 'France', type: 'cup' },
  // International/European
  { key: 'championsleague', slug: 'champions-league', id: 2, code: 'CL', name: 'UEFA Champions League', shortName: 'UCL', country: 'Europe', type: 'cup' },
  { key: 'europaleague', slug: 'europa-league', id: 3, code: 'EL', name: 'UEFA Europa League', shortName: 'UEL', country: 'Europe', type: 'cup' },
  { key: 'copalibertadores', slug: 'copa-libertadores', id: 13, code: 'CLI', name: 'Copa Libertadores', shortName: 'Libertadores', country: 'South America', type: 'cup' },
];

// League IDs in API-Football (key -> API-Football ID)
export const LEAGUE_IDS: Record<string, number> = Object.fromEntries(
  LEAGUES.map(l => [l.key, l.id])
);

// Reverse mapping: API-Football ID -> league key
export const LEAGUE_ID_TO_KEY: Record<number, string> = Object.fromEntries(
  Object.entries(LEAGUE_IDS).map(([key, id]) => [id, key])
);

// Map API-Football league IDs to short codes (for display/storage)
export const LEAGUE_ID_TO_CODE: Record<number, string> = {
  39: 'PL',    // Premier League
  140: 'PD',   // La Liga
  135: 'SA',   // Serie A
  78: 'BL1',   // Bundesliga
  61: 'FL1',   // Ligue 1
  94: 'PPL',   // Primeira Liga
  88: 'DED',   // Eredivisie
  40: 'ELC',   // Championship
  71: 'BSA',   // Brasileirao
  2: 'CL',     // Champions League
  3: 'EL',     // Europa League
  13: 'CLI',   // Copa Libertadores
  143: 'CDR',  // Copa del Rey
  45: 'FAC',   // FA Cup
  66: 'CDF',   // Coupe de France
  137: 'CIT',  // Coppa Italia
  81: 'DFB',   // DFB Pokal
};

// Reverse mapping: short code -> API-Football ID
export const CODE_TO_LEAGUE_ID: Record<string, number> = Object.fromEntries(
  Object.entries(LEAGUE_ID_TO_CODE).map(([id, code]) => [code, Number(id)])
);

// Reverse mapping: short code -> league key
export const CODE_TO_LEAGUE_KEY: Record<string, string> = {
  'PL': 'premier',
  'PD': 'laliga',
  'SA': 'seriea',
  'BL1': 'bundesliga',
  'FL1': 'ligue1',
  'PPL': 'primeiraliga',
  'DED': 'eredivisie',
  'ELC': 'championship',
  'BSA': 'brasileirao',
  'CL': 'championsleague',
  'EL': 'europaleague',
  'CLI': 'copalibertadores',
  'CDR': 'copadelrey',
  'FAC': 'facup',
  'CDF': 'coupdefrance',
  'CIT': 'coppadeitalia',
  'DFB': 'dfbpokal',
};

// Set of supported league IDs for filtering
export const SUPPORTED_LEAGUE_IDS = new Set(Object.keys(LEAGUE_ID_TO_CODE).map(Number));

// Lookup helpers
export function getLeagueBySlug(slug: string): LeagueConfig | undefined {
  return LEAGUES.find(l => l.slug === slug);
}

export function getLeagueById(id: number): LeagueConfig | undefined {
  return LEAGUES.find(l => l.id === id);
}

export function getLeagueByKey(key: string): LeagueConfig | undefined {
  return LEAGUES.find(l => l.key === key);
}

export function getLeagueByCode(code: string): LeagueConfig | undefined {
  return LEAGUES.find(l => l.code === code);
}

// Get all leagues of a specific type
export function getLeaguesByType(type: 'league' | 'cup'): LeagueConfig[] {
  return LEAGUES.filter(l => l.type === type);
}

// Get all leagues for a specific country
export function getLeaguesByCountry(country: string): LeagueConfig[] {
  return LEAGUES.filter(l => l.country.toLowerCase() === country.toLowerCase());
}
