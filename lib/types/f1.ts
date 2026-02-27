// TypeScript types for F1 Racing (ESPN API)

export interface F1Driver {
  id: string;
  name: string;
  shortName: string;
  team?: string;
  flag?: string;
  position?: number;
  time?: string; // race time or gap
  points?: number;
  status?: string; // DNF, DNS, etc.
}

export interface F1Session {
  id: string;
  name: string; // "Practice 1", "Qualifying", "Sprint", "Race"
  shortName: string; // "FP1", "Q", "Sprint", "Race"
  status: 'scheduled' | 'in_progress' | 'final';
  date: string;
  startTime: string;
  results?: F1Driver[];
}

export interface F1Event {
  id: string;
  name: string; // "Australian Grand Prix"
  shortName: string; // "AUS GP"
  circuit?: string;
  city?: string;
  country?: string;
  countryFlag?: string;
  date: string;
  startTime: string;
  sessions: F1Session[];
  status: 'scheduled' | 'in_progress' | 'final';
}

export interface F1DriverStanding {
  position: number;
  driver: {
    id: string;
    name: string;
    shortName: string;
    flag?: string;
  };
  team?: string;
  points: number;
  wins: number;
  poles: number;
  top5: number;
  top10: number;
  behind: number;
}

export interface F1ConstructorStanding {
  position: number;
  team: {
    id: string;
    name: string;
    shortName: string;
  };
  points: number;
  wins: number;
  poles: number;
  behind: number;
}

export interface F1CalendarEntry {
  id: string;
  name: string;
  shortName: string;
  date: string;
  startDate: string;
  endDate: string;
  circuit: string;
  city: string;
  country: string;
  countryFlag: string;
  status: 'upcoming' | 'in_progress' | 'complete';
  round: number;
}

export interface F1StandingsResponse {
  driverStandings: F1DriverStanding[];
  constructorStandings: F1ConstructorStanding[];
}
