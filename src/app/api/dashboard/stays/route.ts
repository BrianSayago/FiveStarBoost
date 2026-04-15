import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const now = new Date().toISOString();

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

  const stays = data.map((stay: any) => ({
    id: stay.id,
    guest_name: stay.guests?.name || 'Unknown',
    room_number: stay.room_number,
    check_in_date: stay.check_in_date,
    check_out_date: stay.check_out_date
  }));

  return NextResponse.json(stays);
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  
  try {
    const body = await request.json();
    const { action, id, check_in_date, check_out_date } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID de la estadía' }, { status: 400 });
    }

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
  const supabase = createClient();
  
  try {
    // Determine ID from search params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID de la estadía a eliminar' }, { status: 400 });
    }

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
