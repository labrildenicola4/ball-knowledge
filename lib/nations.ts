// Nation configuration for grouping matches by country
// Teams are mapped to nations for Champions League/Copa Libertadores assignment

export interface Nation {
  id: string;
  name: string;
  flag: string;
  domesticLeagues: string[];  // Competition codes (e.g., 'PD', 'PL')
  internationalCompetitions: string[];  // CL, CLI, etc.
}

export const NATIONS: Nation[] = [
  {
    id: 'spain',
    name: 'Spain',
    flag: '🇪🇸',
    domesticLeagues: ['PD'],  // La Liga
    internationalCompetitions: ['CL'],
  },
  {
    id: 'england',
    name: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    domesticLeagues: ['PL', 'ELC'],  // Premier League, Championship
    internationalCompetitions: ['CL'],
  },
  {
    id: 'italy',
    name: 'Italy',
    flag: '🇮🇹',
    domesticLeagues: ['SA'],  // Serie A
    internationalCompetitions: ['CL'],
  },
  {
    id: 'germany',
    name: 'Germany',
    flag: '🇩🇪',
    domesticLeagues: ['BL1'],  // Bundesliga
    internationalCompetitions: ['CL'],
  },
  {
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    domesticLeagues: ['FL1'],  // Ligue 1
    internationalCompetitions: ['CL'],
  },
  {
    id: 'brazil',
    name: 'Brazil',
    flag: '🇧🇷',
    domesticLeagues: ['BSA'],  // Brasileirão
    internationalCompetitions: ['CLI'],  // Copa Libertadores
  },
  {
    id: 'portugal',
    name: 'Portugal',
    flag: '🇵🇹',
    domesticLeagues: ['PPL'],  // Primeira Liga
    internationalCompetitions: ['CL'],
  },
  {
    id: 'netherlands',
    name: 'Netherlands',
    flag: '🇳🇱',
    domesticLeagues: ['DED'],  // Eredivisie
    internationalCompetitions: ['CL'],
  },
];

// Map competition codes to their nation
// Domestic leagues map directly to one nation
export const LEAGUE_TO_NATION: Record<string, string> = {
  'PD': 'spain',      // La Liga
  'PL': 'england',    // Premier League
  'ELC': 'england',   // Championship
  'SA': 'italy',      // Serie A
  'BL1': 'germany',   // Bundesliga
  'FL1': 'france',    // Ligue 1
  'BSA': 'brazil',    // Brasileirão
  'PPL': 'portugal',  // Primeira Liga
  'DED': 'netherlands', // Eredivisie
};

// International competitions (CL, CLI) need team-based lookup
export const INTERNATIONAL_COMPETITIONS = ['CL', 'CLI'];

// Team ID to Nation mapping for Champions League teams (2024-25 season)
// Football-Data.org team IDs
export const TEAM_TO_NATION: Record<number, string> = {
  // Spain - La Liga teams in CL
  86: 'spain',    // Real Madrid
  81: 'spain',    // Barcelona
  78: 'spain',    // Atlético Madrid
  90: 'spain',    // Real Betis
  92: 'spain',    // Real Sociedad
  95: 'spain',    // Valencia
  94: 'spain',    // Villarreal
  559: 'spain',   // Sevilla
  82: 'spain',    // Getafe
  79: 'spain',    // Osasuna
  80: 'spain',    // Espanyol
  83: 'spain',    // Granada
  89: 'spain',    // Mallorca
  298: 'spain',   // Girona
  84: 'spain',    // Celta Vigo
  85: 'spain',    // Real Valladolid
  263: 'spain',   // Alavés
  275: 'spain',   // Las Palmas
  88: 'spain',    // Levante
  87: 'spain',    // Rayo Vallecano
  264: 'spain',   // Cádiz
  285: 'spain',   // Elche
  267: 'spain',   // Almería
  250: 'spain',   // Real Zaragoza
  262: 'spain',   // Racing Santander
  558: 'spain',   // Athletic Club

  // England - Premier League teams
  57: 'england',  // Arsenal
  58: 'england',  // Aston Villa
  61: 'england',  // Chelsea
  354: 'england', // Crystal Palace
  62: 'england',  // Everton
  63: 'england',  // Fulham
  64: 'england',  // Liverpool
  65: 'england',  // Manchester City
  66: 'england',  // Manchester United
  67: 'england',  // Newcastle United
  68: 'england',  // Norwich City (Championship)
  71: 'england',  // Tottenham Hotspur
  563: 'england', // West Ham United
  76: 'england',  // Wolverhampton
  397: 'england', // Brighton
  402: 'england', // Brentford
  351: 'england', // Nottingham Forest
  346: 'england', // Watford
  389: 'england', // Luton Town
  387: 'england', // Sheffield United
  328: 'england', // Burnley
  341: 'england', // Leeds United
  338: 'england', // Leicester City
  356: 'england', // Sheffield Wednesday
  343: 'england', // Middlesbrough
  70: 'england',  // Stoke City
  332: 'england', // Birmingham City
  355: 'england', // Reading
  72: 'england',  // Swansea City
  715: 'england', // Cardiff City
  73: 'england',  // Sunderland
  74: 'england',  // West Bromwich Albion
  69: 'england',  // QPR
  349: 'england', // Ipswich Town
  1044: 'england', // AFC Bournemouth

  // Italy - Serie A teams
  98: 'italy',    // AC Milan
  99: 'italy',    // Fiorentina
  100: 'italy',   // AS Roma
  102: 'italy',   // Atalanta
  103: 'italy',   // Bologna
  104: 'italy',   // Cagliari
  107: 'italy',   // Genoa
  108: 'italy',   // Inter
  109: 'italy',   // Juventus
  110: 'italy',   // Lazio
  113: 'italy',   // Napoli
  115: 'italy',   // Udinese
  445: 'italy',   // Empoli
  450: 'italy',   // Hellas Verona
  471: 'italy',   // Sassuolo
  472: 'italy',   // Parma
  584: 'italy',   // Torino
  586: 'italy',   // Sampdoria
  470: 'italy',   // Frosinone
  454: 'italy',   // Spezia
  455: 'italy',   // Salernitana
  5890: 'italy',  // Monza
  112: 'italy',   // Lecce
  1106: 'italy',  // Como 1907

  // Germany - Bundesliga teams
  1: 'germany',   // 1. FC Köln
  2: 'germany',   // TSG Hoffenheim
  3: 'germany',   // Bayer Leverkusen
  4: 'germany',   // Borussia Dortmund
  5: 'germany',   // Bayern München
  6: 'germany',   // FC Augsburg
  7: 'germany',   // Borussia M'gladbach
  9: 'germany',   // Hertha BSC
  10: 'germany',  // VfB Stuttgart
  11: 'germany',  // VfL Wolfsburg
  12: 'germany',  // Werder Bremen
  16: 'germany',  // FC St. Pauli
  17: 'germany',  // SC Freiburg
  18: 'germany',  // Eintracht Frankfurt
  19: 'germany',  // RB Leipzig
  28: 'germany',  // 1. FC Union Berlin
  36: 'germany',  // VfL Bochum
  38: 'germany',  // 1. FSV Mainz 05
  44: 'germany',  // 1. FC Heidenheim
  721: 'germany', // Holstein Kiel

  // France - Ligue 1 teams
  516: 'france',  // Marseille
  518: 'france',  // Montpellier
  521: 'france',  // Lille
  522: 'france',  // Nice
  523: 'france',  // Lyon
  524: 'france',  // Paris Saint-Germain
  525: 'france',  // Toulouse
  527: 'france',  // Saint-Étienne
  528: 'france',  // Monaco
  529: 'france',  // Rennes
  532: 'france',  // Angers
  533: 'france',  // Nantes
  541: 'france',  // Auxerre
  543: 'france',  // Reims
  545: 'france',  // Metz
  546: 'france',  // Le Havre
  547: 'france',  // Lens
  548: 'france',  // Strasbourg
  556: 'france',  // Brest
  576: 'france',  // Clermont Foot

  // Portugal - Primeira Liga teams
  498: 'portugal', // Sporting CP
  503: 'portugal', // FC Porto
  495: 'portugal', // Benfica
  496: 'portugal', // Rio Ave
  497: 'portugal', // Sporting Braga
  5531: 'portugal', // Famalicão
  500: 'portugal', // Boavista
  501: 'portugal', // Marítimo
  582: 'portugal', // Gil Vicente
  583: 'portugal', // Vitória SC
  712: 'portugal', // Casa Pia
  610: 'portugal', // Estoril
  5530: 'portugal', // Vizela
  720: 'portugal', // Santa Clara
  5613: 'portugal', // Arouca
  1903: 'portugal', // Portimonense
  5543: 'portugal', // Moreirense

  // Netherlands - Eredivisie teams
  666: 'netherlands', // Twente
  671: 'netherlands', // Heracles Almelo
  672: 'netherlands', // Willem II
  673: 'netherlands', // Vitesse
  674: 'netherlands', // PSV
  675: 'netherlands', // Feyenoord
  676: 'netherlands', // FC Utrecht
  677: 'netherlands', // FC Groningen
  678: 'netherlands', // Ajax
  679: 'netherlands', // SC Heerenveen
  680: 'netherlands', // RKC Waalwijk
  681: 'netherlands', // NEC
  682: 'netherlands', // AZ Alkmaar
  683: 'netherlands', // Go Ahead Eagles
  684: 'netherlands', // PEC Zwolle
  718: 'netherlands', // Sparta Rotterdam
  1911: 'netherlands', // Almere City FC
  1914: 'netherlands', // Fortuna Sittard
  1915: 'netherlands', // NAC Breda

  // Brazil - Brasileirão teams
  1759: 'brazil', // Flamengo
  1765: 'brazil', // Fluminense
  1766: 'brazil', // Vasco da Gama
  1767: 'brazil', // Botafogo
  1769: 'brazil', // Palmeiras
  1770: 'brazil', // São Paulo
  1771: 'brazil', // Santos
  1772: 'brazil', // Corinthians
  1776: 'brazil', // Grêmio
  1777: 'brazil', // Internacional
  1779: 'brazil', // Athletico Paranaense
  1780: 'brazil', // Cruzeiro
  1781: 'brazil', // Atlético Mineiro
  1783: 'brazil', // Bahia
  1785: 'brazil', // Fortaleza
  1786: 'brazil', // Ceará
  1787: 'brazil', // Sport Recife
  1789: 'brazil', // Goiás
  1791: 'brazil', // Juventude
  1792: 'brazil', // Cuiabá
  1794: 'brazil', // Red Bull Bragantino
  6684: 'brazil', // América MG
};

// Helper: Get nation ID for a match based on league code and team IDs
export function getNationsForMatch(
  leagueCode: string,
  homeTeamId: number,
  awayTeamId: number
): string[] {
  // If it's a domestic league, return the single nation
  if (LEAGUE_TO_NATION[leagueCode]) {
    return [LEAGUE_TO_NATION[leagueCode]];
  }

  // For international competitions, look up both teams
  if (INTERNATIONAL_COMPETITIONS.includes(leagueCode)) {
    const nations = new Set<string>();

    const homeNation = TEAM_TO_NATION[homeTeamId];
    const awayNation = TEAM_TO_NATION[awayTeamId];

    if (homeNation) nations.add(homeNation);
    if (awayNation) nations.add(awayNation);

    // If we found nations, return them
    if (nations.size > 0) {
      return Array.from(nations);
    }
  }

  // Fallback: return empty array (match won't be grouped)
  return [];
}

// Helper: Get nation by ID
export function getNationById(nationId: string): Nation | undefined {
  return NATIONS.find(n => n.id === nationId);
}

// Helper: Get all league codes we need to fetch
export function getAllLeagueCodes(): string[] {
  const codes = new Set<string>();

  for (const nation of NATIONS) {
    for (const league of nation.domesticLeagues) {
      codes.add(league);
    }
    for (const comp of nation.internationalCompetitions) {
      codes.add(comp);
    }
  }

  return Array.from(codes);
}

// Get internal league ID from competition code
export function getLeagueIdFromCode(code: string): string {
  const mapping: Record<string, string> = {
    'PD': 'laliga',
    'PL': 'premier',
    'ELC': 'championship',
    'SA': 'seriea',
    'BL1': 'bundesliga',
    'FL1': 'ligue1',
    'BSA': 'brasileirao',
    'PPL': 'primeiraliga',
    'DED': 'eredivisie',
    'CL': 'championsleague',
    'CLI': 'copalibertadores',
  };
  return mapping[code] || code.toLowerCase();
}
