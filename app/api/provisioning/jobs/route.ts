/**
 * GET/POST /api/provisioning/jobs
 * 
 * Manage provisioning jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  startProvisioningJob,
  getProvisioningStatus,
  getOrgJobs,
  retryJob,
  cancelJob,
} from '@/lib/provisioning'

// ============================================================================
// Auth Helper
// ============================================================================

async function getAuthenticatedOrg(request: NextRequest): Promise<{
  orgId: string | null
  userId: string | null
  error?: string
}> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { orgId: null, userId: null, error: 'Missing authorization' }
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { orgId: null, userId: null, error: 'Invalid token' }
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  
  if (!profile?.org_id) {
    return { orgId: null, userId: null, error: 'No organization found' }
  }
  
  return { orgId: profile.org_id, userId: user.id }
}

// ============================================================================
// GET - List Jobs or Get Job Status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const jobId = request.nextUrl.searchParams.get('jobId')
    
    // Get specific job status
    if (jobId) {
      const status = await getProvisioningStatus(jobId)
      
      if (!status) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
      
      // Verify job belongs to org
      if (status.job.orgId !== orgId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
      
      return NextResponse.json({
        job: status.job,
        steps: status.steps,
        progress: status.progress,
      })
    }
    
    // List jobs
    const statusFilter = request.nextUrl.searchParams.get('status') as any
    const jobType = request.nextUrl.searchParams.get('jobType')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')
    
    const jobs = await getOrgJobs(orgId, {
      status: statusFilter,
      jobType: jobType || undefined,
      limit,
    })
    
    return NextResponse.json({ jobs })
    
  } catch (error) {
    console.error('Provisioning GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Start Job or Perform Action
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { orgId, userId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const body = await request.json()
    const { action, jobId, jobType, inputParams } = body
    
    // Retry a failed job
    if (action === 'retry' && jobId) {
      const success = await retryJob(jobId)
      
      if (!success) {
        return NextResponse.json(
          { error: 'Cannot retry job' },
          { status: 400 }
        )
      }
      
      return NextResponse.json({ success: true })
    }
    
    // Cancel a job
    if (action === 'cancel' && jobId) {
      const success = await cancelJob(jobId)
      
      if (!success) {
        return NextResponse.json(
          { error: 'Cannot cancel job' },
          { status: 400 }
        )
      }
      
      return NextResponse.json({ success: true })
    }
    
    // Start new job
    if (!jobType) {
      return NextResponse.json(
        { error: 'jobType is required' },
        { status: 400 }
      )
    }
    
    const result = await startProvisioningJob({
      orgId,
      jobType,
      inputParams: inputParams || {},
      triggeredBy: 'user',
      triggeredByUserId: userId || undefined,
    })
    
    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      status: result.status,
    })
    
  } catch (error) {
    console.error('Provisioning POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
