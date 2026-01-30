// Consolidated league constants for API-Football
// Source of truth for all league ID and code mappings

// League IDs in API-Football (key -> API-Football ID)
export const LEAGUE_IDS: Record<string, number> = {
  // Top 5 European leagues
  premier: 39,
  laliga: 140,
  seriea: 135,
  bundesliga: 78,
  ligue1: 61,
  // Additional leagues
  primeiraliga: 94,
  eredivisie: 88,
  championship: 40,
  brasileirao: 71,
  // Domestic cups
  copadelrey: 143,
  facup: 45,
  coupdefrance: 66,
  coppadeitalia: 137,
  dfbpokal: 81,
  // International
  championsleague: 2,
  europaleague: 3,
  conferenceleague: 848,
  copalibertadores: 13,
};

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
  848: 'ECL',  // Conference League
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
  'ECL': 'conferenceleague',
  'CLI': 'copalibertadores',
  'CDR': 'copadelrey',
  'FAC': 'facup',
  'CDF': 'coupdefrance',
  'CIT': 'coppadeitalia',
  'DFB': 'dfbpokal',
};

// Set of supported league IDs for filtering
export const SUPPORTED_LEAGUE_IDS = new Set(Object.keys(LEAGUE_ID_TO_CODE).map(Number));
