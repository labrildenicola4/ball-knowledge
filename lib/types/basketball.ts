// TypeScript types for NCAA Basketball (ESPN API)

export interface BasketballTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color?: string;
  alternateColor?: string;
  record?: string;
  rank?: number;
  score?: number;
  conferenceId?: string;
}

export interface BasketballGame {
  id: string;
  status: 'scheduled' | 'in_progress' | 'final';
  statusDetail: string;
  period: number;
  clock: string;
  homeTeam: BasketballTeam;
  awayTeam: BasketballTeam;
  venue?: string;
  broadcast?: string;
  date: string;
  rawDate?: string;
  startTime: string;
  conferenceGame: boolean;
  neutralSite: boolean;
  conference?: string;
}

export interface BasketballPlayerStats {
  id: string;
  name: string;
  jersey: string;
  position: string;
  starter: boolean;
  minutes: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPct: string;
  threePointMade: number;
  threePointAttempted: number;
  threePointPct: string;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPct: string;
  plusMinus?: string;
}

export interface BasketballTeamStats {
  fieldGoalPct: string;
  threePointPct: string;
  freeThrowPct: string;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  points: number;
  fastBreakPoints?: number;
  pointsInPaint?: number;
  pointsOffTurnovers?: number;
  secondChancePoints?: number;
  largestLead?: number;
}

export interface BasketballBoxScore {
  homeTeam: {
    team: BasketballTeam;
    players: BasketballPlayerStats[];
    stats: BasketballTeamStats;
  };
  awayTeam: {
    team: BasketballTeam;
    players: BasketballPlayerStats[];
    stats: BasketballTeamStats;
  };
}

export interface BasketballStanding {
  team: BasketballTeam;
  conferenceRecord: { wins: number; losses: number };
  overallRecord: { wins: number; losses: number };
  homeRecord?: { wins: number; losses: number };
  awayRecord?: { wins: number; losses: number };
  streak: string;
  pointsFor?: number;
  pointsAgainst?: number;
}

export interface BasketballConference {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
}

export interface BasketballTeamScheduleGame {
  id: string;
  date: string;
  opponent: BasketballTeam;
  isHome: boolean;
  result?: {
    win: boolean;
    score: string;
  };
  status: 'scheduled' | 'in_progress' | 'final';
}

export interface BasketballTeamInfo {
  team: BasketballTeam;
  conference: BasketballConference;
  record: string;
  conferenceRecord: string;
  divisionRecord?: string;
  rank?: number;
  standing?: BasketballStanding;
  schedule: BasketballTeamScheduleGame[];
  venue?: {
    name: string;
    city: string;
    capacity?: number;
  };
}

export interface BasketballRanking {
  rank: number;
  team: BasketballTeam;
  record: string;
  previousRank?: number;
  trend?: 'up' | 'down' | 'same';
}
