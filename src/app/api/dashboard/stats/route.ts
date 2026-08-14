import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { cookies } from 'next/headers';
import { getDemoStats } from '@/utils/demoData';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  const supabase = createClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {
    // offline or demo
  }

  if (isDemo || !user) {
    return NextResponse.json(getDemoStats());
  }

  const adminSupabase = createAdminClient();
  const hotelId = user.app_metadata.hotel_id || user.user_metadata?.hotel_id;

  const adminEmails = process.env.SUPER_ADMIN_EMAILS
    ? process.env.SUPER_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
    : [];
  const is_super_admin = user && adminEmails.includes(user.email?.toLowerCase() || '');

  try {
    const [
      staysRes,
      posRes,
      negRes,
      { count: alerts_open },
      { count: alerts_resolved },
      { data: hotelData }
    ] = await Promise.all([
      supabase.from('guest_stays')
        .select('id, check_in_date, check_out_date, room_number, guests(name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('survey_responses')
        .select('id, rating, stars, feedback_text, created_at, guest_stays(room_number, guests(name, email))', { count: 'exact' })
        .in('rating', ['EXCELLENT', 'GOOD'])
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('survey_responses')
        .select('id, rating, stars, feedback_text, created_at, guest_stays(room_number, guests(name, email))', { count: 'exact' })
        .in('rating', ['NEEDS_IMPROVEMENT', 'HELP_NEEDED'])
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'RESOLVED'),
      hotelId ? adminSupabase.from('hotels').select('name').eq('id', hotelId).single() : Promise.resolve({ data: null })
    ]);

    return NextResponse.json({
      total_stays: staysRes.count || 0,
      positive_feedback_count: posRes.count || 0,
      negative_feedback_count: negRes.count || 0,
      alerts_open: alerts_open || 0,
      alerts_resolved: alerts_resolved || 0,
      recent_stays: staysRes.data || [],
      recent_positive: posRes.data || [],
      recent_negative: negRes.data || [],
      hotel_name: hotelData?.name || '',
      is_super_admin
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
