import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import SettingsFormClient from "./SettingsFormClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { DEMO_HOTEL } from "@/utils/demoData";

export const metadata = { title: "Configuración | Hotel SaaS" };

export default async function SettingsPage() {
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  let hotel = null;

  if (isDemo) {
    hotel = DEMO_HOTEL;
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
      hotel = DEMO_HOTEL;
    } else {
      let hotelId = user.app_metadata?.hotel_id || user.user_metadata?.hotel_id;

      const adminEmails = process.env.SUPER_ADMIN_EMAILS
        ? process.env.SUPER_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
        : [];
      const isSuperAdmin = user && adminEmails.includes(user.email?.toLowerCase() || '');
      
      const adminSupabase = createAdminClient();

      if (!hotelId) {
        if (isSuperAdmin) {
          const { data: firstHotel } = await adminSupabase.from('hotels').select('id').limit(1).single();
          if (firstHotel) hotelId = firstHotel.id;
        }

        if (!hotelId) {
          hotel = DEMO_HOTEL;
        }
      }

      if (hotelId) {
        const { data: hotelData } = await adminSupabase
          .from("hotels")
          .select("id, name, contact_email, contact_phone, check_in_time, check_out_time, google_review_link, logo_url")
          .eq("id", hotelId)
          .single();

        hotel = hotelData || DEMO_HOTEL;
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Dashboard
          </Link>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Configuración del Hotel
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personaliza tu perfil, logo y enlaces de reseñas.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <SettingsFormClient initialData={hotel} />
        
      </div>
    </div>
  );
}
