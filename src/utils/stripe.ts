import Stripe from 'stripe';

// Singleton Stripe instance — reused across all API routes
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing environment variable: STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});
