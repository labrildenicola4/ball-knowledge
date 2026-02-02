// NCAA Football Conference constants for ESPN API
// Group IDs are used in ESPN API requests

export interface FootballConferenceConfig {
  id: string;
  name: string;
  shortName: string;
  groupId: number; // ESPN group ID
}

// Power conferences (Power 4 after Pac-12 dissolution)
export const POWER_CONFERENCES: FootballConferenceConfig[] = [
  { id: 'acc', name: 'Atlantic Coast Conference', shortName: 'ACC', groupId: 1 },
  { id: 'big12', name: 'Big 12 Conference', shortName: 'Big 12', groupId: 4 },
  { id: 'bigten', name: 'Big Ten Conference', shortName: 'Big Ten', groupId: 5 },
  { id: 'sec', name: 'Southeastern Conference', shortName: 'SEC', groupId: 8 },
];

// Group of 5 conferences
export const GROUP_OF_5_CONFERENCES: FootballConferenceConfig[] = [
  { id: 'aac', name: 'American Athletic Conference', shortName: 'AAC', groupId: 151 },
  { id: 'mwc', name: 'Mountain West Conference', shortName: 'MWC', groupId: 17 },
  { id: 'cusa', name: 'Conference USA', shortName: 'C-USA', groupId: 12 },
  { id: 'mac', name: 'Mid-American Conference', shortName: 'MAC', groupId: 15 },
  { id: 'sunbelt', name: 'Sun Belt Conference', shortName: 'Sun Belt', groupId: 37 },
];

// Independent teams
export const INDEPENDENT_CONFERENCE: FootballConferenceConfig = {
  id: 'ind', name: 'FBS Independents', shortName: 'Ind', groupId: 18
};

// All FBS conferences
export const ALL_FBS_CONFERENCES: FootballConferenceConfig[] = [
  ...POWER_CONFERENCES,
  ...GROUP_OF_5_CONFERENCES,
  INDEPENDENT_CONFERENCE,
];

// Conference ID to config lookup
export const FOOTBALL_CONFERENCE_BY_ID: Record<string, FootballConferenceConfig> = Object.fromEntries(
  ALL_FBS_CONFERENCES.map(conf => [conf.id, conf])
);

// ESPN group ID to conference config lookup
export const FOOTBALL_CONFERENCE_BY_GROUP_ID: Record<number, FootballConferenceConfig> = Object.fromEntries(
  ALL_FBS_CONFERENCES.map(conf => [conf.groupId, conf])
);

// FBS group ID for all Division 1 FBS games
export const FBS_GROUP_ID = 80;

// Status mappings
export const FOOTBALL_GAME_STATUS_MAP: Record<string, 'scheduled' | 'in_progress' | 'final'> = {
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
