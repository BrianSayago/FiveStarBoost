export type SubscriptionStatus = 'TRIAL' | 'SUBSCRIBED' | 'CANCELED';

export interface HotelSubscription {
  id: string;
  name: string;
  subscription_status: SubscriptionStatus;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

/** Computed access state derived from subscription data */
export interface SubscriptionState {
  hotel: HotelSubscription | null;
  /** Trial is active (within 14-day window) */
  isInTrial: boolean;
  /** Paid and confirmed by Stripe webhook */
  isSubscribed: boolean;
  /** Trial has expired AND not subscribed → show paywall */
  isExpired: boolean;
  /** Has any form of active access */
  hasAccess: boolean;
  /** Days left in trial (0 if expired or subscribed) */
  daysRemaining: number;
  /** Trial is active → show 20% discount offer */
  showEarlyDiscount: boolean;
  loading: boolean;
}
