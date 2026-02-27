import { NextResponse } from 'next/server';
import { getCachedPlayer, writeCachedPlayer } from '@/lib/player-cache-helpers';

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

const F1_CONSTRUCTOR_COLORS: Record<string, string> = {
  'Red Bull Racing': '3671C6',
  'Ferrari': 'E8002D',
  'Mercedes': '27F4D2',
  'McLaren': 'FF8000',
  'Aston Martin': '229971',
  'Alpine': 'FF87BC',
  'Williams': '64C4FF',
  'RB': '6692FF',
  'Kick Sauber': '52E252',
  'Haas F1 Team': 'B6BABD',
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

    // Cache-first: return immediately if fresh
    const { player: cached, isFresh } = await getCachedPlayer(sport, id);
    if (cached && isFresh) {
      const response = NextResponse.json(cached);
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      return response;
    }

    // Soccer: use API-Football instead of ESPN
    if (sport.toLowerCase() === 'soccer') {
      const apiFootballKey = process.env.API_FOOTBALL_KEY;
      if (!apiFootballKey) {
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
      }

      // Fetch 5 seasons in parallel (European seasons labeled by start year)
      const currentYear = new Date().getFullYear();
      const seasonYears = [currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4, currentYear - 5];

      const seasonResults = await Promise.allSettled(
        seasonYears.map(year =>
          fetch(`https://v3.football.api-sports.io/players?id=${id}&season=${year}`, {
            headers: { 'x-apisports-key': apiFootballKey },
            next: { revalidate: 3600 },
          }).then(res => res.ok ? res.json() : null)
        )
      );

      // Collect seasons that returned data
      const seasonData: Array<{ seasonYear: number; player: any; statistics: any[] }> = [];
      for (let i = 0; i < seasonYears.length; i++) {
        const result = seasonResults[i];
        if (result.status === 'fulfilled' && result.value) {
          const entries = result.value?.response;
          if (entries?.length > 0 && entries[0].statistics?.length > 0) {
            seasonData.push({
              seasonYear: seasonYears[i],
              player: entries[0].player,
              statistics: entries[0].statistics,
            });
          }
        }
      }

      if (seasonData.length === 0) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      // Most recent season first (already sorted by seasonYears order)
      const mostRecent = seasonData[0];
      const p = mostRecent.player;
      const mostRecentStats = mostRecent.statistics;
      const primaryStats = mostRecentStats[0] || {};
      const teamInfo = primaryStats.team;

      // Helper: aggregate an array of competition stats into one row
      const aggregateSeason = (stats: any[]) => {
        const sumField = (getter: (s: any) => number | null | undefined): number | null => {
          let total: number | null = null;
          for (const s of stats) {
            const v = getter(s);
            if (v != null) total = (total ?? 0) + v;
          }
          return total;
        };

        const zeroIfNull = (v: number | null): number => v ?? 0;
        const dashIfNull = (v: number | null): string | number => v != null ? v : '-';

        // Weighted pass accuracy
        const totalPasses = sumField(s => s.passes?.total);
        let passAccuracy: string | number = '-';
        if (totalPasses != null && totalPasses > 0) {
          let accurateTotal = 0;
          let hasAny = false;
          for (const s of stats) {
            const acc = s.passes?.accuracy != null ? Number(s.passes.accuracy) : null;
            const tot = s.passes?.total;
            if (acc != null && !isNaN(acc) && tot != null) {
              hasAny = true;
              accurateTotal += Math.round((acc / 100) * tot);
            }
          }
          if (hasAny) {
            passAccuracy = `${Math.round((accurateTotal / totalPasses) * 100)}%`;
          }
        }

        // Dribble success rate
        const drbAttempts = sumField(s => s.dribbles?.attempts);
        const drbSuccess = sumField(s => s.dribbles?.success);
        const drbPct: string | number = (drbAttempts != null && drbAttempts > 0 && drbSuccess != null)
          ? `${Math.round((drbSuccess / drbAttempts) * 100)}%`
          : '-';

        return {
          APP: dashIfNull(sumField(s => s.games?.appearences)),
          GS: dashIfNull(sumField(s => s.games?.lineups)),
          MIN: dashIfNull(sumField(s => s.games?.minutes)),
          G: zeroIfNull(sumField(s => s.goals?.total)),
          A: zeroIfNull(sumField(s => s.goals?.assists)),
          SH: dashIfNull(sumField(s => s.shots?.total)),
          SOT: dashIfNull(sumField(s => s.shots?.on)),
          PAS: dashIfNull(totalPasses),
          KP: dashIfNull(sumField(s => s.passes?.key)),
          'PAS%': passAccuracy,
          TKL: dashIfNull(sumField(s => s.tackles?.total)),
          INT: dashIfNull(sumField(s => s.tackles?.interceptions)),
          DRB: dashIfNull(drbAttempts),
          'DRB%': drbPct,
          FC: dashIfNull(sumField(s => s.fouls?.committed)),
          YC: zeroIfNull(sumField(s => s.cards?.yellow)),
          RC: zeroIfNull(sumField(s => s.cards?.red)),
        };
      };

      // Build career stats: one aggregated row per season, newest first
      const careerStats = seasonData.map(sd => {
        const teamName = sd.statistics[0]?.team?.name || '';
        const aggregated = aggregateSeason(sd.statistics);
        return {
          season: `${sd.seasonYear}-${String(sd.seasonYear + 1).slice(-2)}${teamName ? ` (${teamName})` : ''}`,
          stats: aggregated as Record<string, string | number>,
        };
      });

      // currentStats = aggregated most recent season
      const currentStats = aggregateSeason(mostRecentStats) as Record<string, string | number>;

      const statLabels = ['APP', 'GS', 'MIN', 'G', 'A', 'SH', 'SOT', 'PAS', 'KP', 'PAS%', 'TKL', 'INT', 'DRB', 'DRB%', 'FC', 'YC', 'RC'];

      const soccerPlayer: PlayerData = {
        id: String(p.id),
        name: `${p.firstname} ${p.lastname}`,
        firstName: p.firstname || '',
        lastName: p.lastname || '',
        jersey: null,
        position: primaryStats.games?.position || '',
        team: teamInfo ? {
          id: String(teamInfo.id),
          name: teamInfo.name || '',
          abbreviation: teamInfo.name || '',
          logo: teamInfo.logo || '',
          color: '',
        } : null,
        headshot: p.photo || '',
        height: p.height || '',
        weight: p.weight || '',
        age: p.age || null,
        birthDate: p.birth?.date || null,
        birthPlace: [p.birth?.place, p.birth?.country].filter(Boolean).join(', '),
        nationality: p.nationality || '',
        experience: null,
        college: null,
        draft: null,
        sport: 'soccer',
        currentStats,
        careerStats,
        statLabels,
        extras: {
          flagUrl: p.nationality ? `https://a.espncdn.com/i/teamlogos/countries/500/${p.nationality.toLowerCase().replace(/\s+/g, '-')}.png` : undefined,
        },
      };

      writeCachedPlayer(sport, id, soccerPlayer);

      const response = NextResponse.json(soccerPlayer);
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      return response;
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

    // For F1: fetch standings to get constructor/team info
    let f1Team: { name: string } | undefined;
    if (sport === 'f1') {
      try {
        const standingsRes = await fetchWithTimeout(
          'https://site.web.api.espn.com/apis/v2/sports/racing/f1/standings'
        );
        if (standingsRes.ok) {
          const standingsData = await standingsRes.json();
          const entries = standingsData?.children?.[0]?.standings?.entries || [];
          for (const entry of entries) {
            if (String(entry.athlete?.id) === String(id)) {
              const constructorName = entry.athlete?.team?.displayName || entry.athlete?.team?.name || '';
              if (constructorName) {
                f1Team = { name: constructorName };
              }
              break;
            }
          }
        }
      } catch {
        // standings fetch failed, continue without team
      }
    }

    const player = normalizePlayer(bio, statsData, sport, f1Team);

    writeCachedPlayer(sport, id, player);

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

function normalizePlayer(bio: any, statsData: any, sport: string, f1Team?: { name: string }): PlayerData {
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
  const nationality = birthPlace?.country || athlete.citizenship || athlete.flag?.alt || '';

  // College / draft
  const college = athlete.college?.name || athlete.college?.shortName || null;
  const draftInfo = athlete.draft;
  const draft = draftInfo
    ? `${draftInfo.year || ''} R${draftInfo.round || '?'} Pick ${draftInfo.selection || '?'}${draftInfo.team?.name ? ` - ${draftInfo.team.name}` : ''}`
    : null;

  // Extras — sport-specific fields
  const extras: Record<string, any> = {};

  // F1: constructor from standings or bio
  if (sport === 'f1') {
    if (!team && f1Team) {
      team = {
        id: '',
        name: f1Team.name,
        abbreviation: f1Team.name,
        logo: '',
        color: F1_CONSTRUCTOR_COLORS[f1Team.name] || '',
      };
      extras.constructorName = f1Team.name;
    } else if (athlete.team?.name) {
      extras.constructorName = athlete.team.name;
    }
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
    age: athlete.age || calculateAgeFromDOB(athlete.displayDOB),
    birthDate: athlete.dateOfBirth || null,
    birthPlace: birthPlaceStr,
    nationality,
    experience: athlete.experience?.years ?? (athlete.debutYear ? new Date().getFullYear() - athlete.debutYear : null),
    college,
    draft,
    sport,
    currentStats,
    careerStats,
    statLabels,
    extras,
  };
}

function calculateAgeFromDOB(displayDOB: string | undefined): number | null {
  if (!displayDOB) return null;
  const parts = displayDOB.split('/');
  if (parts.length !== 3) return null;
  const [month, day, year] = parts.map(Number);
  if (!month || !day || !year) return null;
  const dob = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age > 0 ? age : null;
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
