import { NextRequest, NextResponse } from 'next/server';
import { getNBAGameSummary } from '@/lib/api-espn-nba';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const data = await getNBAGameSummary(id);

    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API/NBA/Games/${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch NBA game details' },
      { status: 500 }
    );
  }
}
