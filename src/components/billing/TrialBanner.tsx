'use client';

import { useState } from 'react';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

/**
 * TrialBanner
 *
 * Shows during active trial period only.
 * - Countdown badge with days remaining
 * - Color shifts amber → orange → red in last 3 days
 * - 20% OFF early upgrade CTA during entire trial
 */
export function TrialBanner() {
  const { isInTrial, daysRemaining, hotel } = useSubscription();
  const [loading, setLoading] = useState(false);

  if (!isInTrial) return null;

  const isUrgent = daysRemaining <= 3;
  const isMidway = daysRemaining <= 7;

  const handleUpgrade = async () => {
    if (!hotel?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotel.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || 'Error al redirigir al pago');
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-500 ${
        isUrgent
          ? 'bg-rose-500/10 border-rose-500/30 dark:border-rose-500/40'
          : isMidway
          ? 'bg-amber-500/10 border-amber-500/30 dark:border-amber-500/40'
          : 'bg-indigo-500/8 border-indigo-500/20 dark:border-indigo-500/30'
      }`}
    >
      {/* Subtle animated gradient background */}
      <div
        className={`absolute inset-0 opacity-[0.04] ${
          isUrgent
            ? 'bg-gradient-to-r from-rose-500 to-orange-500'
            : isMidway
            ? 'bg-gradient-to-r from-amber-500 to-orange-400'
            : 'bg-gradient-to-r from-indigo-500 to-blue-500'
        }`}
      />

      <div className="relative flex items-center gap-3 flex-1 min-w-0">
        {/* Days remaining badge */}
        <div
          className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border font-black text-center leading-none ${
            isUrgent
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-500 dark:text-rose-400'
              : isMidway
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          <span className="text-2xl leading-none">{daysRemaining}</span>
          <span className="text-[9px] font-bold tracking-wider uppercase mt-0.5 opacity-70">días</span>
        </div>

        <div className="min-w-0">
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            {isUrgent
              ? '⚠️ Tu prueba gratuita está por vencer'
              : 'Estás en tu período de prueba gratuita de 14 días'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {isUrgent
              ? 'Activá hoy para no perder el acceso a tus datos y el '
              : 'Activá antes de que termine y aprovechá el '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">20% OFF por los primeros 3 meses</span>
            {isUrgent ? ' exclusivo.' : '.'}
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className={`relative shrink-0 font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg ${
          isUrgent
            ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25'
            : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-500/25'
        }`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        Aprovechar 20% OFF
      </button>
    </div>
  );
}
