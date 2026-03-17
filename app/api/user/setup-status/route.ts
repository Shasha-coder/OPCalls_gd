/**
 * GET /api/user/setup-status
 * 
 * Get current user's setup status for smart routing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserSetupStatus, getRedirectPath } from '@/lib/auto-provision'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    const status = await getUserSetupStatus(user.id)
    const redirectPath = getRedirectPath(status)
    
    return NextResponse.json({
      ...status,
      redirectPath,
    })
    
  } catch (error) {
    console.error('Setup status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
