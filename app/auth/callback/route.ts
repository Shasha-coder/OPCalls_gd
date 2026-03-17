import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (session?.user) {
      // Get user's setup status for smart routing
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      // Check if profile exists (should be auto-created by trigger)
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('org_id, onboarding_complete, organizations(setup_status)')
        .eq('id', session.user.id)
        .single()
      
      if (profile) {
        const org = profile.organizations as any
        const isComplete = profile.onboarding_complete
        const setupStatus = org?.setup_status
        
        // Route based on status
        if (setupStatus === 'active' && isComplete) {
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
        }
        
        if (setupStatus === 'suspended') {
          return NextResponse.redirect(new URL('/dashboard/billing?suspended=true', requestUrl.origin))
        }
        
        // Need to complete setup
        return NextResponse.redirect(new URL('/setup', requestUrl.origin))
      }
    }
  }

  // Default to setup for new users
  return NextResponse.redirect(new URL('/setup', requestUrl.origin))
}
