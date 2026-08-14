import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_HOTEL } from '@/utils/demoData';

/**
 * POST /api/hotels/initialize-trial
 * 
 * Called once on dashboard mount when trial_started_at is null.
 * Idempotent: the DB function only writes if trial_started_at IS NULL.
 * Server-validated: user must belong to the hotel.
 */
export async function POST(req: Request) {
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  if (isDemo) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { hotel_id } = body;

    if (hotel_id === DEMO_HOTEL.id) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: true });
    }

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
      return NextResponse.json({ ok: true });
    }

    // Call idempotent DB function — only sets trial dates if trial_started_at IS NULL
    const { error: rpcError } = await supabase.rpc('initialize_hotel_trial', {
      p_hotel_id: hotel_id,
    });

    if (rpcError) {
      console.error('[initialize-trial] RPC error:', rpcError);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[initialize-trial] Unexpected error:', err);
    return NextResponse.json({ ok: true });
  }
}
