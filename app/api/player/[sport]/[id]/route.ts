import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Sport param → ESPN API path mapping
const SPORT_MAP: Record<string, { sport: string; league: string }> = {
  nba: { sport: 'basketball', league: 'nba' },
  nfl: { sport: 'football', league: 'nfl' },
  mlb: { sport: 'baseball', league: 'mlb' },
  nhl: { sport: 'hockey', league: 'nhl' },
  ncaab: { sport: 'basketball', league: 'mens-college-basketball' },
  cfb: { sport: 'football', league: 'college-football' },
  soccer: { sport: 'soccer', league: 'soccer' },
  f1: { sport: 'racing', league: 'f1' },
  golf: { sport: 'golf', league: 'pga' },
  ufc: { sport: 'mma', league: 'ufc' },
};

interface PlayerData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  jersey: string | null;
  position: string;
  team: { id: string; name: string; abbreviation: string; logo: string; color: string } | null;
  headshot: string;
  height: string;
  weight: string;
  age: number | null;
  birthDate: string | null;
  birthPlace: string;
  nationality: string;
  experience: number | null;
  college: string | null;
  draft: string | null;
  sport: string;
  currentStats: Record<string, string | number> | null;
  careerStats: Array<{ season: string; stats: Record<string, string | number> }> | null;
  statLabels: string[] | null;
  extras: Record<string, any>;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sport: string; id: string }> }
) {
  try {
    const { sport, id } = await params;

    if (!sport || !id) {
      return NextResponse.json({ error: 'Sport and player ID are required' }, { status: 400 });
    }

    const mapping = SPORT_MAP[sport.toLowerCase()];
    if (!mapping) {
      return NextResponse.json({ error: `Unknown sport: ${sport}` }, { status: 400 });
    }

    const bioUrl = `https://site.web.api.espn.com/apis/common/v3/sports/${mapping.sport}/${mapping.league}/athletes/${id}`;
    const statsUrl = `https://site.web.api.espn.com/apis/common/v3/sports/${mapping.sport}/${mapping.league}/athletes/${id}/stats`;

    // Fetch bio and stats in parallel
    const [bioResult, statsResult] = await Promise.allSettled([
      fetchWithTimeout(bioUrl),
      fetchWithTimeout(statsUrl),
    ]);

    // Bio is required
    if (bioResult.status === 'rejected' || !bioResult.value.ok) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const bio = await bioResult.value.json();

    // Stats are optional
    let statsData: any = null;
    if (statsResult.status === 'fulfilled' && statsResult.value.ok) {
      try {
        statsData = await statsResult.value.json();
      } catch {
        // stats parsing failed, continue with null
      }
    }

    const player = normalizePlayer(bio, statsData, sport);

    const response = NextResponse.json(player);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return response;
  } catch (error) {
    console.error('[API/Player] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePlayer(bio: any, statsData: any, sport: string): PlayerData {
  const athlete = bio.athlete || bio;

  // Team extraction — varies by sport
  let team: PlayerData['team'] = null;
  const teamData = athlete.team;
  if (teamData) {
    team = {
      id: teamData.id || '',
      name: teamData.displayName || teamData.name || '',
      abbreviation: teamData.abbreviation || '',
      logo: teamData.logos?.[0]?.href || teamData.logo || '',
      color: teamData.color || '',
    };
  }

  // Birth place
  const birthPlace = athlete.birthPlace;
  const birthPlaceStr = birthPlace
    ? [birthPlace.city, birthPlace.state, birthPlace.country].filter(Boolean).join(', ')
    : athlete.displayBirthPlace || '';
  const nationality = birthPlace?.country || athlete.citizenship || '';

  // College / draft
  const college = athlete.college?.name || athlete.college?.shortName || null;
  const draftInfo = athlete.draft;
  const draft = draftInfo
    ? `${draftInfo.year || ''} R${draftInfo.round || '?'} Pick ${draftInfo.selection || '?'}${draftInfo.team?.name ? ` - ${draftInfo.team.name}` : ''}`
    : null;

  // Extras — sport-specific fields
  const extras: Record<string, any> = {};

  // F1: constructor
  if (sport === 'f1') {
    if (athlete.team?.name) extras.constructorName = athlete.team.name;
    if (athlete.flag?.href) extras.flagUrl = athlete.flag.href;
  }

  // UFC: reach, stance, record
  if (sport === 'ufc') {
    if (athlete.reach) extras.reach = athlete.reach;
    if (athlete.stance) extras.stance = athlete.stance;
  }

  // Golf: world ranking
  if (sport === 'golf') {
    if (athlete.rank) extras.worldRanking = athlete.rank;
  }

  // Country flag
  if (athlete.flag?.href) {
    extras.flagUrl = athlete.flag.href;
  } else if (nationality) {
    extras.flagUrl = `https://a.espncdn.com/i/teamlogos/countries/500/${nationality.toLowerCase().replace(/\s+/g, '-')}.png`;
  }

  // Parse stats
  const { currentStats, careerStats, statLabels } = parseStats(statsData, sport);

  return {
    id: athlete.id || '',
    name: athlete.displayName || athlete.fullName || '',
    firstName: athlete.firstName || '',
    lastName: athlete.lastName || '',
    jersey: athlete.jersey || null,
    position: athlete.position?.displayName || athlete.position?.abbreviation || athlete.position?.name || '',
    team,
    headshot: athlete.headshot?.href || '',
    height: athlete.displayHeight || '',
    weight: athlete.displayWeight || '',
    age: athlete.age || null,
    birthDate: athlete.dateOfBirth || null,
    birthPlace: birthPlaceStr,
    nationality,
    experience: athlete.experience?.years ?? null,
    college,
    draft,
    sport,
    currentStats,
    careerStats,
    statLabels,
    extras,
  };
}

function parseStats(
  statsData: any,
  sport: string
): {
  currentStats: Record<string, string | number> | null;
  careerStats: Array<{ season: string; stats: Record<string, string | number> }> | null;
  statLabels: string[] | null;
} {
  if (!statsData?.categories || !Array.isArray(statsData.categories)) {
    return { currentStats: null, careerStats: null, statLabels: null };
  }

  // Pick the primary category based on sport
  const categories = statsData.categories;
  let primaryCategory = categories[0];

  // Sport-specific category selection
  if (sport === 'nba' || sport === 'ncaab') {
    primaryCategory = categories.find((c: any) => c.name === 'averages') || categories[0];
  } else if (sport === 'mlb') {
    // Prefer batting, but fall back to pitching for pitchers
    primaryCategory = categories.find((c: any) =>
      c.name === 'batting' || c.displayName?.toLowerCase().includes('batting')
    ) || categories.find((c: any) =>
      c.name === 'pitching' || c.displayName?.toLowerCase().includes('pitching')
    ) || categories[0];
  } else if (sport === 'nhl') {
    // Prefer skating, fall back to goaltending
    primaryCategory = categories.find((c: any) =>
      c.name === 'skating' || c.displayName?.toLowerCase().includes('skating')
    ) || categories.find((c: any) =>
      c.name === 'goaltending' || c.displayName?.toLowerCase().includes('goaltending')
    ) || categories[0];
  }

  if (!primaryCategory?.statistics?.length || !primaryCategory?.labels?.length) {
    return { currentStats: null, careerStats: null, statLabels: null };
  }

  const labels: string[] = primaryCategory.labels;
  const seasons = primaryCategory.statistics;

  // Build career stats
  const careerStats: Array<{ season: string; stats: Record<string, string | number> }> = [];
  for (const season of seasons) {
    const statValues = season.stats || [];
    const statsMap: Record<string, string | number> = {};
    labels.forEach((label: string, idx: number) => {
      if (idx < statValues.length) {
        statsMap[label] = statValues[idx];
      }
    });
    careerStats.push({
      season: season.season?.displayName || season.displayName || `Season ${careerStats.length + 1}`,
      stats: statsMap,
    });
  }

  // Current stats = last season
  const currentSeason = seasons[seasons.length - 1];
  const currentStatValues = currentSeason?.stats || [];
  const currentStats: Record<string, string | number> = {};
  labels.forEach((label: string, idx: number) => {
    if (idx < currentStatValues.length) {
      currentStats[label] = currentStatValues[idx];
    }
  });

  // For MLB, also include pitching stats as extras if the player has both
  if (sport === 'mlb') {
    const battingCat = categories.find((c: any) => c.name === 'batting');
    const pitchingCat = categories.find((c: any) => c.name === 'pitching');

    if (battingCat && pitchingCat && battingCat.statistics?.length && pitchingCat.statistics?.length) {
      // Add pitching current stats with a prefix
      const pitchLabels = pitchingCat.labels || [];
      const pitchCurrentSeason = pitchingCat.statistics[pitchingCat.statistics.length - 1];
      const pitchStats = pitchCurrentSeason?.stats || [];
      pitchLabels.forEach((label: string, idx: number) => {
        if (idx < pitchStats.length) {
          currentStats[`P_${label}`] = pitchStats[idx];
        }
      });
    }
  }

  return { currentStats, careerStats, statLabels: labels };
}
