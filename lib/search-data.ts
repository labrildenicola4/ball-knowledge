// Searchable data for teams and leagues

export interface SearchableTeam {
  id: number;
  name: string;
  shortName: string;
  league: string;
  leagueCode: string;
  logo: string;
}

// API-Football logo URL pattern
const getLogo = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`;

export interface SearchableLeague {
  id: string;
  name: string;
  code: string;
  country: string;
  logo: string;
}

// Competition emblem URLs from API-Football
const LEAGUE_LOGOS: Record<string, string> = {
  'PD': 'https://media.api-sports.io/football/leagues/140.png',
  'PL': 'https://media.api-sports.io/football/leagues/39.png',
  'SA': 'https://media.api-sports.io/football/leagues/135.png',
  'BL1': 'https://media.api-sports.io/football/leagues/78.png',
  'FL1': 'https://media.api-sports.io/football/leagues/61.png',
  'ELC': 'https://media.api-sports.io/football/leagues/40.png',
  'DED': 'https://media.api-sports.io/football/leagues/88.png',
  'PPL': 'https://media.api-sports.io/football/leagues/94.png',
  'BSA': 'https://media.api-sports.io/football/leagues/71.png',
  'CL': 'https://media.api-sports.io/football/leagues/2.png',
  'CLI': 'https://media.api-sports.io/football/leagues/13.png',
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

// Major teams from top leagues (API-Football IDs)
export const TEAMS: SearchableTeam[] = [
  // Spain - La Liga
  { id: 541, name: 'Real Madrid', shortName: 'RMA', league: 'La Liga', leagueCode: 'PD', logo: getLogo(541) },
  { id: 529, name: 'FC Barcelona', shortName: 'BAR', league: 'La Liga', leagueCode: 'PD', logo: getLogo(529) },
  { id: 530, name: 'Atlético Madrid', shortName: 'ATM', league: 'La Liga', leagueCode: 'PD', logo: getLogo(530) },
  { id: 536, name: 'Sevilla FC', shortName: 'SEV', league: 'La Liga', leagueCode: 'PD', logo: getLogo(536) },
  { id: 548, name: 'Real Sociedad', shortName: 'RSO', league: 'La Liga', leagueCode: 'PD', logo: getLogo(548) },
  { id: 543, name: 'Real Betis', shortName: 'BET', league: 'La Liga', leagueCode: 'PD', logo: getLogo(543) },
  { id: 533, name: 'Villarreal CF', shortName: 'VIL', league: 'La Liga', leagueCode: 'PD', logo: getLogo(533) },
  { id: 531, name: 'Athletic Club', shortName: 'ATH', league: 'La Liga', leagueCode: 'PD', logo: getLogo(531) },
  { id: 532, name: 'Valencia CF', shortName: 'VAL', league: 'La Liga', leagueCode: 'PD', logo: getLogo(532) },
  { id: 798, name: 'RCD Mallorca', shortName: 'MLL', league: 'La Liga', leagueCode: 'PD', logo: getLogo(798) },
  { id: 546, name: 'Getafe CF', shortName: 'GET', league: 'La Liga', leagueCode: 'PD', logo: getLogo(546) },
  { id: 727, name: 'CA Osasuna', shortName: 'OSA', league: 'La Liga', leagueCode: 'PD', logo: getLogo(727) },
  { id: 542, name: 'Deportivo Alavés', shortName: 'ALA', league: 'La Liga', leagueCode: 'PD', logo: getLogo(542) },
  { id: 534, name: 'UD Las Palmas', shortName: 'LPA', league: 'La Liga', leagueCode: 'PD', logo: getLogo(534) },
  { id: 720, name: 'Real Valladolid', shortName: 'VLL', league: 'La Liga', leagueCode: 'PD', logo: getLogo(720) },
  { id: 538, name: 'Celta Vigo', shortName: 'CEL', league: 'La Liga', leagueCode: 'PD', logo: getLogo(538) },
  { id: 547, name: 'Girona FC', shortName: 'GIR', league: 'La Liga', leagueCode: 'PD', logo: getLogo(547) },
  { id: 728, name: 'Rayo Vallecano', shortName: 'RAY', league: 'La Liga', leagueCode: 'PD', logo: getLogo(728) },
  { id: 540, name: 'RCD Espanyol', shortName: 'ESP', league: 'La Liga', leagueCode: 'PD', logo: getLogo(540) },
  { id: 539, name: 'CD Leganés', shortName: 'LEG', league: 'La Liga', leagueCode: 'PD', logo: getLogo(539) },

  // England - Premier League
  { id: 50, name: 'Manchester City', shortName: 'MCI', league: 'Premier League', leagueCode: 'PL', logo: getLogo(50) },
  { id: 42, name: 'Arsenal', shortName: 'ARS', league: 'Premier League', leagueCode: 'PL', logo: getLogo(42) },
  { id: 40, name: 'Liverpool', shortName: 'LIV', league: 'Premier League', leagueCode: 'PL', logo: getLogo(40) },
  { id: 33, name: 'Manchester United', shortName: 'MUN', league: 'Premier League', leagueCode: 'PL', logo: getLogo(33) },
  { id: 49, name: 'Chelsea', shortName: 'CHE', league: 'Premier League', leagueCode: 'PL', logo: getLogo(49) },
  { id: 47, name: 'Tottenham Hotspur', shortName: 'TOT', league: 'Premier League', leagueCode: 'PL', logo: getLogo(47) },
  { id: 66, name: 'Aston Villa', shortName: 'AVL', league: 'Premier League', leagueCode: 'PL', logo: getLogo(66) },
  { id: 34, name: 'Newcastle United', shortName: 'NEW', league: 'Premier League', leagueCode: 'PL', logo: getLogo(34) },
  { id: 51, name: 'Brighton & Hove Albion', shortName: 'BHA', league: 'Premier League', leagueCode: 'PL', logo: getLogo(51) },
  { id: 39, name: 'Wolverhampton', shortName: 'WOL', league: 'Premier League', leagueCode: 'PL', logo: getLogo(39) },
  { id: 36, name: 'Fulham', shortName: 'FUL', league: 'Premier League', leagueCode: 'PL', logo: getLogo(36) },
  { id: 52, name: 'Crystal Palace', shortName: 'CRY', league: 'Premier League', leagueCode: 'PL', logo: getLogo(52) },
  { id: 55, name: 'Brentford', shortName: 'BRE', league: 'Premier League', leagueCode: 'PL', logo: getLogo(55) },
  { id: 45, name: 'Everton', shortName: 'EVE', league: 'Premier League', leagueCode: 'PL', logo: getLogo(45) },
  { id: 65, name: 'Nottingham Forest', shortName: 'NFO', league: 'Premier League', leagueCode: 'PL', logo: getLogo(65) },
  { id: 48, name: 'West Ham United', shortName: 'WHU', league: 'Premier League', leagueCode: 'PL', logo: getLogo(48) },
  { id: 35, name: 'AFC Bournemouth', shortName: 'BOU', league: 'Premier League', leagueCode: 'PL', logo: getLogo(35) },
  { id: 46, name: 'Leicester City', shortName: 'LEI', league: 'Premier League', leagueCode: 'PL', logo: getLogo(46) },
  { id: 41, name: 'Southampton', shortName: 'SOU', league: 'Premier League', leagueCode: 'PL', logo: getLogo(41) },
  { id: 57, name: 'Ipswich Town', shortName: 'IPS', league: 'Premier League', leagueCode: 'PL', logo: getLogo(57) },

  // Germany - Bundesliga
  { id: 157, name: 'Bayern München', shortName: 'FCB', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(157) },
  { id: 165, name: 'Borussia Dortmund', shortName: 'BVB', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(165) },
  { id: 173, name: 'RB Leipzig', shortName: 'RBL', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(173) },
  { id: 168, name: 'Bayer Leverkusen', shortName: 'B04', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(168) },
  { id: 169, name: 'Eintracht Frankfurt', shortName: 'SGE', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(169) },
  { id: 161, name: 'VfL Wolfsburg', shortName: 'WOB', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(161) },
  { id: 163, name: 'Borussia Mönchengladbach', shortName: 'BMG', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(163) },
  { id: 172, name: 'VfB Stuttgart', shortName: 'VFB', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(172) },
  { id: 160, name: 'SC Freiburg', shortName: 'SCF', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(160) },
  { id: 167, name: 'TSG Hoffenheim', shortName: 'TSG', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(167) },
  { id: 162, name: 'Werder Bremen', shortName: 'SVW', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(162) },
  { id: 192, name: 'FC Köln', shortName: 'KOE', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(192) },
  { id: 182, name: '1. FC Union Berlin', shortName: 'FCU', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(182) },
  { id: 170, name: 'FC Augsburg', shortName: 'FCA', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(170) },
  { id: 180, name: '1. FC Heidenheim', shortName: 'HDH', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(180) },
  { id: 164, name: 'Mainz 05', shortName: 'M05', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(164) },
  { id: 159, name: 'Hertha BSC', shortName: 'BSC', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(159) },
  { id: 176, name: 'VfL Bochum', shortName: 'BOC', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(176) },

  // Italy - Serie A
  { id: 496, name: 'Juventus', shortName: 'JUV', league: 'Serie A', leagueCode: 'SA', logo: getLogo(496) },
  { id: 505, name: 'Inter Milan', shortName: 'INT', league: 'Serie A', leagueCode: 'SA', logo: getLogo(505) },
  { id: 489, name: 'AC Milan', shortName: 'MIL', league: 'Serie A', leagueCode: 'SA', logo: getLogo(489) },
  { id: 492, name: 'Napoli', shortName: 'NAP', league: 'Serie A', leagueCode: 'SA', logo: getLogo(492) },
  { id: 497, name: 'AS Roma', shortName: 'ROM', league: 'Serie A', leagueCode: 'SA', logo: getLogo(497) },
  { id: 487, name: 'Lazio', shortName: 'LAZ', league: 'Serie A', leagueCode: 'SA', logo: getLogo(487) },
  { id: 502, name: 'Fiorentina', shortName: 'FIO', league: 'Serie A', leagueCode: 'SA', logo: getLogo(502) },
  { id: 499, name: 'Atalanta', shortName: 'ATA', league: 'Serie A', leagueCode: 'SA', logo: getLogo(499) },
  { id: 500, name: 'Bologna', shortName: 'BOL', league: 'Serie A', leagueCode: 'SA', logo: getLogo(500) },
  { id: 503, name: 'Torino', shortName: 'TOR', league: 'Serie A', leagueCode: 'SA', logo: getLogo(503) },
  { id: 494, name: 'Udinese', shortName: 'UDI', league: 'Serie A', leagueCode: 'SA', logo: getLogo(494) },
  { id: 488, name: 'Sassuolo', shortName: 'SAS', league: 'Serie A', leagueCode: 'SA', logo: getLogo(488) },
  { id: 511, name: 'Empoli', shortName: 'EMP', league: 'Serie A', leagueCode: 'SA', logo: getLogo(511) },
  { id: 504, name: 'Hellas Verona', shortName: 'VER', league: 'Serie A', leagueCode: 'SA', logo: getLogo(504) },
  { id: 1579, name: 'Monza', shortName: 'MON', league: 'Serie A', leagueCode: 'SA', logo: getLogo(1579) },
  { id: 495, name: 'Genoa', shortName: 'GEN', league: 'Serie A', leagueCode: 'SA', logo: getLogo(495) },
  { id: 490, name: 'Cagliari', shortName: 'CAG', league: 'Serie A', leagueCode: 'SA', logo: getLogo(490) },
  { id: 867, name: 'Lecce', shortName: 'LEC', league: 'Serie A', leagueCode: 'SA', logo: getLogo(867) },
  { id: 517, name: 'Venezia', shortName: 'VEN', league: 'Serie A', leagueCode: 'SA', logo: getLogo(517) },
  { id: 523, name: 'Parma', shortName: 'PAR', league: 'Serie A', leagueCode: 'SA', logo: getLogo(523) },
  { id: 895, name: 'Como', shortName: 'COM', league: 'Serie A', leagueCode: 'SA', logo: getLogo(895) },

  // France - Ligue 1
  { id: 85, name: 'Paris Saint-Germain', shortName: 'PSG', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(85) },
  { id: 81, name: 'Marseille', shortName: 'OM', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(81) },
  { id: 80, name: 'Lyon', shortName: 'OL', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(80) },
  { id: 91, name: 'Monaco', shortName: 'ASM', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(91) },
  { id: 79, name: 'Lille', shortName: 'LIL', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(79) },
  { id: 94, name: 'Rennes', shortName: 'REN', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(94) },
  { id: 84, name: 'Nice', shortName: 'NIC', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(84) },
  { id: 116, name: 'Lens', shortName: 'RCL', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(116) },
  { id: 82, name: 'Montpellier', shortName: 'MTP', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(82) },
  { id: 96, name: 'Toulouse', shortName: 'TFC', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(96) },
  { id: 83, name: 'Nantes', shortName: 'NAN', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(83) },
  { id: 106, name: 'Brest', shortName: 'BRE', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(106) },
  { id: 95, name: 'Strasbourg', shortName: 'RCS', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(95) },
  { id: 93, name: 'Reims', shortName: 'REI', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(93) },
  { id: 108, name: 'Auxerre', shortName: 'AUX', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(108) },
  { id: 77, name: 'Angers', shortName: 'ANG', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(77) },
  { id: 111, name: 'Le Havre', shortName: 'HAC', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(111) },
  { id: 1063, name: 'Saint-Étienne', shortName: 'STE', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(1063) },
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
