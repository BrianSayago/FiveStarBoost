'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewGuestPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDatetimeForInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    room: '',
    checkIn: formatDatetimeForInput(new Date()),
    checkOut: formatDatetimeForInput(new Date(Date.now() + 86400000))
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        room_number: formData.room,
        check_in_date: new Date(formData.checkIn).toISOString(),
        check_out_date: new Date(formData.checkOut).toISOString()
      };

      const res = await fetch('/api/stays/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar el huésped');
      }

      router.refresh();
      router.push(`/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 flex items-center justify-center transition-colors duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 max-w-xl w-full overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Añadir Huésped Manual</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registra la estadía para habilitar las encuestas automáticas</p>
        </div>

        <div className="p-6 sm:p-8 bg-gray-50/50 dark:bg-slate-950/50">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-gray-900 focus:ring-gray-900 dark:focus:border-blue-500 dark:focus:ring-blue-500 p-3 border hover:border-gray-400 dark:hover:border-slate-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-gray-900 focus:ring-gray-900 dark:focus:border-blue-500 dark:focus:ring-blue-500 p-3 border hover:border-gray-400 dark:hover:border-slate-600 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-gray-900 focus:ring-gray-900 dark:focus:border-blue-500 dark:focus:ring-blue-500 p-3 border hover:border-gray-400 dark:hover:border-slate-600 transition-colors"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Habitación</label>
                <input
                  required
                  type="text"
                  value={formData.room}
                  onChange={e => setFormData({ ...formData, room: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-gray-900 focus:ring-gray-900 dark:focus:border-blue-500 dark:focus:ring-blue-500 p-3 border hover:border-gray-400 dark:hover:border-slate-600 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha y Hora de Ingreso</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.checkIn}
                  onChange={e => setFormData({ ...formData, checkIn: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-gray-900 focus:ring-gray-900 dark:focus:border-blue-500 dark:focus:ring-blue-500 p-3 border hover:border-gray-400 dark:hover:border-slate-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha y Hora de Egreso</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.checkOut}
                  onChange={e => setFormData({ ...formData, checkOut: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-gray-900 focus:ring-gray-900 dark:focus:border-blue-500 dark:focus:ring-blue-500 p-3 border hover:border-gray-400 dark:hover:border-slate-600 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => router.push(`/dashboard`)}
                className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 font-medium py-3 rounded-xl transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Huésped'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
