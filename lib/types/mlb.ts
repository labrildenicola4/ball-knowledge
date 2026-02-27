// TypeScript types for MLB Baseball (ESPN API)

export interface MLBTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color?: string;
  alternateColor?: string;
  record?: string;
  score?: number;
  hits?: number;
  errors?: number;
}

export interface MLBGame {
  id: string;
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'delayed';
  statusDetail: string;
  inning: number;
  inningHalf: 'top' | 'bottom' | '';
  outs: number;
  homeTeam: MLBTeam;
  awayTeam: MLBTeam;
  venue?: string;
  broadcast?: string;
  date: string;
  rawDate?: string;
  startTime: string;
  weather?: string;
  seriesInfo?: string;
  // Line score by inning
  lineScore?: {
    home: (number | null)[];
    away: (number | null)[];
  };
  // Current game situation
  situation?: {
    balls: number;
    strikes: number;
    onFirst: boolean;
    onSecond: boolean;
    onThird: boolean;
    batter?: string;
    pitcher?: string;
  };
}

export interface MLBPlayerBattingStats {
  id: string;
  name: string;
  jersey: string;
  position: string;
  battingOrder: number;
  atBats: number;
  runs: number;
  hits: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  homeRuns: number;
  avg: string;
  obp?: string;
  slg?: string;
  ops?: string;
}

export interface MLBPlayerPitchingStats {
  id: string;
  name: string;
  jersey: string;
  isWinner?: boolean;
  isLoser?: boolean;
  isSave?: boolean;
  inningsPitched: string;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  homeRuns: number;
  pitchCount?: number;
  era: string;
}

export interface MLBTeamStats {
  runs: number;
  hits: number;
  errors: number;
  leftOnBase: number;
  battingAvg?: string;
  homeRuns?: number;
  rbi?: number;
}

export interface MLBBoxScore {
  homeTeam: {
    team: MLBTeam;
    batting: MLBPlayerBattingStats[];
    pitching: MLBPlayerPitchingStats[];
    stats: MLBTeamStats;
  };
  awayTeam: {
    team: MLBTeam;
    batting: MLBPlayerBattingStats[];
    pitching: MLBPlayerPitchingStats[];
    stats: MLBTeamStats;
  };
  lineScore: {
    home: (number | null)[];
    away: (number | null)[];
  };
}

export interface MLBStanding {
  team: MLBTeam;
  wins: number;
  losses: number;
  pct: string;
  gamesBack: string;
  homeRecord: string;
  awayRecord: string;
  last10: string;
  streak: string;
  runDiff: number;
  divisionRecord?: string;
}

export interface MLBDivision {
  id: string;
  name: string;
  shortName: string;
}

export interface MLBTeamScheduleGame {
  id: string;
  date: string;
  opponent: MLBTeam;
  isHome: boolean;
  result?: {
    win: boolean;
    score: string;
  };
  status: 'scheduled' | 'in_progress' | 'final';
}

export interface MLBPlayerSeasonBattingStats {
  games: number;
  atBats: number;
  runs: number;
  hits: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  battingAverage: string;
  onBasePct: string;
  sluggingPct: string;
  ops: string;
  strikeouts: number;
  walks: number;
}

export interface MLBPlayerSeasonPitchingStats {
  wins: number;
  losses: number;
  era: string;
  inningsPitched: string;
  strikeouts: number;
  walks: number;
  whip: string;
  saves: number;
  gamesStarted: number;
  qualityStarts: number;
}

export interface MLBPlayerSeasonStats {
  batting?: MLBPlayerSeasonBattingStats;
  pitching?: MLBPlayerSeasonPitchingStats;
}

export interface MLBPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  headshot?: string;
  height?: string;
  weight?: string;
  age?: number;
  birthDate?: string;
  batHand?: string;
  throwHand?: string;
  stats?: MLBPlayerSeasonStats | null;
}

export interface MLBLeader {
  player: {
    id: string;
    name: string;
    headshot: string;
  };
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
  };
  value: number;
  displayValue: string;
}

export interface MLBLeadersResponse {
  battingAverage: MLBLeader[];
  homeRuns: MLBLeader[];
  rbi: MLBLeader[];
  stolenBases: MLBLeader[];
  era: MLBLeader[];
  strikeouts: MLBLeader[];
  wins: MLBLeader[];
  saves: MLBLeader[];
}

export interface MLBTeamSeasonStats {
  batting: {
    avg: { value: number; displayValue: string };
    homeRuns: { value: number; displayValue: string };
    rbi: { value: number; displayValue: string };
    runs: { value: number; displayValue: string };
    stolenBases: { value: number; displayValue: string };
    obp: { value: number; displayValue: string };
    slg: { value: number; displayValue: string };
    ops: { value: number; displayValue: string };
  };
  pitching: {
    era: { value: number; displayValue: string };
    wins: { value: number; displayValue: string };
    losses: { value: number; displayValue: string };
    saves: { value: number; displayValue: string };
    strikeouts: { value: number; displayValue: string };
    whip: { value: number; displayValue: string };
  };
}

export interface MLBGameResult {
  id: string;
  win: boolean;
  score: string;
  opponent: string;
  isHome: boolean;
}

export interface MLBTeamInfo {
  team: MLBTeam;
  division: MLBDivision;
  record: string;
  divisionRecord?: string;
  standing?: MLBStanding;
  schedule: MLBTeamScheduleGame[];
  venue?: {
    name: string;
    city: string;
    capacity?: number;
  };
  roster?: MLBPlayer[];
  stats?: MLBTeamSeasonStats | null;
  recentForm?: MLBGameResult[];
}
