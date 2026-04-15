'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StarRating from './StarRating';

type SurveyContext = {
  guest_name: string;
  hotel_name: string;
  hotel_logo_url?: string;
  room_number: string;
};

export default function SurveyPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<SurveyContext | null>(null);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!token) return;

    async function fetchContext() {
      try {
        const res = await fetch(`/api/survey/${token}`);
        if (!res.ok) throw new Error('Failed to fetch survey context');
        const data = await res.json();
        setContext(data);
      } catch (err) {
        setError('El enlace de esta encuesta no es válido o la estadía no fue encontrada.');
      } finally {
        setLoading(false);
      }
    }

    fetchContext();
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          rating: rating, // Enviamos el numero exacto (1 al 5)
          feedback_text: feedback,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      if (data.redirect) {
        router.push(data.redirect);
      }
    } catch (err) {
      setSubmitError('No pudimos enviar tu opinión. Por favor intentá nuevamente.');
      setIsSubmitting(false);
    }
  };

  const getHelperMessage = () => {
    if (rating === 0) return 'Leemos cada comentario para mejorar la experiencia de nuestros huéspedes.';
    if (rating >= 4) return '¡Nos alegra mucho saber que tu experiencia fue positiva! Si querés, podés contarnos un poco más sobre tu estadía.';
    if (rating >= 2) return 'Gracias por compartir tu experiencia con nosotros. Siempre estamos buscando mejorar y tu opinión nos ayuda mucho.';
    return 'Lamentamos que tu experiencia no haya sido la esperada. Tu comentario será enviado a nuestro equipo para revisarlo y en breve alguien del hotel se pondrá en contacto con vos.';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
          <p className="text-gray-500 font-medium">Estamos preparando tu encuesta...</p>
        </div>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-gray-700">{error || 'Ha ocurrido un error.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-900 px-6 py-8 flex flex-col items-center text-center">
          {context.hotel_logo_url && (
            <img 
              src={context.hotel_logo_url} 
              alt={`Logo de ${context.hotel_name}`} 
              className="h-16 w-auto object-contain mb-6 bg-white rounded-lg p-2 shadow-sm"
            />
          )}
          <h1 className="text-2xl font-bold text-white mb-2">
            ¿Cómo fue tu estadía en {context.hotel_name}?
          </h1>
          <p className="text-slate-200">
            Hola <span className="font-semibold text-white">{context.guest_name}</span>, esperamos que hayas disfrutado tu estadía en la habitación <span className="font-semibold text-white">{context.room_number}</span>.
          </p>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8">
          
          <StarRating rating={rating} onRatingChange={setRating} />

          <div className="mb-6 min-h-[4rem] flex items-center justify-center">
            <p className="text-gray-600 text-center text-sm sm:text-base text-balance leading-relaxed transition-all duration-300">
              {getHelperMessage()}
            </p>
          </div>

          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${rating > 0 ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
            <textarea
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all resize-none"
              rows={4}
              placeholder="Contanos más sobre tu experiencia (opcional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          {submitError && (
             <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
               {submitError}
             </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform
              ${rating === 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : isSubmitting 
                  ? 'bg-slate-700 cursor-wait' 
                  : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md'
              }`}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar opinión'}
          </button>

        </div>
      </div>
    </div>
  );
}
