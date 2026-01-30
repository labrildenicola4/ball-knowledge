// NCAA Basketball Conference constants for ESPN API
// Group IDs are used in ESPN API requests

export interface ConferenceConfig {
  id: string;
  name: string;
  shortName: string;
  groupId: number; // ESPN group ID
}

// Major conferences (Power 5 equivalent for basketball)
export const POWER_CONFERENCES: ConferenceConfig[] = [
  { id: 'acc', name: 'Atlantic Coast Conference', shortName: 'ACC', groupId: 2 },
  { id: 'big12', name: 'Big 12 Conference', shortName: 'Big 12', groupId: 8 },
  { id: 'bigten', name: 'Big Ten Conference', shortName: 'Big Ten', groupId: 7 },
  { id: 'sec', name: 'Southeastern Conference', shortName: 'SEC', groupId: 23 },
  { id: 'pac12', name: 'Pac-12 Conference', shortName: 'Pac-12', groupId: 21 },
  { id: 'bigeast', name: 'Big East Conference', shortName: 'Big East', groupId: 4 },
];

// Mid-major conferences
export const MID_MAJOR_CONFERENCES: ConferenceConfig[] = [
  { id: 'aac', name: 'American Athletic Conference', shortName: 'AAC', groupId: 62 },
  { id: 'a10', name: 'Atlantic 10 Conference', shortName: 'A-10', groupId: 3 },
  { id: 'mvc', name: 'Missouri Valley Conference', shortName: 'MVC', groupId: 18 },
  { id: 'mwc', name: 'Mountain West Conference', shortName: 'MWC', groupId: 17 },
  { id: 'wcc', name: 'West Coast Conference', shortName: 'WCC', groupId: 26 },
  { id: 'cusa', name: 'Conference USA', shortName: 'C-USA', groupId: 11 },
  { id: 'mac', name: 'Mid-American Conference', shortName: 'MAC', groupId: 15 },
  { id: 'sunbelt', name: 'Sun Belt Conference', shortName: 'Sun Belt', groupId: 27 },
];

// Other conferences
export const OTHER_CONFERENCES: ConferenceConfig[] = [
  { id: 'horizon', name: 'Horizon League', shortName: 'Horizon', groupId: 45 },
  { id: 'ivy', name: 'Ivy League', shortName: 'Ivy', groupId: 12 },
  { id: 'maac', name: 'Metro Atlantic Athletic Conference', shortName: 'MAAC', groupId: 16 },
  { id: 'caa', name: 'Colonial Athletic Association', shortName: 'CAA', groupId: 10 },
  { id: 'ovc', name: 'Ohio Valley Conference', shortName: 'OVC', groupId: 20 },
  { id: 'socon', name: 'Southern Conference', shortName: 'SoCon', groupId: 29 },
  { id: 'southland', name: 'Southland Conference', shortName: 'Southland', groupId: 24 },
  { id: 'summit', name: 'Summit League', shortName: 'Summit', groupId: 49 },
  { id: 'wac', name: 'Western Athletic Conference', shortName: 'WAC', groupId: 30 },
  { id: 'patriot', name: 'Patriot League', shortName: 'Patriot', groupId: 22 },
  { id: 'asun', name: 'ASUN Conference', shortName: 'ASUN', groupId: 46 },
  { id: 'bigsky', name: 'Big Sky Conference', shortName: 'Big Sky', groupId: 5 },
  { id: 'bigsouth', name: 'Big South Conference', shortName: 'Big South', groupId: 6 },
  { id: 'bigwest', name: 'Big West Conference', shortName: 'Big West', groupId: 9 },
  { id: 'meac', name: 'Mid-Eastern Athletic Conference', shortName: 'MEAC', groupId: 14 },
  { id: 'nec', name: 'Northeast Conference', shortName: 'NEC', groupId: 19 },
  { id: 'swac', name: 'Southwestern Athletic Conference', shortName: 'SWAC', groupId: 28 },
  { id: 'america_east', name: 'America East Conference', shortName: 'AEC', groupId: 1 },
];

// All conferences combined
export const ALL_CONFERENCES: ConferenceConfig[] = [
  ...POWER_CONFERENCES,
  ...MID_MAJOR_CONFERENCES,
  ...OTHER_CONFERENCES,
];

// Conference ID to config lookup
export const CONFERENCE_BY_ID: Record<string, ConferenceConfig> = Object.fromEntries(
  ALL_CONFERENCES.map(conf => [conf.id, conf])
);

// ESPN group ID to conference config lookup
export const CONFERENCE_BY_GROUP_ID: Record<number, ConferenceConfig> = Object.fromEntries(
  ALL_CONFERENCES.map(conf => [conf.groupId, conf])
);

// Division 1 group ID for all games
export const NCAA_D1_GROUP_ID = 50;

// Popular team IDs for quick access (ESPN team IDs)
export const POPULAR_TEAMS: Record<string, string> = {
  'duke': '150',
  'unc': '153',
  'kentucky': '96',
  'kansas': '2305',
  'gonzaga': '2250',
  'ucla': '26',
  'villanova': '222',
  'uconn': '41',
  'michigan-state': '127',
  'purdue': '2509',
  'arizona': '12',
  'houston': '248',
  'alabama': '333',
  'tennessee': '2633',
  'auburn': '2',
  'baylor': '239',
  'texas': '251',
  'iowa-state': '66',
  'marquette': '269',
  'creighton': '156',
};

// Status mappings
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
};
