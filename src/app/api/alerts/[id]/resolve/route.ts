import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  // In Next.js 13+ route handlers, dynamic params need to be awaited in newer versions 
  // but to be safe and compatible across 13/14 we can just use them if it doesn't error out.
  // Actually, in typical recent Next.js App Router, destructuring params directly works fine:
  const alertId = params.id;

  if (!alertId) {
    return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('alerts')
    .update({ 
      status: 'RESOLVED',
      resolved_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, alert: data });
}
