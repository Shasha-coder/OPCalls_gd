/**
 * GET/POST/DELETE /api/ai/bindings
 * 
 * Manage phone number to agent bindings
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  bindPhoneToAgent,
  unbindPhone,
  getOrgBindings,
  getPhoneBinding,
} from '@/lib/ai'

// ============================================================================
// Auth Helper
// ============================================================================

async function getAuthenticatedOrg(request: NextRequest): Promise<{
  orgId: string | null
  error?: string
}> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { orgId: null, error: 'Missing authorization' }
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { orgId: null, error: 'Invalid token' }
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  
  if (!profile?.org_id) {
    return { orgId: null, error: 'No organization found' }
  }
  
  return { orgId: profile.org_id }
}

// ============================================================================
// GET - List Bindings
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const phoneNumberId = request.nextUrl.searchParams.get('phoneNumberId')
    
    // Get binding for specific phone number
    if (phoneNumberId) {
      const binding = await getPhoneBinding(orgId, phoneNumberId)
      return NextResponse.json({ binding })
    }
    
    // List all bindings
    const bindings = await getOrgBindings(orgId)
    return NextResponse.json({ bindings })
    
  } catch (error) {
    console.error('Bindings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create Binding
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const body = await request.json()
    const { phoneNumberId, agentId, bindingType } = body
    
    if (!phoneNumberId || !agentId) {
      return NextResponse.json(
        { error: 'phoneNumberId and agentId are required' },
        { status: 400 }
      )
    }
    
    const result = await bindPhoneToAgent(
      orgId,
      phoneNumberId,
      agentId,
      bindingType || 'inbound'
    )
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      binding: result.binding,
    })
    
  } catch (error) {
    console.error('Bindings POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Remove Binding
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const phoneNumberId = request.nextUrl.searchParams.get('phoneNumberId')
    
    if (!phoneNumberId) {
      return NextResponse.json(
        { error: 'phoneNumberId is required' },
        { status: 400 }
      )
    }
    
    const result = await unbindPhone(orgId, phoneNumberId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Bindings DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
