/**
 * GET/PATCH /api/admin/organizations
 * 
 * Admin: List and manage organizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAuditEvent } from '@/lib/auto-provision'

async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string; role?: string }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false }
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return { isAdmin: false }
  }
  
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: admin } = await adminSupabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  return { isAdmin: !!admin, userId: user.id, role: admin?.role }
}

export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const orgId = searchParams.get('orgId')
    
    // Single org detail
    if (orgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select(`
          *,
          profiles (id, full_name, email, is_org_owner, last_login_at),
          agents (id, name, type, is_active),
          phone_numbers (id, e164, friendly_name, status),
          subscriptions (id, status, plan_id, current_period_start, current_period_end),
          entitlements (minutes_limit, minutes_used, agents_limit, agents_used)
        `)
        .eq('id', orgId)
        .single()
      
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      
      return NextResponse.json({ organization: org })
    }
    
    // List orgs
    let query = supabase
      .from('organizations')
      .select(`
        id, name, setup_status, subscription_tier, created_at,
        profiles!inner (id, full_name, email),
        subscriptions (status)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,profiles.email.ilike.%${search}%`)
    }
    
    if (status) {
      query = query.eq('setup_status', status)
    }
    
    const { data: organizations, count, error } = await query
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      organizations: organizations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
    
  } catch (error) {
    console.error('Admin orgs GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { isAdmin, userId, role } = await verifyAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const body = await request.json()
    const { orgId, action, data } = body
    
    if (!orgId || !action) {
      return NextResponse.json({ error: 'orgId and action required' }, { status: 400 })
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    switch (action) {
      case 'update_status': {
        if (!['pending', 'onboarding', 'provisioning', 'active', 'suspended'].includes(data?.status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        
        await supabase
          .from('organizations')
          .update({ setup_status: data.status, updated_at: new Date().toISOString() })
          .eq('id', orgId)
        
        await logAuditEvent({
          actorId: userId,
          actorType: 'admin',
          action: 'org_status_updated',
          resourceType: 'organization',
          resourceId: orgId,
          metadata: { newStatus: data.status },
        })
        
        return NextResponse.json({ success: true })
      }
      
      case 'update_tier': {
        if (!['free', 'starter', 'growth', 'enterprise'].includes(data?.tier)) {
          return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
        }
        
        await supabase
          .from('organizations')
          .update({ subscription_tier: data.tier, updated_at: new Date().toISOString() })
          .eq('id', orgId)
        
        await logAuditEvent({
          actorId: userId,
          actorType: 'admin',
          action: 'org_tier_updated',
          resourceType: 'organization',
          resourceId: orgId,
          metadata: { newTier: data.tier },
        })
        
        return NextResponse.json({ success: true })
      }
      
      case 'suspend': {
        // Only super_admin can suspend
        if (role !== 'super_admin' && role !== 'admin') {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        
        await supabase
          .from('organizations')
          .update({ setup_status: 'suspended', updated_at: new Date().toISOString() })
          .eq('id', orgId)
        
        await logAuditEvent({
          actorId: userId,
          actorType: 'admin',
          action: 'org_suspended',
          resourceType: 'organization',
          resourceId: orgId,
          metadata: { reason: data?.reason },
        })
        
        return NextResponse.json({ success: true })
      }
      
      case 'reactivate': {
        await supabase
          .from('organizations')
          .update({ setup_status: 'active', updated_at: new Date().toISOString() })
          .eq('id', orgId)
        
        await logAuditEvent({
          actorId: userId,
          actorType: 'admin',
          action: 'org_reactivated',
          resourceType: 'organization',
          resourceId: orgId,
        })
        
        return NextResponse.json({ success: true })
      }
      
      case 'add_minutes': {
        const minutes = parseInt(data?.minutes)
        if (isNaN(minutes) || minutes <= 0) {
          return NextResponse.json({ error: 'Invalid minutes' }, { status: 400 })
        }
        
        // Get current entitlements
        const { data: entitlement } = await supabase
          .from('entitlements')
          .select('minutes_limit')
          .eq('org_id', orgId)
          .single()
        
        if (entitlement) {
          await supabase
            .from('entitlements')
            .update({
              minutes_limit: (entitlement.minutes_limit || 0) + minutes,
              updated_at: new Date().toISOString(),
            })
            .eq('org_id', orgId)
        }
        
        await logAuditEvent({
          actorId: userId,
          actorType: 'admin',
          action: 'minutes_added',
          resourceType: 'organization',
          resourceId: orgId,
          metadata: { minutes },
        })
        
        return NextResponse.json({ success: true })
      }
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Admin orgs PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
