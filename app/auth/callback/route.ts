import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()

    try {
      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

      if (!error) {
        // Handle different redirect logic based on verification type
        if (type === 'recovery') {
          // For password reset, redirect to homepage with success message
          return NextResponse.redirect(`${origin}/?message=password_reset_success`)
        } else {
          // For email verification, redirect to dashboard or specified next URL
          return NextResponse.redirect(`${origin}${next}`)
        }
      } else {
        console.error('Auth verification error:', error)
        // Redirect to homepage with error parameter on verification failure
        return NextResponse.redirect(`${origin}/?error=verification_failed`)
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      // Redirect to homepage with error parameter on unexpected error
      return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
    }
  }

  // Redirect to homepage if no token_hash or type provided
  return NextResponse.redirect(`${origin}/?error=invalid_auth_callback`)
}