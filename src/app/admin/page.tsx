import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ManageHotelsClient } from './ManageHotelsClient'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export const metadata = { title: "Super Admin | Hotel SaaS" }

export default async function SuperAdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect("/login")

  // Super Admin Authorization check
  const adminEmails = process.env.SUPER_ADMIN_EMAILS
    ? process.env.SUPER_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
    : []

  if (!adminEmails.includes(user.email?.toLowerCase() || '')) {
    // If not super admin, just redirect to normal dashboard
    return redirect("/dashboard")
  }

  // Fetch existing hotels unconditionally
  const { data: hotelsData, error } = await supabase
    .from('hotels')
    .select('id, name, contact_email, created_at, guest_stays(count)')
    .order('created_at', { ascending: false })

  const mappedHotels = (hotelsData || []).map(h => ({
    id: h.id,
    name: h.name,
    contact_email: h.contact_email,
    created_at: h.created_at,
    total_stays: h.guest_stays?.[0]?.count || 0
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Dashboard
          </Link>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                Super Admin <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión B2B y alta centralizada de clientes (hoteles).</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ManageHotelsClient hotels={mappedHotels} />
        
      </div>
    </div>
  )
}
