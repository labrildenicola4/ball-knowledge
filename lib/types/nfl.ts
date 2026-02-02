// TypeScript types for NFL (ESPN API)

export interface NFLTeam {
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

export interface NFLGame {
  id: string;
  status: 'scheduled' | 'in_progress' | 'final';
  statusDetail: string;
  quarter: number;
  clock: string;
  possession?: string;
  homeTeam: NFLTeam;
  awayTeam: NFLTeam;
  venue?: string;
  broadcast?: string;
  date: string;
  startTime: string;
  week?: number;
  seasonType?: string;
}

export interface NFLPlayerStats {
  id: string;
  name: string;
  jersey: string;
  position: string;
  // Passing
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  completions?: number;
  attempts?: number;
  // Rushing
  rushingYards?: number;
  rushingTDs?: number;
  carries?: number;
  // Receiving
  receivingYards?: number;
  receivingTDs?: number;
  receptions?: number;
  targets?: number;
  // Defense
  tackles?: number;
  sacks?: number;
  // Kicking
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
}

export interface NFLTeamStats {
  firstDowns: number;
  totalYards: number;
  passingYards: number;
  rushingYards: number;
  turnovers: number;
  penalties: number;
  penaltyYards: number;
  thirdDownEff: string;
  fourthDownEff: string;
  timeOfPossession: string;
}

export interface NFLBoxScore {
  homeTeam: {
    team: NFLTeam;
    players: NFLPlayerStats[];
    stats: NFLTeamStats;
  };
  awayTeam: {
    team: NFLTeam;
    players: NFLPlayerStats[];
    stats: NFLTeamStats;
  };
}

export interface NFLStanding {
  team: NFLTeam;
  wins: number;
  losses: number;
  ties: number;
  pct: string;
  divisionWins: number;
  divisionLosses: number;
  conferenceWins: number;
  conferenceLosses: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
  seed?: number;
}

export interface NFLDivision {
  id: string;
  name: string;
  teams: NFLStanding[];
}

export interface NFLConference {
  id: string;
  name: string;
  divisions: NFLDivision[];
}

export interface NFLStandings {
  conferences: NFLConference[];
}

export interface NFLTeamInfo {
  team: NFLTeam;
  conference: string;
  division: string;
  record: string;
  standing?: NFLStanding;
  schedule: NFLTeamScheduleGame[];
  venue?: {
    name: string;
    city: string;
    capacity?: number;
  };
}

export interface NFLTeamScheduleGame {
  id: string;
  date: string;
  opponent: NFLTeam;
  isHome: boolean;
  result?: {
    win: boolean;
    score: string;
  };
  status: 'scheduled' | 'in_progress' | 'final';
  week?: number;
}

// Stat Leaders
export interface NFLStatLeader {
  player: {
    id: string;
    name: string;
    headshot: string;
    position: string;
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

export interface NFLLeaders {
  passingYards: NFLStatLeader[];
  rushingYards: NFLStatLeader[];
  receivingYards: NFLStatLeader[];
  passingTouchdowns: NFLStatLeader[];
  rushingTouchdowns: NFLStatLeader[];
  receivingTouchdowns: NFLStatLeader[];
  sacks: NFLStatLeader[];
  interceptions: NFLStatLeader[];
  tackles: NFLStatLeader[];
}

// Team Stats Rankings
export interface NFLTeamRanking {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
  };
  value: number;
  displayValue: string;
}
