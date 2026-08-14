import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { DEMO_HOTEL } from '@/utils/demoData';

/**
 * GET /api/hotels
 *
 * Returns all hotels the authenticated user belongs to (via hotel_users).
 * Used by SubscriptionProvider to auto-discover active_hotel_id on first login.
 */
export async function GET() {
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  if (isDemo) {
    return NextResponse.json([DEMO_HOTEL]);
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([DEMO_HOTEL]);

    // Fetch hotels where this user has a membership record
    const { data, error } = await supabase
      .from('hotel_users')
      .select('hotel_id, role, hotels(id, name, subscription_status, trial_started_at, trial_ends_at)')
      .eq('user_id', user.id);

    if (error) throw error;

    // Flatten into a simple hotel list
    const hotels = (data ?? [])
      .map((row: any) => row.hotels)
      .filter(Boolean);

    return NextResponse.json(hotels.length > 0 ? hotels : [DEMO_HOTEL]);
  } catch (error: any) {
    console.error('[GET /api/hotels] Error:', error);
    return NextResponse.json([DEMO_HOTEL]);
  }
}


export async function POST(request: Request) {
  try {
    const supabase = createClient();
    // Validate auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, contact_email, google_review_url } = body;

    if (!name || !contact_email || !google_review_url) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('hotels')
      .insert([
        {
          name,
          contact_email,
          google_review_link: google_review_url
        }
      ])
      .select('id, name')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating hotel:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
