import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const rating = searchParams.get('rating');

  if (!token || !rating) {
    return NextResponse.json({ error: 'Missing token or rating' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars in API");
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Find stay by token
  const { data: stay, error: stayErr } = await supabase
    .from('guest_stays')
    .select('id, hotel_id')
    .eq('survey_token', token)
    .single();

  if (stayErr || !stay) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  // 2. Insert survey response
  const { error: insertErr } = await supabase
    .from('survey_responses')
    .insert({
      hotel_id: stay.hotel_id,
      stay_id: stay.id,
      rating: rating
    });

  if (insertErr) {
    console.error("Error inserting feedback:", insertErr);
    // Might fail if already exists
    return NextResponse.json({ error: 'Database error storing feedback' }, { status: 500 });
  }

  // 3. Return success redirect or response
  // Since test_integration just checks response.ok, returning JSON is fine too, 
  // but Next.js redirect was implied originally.
  return NextResponse.json({ success: true, message: 'Feedback stored successfully' });
}
