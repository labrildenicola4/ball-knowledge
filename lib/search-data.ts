// Searchable data for teams and leagues
import { ALL_CONFERENCES } from './constants/unified-conferences';
import { LEAGUES as LEAGUE_CONFIGS } from './constants/leagues';
import { BASKETBALL_ICON, FOOTBALL_ICON } from './sport-icons';

export interface SearchableTeam {
  id: number;
  name: string;
  shortName: string;
  league: string;
  leagueCode: string;
  logo: string;
}

// API-Football logo URL pattern
const getLogo = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`;

export interface SearchableLeague {
  id: string;
  name: string;
  code: string;
  country: string;
  logo: string;
}

// ESPN MLB logo URL pattern
const getMLBLogo = (abbrev: string) => `https://a.espncdn.com/i/teamlogos/mlb/500/${abbrev.toLowerCase()}.png`;

// ESPN NBA logo URL pattern
const getNBALogo = (abbrev: string) => `https://a.espncdn.com/i/teamlogos/nba/500/${abbrev.toLowerCase()}.png`;

// ESPN NFL logo URL pattern
const getNFLLogo = (abbrev: string) => `https://a.espncdn.com/i/teamlogos/nfl/500/${abbrev.toLowerCase()}.png`;

// ESPN NHL logo URL pattern
const getNHLLogo = (abbrev: string) => `https://a.espncdn.com/i/teamlogos/nhl/500/${abbrev.toLowerCase()}.png`;

// American Sports League interface
export interface SearchableAmericanLeague {
  id: string;
  name: string;
  shortName: string;
  sport: 'nfl' | 'nba' | 'mlb' | 'nhl' | 'ncaab' | 'ncaaf' | 'ufc' | 'f1' | 'golf';
  logo: string;
  href: string;
}

// American Sports Leagues
export const AMERICAN_LEAGUES: SearchableAmericanLeague[] = [
  { id: 'nfl', name: 'National Football League', shortName: 'NFL', sport: 'nfl', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png', href: '/nfl' },
  { id: 'nba', name: 'National Basketball Association', shortName: 'NBA', sport: 'nba', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png', href: '/nba' },
  { id: 'mlb', name: 'Major League Baseball', shortName: 'MLB', sport: 'mlb', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png', href: '/mlb' },
  { id: 'nhl', name: 'National Hockey League', shortName: 'NHL', sport: 'nhl', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png', href: '/nhl' },
  { id: 'ncaab', name: 'NCAA Basketball', shortName: 'NCAA Basketball', sport: 'ncaab', logo: BASKETBALL_ICON, href: '/basketball' },
  { id: 'ncaaf', name: 'NCAA Football', shortName: 'College Football', sport: 'ncaaf', logo: FOOTBALL_ICON, href: '/football' },
  { id: 'ufc', name: 'Ultimate Fighting Championship', shortName: 'UFC', sport: 'ufc', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png', href: '/ufc' },
  { id: 'f1', name: 'Formula 1', shortName: 'F1', sport: 'f1', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png', href: '/f1' },
  { id: 'golf', name: 'PGA Tour', shortName: 'Golf', sport: 'golf', logo: 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-golf.png', href: '/golf' },
];

export interface SearchableMLBTeam {
  id: string;
  name: string;
  abbreviation: string;
  league: 'AL' | 'NL';
  division: 'East' | 'Central' | 'West';
  logo: string;
}

export interface SearchableNBATeam {
  id: string;
  name: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
  logo: string;
}

export interface SearchableNHLTeam {
  id: string;
  name: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
  logo: string;
}

export interface SearchableCollegeBasketballTeam {
  id: string;
  name: string;
  abbreviation: string;
  conference: string;
  logo: string;
}

export interface SearchableCollegeFootballTeam {
  id: string;
  name: string;
  abbreviation: string;
  conference: string;
  logo: string;
}

export interface SearchableF1Driver {
  id: string;
  name: string;
  team: string;
  nationality: string;
  headshot: string;
}

export interface SearchableGolfer {
  id: string;
  name: string;
  country: string;
  headshot: string;
}

export interface SearchableUFCFighter {
  id: string;
  name: string;
  weightClass: string;
  country: string;
  headshot: string;
}

const getF1Headshot = (id: string) => `https://a.espncdn.com/i/headshots/rpm/players/full/${id}.png`;
const getGolfHeadshot = (id: string) => `https://a.espncdn.com/i/headshots/golf/players/full/${id}.png`;
const getUFCHeadshot = (id: string) => `https://a.espncdn.com/i/headshots/mma/players/full/${id}.png`;

export interface SearchableNFLTeam {
  id: string;
  name: string;
  abbreviation: string;
  conference: 'AFC' | 'NFC';
  division: 'East' | 'North' | 'South' | 'West';
  logo: string;
}

export interface SearchableConference {
  id: string;
  name: string;
  shortName: string;
  sports: ('basketball' | 'football')[];
}

export interface SearchableSoccerLeague {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  country: string;
  type: 'league' | 'cup';
  logo: string;
}

// Generate searchable conferences from unified data
export const SEARCHABLE_CONFERENCES: SearchableConference[] = ALL_CONFERENCES.map(c => ({
  id: c.id,
  name: c.name,
  shortName: c.shortName,
  sports: [
    ...(c.basketball ? ['basketball' as const] : []),
    ...(c.football ? ['football' as const] : []),
  ],
}));

// Generate searchable soccer leagues from league configs
export const SEARCHABLE_SOCCER_LEAGUES: SearchableSoccerLeague[] = LEAGUE_CONFIGS.map(l => ({
  id: l.key,
  slug: l.slug,
  name: l.name,
  shortName: l.shortName,
  country: l.country,
  type: l.type,
  logo: `https://media.api-sports.io/football/leagues/${l.id}.png`,
}));

// ESPN College Basketball logo URL pattern
const getCollegeLogo = (id: string) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;

export const MLB_TEAMS: SearchableMLBTeam[] = [
  // American League East
  { id: '1', name: 'Baltimore Orioles', abbreviation: 'BAL', league: 'AL', division: 'East', logo: getMLBLogo('bal') },
  { id: '2', name: 'Boston Red Sox', abbreviation: 'BOS', league: 'AL', division: 'East', logo: getMLBLogo('bos') },
  { id: '10', name: 'New York Yankees', abbreviation: 'NYY', league: 'AL', division: 'East', logo: getMLBLogo('nyy') },
  { id: '30', name: 'Tampa Bay Rays', abbreviation: 'TB', league: 'AL', division: 'East', logo: getMLBLogo('tb') },
  { id: '14', name: 'Toronto Blue Jays', abbreviation: 'TOR', league: 'AL', division: 'East', logo: getMLBLogo('tor') },
  // American League Central
  { id: '4', name: 'Chicago White Sox', abbreviation: 'CHW', league: 'AL', division: 'Central', logo: getMLBLogo('chw') },
  { id: '5', name: 'Cleveland Guardians', abbreviation: 'CLE', league: 'AL', division: 'Central', logo: getMLBLogo('cle') },
  { id: '6', name: 'Detroit Tigers', abbreviation: 'DET', league: 'AL', division: 'Central', logo: getMLBLogo('det') },
  { id: '7', name: 'Kansas City Royals', abbreviation: 'KC', league: 'AL', division: 'Central', logo: getMLBLogo('kc') },
  { id: '9', name: 'Minnesota Twins', abbreviation: 'MIN', league: 'AL', division: 'Central', logo: getMLBLogo('min') },
  // American League West
  { id: '18', name: 'Houston Astros', abbreviation: 'HOU', league: 'AL', division: 'West', logo: getMLBLogo('hou') },
  { id: '3', name: 'Los Angeles Angels', abbreviation: 'LAA', league: 'AL', division: 'West', logo: getMLBLogo('laa') },
  { id: '11', name: 'Athletics', abbreviation: 'ATH', league: 'AL', division: 'West', logo: getMLBLogo('oak') },
  { id: '12', name: 'Seattle Mariners', abbreviation: 'SEA', league: 'AL', division: 'West', logo: getMLBLogo('sea') },
  { id: '13', name: 'Texas Rangers', abbreviation: 'TEX', league: 'AL', division: 'West', logo: getMLBLogo('tex') },
  // National League East
  { id: '15', name: 'Atlanta Braves', abbreviation: 'ATL', league: 'NL', division: 'East', logo: getMLBLogo('atl') },
  { id: '28', name: 'Miami Marlins', abbreviation: 'MIA', league: 'NL', division: 'East', logo: getMLBLogo('mia') },
  { id: '21', name: 'New York Mets', abbreviation: 'NYM', league: 'NL', division: 'East', logo: getMLBLogo('nym') },
  { id: '22', name: 'Philadelphia Phillies', abbreviation: 'PHI', league: 'NL', division: 'East', logo: getMLBLogo('phi') },
  { id: '20', name: 'Washington Nationals', abbreviation: 'WSH', league: 'NL', division: 'East', logo: getMLBLogo('wsh') },
  // National League Central
  { id: '16', name: 'Chicago Cubs', abbreviation: 'CHC', league: 'NL', division: 'Central', logo: getMLBLogo('chc') },
  { id: '17', name: 'Cincinnati Reds', abbreviation: 'CIN', league: 'NL', division: 'Central', logo: getMLBLogo('cin') },
  { id: '8', name: 'Milwaukee Brewers', abbreviation: 'MIL', league: 'NL', division: 'Central', logo: getMLBLogo('mil') },
  { id: '23', name: 'Pittsburgh Pirates', abbreviation: 'PIT', league: 'NL', division: 'Central', logo: getMLBLogo('pit') },
  { id: '24', name: 'St. Louis Cardinals', abbreviation: 'STL', league: 'NL', division: 'Central', logo: getMLBLogo('stl') },
  // National League West
  { id: '29', name: 'Arizona Diamondbacks', abbreviation: 'ARI', league: 'NL', division: 'West', logo: getMLBLogo('ari') },
  { id: '27', name: 'Colorado Rockies', abbreviation: 'COL', league: 'NL', division: 'West', logo: getMLBLogo('col') },
  { id: '19', name: 'Los Angeles Dodgers', abbreviation: 'LAD', league: 'NL', division: 'West', logo: getMLBLogo('lad') },
  { id: '25', name: 'San Diego Padres', abbreviation: 'SD', league: 'NL', division: 'West', logo: getMLBLogo('sd') },
  { id: '26', name: 'San Francisco Giants', abbreviation: 'SF', league: 'NL', division: 'West', logo: getMLBLogo('sf') },
];

export const NBA_TEAMS: SearchableNBATeam[] = [
  // Eastern Conference - Atlantic
  { id: '2', name: 'Boston Celtics', abbreviation: 'BOS', conference: 'Eastern', division: 'Atlantic', logo: getNBALogo('bos') },
  { id: '17', name: 'Brooklyn Nets', abbreviation: 'BKN', conference: 'Eastern', division: 'Atlantic', logo: getNBALogo('bkn') },
  { id: '18', name: 'New York Knicks', abbreviation: 'NYK', conference: 'Eastern', division: 'Atlantic', logo: getNBALogo('ny') },
  { id: '20', name: 'Philadelphia 76ers', abbreviation: 'PHI', conference: 'Eastern', division: 'Atlantic', logo: getNBALogo('phi') },
  { id: '28', name: 'Toronto Raptors', abbreviation: 'TOR', conference: 'Eastern', division: 'Atlantic', logo: getNBALogo('tor') },
  // Eastern Conference - Central
  { id: '4', name: 'Chicago Bulls', abbreviation: 'CHI', conference: 'Eastern', division: 'Central', logo: getNBALogo('chi') },
  { id: '5', name: 'Cleveland Cavaliers', abbreviation: 'CLE', conference: 'Eastern', division: 'Central', logo: getNBALogo('cle') },
  { id: '8', name: 'Detroit Pistons', abbreviation: 'DET', conference: 'Eastern', division: 'Central', logo: getNBALogo('det') },
  { id: '11', name: 'Indiana Pacers', abbreviation: 'IND', conference: 'Eastern', division: 'Central', logo: getNBALogo('ind') },
  { id: '15', name: 'Milwaukee Bucks', abbreviation: 'MIL', conference: 'Eastern', division: 'Central', logo: getNBALogo('mil') },
  // Eastern Conference - Southeast
  { id: '1', name: 'Atlanta Hawks', abbreviation: 'ATL', conference: 'Eastern', division: 'Southeast', logo: getNBALogo('atl') },
  { id: '30', name: 'Charlotte Hornets', abbreviation: 'CHA', conference: 'Eastern', division: 'Southeast', logo: getNBALogo('cha') },
  { id: '14', name: 'Miami Heat', abbreviation: 'MIA', conference: 'Eastern', division: 'Southeast', logo: getNBALogo('mia') },
  { id: '19', name: 'Orlando Magic', abbreviation: 'ORL', conference: 'Eastern', division: 'Southeast', logo: getNBALogo('orl') },
  { id: '27', name: 'Washington Wizards', abbreviation: 'WAS', conference: 'Eastern', division: 'Southeast', logo: getNBALogo('wsh') },
  // Western Conference - Northwest
  { id: '7', name: 'Denver Nuggets', abbreviation: 'DEN', conference: 'Western', division: 'Northwest', logo: getNBALogo('den') },
  { id: '16', name: 'Minnesota Timberwolves', abbreviation: 'MIN', conference: 'Western', division: 'Northwest', logo: getNBALogo('min') },
  { id: '25', name: 'Oklahoma City Thunder', abbreviation: 'OKC', conference: 'Western', division: 'Northwest', logo: getNBALogo('okc') },
  { id: '22', name: 'Portland Trail Blazers', abbreviation: 'POR', conference: 'Western', division: 'Northwest', logo: getNBALogo('por') },
  { id: '26', name: 'Utah Jazz', abbreviation: 'UTA', conference: 'Western', division: 'Northwest', logo: getNBALogo('utah') },
  // Western Conference - Pacific
  { id: '9', name: 'Golden State Warriors', abbreviation: 'GSW', conference: 'Western', division: 'Pacific', logo: getNBALogo('gs') },
  { id: '12', name: 'LA Clippers', abbreviation: 'LAC', conference: 'Western', division: 'Pacific', logo: getNBALogo('lac') },
  { id: '13', name: 'Los Angeles Lakers', abbreviation: 'LAL', conference: 'Western', division: 'Pacific', logo: getNBALogo('lal') },
  { id: '21', name: 'Phoenix Suns', abbreviation: 'PHX', conference: 'Western', division: 'Pacific', logo: getNBALogo('phx') },
  { id: '23', name: 'Sacramento Kings', abbreviation: 'SAC', conference: 'Western', division: 'Pacific', logo: getNBALogo('sac') },
  // Western Conference - Southwest
  { id: '6', name: 'Dallas Mavericks', abbreviation: 'DAL', conference: 'Western', division: 'Southwest', logo: getNBALogo('dal') },
  { id: '10', name: 'Houston Rockets', abbreviation: 'HOU', conference: 'Western', division: 'Southwest', logo: getNBALogo('hou') },
  { id: '29', name: 'Memphis Grizzlies', abbreviation: 'MEM', conference: 'Western', division: 'Southwest', logo: getNBALogo('mem') },
  { id: '3', name: 'New Orleans Pelicans', abbreviation: 'NOP', conference: 'Western', division: 'Southwest', logo: getNBALogo('no') },
  { id: '24', name: 'San Antonio Spurs', abbreviation: 'SAS', conference: 'Western', division: 'Southwest', logo: getNBALogo('sa') },
];

export const NFL_TEAMS: SearchableNFLTeam[] = [
  // AFC East
  { id: '2', name: 'Buffalo Bills', abbreviation: 'BUF', conference: 'AFC', division: 'East', logo: getNFLLogo('buf') },
  { id: '15', name: 'Miami Dolphins', abbreviation: 'MIA', conference: 'AFC', division: 'East', logo: getNFLLogo('mia') },
  { id: '17', name: 'New England Patriots', abbreviation: 'NE', conference: 'AFC', division: 'East', logo: getNFLLogo('ne') },
  { id: '20', name: 'New York Jets', abbreviation: 'NYJ', conference: 'AFC', division: 'East', logo: getNFLLogo('nyj') },
  // AFC North
  { id: '33', name: 'Baltimore Ravens', abbreviation: 'BAL', conference: 'AFC', division: 'North', logo: getNFLLogo('bal') },
  { id: '4', name: 'Cincinnati Bengals', abbreviation: 'CIN', conference: 'AFC', division: 'North', logo: getNFLLogo('cin') },
  { id: '5', name: 'Cleveland Browns', abbreviation: 'CLE', conference: 'AFC', division: 'North', logo: getNFLLogo('cle') },
  { id: '23', name: 'Pittsburgh Steelers', abbreviation: 'PIT', conference: 'AFC', division: 'North', logo: getNFLLogo('pit') },
  // AFC South
  { id: '34', name: 'Houston Texans', abbreviation: 'HOU', conference: 'AFC', division: 'South', logo: getNFLLogo('hou') },
  { id: '11', name: 'Indianapolis Colts', abbreviation: 'IND', conference: 'AFC', division: 'South', logo: getNFLLogo('ind') },
  { id: '30', name: 'Jacksonville Jaguars', abbreviation: 'JAX', conference: 'AFC', division: 'South', logo: getNFLLogo('jax') },
  { id: '10', name: 'Tennessee Titans', abbreviation: 'TEN', conference: 'AFC', division: 'South', logo: getNFLLogo('ten') },
  // AFC West
  { id: '7', name: 'Denver Broncos', abbreviation: 'DEN', conference: 'AFC', division: 'West', logo: getNFLLogo('den') },
  { id: '12', name: 'Kansas City Chiefs', abbreviation: 'KC', conference: 'AFC', division: 'West', logo: getNFLLogo('kc') },
  { id: '13', name: 'Las Vegas Raiders', abbreviation: 'LV', conference: 'AFC', division: 'West', logo: getNFLLogo('lv') },
  { id: '24', name: 'Los Angeles Chargers', abbreviation: 'LAC', conference: 'AFC', division: 'West', logo: getNFLLogo('lac') },
  // NFC East
  { id: '6', name: 'Dallas Cowboys', abbreviation: 'DAL', conference: 'NFC', division: 'East', logo: getNFLLogo('dal') },
  { id: '19', name: 'New York Giants', abbreviation: 'NYG', conference: 'NFC', division: 'East', logo: getNFLLogo('nyg') },
  { id: '21', name: 'Philadelphia Eagles', abbreviation: 'PHI', conference: 'NFC', division: 'East', logo: getNFLLogo('phi') },
  { id: '28', name: 'Washington Commanders', abbreviation: 'WSH', conference: 'NFC', division: 'East', logo: getNFLLogo('wsh') },
  // NFC North
  { id: '3', name: 'Chicago Bears', abbreviation: 'CHI', conference: 'NFC', division: 'North', logo: getNFLLogo('chi') },
  { id: '8', name: 'Detroit Lions', abbreviation: 'DET', conference: 'NFC', division: 'North', logo: getNFLLogo('det') },
  { id: '9', name: 'Green Bay Packers', abbreviation: 'GB', conference: 'NFC', division: 'North', logo: getNFLLogo('gb') },
  { id: '16', name: 'Minnesota Vikings', abbreviation: 'MIN', conference: 'NFC', division: 'North', logo: getNFLLogo('min') },
  // NFC South
  { id: '1', name: 'Atlanta Falcons', abbreviation: 'ATL', conference: 'NFC', division: 'South', logo: getNFLLogo('atl') },
  { id: '29', name: 'Carolina Panthers', abbreviation: 'CAR', conference: 'NFC', division: 'South', logo: getNFLLogo('car') },
  { id: '18', name: 'New Orleans Saints', abbreviation: 'NO', conference: 'NFC', division: 'South', logo: getNFLLogo('no') },
  { id: '27', name: 'Tampa Bay Buccaneers', abbreviation: 'TB', conference: 'NFC', division: 'South', logo: getNFLLogo('tb') },
  // NFC West
  { id: '22', name: 'Arizona Cardinals', abbreviation: 'ARI', conference: 'NFC', division: 'West', logo: getNFLLogo('ari') },
  { id: '14', name: 'Los Angeles Rams', abbreviation: 'LAR', conference: 'NFC', division: 'West', logo: getNFLLogo('lar') },
  { id: '25', name: 'San Francisco 49ers', abbreviation: 'SF', conference: 'NFC', division: 'West', logo: getNFLLogo('sf') },
  { id: '26', name: 'Seattle Seahawks', abbreviation: 'SEA', conference: 'NFC', division: 'West', logo: getNFLLogo('sea') },
];

export const NHL_TEAMS: SearchableNHLTeam[] = [
  // Eastern Conference - Atlantic
  { id: '1', name: 'Boston Bruins', abbreviation: 'BOS', conference: 'Eastern', division: 'Atlantic', logo: getNHLLogo('bos') },
  { id: '7', name: 'Buffalo Sabres', abbreviation: 'BUF', conference: 'Eastern', division: 'Atlantic', logo: getNHLLogo('buf') },
  { id: '8', name: 'Detroit Red Wings', abbreviation: 'DET', conference: 'Eastern', division: 'Atlantic', logo: getNHLLogo('det') },
  { id: '13', name: 'Florida Panthers', abbreviation: 'FLA', conference: 'Eastern', division: 'Atlantic', logo: getNHLLogo('fla') },
  { id: '14', name: 'Montreal Canadiens', abbreviation: 'MTL', conference: 'Eastern', division: 'Atlantic', logo: getNHLLogo('mtl') },
  { id: '9', name: 'Ottawa Senators', abbreviation: 'OTT', conference: 'Eastern', division: 'Atlantic', logo: getNHLLogo('ott') },
  { id: '20', name: 'Tampa Bay Lightning', abbreviation: 'TB', conference: 'Eastern', division: 'Atlantic', logo: getNHLLogo('tb') },
  { id: '10', name: 'Toronto Maple Leafs', abbreviation: 'TOR', conference: 'Eastern', division: 'Atlantic', logo: getNHLLogo('tor') },
  // Eastern Conference - Metropolitan
  { id: '15', name: 'Carolina Hurricanes', abbreviation: 'CAR', conference: 'Eastern', division: 'Metropolitan', logo: getNHLLogo('car') },
  { id: '29', name: 'Columbus Blue Jackets', abbreviation: 'CBJ', conference: 'Eastern', division: 'Metropolitan', logo: getNHLLogo('cbj') },
  { id: '2', name: 'New Jersey Devils', abbreviation: 'NJD', conference: 'Eastern', division: 'Metropolitan', logo: getNHLLogo('njd') },
  { id: '3', name: 'New York Islanders', abbreviation: 'NYI', conference: 'Eastern', division: 'Metropolitan', logo: getNHLLogo('nyi') },
  { id: '4', name: 'New York Rangers', abbreviation: 'NYR', conference: 'Eastern', division: 'Metropolitan', logo: getNHLLogo('nyr') },
  { id: '5', name: 'Philadelphia Flyers', abbreviation: 'PHI', conference: 'Eastern', division: 'Metropolitan', logo: getNHLLogo('phi') },
  { id: '6', name: 'Pittsburgh Penguins', abbreviation: 'PIT', conference: 'Eastern', division: 'Metropolitan', logo: getNHLLogo('pit') },
  { id: '12', name: 'Washington Capitals', abbreviation: 'WSH', conference: 'Eastern', division: 'Metropolitan', logo: getNHLLogo('wsh') },
  // Western Conference - Central
  { id: '16', name: 'Arizona Coyotes', abbreviation: 'ARI', conference: 'Western', division: 'Central', logo: getNHLLogo('ari') },
  { id: '21', name: 'Chicago Blackhawks', abbreviation: 'CHI', conference: 'Western', division: 'Central', logo: getNHLLogo('chi') },
  { id: '17', name: 'Colorado Avalanche', abbreviation: 'COL', conference: 'Western', division: 'Central', logo: getNHLLogo('col') },
  { id: '25', name: 'Dallas Stars', abbreviation: 'DAL', conference: 'Western', division: 'Central', logo: getNHLLogo('dal') },
  { id: '30', name: 'Minnesota Wild', abbreviation: 'MIN', conference: 'Western', division: 'Central', logo: getNHLLogo('min') },
  { id: '18', name: 'Nashville Predators', abbreviation: 'NSH', conference: 'Western', division: 'Central', logo: getNHLLogo('nsh') },
  { id: '19', name: 'St. Louis Blues', abbreviation: 'STL', conference: 'Western', division: 'Central', logo: getNHLLogo('stl') },
  { id: '52', name: 'Winnipeg Jets', abbreviation: 'WPG', conference: 'Western', division: 'Central', logo: getNHLLogo('wpg') },
  // Western Conference - Pacific
  { id: '24', name: 'Anaheim Ducks', abbreviation: 'ANA', conference: 'Western', division: 'Pacific', logo: getNHLLogo('ana') },
  { id: '23', name: 'Calgary Flames', abbreviation: 'CGY', conference: 'Western', division: 'Pacific', logo: getNHLLogo('cgy') },
  { id: '22', name: 'Edmonton Oilers', abbreviation: 'EDM', conference: 'Western', division: 'Pacific', logo: getNHLLogo('edm') },
  { id: '26', name: 'Los Angeles Kings', abbreviation: 'LAK', conference: 'Western', division: 'Pacific', logo: getNHLLogo('la') },
  { id: '28', name: 'San Jose Sharks', abbreviation: 'SJS', conference: 'Western', division: 'Pacific', logo: getNHLLogo('sj') },
  { id: '55', name: 'Seattle Kraken', abbreviation: 'SEA', conference: 'Western', division: 'Pacific', logo: getNHLLogo('sea') },
  { id: '53', name: 'Utah Hockey Club', abbreviation: 'UTA', conference: 'Western', division: 'Central', logo: getNHLLogo('uta') },
  { id: '27', name: 'Vancouver Canucks', abbreviation: 'VAN', conference: 'Western', division: 'Pacific', logo: getNHLLogo('van') },
  { id: '54', name: 'Vegas Golden Knights', abbreviation: 'VGK', conference: 'Western', division: 'Pacific', logo: getNHLLogo('vgk') },
];

export const COLLEGE_BASKETBALL_TEAMS: SearchableCollegeBasketballTeam[] = [
  // ACC
  { id: '150', name: 'Duke Blue Devils', abbreviation: 'DUKE', conference: 'ACC', logo: getCollegeLogo('150') },
  { id: '153', name: 'North Carolina Tar Heels', abbreviation: 'UNC', conference: 'ACC', logo: getCollegeLogo('153') },
  { id: '152', name: 'NC State Wolfpack', abbreviation: 'NCSU', conference: 'ACC', logo: getCollegeLogo('152') },
  { id: '258', name: 'Virginia Cavaliers', abbreviation: 'UVA', conference: 'ACC', logo: getCollegeLogo('258') },
  { id: '154', name: 'Wake Forest Demon Deacons', abbreviation: 'WAKE', conference: 'ACC', logo: getCollegeLogo('154') },
  { id: '52', name: 'Florida State Seminoles', abbreviation: 'FSU', conference: 'ACC', logo: getCollegeLogo('52') },
  { id: '183', name: 'Syracuse Orange', abbreviation: 'SYR', conference: 'ACC', logo: getCollegeLogo('183') },
  { id: '228', name: 'Clemson Tigers', abbreviation: 'CLEM', conference: 'ACC', logo: getCollegeLogo('228') },
  { id: '87', name: 'Notre Dame Fighting Irish', abbreviation: 'ND', conference: 'ACC', logo: getCollegeLogo('87') },
  { id: '221', name: 'Pittsburgh Panthers', abbreviation: 'PITT', conference: 'ACC', logo: getCollegeLogo('221') },
  { id: '97', name: 'Louisville Cardinals', abbreviation: 'LOU', conference: 'ACC', logo: getCollegeLogo('97') },
  { id: '259', name: 'Virginia Tech Hokies', abbreviation: 'VT', conference: 'ACC', logo: getCollegeLogo('259') },
  { id: '59', name: 'Georgia Tech Yellow Jackets', abbreviation: 'GT', conference: 'ACC', logo: getCollegeLogo('59') },
  { id: '2390', name: 'Miami Hurricanes', abbreviation: 'MIA', conference: 'ACC', logo: getCollegeLogo('2390') },
  { id: '103', name: 'Boston College Eagles', abbreviation: 'BC', conference: 'ACC', logo: getCollegeLogo('103') },
  { id: '2567', name: 'SMU Mustangs', abbreviation: 'SMU', conference: 'ACC', logo: getCollegeLogo('2567') },
  // Big 12
  { id: '2305', name: 'Kansas Jayhawks', abbreviation: 'KU', conference: 'Big 12', logo: getCollegeLogo('2305') },
  { id: '239', name: 'Baylor Bears', abbreviation: 'BAY', conference: 'Big 12', logo: getCollegeLogo('239') },
  { id: '251', name: 'Texas Longhorns', abbreviation: 'TEX', conference: 'Big 12', logo: getCollegeLogo('251') },
  { id: '66', name: 'Iowa State Cyclones', abbreviation: 'ISU', conference: 'Big 12', logo: getCollegeLogo('66') },
  { id: '2641', name: 'Texas Tech Red Raiders', abbreviation: 'TTU', conference: 'Big 12', logo: getCollegeLogo('2641') },
  { id: '197', name: 'Oklahoma State Cowboys', abbreviation: 'OKST', conference: 'Big 12', logo: getCollegeLogo('197') },
  { id: '2306', name: 'Kansas State Wildcats', abbreviation: 'KSU', conference: 'Big 12', logo: getCollegeLogo('2306') },
  { id: '2628', name: 'TCU Horned Frogs', abbreviation: 'TCU', conference: 'Big 12', logo: getCollegeLogo('2628') },
  { id: '277', name: 'West Virginia Mountaineers', abbreviation: 'WVU', conference: 'Big 12', logo: getCollegeLogo('277') },
  { id: '201', name: 'Oklahoma Sooners', abbreviation: 'OU', conference: 'Big 12', logo: getCollegeLogo('201') },
  { id: '2116', name: 'UCF Knights', abbreviation: 'UCF', conference: 'Big 12', logo: getCollegeLogo('2116') },
  { id: '248', name: 'Houston Cougars', abbreviation: 'HOU', conference: 'Big 12', logo: getCollegeLogo('248') },
  { id: '2132', name: 'Cincinnati Bearcats', abbreviation: 'CIN', conference: 'Big 12', logo: getCollegeLogo('2132') },
  { id: '252', name: 'BYU Cougars', abbreviation: 'BYU', conference: 'Big 12', logo: getCollegeLogo('252') },
  { id: '12', name: 'Arizona Wildcats', abbreviation: 'ARIZ', conference: 'Big 12', logo: getCollegeLogo('12') },
  { id: '9', name: 'Arizona State Sun Devils', abbreviation: 'ASU', conference: 'Big 12', logo: getCollegeLogo('9') },
  { id: '38', name: 'Colorado Buffaloes', abbreviation: 'COLO', conference: 'Big 12', logo: getCollegeLogo('38') },
  { id: '254', name: 'Utah Utes', abbreviation: 'UTAH', conference: 'Big 12', logo: getCollegeLogo('254') },
  // Big Ten
  { id: '2509', name: 'Purdue Boilermakers', abbreviation: 'PUR', conference: 'Big Ten', logo: getCollegeLogo('2509') },
  { id: '127', name: 'Michigan State Spartans', abbreviation: 'MSU', conference: 'Big Ten', logo: getCollegeLogo('127') },
  { id: '130', name: 'Michigan Wolverines', abbreviation: 'MICH', conference: 'Big Ten', logo: getCollegeLogo('130') },
  { id: '84', name: 'Indiana Hoosiers', abbreviation: 'IU', conference: 'Big Ten', logo: getCollegeLogo('84') },
  { id: '194', name: 'Ohio State Buckeyes', abbreviation: 'OSU', conference: 'Big Ten', logo: getCollegeLogo('194') },
  { id: '356', name: 'Illinois Fighting Illini', abbreviation: 'ILL', conference: 'Big Ten', logo: getCollegeLogo('356') },
  { id: '275', name: 'Wisconsin Badgers', abbreviation: 'WIS', conference: 'Big Ten', logo: getCollegeLogo('275') },
  { id: '135', name: 'Minnesota Golden Gophers', abbreviation: 'MINN', conference: 'Big Ten', logo: getCollegeLogo('135') },
  { id: '2294', name: 'Iowa Hawkeyes', abbreviation: 'IOWA', conference: 'Big Ten', logo: getCollegeLogo('2294') },
  { id: '120', name: 'Maryland Terrapins', abbreviation: 'MD', conference: 'Big Ten', logo: getCollegeLogo('120') },
  { id: '77', name: 'Northwestern Wildcats', abbreviation: 'NU', conference: 'Big Ten', logo: getCollegeLogo('77') },
  { id: '164', name: 'Rutgers Scarlet Knights', abbreviation: 'RUTG', conference: 'Big Ten', logo: getCollegeLogo('164') },
  { id: '213', name: 'Penn State Nittany Lions', abbreviation: 'PSU', conference: 'Big Ten', logo: getCollegeLogo('213') },
  { id: '158', name: 'Nebraska Cornhuskers', abbreviation: 'NEB', conference: 'Big Ten', logo: getCollegeLogo('158') },
  { id: '26', name: 'UCLA Bruins', abbreviation: 'UCLA', conference: 'Big Ten', logo: getCollegeLogo('26') },
  { id: '30', name: 'USC Trojans', abbreviation: 'USC', conference: 'Big Ten', logo: getCollegeLogo('30') },
  { id: '2483', name: 'Oregon Ducks', abbreviation: 'ORE', conference: 'Big Ten', logo: getCollegeLogo('2483') },
  { id: '264', name: 'Washington Huskies', abbreviation: 'WASH', conference: 'Big Ten', logo: getCollegeLogo('264') },
  // SEC
  { id: '96', name: 'Kentucky Wildcats', abbreviation: 'UK', conference: 'SEC', logo: getCollegeLogo('96') },
  { id: '2633', name: 'Tennessee Volunteers', abbreviation: 'TENN', conference: 'SEC', logo: getCollegeLogo('2633') },
  { id: '2', name: 'Auburn Tigers', abbreviation: 'AUB', conference: 'SEC', logo: getCollegeLogo('2') },
  { id: '333', name: 'Alabama Crimson Tide', abbreviation: 'ALA', conference: 'SEC', logo: getCollegeLogo('333') },
  { id: '57', name: 'Florida Gators', abbreviation: 'FLA', conference: 'SEC', logo: getCollegeLogo('57') },
  { id: '8', name: 'Arkansas Razorbacks', abbreviation: 'ARK', conference: 'SEC', logo: getCollegeLogo('8') },
  { id: '99', name: 'LSU Tigers', abbreviation: 'LSU', conference: 'SEC', logo: getCollegeLogo('99') },
  { id: '344', name: 'Mississippi State Bulldogs', abbreviation: 'MSST', conference: 'SEC', logo: getCollegeLogo('344') },
  { id: '145', name: 'Ole Miss Rebels', abbreviation: 'MISS', conference: 'SEC', logo: getCollegeLogo('145') },
  { id: '61', name: 'Georgia Bulldogs', abbreviation: 'UGA', conference: 'SEC', logo: getCollegeLogo('61') },
  { id: '2579', name: 'South Carolina Gamecocks', abbreviation: 'SC', conference: 'SEC', logo: getCollegeLogo('2579') },
  { id: '142', name: 'Missouri Tigers', abbreviation: 'MIZ', conference: 'SEC', logo: getCollegeLogo('142') },
  { id: '245', name: 'Texas A&M Aggies', abbreviation: 'TAMU', conference: 'SEC', logo: getCollegeLogo('245') },
  { id: '238', name: 'Vanderbilt Commodores', abbreviation: 'VAN', conference: 'SEC', logo: getCollegeLogo('238') },
  // Big East
  { id: '41', name: 'UConn Huskies', abbreviation: 'CONN', conference: 'Big East', logo: getCollegeLogo('41') },
  { id: '269', name: 'Marquette Golden Eagles', abbreviation: 'MARQ', conference: 'Big East', logo: getCollegeLogo('269') },
  { id: '156', name: 'Creighton Bluejays', abbreviation: 'CREI', conference: 'Big East', logo: getCollegeLogo('156') },
  { id: '222', name: 'Villanova Wildcats', abbreviation: 'VILL', conference: 'Big East', logo: getCollegeLogo('222') },
  { id: '2550', name: 'Seton Hall Pirates', abbreviation: 'HALL', conference: 'Big East', logo: getCollegeLogo('2550') },
  { id: '46', name: 'Georgetown Hoyas', abbreviation: 'GTWN', conference: 'Big East', logo: getCollegeLogo('46') },
  { id: '2599', name: 'St. Johns Red Storm', abbreviation: 'SJU', conference: 'Big East', logo: getCollegeLogo('2599') },
  { id: '2086', name: 'Butler Bulldogs', abbreviation: 'BUT', conference: 'Big East', logo: getCollegeLogo('2086') },
  { id: '2752', name: 'Xavier Musketeers', abbreviation: 'XAV', conference: 'Big East', logo: getCollegeLogo('2752') },
  { id: '2507', name: 'Providence Friars', abbreviation: 'PROV', conference: 'Big East', logo: getCollegeLogo('2507') },
  { id: '305', name: 'DePaul Blue Demons', abbreviation: 'DEP', conference: 'Big East', logo: getCollegeLogo('305') },
  // West Coast Conference
  { id: '2250', name: 'Gonzaga Bulldogs', abbreviation: 'GONZ', conference: 'WCC', logo: getCollegeLogo('2250') },
  { id: '2608', name: 'Saint Marys Gaels', abbreviation: 'SMC', conference: 'WCC', logo: getCollegeLogo('2608') },
  { id: '2539', name: 'San Francisco Dons', abbreviation: 'SF', conference: 'WCC', logo: getCollegeLogo('2539') },
  { id: '2541', name: 'Santa Clara Broncos', abbreviation: 'SCU', conference: 'WCC', logo: getCollegeLogo('2541') },
  // Mountain West
  { id: '21', name: 'San Diego State Aztecs', abbreviation: 'SDSU', conference: 'MWC', logo: getCollegeLogo('21') },
  { id: '2440', name: 'Nevada Wolf Pack', abbreviation: 'NEV', conference: 'MWC', logo: getCollegeLogo('2440') },
  { id: '36', name: 'Colorado State Rams', abbreviation: 'CSU', conference: 'MWC', logo: getCollegeLogo('36') },
  // AAC
  { id: '235', name: 'Memphis Tigers', abbreviation: 'MEM', conference: 'AAC', logo: getCollegeLogo('235') },
  { id: '2724', name: 'Wichita State Shockers', abbreviation: 'WICH', conference: 'AAC', logo: getCollegeLogo('2724') },
  // Atlantic 10
  { id: '2670', name: 'VCU Rams', abbreviation: 'VCU', conference: 'A-10', logo: getCollegeLogo('2670') },
  { id: '2168', name: 'Dayton Flyers', abbreviation: 'DAY', conference: 'A-10', logo: getCollegeLogo('2168') },
  { id: '179', name: 'St. Bonaventure Bonnies', abbreviation: 'SBU', conference: 'A-10', logo: getCollegeLogo('179') },
];

export const COLLEGE_FOOTBALL_TEAMS: SearchableCollegeFootballTeam[] = [
  // ACC
  { id: '228', name: 'Clemson Tigers', abbreviation: 'CLEM', conference: 'ACC', logo: getCollegeLogo('228') },
  { id: '52', name: 'Florida State Seminoles', abbreviation: 'FSU', conference: 'ACC', logo: getCollegeLogo('52') },
  { id: '2390', name: 'Miami Hurricanes', abbreviation: 'MIA', conference: 'ACC', logo: getCollegeLogo('2390') },
  { id: '153', name: 'North Carolina Tar Heels', abbreviation: 'UNC', conference: 'ACC', logo: getCollegeLogo('153') },
  { id: '152', name: 'NC State Wolfpack', abbreviation: 'NCSU', conference: 'ACC', logo: getCollegeLogo('152') },
  { id: '258', name: 'Virginia Cavaliers', abbreviation: 'UVA', conference: 'ACC', logo: getCollegeLogo('258') },
  { id: '259', name: 'Virginia Tech Hokies', abbreviation: 'VT', conference: 'ACC', logo: getCollegeLogo('259') },
  { id: '154', name: 'Wake Forest Demon Deacons', abbreviation: 'WAKE', conference: 'ACC', logo: getCollegeLogo('154') },
  { id: '150', name: 'Duke Blue Devils', abbreviation: 'DUKE', conference: 'ACC', logo: getCollegeLogo('150') },
  { id: '97', name: 'Louisville Cardinals', abbreviation: 'LOU', conference: 'ACC', logo: getCollegeLogo('97') },
  { id: '221', name: 'Pittsburgh Panthers', abbreviation: 'PITT', conference: 'ACC', logo: getCollegeLogo('221') },
  { id: '183', name: 'Syracuse Orange', abbreviation: 'SYR', conference: 'ACC', logo: getCollegeLogo('183') },
  { id: '103', name: 'Boston College Eagles', abbreviation: 'BC', conference: 'ACC', logo: getCollegeLogo('103') },
  { id: '59', name: 'Georgia Tech Yellow Jackets', abbreviation: 'GT', conference: 'ACC', logo: getCollegeLogo('59') },
  { id: '2567', name: 'SMU Mustangs', abbreviation: 'SMU', conference: 'ACC', logo: getCollegeLogo('2567') },
  { id: '25', name: 'California Golden Bears', abbreviation: 'CAL', conference: 'ACC', logo: getCollegeLogo('25') },
  { id: '2608', name: 'Stanford Cardinal', abbreviation: 'STAN', conference: 'ACC', logo: getCollegeLogo('2608') },
  // Big Ten
  { id: '130', name: 'Michigan Wolverines', abbreviation: 'MICH', conference: 'Big Ten', logo: getCollegeLogo('130') },
  { id: '194', name: 'Ohio State Buckeyes', abbreviation: 'OSU', conference: 'Big Ten', logo: getCollegeLogo('194') },
  { id: '213', name: 'Penn State Nittany Lions', abbreviation: 'PSU', conference: 'Big Ten', logo: getCollegeLogo('213') },
  { id: '127', name: 'Michigan State Spartans', abbreviation: 'MSU', conference: 'Big Ten', logo: getCollegeLogo('127') },
  { id: '275', name: 'Wisconsin Badgers', abbreviation: 'WIS', conference: 'Big Ten', logo: getCollegeLogo('275') },
  { id: '84', name: 'Indiana Hoosiers', abbreviation: 'IU', conference: 'Big Ten', logo: getCollegeLogo('84') },
  { id: '356', name: 'Illinois Fighting Illini', abbreviation: 'ILL', conference: 'Big Ten', logo: getCollegeLogo('356') },
  { id: '2294', name: 'Iowa Hawkeyes', abbreviation: 'IOWA', conference: 'Big Ten', logo: getCollegeLogo('2294') },
  { id: '135', name: 'Minnesota Golden Gophers', abbreviation: 'MINN', conference: 'Big Ten', logo: getCollegeLogo('135') },
  { id: '158', name: 'Nebraska Cornhuskers', abbreviation: 'NEB', conference: 'Big Ten', logo: getCollegeLogo('158') },
  { id: '77', name: 'Northwestern Wildcats', abbreviation: 'NU', conference: 'Big Ten', logo: getCollegeLogo('77') },
  { id: '2509', name: 'Purdue Boilermakers', abbreviation: 'PUR', conference: 'Big Ten', logo: getCollegeLogo('2509') },
  { id: '120', name: 'Maryland Terrapins', abbreviation: 'MD', conference: 'Big Ten', logo: getCollegeLogo('120') },
  { id: '164', name: 'Rutgers Scarlet Knights', abbreviation: 'RUTG', conference: 'Big Ten', logo: getCollegeLogo('164') },
  { id: '26', name: 'UCLA Bruins', abbreviation: 'UCLA', conference: 'Big Ten', logo: getCollegeLogo('26') },
  { id: '30', name: 'USC Trojans', abbreviation: 'USC', conference: 'Big Ten', logo: getCollegeLogo('30') },
  { id: '2483', name: 'Oregon Ducks', abbreviation: 'ORE', conference: 'Big Ten', logo: getCollegeLogo('2483') },
  { id: '264', name: 'Washington Huskies', abbreviation: 'WASH', conference: 'Big Ten', logo: getCollegeLogo('264') },
  // SEC
  { id: '333', name: 'Alabama Crimson Tide', abbreviation: 'ALA', conference: 'SEC', logo: getCollegeLogo('333') },
  { id: '61', name: 'Georgia Bulldogs', abbreviation: 'UGA', conference: 'SEC', logo: getCollegeLogo('61') },
  { id: '99', name: 'LSU Tigers', abbreviation: 'LSU', conference: 'SEC', logo: getCollegeLogo('99') },
  { id: '57', name: 'Florida Gators', abbreviation: 'FLA', conference: 'SEC', logo: getCollegeLogo('57') },
  { id: '2', name: 'Auburn Tigers', abbreviation: 'AUB', conference: 'SEC', logo: getCollegeLogo('2') },
  { id: '2633', name: 'Tennessee Volunteers', abbreviation: 'TENN', conference: 'SEC', logo: getCollegeLogo('2633') },
  { id: '245', name: 'Texas A&M Aggies', abbreviation: 'TAMU', conference: 'SEC', logo: getCollegeLogo('245') },
  { id: '142', name: 'Missouri Tigers', abbreviation: 'MIZ', conference: 'SEC', logo: getCollegeLogo('142') },
  { id: '8', name: 'Arkansas Razorbacks', abbreviation: 'ARK', conference: 'SEC', logo: getCollegeLogo('8') },
  { id: '96', name: 'Kentucky Wildcats', abbreviation: 'UK', conference: 'SEC', logo: getCollegeLogo('96') },
  { id: '344', name: 'Mississippi State Bulldogs', abbreviation: 'MSST', conference: 'SEC', logo: getCollegeLogo('344') },
  { id: '145', name: 'Ole Miss Rebels', abbreviation: 'MISS', conference: 'SEC', logo: getCollegeLogo('145') },
  { id: '2579', name: 'South Carolina Gamecocks', abbreviation: 'SC', conference: 'SEC', logo: getCollegeLogo('2579') },
  { id: '238', name: 'Vanderbilt Commodores', abbreviation: 'VAN', conference: 'SEC', logo: getCollegeLogo('238') },
  { id: '251', name: 'Texas Longhorns', abbreviation: 'TEX', conference: 'SEC', logo: getCollegeLogo('251') },
  { id: '201', name: 'Oklahoma Sooners', abbreviation: 'OU', conference: 'SEC', logo: getCollegeLogo('201') },
  // Big 12
  { id: '2305', name: 'Kansas Jayhawks', abbreviation: 'KU', conference: 'Big 12', logo: getCollegeLogo('2305') },
  { id: '2306', name: 'Kansas State Wildcats', abbreviation: 'KSU', conference: 'Big 12', logo: getCollegeLogo('2306') },
  { id: '239', name: 'Baylor Bears', abbreviation: 'BAY', conference: 'Big 12', logo: getCollegeLogo('239') },
  { id: '2628', name: 'TCU Horned Frogs', abbreviation: 'TCU', conference: 'Big 12', logo: getCollegeLogo('2628') },
  { id: '2641', name: 'Texas Tech Red Raiders', abbreviation: 'TTU', conference: 'Big 12', logo: getCollegeLogo('2641') },
  { id: '197', name: 'Oklahoma State Cowboys', abbreviation: 'OKST', conference: 'Big 12', logo: getCollegeLogo('197') },
  { id: '277', name: 'West Virginia Mountaineers', abbreviation: 'WVU', conference: 'Big 12', logo: getCollegeLogo('277') },
  { id: '66', name: 'Iowa State Cyclones', abbreviation: 'ISU', conference: 'Big 12', logo: getCollegeLogo('66') },
  { id: '2116', name: 'UCF Knights', abbreviation: 'UCF', conference: 'Big 12', logo: getCollegeLogo('2116') },
  { id: '2132', name: 'Cincinnati Bearcats', abbreviation: 'CIN', conference: 'Big 12', logo: getCollegeLogo('2132') },
  { id: '248', name: 'Houston Cougars', abbreviation: 'HOU', conference: 'Big 12', logo: getCollegeLogo('248') },
  { id: '252', name: 'BYU Cougars', abbreviation: 'BYU', conference: 'Big 12', logo: getCollegeLogo('252') },
  { id: '12', name: 'Arizona Wildcats', abbreviation: 'ARIZ', conference: 'Big 12', logo: getCollegeLogo('12') },
  { id: '9', name: 'Arizona State Sun Devils', abbreviation: 'ASU', conference: 'Big 12', logo: getCollegeLogo('9') },
  { id: '38', name: 'Colorado Buffaloes', abbreviation: 'COLO', conference: 'Big 12', logo: getCollegeLogo('38') },
  { id: '254', name: 'Utah Utes', abbreviation: 'UTAH', conference: 'Big 12', logo: getCollegeLogo('254') },
  // Independent
  { id: '87', name: 'Notre Dame Fighting Irish', abbreviation: 'ND', conference: 'Independent', logo: getCollegeLogo('87') },
];

export const F1_DRIVERS: SearchableF1Driver[] = [
  { id: '4665', name: 'Max Verstappen', team: 'Red Bull Racing', nationality: 'Netherlands', headshot: getF1Headshot('4665') },
  { id: '5579', name: 'Lando Norris', team: 'McLaren', nationality: 'United Kingdom', headshot: getF1Headshot('5579') },
  { id: '868', name: 'Lewis Hamilton', team: 'Ferrari', nationality: 'United Kingdom', headshot: getF1Headshot('868') },
  { id: '5498', name: 'Charles Leclerc', team: 'Ferrari', nationality: 'Monaco', headshot: getF1Headshot('5498') },
  { id: '4686', name: 'Carlos Sainz', team: 'Williams', nationality: 'Spain', headshot: getF1Headshot('4686') },
  { id: '5503', name: 'George Russell', team: 'Mercedes', nationality: 'United Kingdom', headshot: getF1Headshot('5503') },
  { id: '5752', name: 'Oscar Piastri', team: 'McLaren', nationality: 'Australia', headshot: getF1Headshot('5752') },
  { id: '348', name: 'Fernando Alonso', team: 'Aston Martin', nationality: 'Spain', headshot: getF1Headshot('348') },
  { id: '5501', name: 'Pierre Gasly', team: 'Alpine', nationality: 'France', headshot: getF1Headshot('5501') },
  { id: '5652', name: 'Yuki Tsunoda', team: 'Red Bull Racing', nationality: 'Japan', headshot: getF1Headshot('5652') },
  { id: '5592', name: 'Alexander Albon', team: 'Williams', nationality: 'Thailand', headshot: getF1Headshot('5592') },
  { id: '4775', name: 'Lance Stroll', team: 'Aston Martin', nationality: 'Canada', headshot: getF1Headshot('4775') },
  { id: '4678', name: 'Esteban Ocon', team: 'Haas', nationality: 'France', headshot: getF1Headshot('4678') },
  { id: '4396', name: 'Nico Hulkenberg', team: 'Sauber', nationality: 'Germany', headshot: getF1Headshot('4396') },
  { id: '5789', name: 'Oliver Bearman', team: 'Haas', nationality: 'United Kingdom', headshot: getF1Headshot('5789') },
  { id: '5829', name: 'Kimi Antonelli', team: 'Mercedes', nationality: 'Italy', headshot: getF1Headshot('5829') },
  { id: '5746', name: 'Jack Doohan', team: 'Alpine', nationality: 'Australia', headshot: getF1Headshot('5746') },
  { id: '5835', name: 'Gabriel Bortoleto', team: 'Sauber', nationality: 'Brazil', headshot: getF1Headshot('5835') },
  { id: '5790', name: 'Isack Hadjar', team: 'Red Bull Racing', nationality: 'France', headshot: getF1Headshot('5790') },
  { id: '5741', name: 'Liam Lawson', team: 'Red Bull Racing', nationality: 'New Zealand', headshot: getF1Headshot('5741') },
];

export const GOLFERS: SearchableGolfer[] = [
  { id: '1225', name: 'Scottie Scheffler', country: 'USA', headshot: getGolfHeadshot('1225') },
  { id: '10140', name: 'Xander Schauffele', country: 'USA', headshot: getGolfHeadshot('10140') },
  { id: '10592', name: 'Rory McIlroy', country: 'Northern Ireland', headshot: getGolfHeadshot('10592') },
  { id: '9780', name: 'Jon Rahm', country: 'Spain', headshot: getGolfHeadshot('9780') },
  { id: '9478', name: 'Collin Morikawa', country: 'USA', headshot: getGolfHeadshot('9478') },
  { id: '11119', name: 'Wyndham Clark', country: 'USA', headshot: getGolfHeadshot('11119') },
  { id: '4364873', name: 'Viktor Hovland', country: 'Norway', headshot: getGolfHeadshot('4364873') },
  { id: '6007', name: 'Patrick Cantlay', country: 'USA', headshot: getGolfHeadshot('6007') },
  { id: '9025', name: 'Ludvig Åberg', country: 'Sweden', headshot: getGolfHeadshot('9025') },
  { id: '10046', name: 'Bryson DeChambeau', country: 'USA', headshot: getGolfHeadshot('10046') },
  { id: '6798', name: 'Brooks Koepka', country: 'USA', headshot: getGolfHeadshot('6798') },
  { id: '4848', name: 'Justin Thomas', country: 'USA', headshot: getGolfHeadshot('4848') },
  { id: '5467', name: 'Jordan Spieth', country: 'USA', headshot: getGolfHeadshot('5467') },
  { id: '780', name: 'Tiger Woods', country: 'USA', headshot: getGolfHeadshot('780') },
  { id: '461', name: 'Phil Mickelson', country: 'USA', headshot: getGolfHeadshot('461') },
  { id: '5860', name: 'Tommy Fleetwood', country: 'England', headshot: getGolfHeadshot('5860') },
  { id: '10980', name: 'Sahith Theegala', country: 'USA', headshot: getGolfHeadshot('10980') },
  { id: '11382', name: 'Sungjae Im', country: 'South Korea', headshot: getGolfHeadshot('11382') },
  { id: '5500', name: 'Hideki Matsuyama', country: 'Japan', headshot: getGolfHeadshot('5500') },
  { id: '2230', name: 'Tony Finau', country: 'USA', headshot: getGolfHeadshot('2230') },
  { id: '3470', name: 'Dustin Johnson', country: 'USA', headshot: getGolfHeadshot('3470') },
  { id: '3702', name: 'Shane Lowry', country: 'Ireland', headshot: getGolfHeadshot('3702') },
  { id: '4425906', name: 'Cameron Young', country: 'USA', headshot: getGolfHeadshot('4425906') },
  { id: '11378', name: 'Robert MacIntyre', country: 'Scotland', headshot: getGolfHeadshot('11378') },
  { id: '4602673', name: 'Tom Kim', country: 'South Korea', headshot: getGolfHeadshot('4602673') },
];

export const UFC_FIGHTERS: SearchableUFCFighter[] = [
  { id: '3332412', name: 'Islam Makhachev', weightClass: 'Lightweight', country: 'Russia', headshot: getUFCHeadshot('3332412') },
  { id: '2335639', name: 'Jon Jones', weightClass: 'Heavyweight', country: 'USA', headshot: getUFCHeadshot('2335639') },
  { id: '4705658', name: 'Alex Pereira', weightClass: 'Light Heavyweight', country: 'Brazil', headshot: getUFCHeadshot('4705658') },
  { id: '3949584', name: 'Alexander Volkanovski', weightClass: 'Featherweight', country: 'Australia', headshot: getUFCHeadshot('3949584') },
  { id: '4350812', name: 'Ilia Topuria', weightClass: 'Featherweight', country: 'Spain', headshot: getUFCHeadshot('4350812') },
  { id: '4205093', name: 'Sean O\'Malley', weightClass: 'Bantamweight', country: 'USA', headshot: getUFCHeadshot('4205093') },
  { id: '3166126', name: 'Dricus du Plessis', weightClass: 'Middleweight', country: 'South Africa', headshot: getUFCHeadshot('3166126') },
  { id: '3152929', name: 'Leon Edwards', weightClass: 'Welterweight', country: 'United Kingdom', headshot: getUFCHeadshot('3152929') },
  { id: '3088812', name: 'Kamaru Usman', weightClass: 'Welterweight', country: 'Nigeria', headshot: getUFCHeadshot('3088812') },
  { id: '3093653', name: 'Sean Strickland', weightClass: 'Middleweight', country: 'USA', headshot: getUFCHeadshot('3093653') },
  { id: '3948572', name: 'Merab Dvalishvili', weightClass: 'Bantamweight', country: 'Georgia', headshot: getUFCHeadshot('3948572') },
  { id: '3022677', name: 'Conor McGregor', weightClass: 'Welterweight', country: 'Ireland', headshot: getUFCHeadshot('3022677') },
  { id: '2506549', name: 'Dustin Poirier', weightClass: 'Lightweight', country: 'USA', headshot: getUFCHeadshot('2506549') },
  { id: '3172112', name: 'Belal Muhammad', weightClass: 'Welterweight', country: 'USA', headshot: getUFCHeadshot('3172112') },
  { id: '2614933', name: 'Max Holloway', weightClass: 'Featherweight', country: 'USA', headshot: getUFCHeadshot('2614933') },
  { id: '2504169', name: 'Charles Oliveira', weightClass: 'Lightweight', country: 'Brazil', headshot: getUFCHeadshot('2504169') },
  { id: '3009717', name: 'Robert Whittaker', weightClass: 'Middleweight', country: 'Australia', headshot: getUFCHeadshot('3009717') },
  { id: '4426000', name: 'Ciryl Gane', weightClass: 'Heavyweight', country: 'France', headshot: getUFCHeadshot('4426000') },
  { id: '2554705', name: 'Valentina Shevchenko', weightClass: 'Flyweight', country: 'Kyrgyzstan', headshot: getUFCHeadshot('2554705') },
  { id: '2516131', name: 'Amanda Nunes', weightClass: 'Bantamweight', country: 'Brazil', headshot: getUFCHeadshot('2516131') },
];

// Competition emblem URLs from API-Football
const LEAGUE_LOGOS: Record<string, string> = {
  'PD': 'https://media.api-sports.io/football/leagues/140.png',
  'PL': 'https://media.api-sports.io/football/leagues/39.png',
  'SA': 'https://media.api-sports.io/football/leagues/135.png',
  'BL1': 'https://media.api-sports.io/football/leagues/78.png',
  'FL1': 'https://media.api-sports.io/football/leagues/61.png',
  'ELC': 'https://media.api-sports.io/football/leagues/40.png',
  'DED': 'https://media.api-sports.io/football/leagues/88.png',
  'PPL': 'https://media.api-sports.io/football/leagues/94.png',
  'BSA': 'https://media.api-sports.io/football/leagues/71.png',
  'CL': 'https://media.api-sports.io/football/leagues/2.png',
  'CLI': 'https://media.api-sports.io/football/leagues/13.png',
};

// Major leagues
export const LEAGUES: SearchableLeague[] = [
  { id: 'laliga', name: 'La Liga', code: 'PD', country: 'Spain', logo: LEAGUE_LOGOS['PD'] },
  { id: 'premier', name: 'Premier League', code: 'PL', country: 'England', logo: LEAGUE_LOGOS['PL'] },
  { id: 'seriea', name: 'Serie A', code: 'SA', country: 'Italy', logo: LEAGUE_LOGOS['SA'] },
  { id: 'bundesliga', name: 'Bundesliga', code: 'BL1', country: 'Germany', logo: LEAGUE_LOGOS['BL1'] },
  { id: 'ligue1', name: 'Ligue 1', code: 'FL1', country: 'France', logo: LEAGUE_LOGOS['FL1'] },
  { id: 'championship', name: 'Championship', code: 'ELC', country: 'England', logo: LEAGUE_LOGOS['ELC'] },
  { id: 'eredivisie', name: 'Eredivisie', code: 'DED', country: 'Netherlands', logo: LEAGUE_LOGOS['DED'] },
  { id: 'primeiraliga', name: 'Primeira Liga', code: 'PPL', country: 'Portugal', logo: LEAGUE_LOGOS['PPL'] },
  { id: 'brasileirao', name: 'Brasileirão', code: 'BSA', country: 'Brazil', logo: LEAGUE_LOGOS['BSA'] },
  { id: 'championsleague', name: 'Champions League', code: 'CL', country: 'Europe', logo: LEAGUE_LOGOS['CL'] },
  { id: 'copalibertadores', name: 'Copa Libertadores', code: 'CLI', country: 'South America', logo: LEAGUE_LOGOS['CLI'] },
];

// Export for use elsewhere
export { LEAGUE_LOGOS };

// Major teams from top leagues (API-Football IDs)
export const TEAMS: SearchableTeam[] = [
  // Spain - La Liga
  { id: 541, name: 'Real Madrid', shortName: 'RMA', league: 'La Liga', leagueCode: 'PD', logo: getLogo(541) },
  { id: 529, name: 'FC Barcelona', shortName: 'BAR', league: 'La Liga', leagueCode: 'PD', logo: getLogo(529) },
  { id: 530, name: 'Atlético Madrid', shortName: 'ATM', league: 'La Liga', leagueCode: 'PD', logo: getLogo(530) },
  { id: 536, name: 'Sevilla FC', shortName: 'SEV', league: 'La Liga', leagueCode: 'PD', logo: getLogo(536) },
  { id: 548, name: 'Real Sociedad', shortName: 'RSO', league: 'La Liga', leagueCode: 'PD', logo: getLogo(548) },
  { id: 543, name: 'Real Betis', shortName: 'BET', league: 'La Liga', leagueCode: 'PD', logo: getLogo(543) },
  { id: 533, name: 'Villarreal CF', shortName: 'VIL', league: 'La Liga', leagueCode: 'PD', logo: getLogo(533) },
  { id: 531, name: 'Athletic Club', shortName: 'ATH', league: 'La Liga', leagueCode: 'PD', logo: getLogo(531) },
  { id: 532, name: 'Valencia CF', shortName: 'VAL', league: 'La Liga', leagueCode: 'PD', logo: getLogo(532) },
  { id: 798, name: 'RCD Mallorca', shortName: 'MLL', league: 'La Liga', leagueCode: 'PD', logo: getLogo(798) },
  { id: 546, name: 'Getafe CF', shortName: 'GET', league: 'La Liga', leagueCode: 'PD', logo: getLogo(546) },
  { id: 727, name: 'CA Osasuna', shortName: 'OSA', league: 'La Liga', leagueCode: 'PD', logo: getLogo(727) },
  { id: 542, name: 'Deportivo Alavés', shortName: 'ALA', league: 'La Liga', leagueCode: 'PD', logo: getLogo(542) },
  { id: 534, name: 'UD Las Palmas', shortName: 'LPA', league: 'La Liga', leagueCode: 'PD', logo: getLogo(534) },
  { id: 720, name: 'Real Valladolid', shortName: 'VLL', league: 'La Liga', leagueCode: 'PD', logo: getLogo(720) },
  { id: 538, name: 'Celta Vigo', shortName: 'CEL', league: 'La Liga', leagueCode: 'PD', logo: getLogo(538) },
  { id: 547, name: 'Girona FC', shortName: 'GIR', league: 'La Liga', leagueCode: 'PD', logo: getLogo(547) },
  { id: 728, name: 'Rayo Vallecano', shortName: 'RAY', league: 'La Liga', leagueCode: 'PD', logo: getLogo(728) },
  { id: 540, name: 'RCD Espanyol', shortName: 'ESP', league: 'La Liga', leagueCode: 'PD', logo: getLogo(540) },
  { id: 539, name: 'CD Leganés', shortName: 'LEG', league: 'La Liga', leagueCode: 'PD', logo: getLogo(539) },

  // England - Premier League
  { id: 50, name: 'Manchester City', shortName: 'MCI', league: 'Premier League', leagueCode: 'PL', logo: getLogo(50) },
  { id: 42, name: 'Arsenal', shortName: 'ARS', league: 'Premier League', leagueCode: 'PL', logo: getLogo(42) },
  { id: 40, name: 'Liverpool', shortName: 'LIV', league: 'Premier League', leagueCode: 'PL', logo: getLogo(40) },
  { id: 33, name: 'Manchester United', shortName: 'MUN', league: 'Premier League', leagueCode: 'PL', logo: getLogo(33) },
  { id: 49, name: 'Chelsea', shortName: 'CHE', league: 'Premier League', leagueCode: 'PL', logo: getLogo(49) },
  { id: 47, name: 'Tottenham Hotspur', shortName: 'TOT', league: 'Premier League', leagueCode: 'PL', logo: getLogo(47) },
  { id: 66, name: 'Aston Villa', shortName: 'AVL', league: 'Premier League', leagueCode: 'PL', logo: getLogo(66) },
  { id: 34, name: 'Newcastle United', shortName: 'NEW', league: 'Premier League', leagueCode: 'PL', logo: getLogo(34) },
  { id: 51, name: 'Brighton & Hove Albion', shortName: 'BHA', league: 'Premier League', leagueCode: 'PL', logo: getLogo(51) },
  { id: 39, name: 'Wolverhampton', shortName: 'WOL', league: 'Premier League', leagueCode: 'PL', logo: getLogo(39) },
  { id: 36, name: 'Fulham', shortName: 'FUL', league: 'Premier League', leagueCode: 'PL', logo: getLogo(36) },
  { id: 52, name: 'Crystal Palace', shortName: 'CRY', league: 'Premier League', leagueCode: 'PL', logo: getLogo(52) },
  { id: 55, name: 'Brentford', shortName: 'BRE', league: 'Premier League', leagueCode: 'PL', logo: getLogo(55) },
  { id: 45, name: 'Everton', shortName: 'EVE', league: 'Premier League', leagueCode: 'PL', logo: getLogo(45) },
  { id: 65, name: 'Nottingham Forest', shortName: 'NFO', league: 'Premier League', leagueCode: 'PL', logo: getLogo(65) },
  { id: 48, name: 'West Ham United', shortName: 'WHU', league: 'Premier League', leagueCode: 'PL', logo: getLogo(48) },
  { id: 35, name: 'AFC Bournemouth', shortName: 'BOU', league: 'Premier League', leagueCode: 'PL', logo: getLogo(35) },
  { id: 46, name: 'Leicester City', shortName: 'LEI', league: 'Premier League', leagueCode: 'PL', logo: getLogo(46) },
  { id: 41, name: 'Southampton', shortName: 'SOU', league: 'Premier League', leagueCode: 'PL', logo: getLogo(41) },
  { id: 57, name: 'Ipswich Town', shortName: 'IPS', league: 'Premier League', leagueCode: 'PL', logo: getLogo(57) },

  // Germany - Bundesliga
  { id: 157, name: 'Bayern München', shortName: 'FCB', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(157) },
  { id: 165, name: 'Borussia Dortmund', shortName: 'BVB', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(165) },
  { id: 173, name: 'RB Leipzig', shortName: 'RBL', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(173) },
  { id: 168, name: 'Bayer Leverkusen', shortName: 'B04', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(168) },
  { id: 169, name: 'Eintracht Frankfurt', shortName: 'SGE', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(169) },
  { id: 161, name: 'VfL Wolfsburg', shortName: 'WOB', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(161) },
  { id: 163, name: 'Borussia Mönchengladbach', shortName: 'BMG', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(163) },
  { id: 172, name: 'VfB Stuttgart', shortName: 'VFB', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(172) },
  { id: 160, name: 'SC Freiburg', shortName: 'SCF', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(160) },
  { id: 167, name: 'TSG Hoffenheim', shortName: 'TSG', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(167) },
  { id: 162, name: 'Werder Bremen', shortName: 'SVW', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(162) },
  { id: 192, name: 'FC Köln', shortName: 'KOE', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(192) },
  { id: 182, name: '1. FC Union Berlin', shortName: 'FCU', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(182) },
  { id: 170, name: 'FC Augsburg', shortName: 'FCA', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(170) },
  { id: 180, name: '1. FC Heidenheim', shortName: 'HDH', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(180) },
  { id: 164, name: 'Mainz 05', shortName: 'M05', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(164) },
  { id: 159, name: 'Hertha BSC', shortName: 'BSC', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(159) },
  { id: 176, name: 'VfL Bochum', shortName: 'BOC', league: 'Bundesliga', leagueCode: 'BL1', logo: getLogo(176) },

  // Italy - Serie A
  { id: 496, name: 'Juventus', shortName: 'JUV', league: 'Serie A', leagueCode: 'SA', logo: getLogo(496) },
  { id: 505, name: 'Inter Milan', shortName: 'INT', league: 'Serie A', leagueCode: 'SA', logo: getLogo(505) },
  { id: 489, name: 'AC Milan', shortName: 'MIL', league: 'Serie A', leagueCode: 'SA', logo: getLogo(489) },
  { id: 492, name: 'Napoli', shortName: 'NAP', league: 'Serie A', leagueCode: 'SA', logo: getLogo(492) },
  { id: 497, name: 'AS Roma', shortName: 'ROM', league: 'Serie A', leagueCode: 'SA', logo: getLogo(497) },
  { id: 487, name: 'Lazio', shortName: 'LAZ', league: 'Serie A', leagueCode: 'SA', logo: getLogo(487) },
  { id: 502, name: 'Fiorentina', shortName: 'FIO', league: 'Serie A', leagueCode: 'SA', logo: getLogo(502) },
  { id: 499, name: 'Atalanta', shortName: 'ATA', league: 'Serie A', leagueCode: 'SA', logo: getLogo(499) },
  { id: 500, name: 'Bologna', shortName: 'BOL', league: 'Serie A', leagueCode: 'SA', logo: getLogo(500) },
  { id: 503, name: 'Torino', shortName: 'TOR', league: 'Serie A', leagueCode: 'SA', logo: getLogo(503) },
  { id: 494, name: 'Udinese', shortName: 'UDI', league: 'Serie A', leagueCode: 'SA', logo: getLogo(494) },
  { id: 488, name: 'Sassuolo', shortName: 'SAS', league: 'Serie A', leagueCode: 'SA', logo: getLogo(488) },
  { id: 511, name: 'Empoli', shortName: 'EMP', league: 'Serie A', leagueCode: 'SA', logo: getLogo(511) },
  { id: 504, name: 'Hellas Verona', shortName: 'VER', league: 'Serie A', leagueCode: 'SA', logo: getLogo(504) },
  { id: 1579, name: 'Monza', shortName: 'MON', league: 'Serie A', leagueCode: 'SA', logo: getLogo(1579) },
  { id: 495, name: 'Genoa', shortName: 'GEN', league: 'Serie A', leagueCode: 'SA', logo: getLogo(495) },
  { id: 490, name: 'Cagliari', shortName: 'CAG', league: 'Serie A', leagueCode: 'SA', logo: getLogo(490) },
  { id: 867, name: 'Lecce', shortName: 'LEC', league: 'Serie A', leagueCode: 'SA', logo: getLogo(867) },
  { id: 517, name: 'Venezia', shortName: 'VEN', league: 'Serie A', leagueCode: 'SA', logo: getLogo(517) },
  { id: 523, name: 'Parma', shortName: 'PAR', league: 'Serie A', leagueCode: 'SA', logo: getLogo(523) },
  { id: 895, name: 'Como', shortName: 'COM', league: 'Serie A', leagueCode: 'SA', logo: getLogo(895) },

  // France - Ligue 1
  { id: 85, name: 'Paris Saint-Germain', shortName: 'PSG', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(85) },
  { id: 81, name: 'Marseille', shortName: 'OM', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(81) },
  { id: 80, name: 'Lyon', shortName: 'OL', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(80) },
  { id: 91, name: 'Monaco', shortName: 'ASM', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(91) },
  { id: 79, name: 'Lille', shortName: 'LIL', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(79) },
  { id: 94, name: 'Rennes', shortName: 'REN', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(94) },
  { id: 84, name: 'Nice', shortName: 'NIC', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(84) },
  { id: 116, name: 'Lens', shortName: 'RCL', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(116) },
  { id: 82, name: 'Montpellier', shortName: 'MTP', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(82) },
  { id: 96, name: 'Toulouse', shortName: 'TFC', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(96) },
  { id: 83, name: 'Nantes', shortName: 'NAN', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(83) },
  { id: 106, name: 'Brest', shortName: 'BRE', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(106) },
  { id: 95, name: 'Strasbourg', shortName: 'RCS', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(95) },
  { id: 93, name: 'Reims', shortName: 'REI', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(93) },
  { id: 108, name: 'Auxerre', shortName: 'AUX', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(108) },
  { id: 77, name: 'Angers', shortName: 'ANG', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(77) },
  { id: 111, name: 'Le Havre', shortName: 'HAC', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(111) },
  { id: 1063, name: 'Saint-Étienne', shortName: 'STE', league: 'Ligue 1', leagueCode: 'FL1', logo: getLogo(1063) },
];

// Search function
export function searchAll(query: string): {
  teams: SearchableTeam[];
  leagues: SearchableSoccerLeague[];
  americanLeagues: SearchableAmericanLeague[];
  mlbTeams: SearchableMLBTeam[];
  nbaTeams: SearchableNBATeam[];
  nflTeams: SearchableNFLTeam[];
  nhlTeams: SearchableNHLTeam[];
  collegeBasketballTeams: SearchableCollegeBasketballTeam[];
  collegeFootballTeams: SearchableCollegeFootballTeam[];
  conferences: SearchableConference[];
  soccerLeagues: SearchableSoccerLeague[];
  f1Drivers: SearchableF1Driver[];
  golfers: SearchableGolfer[];
  ufcFighters: SearchableUFCFighter[];
} {
  const q = query.toLowerCase().trim();
  if (!q) return {
    teams: [],
    leagues: [],
    americanLeagues: [],
    mlbTeams: [],
    nbaTeams: [],
    nflTeams: [],
    nhlTeams: [],
    collegeBasketballTeams: [],
    collegeFootballTeams: [],
    conferences: [],
    soccerLeagues: [],
    f1Drivers: [],
    golfers: [],
    ufcFighters: [],
  };

  const teams = TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.shortName.toLowerCase().includes(q) ||
      t.league.toLowerCase().includes(q)
  ).slice(0, 10);

  const leagues = SEARCHABLE_SOCCER_LEAGUES.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.shortName.toLowerCase().includes(q) ||
      l.country.toLowerCase().includes(q)
  ).slice(0, 10);

  const mlbTeams = MLB_TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q)
  ).slice(0, 10);

  const nbaTeams = NBA_TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q)
  ).slice(0, 10);

  const nflTeams = NFL_TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q)
  ).slice(0, 10);

  const nhlTeams = NHL_TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q)
  ).slice(0, 10);

  const collegeBasketballTeams = COLLEGE_BASKETBALL_TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q) ||
      t.conference.toLowerCase().includes(q)
  ).slice(0, 10);

  const collegeFootballTeams = COLLEGE_FOOTBALL_TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q) ||
      t.conference.toLowerCase().includes(q)
  ).slice(0, 10);

  const conferences = SEARCHABLE_CONFERENCES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q)
  ).slice(0, 10);

  const soccerLeagues = SEARCHABLE_SOCCER_LEAGUES.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.shortName.toLowerCase().includes(q) ||
      l.country.toLowerCase().includes(q)
  ).slice(0, 10);

  const americanLeagues = AMERICAN_LEAGUES.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.shortName.toLowerCase().includes(q) ||
      l.sport.toLowerCase().includes(q)
  );

  const f1Drivers = F1_DRIVERS.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.team.toLowerCase().includes(q) ||
      d.nationality.toLowerCase().includes(q)
  ).slice(0, 10);

  const golfers = GOLFERS.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      g.country.toLowerCase().includes(q)
  ).slice(0, 10);

  const ufcFighters = UFC_FIGHTERS.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.weightClass.toLowerCase().includes(q) ||
      f.country.toLowerCase().includes(q)
  ).slice(0, 10);

  return { teams, leagues, americanLeagues, mlbTeams, nbaTeams, nflTeams, nhlTeams, collegeBasketballTeams, collegeFootballTeams, conferences, soccerLeagues, f1Drivers, golfers, ufcFighters };
}
