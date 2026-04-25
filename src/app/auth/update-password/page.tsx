'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    // Manually intercept hash fragment to ensure reliable session creation
    // Specially important for generated links that bypass PKCE and rely on implicit flow.
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // Remove leading '#' and parse as URLSearchParams
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data }) => {
            if (data?.session?.user) {
              setUserEmail(data.session.user.email || null)
            }
            setCheckingSession(false)
            // Optional: Clean URL to prevent token shoulder-surfing
            window.history.replaceState(null, '', window.location.pathname)
          })
        return; // Early return since we handled it manually
      }
    }

    // 1. Get initial session normally if no hash is present
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserEmail(data.user.email || null)
      setCheckingSession(false)
    })

    // 2. Listen for normal auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userEmail) {
      setError('No hay una sesión válida para cambiar la contraseña. Asegúrate de venir desde tu correo.')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard?message=Password actualizado correctamente')
    }
    setLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen items-center justify-center">
        <p className="text-slate-500">Verificando enlace de seguridad...</p>
      </div>
    )
  }

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Generar mi Clave</h1>
        
        {userEmail ? (
          <div className="mb-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Por favor, ingresá tu nueva contraseña para la cuenta:
            </p>
            <p className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg inline-block border border-indigo-100 dark:border-indigo-500/20">
              {userEmail}
            </p>
          </div>
        ) : (
          <p className="text-sm text-red-500 mb-6">No se detectó un usuario válido.</p>
        )}

        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="password">
              Nueva Contraseña
            </label>
            <input
              id="password"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg mt-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? 'Guardando...' : 'Establecer Contraseña'}
          </button>

          {error && (
            <p className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-center text-sm rounded-lg border border-red-100 dark:border-red-500/20">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
