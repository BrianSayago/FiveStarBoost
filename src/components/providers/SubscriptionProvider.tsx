'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { HotelSubscription, SubscriptionState } from '@/types/subscription';

// ─── Context ───────────────────────────────────────────────────────────────────

const defaultState: SubscriptionState = {
  hotel: null,
  isInTrial: false,
  isSubscribed: false,
  isExpired: false,
  hasAccess: false,
  daysRemaining: 0,
  showEarlyDiscount: false,
  loading: true,
};

const SubscriptionContext = createContext<SubscriptionState>(defaultState);

export function useSubscription() {
  return useContext(SubscriptionContext);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeState(hotel: HotelSubscription): Omit<SubscriptionState, 'loading'> {
  const now = new Date();
  const trialEnd = hotel.trial_ends_at ? new Date(hotel.trial_ends_at) : null;

  const isSubscribed = hotel.subscription_status === 'SUBSCRIBED';
  const isInTrial =
    hotel.subscription_status === 'TRIAL' &&
    trialEnd !== null &&
    trialEnd >= now;

  const isExpired = !isSubscribed && !isInTrial;
  const hasAccess = isSubscribed || isInTrial;

  const daysRemaining = isInTrial && trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86_400_000))
    : 0;

  // Show early discount only while in active trial (not after expiry)
  const showEarlyDiscount = isInTrial;

  return { hotel, isInTrial, isSubscribed, isExpired, hasAccess, daysRemaining, showEarlyDiscount };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface SubscriptionProviderProps {
  children: React.ReactNode;
  /** active_hotel_id from localStorage, validated by parent */
  hotelId: string | null;
}

export function SubscriptionProvider({ children, hotelId }: SubscriptionProviderProps) {
  const [state, setState] = useState<SubscriptionState>(defaultState);

  const fetchAndInit = useCallback(async () => {
    let resolvedHotelId = hotelId;

    // Auto-discover hotel if not in localStorage yet
    if (!resolvedHotelId) {
      try {
        const res = await fetch('/api/hotels');
        if (res.ok) {
          const hotels: { id: string }[] = await res.json();
          if (hotels.length > 0) {
            resolvedHotelId = hotels[0].id;
            localStorage.setItem('active_hotel_id', resolvedHotelId);
          }
        }
      } catch {
        // silently fail — user will see empty state
      }
    }

    if (!resolvedHotelId) {
      setState({ ...defaultState, loading: false });
      return;
    }

    try {
      // 1. Fetch current subscription state
      const res = await fetch(`/api/hotels/subscription?hotel_id=${resolvedHotelId}`);
      if (!res.ok) {
        setState({ ...defaultState, loading: false });
        return;
      }

      const hotel: HotelSubscription = await res.json();

      // 2. If trial not yet started (trial_started_at is null), initialize it
      //    This handles the "first login" trigger
      if (!hotel.trial_started_at) {
        await fetch('/api/hotels/initialize-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotel_id: resolvedHotelId }),
        });

        // Re-fetch after initialization so we get the new trial dates
        const refreshed = await fetch(`/api/hotels/subscription?hotel_id=${resolvedHotelId}`);
        if (refreshed.ok) {
          const refreshedHotel: HotelSubscription = await refreshed.json();
          setState({ ...computeState(refreshedHotel), loading: false });
          return;
        }
      }

      setState({ ...computeState(hotel), loading: false });
    } catch (err) {
      console.error('[SubscriptionProvider] Error:', err);
      setState({ ...defaultState, loading: false });
    }
  }, [hotelId]);

  useEffect(() => {
    fetchAndInit();

    // Re-check every 60 seconds in case trial expires while dashboard is open
    const interval = setInterval(fetchAndInit, 60_000);
    return () => clearInterval(interval);
  }, [fetchAndInit]);

  return (
    <SubscriptionContext.Provider value={state}>
      {children}
    </SubscriptionContext.Provider>
  );
}
