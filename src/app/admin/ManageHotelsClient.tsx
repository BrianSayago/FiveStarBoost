'use client'

import { useState } from 'react'
import { createHotelOnboarding, deleteHotel, resetHotelPassword } from './actions'
import { StaffManagementModal } from './StaffManagementModal'

interface Hotel {
  id: string
  name: string
  contact_email: string
  total_stays?: number
  created_at?: string
}

export function ManageHotelsClient({ hotels }: { hotels: Hotel[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState<{id: string, name: string} | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    
    // Check if site url is set or inform user
    const result = await createHotelOnboarding(formData)
    
    if (!result.success) {
      setError(result.error || 'Error al crear hotel')
    } else {
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
    }
    
    setLoading(false)
  }

  const handleResetPassword = async (hotelId: string, email: string) => {
    const newPassword = window.prompt(`Ingresa una nueva contraseña manual para invalidar la anterior (${email}).\nMínimo 6 caracteres:`)
    if (!newPassword) return

    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    setLoading(true)
    setError(null)
    const result = await resetHotelPassword(hotelId, newPassword)
    
    if (!result.success) {
      setError(result.error || 'Error al restablecer contraseña')
    } else {
      setSuccess(true)
      alert("Contraseña actualizada exitosamente en la base de datos.")
    }
    setLoading(false)
  }

  // handleDelete remains mostly same, but I'll refine the prompt
  const handleDelete = async (hotelId: string, hotelName: string) => {
    const confirmName = window.prompt(`Para eliminar el hotel "${hotelName}" y TODOS sus usuarios/datos de forma VITALICIA, escriba el nombre del hotel abajo:`)
    if (confirmName !== hotelName) {
      if (confirmName !== null) alert("El nombre no coincide. Eliminación cancelada.")
      return
    }

    setLoading(true)
    setError(null)
    const result = await deleteHotel(hotelId)
    
    if (!result.success) {
      setError(result.error || 'Error al eliminar hotel')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
      
      {selectedHotel && (
        <StaffManagementModal 
          hotelId={selectedHotel.id}
          hotelName={selectedHotel.name}
          onClose={() => setSelectedHotel(null)}
        />
      )}

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
            Hotel creado e invitación enviada exitosamente. El usuario recibirá un correo para crear su clave.
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
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg">
              ⚠️ Al crear el hotel, se enviará automáticamente un link de invitación para configurar la contraseña original.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Preparando infraestructura...' : 'Crear Hotel e Invitar Administrador'}
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
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{hotel.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{hotel.contact_email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        {hotel.total_stays || 0} estancias
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleResetPassword(hotel.id, hotel.contact_email)}
                      disabled={loading}
                      className="flex-1 sm:flex-none text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
                    >
                      Clave
                    </button>
                    <button 
                      onClick={() => setSelectedHotel({id: hotel.id, name: hotel.name})}
                      disabled={loading}
                      className="flex-1 sm:flex-none text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-all disabled:opacity-50"
                    >
                      Equipo
                    </button>
                    <button 
                      onClick={() => handleDelete(hotel.id, hotel.name)}
                      disabled={loading}
                      className="flex-1 sm:flex-none text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-800 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg border border-red-100 dark:border-red-500/20 transition-all disabled:opacity-50"
                    >
                      Baja
                    </button>
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

