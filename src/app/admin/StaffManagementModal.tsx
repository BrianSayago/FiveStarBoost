'use client'

import { useState, useEffect } from 'react'
import { getHotelUsers, resetStaffPassword, deleteStaffUser } from './actions'
import { X, Mail, Trash2, Shield, User, Loader2 } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  hotel_role?: string
}

interface Props {
  hotelId: string
  hotelName: string
  onClose: () => void
}

export function StaffManagementModal({ hotelId, hotelName, onClose }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [hotelId])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await getHotelUsers(hotelId)
      setUsers(data as UserProfile[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (!confirm('¿Enviar email de restablecimiento de contraseña a este usuario?')) return
    
    setActionLoading(userId)
    const result = await resetStaffPassword(userId)
    if (result.success) {
      alert('Email enviado exitosamente.')
    } else {
      alert('Error: ' + result.error)
    }
    setActionLoading(null)
  }

  const handleDeleteUser = async (user: UserProfile) => {
    const confirmation = confirm(`¿Estás seguro de eliminar a ${user.email}? Esta acción eliminará su acceso y perfil de forma permanente.`)
    if (!confirmation) return

    setActionLoading(user.id)
    const result = await deleteStaffUser(user.id)
    if (result.success) {
      setUsers(users.filter(u => u.id !== user.id))
    } else {
      alert('Error: ' + result.error)
    }
    setActionLoading(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestionar Personal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{hotelName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="animate-spin mb-2" />
              <p>Cargando equipo...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No se encontraron usuarios vinculados.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      {user.hotel_role === 'OWNER' ? <Shield size={18} /> : <User size={18} />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {user.email}
                        {user.id === actionLoading && <Loader2 size={12} className="animate-spin text-indigo-500" />}
                      </p>
                      <div className="flex gap-2 items-center mt-0.5">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                          user.hotel_role === 'OWNER' 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {user.hotel_role === 'OWNER' ? 'Administrador' : 'Staff'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Sin perfil completo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      disabled={!!actionLoading}
                      title="Reiniciar contraseña por email"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      <Mail size={14} />
                      <span className="sm:hidden lg:inline">Reiniciar Clave</span>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={!!actionLoading}
                      title="Eliminar acceso permanentemente"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      <span className="sm:hidden lg:inline">Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed italic">
            <span className="font-bold text-gray-700 dark:text-gray-300">Nota de seguridad:</span> Al invitar o reiniciar la clave, el sistema genera un token seguro y lo envía al correo. El administrador del SaaS nunca tiene acceso a las contraseñas de los hoteles.
          </p>
        </div>
      </div>
    </div>
  )
}
