'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteStayButton({ stayId }: { stayId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('⚠️ ¿Estás totalmente seguro de eliminar a este huésped?\n\nEsta acción es permanentemente destructiva. Cancelará la estadía, borrará el registro y evitará que salgan los mails programados.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/stays?id=${stayId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Error al eliminar registro');
      
      // Refresh the server component smoothly
      router.refresh();
      
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la estadía');
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`p-2 rounded-lg transition-colors ${
        isDeleting 
          ? 'text-gray-400 bg-gray-100 dark:bg-slate-800 cursor-not-allowed'
          : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
      }`}
      aria-label="Eliminar estadía"
      title="Eliminar huésped permanentemente"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
