/**
 * GET /api/admin/overview
 * 
 * Admin dashboard overview - stats and recent activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
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
  
  // Check if admin
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: admin } = await adminSupabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  return { isAdmin: !!admin, userId: user.id }
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
    
    // Get counts
    const [
      { count: totalOrgs },
      { count: activeOrgs },
      { count: totalUsers },
      { count: totalAgents },
      { count: totalPhones },
      { count: activeSubscriptions },
      { count: pendingJobs },
      { count: failedJobs },
    ] = await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('setup_status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('phone_numbers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).in('status', ['active', 'trialing']),
      supabase.from('provisioning_jobs').select('*', { count: 'exact', head: true }).in('status', ['pending', 'running']),
      supabase.from('provisioning_jobs').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    ])
    
    // Recent signups (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentSignups } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at, organizations(name, setup_status)')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Recent audit events
    const { data: recentActivity } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Failed provisioning jobs
    const { data: failedProvisioningJobs } = await supabase
      .from('provisioning_jobs')
      .select('id, org_id, job_type, last_error, created_at, organizations(name)')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Subscription breakdown
    const { data: subscriptionBreakdown } = await supabase
      .from('subscriptions')
      .select('status')
      .then(result => {
        const breakdown: Record<string, number> = {}
        result.data?.forEach(sub => {
          breakdown[sub.status] = (breakdown[sub.status] || 0) + 1
        })
        return { data: breakdown }
      })
    
    return NextResponse.json({
      stats: {
        totalOrgs: totalOrgs || 0,
        activeOrgs: activeOrgs || 0,
        totalUsers: totalUsers || 0,
        totalAgents: totalAgents || 0,
        totalPhones: totalPhones || 0,
        activeSubscriptions: activeSubscriptions || 0,
        pendingJobs: pendingJobs || 0,
        failedJobs: failedJobs || 0,
      },
      subscriptionBreakdown,
      recentSignups: recentSignups || [],
      recentActivity: recentActivity || [],
      failedJobs: failedProvisioningJobs || [],
    })
    
  } catch (error) {
    console.error('Admin overview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
