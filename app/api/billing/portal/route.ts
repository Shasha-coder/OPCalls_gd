/**
 * POST /api/billing/portal
 * 
 * Create a Stripe Customer Portal session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPortalSession } from '@/lib/billing/customer-portal'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, returnUrl } = body
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing org ID' },
        { status: 400 }
      )
    }
    
    // Verify user has access to org (simplified - use middleware in production)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Create portal session
    const result = await createPortalSession({
      orgId,
      returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ url: result.url })
    
  } catch (error) {
    console.error('Portal API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
