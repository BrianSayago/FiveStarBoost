'use client';

import { useState, useEffect } from 'react';

interface EditStayModalProps {
  isOpen: boolean;
  onClose: () => void;
  stay: {
    id: string;
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
    room_number: string;
  } | null;
  onSave: (checkIn: string, checkOut: string) => Promise<void>;
}

export function EditStayModal({ isOpen, onClose, stay, onSave }: EditStayModalProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format YYYY-MM-DD for the HTML datetime-local or date input.
  // We'll use datetime-local to preserve time if needed, or date if time isn't strict.
  // The database is TIMESTAMPTZ, so datetime-local is safer.
  const formatForInput = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      // Ensure we get local YYYY-MM-DDTHH:mm format for the input
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (isOpen && stay) {
      setCheckIn(formatForInput(stay.check_in_date));
      setCheckOut(formatForInput(stay.check_out_date));
      setError(null);
    }
  }, [isOpen, stay]);

  if (!isOpen || !stay) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('La fecha de salida debe ser posterior a la de ingreso');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Convert back to ISO string for the backend API
      const checkInISO = new Date(checkIn).toISOString();
      const checkOutISO = new Date(checkOut).toISOString();
      await onSave(checkInISO, checkOutISO);
    } catch (err: any) {
      setError(err.message || 'Error al guardar estadía');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Editar estadía</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full shadow-sm border border-gray-200 dark:border-slate-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-lg text-sm mb-4 border border-blue-100 dark:border-blue-800/30">
            Huésped: <span className="font-semibold">{stay.guest_name}</span> (Hab. {stay.room_number})
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Check-in (Fecha y Hora)
            </label>
            <input
              type="datetime-local"
              required
              value={checkIn}
              onChange={e => setCheckIn(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Check-out (Fecha y Hora)
            </label>
            <input
              type="datetime-local"
              required
              value={checkOut}
              onChange={e => setCheckOut(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
            />
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${
                loading ? 'bg-blue-400 dark:bg-blue-500/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
              }`}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
