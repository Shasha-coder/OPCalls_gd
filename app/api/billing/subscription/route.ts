/**
 * GET /api/billing/subscription
 * 
 * Get subscription info, entitlements, and recent invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBillingDashboard } from '@/lib/billing/utils'
import { getEntitlements } from '@/lib/billing/entitlements'
import { getSubscriptionInfo, getInvoiceHistory } from '@/lib/billing/customer-portal'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId')
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing org ID' },
        { status: 400 }
      )
    }
    
    // Verify user has access (simplified)
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
    
    // Get all billing data
    const [subscription, entitlements, invoices, dashboard] = await Promise.all([
      getSubscriptionInfo(orgId),
      getEntitlements(orgId),
      getInvoiceHistory(orgId, 10),
      getBillingDashboard(orgId),
    ])
    
    return NextResponse.json({
      subscription,
      entitlements,
      invoices,
      dashboard,
    })
    
  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
