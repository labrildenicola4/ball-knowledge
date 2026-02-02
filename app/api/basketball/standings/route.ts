import { NextResponse } from 'next/server';
import { getBasketballStandings, getBasketballRankings } from '@/lib/api-espn-basketball';
import { CONFERENCE_BY_ID } from '@/lib/constants/basketball-conferences';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conferenceId = searchParams.get('conference');
    const includeRankings = searchParams.get('rankings') !== 'false';

    let conferenceGroupId: number | undefined;

    if (conferenceId) {
      const conference = CONFERENCE_BY_ID[conferenceId];
      if (conference) {
        conferenceGroupId = conference.groupId;
      }
    }

    const [standingsData, rankings] = await Promise.all([
      conferenceGroupId ? getBasketballStandings(conferenceGroupId) : Promise.resolve([]),
      includeRankings ? getBasketballRankings() : Promise.resolve([]),
    ]);

    // Flatten standings from all conferences
    const standings = standingsData.flatMap(conf => conf.standings || []);

    return NextResponse.json({
      standings,
      rankings,
    });
  } catch (error) {
    console.error('[API] Basketball standings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
