// TypeScript types for NHL (ESPN API)

export interface NHLTeam {
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
}

export interface NHLGame {
  id: string;
  status: 'scheduled' | 'in_progress' | 'final';
  statusDetail: string;
  period: number;
  clock: string;
  homeTeam: NHLTeam;
  awayTeam: NHLTeam;
  venue?: string;
  broadcast?: string;
  date: string;
  startTime: string;
}

export interface NHLPlayerStats {
  id: string;
  name: string;
  jersey: string;
  position: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  penaltyMinutes: number;
  shots: number;
  hits?: number;
  blockedShots?: number;
  // Goalie stats
  saves?: number;
  goalsAgainst?: number;
  savePercentage?: string;
}

export interface NHLTeamStats {
  goals: number;
  shots: number;
  powerPlayGoals: number;
  powerPlayOpportunities: number;
  penaltyMinutes: number;
  hits: number;
  blockedShots: number;
  faceoffWins: number;
  faceoffLosses: number;
  giveaways: number;
  takeaways: number;
}

export interface NHLBoxScore {
  homeTeam: {
    team: NHLTeam;
    players: NHLPlayerStats[];
    stats: NHLTeamStats;
  };
  awayTeam: {
    team: NHLTeam;
    players: NHLPlayerStats[];
    stats: NHLTeamStats;
  };
}

export interface NHLStanding {
  team: NHLTeam;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  streak: string;
  seed?: number;
}

export interface NHLDivision {
  id: string;
  name: string;
  teams: NHLStanding[];
}

export interface NHLConference {
  id: string;
  name: string;
  divisions: NHLDivision[];
}

export interface NHLStandings {
  conferences: NHLConference[];
}

export interface NHLSkaterSeasonStats {
  type: 'skater';
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  penaltyMinutes: number;
  powerPlayGoals: number;
  shortHandedGoals: number;
  gameWinningGoals: number;
  shots: number;
  shotPct: number;
  timeOnIce: string;
  hits: number;
  blockedShots: number;
}

export interface NHLGoalieSeasonStats {
  type: 'goalie';
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  goalsAgainst: number;
  goalsAgainstAverage: number;
  saves: number;
  savePercentage: number;
  shutouts: number;
}

export type NHLPlayerSeasonStats = NHLSkaterSeasonStats | NHLGoalieSeasonStats;

export interface NHLPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  headshot: string;
  height: string;
  weight: string;
  age?: number;
  birthDate?: string;
  birthPlace?: string;
  shoots?: string;
  experience: number;
  stats: NHLPlayerSeasonStats | null;
}

export interface NHLTeamInfo {
  team: NHLTeam;
  conference: string;
  division: string;
  record: string;
  standing?: NHLStanding;
  roster?: NHLPlayer[];
  schedule: NHLTeamScheduleGame[];
  venue?: {
    name: string;
    city: string;
    capacity?: number;
  };
}

export interface NHLTeamScheduleGame {
  id: string;
  date: string;
  opponent: NHLTeam;
  isHome: boolean;
  result?: {
    win: boolean;
    score: string;
  };
  status: 'scheduled' | 'in_progress' | 'final';
}
