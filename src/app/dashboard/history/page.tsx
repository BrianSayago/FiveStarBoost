import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, History, User } from 'lucide-react';
import { HistorySearch } from './HistorySearch';
import { DeleteStayButton } from '@/components/dashboard/DeleteStayButton';
import { cookies } from 'next/headers';
import { getDemoHistoryStays } from '@/utils/demoData';

export const metadata = { title: "Historial | Hotel SaaS" };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const query = searchParams?.query || '';
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  let sortedStays: any[] = [];

  if (isDemo) {
    sortedStays = getDemoHistoryStays(query);
  } else {
    const supabase = createClient();
    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    } catch {
      // ignore
    }

    if (!user) {
      sortedStays = getDemoHistoryStays(query);
    } else {
      // Fetch from Supabase using Postgres text Search on guests
      let req = supabase
        .from('guest_stays')
        .select(`
          id, check_in_date, check_out_date, room_number, status, 
          guests!inner(name, email),
          survey_responses(rating, stars)
        `)
        .order('check_out_date', { ascending: false })
        .limit(300);

      if (query) {
        req = req.or(`name.ilike.%${query}%,email.ilike.%${query}%`, { foreignTable: 'guests' });
      }

      const { data: stays, error } = await req;

      if (error) {
        console.error("Error fetching history:", error);
      }

      sortedStays = stays ? [...stays].sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
        if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
        return new Date(b.check_out_date).getTime() - new Date(a.check_out_date).getTime();
      }) : [];
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <History className="w-6 h-6 text-gray-400" /> Historial de Huéspedes
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Busca y revisa huéspedes pasados y actuales.</p>
            </div>
            
            <HistorySearch />
            
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Huésped</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hab.</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fechas</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Encuesta</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                {sortedStays.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-6 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron resultados para tu búsqueda.
                    </td>
                  </tr>
                ) : (
                  sortedStays.map((stay: any) => {
                    // Extract guest data carefully since inner join returns array or object depending on structure
                    const guestData = Array.isArray(stay.guests) ? stay.guests[0] : stay.guests;
                    const surveyData = Array.isArray(stay.survey_responses) ? stay.survey_responses[0] : stay.survey_responses;

                    return (
                      <tr key={stay.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                               <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                               <div className="font-semibold text-gray-900 dark:text-white text-sm">{guestData?.name || 'Desconocido'}</div>
                               <div className="text-xs text-gray-500 dark:text-gray-400">{guestData?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="font-medium text-gray-900 dark:text-slate-200">{stay.room_number || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                           {new Date(stay.check_in_date).toLocaleDateString('es-AR', {day:'2-digit', month:'short'})} <span className="text-gray-400 mx-1">→</span> {new Date(stay.check_out_date).toLocaleDateString('es-AR', {day:'2-digit', month:'short', year: 'numeric'})}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           {stay.status === 'ACTIVE' ? (
                             <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                               ACTIVO
                             </span>
                           ) : stay.status === 'CHECKED_OUT' || stay.status === 'COMPLETED' ? (
                             <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
                               PASADO
                             </span>
                           ) : (
                             <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
                               {stay.status}
                             </span>
                           )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                           {surveyData ? (
                             <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  surveyData.rating === 'EXCELLENT' || surveyData.rating === 'GOOD' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                                }`}>
                                   {surveyData.stars ? '⭐'.repeat(surveyData.stars) : surveyData.rating}
                                </span>
                             </div>
                           ) : (
                             <span className="text-xs text-gray-400 dark:text-gray-500 italic">Sin respuesta</span>
                           )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                           <DeleteStayButton stayId={stay.id} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
        
      </div>
    </div>
  );
}
