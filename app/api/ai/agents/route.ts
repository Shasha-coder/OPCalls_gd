/**
 * GET/POST /api/ai/agents
 * 
 * List and create AI agents
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createAgent,
  getOrgAgents,
  getPromptTemplates,
  getAvailableVoices,
} from '@/lib/ai'

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
    .select('org_id, organizations(name, industry)')
    .eq('id', user.id)
    .single()
  
  if (!profile?.org_id) {
    return { orgId: null, orgName: null, error: 'No organization found' }
  }
  
  // Handle both array and object responses from Supabase join
  const orgs = profile.organizations as unknown
  const org = Array.isArray(orgs) ? orgs[0] : orgs
  const orgData = org as { name?: string; industry?: string } | null
  
  return { 
    orgId: profile.org_id,
    orgName: orgData?.name || 'My Business',
  }
}

// ============================================================================
// GET - List Agents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const action = request.nextUrl.searchParams.get('action')
    
    // Get templates
    if (action === 'templates') {
      const vertical = request.nextUrl.searchParams.get('vertical') as string | undefined
      const templates = await getPromptTemplates(vertical as any)
      return NextResponse.json({ templates })
    }
    
    // Get voices
    if (action === 'voices') {
      const voices = getAvailableVoices()
      return NextResponse.json({ voices })
    }
    
    // List agents
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true'
    const agents = await getOrgAgents(orgId, { includeInactive })
    
    return NextResponse.json({ agents })
    
  } catch (error) {
    console.error('Agents GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create Agent
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { orgId, orgName, error } = await getAuthenticatedOrg(request)
    
    if (!orgId || !orgName) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, type, vertical, voiceId, customInstructions, businessInfo } = body
    
    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }
    
    // Create agent
    const result = await createAgent({
      orgId,
      name,
      type: type || 'receptionist',
      vertical: vertical || 'generic',
      voiceId,
      customInstructions,
      businessInfo: {
        name: businessInfo?.name || orgName,
        industry: businessInfo?.industry || 'other',
        phone: businessInfo?.phone,
        address: businessInfo?.address,
        hours: businessInfo?.hours,
        customFields: businessInfo?.customFields,
      },
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      agent: result.agent,
    })
    
  } catch (error) {
    console.error('Agents POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
