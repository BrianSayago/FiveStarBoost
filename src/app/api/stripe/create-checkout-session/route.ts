import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/utils/stripe';
import { NextResponse } from 'next/server';

/**
 * POST /api/stripe/create-checkout-session
 * Body: { hotel_id: string }
 *
 * Creates a Stripe Checkout session for the given hotel.
 * Automatically applies 20% OFF coupon if user is still in trial period.
 * Discount is server-validated — cannot be spoofed from the client.
 */
export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel_id } = await req.json();

    if (!hotel_id) {
      return NextResponse.json({ error: 'hotel_id required' }, { status: 400 });
    }

    // 1. Verify user belongs to this hotel
    const { data: membership } = await supabase
      .from('hotel_users')
      .select('role')
      .eq('hotel_id', hotel_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch hotel billing data
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('name, contact_email, stripe_customer_id, trial_ends_at, subscription_status')
      .eq('id', hotel_id)
      .single();

    if (hotelError || !hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // 3. Get or create Stripe Customer
    let customerId = hotel.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: hotel.contact_email,
        name: hotel.name,
        metadata: { hotel_id },
      });
      customerId = customer.id;
      // Persist Stripe customer ID to hotel row
      await supabase
        .from('hotels')
        .update({ stripe_customer_id: customerId })
        .eq('id', hotel_id);
    }

    // 4. Determine if early discount applies (trial still active = trial_ends_at > NOW())
    // Server-side check: the discount cannot be applied from the client side
    const isInTrial =
      hotel.subscription_status === 'TRIAL' &&
      hotel.trial_ends_at !== null &&
      new Date(hotel.trial_ends_at) > new Date();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 5. Build Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!, // $25 USD/month — set in Stripe Dashboard
          quantity: 1,
        },
      ],
      // 20% discount applied ONLY during active trial — validated server-side
      ...(isInTrial && process.env.STRIPE_COUPON_ID
        ? { discounts: [{ coupon: process.env.STRIPE_COUPON_ID }] }
        : {}),
      subscription_data: {
        metadata: { hotel_id }, // Needed for subscription.deleted webhook
      },
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url:  `${appUrl}/dashboard?payment=cancelled`,
      metadata: { hotel_id },
      // Prefill customer email in Stripe Checkout form
      customer_email: !hotel.stripe_customer_id ? hotel.contact_email : undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
