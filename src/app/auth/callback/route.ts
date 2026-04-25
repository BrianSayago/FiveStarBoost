import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type') // invite or recovery
  const origin = requestUrl.origin

  console.log('Auth Callback Triggered:', { type, code: code ? 'Present' : 'Missing' })

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If we have a type from our redirect_to param, or if it's a known flows
      if (type === 'invite' || type === 'recovery' || request.url.includes('type=')) {
        console.log('Redirecting to Update Password')
        return NextResponse.redirect(`${origin}/auth/update-password`)
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    } else {
      console.error('Exchange Code Error:', error)
    }
  }

  // Fallback to login if something went wrong
  return NextResponse.redirect(`${origin}/login?message=Could not authenticate user`)
}
