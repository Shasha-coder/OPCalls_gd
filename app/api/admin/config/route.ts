/**
 * GET/PATCH /api/admin/config
 * 
 * Admin: System configuration management
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
    
    const { data: config } = await supabase
      .from('system_config')
      .select('*')
    
    // Transform to key-value object
    const configMap: Record<string, any> = {}
    config?.forEach(item => {
      try {
        configMap[item.key] = JSON.parse(item.value)
      } catch {
        configMap[item.key] = item.value
      }
    })
    
    return NextResponse.json({ config: configMap })
    
  } catch (error) {
    console.error('Admin config GET error:', error)
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
    
    // Only super_admin can modify config
    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const body = await request.json()
    const { key, value, description } = body
    
    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 })
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Upsert config
    const { error } = await supabase
      .from('system_config')
      .upsert({
        key,
        value: JSON.stringify(value),
        description,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
    
    if (error) {
      throw error
    }
    
    await logAuditEvent({
      actorId: userId,
      actorType: 'admin',
      action: 'config_updated',
      resourceType: 'system_config',
      resourceId: key,
      metadata: { newValue: value },
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Admin config PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
