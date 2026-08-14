import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { DEMO_ALERTS } from '@/utils/demoData';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  if (isDemo) {
    return NextResponse.json(DEMO_ALERTS);
  }

  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(DEMO_ALERTS);
    }

    const { data, error } = await supabase
      .from('alerts')
      .select(`
        id,
        message,
        created_at,
        status,
        guest_stays (
          room_number,
          guests ( name )
        )
      `)
      .eq('status', 'OPEN');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const alerts = (data || []).map((alert: any) => ({
      id: alert.id,
      guest_name: alert.guest_stays?.guests?.name || 'Unknown',
      room_number: alert.guest_stays?.room_number || 'Unknown',
      message: alert.message,
      created_at: alert.created_at,
      status: alert.status
    }));

    return NextResponse.json(alerts);
  } catch {
    return NextResponse.json(DEMO_ALERTS);
  }
}

export async function PATCH(request: Request) {
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing alert id' }, { status: 400 });

    if (isDemo) {
      return NextResponse.json({ success: true, message: 'Alerta demo resuelta' });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'RESOLVED' })
      .eq('id', id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
