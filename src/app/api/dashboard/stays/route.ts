import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { DEMO_ACTIVE_STAYS } from '@/utils/demoData';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  if (isDemo) {
    return NextResponse.json(DEMO_ACTIVE_STAYS);
  }

  const supabase = createClient();
  const now = new Date().toISOString();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(DEMO_ACTIVE_STAYS);
    }

    const { data, error } = await supabase
      .from('guest_stays')
      .select(`
        id,
        room_number,
        check_in_date,
        check_out_date,
        guests ( name )
      `)
      .lte('check_in_date', now)
      .gte('check_out_date', now)
      .neq('status', 'CHECKED_OUT')
      .neq('status', 'COMPLETED');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stays = (data || []).map((stay: any) => ({
      id: stay.id,
      guest_name: stay.guests?.name || 'Unknown',
      room_number: stay.room_number,
      check_in_date: stay.check_in_date,
      check_out_date: stay.check_out_date
    }));

    return NextResponse.json(stays);
  } catch {
    return NextResponse.json(DEMO_ACTIVE_STAYS);
  }
}

export async function PATCH(request: Request) {
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  try {
    const body = await request.json();
    const { action, id, check_in_date, check_out_date } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID de la estadía' }, { status: 400 });
    }

    if (isDemo) {
      return NextResponse.json({ success: true, message: 'Operación demo exitosa' });
    }

    const supabase = createClient();

    if (action === 'checkout') {
      const { error } = await supabase
        .from('guest_stays')
        .update({
          status: 'CHECKED_OUT',
          checked_out_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'edit') {
      if (!check_in_date || !check_out_date) {
        return NextResponse.json({ error: 'Faltan fechas' }, { status: 400 });
      }

      const { error } = await supabase
        .from('guest_stays')
        .update({
          check_in_date,
          check_out_date
        })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (err: any) {
    console.error('PATCH Stay error:', err);
    return NextResponse.json({ error: err.message || 'Error en el servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID de la estadía a eliminar' }, { status: 400 });
    }

    if (isDemo) {
      return NextResponse.json({ success: true, message: 'Estadía demo eliminada' });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('guest_stays')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return NextResponse.json({ success: true, message: 'Estadía eliminada de la base de datos' });
  } catch (err: any) {
    console.error('DELETE Stay error:', err);
    return NextResponse.json({ error: err.message || 'Error en el servidor al intentar borrar' }, { status: 500 });
  }
}
