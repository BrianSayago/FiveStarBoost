import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_HOTEL } from '@/utils/demoData';

/**
 * GET /api/hotels/subscription?hotel_id=<uuid>
 * 
 * Returns the hotel's subscription + trial data.
 * Used by SubscriptionProvider on the client.
 */
export async function GET(req: Request) {
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  const { searchParams } = new URL(req.url);
  const hotel_id = searchParams.get('hotel_id');

  if (isDemo || hotel_id === DEMO_HOTEL.id) {
    return NextResponse.json(DEMO_HOTEL);
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(DEMO_HOTEL);
    }

    if (!hotel_id) {
      return NextResponse.json({ error: 'hotel_id required' }, { status: 400 });
    }

    // Verify membership (RLS also enforces this, but double-checking for explicit 403)
    const { data: membership } = await supabase
      .from('hotel_users')
      .select('id')
      .eq('hotel_id', hotel_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(DEMO_HOTEL);
    }

    const { data: hotel, error } = await supabase
      .from('hotels')
      .select('id, name, subscription_status, trial_started_at, trial_ends_at, stripe_customer_id, stripe_subscription_id')
      .eq('id', hotel_id)
      .single();

    if (error || !hotel) {
      return NextResponse.json(DEMO_HOTEL);
    }

    return NextResponse.json(hotel);
  } catch (err) {
    console.error('[subscription] Unexpected error:', err);
    return NextResponse.json(DEMO_HOTEL);
  }
}
