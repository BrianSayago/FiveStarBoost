import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: hotels } = await supabase.from('hotels').select('id').limit(1).single();
    if (!hotels) return NextResponse.json({ error: 'No hotel assigned' }, { status: 403 });
    const hotel_id = hotels.id;

    const body = await request.json();
    const { name, email, room_number, check_in_date, check_out_date } = body;

    if (!name || !email || !check_in_date || !check_out_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, check_in_date, check_out_date' },
        { status: 400 }
      );
    }

    // 1. Check if guest already exists
    let guestId: string;
    const { data: existingGuest, error: guestLookupErr } = await supabase
      .from('guests')
      .select('id')
      .eq('email', email)
      .single();

    if (guestLookupErr && guestLookupErr.code !== 'PGRST116') {
      console.error('Error looking up guest:', guestLookupErr);
      return NextResponse.json({ error: 'Failed to verify guest existence' }, { status: 500 });
    }

    if (existingGuest) {
      guestId = existingGuest.id;
      // Actualizar el nombre del huésped si cambió emparejado con este mismo email
      await supabaseAdmin.from('guests').update({ name }).eq('id', guestId);
    } else {
      // 2. Create new guest using Admin to bypass RLS JWT mapping
      const { data: newGuest, error: createGuestErr } = await supabaseAdmin
        .from('guests')
        .insert({
          hotel_id,
          name,
          email
        })
        .select('id')
        .single();

      if (createGuestErr || !newGuest) {
        console.error('Error creating guest:', createGuestErr);
        return NextResponse.json({ error: 'Failed to create guest' }, { status: 500 });
      }
      guestId = newGuest.id;
    }

    // 3. Create guest stay using Admin to bypass trigger RLS failures
    const { data: newStay, error: createStayErr } = await supabaseAdmin
      .from('guest_stays')
      .insert({
        hotel_id,
        guest_id: guestId,
        room_number: room_number || null,
        check_in_date,
        check_out_date
      })
      .select('id')
      .single();

    if (createStayErr || !newStay) {
      console.error('Error creating stay:', createStayErr);
      return NextResponse.json({ error: `Failed to create stay log: ${createStayErr?.message || 'Unknown DB error'} (Code: ${createStayErr?.code})` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      guest_id: guestId,
      stay_id: newStay.id
    });

  } catch (error: any) {
    console.error('Manual ingestion error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
