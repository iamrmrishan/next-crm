import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user to validate session exists
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      // If no valid session, redirect to homepage anyway
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // Sign out the user
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('Error signing out:', signOutError)
      // Even if signOut fails, redirect to homepage for security
    }
    
    // Redirect to homepage after logout
    return NextResponse.redirect(new URL('/', request.url))
    
  } catch (error) {
    console.error('Logout error:', error)
    // Always redirect to homepage on any error for security
    return NextResponse.redirect(new URL('/', request.url))
  }
}