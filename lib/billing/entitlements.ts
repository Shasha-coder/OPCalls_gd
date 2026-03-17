/**
 * OPCALLS Phase 2: Entitlements Engine
 * 
 * The entitlement engine is one of the most important backend services.
 * Every sensitive action must check entitlements before executing.
 * 
 * Entitlement checks depend on:
 * - Subscription status
 * - Plan limits
 * - Spend thresholds
 * - Fraud state
 * - Admin override
 * - Provider health (if necessary)
 */

import { createClient } from '@supabase/supabase-js'
import { 
  SubscriptionStatus, 
  isServiceEnabled, 
  isServiceLimited,
  isServiceBlocked 
} from './billing-state-machine'

// ============================================================================
// Types
// ============================================================================

export interface Entitlements {
  // Service access flags
  canReceiveCalls: boolean
  canMakeCalls: boolean
  canSendSms: boolean
  canEditSettings: boolean
  canAddNumbers: boolean
  canCreateAgents: boolean
  canAccessAnalytics: boolean
  canAccessApi: boolean
  
  // Limits
  maxMinutes: number
  maxNumbers: number
  maxAgents: number
  maxConcurrentCalls: number
  
  // Spend info
  softSpendLimitCents: number | null
  hardSpendLimitCents: number | null
  currentMonthSpendCents: number
  
  // Restriction info
  restrictionReason: string | null
  isRestricted: boolean
  isSuspended: boolean
  
  // Admin override
  hasAdminOverride: boolean
  adminOverrideReason: string | null
}

export interface EntitlementCheck {
  allowed: boolean
  reason?: string
  errorCode?: string
  suggestedAction?: string
}

export interface PlanLimits {
  includedMinutes: number
  includedNumbers: number
  includedAgents: number
  maxConcurrentCalls: number
  apiRequestsPerMinute: number
  maxActiveNumbers: number
  maxMonthlyTestCalls: number
  features: Record<string, unknown>
}

export interface UsageStats {
  totalMinutes: number
  totalNumbers: number
  totalAgents: number
  activeCalls: number
  currentMonthSpend: number
}

// ============================================================================
// Initialize Supabase
// ============================================================================

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================================================
// Core Entitlement Functions
// ============================================================================

/**
 * Get entitlements for an organization
 */
export async function getEntitlements(orgId: string): Promise<Entitlements | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('entitlements')
    .select('*')
    .eq('org_id', orgId)
    .single()
    
  if (error || !data) {
    console.error('Error fetching entitlements:', error)
    return null
  }
  
  return {
    canReceiveCalls: data.can_receive_calls,
    canMakeCalls: data.can_make_calls,
    canSendSms: data.can_send_sms,
    canEditSettings: data.can_edit_settings,
    canAddNumbers: data.can_add_numbers,
    canCreateAgents: data.can_create_agents,
    canAccessAnalytics: data.can_access_analytics,
    canAccessApi: data.can_access_api,
    maxMinutes: data.max_minutes,
    maxNumbers: data.max_numbers,
    maxAgents: data.max_agents,
    maxConcurrentCalls: data.max_concurrent_calls,
    softSpendLimitCents: data.soft_spend_limit_cents,
    hardSpendLimitCents: data.hard_spend_limit_cents,
    currentMonthSpendCents: data.current_month_spend_cents,
    restrictionReason: data.restriction_reason,
    isRestricted: data.restricted_at !== null,
    isSuspended: data.suspended_at !== null,
    hasAdminOverride: data.admin_override,
    adminOverrideReason: data.admin_override_reason,
  }
}

/**
 * Recalculate entitlements based on subscription status
 * Called when subscription status changes
 */
export async function recalculateEntitlements(orgId: string): Promise<void> {
  const supabase = getSupabase()
  
  // Get subscription with plan
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plans (*)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
    
  if (subError || !subscription) {
    console.error('Error fetching subscription for entitlement recalc:', subError)
    return
  }
  
  const status = subscription.status as SubscriptionStatus
  const plan = subscription.plans as PlanLimits | null
  
  // Determine entitlements based on status
  const entitlements = calculateEntitlementsForStatus(status, plan)
  
  // Upsert entitlements
  const { error: upsertError } = await supabase
    .from('entitlements')
    .upsert({
      org_id: orgId,
      ...entitlements,
      last_recalculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'org_id'
    })
    
  if (upsertError) {
    console.error('Error upserting entitlements:', upsertError)
  }
}

/**
 * Calculate entitlements based on subscription status and plan
 */
function calculateEntitlementsForStatus(
  status: SubscriptionStatus, 
  plan: PlanLimits | null
): Partial<Entitlements> & Record<string, unknown> {
  const serviceEnabled = isServiceEnabled(status)
  const serviceLimited = isServiceLimited(status)
  const serviceBlocked = isServiceBlocked(status)
  
  // Base entitlements for active/trialing
  if (serviceEnabled) {
    return {
      can_receive_calls: true,
      can_make_calls: true,
      can_send_sms: true,
      can_edit_settings: true,
      can_add_numbers: true,
      can_create_agents: true,
      can_access_analytics: true,
      can_access_api: true,
      max_minutes: plan?.includedMinutes || 0,
      max_numbers: plan?.maxActiveNumbers || 1,
      max_agents: plan?.includedAgents || 1,
      max_concurrent_calls: plan?.maxConcurrentCalls || 1,
      restriction_reason: null,
      restricted_at: null,
      suspended_at: null,
    }
  }
  
  // Limited entitlements for restricted status
  if (serviceLimited) {
    return {
      can_receive_calls: true, // Still receive inbound
      can_make_calls: false,   // Block outbound
      can_send_sms: false,     // Block SMS
      can_edit_settings: false, // Block config changes
      can_add_numbers: false,
      can_create_agents: false,
      can_access_analytics: true, // Keep analytics
      can_access_api: false,
      max_minutes: plan?.includedMinutes || 0,
      max_numbers: plan?.maxActiveNumbers || 1,
      max_agents: plan?.includedAgents || 1,
      max_concurrent_calls: 1, // Limit concurrent
      restriction_reason: 'Grace period expired - payment required',
      restricted_at: new Date().toISOString(),
    }
  }
  
  // Blocked entitlements for suspended/canceled
  if (serviceBlocked) {
    return {
      can_receive_calls: false,
      can_make_calls: false,
      can_send_sms: false,
      can_edit_settings: false,
      can_add_numbers: false,
      can_create_agents: false,
      can_access_analytics: status !== 'incomplete_expired', // Keep for suspended
      can_access_api: false,
      max_minutes: 0,
      max_numbers: 0,
      max_agents: 0,
      max_concurrent_calls: 0,
      restriction_reason: status === 'suspended' 
        ? 'Account suspended - payment required' 
        : 'Account canceled',
      suspended_at: status === 'suspended' ? new Date().toISOString() : null,
    }
  }
  
  // Default: draft/incomplete - minimal access
  return {
    can_receive_calls: false,
    can_make_calls: false,
    can_send_sms: false,
    can_edit_settings: true,
    can_add_numbers: false,
    can_create_agents: false,
    can_access_analytics: false,
    can_access_api: false,
    max_minutes: 0,
    max_numbers: 0,
    max_agents: 0,
    max_concurrent_calls: 0,
    restriction_reason: null,
  }
}

// ============================================================================
// Entitlement Check Functions
// ============================================================================

/**
 * Check if org can receive calls
 */
export async function checkCanReceiveCalls(orgId: string): Promise<EntitlementCheck> {
  const entitlements = await getEntitlements(orgId)
  
  if (!entitlements) {
    return {
      allowed: false,
      reason: 'Entitlements not found',
      errorCode: 'ENTITLEMENT_NOT_FOUND'
    }
  }
  
  if (entitlements.hasAdminOverride) {
    return { allowed: true }
  }
  
  if (!entitlements.canReceiveCalls) {
    return {
      allowed: false,
      reason: entitlements.restrictionReason || 'Inbound calls disabled',
      errorCode: 'ENTITLEMENT_BLOCKED',
      suggestedAction: 'Please update your payment method'
    }
  }
  
  return { allowed: true }
}

/**
 * Check if org can make outbound calls
 */
export async function checkCanMakeCalls(orgId: string): Promise<EntitlementCheck> {
  const entitlements = await getEntitlements(orgId)
  
  if (!entitlements) {
    return {
      allowed: false,
      reason: 'Entitlements not found',
      errorCode: 'ENTITLEMENT_NOT_FOUND'
    }
  }
  
  if (entitlements.hasAdminOverride) {
    return { allowed: true }
  }
  
  if (!entitlements.canMakeCalls) {
    return {
      allowed: false,
      reason: entitlements.restrictionReason || 'Outbound calls disabled',
      errorCode: 'ENTITLEMENT_BLOCKED',
      suggestedAction: 'Please update your payment method'
    }
  }
  
  // Check spend limits
  if (entitlements.hardSpendLimitCents && 
      entitlements.currentMonthSpendCents >= entitlements.hardSpendLimitCents) {
    return {
      allowed: false,
      reason: 'Spend limit reached',
      errorCode: 'ENTITLEMENT_SPEND_LIMIT',
      suggestedAction: 'Increase your spend limit or wait for next billing cycle'
    }
  }
  
  return { allowed: true }
}

/**
 * Check if org can add a new phone number
 */
export async function checkCanAddNumber(orgId: string): Promise<EntitlementCheck> {
  const entitlements = await getEntitlements(orgId)
  
  if (!entitlements) {
    return {
      allowed: false,
      reason: 'Entitlements not found',
      errorCode: 'ENTITLEMENT_NOT_FOUND'
    }
  }
  
  if (entitlements.hasAdminOverride) {
    return { allowed: true }
  }
  
  if (!entitlements.canAddNumbers) {
    return {
      allowed: false,
      reason: entitlements.restrictionReason || 'Cannot add numbers',
      errorCode: 'ENTITLEMENT_BLOCKED',
      suggestedAction: 'Please update your payment method'
    }
  }
  
  // Check number limit
  const usage = await getCurrentUsage(orgId)
  if (usage.totalNumbers >= entitlements.maxNumbers) {
    return {
      allowed: false,
      reason: `Number limit reached (${usage.totalNumbers}/${entitlements.maxNumbers})`,
      errorCode: 'ENTITLEMENT_LIMIT_REACHED',
      suggestedAction: 'Upgrade your plan for more numbers'
    }
  }
  
  return { allowed: true }
}

/**
 * Check if org can create a new agent
 */
export async function checkCanCreateAgent(orgId: string): Promise<EntitlementCheck> {
  const entitlements = await getEntitlements(orgId)
  
  if (!entitlements) {
    return {
      allowed: false,
      reason: 'Entitlements not found',
      errorCode: 'ENTITLEMENT_NOT_FOUND'
    }
  }
  
  if (entitlements.hasAdminOverride) {
    return { allowed: true }
  }
  
  if (!entitlements.canCreateAgents) {
    return {
      allowed: false,
      reason: entitlements.restrictionReason || 'Cannot create agents',
      errorCode: 'ENTITLEMENT_BLOCKED',
      suggestedAction: 'Please update your payment method'
    }
  }
  
  // Check agent limit
  const usage = await getCurrentUsage(orgId)
  if (usage.totalAgents >= entitlements.maxAgents) {
    return {
      allowed: false,
      reason: `Agent limit reached (${usage.totalAgents}/${entitlements.maxAgents})`,
      errorCode: 'ENTITLEMENT_LIMIT_REACHED',
      suggestedAction: 'Upgrade your plan for more agents'
    }
  }
  
  return { allowed: true }
}

/**
 * Check if org can access API
 */
export async function checkCanAccessApi(orgId: string): Promise<EntitlementCheck> {
  const entitlements = await getEntitlements(orgId)
  
  if (!entitlements) {
    return {
      allowed: false,
      reason: 'Entitlements not found',
      errorCode: 'ENTITLEMENT_NOT_FOUND'
    }
  }
  
  if (entitlements.hasAdminOverride) {
    return { allowed: true }
  }
  
  if (!entitlements.canAccessApi) {
    return {
      allowed: false,
      reason: 'API access not included in plan',
      errorCode: 'ENTITLEMENT_BLOCKED',
      suggestedAction: 'Upgrade to a plan with API access'
    }
  }
  
  return { allowed: true }
}

/**
 * Check if org has enough minutes remaining
 */
export async function checkMinutesAvailable(
  orgId: string, 
  requestedMinutes: number
): Promise<EntitlementCheck> {
  const entitlements = await getEntitlements(orgId)
  
  if (!entitlements) {
    return {
      allowed: false,
      reason: 'Entitlements not found',
      errorCode: 'ENTITLEMENT_NOT_FOUND'
    }
  }
  
  const usage = await getCurrentUsage(orgId)
  const remainingMinutes = entitlements.maxMinutes - usage.totalMinutes
  
  if (remainingMinutes < requestedMinutes) {
    // Note: In a real system, you might still allow with overage charges
    return {
      allowed: false,
      reason: `Insufficient minutes (${remainingMinutes} remaining, ${requestedMinutes} requested)`,
      errorCode: 'ENTITLEMENT_LIMIT_REACHED',
      suggestedAction: 'Upgrade your plan for more minutes'
    }
  }
  
  return { allowed: true }
}

/**
 * Check concurrent call limit
 */
export async function checkConcurrentCallLimit(orgId: string): Promise<EntitlementCheck> {
  const entitlements = await getEntitlements(orgId)
  
  if (!entitlements) {
    return {
      allowed: false,
      reason: 'Entitlements not found',
      errorCode: 'ENTITLEMENT_NOT_FOUND'
    }
  }
  
  const usage = await getCurrentUsage(orgId)
  
  if (usage.activeCalls >= entitlements.maxConcurrentCalls) {
    return {
      allowed: false,
      reason: `Concurrent call limit reached (${usage.activeCalls}/${entitlements.maxConcurrentCalls})`,
      errorCode: 'ENTITLEMENT_LIMIT_REACHED',
      suggestedAction: 'Wait for active calls to complete or upgrade your plan'
    }
  }
  
  return { allowed: true }
}

// ============================================================================
// Usage Functions
// ============================================================================

/**
 * Get current usage stats for an organization
 */
export async function getCurrentUsage(orgId: string): Promise<UsageStats> {
  const supabase = getSupabase()
  
  // Get current month date range
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Get minute usage for current month
  const { data: usageData } = await supabase
    .from('usage_records')
    .select('total_minutes, billed_cents')
    .eq('org_id', orgId)
    .gte('period_start', startOfMonth.toISOString())
    .single()
  
  // Get number count
  const { count: numberCount } = await supabase
    .from('phone_numbers')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active')
  
  // Get agent count
  const { count: agentCount } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active')
  
  // Get active calls (calls that started but haven't ended)
  const { count: activeCalls } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .is('ended_at', null)
  
  return {
    totalMinutes: usageData?.total_minutes || 0,
    totalNumbers: numberCount || 0,
    totalAgents: agentCount || 0,
    activeCalls: activeCalls || 0,
    currentMonthSpend: usageData?.billed_cents || 0,
  }
}

/**
 * Update spend for an organization
 */
export async function updateSpend(orgId: string, amountCents: number): Promise<void> {
  const supabase = getSupabase()
  
  // Update current month spend in entitlements
  await supabase.rpc('increment_spend', {
    org_id: orgId,
    amount: amountCents
  })
  
  // Check if soft limit hit
  const entitlements = await getEntitlements(orgId)
  if (entitlements?.softSpendLimitCents && 
      entitlements.currentMonthSpendCents >= entitlements.softSpendLimitCents) {
    // TODO: Send soft limit warning notification
    console.log(`Org ${orgId} hit soft spend limit`)
  }
}

// ============================================================================
// Admin Override Functions
// ============================================================================

/**
 * Set admin override on entitlements
 */
export async function setAdminOverride(
  orgId: string,
  override: boolean,
  reason: string,
  adminUserId: string
): Promise<void> {
  const supabase = getSupabase()
  
  await supabase
    .from('entitlements')
    .update({
      admin_override: override,
      admin_override_reason: override ? reason : null,
      admin_override_by: override ? adminUserId : null,
      admin_override_at: override ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
    
  // Log admin action
  await supabase
    .from('admin_audit_log')
    .insert({
      action: override ? 'ADMIN_OVERRIDE_ENABLED' : 'ADMIN_OVERRIDE_DISABLED',
      actor_id: adminUserId,
      target_org_id: orgId,
      details: { reason },
    })
}

// ============================================================================
// Entitlement Middleware
// ============================================================================

/**
 * Express/Next.js middleware for checking entitlements
 */
export function createEntitlementMiddleware(
  checkFn: (orgId: string) => Promise<EntitlementCheck>
) {
  return async (orgId: string): Promise<{ 
    allowed: boolean
    error?: { 
      code: string
      message: string 
      suggestedAction?: string 
    } 
  }> => {
    const check = await checkFn(orgId)
    
    if (!check.allowed) {
      return {
        allowed: false,
        error: {
          code: check.errorCode || 'ENTITLEMENT_BLOCKED',
          message: check.reason || 'Access denied',
          suggestedAction: check.suggestedAction,
        }
      }
    }
    
    return { allowed: true }
  }
}

// Pre-built middleware exports
export const requireCanReceiveCalls = createEntitlementMiddleware(checkCanReceiveCalls)
export const requireCanMakeCalls = createEntitlementMiddleware(checkCanMakeCalls)
export const requireCanAddNumber = createEntitlementMiddleware(checkCanAddNumber)
export const requireCanCreateAgent = createEntitlementMiddleware(checkCanCreateAgent)
export const requireCanAccessApi = createEntitlementMiddleware(checkCanAccessApi)
