import { NextRequest, NextResponse } from 'next/server';
import { getMLBGameSummary } from '@/lib/api-espn-mlb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const gameId = params.id;

  if (!gameId) {
    return NextResponse.json(
      { error: 'Game ID is required' },
      { status: 400 }
    );
  }

  try {
    const result = await getMLBGameSummary(gameId);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API/MLB/Game/${gameId}] Error:`, error);

    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    );
  }
}
