// Polymarket API integration for match odds

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

// Map our league codes to Polymarket series IDs
const LEAGUE_TO_SERIES_ID: Record<string, number> = {
  // Main European leagues
  'PL': 10188,      // Premier League
  'PD': 10193,      // La Liga
  'SA': 10203,      // Serie A
  'BL1': 10194,     // Bundesliga
  'FL1': 10195,     // Ligue 1
  // European competitions
  'CL': 10204,      // Champions League
  'EL': 10209,      // Europa League
  'ECL': 10437,     // Conference League
  // Other competitions
  'DED': 10286,     // Eredivisie
  'PPL': 10293,     // Primeira Liga
  'ELC': 10230,     // Championship (EFL)
  'BSA': 10285,     // Brasileirao/Argentine
  'CLI': 10289,     // Copa Libertadores
};

export interface PolymarketOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
  source: 'polymarket';
  lastUpdated: string;
  hasDraw: boolean;
}

// Sport types for US sports slug-based lookup
export type SportType = 'nba' | 'ncaab' | 'nfl' | 'mlb' | 'cfb';

const SPORT_SLUG_PREFIX: Record<SportType, string> = {
  nba: 'nba',
  ncaab: 'cbb',
  nfl: 'nfl',
  mlb: 'mlb',
  cfb: 'cfb',
};

// Series IDs for US sports (used as fallback when slug lookup fails)
const SPORT_SERIES_IDS: Record<SportType, number[]> = {
  nba: [10345, 2],          // NBA 2026, NBA
  ncaab: [10470],           // NCAA CBB
  nfl: [10187, 1],          // NFL 2025, NFL
  mlb: [10062],             // MLB Games
  cfb: [10210, 10002],      // CFB 2025, CFB
};

interface PolymarketMarket {
  id: string;
  question: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  liquidity: string;
}

interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  markets: PolymarketMarket[];
}

// Normalize team name for matching
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    // Normalize accented characters to ASCII equivalents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*fc\s*/gi, ' ')
    .replace(/\s*cf\s*/gi, ' ')
    .replace(/\s*sc\s*/gi, ' ')
    .replace(/\s*afc\s*/gi, ' ')
    .replace(/united/gi, 'utd')
    .replace(/city/gi, '')
    .replace(/hotspur/gi, '')
    .replace(/wanderers/gi, '')
    .replace(/athletic/gi, '')
    .replace(/atletico/gi, 'atletico')
    .replace(/munchen/gi, 'munich')
    .replace(/bayern munich/gi, 'bayern')
    .replace(/borussia dortmund/gi, 'dortmund')
    .replace(/borussia monchengladbach/gi, 'gladbach')
    .replace(/rb leipzig/gi, 'leipzig')
    .replace(/paris saint-germain/gi, 'psg')
    .replace(/olympique lyonnais/gi, 'lyon')
    .replace(/olympique marseille/gi, 'marseille')
    .replace(/as monaco/gi, 'monaco')
    .replace(/internazionale/gi, 'inter')
    .replace(/inter milan/gi, 'inter')
    .replace(/ac milan/gi, 'milan')
    .replace(/juventus/gi, 'juve')
    .replace(/real madrid/gi, 'real')
    .replace(/manchester/gi, 'man')
    .replace(/wolverhampton/gi, 'wolves')
    .replace(/nottingham forest/gi, 'forest')
    .replace(/newcastle united/gi, 'newcastle')
    .replace(/brighton.*hove/gi, 'brighton')
    .replace(/west ham united/gi, 'west ham')
    .replace(/crystal palace/gi, 'palace')
    .replace(/tottenham/gi, 'spurs')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if two team names match
function teamsMatch(name1: string, name2: string): boolean {
  const n1 = normalizeTeamName(name1);
  const n2 = normalizeTeamName(name2);

  // Direct match
  if (n1 === n2) return true;

  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Check if first word matches (e.g., "Arsenal" matches "Arsenal FC")
  const words1 = n1.split(' ').filter(w => w.length > 2);
  const words2 = n2.split(' ').filter(w => w.length > 2);

  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 && w1.length > 3) return true;
    }
  }

  return false;
}

export async function getMatchOdds(
  leagueCode: string,
  homeTeam: string,
  awayTeam: string,
  matchDate: string
): Promise<PolymarketOdds | null> {
  try {
    const seriesId = LEAGUE_TO_SERIES_ID[leagueCode];
    if (!seriesId) {
      return null;
    }

    // Fetch active events for this league
    const response = await fetch(
      `${GAMMA_API_BASE}/events?series_id=${seriesId}&active=true&closed=false&limit=50`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!response.ok) {
      return null;
    }

    const events: PolymarketEvent[] = await response.json();

    // Find matching event by team names
    const matchDateObj = new Date(matchDate);
    const matchDateStr = matchDateObj.toISOString().split('T')[0];

    for (const event of events) {
      // endDate is the actual match date, startDate is when market was created
      const eventDate = new Date(event.endDate).toISOString().split('T')[0];

      // Check if date matches (within 1 day tolerance for timezone issues)
      const dateDiff = Math.abs(new Date(eventDate).getTime() - new Date(matchDateStr).getTime());
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
      if (daysDiff > 1) continue;

      // Check if teams match in the event title
      const title = event.title.toLowerCase();
      const normalizedTitle = normalizeTeamName(event.title);
      const homeMatches = teamsMatch(homeTeam, title) || normalizedTitle.includes(normalizeTeamName(homeTeam));
      const awayMatches = teamsMatch(awayTeam, title) || normalizedTitle.includes(normalizeTeamName(awayTeam));

      if (homeMatches && awayMatches) {
        // Found the match! Extract odds from markets
        const markets = event.markets || [];

        let homeWin = 0;
        let draw = 0;
        let awayWin = 0;

        for (const market of markets) {
          const question = market.question.toLowerCase();
          const outcomes = JSON.parse(market.outcomes || '[]');
          const prices = JSON.parse(market.outcomePrices || '[]');

          // Find the "Yes" price for each outcome type
          const yesIndex = outcomes.findIndex((o: string) => o.toLowerCase() === 'yes');
          const yesPrice = yesIndex >= 0 ? parseFloat(prices[yesIndex]) : 0;

          if (teamsMatch(homeTeam, question) && question.includes('win')) {
            homeWin = yesPrice;
          } else if (question.includes('draw')) {
            draw = yesPrice;
          } else if (teamsMatch(awayTeam, question) && question.includes('win')) {
            awayWin = yesPrice;
          }
        }

        // If we found valid odds
        if (homeWin > 0 || draw > 0 || awayWin > 0) {
          // Normalize to ensure they sum to ~1 (handle rounding)
          const total = homeWin + draw + awayWin;
          if (total > 0) {
            return {
              homeWin: homeWin / total,
              draw: draw / total,
              awayWin: awayWin / total,
              source: 'polymarket',
              lastUpdated: new Date().toISOString(),
              hasDraw: true,
            };
          }
        }

        // Fallback: Try to extract from event-level outcome prices
        if (event.markets.length >= 3) {
          // Usually: market[0] = home win, market[1] = draw, market[2] = away win
          const sortedMarkets = [...event.markets].sort((a, b) => {
            const aQ = a.question.toLowerCase();
            const bQ = b.question.toLowerCase();
            if (aQ.includes('draw')) return 0;
            return aQ.localeCompare(bQ);
          });

          const getYesPrice = (m: PolymarketMarket) => {
            try {
              const prices = JSON.parse(m.outcomePrices || '[]');
              return parseFloat(prices[0]) || 0;
            } catch {
              return 0;
            }
          };

          // Try to identify which market is which
          for (const m of sortedMarkets) {
            const q = m.question.toLowerCase();
            const price = getYesPrice(m);
            if (q.includes('draw')) {
              draw = price;
            } else if (teamsMatch(homeTeam, q)) {
              homeWin = price;
            } else if (teamsMatch(awayTeam, q)) {
              awayWin = price;
            }
          }

          const total = homeWin + draw + awayWin;
          if (total > 0.5) { // Sanity check
            return {
              homeWin: homeWin / total,
              draw: draw / total,
              awayWin: awayWin / total,
              source: 'polymarket',
              lastUpdated: new Date().toISOString(),
              hasDraw: true,
            };
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Extract odds from a US sports event (single market with 2 outcomes)
function extractUSEventOdds(
  event: PolymarketEvent,
  homeTeamName: string,
  awayTeamName: string,
): PolymarketOdds | null {
  const markets = event.markets || [];
  if (!markets.length) return null;

  let homeWin = 0;
  let awayWin = 0;

  if (markets.length === 1) {
    const market = markets[0];
    const outcomes: string[] = JSON.parse(market.outcomes || '[]');
    const prices: string[] = JSON.parse(market.outcomePrices || '[]');

    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i].toLowerCase();
      const price = parseFloat(prices[i]) || 0;
      if (teamsMatch(outcome, homeTeamName)) {
        homeWin = price;
      } else if (teamsMatch(outcome, awayTeamName)) {
        awayWin = price;
      }
    }

    // If name matching failed, assign by position (away first, home second in slug)
    if (homeWin === 0 && awayWin === 0 && prices.length === 2) {
      awayWin = parseFloat(prices[0]) || 0;
      homeWin = parseFloat(prices[1]) || 0;
    }
  } else {
    for (const market of markets) {
      const question = market.question.toLowerCase();
      const outcomes: string[] = JSON.parse(market.outcomes || '[]');
      const prices: string[] = JSON.parse(market.outcomePrices || '[]');
      const yesIndex = outcomes.findIndex((o: string) => o.toLowerCase() === 'yes');
      const yesPrice = yesIndex >= 0 ? parseFloat(prices[yesIndex]) : 0;

      if (teamsMatch(question, homeTeamName)) {
        homeWin = yesPrice;
      } else if (teamsMatch(question, awayTeamName)) {
        awayWin = yesPrice;
      }
    }
  }

  const total = homeWin + awayWin;
  if (total > 0) {
    return {
      homeWin: homeWin / total,
      draw: 0,
      awayWin: awayWin / total,
      source: 'polymarket',
      lastUpdated: new Date().toISOString(),
      hasDraw: false,
    };
  }
  return null;
}

// Series-based fallback: search events by team name within a series
async function getGameOddsBySeries(
  sport: SportType,
  homeTeamName: string,
  awayTeamName: string,
  gameDate: string
): Promise<PolymarketOdds | null> {
  const seriesIds = SPORT_SERIES_IDS[sport];
  if (!seriesIds?.length) return null;

  const dateStr = new Date(gameDate).toISOString().split('T')[0];

  for (const seriesId of seriesIds) {
    try {
      const response = await fetch(
        `${GAMMA_API_BASE}/events?series_id=${seriesId}&active=true&closed=false&limit=200&order=endDate&ascending=false`,
        {
          next: { revalidate: 300 },
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) continue;

      const events: PolymarketEvent[] = await response.json();

      for (const event of events) {
        // Check date (within 1 day tolerance)
        const eventDate = new Date(event.endDate).toISOString().split('T')[0];
        const dateDiff = Math.abs(new Date(eventDate).getTime() - new Date(dateStr).getTime());
        if (dateDiff / (1000 * 60 * 60 * 24) > 1) continue;

        // Check if teams match in the event title
        const title = event.title;
        if (teamsMatch(title, homeTeamName) && teamsMatch(title, awayTeamName)) {
          const odds = extractUSEventOdds(event, homeTeamName, awayTeamName);
          if (odds) return odds;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

// US sports: slug-based lookup with series-based fallback
export async function getGameOddsBySlug(
  sport: SportType,
  awayAbbrev: string,
  homeAbbrev: string,
  gameDate: string,
  homeTeamName?: string,
  awayTeamName?: string,
): Promise<PolymarketOdds | null> {
  const prefix = SPORT_SLUG_PREFIX[sport];
  if (!prefix) return null;

  try {
    // Build slug: nba-hou-cha-2026-02-19
    const dateStr = new Date(gameDate).toISOString().split('T')[0];
    const slug = `${prefix}-${awayAbbrev.toLowerCase()}-${homeAbbrev.toLowerCase()}-${dateStr}`;

    const response = await fetch(
      `${GAMMA_API_BASE}/events?slug=${slug}`,
      {
        next: { revalidate: 300 },
        headers: { 'Accept': 'application/json' }
      }
    );

    if (response.ok) {
      const events: PolymarketEvent[] = await response.json();
      if (events.length) {
        const odds = extractUSEventOdds(
          events[0],
          homeTeamName || homeAbbrev,
          awayTeamName || awayAbbrev,
        );
        if (odds) return odds;
      }
    }
  } catch {
    // Fall through to series-based lookup
  }

  // Fallback: series-based team name matching
  if (homeTeamName && awayTeamName) {
    return getGameOddsBySeries(sport, homeTeamName, awayTeamName, gameDate);
  }

  return null;
}
