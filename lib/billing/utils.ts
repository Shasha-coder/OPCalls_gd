/**
 * OPCALLS Phase 2: Billing Utilities
 * 
 * Shared utilities for billing operations
 */

import { createClient } from '@supabase/supabase-js'

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
// Types
// ============================================================================

export interface BillingEventParams {
  orgId?: string
  subscriptionId?: string
  eventType: string
  eventSource: 'stripe' | 'system' | 'admin'
  stripeEventId?: string
  stripeInvoiceId?: string
  stripePaymentIntentId?: string
  previousStatus?: string
  newStatus?: string
  amountCents?: number
  description?: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Event Logging
// ============================================================================

/**
 * Log a billing event for audit trail
 */
export async function logBillingEvent(params: BillingEventParams): Promise<string> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('billing_events')
    .insert({
      org_id: params.orgId,
      subscription_id: params.subscriptionId,
      event_type: params.eventType,
      event_source: params.eventSource,
      stripe_event_id: params.stripeEventId,
      stripe_invoice_id: params.stripeInvoiceId,
      stripe_payment_intent_id: params.stripePaymentIntentId,
      previous_status: params.previousStatus,
      new_status: params.newStatus,
      amount_cents: params.amountCents,
      description: params.description,
      metadata: params.metadata || {},
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .select('id')
    .single()
    
  if (error) {
    console.error('Error logging billing event:', error)
    throw error
  }
  
  return data.id
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format cents to dollars string
 */
export function formatCentsToDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

/**
 * Format a date for display
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Format a datetime for display
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format billing interval
 */
export function formatBillingInterval(interval: 'month' | 'year'): string {
  return interval === 'month' ? 'Monthly' : 'Yearly'
}

// ============================================================================
// Calculation Utilities
// ============================================================================

/**
 * Calculate days remaining in period
 */
export function daysRemainingInPeriod(periodEnd: string | Date): number {
  const end = new Date(periodEnd)
  const now = new Date()
  const diffMs = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

/**
 * Calculate overage amount
 */
export function calculateOverage(
  used: number,
  included: number,
  overageRate: number // cents per unit
): number {
  const overageUnits = Math.max(0, used - included)
  return overageUnits * overageRate
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate Stripe webhook signature
 */
export function isValidStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // This is handled by Stripe SDK, but included for reference
  try {
    const Stripe = require('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    stripe.webhooks.constructEvent(payload, signature, secret)
    return true
  } catch {
    return false
  }
}

/**
 * Validate plan code
 */
export async function isValidPlanCode(planCode: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const { data } = await supabase
    .from('plans')
    .select('id')
    .eq('slug', planCode)
    .eq('is_active', true)
    .single()
    
  return !!data
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Billing error class
 */
export class BillingError extends Error {
  code: string
  retryable: boolean
  
  constructor(code: string, message: string, retryable: boolean = false) {
    super(message)
    this.name = 'BillingError'
    this.code = code
    this.retryable = retryable
  }
}

/**
 * Get error details from error code
 */
export async function getErrorDetails(code: string): Promise<{
  message: string
  severity: string
  retryable: boolean
} | null> {
  const supabase = getSupabase()
  
  const { data } = await supabase
    .from('error_codes')
    .select('message, severity, retryable')
    .eq('slug', code)
    .single()
    
  return data
}

// ============================================================================
// Idempotency
// ============================================================================

/**
 * Check if an event has already been processed
 */
export async function isEventProcessed(
  provider: string,
  externalId: string
): Promise<boolean> {
  const supabase = getSupabase()
  
  const { data } = await supabase
    .from('billing_events')
    .select('id')
    .eq('event_source', provider)
    .eq('stripe_event_id', externalId)
    .single()
    
  return !!data
}

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(
  action: string,
  orgId: string,
  ...params: string[]
): string {
  const timestamp = Math.floor(Date.now() / 1000 / 60) // 1-minute buckets
  return `${action}:${orgId}:${params.join(':')}:${timestamp}`
}

// ============================================================================
// Spend Tracking
// ============================================================================

/**
 * Check if spend is approaching limit
 */
export function checkSpendThreshold(
  current: number,
  soft: number | null,
  hard: number | null
): 'ok' | 'soft_warning' | 'hard_limit' {
  if (hard && current >= hard) {
    return 'hard_limit'
  }
  if (soft && current >= soft) {
    return 'soft_warning'
  }
  return 'ok'
}

/**
 * Record spend for an organization
 */
export async function recordSpend(
  orgId: string,
  amountCents: number,
  description: string
): Promise<void> {
  const supabase = getSupabase()
  
  // Update entitlements current spend
  await supabase.rpc('increment_spend', {
    p_org_id: orgId,
    p_amount: amountCents
  })
  
  // Also log as billing event
  await logBillingEvent({
    orgId,
    eventType: 'spend.recorded',
    eventSource: 'system',
    amountCents,
    description,
  })
}

// ============================================================================
// Plan Comparison
// ============================================================================

/**
 * Compare two plans for upgrade/downgrade
 */
export function comparePlans(
  currentPlan: { monthly_price_cents: number; included_minutes: number },
  newPlan: { monthly_price_cents: number; included_minutes: number }
): 'upgrade' | 'downgrade' | 'same' {
  if (newPlan.monthly_price_cents > currentPlan.monthly_price_cents) {
    return 'upgrade'
  }
  if (newPlan.monthly_price_cents < currentPlan.monthly_price_cents) {
    return 'downgrade'
  }
  return 'same'
}

// ============================================================================
// Dashboard Data Helpers
// ============================================================================

/**
 * Get billing dashboard data for an organization
 */
export async function getBillingDashboard(orgId: string): Promise<{
  subscription: {
    status: string
    planName: string
    amount: number
    interval: string
    periodEnd: string
    cancelAtPeriodEnd: boolean
  } | null
  usage: {
    minutesUsed: number
    minutesIncluded: number
    percentUsed: number
  }
  spend: {
    currentMonth: number
    softLimit: number | null
    hardLimit: number | null
    thresholdStatus: 'ok' | 'soft_warning' | 'hard_limit'
  }
  recentInvoices: Array<{
    id: string
    number: string
    amount: number
    status: string
    date: string
  }>
}> {
  const supabase = getSupabase()
  
  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      status,
      billing_interval,
      current_period_end,
      cancel_at_period_end,
      plans (
        name,
        monthly_price_cents,
        annual_price_cents,
        included_minutes
      )
    `)
    .eq('org_id', orgId)
    .single()
  
  // Get entitlements
  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('*')
    .eq('org_id', orgId)
    .single()
  
  // Get current month usage
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const { data: usage } = await supabase
    .from('usage_records')
    .select('total_minutes')
    .eq('org_id', orgId)
    .gte('period_start', monthStart.toISOString())
    .single()
  
  // Get recent invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, stripe_invoice_number, total_cents, status, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  const plan = subscription?.plans as {
    name: string
    monthly_price_cents: number
    annual_price_cents: number
    included_minutes: number
  } | null
  
  const minutesUsed = usage?.total_minutes || 0
  const minutesIncluded = plan?.included_minutes || 0
  const currentSpend = entitlements?.current_month_spend_cents || 0
  const softLimit = entitlements?.soft_spend_limit_cents
  const hardLimit = entitlements?.hard_spend_limit_cents
  
  return {
    subscription: subscription ? {
      status: subscription.status,
      planName: plan?.name || 'Unknown',
      amount: subscription.billing_interval === 'year' 
        ? (plan?.annual_price_cents || 0)
        : (plan?.monthly_price_cents || 0),
      interval: subscription.billing_interval,
      periodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    } : null,
    usage: {
      minutesUsed,
      minutesIncluded,
      percentUsed: calculateUsagePercentage(minutesUsed, minutesIncluded),
    },
    spend: {
      currentMonth: currentSpend,
      softLimit,
      hardLimit,
      thresholdStatus: checkSpendThreshold(currentSpend, softLimit, hardLimit),
    },
    recentInvoices: (invoices || []).map(inv => ({
      id: inv.id,
      number: inv.stripe_invoice_number || '',
      amount: inv.total_cents,
      status: inv.status,
      date: inv.created_at,
    })),
  }
}
