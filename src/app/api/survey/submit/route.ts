import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, rating, feedback_text } = body;

    if (!token || !rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valid token and numeric rating (1-5) are required' }, { status: 400 });
    }

    // 1. Find the guest_stay using the token to get stay_id and hotel_id
    const { data: stay, error: stayError } = await supabaseAdmin
      .from('guest_stays')
      .select(`
        id,
        hotel_id,
        check_out_date,
        hotels ( google_review_link )
      `)
      .eq('survey_token', token)
      .single();

    if (stayError || !stay) {
      return NextResponse.json({ error: 'Survey not found or token invalid' }, { status: 404 });
    }

    // Check Expiration (valid for 7 days after checkout)
    const expirationDate = new Date(stay.check_out_date);
    expirationDate.setDate(expirationDate.getDate() + 7);
    if (new Date() > expirationDate) {
      return NextResponse.json({ error: 'Survey link has expired' }, { status: 410 });
    }

    // Map strict numeric 1-5 rating to database enum
    let dbRating = 'EXCELLENT';
    let isPositive = true;

    if (rating === 5) { dbRating = 'EXCELLENT'; isPositive = true; }
    else if (rating >= 3) { dbRating = 'GOOD'; isPositive = true; } // 3 y 4 estrellas actuan como POSITIVAS
    else if (rating === 2) { dbRating = 'NEEDS_IMPROVEMENT'; isPositive = false; }
    else if (rating === 1) { dbRating = 'HELP_NEEDED'; isPositive = false; }

    // 2. Insert a new survey_responses record
    // Existing database trigger (trg_handle_survey_response) will handle scheduling
    // an alert and NEGATIVE_FOLLOW_UP email if rating is adverse.
    const { error: insertError } = await supabaseAdmin
      .from('survey_responses')
      .insert({
        stay_id: stay.id,
        hotel_id: stay.hotel_id,
        rating: dbRating,
        stars: rating,
        feedback_text: feedback_text || null
      });

    // Handle unique constraint: guest already submitted a response (code 23505)
    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Survey already submitted' }, { status: 409 });
      }
      console.error('Database insert error:', insertError);
      return NextResponse.json({ error: 'Failed to submit survey response' }, { status: 500 });
    }

    // 3. Construct redirect response
    if (isPositive) {
      const hotelData = Array.isArray(stay.hotels) ? stay.hotels[0] : stay.hotels;
      const googleLink = hotelData?.google_review_link || '';
      return NextResponse.json({ redirect: `/review?url=${encodeURIComponent(googleLink)}` });
    } else {
      // For NEGATIVE and HELP_NEEDED, redirect to internal thank-you page
      return NextResponse.json({ redirect: '/thank-you' });
    }

  } catch (error) {
    console.error('Unexpected error in POST /api/survey/submit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
