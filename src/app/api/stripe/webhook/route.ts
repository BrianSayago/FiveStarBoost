import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/utils/stripe';
import Stripe from 'stripe';

/**
 * POST /api/stripe/webhook
 *
 * Stripe sends events here via signed webhook.
 * Uses Supabase service role key (bypasses RLS) to update hotel billing status.
 *
 * Stripe Dashboard → Developers → Webhooks → Add endpoint:
 * URL: https://yourdomain.com/api/stripe/webhook
 * Events to listen:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 */

// Service role client — only safe server-side (never ship to client)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ─── Payment completed → activate subscription ─────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const hotel_id = session.metadata?.hotel_id;

        if (!hotel_id) {
          console.warn('[stripe-webhook] checkout.session.completed missing hotel_id in metadata');
          break;
        }

        await supabaseAdmin
          .from('hotels')
          .update({
            subscription_status: 'SUBSCRIBED',
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', hotel_id);

        console.log(`[stripe-webhook] Hotel ${hotel_id} activated as SUBSCRIBED`);
        break;
      }

      // ─── Subscription updated (e.g. plan change, reactivation) ─────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const hotel_id = sub.metadata?.hotel_id;

        if (!hotel_id) break;

        // Only mark SUBSCRIBED if actively paid
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        await supabaseAdmin
          .from('hotels')
          .update({
            subscription_status: isActive ? 'SUBSCRIBED' : 'CANCELED',
            stripe_subscription_id: isActive ? sub.id : null,
          })
          .eq('id', hotel_id);

        console.log(`[stripe-webhook] Hotel ${hotel_id} subscription updated → ${isActive ? 'SUBSCRIBED' : 'CANCELED'}`);
        break;
      }

      // ─── Subscription canceled / payment failed ─────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const hotel_id = sub.metadata?.hotel_id;

        if (!hotel_id) break;

        await supabaseAdmin
          .from('hotels')
          .update({
            subscription_status: 'CANCELED',
            stripe_subscription_id: null,
          })
          .eq('id', hotel_id);

        console.log(`[stripe-webhook] Hotel ${hotel_id} subscription canceled`);
        break;
      }

      default:
        // Unhandled event type — ignore silently
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook] Error processing event:', err);
    // Return 200 to prevent Stripe from retrying (the error is on our side)
    return NextResponse.json({ error: 'Processing error' }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
