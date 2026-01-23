// Searchable data for teams and leagues

export interface SearchableTeam {
  id: number;
  name: string;
  shortName: string;
  league: string;
  leagueCode: string;
}

export interface SearchableLeague {
  id: string;
  name: string;
  code: string;
  country: string;
  flag: string;
}

// Major leagues
export const LEAGUES: SearchableLeague[] = [
  { id: 'laliga', name: 'La Liga', code: 'PD', country: 'Spain', flag: '🇪🇸' },
  { id: 'premier', name: 'Premier League', code: 'PL', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'seriea', name: 'Serie A', code: 'SA', country: 'Italy', flag: '🇮🇹' },
  { id: 'bundesliga', name: 'Bundesliga', code: 'BL1', country: 'Germany', flag: '🇩🇪' },
  { id: 'ligue1', name: 'Ligue 1', code: 'FL1', country: 'France', flag: '🇫🇷' },
  { id: 'championship', name: 'Championship', code: 'ELC', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'eredivisie', name: 'Eredivisie', code: 'DED', country: 'Netherlands', flag: '🇳🇱' },
  { id: 'primeiraliga', name: 'Primeira Liga', code: 'PPL', country: 'Portugal', flag: '🇵🇹' },
  { id: 'brasileirao', name: 'Brasileirão', code: 'BSA', country: 'Brazil', flag: '🇧🇷' },
  { id: 'championsleague', name: 'Champions League', code: 'CL', country: 'Europe', flag: '🏆' },
  { id: 'copalibertadores', name: 'Copa Libertadores', code: 'CLI', country: 'South America', flag: '🏆' },
];

// Major teams from top leagues
export const TEAMS: SearchableTeam[] = [
  // Spain - La Liga
  { id: 86, name: 'Real Madrid', shortName: 'RMA', league: 'La Liga', leagueCode: 'PD' },
  { id: 81, name: 'FC Barcelona', shortName: 'BAR', league: 'La Liga', leagueCode: 'PD' },
  { id: 78, name: 'Atlético Madrid', shortName: 'ATM', league: 'La Liga', leagueCode: 'PD' },
  { id: 559, name: 'Sevilla FC', shortName: 'SEV', league: 'La Liga', leagueCode: 'PD' },
  { id: 92, name: 'Real Sociedad', shortName: 'RSO', league: 'La Liga', leagueCode: 'PD' },
  { id: 90, name: 'Real Betis', shortName: 'BET', league: 'La Liga', leagueCode: 'PD' },
  { id: 94, name: 'Villarreal CF', shortName: 'VIL', league: 'La Liga', leagueCode: 'PD' },
  { id: 77, name: 'Athletic Club', shortName: 'ATH', league: 'La Liga', leagueCode: 'PD' },
  { id: 95, name: 'Valencia CF', shortName: 'VAL', league: 'La Liga', leagueCode: 'PD' },
  { id: 89, name: 'RCD Mallorca', shortName: 'MLL', league: 'La Liga', leagueCode: 'PD' },
  { id: 82, name: 'Getafe CF', shortName: 'GET', league: 'La Liga', leagueCode: 'PD' },
  { id: 79, name: 'CA Osasuna', shortName: 'OSA', league: 'La Liga', leagueCode: 'PD' },
  { id: 263, name: 'Deportivo Alavés', shortName: 'ALA', league: 'La Liga', leagueCode: 'PD' },
  { id: 275, name: 'UD Las Palmas', shortName: 'LPA', league: 'La Liga', leagueCode: 'PD' },
  { id: 250, name: 'Real Valladolid', shortName: 'VLL', league: 'La Liga', leagueCode: 'PD' },
  { id: 264, name: 'Celta Vigo', shortName: 'CEL', league: 'La Liga', leagueCode: 'PD' },
  { id: 298, name: 'Girona FC', shortName: 'GIR', league: 'La Liga', leagueCode: 'PD' },
  { id: 285, name: 'Rayo Vallecano', shortName: 'RAY', league: 'La Liga', leagueCode: 'PD' },
  { id: 267, name: 'RCD Espanyol', shortName: 'ESP', league: 'La Liga', leagueCode: 'PD' },
  { id: 745, name: 'CD Leganés', shortName: 'LEG', league: 'La Liga', leagueCode: 'PD' },

  // England - Premier League
  { id: 65, name: 'Manchester City', shortName: 'MCI', league: 'Premier League', leagueCode: 'PL' },
  { id: 57, name: 'Arsenal', shortName: 'ARS', league: 'Premier League', leagueCode: 'PL' },
  { id: 64, name: 'Liverpool', shortName: 'LIV', league: 'Premier League', leagueCode: 'PL' },
  { id: 66, name: 'Manchester United', shortName: 'MUN', league: 'Premier League', leagueCode: 'PL' },
  { id: 61, name: 'Chelsea', shortName: 'CHE', league: 'Premier League', leagueCode: 'PL' },
  { id: 73, name: 'Tottenham Hotspur', shortName: 'TOT', league: 'Premier League', leagueCode: 'PL' },
  { id: 58, name: 'Aston Villa', shortName: 'AVL', league: 'Premier League', leagueCode: 'PL' },
  { id: 67, name: 'Newcastle United', shortName: 'NEW', league: 'Premier League', leagueCode: 'PL' },
  { id: 397, name: 'Brighton & Hove Albion', shortName: 'BHA', league: 'Premier League', leagueCode: 'PL' },
  { id: 76, name: 'Wolverhampton', shortName: 'WOL', league: 'Premier League', leagueCode: 'PL' },
  { id: 63, name: 'Fulham', shortName: 'FUL', league: 'Premier League', leagueCode: 'PL' },
  { id: 354, name: 'Crystal Palace', shortName: 'CRY', league: 'Premier League', leagueCode: 'PL' },
  { id: 402, name: 'Brentford', shortName: 'BRE', league: 'Premier League', leagueCode: 'PL' },
  { id: 62, name: 'Everton', shortName: 'EVE', league: 'Premier League', leagueCode: 'PL' },
  { id: 351, name: 'Nottingham Forest', shortName: 'NFO', league: 'Premier League', leagueCode: 'PL' },
  { id: 74, name: 'West Ham United', shortName: 'WHU', league: 'Premier League', leagueCode: 'PL' },
  { id: 1044, name: 'AFC Bournemouth', shortName: 'BOU', league: 'Premier League', leagueCode: 'PL' },
  { id: 338, name: 'Leicester City', shortName: 'LEI', league: 'Premier League', leagueCode: 'PL' },
  { id: 346, name: 'Southampton', shortName: 'SOU', league: 'Premier League', leagueCode: 'PL' },
  { id: 349, name: 'Ipswich Town', shortName: 'IPS', league: 'Premier League', leagueCode: 'PL' },

  // Germany - Bundesliga
  { id: 5, name: 'Bayern München', shortName: 'FCB', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 4, name: 'Borussia Dortmund', shortName: 'BVB', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 721, name: 'RB Leipzig', shortName: 'RBL', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 3, name: 'Bayer Leverkusen', shortName: 'B04', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 19, name: 'Eintracht Frankfurt', shortName: 'SGE', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 11, name: 'VfL Wolfsburg', shortName: 'WOB', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 18, name: 'Borussia Mönchengladbach', shortName: 'BMG', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 10, name: 'VfB Stuttgart', shortName: 'VFB', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 17, name: 'SC Freiburg', shortName: 'SCF', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 2, name: 'TSG Hoffenheim', shortName: 'TSG', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 12, name: 'Werder Bremen', shortName: 'SVW', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 1, name: 'FC Köln', shortName: 'KOE', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 28, name: '1. FC Union Berlin', shortName: 'FCU', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 16, name: 'FC Augsburg', shortName: 'FCA', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 44, name: '1. FC Heidenheim', shortName: 'HDH', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 15, name: 'Mainz 05', shortName: 'M05', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 9, name: 'Hertha BSC', shortName: 'BSC', league: 'Bundesliga', leagueCode: 'BL1' },
  { id: 36, name: 'VfL Bochum', shortName: 'BOC', league: 'Bundesliga', leagueCode: 'BL1' },

  // Italy - Serie A
  { id: 109, name: 'Juventus', shortName: 'JUV', league: 'Serie A', leagueCode: 'SA' },
  { id: 108, name: 'Inter Milan', shortName: 'INT', league: 'Serie A', leagueCode: 'SA' },
  { id: 98, name: 'AC Milan', shortName: 'MIL', league: 'Serie A', leagueCode: 'SA' },
  { id: 113, name: 'Napoli', shortName: 'NAP', league: 'Serie A', leagueCode: 'SA' },
  { id: 100, name: 'AS Roma', shortName: 'ROM', league: 'Serie A', leagueCode: 'SA' },
  { id: 110, name: 'Lazio', shortName: 'LAZ', league: 'Serie A', leagueCode: 'SA' },
  { id: 99, name: 'Fiorentina', shortName: 'FIO', league: 'Serie A', leagueCode: 'SA' },
  { id: 102, name: 'Atalanta', shortName: 'ATA', league: 'Serie A', leagueCode: 'SA' },
  { id: 1106, name: 'Bologna', shortName: 'BOL', league: 'Serie A', leagueCode: 'SA' },
  { id: 103, name: 'Torino', shortName: 'TOR', league: 'Serie A', leagueCode: 'SA' },
  { id: 115, name: 'Udinese', shortName: 'UDI', league: 'Serie A', leagueCode: 'SA' },
  { id: 471, name: 'Sassuolo', shortName: 'SAS', league: 'Serie A', leagueCode: 'SA' },
  { id: 445, name: 'Empoli', shortName: 'EMP', league: 'Serie A', leagueCode: 'SA' },
  { id: 450, name: 'Hellas Verona', shortName: 'VER', league: 'Serie A', leagueCode: 'SA' },
  { id: 5890, name: 'Monza', shortName: 'MON', league: 'Serie A', leagueCode: 'SA' },
  { id: 104, name: 'Genoa', shortName: 'GEN', league: 'Serie A', leagueCode: 'SA' },
  { id: 488, name: 'Cagliari', shortName: 'CAG', league: 'Serie A', leagueCode: 'SA' },
  { id: 1579, name: 'Lecce', shortName: 'LEC', league: 'Serie A', leagueCode: 'SA' },
  { id: 6704, name: 'Venezia', shortName: 'VEN', league: 'Serie A', leagueCode: 'SA' },
  { id: 1106, name: 'Parma', shortName: 'PAR', league: 'Serie A', leagueCode: 'SA' },
  { id: 586, name: 'Como', shortName: 'COM', league: 'Serie A', leagueCode: 'SA' },

  // France - Ligue 1
  { id: 524, name: 'Paris Saint-Germain', shortName: 'PSG', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 516, name: 'Marseille', shortName: 'OM', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 523, name: 'Lyon', shortName: 'OL', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 548, name: 'Monaco', shortName: 'ASM', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 521, name: 'Lille', shortName: 'LIL', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 529, name: 'Rennes', shortName: 'REN', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 522, name: 'Nice', shortName: 'NIC', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 532, name: 'Lens', shortName: 'RCL', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 528, name: 'Montpellier', shortName: 'MTP', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 511, name: 'Toulouse', shortName: 'TFC', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 518, name: 'Nantes', shortName: 'NAN', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 512, name: 'Brest', shortName: 'BRE', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 533, name: 'Strasbourg', shortName: 'RCS', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 547, name: 'Reims', shortName: 'REI', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 514, name: 'Auxerre', shortName: 'AUX', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 525, name: 'Angers', shortName: 'ANG', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 546, name: 'Le Havre', shortName: 'HAC', league: 'Ligue 1', leagueCode: 'FL1' },
  { id: 527, name: 'Saint-Étienne', shortName: 'STE', league: 'Ligue 1', leagueCode: 'FL1' },
];

// Search function
export function searchAll(query: string): {
  teams: SearchableTeam[];
  leagues: SearchableLeague[];
} {
  const q = query.toLowerCase().trim();
  if (!q) return { teams: [], leagues: [] };

  const teams = TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.shortName.toLowerCase().includes(q) ||
      t.league.toLowerCase().includes(q)
  ).slice(0, 10);

  const leagues = LEAGUES.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.country.toLowerCase().includes(q)
  ).slice(0, 5);

  return { teams, leagues };
}
