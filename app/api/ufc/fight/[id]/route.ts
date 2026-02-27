import { NextResponse } from 'next/server';
import { getUFCFightDetail } from '@/lib/api-espn-ufc';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: competitionId } = await params;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId || !competitionId) {
      return NextResponse.json(
        { error: 'eventId and competitionId are required' },
        { status: 400 }
      );
    }

    const fight = await getUFCFightDetail(eventId, competitionId);

    if (!fight) {
      return NextResponse.json(
        { error: 'Fight not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ fight });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('[API] UFC fight detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fight details' },
      { status: 500 }
    );
  }
}
