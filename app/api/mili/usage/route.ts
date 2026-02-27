// GET /api/mili/usage — Returns user's daily query count and subscription tier
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
// @mili package is external — stub until available
const FREE_DAILY_LIMIT = 10;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', user.id)
      .single();

    const isExpired = profile?.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date();
    const tier = isExpired ? 'free' : (profile?.subscription_tier || 'free');

    const { data: countData } = await supabase.rpc('get_daily_query_count', { p_user_id: user.id });
    const count = countData || 0;

    return NextResponse.json({
      count,
      limit: tier === 'pro' ? -1 : FREE_DAILY_LIMIT,
      tier,
    });
  } catch (error) {
    console.error('Mili usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
