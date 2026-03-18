/**
 * OPCALLS Phase 2: Customer Portal
 * 
 * Stripe Customer Portal integration for:
 * - Subscription management
 * - Payment method updates
 * - Invoice history
 * - Plan changes
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getEntitlements } from '@/lib/billing/entitlements'

// ============================================================================
// Initialize Clients
// ============================================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// Types
// ============================================================================

interface CreateCheckoutParams {
  orgId: string
  planCode: string
  billingInterval: 'month' | 'year'
  successUrl: string
  cancelUrl: string
}

interface CreatePortalParams {
  orgId: string
  returnUrl: string
}

interface SubscriptionInfo {
  status: string
  planName: string
  planCode: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  amount: number
  interval: string
  paymentMethod?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
}

// ============================================================================
// Checkout Session Creation
// ============================================================================

/**
 * Create a Stripe Checkout session for new subscriptions
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<{ url: string } | { error: string }> {
  const { orgId, planCode, billingInterval, successUrl, cancelUrl } = params
  
  try {
    // Get the plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', planCode)
      .eq('is_active', true)
      .single()
      
    if (planError || !plan) {
      return { error: 'Plan not found' }
    }
    
    // Get the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, stripe_customer_id')
      .eq('id', orgId)
      .single()
      
    if (orgError || !org) {
      return { error: 'Organization not found' }
    }
    
    // Get or create Stripe customer
    let customerId = org.stripe_customer_id
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        metadata: {
          org_id: orgId,
        }
      })
      customerId = customer.id
      
      // Save customer ID
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', orgId)
    }
    
    // Determine price ID
    const priceId = billingInterval === 'year' 
      ? plan.stripe_price_id_yearly 
      : plan.stripe_price_id_monthly
      
    if (!priceId) {
      return { error: 'Price not configured for this plan' }
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        }
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        org_id: orgId,
        plan_code: planCode,
        billing_interval: billingInterval,
      },
      subscription_data: {
        metadata: {
          org_id: orgId,
          plan_code: planCode,
        },
        trial_period_days: plan.slug === 'starter' ? 14 : undefined,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    })
    
    return { url: session.url! }
    
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return { error: 'Failed to create checkout session' }
  }
}

// ============================================================================
// Customer Portal Session
// ============================================================================

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  params: CreatePortalParams
): Promise<{ url: string } | { error: string }> {
  const { orgId, returnUrl } = params
  
  try {
    // Get subscription with customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', orgId)
      .single()
      
    if (subError || !subscription?.stripe_customer_id) {
      return { error: 'No subscription found' }
    }
    
    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    })
    
    return { url: session.url }
    
  } catch (error) {
    console.error('Error creating portal session:', error)
    return { error: 'Failed to create portal session' }
  }
}

// ============================================================================
// Subscription Info
// ============================================================================

/**
 * Get subscription information for display
 */
export async function getSubscriptionInfo(
  orgId: string
): Promise<SubscriptionInfo | null> {
  try {
    // Get subscription from DB
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('org_id', orgId)
      .single()
      
    if (subError || !subscription) {
      return null
    }
    
    const plan = subscription.plans as Record<string, unknown>
    
    // Get payment method from Stripe if available
    let paymentMethod = undefined
    if (subscription.stripe_subscription_id) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id,
          { expand: ['default_payment_method'] }
        )
        
        const pm = stripeSub.default_payment_method as Stripe.PaymentMethod | null
        if (pm?.card) {
          paymentMethod = {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        }
      } catch {
        // Ignore Stripe errors for payment method
      }
    }
    
    return {
      status: subscription.status,
      planName: plan?.name as string || 'Unknown',
      planCode: plan?.code as string || 'unknown',
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      amount: subscription.billing_interval === 'year' 
        ? (plan?.annual_price_cents as number || 0) 
        : (plan?.monthly_price_cents as number || 0),
      interval: subscription.billing_interval,
      paymentMethod,
    }
    
  } catch (error) {
    console.error('Error getting subscription info:', error)
    return null
  }
}

// ============================================================================
// Invoice History
// ============================================================================

/**
 * Get invoice history for an organization
 */
export async function getInvoiceHistory(
  orgId: string,
  limit: number = 10
): Promise<Array<{
  id: string
  number: string | null
  status: string
  total: number
  currency: string
  paidAt: string | null
  invoiceUrl: string | null
  pdfUrl: string | null
}>> {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)
    
  if (error || !invoices) {
    return []
  }
  
  return invoices.map(invoice => ({
    id: invoice.id,
    number: invoice.stripe_invoice_number,
    status: invoice.status,
    total: invoice.total_cents,
    currency: invoice.currency,
    paidAt: invoice.paid_at,
    invoiceUrl: invoice.stripe_hosted_invoice_url,
    pdfUrl: invoice.stripe_invoice_pdf,
  }))
}

// ============================================================================
// Plan Change
// ============================================================================

/**
 * Preview plan change (calculate proration)
 */
export async function previewPlanChange(
  orgId: string,
  newPlanCode: string,
  newInterval: 'month' | 'year'
): Promise<{
  currentPlan: string
  newPlan: string
  proratedAmount: number
  effectiveDate: string
} | { error: string }> {
  try {
    // Get current subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('org_id', orgId)
      .single()
      
    if (!subscription?.stripe_subscription_id) {
      return { error: 'No active subscription' }
    }
    
    // Get new plan price
    const { data: newPlan } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', newPlanCode)
      .single()
      
    if (!newPlan) {
      return { error: 'Plan not found' }
    }
    
    const newPriceId = newInterval === 'year'
      ? newPlan.stripe_price_id_yearly
      : newPlan.stripe_price_id_monthly
      
    if (!newPriceId) {
      return { error: 'Price not configured' }
    }
    
    // Get current Stripe subscription
    const stripeSub = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )
    
    // Create invoice preview
    const preview = await stripe.invoices.createPreview({
      customer: stripeSub.customer as string,
      subscription: subscription.stripe_subscription_id,
      subscription_items: [
        {
          id: stripeSub.items.data[0].id,
          price: newPriceId,
        }
      ],
      subscription_proration_behavior: 'create_prorations',
    })
    
    return {
      currentPlan: stripeSub.items.data[0].price.nickname || 'Current Plan',
      newPlan: newPlan.name,
      proratedAmount: preview.amount_due,
      effectiveDate: new Date().toISOString(),
    }
    
  } catch (error) {
    console.error('Error previewing plan change:', error)
    return { error: 'Failed to preview plan change' }
  }
}

/**
 * Execute plan change
 */
export async function changePlan(
  orgId: string,
  newPlanCode: string,
  newInterval: 'month' | 'year'
): Promise<{ success: boolean } | { error: string }> {
  try {
    // Get current subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('org_id', orgId)
      .single()
      
    if (!subscription?.stripe_subscription_id) {
      return { error: 'No active subscription' }
    }
    
    // Get new plan
    const { data: newPlan } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', newPlanCode)
      .single()
      
    if (!newPlan) {
      return { error: 'Plan not found' }
    }
    
    const newPriceId = newInterval === 'year'
      ? newPlan.stripe_price_id_yearly
      : newPlan.stripe_price_id_monthly
      
    if (!newPriceId) {
      return { error: 'Price not configured' }
    }
    
    // Get current Stripe subscription
    const stripeSub = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )
    
    // Update subscription in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [
        {
          id: stripeSub.items.data[0].id,
          price: newPriceId,
        }
      ],
      proration_behavior: 'create_prorations',
      metadata: {
        plan_code: newPlanCode,
      }
    })
    
    // Update local subscription record
    await supabase
      .from('subscriptions')
      .update({
        plan_id: newPlan.id,
        stripe_price_id: newPriceId,
        billing_interval: newInterval,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)
    
    return { success: true }
    
  } catch (error) {
    console.error('Error changing plan:', error)
    return { error: 'Failed to change plan' }
  }
}

// ============================================================================
// Cancel Subscription
// ============================================================================

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(
  orgId: string,
  reason?: string,
  immediately: boolean = false
): Promise<{ success: boolean } | { error: string }> {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('org_id', orgId)
      .single()
      
    if (!subscription?.stripe_subscription_id) {
      return { error: 'No active subscription' }
    }
    
    if (immediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
      
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
      
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return { error: 'Failed to cancel subscription' }
  }
}

/**
 * Reactivate a subscription that was set to cancel
 */
export async function reactivateSubscription(
  orgId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, cancel_at_period_end')
      .eq('org_id', orgId)
      .single()
      
    if (!subscription?.stripe_subscription_id) {
      return { error: 'No subscription found' }
    }
    
    if (!subscription.cancel_at_period_end) {
      return { error: 'Subscription is not set to cancel' }
    }
    
    // Remove cancellation in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    })
    
    // Update local record
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        cancellation_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)
    
    return { success: true }
    
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return { error: 'Failed to reactivate subscription' }
  }
}

// ============================================================================
// API Route Handlers
// ============================================================================

// POST /api/billing/checkout
export async function handleCheckout(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { orgId, planCode, billingInterval, successUrl, cancelUrl } = body
    
    if (!orgId || !planCode) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    const result = await createCheckoutSession({
      orgId,
      planCode,
      billingInterval: billingInterval || 'month',
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/success`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json({ url: result.url })
    
  } catch (error) {
    console.error('Checkout handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/billing/portal
export async function handlePortal(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { orgId, returnUrl } = body
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing org ID' },
        { status: 400 }
      )
    }
    
    const result = await createPortalSession({
      orgId,
      returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json({ url: result.url })
    
  } catch (error) {
    console.error('Portal handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/billing/subscription
export async function handleGetSubscription(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId')
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing org ID' },
        { status: 400 }
      )
    }
    
    const [subscription, entitlements, invoices] = await Promise.all([
      getSubscriptionInfo(orgId),
      getEntitlements(orgId),
      getInvoiceHistory(orgId, 5),
    ])
    
    return NextResponse.json({
      subscription,
      entitlements,
      invoices,
    })
    
  } catch (error) {
    console.error('Get subscription handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
