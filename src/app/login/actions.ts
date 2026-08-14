'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Email o contraseña incorrectos')
  }

  // Clear demo mode if logging in with real credentials
  const cookieStore = cookies()
  cookieStore.delete('demo_mode')

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function enterDemoMode() {
  const cookieStore = cookies()
  cookieStore.set('demo_mode', 'true', {
    path: '/',
    httpOnly: false, // allow client-side checks if needed
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function exitDemoMode() {
  const cookieStore = cookies()
  cookieStore.delete('demo_mode')
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string

  if (!email) {
    redirect('/login?view=forgot&message=Debes proveer un email')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`
  })

  if (error) {
    console.error('Password reset error:', error)
    redirect('/login?view=forgot&message=Error al enviar el correo. Revisa tu dirección.')
  }

  redirect('/login?message=Revisa tu correo para restablecer tu contraseña.')
}

export async function logout() {
  const cookieStore = cookies()
  cookieStore.delete('demo_mode')
  
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
