/**
 * GET/POST/PATCH /api/provisioning/onboarding
 * 
 * Manage onboarding state and trigger provisioning
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getOnboardingState,
  updateOnboardingStep,
  startOnboardingProvisioning,
  checkOnboardingProvisioning,
} from '@/lib/provisioning'

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
// GET - Get Onboarding State
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const action = request.nextUrl.searchParams.get('action')
    
    // Check provisioning status
    if (action === 'check-provisioning') {
      const result = await checkOnboardingProvisioning(orgId)
      return NextResponse.json(result)
    }
    
    // Get onboarding state
    const state = await getOnboardingState(orgId)
    
    return NextResponse.json({
      state: {
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        stepsCompleted: state.stepsCompleted,
        stepData: state.stepData,
        status: state.status,
        errorMessage: state.errorMessage,
        provisioningJobId: state.provisioningJobId,
      },
    })
    
  } catch (error) {
    console.error('Onboarding GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH - Update Onboarding Step
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const body = await request.json()
    const { step, stepName, stepData } = body
    
    if (typeof step !== 'number' || !stepName) {
      return NextResponse.json(
        { error: 'step (number) and stepName are required' },
        { status: 400 }
      )
    }
    
    const state = await updateOnboardingStep(orgId, step, stepName, stepData || {})
    
    return NextResponse.json({
      success: true,
      state: {
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        stepsCompleted: state.stepsCompleted,
        status: state.status,
      },
    })
    
  } catch (error) {
    console.error('Onboarding PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Start Provisioning
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { orgId, error } = await getAuthenticatedOrg(request)
    
    if (!orgId) {
      return NextResponse.json({ error }, { status: 401 })
    }
    
    const body = await request.json()
    const { action } = body
    
    if (action !== 'start-provisioning') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
    
    const result = await startOnboardingProvisioning(orgId)
    
    return NextResponse.json({
      success: true,
      jobId: result.jobId,
    })
    
  } catch (error) {
    console.error('Onboarding POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
