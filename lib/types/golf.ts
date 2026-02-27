// TypeScript types for Golf (ESPN API) - Multi-Tour Support

export interface GolfPlayer {
  id: string;
  name: string;
  shortName: string;
  country?: string;
  countryFlag?: string;
  position: string; // "1", "T2", "CUT", etc.
  score: string; // "-12", "E", "+3"
  today?: string; // today's round score vs par "-3", "E"
  thru?: string; // "F", "12", etc.
  rounds: (number | null)[]; // scores per round [68, 70, null, null]
  status?: string; // 'active', 'cut', 'withdrawn'
}

export interface GolfTournament {
  id: string;
  name: string;
  shortName: string;
  venue?: string;
  city?: string;
  course?: string;
  date: string;
  startTime: string;
  status: 'scheduled' | 'in_progress' | 'final';
  currentRound?: number;
  purse?: string;
  defendingChampion?: string;
  leaderboard: GolfPlayer[];
  tour?: GolfTourSlug; // which tour this tournament belongs to
  isMajor?: boolean; // flag for major championships
}

export type GolfTourSlug = 'pga' | 'eur' | 'lpga' | 'liv';

export interface GolfTourConfig {
  slug: GolfTourSlug;
  espnSlug: string; // ESPN API path segment
  name: string;
  shortName: string;
  color: string; // brand color for badges
  logo?: string;
}

// ---------------------------------------------------------------------------
// Stats / Leaders / Rankings
// ---------------------------------------------------------------------------

export interface GolfStatLeader {
  rank: number;
  player: {
    id: string;
    name: string;
    shortName: string;
    headshot?: string;
    flag?: string;
    country?: string;
  };
  value: number;
  displayValue: string;
}

export interface GolfStatCategory {
  name: string;
  displayName: string;
  abbreviation: string;
  leaders: GolfStatLeader[];
}

export interface GolfLeadersResponse {
  categories: GolfStatCategory[];
}

// ---------------------------------------------------------------------------
// FedEx Cup / Tour Rankings (single ordered list)
// ---------------------------------------------------------------------------

export interface GolfRankedPlayer {
  rank: number;
  player: {
    id: string;
    name: string;
    shortName: string;
    headshot?: string;
    flag?: string;
    country?: string;
  };
  points: string;       // FedEx Cup points display value
  pointsValue: number;  // numeric for sorting
  events: string;       // tournaments played
  wins: string;
  topTens: string;
  earnings: string;
}

export interface GolfRankingsResponse {
  title: string;           // e.g. "FedEx Cup Standings"
  players: GolfRankedPlayer[];
}
