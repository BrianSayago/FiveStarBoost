"use client"

import { useState } from "react";
import { updateHotelSettings } from "./actions";
import { UploadCloud } from "lucide-react";

export default function SettingsFormClient({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // For live preview
  const [previewName, setPreviewName] = useState(initialData.name);
  const [previewLogoUrl, setPreviewLogoUrl] = useState(initialData.logo_url);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewLogoUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateHotelSettings(formData);
      if (result.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Configuration Form */}
      <form onSubmit={onSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Información del Hotel</h2>
        
        {error && <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm">{error}</div>}
        {success && <div className="p-3 bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400 rounded-lg text-sm">Configuración guardada correctamente.</div>}

        <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo del Hotel</label>
           <input 
             type="file" 
             name="logo" 
             accept="image/*"
             onChange={handleLogoChange}
             className="w-full border border-gray-200 dark:border-slate-700 p-2 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-900" 
           />
           <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Sube una imagen (PNG, JPG o SVG).</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Hotel</label>
          <input 
            name="name"
            required
            defaultValue={initialData.name}
            onChange={(e) => setPreviewName(e.target.value)}
            className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors" 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de Contacto</label>
            <input 
              name="contact_email" 
              type="email" 
              required 
              defaultValue={initialData.contact_email} 
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
            <input 
              name="contact_phone" 
              defaultValue={initialData.contact_phone || ""} 
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horario de Ingreso (Check-in)</label>
            <input 
              name="check_in_time" 
              type="time"
              required 
              defaultValue={initialData.check_in_time || "15:00"} 
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horario de Salida (Check-out)</label>
            <input 
              name="check_out_time" 
              type="time"
              required 
              defaultValue={initialData.check_out_time || "11:00"} 
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors" 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link de la Review</label>
          <input 
            name="google_review_link" 
            type="url"
            placeholder="https://g.page/r/... o TripAdvisor"
            defaultValue={initialData.google_review_link || ""} 
            className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500" 
          />
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Los huéspedes serán redirigidos a este link si dejan 3, 4 o 5 estrellas.</p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-4 bg-gray-900 dark:bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>

      {/* Survey Branding Preview Section */}
      <div className="bg-gray-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-8 shadow-sm rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
          {previewLogoUrl ? (
            <img src={previewLogoUrl} alt="Hotel Logo" className="h-16 w-auto object-contain" />
          ) : (
            <div className="h-16 w-16 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500">
              <UploadCloud size={28} />
            </div>
          )}
          
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{previewName || "Tu Hotel"}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">¿Qué te pareció tu estadía con nosotros?</p>
          
          <div className="flex gap-2 text-gray-200 dark:text-slate-700 pt-2">
             {[1,2,3,4,5].map(star => <span key={star} className="text-4xl hover:text-yellow-400 transition-colors cursor-pointer">★</span>)}
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 font-semibold uppercase tracking-wider">Vista Previa de la Encuesta</p>
      </div>
    </div>
  );
}
