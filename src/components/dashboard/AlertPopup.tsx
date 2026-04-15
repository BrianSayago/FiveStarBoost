'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface AlertDetail {
  id: string;
  guest_name: string;
  room_number: string;
  message: string;
  created_at: string;
  type: string;
}

export function AlertPopup() {
  const [queue, setQueue] = useState<AlertDetail[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  // Audio reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load mute preference
    const savedMute = localStorage.getItem('alert_muted');
    if (savedMute) setIsMuted(savedMute === 'true');

    // Init audio. You can replace this URL with any ding/alarm sound you have available.
    // For now we use a reliable short notification sound url if one isn't in public dir.
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const toggleMute = () => {
    setIsMuted(prev => {
      const newVal = !prev;
      localStorage.setItem('alert_muted', String(newVal));
      return newVal;
    });
  };

  useEffect(() => {
    const supabase = createClient();

    const fetchAlertDetails = async (newAlert: any) => {
      // Query the full details of the alert using RLS so we only get it if it belongs to our hotel
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          id,
          message,
          created_at,
          type,
          guest_stays (
            room_number,
            guests ( name )
          )
        `)
        .eq('id', newAlert.id)
        .single();

      if (!error && data) {
        const fullAlert: AlertDetail = {
          id: data.id,
          guest_name: (data.guest_stays as any)?.guests?.name || 'Desconocido',
          room_number: (data.guest_stays as any)?.room_number || '?',
          message: data.message,
          created_at: data.created_at,
          type: data.type
        };

        setQueue(prev => {
          // Prevent duplicates
          if (prev.find(a => a.id === fullAlert.id)) return prev;
          return [...prev, fullAlert];
        });

        // Play sound if not muted
        if (!isMuted && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.error("Error playing sound:", e));
        }
      }
    };

    // Listen to INSERT on alerts
    const channel = supabase
      .channel('realtime:alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          fetchAlertDetails(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMuted]);

  const removeAlert = (id: string) => {
    setQueue(prev => prev.filter(a => a.id !== id));
  };

  if (queue.length === 0) {
    return null; // Don't render anything if no alerts
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      {/* Sound Toggle */}
      <div className="flex justify-end mb-1">
        <button 
          onClick={toggleMute}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm border border-gray-200 dark:border-slate-800 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
        >
          {isMuted ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              Sonido Silenciado
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Sonido Activado
            </>
          )}
        </button>
      </div>

      {/* Alert Cards */}
      {queue.map((alert) => (
        <div 
          key={alert.id}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border-l-4 border-l-red-500 overflow-hidden transform transition-all duration-300 animate-in slide-in-from-right-8 fade-in"
        >
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full p-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Alerta Crítica</h3>
              </div>
              <button 
                onClick={() => removeAlert(alert.id)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                aria-label="Cerrar alerta"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">{alert.guest_name}</span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Hab {alert.room_number}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg border border-gray-100 dark:border-slate-800 line-clamp-3">
                &quot;{alert.message}&quot;
              </p>
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs text-red-500 font-semibold uppercase tracking-wider">
                {alert.type === 'IMMEDIATE_HELP' ? 'Ayuda Urgente' : 'Mala Experiencia'}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(alert.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute:'2-digit' })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
