// MLB Team and Division constants for ESPN API

export interface MLBDivisionConfig {
  id: string;
  name: string;
  shortName: string;
  league: 'AL' | 'NL';
}

// American League divisions
export const AL_DIVISIONS: MLBDivisionConfig[] = [
  { id: 'al-east', name: 'American League East', shortName: 'AL East', league: 'AL' },
  { id: 'al-central', name: 'American League Central', shortName: 'AL Central', league: 'AL' },
  { id: 'al-west', name: 'American League West', shortName: 'AL West', league: 'AL' },
];

// National League divisions
export const NL_DIVISIONS: MLBDivisionConfig[] = [
  { id: 'nl-east', name: 'National League East', shortName: 'NL East', league: 'NL' },
  { id: 'nl-central', name: 'National League Central', shortName: 'NL Central', league: 'NL' },
  { id: 'nl-west', name: 'National League West', shortName: 'NL West', league: 'NL' },
];

export const ALL_DIVISIONS: MLBDivisionConfig[] = [...AL_DIVISIONS, ...NL_DIVISIONS];

// ESPN team IDs for popular teams
export const MLB_TEAMS: Record<string, { id: string; name: string; abbreviation: string; division: string }> = {
  // AL East
  'yankees': { id: '10', name: 'New York Yankees', abbreviation: 'NYY', division: 'al-east' },
  'red-sox': { id: '2', name: 'Boston Red Sox', abbreviation: 'BOS', division: 'al-east' },
  'rays': { id: '30', name: 'Tampa Bay Rays', abbreviation: 'TB', division: 'al-east' },
  'blue-jays': { id: '14', name: 'Toronto Blue Jays', abbreviation: 'TOR', division: 'al-east' },
  'orioles': { id: '1', name: 'Baltimore Orioles', abbreviation: 'BAL', division: 'al-east' },

  // AL Central
  'guardians': { id: '5', name: 'Cleveland Guardians', abbreviation: 'CLE', division: 'al-central' },
  'twins': { id: '9', name: 'Minnesota Twins', abbreviation: 'MIN', division: 'al-central' },
  'tigers': { id: '6', name: 'Detroit Tigers', abbreviation: 'DET', division: 'al-central' },
  'white-sox': { id: '4', name: 'Chicago White Sox', abbreviation: 'CWS', division: 'al-central' },
  'royals': { id: '7', name: 'Kansas City Royals', abbreviation: 'KC', division: 'al-central' },

  // AL West
  'astros': { id: '18', name: 'Houston Astros', abbreviation: 'HOU', division: 'al-west' },
  'rangers': { id: '13', name: 'Texas Rangers', abbreviation: 'TEX', division: 'al-west' },
  'mariners': { id: '12', name: 'Seattle Mariners', abbreviation: 'SEA', division: 'al-west' },
  'angels': { id: '3', name: 'Los Angeles Angels', abbreviation: 'LAA', division: 'al-west' },
  'athletics': { id: '11', name: 'Oakland Athletics', abbreviation: 'OAK', division: 'al-west' },

  // NL East
  'braves': { id: '15', name: 'Atlanta Braves', abbreviation: 'ATL', division: 'nl-east' },
  'phillies': { id: '22', name: 'Philadelphia Phillies', abbreviation: 'PHI', division: 'nl-east' },
  'mets': { id: '21', name: 'New York Mets', abbreviation: 'NYM', division: 'nl-east' },
  'marlins': { id: '28', name: 'Miami Marlins', abbreviation: 'MIA', division: 'nl-east' },
  'nationals': { id: '20', name: 'Washington Nationals', abbreviation: 'WSH', division: 'nl-east' },

  // NL Central
  'brewers': { id: '8', name: 'Milwaukee Brewers', abbreviation: 'MIL', division: 'nl-central' },
  'cubs': { id: '16', name: 'Chicago Cubs', abbreviation: 'CHC', division: 'nl-central' },
  'cardinals': { id: '24', name: 'St. Louis Cardinals', abbreviation: 'STL', division: 'nl-central' },
  'reds': { id: '17', name: 'Cincinnati Reds', abbreviation: 'CIN', division: 'nl-central' },
  'pirates': { id: '23', name: 'Pittsburgh Pirates', abbreviation: 'PIT', division: 'nl-central' },

  // NL West
  'dodgers': { id: '19', name: 'Los Angeles Dodgers', abbreviation: 'LAD', division: 'nl-west' },
  'padres': { id: '25', name: 'San Diego Padres', abbreviation: 'SD', division: 'nl-west' },
  'giants': { id: '26', name: 'San Francisco Giants', abbreviation: 'SF', division: 'nl-west' },
  'diamondbacks': { id: '29', name: 'Arizona Diamondbacks', abbreviation: 'ARI', division: 'nl-west' },
  'rockies': { id: '27', name: 'Colorado Rockies', abbreviation: 'COL', division: 'nl-west' },
};

// Team ID to info lookup
export const MLB_TEAM_BY_ID: Record<string, { name: string; abbreviation: string; division: string }> =
  Object.fromEntries(
    Object.entries(MLB_TEAMS).map(([, team]) => [team.id, team])
  );

// Status mappings for ESPN API
export const GAME_STATUS_MAP: Record<string, 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'delayed'> = {
  'STATUS_SCHEDULED': 'scheduled',
  'STATUS_IN_PROGRESS': 'in_progress',
  'STATUS_FINAL': 'final',
  'STATUS_POSTPONED': 'postponed',
  'STATUS_DELAYED': 'delayed',
  'STATUS_RAIN_DELAY': 'delayed',
  'STATUS_SUSPENDED': 'delayed',
  'STATUS_CANCELED': 'final',
  'STATUS_END_PERIOD': 'in_progress',
};

// Inning half mapping
export const INNING_HALF_MAP: Record<string, 'top' | 'bottom'> = {
  'Top': 'top',
  'Bot': 'bottom',
  'Bottom': 'bottom',
  'Mid': 'bottom',
  'End': 'bottom',
};
