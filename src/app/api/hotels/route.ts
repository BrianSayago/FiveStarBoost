import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    // Validate auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, contact_email, google_review_url } = body;

    if (!name || !contact_email || !google_review_url) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('hotels')
      .insert([
        {
          name,
          contact_email,
          google_review_link: google_review_url
        }
      ])
      .select('id, name')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating hotel:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
