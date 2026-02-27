import { supabase } from '@/lib/supabase';

const PLAYER_TTL_MS = 60 * 60 * 1000; // 1 hour freshness

/**
 * Get a cached player from player_cache.
 * Returns the player data and whether it's still fresh.
 */
export async function getCachedPlayer(
  sport: string,
  playerId: string
): Promise<{ player: any | null; isFresh: boolean }> {
  const { data, error } = await supabase
    .from('player_cache')
    .select('player_data, updated_at')
    .eq('sport', sport)
    .eq('player_id', playerId)
    .single();

  if (error || !data) {
    return { player: null, isFresh: false };
  }

  const isFresh = Date.now() - new Date(data.updated_at).getTime() < PLAYER_TTL_MS;
  return { player: data.player_data, isFresh };
}

/**
 * Write player data to cache. Fire-and-forget — do not await in the caller.
 */
export function writeCachedPlayer(
  sport: string,
  playerId: string,
  playerData: any
): void {
  supabase
    .from('player_cache')
    .upsert(
      {
        id: `${sport}_${playerId}`,
        sport,
        player_id: playerId,
        player_name: playerData.name || null,
        team_name: playerData.team?.name || null,
        player_data: playerData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .then(({ error }) => {
      if (error) console.error('[PlayerCache] Write error:', error.message);
    });
}
