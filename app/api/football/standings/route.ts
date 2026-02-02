import { NextResponse } from 'next/server';
import { getCollegeFootballStandings, getCollegeFootballRankings } from '@/lib/api-espn-college-football';
import { MULTI_SPORT_CONFERENCES } from '@/lib/constants/unified-conferences';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conferenceId = searchParams.get('conference');
    const includeRankings = searchParams.get('rankings') !== 'false';

    let conferenceGroupId: number | undefined;

    if (conferenceId) {
      const conference = MULTI_SPORT_CONFERENCES.find(c => c.id === conferenceId);
      if (conference?.football) {
        conferenceGroupId = conference.football.groupId;
      }
    }

    const [standingsData, rankings] = await Promise.all([
      conferenceGroupId ? getCollegeFootballStandings(conferenceGroupId) : Promise.resolve([]),
      includeRankings ? getCollegeFootballRankings() : Promise.resolve([]),
    ]);

    // Flatten standings from all conferences and transform to expected format
    const standings = standingsData.flatMap(conf =>
      conf.standings.map(s => ({
        id: s.team.id,
        name: s.team.displayName || s.team.name,
        shortName: s.team.shortDisplayName || s.team.abbreviation,
        logo: s.team.logo,
        conferenceRecord: `${s.conferenceRecord.wins}-${s.conferenceRecord.losses}`,
        overallRecord: `${s.overallRecord.wins}-${s.overallRecord.losses}`,
      }))
    );

    return NextResponse.json({
      standings,
      rankings,
    });
  } catch (error) {
    console.error('[API] Football standings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
