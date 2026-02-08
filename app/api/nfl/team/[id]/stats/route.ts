import { NextRequest, NextResponse } from 'next/server';
import { getNFLTeamStats } from '@/lib/api-espn-nfl';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stats = await getNFLTeamStats(id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API] NFL team stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 }
    );
  }
}
