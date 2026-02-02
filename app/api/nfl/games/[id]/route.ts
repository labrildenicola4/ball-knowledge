import { NextRequest, NextResponse } from 'next/server';
import { getNFLGameSummary } from '@/lib/api-espn-nfl';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const summary = await getNFLGameSummary(id);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[API] NFL game summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game summary' },
      { status: 500 }
    );
  }
}
