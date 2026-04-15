'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    google_review_url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setErrorMsg(null); // Clear errors on typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validations
    if (!formData.name.trim() || !formData.contact_email.trim() || !formData.google_review_url.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (!isValidEmail(formData.contact_email)) {
      setErrorMsg('Ingresá un correo electrónico válido.');
      return;
    }

    if (!isValidUrl(formData.google_review_url)) {
      setErrorMsg('Ingresá una URL válida que comience con http:// o https://.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('No pudimos crear el hotel. Intentá nuevamente.');
      }

      const data = await response.json();
      
      // Redirect to dashboard on success
      router.push(`/dashboard?hotel_id=${data.id}`);
      
    } catch (err: any) {
      setErrorMsg(err.message || 'No pudimos crear el hotel. Intentá nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-10 transition-all duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Configuración inicial
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
            Completá los datos de tu hotel para comenzar a recibir feedback de tus huéspedes.
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Hotel Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre del hotel
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 text-gray-900"
              placeholder="Ej: Hotel Las Vistas"
              required
            />
          </div>

          {/* Contact Email */}
          <div>
            <label htmlFor="contact_email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Correo de contacto
            </label>
            <input
              type="email"
              id="contact_email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 text-gray-900"
              placeholder="contacto@hotellasvistas.com"
              required
            />
          </div>

          {/* Google Review URL */}
          <div>
            <label htmlFor="google_review_url" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Enlace de Google Reviews
            </label>
            <input
              type="url"
              id="google_review_url"
              name="google_review_url"
              value={formData.google_review_url}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 text-gray-900"
              placeholder="https://g.page/r/.../review"
              required
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Guardando...' : 'Crear hotel'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
