/**
 * OPCALLS Phase 7: Auto-Provisioning Service
 * 
 * Handles automatic setup after user signup:
 * - Organization creation (now handled by DB trigger)
 * - Setup status tracking
 * - Smart routing based on state
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export interface UserSetupStatus {
  userId: string
  orgId: string | null
  orgName: string | null
  setupStatus: 'pending' | 'onboarding' | 'provisioning' | 'active' | 'suspended'
  onboardingComplete: boolean
  hasAgent: boolean
  hasPhone: boolean
  hasSubscription: boolean
  isAdmin: boolean
  nextAction: SetupAction
}

export type SetupAction = 
  | 'complete_onboarding'
  | 'start_provisioning'
  | 'wait_for_provisioning'
  | 'add_payment'
  | 'dashboard'
  | 'suspended'

// ============================================================================
// Initialize
// ============================================================================

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================================================
// Get User Setup Status
// ============================================================================

export async function getUserSetupStatus(userId: string): Promise<UserSetupStatus> {
  const supabase = getSupabase()
  
  // Get profile with org
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      org_id,
      onboarding_complete,
      organizations (
        id,
        name,
        setup_status,
        subscription_tier
      )
    `)
    .eq('id', userId)
    .single()
  
  if (!profile || !profile.org_id) {
    // This shouldn't happen with the DB trigger, but handle gracefully
    return {
      userId,
      orgId: null,
      orgName: null,
      setupStatus: 'pending',
      onboardingComplete: false,
      hasAgent: false,
      hasPhone: false,
      hasSubscription: false,
      isAdmin: false,
      nextAction: 'complete_onboarding',
    }
  }
  
  const org = profile.organizations as any
  const orgId = profile.org_id
  
  // Check for agents
  const { count: agentCount } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_active', true)
  
  // Check for phone numbers
  const { count: phoneCount } = await supabase
    .from('phone_numbers')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active')
  
  // Check for subscription
  const { count: subCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .in('status', ['active', 'trialing'])
  
  // Check if admin
  const { count: adminCount } = await supabase
    .from('admin_users')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  // Check onboarding state
  const { data: onboardingState } = await supabase
    .from('onboarding_state')
    .select('status, provisioning_job_id')
    .eq('org_id', orgId)
    .single()
  
  const hasAgent = (agentCount || 0) > 0
  const hasPhone = (phoneCount || 0) > 0
  const hasSubscription = (subCount || 0) > 0 || org?.subscription_tier === 'free'
  const isAdmin = (adminCount || 0) > 0
  
  const setupStatus = org?.setup_status || 'pending'
  const onboardingComplete = profile.onboarding_complete || false
  
  // Determine next action
  let nextAction: SetupAction = 'dashboard'
  
  if (setupStatus === 'suspended') {
    nextAction = 'suspended'
  } else if (!onboardingComplete && !hasAgent) {
    nextAction = 'complete_onboarding'
  } else if (onboardingState?.status === 'provisioning') {
    nextAction = 'wait_for_provisioning'
  } else if (!hasAgent || !hasPhone) {
    nextAction = 'start_provisioning'
  } else if (!hasSubscription && org?.subscription_tier !== 'free') {
    nextAction = 'add_payment'
  } else {
    nextAction = 'dashboard'
  }
  
  return {
    userId,
    orgId,
    orgName: org?.name || null,
    setupStatus,
    onboardingComplete,
    hasAgent,
    hasPhone,
    hasSubscription,
    isAdmin,
    nextAction,
  }
}

// ============================================================================
// Get Redirect Path
// ============================================================================

export function getRedirectPath(status: UserSetupStatus): string {
  switch (status.nextAction) {
    case 'complete_onboarding':
      return '/setup'
    case 'start_provisioning':
      return '/setup'
    case 'wait_for_provisioning':
      return '/setup?step=6'
    case 'add_payment':
      return '/dashboard/billing?setup=true'
    case 'suspended':
      return '/dashboard/billing?suspended=true'
    case 'dashboard':
    default:
      return '/dashboard'
  }
}

// ============================================================================
// Update Setup Status
// ============================================================================

export async function updateOrgSetupStatus(
  orgId: string,
  status: 'pending' | 'onboarding' | 'provisioning' | 'active' | 'suspended'
): Promise<void> {
  const supabase = getSupabase()
  
  await supabase
    .from('organizations')
    .update({
      setup_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)
}

// ============================================================================
// Mark Onboarding Complete
// ============================================================================

export async function markOnboardingComplete(userId: string): Promise<void> {
  const supabase = getSupabase()
  
  // Get org
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .single()
  
  if (!profile?.org_id) return
  
  // Update profile
  await supabase
    .from('profiles')
    .update({
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
  
  // Update org
  await supabase
    .from('organizations')
    .update({
      setup_status: 'active',
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.org_id)
}

// ============================================================================
// Track Login
// ============================================================================

export async function trackLogin(userId: string): Promise<void> {
  const supabase = getSupabase()
  
  await supabase
    .from('profiles')
    .update({
      last_login_at: new Date().toISOString(),
      login_count: supabase.rpc('increment_login_count'),
    })
    .eq('id', userId)
}

// ============================================================================
// Audit Logging
// ============================================================================

export async function logAuditEvent(params: {
  actorId?: string
  actorType?: 'user' | 'admin' | 'system' | 'webhook'
  action: string
  resourceType?: string
  resourceId?: string
  orgId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  const supabase = getSupabase()
  
  await supabase.from('audit_log').insert({
    actor_id: params.actorId,
    actor_type: params.actorType || 'system',
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    org_id: params.orgId,
    metadata: params.metadata || {},
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  })
}
