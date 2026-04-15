'use client'

import { useState } from 'react'
import { createHotelOnboarding, deleteHotel, resetHotelPassword } from './actions'

interface Hotel {
  id: string
  name: string
  contact_email: string
  created_at: string
  total_stays?: number
}

interface Props {
  hotels: Hotel[]
}

export function ManageHotelsClient({ hotels }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    
    const result = await createHotelOnboarding(formData)
    
    if (!result.success) {
      setError(result.error || 'Failed to create hotel')
    } else {
      setSuccess(true)
      // Reset form
      ;(e.target as HTMLFormElement).reset()
    }
    
    setLoading(false)
  }

  const handleDelete = async (hotelId: string, hotelName: string) => {
    const confirmName = window.prompt(`Para eliminar este hotel de forma VITALICIA e irreversible, escriba el nombre "${hotelName}" abajo:`)
    if (confirmName !== hotelName) {
      if (confirmName !== null) alert("El nombre no coincide. Eliminación cancelada.")
      return
    }

    setLoading(true)
    setError(null)
    const result = await deleteHotel(hotelId)
    
    if (!result.success) {
      setError(result.error || 'Failed to delete hotel')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  const handleResetPassword = async (hotelId: string, email: string) => {
    const newPassword = window.prompt(`Ingresa una nueva contraseña para la cuenta del hotel (${email}).\nMínimo 6 caracteres:`)
    if (!newPassword) return

    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    setLoading(true)
    setError(null)
    const result = await resetHotelPassword(hotelId, newPassword)
    
    if (!result.success) {
      setError(result.error || 'Failed to reset password')
    } else {
      setSuccess(true)
      alert("Contraseña actualizada exitosamente.")
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Create Hotel Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Alta de Nuevo Hotel</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl border border-emerald-100 dark:border-emerald-500/20">
            Hotel y cuenta de usuario creados exitosamente. Ya pueden hacer log in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Hotel / Franquicia</label>
            <input 
              required
              name="name"
              type="text"
              placeholder="Ej. Grand Hotel Spa"
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-slate-700 transition-colors shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email del Administrador</label>
            <input 
              required
              name="email"
              type="email"
              placeholder="admin@grandhotel.com"
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-slate-700 transition-colors shadow-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Este correo se usará para iniciar sesión en el dashboard.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña de Acceso</label>
            <input 
              required
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-slate-700 transition-colors shadow-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta e infraestructura...' : 'Crear Hotel y Usuario'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Hotels */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 sm:p-8 flex flex-col h-full max-h-[800px]">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hoteles Configurados</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Listado de los clientes actuales del SaaS.</p>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {hotels.length === 0 ? (
            <div className="py-12 px-4 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-950 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
              No hay hoteles registrados aún.
            </div>
          ) : (
            hotels.map((hotel) => (
              <div key={hotel.id} className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{hotel.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{hotel.contact_email}</p>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2 bg-indigo-50 dark:bg-indigo-500/10 inline-block px-2 py-0.5 rounded-md">
                      {hotel.total_stays || 0} huéspedes históricos
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-950 px-2 py-1 rounded-md">
                      {new Date(hotel.created_at).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <div className="flex gap-2.5 mt-1">
                      <button 
                        onClick={() => handleResetPassword(hotel.id, hotel.contact_email)}
                        disabled={loading}
                        className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
                      >
                        Clave
                      </button>
                      <button 
                        onClick={() => handleDelete(hotel.id, hotel.name)}
                        disabled={loading}
                        className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
