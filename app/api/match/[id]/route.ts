import { NextRequest, NextResponse } from 'next/server';
import { 
  getFixtureEvents, 
  getFixtureLineups, 
  getFixtureStats,
  getHeadToHead 
} from '@/lib/api-football';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const fixtureId = Number(params.id);

  if (!fixtureId) {
    return NextResponse.json({ error: 'Invalid fixture ID' }, { status: 400 });
  }

  try {
    // Fetch all match details in parallel
    const [events, lineups, stats] = await Promise.all([
      getFixtureEvents(fixtureId),
      getFixtureLineups(fixtureId),
      getFixtureStats(fixtureId),
    ]);

    // Transform events
    const timeline = events.map((event) => ({
      minute: event.time.elapsed + (event.time.extra || 0),
      team: 'home', // Would need fixture data to determine
      event: event.type.toLowerCase() === 'goal' ? 'goal' 
        : event.type.toLowerCase() === 'card' && event.detail === 'Yellow Card' ? 'yellow'
        : event.type.toLowerCase() === 'card' && event.detail === 'Red Card' ? 'red'
        : event.type.toLowerCase() === 'subst' ? 'sub'
        : 'other',
      player: event.player.name,
      assist: event.assist?.name || null,
    }));

    // Transform lineups
    const transformedLineups = lineups.map((lineup) => ({
      team: {
        id: lineup.team.id,
        name: lineup.team.name,
        logo: lineup.team.logo,
      },
      formation: lineup.formation,
      coach: lineup.coach.name,
      players: lineup.startXI.map((p) => ({
        number: p.player.number,
        name: p.player.name,
        position: p.player.pos,
      })),
      subs: lineup.substitutes.map((p) => ({
        number: p.player.number,
        name: p.player.name,
        position: p.player.pos,
      })),
    }));

    // Transform stats
    const transformedStats: Record<string, { home: number | string; away: number | string }> = {};
    
    if (stats.length >= 2) {
      const homeStats = stats[0].statistics;
      const awayStats = stats[1].statistics;
      
      homeStats.forEach((stat, index) => {
        const key = stat.type.toLowerCase().replace(/ /g, '_');
        transformedStats[key] = {
          home: stat.value ?? 0,
          away: awayStats[index]?.value ?? 0,
        };
      });
    }

    return NextResponse.json({
      timeline,
      lineups: transformedLineups,
      stats: transformedStats,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch match details' }, { status: 500 });
  }
}
