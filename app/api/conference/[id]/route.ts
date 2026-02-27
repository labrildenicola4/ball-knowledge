import { NextRequest, NextResponse } from 'next/server';
import { getConferenceById } from '@/lib/constants/unified-conferences';
import { getCollegeBasketballConferenceStandings } from '@/lib/api-espn-basketball';

export const dynamic = 'force-dynamic';

// ESPN API bases
const BASKETBALL_API_V2 = 'https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball';
const FOOTBALL_API_V2 = 'https://site.api.espn.com/apis/v2/sports/football/college-football';
const FBS_GROUP_ID = 80;

interface StandingTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  conferenceWins: number;
  conferenceLosses: number;
  overallWins: number;
  overallLosses: number;
}

interface ConferenceStandings {
  id: string;
  name: string;
  teams: StandingTeam[];
}

// Fetch football conference standings
async function getFootballConferenceStandings(conferenceGroupId: number): Promise<ConferenceStandings | null> {
  const url = `${FOOTBALL_API_V2}/standings?group=${FBS_GROUP_ID}`;

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return null;

    const data = await response.json();

    // Find the specific conference within children
    const conf = data.children?.find((c: { id: number }) => c.id === conferenceGroupId);
    if (!conf) {
      return null;
    }

    const teams: StandingTeam[] = conf.standings?.entries?.map((entry: {
      team: {
        id: string;
        name?: string;
        displayName?: string;
        abbreviation?: string;
        logos?: Array<{ href: string }>;
      };
      stats?: Array<{
        name?: string;
        abbreviation?: string;
        value?: number;
      }>;
    }) => {
      const getStatValue = (name: string) => {
        const stat = entry.stats?.find(s => s.name === name || s.abbreviation === name);
        return stat?.value ?? 0;
      };

      return {
        id: entry.team.id,
        name: entry.team.displayName || entry.team.name || '',
        abbreviation: entry.team.abbreviation || '',
        logo: entry.team.logos?.[0]?.href || '',
        conferenceWins: Math.round(getStatValue('conferenceWins')),
        conferenceLosses: Math.round(getStatValue('conferenceLosses')),
        overallWins: Math.round(getStatValue('wins')),
        overallLosses: Math.round(getStatValue('losses')),
      };
    }) || [];

    // Sort by conference wins descending, then conference losses ascending
    teams.sort((a, b) => {
      if (b.conferenceWins !== a.conferenceWins) return b.conferenceWins - a.conferenceWins;
      return a.conferenceLosses - b.conferenceLosses;
    });

    return {
      id: String(conf.id),
      name: conf.name || 'Unknown',
      teams,
    };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get conference config from unified data
    const conference = getConferenceById(id);

    if (!conference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      );
    }

    // Fetch standings for available sports
    const [basketballStandings, footballStandings] = await Promise.all([
      conference.basketball
        ? getCollegeBasketballConferenceStandings(String(conference.basketball.groupId))
        : Promise.resolve(null),
      conference.football
        ? getFootballConferenceStandings(conference.football.groupId)
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      conference: {
        id: conference.id,
        name: conference.name,
        shortName: conference.shortName,
        logo: conference.logo,
        hasBaskeball: !!conference.basketball,
        hasFootball: !!conference.football,
      },
      basketball: basketballStandings,
      football: footballStandings,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch conference data' },
      { status: 500 }
    );
  }
}
