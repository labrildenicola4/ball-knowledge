// TypeScript types for UFC MMA (ESPN API)

export interface UFCFighter {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  record?: string;
  flag?: string;
  winner?: boolean;
  score?: string; // judge score like "30-27"
}

export interface UFCFight {
  id: string;
  status: 'scheduled' | 'in_progress' | 'final';
  statusDetail: string;
  fighter1: UFCFighter;
  fighter2: UFCFighter;
  weightClass?: string;
  cardSegment?: string; // 'Main Card', 'Prelims', 'Early Prelims'
  round?: number;
  clock?: string;
  resultType?: string; // KO/TKO, SUB, DEC, UD, SD, MD
  broadcast?: string;
  startTime: string;
  date: string;
}

export interface UFCEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  venue?: string;
  city?: string;
  fights: UFCFight[];
  status: 'scheduled' | 'in_progress' | 'final';
  startTime: string;
}


export interface UFCFighterRecord {
  wins: number;
  losses: number;
  draws: number;
  tkoWins: number;
  subWins: number;
  decWins: number;
  tkoLosses: number;
  subLosses: number;
  decLosses: number;
  titleWins: number;
}

export interface UFCFighterProfile {
  id: string;
  name: string;
  nickname?: string;
  headshot: string;
  flag?: string;
  height?: string;
  weight?: string;
  reach?: string;
  stance?: string;
  age?: number;
  association?: string;
  styles?: string[];
  record: UFCFighterRecord;
}

export interface UFCFightStats {
  fighterId: string;
  knockdowns: number;
  sigStrikesLanded: number;
  sigStrikesAttempted: number;
  totalStrikesLanded: number;
  totalStrikesAttempted: number;
  takedownsLanded: number;
  takedownsAttempted: number;
  submissionAttempts: number;
  controlTime: string;
  headStrikesLanded: number;
  bodyStrikesLanded: number;
  legStrikesLanded: number;
}

export interface UFCCalendarEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  venue?: string;
  city?: string;
  status: 'upcoming' | 'in_progress' | 'complete';
}

export interface UFCFightDetail {
  id: string;
  eventId: string;
  status: 'scheduled' | 'in_progress' | 'final';
  statusDetail: string;
  weightClass?: string;
  scheduledRounds?: number;
  resultType?: string;
  round?: number;
  clock?: string;
  date: string;
  fighter1: UFCFighter;
  fighter2: UFCFighter;
  fighter1Profile?: UFCFighterProfile;
  fighter2Profile?: UFCFighterProfile;
  fighter1Stats?: UFCFightStats;
  fighter2Stats?: UFCFightStats;
  referee?: string;
}
