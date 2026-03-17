/**
 * POST /api/billing/checkout
 * 
 * Create a Stripe Checkout session for new subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCheckoutSession } from '@/lib/billing/customer-portal'

// Middleware to verify user is authenticated and belongs to org
async function verifyAccess(request: NextRequest, orgId: string) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing authorization header' }
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { authorized: false, error: 'Invalid token' }
  }
  
  // Check user belongs to org
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
    
  if (profile?.org_id !== orgId) {
    return { authorized: false, error: 'Access denied' }
  }
  
  return { authorized: true, userId: user.id }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, planCode, billingInterval } = body
    
    if (!orgId || !planCode) {
      return NextResponse.json(
        { error: 'Missing required parameters: orgId and planCode' },
        { status: 400 }
      )
    }
    
    // Verify access
    const access = await verifyAccess(request, orgId)
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: 401 }
      )
    }
    
    // Create checkout session
    const result = await createCheckoutSession({
      orgId,
      planCode,
      billingInterval: billingInterval || 'month',
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ url: result.url })
    
  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
