'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportCsvPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo CSV.');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/stays/csv', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al subir el archivo');
      }

      // Success
      router.refresh();
      router.push(`/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-transparent dark:border-slate-800">
        <div className="p-8 text-center bg-gray-900 dark:bg-slate-900 border-b border-gray-800 dark:border-slate-800">
          <h1 className="text-2xl font-bold text-white tracking-tight">Importar Huéspedes</h1>
          <p className="text-sm text-gray-400 mt-2">Sube un archivo CSV con tus clientes actuales</p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
             <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-500/20">
               {error}
             </div>
          )}

          <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              className="hidden" 
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
              <span className="text-gray-500 dark:text-gray-400 mb-2">
                {file ? file.name : 'Haz clic para seleccionar tu CSV'}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Formato: name, email, room_number, check_in_date, check_out_date
              </span>
            </label>
          </div>

          <textarea 
            id="csv-text-input" 
            placeholder="O pega tu CSV aquí (Modo Texto)" 
            className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gray-900 dark:focus:ring-slate-700 focus:border-transparent outline-none transition-all"
            rows={4}
            onChange={(e) => {
              if (e.target.value) {
                const blob = new Blob([e.target.value], { type: 'text/csv' });
                setFile(new File([blob], 'test_guests.csv', { type: 'text/csv' }));
              } else {
                setFile(null);
              }
            }}
          />

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Subiendo...' : 'Importar Huéspedes'}
          </button>
          
          <button
             onClick={() => router.push(`/dashboard`)}
             className="w-full bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 font-medium py-3 rounded-xl transition-all"
          >
             Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
