// NFL Team and Division constants for ESPN API

export interface NFLDivisionConfig {
  id: string;
  name: string;
  shortName: string;
  conference: 'AFC' | 'NFC';
}

// AFC divisions
export const AFC_DIVISIONS: NFLDivisionConfig[] = [
  { id: 'afc-east', name: 'AFC East', shortName: 'East', conference: 'AFC' },
  { id: 'afc-north', name: 'AFC North', shortName: 'North', conference: 'AFC' },
  { id: 'afc-south', name: 'AFC South', shortName: 'South', conference: 'AFC' },
  { id: 'afc-west', name: 'AFC West', shortName: 'West', conference: 'AFC' },
];

// NFC divisions
export const NFC_DIVISIONS: NFLDivisionConfig[] = [
  { id: 'nfc-east', name: 'NFC East', shortName: 'East', conference: 'NFC' },
  { id: 'nfc-north', name: 'NFC North', shortName: 'North', conference: 'NFC' },
  { id: 'nfc-south', name: 'NFC South', shortName: 'South', conference: 'NFC' },
  { id: 'nfc-west', name: 'NFC West', shortName: 'West', conference: 'NFC' },
];

export const ALL_DIVISIONS: NFLDivisionConfig[] = [...AFC_DIVISIONS, ...NFC_DIVISIONS];

// ESPN team IDs for all 32 NFL teams
export const NFL_TEAMS: Record<string, { id: string; name: string; abbreviation: string; division: string }> = {
  // AFC East
  'bills': { id: '2', name: 'Buffalo Bills', abbreviation: 'BUF', division: 'afc-east' },
  'dolphins': { id: '15', name: 'Miami Dolphins', abbreviation: 'MIA', division: 'afc-east' },
  'patriots': { id: '17', name: 'New England Patriots', abbreviation: 'NE', division: 'afc-east' },
  'jets': { id: '20', name: 'New York Jets', abbreviation: 'NYJ', division: 'afc-east' },

  // AFC North
  'ravens': { id: '33', name: 'Baltimore Ravens', abbreviation: 'BAL', division: 'afc-north' },
  'bengals': { id: '4', name: 'Cincinnati Bengals', abbreviation: 'CIN', division: 'afc-north' },
  'browns': { id: '5', name: 'Cleveland Browns', abbreviation: 'CLE', division: 'afc-north' },
  'steelers': { id: '23', name: 'Pittsburgh Steelers', abbreviation: 'PIT', division: 'afc-north' },

  // AFC South
  'texans': { id: '34', name: 'Houston Texans', abbreviation: 'HOU', division: 'afc-south' },
  'colts': { id: '11', name: 'Indianapolis Colts', abbreviation: 'IND', division: 'afc-south' },
  'jaguars': { id: '30', name: 'Jacksonville Jaguars', abbreviation: 'JAX', division: 'afc-south' },
  'titans': { id: '10', name: 'Tennessee Titans', abbreviation: 'TEN', division: 'afc-south' },

  // AFC West
  'broncos': { id: '7', name: 'Denver Broncos', abbreviation: 'DEN', division: 'afc-west' },
  'chiefs': { id: '12', name: 'Kansas City Chiefs', abbreviation: 'KC', division: 'afc-west' },
  'raiders': { id: '13', name: 'Las Vegas Raiders', abbreviation: 'LV', division: 'afc-west' },
  'chargers': { id: '24', name: 'Los Angeles Chargers', abbreviation: 'LAC', division: 'afc-west' },

  // NFC East
  'cowboys': { id: '6', name: 'Dallas Cowboys', abbreviation: 'DAL', division: 'nfc-east' },
  'giants': { id: '19', name: 'New York Giants', abbreviation: 'NYG', division: 'nfc-east' },
  'eagles': { id: '21', name: 'Philadelphia Eagles', abbreviation: 'PHI', division: 'nfc-east' },
  'commanders': { id: '28', name: 'Washington Commanders', abbreviation: 'WSH', division: 'nfc-east' },

  // NFC North
  'bears': { id: '3', name: 'Chicago Bears', abbreviation: 'CHI', division: 'nfc-north' },
  'lions': { id: '8', name: 'Detroit Lions', abbreviation: 'DET', division: 'nfc-north' },
  'packers': { id: '9', name: 'Green Bay Packers', abbreviation: 'GB', division: 'nfc-north' },
  'vikings': { id: '16', name: 'Minnesota Vikings', abbreviation: 'MIN', division: 'nfc-north' },

  // NFC South
  'falcons': { id: '1', name: 'Atlanta Falcons', abbreviation: 'ATL', division: 'nfc-south' },
  'panthers': { id: '29', name: 'Carolina Panthers', abbreviation: 'CAR', division: 'nfc-south' },
  'saints': { id: '18', name: 'New Orleans Saints', abbreviation: 'NO', division: 'nfc-south' },
  'buccaneers': { id: '27', name: 'Tampa Bay Buccaneers', abbreviation: 'TB', division: 'nfc-south' },

  // NFC West
  'cardinals': { id: '22', name: 'Arizona Cardinals', abbreviation: 'ARI', division: 'nfc-west' },
  'rams': { id: '14', name: 'Los Angeles Rams', abbreviation: 'LAR', division: 'nfc-west' },
  '49ers': { id: '25', name: 'San Francisco 49ers', abbreviation: 'SF', division: 'nfc-west' },
  'seahawks': { id: '26', name: 'Seattle Seahawks', abbreviation: 'SEA', division: 'nfc-west' },
};

// Team ID to info lookup
export const NFL_TEAM_BY_ID: Record<string, { name: string; abbreviation: string; division: string }> =
  Object.fromEntries(
    Object.entries(NFL_TEAMS).map(([, team]) => [team.id, team])
  );

// All NFL team IDs
export const NFL_TEAM_IDS = Object.values(NFL_TEAMS).map(t => t.id);

// Status mappings for ESPN API
export const GAME_STATUS_MAP: Record<string, 'scheduled' | 'in_progress' | 'final'> = {
  'STATUS_SCHEDULED': 'scheduled',
  'STATUS_IN_PROGRESS': 'in_progress',
  'STATUS_HALFTIME': 'in_progress',
  'STATUS_END_PERIOD': 'in_progress',
  'STATUS_FINAL': 'final',
  'STATUS_FINAL_OT': 'final',
  'STATUS_POSTPONED': 'scheduled',
  'STATUS_CANCELED': 'final',
  'STATUS_DELAYED': 'scheduled',
  'STATUS_RAIN_DELAY': 'scheduled',
  'STATUS_SUSPENDED': 'scheduled',
};

// Quarter display helper
export const getQuarterDisplay = (quarter: number, clock: string): string => {
  if (quarter === 0) return '';
  if (quarter <= 4) return `Q${quarter} ${clock}`;
  return `OT${quarter - 4} ${clock}`;
};
