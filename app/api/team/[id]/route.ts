import { NextRequest, NextResponse } from 'next/server';
import {
  getTeamInfo,
  getTeamSquad,
  getTeamFixtures,
  getTeamStatistics,
  getTeamLeagues,
  getTeamForm,
  getTeamPlayers,
  mapStatus,
  parseRound,
  type Fixture,
  type SquadPlayer,
  type PlayerWithStats,
} from '@/lib/api-football';

export const dynamic = 'force-dynamic';

// Map league IDs to codes
const LEAGUE_ID_TO_CODE: Record<number, string> = {
  39: 'PL', 140: 'PD', 135: 'SA', 78: 'BL1', 61: 'FL1',
  94: 'PPL', 88: 'DED', 40: 'ELC', 71: 'BSA',
  2: 'CL', 3: 'EL', 13: 'CLI',
  143: 'CDR', 45: 'FAC', 66: 'CDF', 137: 'CIT', 81: 'DFB',
};

// Primary domestic leagues for team statistics
const PRIMARY_LEAGUES: Record<string, number> = {
  'spain': 140,      // La Liga
  'england': 39,     // Premier League
  'italy': 135,      // Serie A
  'germany': 78,     // Bundesliga
  'france': 61,      // Ligue 1
  'portugal': 94,    // Primeira Liga
  'netherlands': 88, // Eredivisie
  'brazil': 71,      // Brasileirao
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const teamId = parseInt(params.id);

  if (isNaN(teamId)) {
    return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
  }

  try {
    // Fetch team info, squad, fixtures, leagues, and player stats in parallel
    const [teamInfo, squad, pastFixtures, upcomingFixtures, teamLeagues, formArray, playerStats] = await Promise.all([
      getTeamInfo(teamId),
      getTeamSquad(teamId).catch(() => []),
      getTeamFixtures(teamId, undefined, 50).catch(() => []),
      getTeamFixtures(teamId, undefined, undefined, 30).catch(() => []),
      getTeamLeagues(teamId).catch(() => []),
      getTeamForm(teamId, 5).catch(() => []),
      getTeamPlayers(teamId).catch(() => []),
    ]);

    // Create a map of player stats by player ID for quick lookup
    const playerStatsMap = new Map<number, PlayerWithStats>();
    for (const ps of playerStats) {
      playerStatsMap.set(ps.player.id, ps);
    }

    if (!teamInfo) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Find primary league for this team to get statistics
    const primaryLeague = teamLeagues.find(l =>
      Object.values(PRIMARY_LEAGUES).includes(l.league.id) &&
      l.seasons.some(s => s.current)
    );

    // Get team statistics from primary league
    let teamStats = null;
    if (primaryLeague) {
      teamStats = await getTeamStatistics(teamId, primaryLeague.league.id).catch(() => null);
    }

    // Transform fixtures
    const transformFixture = (fixture: Fixture) => {
      const matchDate = new Date(fixture.fixture.date);
      const { status } = mapStatus(fixture.fixture.status.short, fixture.fixture.status.elapsed);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayDate = `${monthNames[matchDate.getUTCMonth()]} ${matchDate.getUTCDate()}`;
      const hours = matchDate.getUTCHours();
      const minutes = matchDate.getUTCMinutes();
      const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      return {
        id: fixture.fixture.id,
        competition: fixture.league.name,
        competitionCode: LEAGUE_ID_TO_CODE[fixture.league.id] || fixture.league.name,
        competitionLogo: fixture.league.logo,
        date: displayDate,
        fullDate: fixture.fixture.date,
        time: displayTime,
        status,
        matchday: parseRound(fixture.league.round),
        home: {
          id: fixture.teams.home.id,
          name: fixture.teams.home.name,
          logo: fixture.teams.home.logo,
          score: fixture.goals.home,
        },
        away: {
          id: fixture.teams.away.id,
          name: fixture.teams.away.name,
          logo: fixture.teams.away.logo,
          score: fixture.goals.away,
        },
        isHome: fixture.teams.home.id === teamId,
      };
    };

    // Filter only finished matches from pastFixtures
    const finishedMatches = pastFixtures
      .filter(f => f.fixture.status.short === 'FT' || f.fixture.status.short === 'AET' || f.fixture.status.short === 'PEN')
      .map(transformFixture)
      .reverse(); // Most recent first

    // Filter only scheduled matches from upcomingFixtures
    const scheduledMatches = upcomingFixtures
      .filter(f => f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD')
      .map(transformFixture);

    // Transform squad
    const positionMap: Record<string, string> = {
      'Goalkeeper': 'Goalkeeper',
      'Defender': 'Defence',
      'Midfielder': 'Midfield',
      'Attacker': 'Offence',
    };

    const transformPlayer = (player: SquadPlayer) => {
      // Look up player stats from the map
      const ps = playerStatsMap.get(player.id);

      // Aggregate stats across all competitions for this player
      let totalAppearances = 0;
      let totalSubstitutions = 0;
      let totalGoals = 0;
      let totalAssists = 0;
      let totalShots = 0;
      let totalShotsOnTarget = 0;
      let totalFoulsCommitted = 0;
      let totalFoulsSuffered = 0;
      let totalYellowCards = 0;
      let totalRedCards = 0;
      let totalSaves = 0;
      let totalGoalsAgainst = 0;

      if (ps?.statistics) {
        for (const stat of ps.statistics) {
          // Only count stats for the current team
          if (stat.team.id === teamId) {
            // appearances = lineups (starts) + substitutes.in (came on as sub)
            totalAppearances += (stat.games.lineups || 0) + (stat.substitutes.in || 0);
            totalSubstitutions += stat.substitutes.in || 0;
            totalGoals += stat.goals.total || 0;
            totalAssists += stat.goals.assists || 0;
            totalShots += stat.shots.total || 0;
            totalShotsOnTarget += stat.shots.on || 0;
            totalFoulsCommitted += stat.fouls.committed || 0;
            totalFoulsSuffered += stat.fouls.drawn || 0;
            totalYellowCards += stat.cards.yellow || 0;
            totalRedCards += stat.cards.red || 0;
            totalSaves += stat.goals.saves || 0;
            totalGoalsAgainst += stat.goals.conceded || 0;
          }
        }
      }

      return {
        id: player.id,
        name: player.name,
        position: positionMap[player.position] || player.position,
        nationality: ps?.player.nationality || 'Unknown',
        shirtNumber: player.number,
        age: player.age,
        photo: player.photo,
        stats: {
          appearances: ps ? totalAppearances : null,
          substitutions: ps ? totalSubstitutions : null,
          goals: ps ? totalGoals : null,
          assists: ps ? totalAssists : null,
          shots: ps ? totalShots : null,
          shotsOnTarget: ps ? totalShotsOnTarget : null,
          foulsCommitted: ps ? totalFoulsCommitted : null,
          foulsSuffered: ps ? totalFoulsSuffered : null,
          yellowCards: ps ? totalYellowCards : null,
          redCards: ps ? totalRedCards : null,
          saves: ps ? totalSaves : null,
          goalsAgainst: ps ? totalGoalsAgainst : null,
        },
      };
    };

    // Group squad by position
    const positions = ['Goalkeeper', 'Defence', 'Midfield', 'Offence'];
    const squadByPosition = positions.map(pos => ({
      position: pos,
      players: squad
        .filter(p => positionMap[p.position] === pos)
        .map(transformPlayer),
    })).filter(g => g.players.length > 0);

    // Build competitions list from leagues
    const competitions = teamLeagues
      .filter(l => l.seasons.some(s => s.current))
      .map(l => ({
        id: l.league.id,
        name: l.league.name,
        code: LEAGUE_ID_TO_CODE[l.league.id] || l.league.name,
        logo: l.league.logo,
      }));

    // Calculate statistics from team stats API or from fixtures
    let statistics;
    if (teamStats) {
      const { fixtures, goals, clean_sheet, biggest } = teamStats;
      const played = fixtures.played.total;
      const wins = fixtures.wins.total;
      const draws = fixtures.draws.total;
      const losses = fixtures.loses.total;
      const points = wins * 3 + draws;

      statistics = {
        played,
        wins,
        draws,
        losses,
        goalsFor: goals.for.total.total,
        goalsAgainst: goals.against.total.total,
        goalDifference: goals.for.total.total - goals.against.total.total,
        points,
        ppg: played > 0 ? (points / played).toFixed(2) : '0.00',
        cleanSheets: clean_sheet.total,
        homeRecord: {
          wins: fixtures.wins.home,
          draws: fixtures.draws.home,
          losses: fixtures.loses.home,
        },
        awayRecord: {
          wins: fixtures.wins.away,
          draws: fixtures.draws.away,
          losses: fixtures.loses.away,
        },
        biggestWin: biggest.wins.home || biggest.wins.away || 'N/A',
        biggestLoss: biggest.loses.home || biggest.loses.away || 'N/A',
        winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
      };
    } else {
      // Fallback: calculate from fixtures
      let wins = 0, draws = 0, losses = 0;
      let goalsFor = 0, goalsAgainst = 0;
      let cleanSheets = 0;

      for (const fixture of pastFixtures) {
        if (fixture.fixture.status.short !== 'FT') continue;

        const isHome = fixture.teams.home.id === teamId;
        const teamScore = isHome ? fixture.goals.home : fixture.goals.away;
        const oppScore = isHome ? fixture.goals.away : fixture.goals.home;

        if (teamScore === null || oppScore === null) continue;

        goalsFor += teamScore;
        goalsAgainst += oppScore;
        if (oppScore === 0) cleanSheets++;

        if (teamScore > oppScore) wins++;
        else if (teamScore < oppScore) losses++;
        else draws++;
      }

      const played = wins + draws + losses;
      const points = wins * 3 + draws;

      statistics = {
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
        ppg: played > 0 ? (points / played).toFixed(2) : '0.00',
        cleanSheets,
        homeRecord: { wins: 0, draws: 0, losses: 0 },
        awayRecord: { wins: 0, draws: 0, losses: 0 },
        biggestWin: 'N/A',
        biggestLoss: 'N/A',
        winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
      };
    }

    return NextResponse.json({
      id: teamInfo.team.id,
      name: teamInfo.team.name,
      shortName: teamInfo.team.code || teamInfo.team.name.substring(0, 3).toUpperCase(),
      tla: teamInfo.team.code || teamInfo.team.name.substring(0, 3).toUpperCase(),
      crest: teamInfo.team.logo,
      founded: teamInfo.team.founded || 0,
      venue: teamInfo.venue.name || 'Unknown',
      clubColors: '',
      website: '',
      coach: null, // API-Football doesn't include coach in team info
      coachNationality: null,
      competitions,
      form: formArray,
      finishedMatches,
      scheduledMatches,
      squad: squadByPosition,
      statistics,
    });
  } catch (error) {
    console.error('[Team API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('429')) {
      return NextResponse.json({
        error: 'Rate limited - please wait a moment and try again',
        rateLimited: true
      }, { status: 429 });
    }

    return NextResponse.json({ error: 'Failed to fetch team details' }, { status: 500 });
  }
}
