'use client';

import { useEffect, useState } from 'react';
import { DetailModal } from '@/components/dashboard/DetailModal';
import { SentimentChart } from '@/components/dashboard/SentimentChart';
import { AlertPopup } from '@/components/dashboard/AlertPopup';
import { logout } from '@/app/login/actions';
import { EditStayModal } from '@/components/dashboard/EditStayModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SubscriptionProvider } from '@/components/providers/SubscriptionProvider';
import { TrialBanner } from '@/components/billing/TrialBanner';
import { PaymentWallModal } from '@/components/billing/PaymentWallModal';
import { Star, ArrowUpRight } from 'lucide-react';

// --- Types ---
interface DashboardStats {
  total_stays: number;
  positive_feedback_count: number;
  negative_feedback_count: number;
  alerts_open: number;
  alerts_resolved: number;
  recent_stays: any[];
  recent_positive: any[];
  recent_negative: any[];
  hotel_name?: string;
  is_super_admin?: boolean;
}

interface Alert {
  id: string;
  guest_name: string;
  room_number: string;
  message: string;
  created_at: string;
  status: 'OPEN' | 'RESOLVED';
}

interface Stay {
  id: string;
  guest_name: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<'stays' | 'positive' | 'negative'>('stays');
  const [modalData, setModalData] = useState<any[]>([]);

  const [editStayModalOpen, setEditStayModalOpen] = useState(false);
  const [editingStay, setEditingStay] = useState<Stay | null>(null);

  const handleOpenModal = (type: 'stays' | 'positive' | 'negative') => {
    if (!stats) return;
    setModalType(type);
    if (type === 'stays') {
      setModalTitle('Historial de Check-ins');
      setModalData(stats.recent_stays || []);
    } else if (type === 'positive') {
      setModalTitle('Experiencias Positivas (3 a 5 Estrellas)');
      setModalData(stats.recent_positive || []);
    } else {
      setModalTitle('Experiencias Negativas (1 a 2 Estrellas)');
      setModalData(stats.recent_negative || []);
    }
    setModalOpen(true);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, alertsRes, staysRes] = await Promise.all([
          fetch(`/api/dashboard/stats`, { cache: 'no-store' }),
          fetch(`/api/dashboard/alerts`, { cache: 'no-store' }),
          fetch(`/api/dashboard/stays`, { cache: 'no-store' })
        ]);

        if (!statsRes.ok || !alertsRes.ok || !staysRes.ok) {
          throw new Error('Error al cargar datos del dashboard');
        }

        const statsData = await statsRes.json();
        const alertsData = await alertsRes.json();
        const staysData = await staysRes.json();

        setStats(statsData);
        setAlerts(alertsData);
        setStays(staysData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleEditStay = (stay: Stay) => {
    setEditingStay(stay);
    setEditStayModalOpen(true);
  };

  const handleSaveEditStay = async (checkIn: string, checkOut: string) => {
    if (!editingStay) return;
    try {
      const res = await fetch(`/api/dashboard/stays`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', id: editingStay.id, check_in_date: checkIn, check_out_date: checkOut })
      });
      if (!res.ok) throw new Error('Error al actualizar estadía');
      
      setStays(stays.map(s => 
        s.id === editingStay.id ? { ...s, check_in_date: checkIn, check_out_date: checkOut } : s
      ));
      setEditStayModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    }
  };

  const handleCheckoutStay = async (stayId: string) => {
    if (!window.confirm('¿Confirmar salida (check-out) del huésped?')) return;
    try {
      const res = await fetch(`/api/dashboard/stays`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', id: stayId })
      });
      if (!res.ok) throw new Error('Error al marcar salida');
      
      setStays(stays.filter(s => s.id !== stayId));
    } catch (err: any) {
      alert(err.message || 'Error al procesar salida');
    }
  };

  const handleDeleteStay = async (stayId: string) => {
    if (!window.confirm('⚠️ ¿Estás totalmente seguro de eliminar a este huésped?\n\nEsta acción es permanentemente destructiva. Cancelará la estadía, borrará el registro y evitará que salgan los mails programados.')) return;
    try {
      const res = await fetch(`/api/dashboard/stays?id=${stayId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar registro');
      
      setStays(stays.filter(s => s.id !== stayId));
      if (stats) {
        setStats({
          ...stats,
          total_stays: Math.max(0, stats.total_stays - 1)
        });
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/dashboard/alerts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId })
      });
      if (!res.ok) throw new Error('Error al resolver alerta');
      
      setAlerts(alerts.filter(a => a.id !== alertId));
      if (stats) {
        setStats({
          ...stats,
          alerts_open: Math.max(0, stats.alerts_open - 1)
        });
      }
    } catch (err) {
      console.error(err);
      alert('No se pudo resolver la alerta');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
           <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
           <div className="text-slate-500 dark:text-slate-400 font-medium tracking-wide text-sm">Cargando ecosistema...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur px-6 py-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-medium shadow-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative transition-colors duration-500 bg-slate-100 dark:bg-[#07090E]">
      
      {/* Premium Background Orbs (Decorative) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] max-w-[500px] aspect-square rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] md:blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] max-w-[400px] aspect-square rounded-full bg-blue-500/5 dark:bg-cyan-500/10 blur-[100px] md:blur-[120px]"></div>
      </div>

      <div className="relative p-4 sm:p-6 lg:p-8 z-10 w-full">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

          {/* Trial Banner — shows during active trial only */}
          <TrialBanner />

          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4 pb-2">
            <div className="w-full lg:w-auto">
              <div className="flex items-center gap-4 mb-2">
                {/* Brand Logo - Scaled specifically for Dashboard Navbar */}
                <img 
                  src="/logo-icon.png" 
                  alt="Five Star Boost Icon" 
                  className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-md shrink-0"
                />
                
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center flex-wrap gap-2 sm:gap-3">
                  Centro de Operaciones
                  {stats?.hotel_name && (
                     <span className="text-xs sm:text-sm font-medium px-3 py-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 shadow-sm translate-y-[-2px]">
                       {stats.hotel_name}
                     </span>
                  )}
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                <span className="font-bold tracking-tight text-slate-700 dark:text-slate-300 mr-2">Five Star Boost</span> 
                | Optimize Your Hotel Reputation
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/40 dark:bg-slate-900/40 p-1.5 rounded-2xl backdrop-blur-xl border border-white/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full lg:w-auto mt-2 lg:mt-0 max-w-full">
              <button 
                onClick={() => window.location.href = `/dashboard/import`}
                className="hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300"
              >
                Importar CSV
              </button>
              
              <button 
                onClick={() => window.location.href = `/dashboard/new`}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-indigo-500/25 border border-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0"
              >
                + Registrar Ingreso
              </button>

              <div className="hidden sm:block h-6 w-px bg-slate-300/50 dark:bg-slate-700 mx-1"></div>
              
              {stats?.is_super_admin && (
                <button 
                  onClick={() => window.location.href = `/admin`}
                  className="hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  SaaS
                </button>
              )}

              <ThemeToggle />

              <button 
                onClick={() => window.location.href = `/dashboard/settings`}
                className="hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 p-2 rounded-xl text-sm font-medium transition-all duration-300"
                title="Configuración"
              >
                <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <form action={logout}>
                <button 
                  type="submit"
                  className="hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-2 rounded-xl text-sm font-medium transition-all duration-300"
                  title="Cerrar sesión"
                >
                  <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <StatCard title="Total Check-ins" interactive onClick={() => handleOpenModal('stays')} value={stats?.total_stays || 0} />
            <StatCard title="Exp. Positivas" interactive onClick={() => handleOpenModal('positive')} value={stats?.positive_feedback_count || 0} gradientClass="from-emerald-400 to-teal-500" badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20" />
            <StatCard title="Exp. Negativas" interactive onClick={() => handleOpenModal('negative')} value={stats?.negative_feedback_count || 0} gradientClass="from-rose-400 to-orange-500" badgeColor="bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20" />
            
            {/* Alertas Card - Special Glow if open */}
            <div className={`p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 dark:border-slate-700/50 backdrop-blur-xl relative overflow-hidden transition-all duration-500 ${
              (stats?.alerts_open || 0) > 0 
                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-500/30 ring-1 ring-amber-500/20' 
                : 'bg-white/70 dark:bg-slate-900/50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Alertas Activas</div>
                {(stats?.alerts_open || 0) > 0 && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <div className={`text-4xl font-black tracking-tight ${
                (stats?.alerts_open || 0) > 0 
                  ? 'text-transparent bg-clip-text bg-gradient-to-br from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400' 
                  : 'text-slate-800 dark:text-white'
              }`}>
                {stats?.alerts_open || 0}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Active Stays Section */}
            <section className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 dark:border-slate-700/50 p-6 sm:p-8 flex flex-col transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Huéspedes actuales</h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  {stays.length} alojados
                </span>
              </div>
              
              {stays.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 opacity-50">
                  <span className="text-sm font-medium text-slate-500">Ningún ingreso registrado hoy.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {stays.map((stay) => (
                    <div key={stay.id} className="group p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default relative overflow-hidden">
                      {/* Accent Line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-center justify-between z-10 relative">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {stay.guest_name}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                            <span className="bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                               {new Date(stay.check_in_date).toLocaleDateString('es-AR', {day: '2-digit', month: 'short'})}
                            </span>
                            <svg className="w-3 h-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            <span className="bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                               {new Date(stay.check_out_date).toLocaleDateString('es-AR', {day: '2-digit', month: 'short'})}
                            </span>
                          </div>
                          
                          {/* Hover Actions */}
                          <div className="mt-3 flex gap-2 opacity-100 md:opacity-0 md:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            <button 
                              onClick={() => handleEditStay(stay)} 
                              className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleCheckoutStay(stay.id)} 
                              className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-50 dark:bg-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Check-out
                            </button>
                            <button 
                              onClick={() => handleDeleteStay(stay.id)} 
                              className="text-[11px] font-bold text-rose-500 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Borrar
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end pl-4 border-l border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">Hab.</div>
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xl font-black text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                            {stay.room_number}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Alerts Section */}
            <section className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 dark:border-slate-700/50 p-6 sm:p-8 flex flex-col transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Alertas recientes</h2>
              </div>
              
              {alerts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8">
                   <div className="flex flex-col items-center opacity-40 grayscale">
                     <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                     </div>
                     <span className="text-sm font-semibold text-slate-500">Todo bajo control</span>
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-5 rounded-2xl border transition-all duration-300 ${alert.status === 'OPEN' ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200/50 dark:border-amber-500/20' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/50'} relative group`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`px-2.5 py-1 rounded-lg text-xs font-bold leading-none flex items-center ${alert.status === 'OPEN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                            {alert.status === 'OPEN' ? 'ABIERTA' : 'RESUELTA'}
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            <span className="opacity-50 font-normal mr-1">Hab.</span>
                            {alert.room_number} <span className="mx-2 text-slate-300 dark:text-slate-600">|</span> <span className="text-slate-700 dark:text-slate-300">{alert.guest_name}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed bg-white/50 dark:bg-slate-950/30 p-3 rounded-xl border border-white/60 dark:border-slate-700/30">{alert.message}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {new Date(alert.created_at).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'})}
                        </div>
                        {alert.status === 'OPEN' && (
                          <button 
                            onClick={() => resolveAlert(alert.id)}
                            className="text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-300 px-4 py-2 rounded-xl shadow-md cursor-pointer hover:scale-105 active:scale-95"
                          >
                            Cerrar caso
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            </div>

            <div className="lg:col-span-1">
               <SentimentChart positive={stats?.positive_feedback_count || 0} negative={stats?.negative_feedback_count || 0} />
            </div>

          </div>

        </div>
      </div>

      <DetailModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalTitle} 
        type={modalType} 
        data={modalData} 
      />

      <EditStayModal
        isOpen={editStayModalOpen}
        onClose={() => setEditStayModalOpen(false)}
        stay={editingStay}
        onSave={handleSaveEditStay}
      />

      <AlertPopup />

      {/* Payment Wall — renders fullscreen when trial expired */}
      <PaymentWallModal />

    </div>
  );
}

// ─── Active hotel resolution ──────────────────────────────────────────────────
// Reads active_hotel_id from localStorage, passes it to SubscriptionProvider.
// For multi-hotel users, this comes from a hotel-switcher UI (future feature).
export default function DashboardPage() {
  const [hotelId, setHotelId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('active_hotel_id');
    setHotelId(stored);
  }, []);

  return (
    <SubscriptionProvider hotelId={hotelId}>
      <DashboardContent />
    </SubscriptionProvider>
  );
}

// --- Helper Component ---
function StatCard({ 
  title, value, badgeColor = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 ring-slate-200 dark:ring-slate-700", gradientClass = "from-slate-800 to-slate-500 dark:from-white dark:to-slate-400", onClick, interactive = false
}: { 
  title: string; value: number | string; badgeColor?: string; gradientClass?: string; onClick?: () => void; interactive?: boolean;
}) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white/70 dark:bg-slate-900/50 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 dark:border-slate-700/50 backdrop-blur-xl flex flex-col relative overflow-hidden transition-all duration-300 ease-out ${interactive ? 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:border-indigo-400/50 dark:hover:border-indigo-500/50 group' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ring-1 ring-inset ${badgeColor}`}>
          {title}
        </div>
        {interactive && (
          <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 border border-slate-200 dark:border-slate-700">
            <svg className="w-4 h-4 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
      <div>
        <div className={`text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br ${gradientClass}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
