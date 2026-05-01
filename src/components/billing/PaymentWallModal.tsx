'use client';

import { useEffect, useRef, useState } from 'react';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

/**
 * PaymentWallModal
 *
 * Appears when hotel trial has expired and no subscription is active.
 * - Stricty unclosable: no X button, ESC is trapped, backdrop clicks are ignored
 * - Dynamically shows 20% discount ONLY if user is still in trial period
 * - Redirects to Stripe Checkout
 */
export function PaymentWallModal({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { isExpired, hotel, showEarlyDiscount } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Trap focus inside modal and prevent Escape from closing anything
  useEffect(() => {
    if (!isExpired || isSuperAdmin) return;

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
      }
    };

    document.addEventListener('keydown', trapFocus, true);
    return () => document.removeEventListener('keydown', trapFocus, true);
  }, [isExpired, isSuperAdmin]);

  if (!isExpired || isSuperAdmin) return null;

  const handleActivate = async () => {
    if (!hotel?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotel.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear sesión de pago');
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Error inesperado. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    /* Fullscreen overlay — pointer-events-auto on modal, none on backdrop click */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(7, 9, 14, 0.92)', backdropFilter: 'blur(12px)' }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="paywall-title"
      onClick={(e) => e.stopPropagation()} // Prevent backdrop click dismiss
    >
      {/* Decorative orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />

      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 0 0 1px rgba(99,102,241,0.15), 0 32px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />

        <div className="p-8">
          {/* Lock icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Title */}
          <h2 id="paywall-title" className="text-2xl font-black text-white text-center mb-3 tracking-tight">
            Tu prueba gratuita finalizó 🔒
          </h2>

          {/* Body */}
          <p className="text-slate-400 text-center text-sm leading-relaxed mb-6">
            Para continuar y no perder el acceso al historial de tus huéspedes y alertas,
            <strong className="text-slate-200"> activá tu suscripción ahora</strong>.
          </p>

          {/* Pricing card */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6 text-center">
            {/* NOTE: showEarlyDiscount will always be false here (modal only shows when expired) */}
            {/* But we keep the logic for edge cases where the component mounts briefly */}
            {showEarlyDiscount ? (
              <>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  🎉 20% OFF — primeros 3 meses
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-slate-500 line-through text-lg">$25</span>
                  <span className="text-4xl font-black text-white">$20</span>
                  <span className="text-slate-400 text-sm">USD / mes</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Luego $25 USD/mes. Cancelá cuando quieras.</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-4xl font-black text-white">$25</span>
                  <span className="text-slate-400 text-sm ml-1">USD / mes</span>
                </div>
                <p className="text-xs text-slate-500">Sin contratos. Cancelá cuando quieras.</p>
              </>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="text-emerald-500">✓</span> Alertas en tiempo real</span>
              <span className="flex items-center gap-1"><span className="text-emerald-500">✓</span> Historial completo</span>
              <span className="flex items-center gap-1"><span className="text-emerald-500">✓</span> Automatización de emails</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleActivate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl text-base transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Preparando pago...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Activar suscripción
              </>
            )}
          </button>

          {/* Support */}
          <p className="text-center text-xs text-slate-500 mt-5 leading-relaxed">
            ¿Necesitás ayuda con el pago?{' '}
            <a
              href="mailto:fivestarboost.ar@outlook.com"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
            >
              fivestarboost.ar@outlook.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
