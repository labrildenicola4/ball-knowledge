// Unified conference data for both basketball and football

export interface UnifiedConference {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  basketball?: {
    groupId: number;
  };
  football?: {
    groupId: number;
  };
}

// 9 conferences that have BOTH basketball AND football
export const MULTI_SPORT_CONFERENCES: UnifiedConference[] = [
  {
    id: 'acc',
    name: 'Atlantic Coast Conference',
    shortName: 'ACC',
    basketball: { groupId: 2 },
    football: { groupId: 1 },
  },
  {
    id: 'big12',
    name: 'Big 12 Conference',
    shortName: 'Big 12',
    basketball: { groupId: 8 },
    football: { groupId: 4 },
  },
  {
    id: 'bigten',
    name: 'Big Ten Conference',
    shortName: 'Big Ten',
    basketball: { groupId: 7 },
    football: { groupId: 5 },
  },
  {
    id: 'sec',
    name: 'Southeastern Conference',
    shortName: 'SEC',
    basketball: { groupId: 23 },
    football: { groupId: 8 },
  },
  {
    id: 'aac',
    name: 'American Athletic Conference',
    shortName: 'AAC',
    basketball: { groupId: 62 },
    football: { groupId: 151 },
  },
  {
    id: 'mwc',
    name: 'Mountain West Conference',
    shortName: 'Mountain West',
    basketball: { groupId: 17 },
    football: { groupId: 17 },
  },
  {
    id: 'cusa',
    name: 'Conference USA',
    shortName: 'C-USA',
    basketball: { groupId: 11 },
    football: { groupId: 12 },
  },
  {
    id: 'mac',
    name: 'Mid-American Conference',
    shortName: 'MAC',
    basketball: { groupId: 15 },
    football: { groupId: 15 },
  },
  {
    id: 'sunbelt',
    name: 'Sun Belt Conference',
    shortName: 'Sun Belt',
    basketball: { groupId: 27 },
    football: { groupId: 37 },
  },
];

// Basketball-only conferences (no FBS football)
export const BASKETBALL_ONLY_CONFERENCES: UnifiedConference[] = [
  {
    id: 'bigeast',
    name: 'Big East Conference',
    shortName: 'Big East',
    basketball: { groupId: 4 },
  },
  {
    id: 'pac12',
    name: 'Pac-12 Conference',
    shortName: 'Pac-12',
    basketball: { groupId: 21 },
  },
  {
    id: 'a10',
    name: 'Atlantic 10 Conference',
    shortName: 'A-10',
    basketball: { groupId: 3 },
  },
  {
    id: 'mvc',
    name: 'Missouri Valley Conference',
    shortName: 'MVC',
    basketball: { groupId: 18 },
  },
  {
    id: 'wcc',
    name: 'West Coast Conference',
    shortName: 'WCC',
    basketball: { groupId: 26 },
  },
  {
    id: 'horizon',
    name: 'Horizon League',
    shortName: 'Horizon',
    basketball: { groupId: 45 },
  },
  {
    id: 'ivy',
    name: 'Ivy League',
    shortName: 'Ivy',
    basketball: { groupId: 22 },
  },
  {
    id: 'maac',
    name: 'Metro Atlantic Athletic Conference',
    shortName: 'MAAC',
    basketball: { groupId: 44 },
  },
  {
    id: 'caa',
    name: 'Colonial Athletic Association',
    shortName: 'CAA',
    basketball: { groupId: 10 },
  },
  {
    id: 'ovc',
    name: 'Ohio Valley Conference',
    shortName: 'OVC',
    basketball: { groupId: 20 },
  },
  {
    id: 'socon',
    name: 'Southern Conference',
    shortName: 'SoCon',
    basketball: { groupId: 24 },
  },
  {
    id: 'southland',
    name: 'Southland Conference',
    shortName: 'Southland',
    basketball: { groupId: 25 },
  },
  {
    id: 'summit',
    name: 'Summit League',
    shortName: 'Summit',
    basketball: { groupId: 49 },
  },
  {
    id: 'wac',
    name: 'Western Athletic Conference',
    shortName: 'WAC',
    basketball: { groupId: 30 },
  },
  {
    id: 'patriot',
    name: 'Patriot League',
    shortName: 'Patriot',
    basketball: { groupId: 43 },
  },
  {
    id: 'asun',
    name: 'ASUN Conference',
    shortName: 'ASUN',
    basketball: { groupId: 46 },
  },
  {
    id: 'bigsky',
    name: 'Big Sky Conference',
    shortName: 'Big Sky',
    basketball: { groupId: 5 },
  },
  {
    id: 'bigsouth',
    name: 'Big South Conference',
    shortName: 'Big South',
    basketball: { groupId: 6 },
  },
  {
    id: 'bigwest',
    name: 'Big West Conference',
    shortName: 'Big West',
    basketball: { groupId: 9 },
  },
  {
    id: 'meac',
    name: 'Mid-Eastern Athletic Conference',
    shortName: 'MEAC',
    basketball: { groupId: 16 },
  },
  {
    id: 'nec',
    name: 'Northeast Conference',
    shortName: 'NEC',
    basketball: { groupId: 19 },
  },
  {
    id: 'swac',
    name: 'Southwestern Athletic Conference',
    shortName: 'SWAC',
    basketball: { groupId: 28 },
  },
  {
    id: 'americaeast',
    name: 'America East Conference',
    shortName: 'America East',
    basketball: { groupId: 1 },
  },
];

// All conferences combined
export const ALL_CONFERENCES: UnifiedConference[] = [
  ...MULTI_SPORT_CONFERENCES,
  ...BASKETBALL_ONLY_CONFERENCES,
];

// Lookup helpers
export function getConferenceById(id: string): UnifiedConference | undefined {
  return ALL_CONFERENCES.find(c => c.id === id);
}

export function getConferenceByBasketballGroupId(groupId: number): UnifiedConference | undefined {
  return ALL_CONFERENCES.find(c => c.basketball?.groupId === groupId);
}

export function getConferenceByFootballGroupId(groupId: number): UnifiedConference | undefined {
  return ALL_CONFERENCES.find(c => c.football?.groupId === groupId);
}

export function hasMultipleSports(conference: UnifiedConference): boolean {
  return !!conference.basketball && !!conference.football;
}

// Get URL slug from conference ID
export function getConferenceSlug(id: string): string {
  return id.toLowerCase().replace(/\s+/g, '-');
}
