import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client with the protected Service Role Key to bypass RLS
// ensuring we can securely insert the response.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const rating = searchParams.get('rating');

  // Input Validation
  if (!token || !rating) {
    return NextResponse.redirect(new URL('/feedback/error', request.url));
  }

  // Ensure rating is valid based on our Postgres ENUM 'survey_rating'
  const validRatings = ['EXCELLENT', 'GOOD', 'NEEDS_IMPROVEMENT', 'HELP_NEEDED'];
  if (!validRatings.includes(rating)) {
    return NextResponse.redirect(new URL('/feedback/invalid-rating', request.url));
  }

  // 1. Authenticate the Survey Token to find the Guest Stay
  const { data: stay, error: stayError } = await supabaseAdmin
    .from('guest_stays')
    .select('id, hotel_id, check_out_date')
    .eq('survey_token', token)
    .single();

  if (stayError || !stay) {
    console.error('Invalid token used for feedback link', stayError);
    return NextResponse.redirect(new URL('/feedback/invalid', request.url));
  }

  // Check Expiration (Valid for 7 days after checkout)
  const expirationDate = new Date(stay.check_out_date);
  expirationDate.setDate(expirationDate.getDate() + 7);
  if (new Date() > expirationDate) {
    return NextResponse.redirect(new URL('/feedback/expired', request.url));
  }

  // 2. Insert the Survey Response 
  // Bypassing RLS here using the Admin client since this is a public user submission
  const { error: insertError } = await supabaseAdmin
    .from('survey_responses')
    .insert({
      hotel_id: stay.hotel_id,
      stay_id: stay.id,
      rating: rating,
    });

  if (insertError) {
    // Check for PostgreSQL unique constraint violation (code 23505)
    // Means the guest already voted on this stay
    if (insertError.code === '23505') { 
        return NextResponse.redirect(new URL('/feedback/already-submitted', request.url));
    }
    console.error('Failed to save survey response:', insertError);
    return NextResponse.redirect(new URL('/feedback/error', request.url));
  }

  // 3. Conditional Page Routing Based on Response
  if (rating === 'NEEDS_IMPROVEMENT' || rating === 'HELP_NEEDED') {
    // Send to urgent triage page encouraging a call to the front desk
    return NextResponse.redirect(new URL(`/feedback/urgent?token=${token}`, request.url));
  }

  // Send positive/good generic "Thank you!" page
  return NextResponse.redirect(new URL('/feedback/thank-you', request.url));
}
