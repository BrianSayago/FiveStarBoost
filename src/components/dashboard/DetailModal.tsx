import { X, User, ArrowRight, Star } from 'lucide-react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'stays' | 'positive' | 'negative';
  data: any[];
}

export function DetailModal({ isOpen, onClose, title, type, data }: DetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mostrando los registros más recientes</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/50">
          {data.length === 0 ? (
            <div className="py-12 px-4 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
              <div className="w-14 h-14 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <User className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="font-medium text-gray-900 dark:text-gray-200">Aún no hay datos</p>
              <p className="text-sm mt-1">Todavía no hay registros disponibles para mostrar en esta categoría.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.map((item, i) => {
                // Safely extract guest name and room
                const guestName = Array.isArray(item.guests) ? item.guests[0]?.name : (item.guests?.name || 'Huésped Desconocido');
                const guestExtracted = Array.isArray(item.guest_stays?.guests) ? item.guest_stays.guests[0]?.name : item.guest_stays?.guests?.name;
                const finalName = type === 'stays' ? guestName : (guestExtracted || 'Huésped Desconocido');
                const finalRoom = type === 'stays' ? item.room_number : item.guest_stays?.room_number;

                return (
                <li key={i} className="p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md dark:shadow-none dark:hover:border-slate-700 transition-all rounded-xl">
                  {type === 'stays' && (
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                           <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{finalName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.guests?.email || 'Sin correo'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2 border border-slate-200 dark:border-slate-700">
                          Hab. {finalRoom || 'S/N'}
                        </span>
                        <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 gap-1.5 bg-gray-50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                          <span>{new Date(item.check_in_date).toLocaleDateString('es-AR', {day: 'numeric', month: 'short'})}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                          <span>{new Date(item.check_out_date).toLocaleDateString('es-AR', {day: 'numeric', month: 'short'})}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {(type === 'positive' || type === 'negative') && (
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.rating === 'EXCELLENT' || item.rating === 'GOOD' 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10' 
                              : 'bg-red-50 dark:bg-red-500/10'
                          }`}>
                            <Star className={`w-5 h-5 ${
                            item.rating === 'EXCELLENT' || item.rating === 'GOOD' 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-red-500 dark:text-red-400'
                            }`} fill="currentColor" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{finalName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] tracking-widest font-bold ${
                                item.rating === 'EXCELLENT' || item.rating === 'GOOD' 
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
                                  : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300'
                              }`}>
                                {item.stars ? '★'.repeat(item.stars) : (item.rating === 'EXCELLENT' ? '★★★★★' : 
                                 item.rating === 'GOOD' ? '★★★★' : 
                                 item.rating === 'NEEDS_IMPROVEMENT' ? '★★' : 
                                 item.rating === 'HELP_NEEDED' ? '★' : item.rating)}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                Hab. {finalRoom || 'S/N'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                          {new Date(item.created_at).toLocaleDateString('es-AR', {day: 'numeric', month: 'short'})}
                        </span>
                      </div>
                      {item.feedback_text ? (
                        <div className="relative pl-4 mt-3">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                          <p className="text-sm text-gray-700 dark:text-slate-300 italic">
                            &quot;{item.feedback_text}&quot;
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-slate-500 mt-2 italic pl-1">Sin comentario adicional.</p>
                      )}
                    </div>
                  )}
                </li>
              )})}
            </ul>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          {type === 'stays' ? (
            <button
              onClick={() => window.location.href = '/dashboard/history'}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start"
            >
              Ver historial completo <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:block"></div>
          )}
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Cerrar Detalles
          </button>
        </div>

      </div>
    </div>
  );
}
