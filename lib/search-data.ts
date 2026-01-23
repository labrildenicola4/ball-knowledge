// Searchable data for teams and leagues

export interface SearchableTeam {
  id: number;
  name: string;
  shortName: string;
  league: string;
  leagueCode: string;
  logo: string;
}

// Football-Data.org crest URL pattern
const getCrest = (id: number) => `https://crests.football-data.org/${id}.png`;

export interface SearchableLeague {
  id: string;
  name: string;
  code: string;
  country: string;
  logo: string;
}

// Competition emblem URLs from Football-Data.org
const LEAGUE_LOGOS: Record<string, string> = {
  'PD': 'https://crests.football-data.org/laliga.png',
  'PL': 'https://crests.football-data.org/PL.png',
  'SA': 'https://crests.football-data.org/SA.png',
  'BL1': 'https://crests.football-data.org/BL1.png',
  'FL1': 'https://crests.football-data.org/FL1.png',
  'ELC': 'https://crests.football-data.org/ELC.png',
  'DED': 'https://crests.football-data.org/DED.png',
  'PPL': 'https://crests.football-data.org/PPL.png',
  'BSA': 'https://crests.football-data.org/BSA.png',
  'CL': 'https://crests.football-data.org/CL.png',
  'CLI': 'https://crests.football-data.org/CLI.png',
};

// Major leagues
export const LEAGUES: SearchableLeague[] = [
  { id: 'laliga', name: 'La Liga', code: 'PD', country: 'Spain', logo: LEAGUE_LOGOS['PD'] },
  { id: 'premier', name: 'Premier League', code: 'PL', country: 'England', logo: LEAGUE_LOGOS['PL'] },
  { id: 'seriea', name: 'Serie A', code: 'SA', country: 'Italy', logo: LEAGUE_LOGOS['SA'] },
  { id: 'bundesliga', name: 'Bundesliga', code: 'BL1', country: 'Germany', logo: LEAGUE_LOGOS['BL1'] },
  { id: 'ligue1', name: 'Ligue 1', code: 'FL1', country: 'France', logo: LEAGUE_LOGOS['FL1'] },
  { id: 'championship', name: 'Championship', code: 'ELC', country: 'England', logo: LEAGUE_LOGOS['ELC'] },
  { id: 'eredivisie', name: 'Eredivisie', code: 'DED', country: 'Netherlands', logo: LEAGUE_LOGOS['DED'] },
  { id: 'primeiraliga', name: 'Primeira Liga', code: 'PPL', country: 'Portugal', logo: LEAGUE_LOGOS['PPL'] },
  { id: 'brasileirao', name: 'Brasileirão', code: 'BSA', country: 'Brazil', logo: LEAGUE_LOGOS['BSA'] },
  { id: 'championsleague', name: 'Champions League', code: 'CL', country: 'Europe', logo: LEAGUE_LOGOS['CL'] },
  { id: 'copalibertadores', name: 'Copa Libertadores', code: 'CLI', country: 'South America', logo: LEAGUE_LOGOS['CLI'] },
];

// Export for use elsewhere
export { LEAGUE_LOGOS };

// Major teams from top leagues
export const TEAMS: SearchableTeam[] = [
  // Spain - La Liga
  { id: 86, name: 'Real Madrid', shortName: 'RMA', league: 'La Liga', leagueCode: 'PD', logo: getCrest(86) },
  { id: 81, name: 'FC Barcelona', shortName: 'BAR', league: 'La Liga', leagueCode: 'PD', logo: getCrest(81) },
  { id: 78, name: 'Atlético Madrid', shortName: 'ATM', league: 'La Liga', leagueCode: 'PD', logo: getCrest(78) },
  { id: 559, name: 'Sevilla FC', shortName: 'SEV', league: 'La Liga', leagueCode: 'PD', logo: getCrest(559) },
  { id: 92, name: 'Real Sociedad', shortName: 'RSO', league: 'La Liga', leagueCode: 'PD', logo: getCrest(92) },
  { id: 90, name: 'Real Betis', shortName: 'BET', league: 'La Liga', leagueCode: 'PD', logo: getCrest(90) },
  { id: 94, name: 'Villarreal CF', shortName: 'VIL', league: 'La Liga', leagueCode: 'PD', logo: getCrest(94) },
  { id: 77, name: 'Athletic Club', shortName: 'ATH', league: 'La Liga', leagueCode: 'PD', logo: getCrest(77) },
  { id: 95, name: 'Valencia CF', shortName: 'VAL', league: 'La Liga', leagueCode: 'PD', logo: getCrest(95) },
  { id: 89, name: 'RCD Mallorca', shortName: 'MLL', league: 'La Liga', leagueCode: 'PD', logo: getCrest(89) },
  { id: 82, name: 'Getafe CF', shortName: 'GET', league: 'La Liga', leagueCode: 'PD', logo: getCrest(82) },
  { id: 79, name: 'CA Osasuna', shortName: 'OSA', league: 'La Liga', leagueCode: 'PD', logo: getCrest(79) },
  { id: 263, name: 'Deportivo Alavés', shortName: 'ALA', league: 'La Liga', leagueCode: 'PD', logo: getCrest(263) },
  { id: 275, name: 'UD Las Palmas', shortName: 'LPA', league: 'La Liga', leagueCode: 'PD', logo: getCrest(275) },
  { id: 250, name: 'Real Valladolid', shortName: 'VLL', league: 'La Liga', leagueCode: 'PD', logo: getCrest(250) },
  { id: 264, name: 'Celta Vigo', shortName: 'CEL', league: 'La Liga', leagueCode: 'PD', logo: getCrest(264) },
  { id: 298, name: 'Girona FC', shortName: 'GIR', league: 'La Liga', leagueCode: 'PD', logo: getCrest(298) },
  { id: 285, name: 'Rayo Vallecano', shortName: 'RAY', league: 'La Liga', leagueCode: 'PD', logo: getCrest(285) },
  { id: 267, name: 'RCD Espanyol', shortName: 'ESP', league: 'La Liga', leagueCode: 'PD', logo: getCrest(267) },
  { id: 745, name: 'CD Leganés', shortName: 'LEG', league: 'La Liga', leagueCode: 'PD', logo: getCrest(745) },

  // England - Premier League
  { id: 65, name: 'Manchester City', shortName: 'MCI', league: 'Premier League', leagueCode: 'PL', logo: getCrest(65) },
  { id: 57, name: 'Arsenal', shortName: 'ARS', league: 'Premier League', leagueCode: 'PL', logo: getCrest(57) },
  { id: 64, name: 'Liverpool', shortName: 'LIV', league: 'Premier League', leagueCode: 'PL', logo: getCrest(64) },
  { id: 66, name: 'Manchester United', shortName: 'MUN', league: 'Premier League', leagueCode: 'PL', logo: getCrest(66) },
  { id: 61, name: 'Chelsea', shortName: 'CHE', league: 'Premier League', leagueCode: 'PL', logo: getCrest(61) },
  { id: 73, name: 'Tottenham Hotspur', shortName: 'TOT', league: 'Premier League', leagueCode: 'PL', logo: getCrest(73) },
  { id: 58, name: 'Aston Villa', shortName: 'AVL', league: 'Premier League', leagueCode: 'PL', logo: getCrest(58) },
  { id: 67, name: 'Newcastle United', shortName: 'NEW', league: 'Premier League', leagueCode: 'PL', logo: getCrest(67) },
  { id: 397, name: 'Brighton & Hove Albion', shortName: 'BHA', league: 'Premier League', leagueCode: 'PL', logo: getCrest(397) },
  { id: 76, name: 'Wolverhampton', shortName: 'WOL', league: 'Premier League', leagueCode: 'PL', logo: getCrest(76) },
  { id: 63, name: 'Fulham', shortName: 'FUL', league: 'Premier League', leagueCode: 'PL', logo: getCrest(63) },
  { id: 354, name: 'Crystal Palace', shortName: 'CRY', league: 'Premier League', leagueCode: 'PL', logo: getCrest(354) },
  { id: 402, name: 'Brentford', shortName: 'BRE', league: 'Premier League', leagueCode: 'PL', logo: getCrest(402) },
  { id: 62, name: 'Everton', shortName: 'EVE', league: 'Premier League', leagueCode: 'PL', logo: getCrest(62) },
  { id: 351, name: 'Nottingham Forest', shortName: 'NFO', league: 'Premier League', leagueCode: 'PL', logo: getCrest(351) },
  { id: 74, name: 'West Ham United', shortName: 'WHU', league: 'Premier League', leagueCode: 'PL', logo: getCrest(74) },
  { id: 1044, name: 'AFC Bournemouth', shortName: 'BOU', league: 'Premier League', leagueCode: 'PL', logo: getCrest(1044) },
  { id: 338, name: 'Leicester City', shortName: 'LEI', league: 'Premier League', leagueCode: 'PL', logo: getCrest(338) },
  { id: 346, name: 'Southampton', shortName: 'SOU', league: 'Premier League', leagueCode: 'PL', logo: getCrest(346) },
  { id: 349, name: 'Ipswich Town', shortName: 'IPS', league: 'Premier League', leagueCode: 'PL', logo: getCrest(349) },

  // Germany - Bundesliga
  { id: 5, name: 'Bayern München', shortName: 'FCB', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(5) },
  { id: 4, name: 'Borussia Dortmund', shortName: 'BVB', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(4) },
  { id: 721, name: 'RB Leipzig', shortName: 'RBL', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(721) },
  { id: 3, name: 'Bayer Leverkusen', shortName: 'B04', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(3) },
  { id: 19, name: 'Eintracht Frankfurt', shortName: 'SGE', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(19) },
  { id: 11, name: 'VfL Wolfsburg', shortName: 'WOB', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(11) },
  { id: 18, name: 'Borussia Mönchengladbach', shortName: 'BMG', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(18) },
  { id: 10, name: 'VfB Stuttgart', shortName: 'VFB', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(10) },
  { id: 17, name: 'SC Freiburg', shortName: 'SCF', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(17) },
  { id: 2, name: 'TSG Hoffenheim', shortName: 'TSG', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(2) },
  { id: 12, name: 'Werder Bremen', shortName: 'SVW', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(12) },
  { id: 1, name: 'FC Köln', shortName: 'KOE', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(1) },
  { id: 28, name: '1. FC Union Berlin', shortName: 'FCU', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(28) },
  { id: 16, name: 'FC Augsburg', shortName: 'FCA', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(16) },
  { id: 44, name: '1. FC Heidenheim', shortName: 'HDH', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(44) },
  { id: 15, name: 'Mainz 05', shortName: 'M05', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(15) },
  { id: 9, name: 'Hertha BSC', shortName: 'BSC', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(9) },
  { id: 36, name: 'VfL Bochum', shortName: 'BOC', league: 'Bundesliga', leagueCode: 'BL1', logo: getCrest(36) },

  // Italy - Serie A
  { id: 109, name: 'Juventus', shortName: 'JUV', league: 'Serie A', leagueCode: 'SA', logo: getCrest(109) },
  { id: 108, name: 'Inter Milan', shortName: 'INT', league: 'Serie A', leagueCode: 'SA', logo: getCrest(108) },
  { id: 98, name: 'AC Milan', shortName: 'MIL', league: 'Serie A', leagueCode: 'SA', logo: getCrest(98) },
  { id: 113, name: 'Napoli', shortName: 'NAP', league: 'Serie A', leagueCode: 'SA', logo: getCrest(113) },
  { id: 100, name: 'AS Roma', shortName: 'ROM', league: 'Serie A', leagueCode: 'SA', logo: getCrest(100) },
  { id: 110, name: 'Lazio', shortName: 'LAZ', league: 'Serie A', leagueCode: 'SA', logo: getCrest(110) },
  { id: 99, name: 'Fiorentina', shortName: 'FIO', league: 'Serie A', leagueCode: 'SA', logo: getCrest(99) },
  { id: 102, name: 'Atalanta', shortName: 'ATA', league: 'Serie A', leagueCode: 'SA', logo: getCrest(102) },
  { id: 1106, name: 'Bologna', shortName: 'BOL', league: 'Serie A', leagueCode: 'SA', logo: getCrest(1106) },
  { id: 103, name: 'Torino', shortName: 'TOR', league: 'Serie A', leagueCode: 'SA', logo: getCrest(103) },
  { id: 115, name: 'Udinese', shortName: 'UDI', league: 'Serie A', leagueCode: 'SA', logo: getCrest(115) },
  { id: 471, name: 'Sassuolo', shortName: 'SAS', league: 'Serie A', leagueCode: 'SA', logo: getCrest(471) },
  { id: 445, name: 'Empoli', shortName: 'EMP', league: 'Serie A', leagueCode: 'SA', logo: getCrest(445) },
  { id: 450, name: 'Hellas Verona', shortName: 'VER', league: 'Serie A', leagueCode: 'SA', logo: getCrest(450) },
  { id: 5890, name: 'Monza', shortName: 'MON', league: 'Serie A', leagueCode: 'SA', logo: getCrest(5890) },
  { id: 104, name: 'Genoa', shortName: 'GEN', league: 'Serie A', leagueCode: 'SA', logo: getCrest(104) },
  { id: 488, name: 'Cagliari', shortName: 'CAG', league: 'Serie A', leagueCode: 'SA', logo: getCrest(488) },
  { id: 1579, name: 'Lecce', shortName: 'LEC', league: 'Serie A', leagueCode: 'SA', logo: getCrest(1579) },
  { id: 6704, name: 'Venezia', shortName: 'VEN', league: 'Serie A', leagueCode: 'SA', logo: getCrest(6704) },
  { id: 112, name: 'Parma', shortName: 'PAR', league: 'Serie A', leagueCode: 'SA', logo: getCrest(112) },
  { id: 586, name: 'Como', shortName: 'COM', league: 'Serie A', leagueCode: 'SA', logo: getCrest(586) },

  // France - Ligue 1
  { id: 524, name: 'Paris Saint-Germain', shortName: 'PSG', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(524) },
  { id: 516, name: 'Marseille', shortName: 'OM', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(516) },
  { id: 523, name: 'Lyon', shortName: 'OL', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(523) },
  { id: 548, name: 'Monaco', shortName: 'ASM', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(548) },
  { id: 521, name: 'Lille', shortName: 'LIL', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(521) },
  { id: 529, name: 'Rennes', shortName: 'REN', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(529) },
  { id: 522, name: 'Nice', shortName: 'NIC', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(522) },
  { id: 532, name: 'Lens', shortName: 'RCL', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(532) },
  { id: 528, name: 'Montpellier', shortName: 'MTP', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(528) },
  { id: 511, name: 'Toulouse', shortName: 'TFC', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(511) },
  { id: 518, name: 'Nantes', shortName: 'NAN', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(518) },
  { id: 512, name: 'Brest', shortName: 'BRE', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(512) },
  { id: 533, name: 'Strasbourg', shortName: 'RCS', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(533) },
  { id: 547, name: 'Reims', shortName: 'REI', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(547) },
  { id: 514, name: 'Auxerre', shortName: 'AUX', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(514) },
  { id: 525, name: 'Angers', shortName: 'ANG', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(525) },
  { id: 546, name: 'Le Havre', shortName: 'HAC', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(546) },
  { id: 527, name: 'Saint-Étienne', shortName: 'STE', league: 'Ligue 1', leagueCode: 'FL1', logo: getCrest(527) },
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
