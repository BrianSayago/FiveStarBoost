import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  // 1. Find the guest_stay using the survey_token
  // 2. Join with guest, hotel information, and check for existing responses
  const { data: stay, error } = await supabaseAdmin
    .from('guest_stays')
    .select(`
      id,
      room_number,
      check_out_date,
      guests ( name ),
      hotels ( name, logo_url ),
      survey_responses ( id )
    `)
    .eq('survey_token', token)
    .single();

  if (error || !stay) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
  }

  // Check One-Time Use
  const responses = Array.isArray(stay.survey_responses) ? stay.survey_responses : (stay.survey_responses ? [stay.survey_responses] : []);
  if (responses.length > 0) {
    return NextResponse.json({ error: 'Survey already submitted' }, { status: 409 });
  }

  // Check Expiration (7 days limit)
  const expirationDate = new Date(stay.check_out_date);
  expirationDate.setDate(expirationDate.getDate() + 7);
  if (new Date() > expirationDate) {
    return NextResponse.json({ error: 'Survey link expired' }, { status: 410 });
  }

  // 3. Return minimal safe data for the survey page
  // Note: the joined tables are returned as objects (or arrays, but single() + 1:1 relation gives an object)
  const guestData = Array.isArray(stay.guests) ? stay.guests[0] : stay.guests;
  const hotelData = Array.isArray(stay.hotels) ? stay.hotels[0] : stay.hotels;

  return NextResponse.json({
    guest_name: guestData?.name || 'Guest',
    hotel_name: hotelData?.name || 'Hotel',
    hotel_logo_url: hotelData?.logo_url || null,
    room_number: stay.room_number
  });
}
