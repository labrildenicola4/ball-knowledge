// TypeScript types for NCAA College Football (ESPN API)

export interface CollegeFootballTeam {
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
}

export interface CollegeFootballGame {
  id: string;
  status: 'scheduled' | 'in_progress' | 'final';
  statusDetail: string;
  period: number;
  clock: string;
  homeTeam: CollegeFootballTeam;
  awayTeam: CollegeFootballTeam;
  venue?: string;
  broadcast?: string;
  date: string;
  startTime: string;
  conferenceGame: boolean;
  neutralSite: boolean;
  conference?: string;
}

export interface CollegeFootballConference {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
}

export interface CollegeFootballTeamScheduleGame {
  id: string;
  date: string;
  opponent: CollegeFootballTeam;
  isHome: boolean;
  result?: {
    win: boolean;
    score: string;
  };
  status: 'scheduled' | 'in_progress' | 'final';
}

export interface CollegeFootballTeamInfo {
  team: CollegeFootballTeam;
  conference: CollegeFootballConference;
  record: string;
  conferenceRecord: string;
  rank?: number;
  schedule: CollegeFootballTeamScheduleGame[];
  venue?: {
    name: string;
    city: string;
    capacity?: number;
  };
}

export interface CollegeFootballStanding {
  team: CollegeFootballTeam;
  conferenceRecord: { wins: number; losses: number };
  overallRecord: { wins: number; losses: number };
  streak: string;
}

export interface CollegeFootballRanking {
  rank: number;
  team: CollegeFootballTeam;
  record: string;
  previousRank?: number;
  trend?: 'up' | 'down' | 'same';
}
