'use client'

import { useState } from 'react'
import { login, forgotPassword } from './actions'
import { Star, ArrowUpRight, Mail, Lock, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string, view?: string }
}) {
  const [isLogin, setIsLogin] = useState(searchParams.view !== 'forgot')
  const [loading, setLoading] = useState(false)

  // This will manage loading state when either form submits
  const handleSubmit = (e: React.FormEvent) => {
    // Next.js formAction handles the actual submission, 
    // we just use this to trigger the frontend loader immediately.
    setLoading(true)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden font-sans">
      
      {/* Background gradients and animations */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full animate-pulse opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full opacity-60" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-600/20 blur-[100px] rounded-full opacity-40 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Core Card */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 shadow-2xl rounded-3xl p-8 transform transition-all duration-500 hover:border-slate-600/50 group">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center mb-10 transition-transform duration-500 group-hover:scale-105">
            <img 
              src="/logo-icon.png" 
              alt="Five Star Boost Logo" 
              className="h-20 sm:h-24 w-auto object-contain mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            />
            <h1 className="text-3xl font-black tracking-tight text-white mb-1">
              Five Star Boost
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">
              {isLogin ? 'Staff Portal' : 'Recovery Portal'}
            </p>
          </div>

          {/* Messages */}
          {searchParams?.message && (
            <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 backdrop-blur-sm text-sm ${
              searchParams.message.includes('Revisa tu correo') 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {searchParams.message.includes('Revisa tu correo') ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
              )}
              <p className="leading-snug">{searchParams.message}</p>
            </div>
          )}

          {/* Forms container with elegant transitions */}
          <div className="relative">
            {isLogin ? (
              <form onSubmit={handleSubmit} action={login} className="flex flex-col gap-5 animate-in slide-in-from-bottom-4 fade-in duration-500">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Email Corporativo</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                    <input
                      name="email"
                      type="email"
                      placeholder="ti@tu-hotel.com"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-semibold text-slate-300">Contraseña</label>
                    <button 
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      ¿La olvidaste?
                    </button>
                  </div>
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                    <input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 flex items-center justify-center w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden relative"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar al Dashboard'}
                </button>

              </form>
            ) : (
              <form onSubmit={handleSubmit} action={forgotPassword} className="flex flex-col gap-5 animate-in slide-in-from-right-8 fade-in duration-500">
                
                <p className="text-slate-300 text-sm leading-relaxed mb-2">
                  Te enviaremos un enlace mágico y seguro a tu bandeja de entrada para restablecer el acceso.
                </p>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Email Autorizado</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within/input:text-blue-400" />
                    <input
                      name="email"
                      type="email"
                      placeholder="tu-correo@hotel.com"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full py-3.5 bg-slate-100 hover:bg-white text-slate-900 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-900" /> : 'Enviar Enlace de Acceso'}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      setLoading(false)
                      setIsLogin(true)
                    }}
                    className="flex items-center justify-center w-full py-3.5 bg-transparent text-slate-400 hover:text-white rounded-xl font-medium transition-colors gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al login
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-xs font-medium mt-8 tracking-wide">
          &copy; {new Date().getFullYear()} Five Star Boost. Acceso exclusivo autorizado.
        </p>
      </div>

    </div>
  )
}
