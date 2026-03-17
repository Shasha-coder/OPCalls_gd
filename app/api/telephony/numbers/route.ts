/**
 * GET/POST /api/telephony/numbers
 * 
 * Search and purchase phone numbers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  searchAvailableNumbers,
  purchaseNumber,
  getOrgPhoneNumbers,
} from '@/lib/telephony/number-service'

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
  
  // Get user's org
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
// GET - Search or List Numbers
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    
    // List owned numbers
    if (action === 'list' || !action) {
      const numbers = await getOrgPhoneNumbers(orgId, {
        status: searchParams.get('status') || undefined,
        includeReleased: searchParams.get('includeReleased') === 'true',
      })
      
      return NextResponse.json({ numbers })
    }
    
    // Search available numbers
    if (action === 'search') {
      const result = await searchAvailableNumbers({
        orgId,
        country: searchParams.get('country') || 'US',
        type: (searchParams.get('type') as 'local' | 'toll_free' | 'mobile') || 'local',
        areaCode: searchParams.get('areaCode') || undefined,
        contains: searchParams.get('contains') || undefined,
        locality: searchParams.get('locality') || undefined,
        region: searchParams.get('region') || undefined,
        limit: parseInt(searchParams.get('limit') || '20', 10),
      })
      
      return NextResponse.json({
        numbers: result.numbers,
        cached: result.cached,
        cacheExpiresAt: result.cacheExpiresAt,
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Numbers GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Purchase Number
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const body = await request.json()
    const { phoneNumber, friendlyName, agentId } = body
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }
    
    // Validate E.164 format
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use E.164 format (e.g., +15551234567)' },
        { status: 400 }
      )
    }
    
    const result = await purchaseNumber({
      orgId,
      phoneNumber,
      friendlyName,
      agentId,
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      phoneNumber: result.phoneNumber,
    })
    
  } catch (error) {
    console.error('Numbers POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
