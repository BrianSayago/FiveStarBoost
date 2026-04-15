import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/hotels/initialize-trial
 * 
 * Called once on dashboard mount when trial_started_at is null.
 * Idempotent: the DB function only writes if trial_started_at IS NULL.
 * Server-validated: user must belong to the hotel.
 */
export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { hotel_id } = body;

    if (!hotel_id) {
      return NextResponse.json({ error: 'hotel_id required' }, { status: 400 });
    }

    // Server-side authorization: verify user belongs to this hotel (cannot be spoofed)
    const { data: membership, error: membershipError } = await supabase
      .from('hotel_users')
      .select('id')
      .eq('hotel_id', hotel_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Call idempotent DB function — only sets trial dates if trial_started_at IS NULL
    const { error: rpcError } = await supabase.rpc('initialize_hotel_trial', {
      p_hotel_id: hotel_id,
    });

    if (rpcError) {
      console.error('[initialize-trial] RPC error:', rpcError);
      return NextResponse.json({ error: 'Failed to initialize trial' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[initialize-trial] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
