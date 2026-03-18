/**
 * POST /api/telephony/provision
 * 
 * Provision telephony infrastructure for an organization
 * Creates: Twilio Subaccount + SIP Trunk
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  provisionOrgTelephony,
  isOrgTelephonyProvisioned,
  verifyOrgTelephonyHealth,
} from '@/lib/telephony/subaccount-service'

// ============================================================================
// Auth Helper
// ============================================================================

async function getAuthenticatedOrg(request: NextRequest): Promise<{
  orgId: string | null
  orgName: string | null
  error?: string
}> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { orgId: null, orgName: null, error: 'Missing authorization' }
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { orgId: null, orgName: null, error: 'Invalid token' }
  }
  
  // Get user's org with org details
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('org_id, organizations(name)')
    .eq('id', user.id)
    .single()
  
  if (!profile?.org_id) {
    return { orgId: null, orgName: null, error: 'No organization found' }
  }
  
  // Handle both array and object responses from Supabase join
  const orgs = profile.organizations as unknown
  const org = Array.isArray(orgs) ? orgs[0] : orgs
  const orgData = org as { name?: string } | null
  
  return { 
    orgId: profile.org_id,
    orgName: orgData?.name || 'OPCalls Organization'
  }
}

// ============================================================================
// GET - Check Provisioning Status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const action = request.nextUrl.searchParams.get('action')
    
    if (action === 'health') {
      // Health check
      const health = await verifyOrgTelephonyHealth(orgId)
      return NextResponse.json(health)
    }
    
    // Status check
    const status = await isOrgTelephonyProvisioned(orgId)
    return NextResponse.json(status)
    
  } catch (error) {
    console.error('Provision GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Provision Telephony
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { orgId, orgName, error } = await getAuthenticatedOrg(request)
    
    if (!orgId || !orgName) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    // Check if already provisioned
    const status = await isOrgTelephonyProvisioned(orgId)
    
    if (status.hasSubaccount && status.hasSipTrunk && status.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Telephony already provisioned',
        status,
      })
    }
    
    // Provision telephony
    const result = await provisionOrgTelephony(orgId, orgName)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          partial: !!result.subaccount, // True if subaccount created but trunk failed
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      subaccount: {
        id: result.subaccount?.id,
        status: result.subaccount?.status,
      },
      sipTrunk: {
        id: result.sipTrunk?.id,
        terminationUri: result.sipTrunk?.termination_uri,
      },
    })
    
  } catch (error) {
    console.error('Provision POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
