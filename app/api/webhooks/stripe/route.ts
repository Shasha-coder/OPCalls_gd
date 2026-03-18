/**
 * OPCALLS Phase 2: Stripe Webhook Handler
 * 
 * Handles all Stripe webhook events with:
 * - Signature verification
 * - Idempotent event processing
 * - State machine transitions
 * - Entitlement recalculation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { 
  BillingStateMachine, 
  SubscriptionStatus,
  BillingTransition 
} from '@/lib/billing/billing-state-machine'
import { recalculateEntitlements } from '@/lib/billing/entitlements'
import { logBillingEvent } from '@/lib/billing/utils'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Initialize Supabase with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// ============================================================================
// Types
// ============================================================================

interface WebhookResult {
  success: boolean
  message: string
  eventId?: string
  error?: string
}

// ============================================================================
// Main Webhook Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  // 1. Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // 2. Check for duplicate event (idempotency)
  const { data: existingEvent } = await supabase
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single()

  if (existingEvent) {
    console.log(`Duplicate event ${event.id}, skipping`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  // 3. Process the event
  let result: WebhookResult

  try {
    result = await processWebhookEvent(event)
  } catch (error) {
    console.error('Error processing webhook:', error)
    
    // Log failed event for retry
    await logFailedEvent(event, error)
    
    return NextResponse.json(
      { error: 'Internal processing error' },
      { status: 500 }
    )
  }

  // 4. Return response
  if (result.success) {
    return NextResponse.json({ 
      received: true, 
      eventId: result.eventId,
      message: result.message 
    })
  } else {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    )
  }
}

// ============================================================================
// Event Processor
// ============================================================================

async function processWebhookEvent(event: Stripe.Event): Promise<WebhookResult> {
  console.log(`Processing Stripe event: ${event.type} (${event.id})`)

  switch (event.type) {
    // ========================================
    // Checkout Events
    // ========================================
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event.id)

    case 'checkout.session.expired':
      return handleCheckoutExpired(event.data.object as Stripe.Checkout.Session, event.id)

    // ========================================
    // Subscription Events
    // ========================================
    case 'customer.subscription.created':
      return handleSubscriptionCreated(event.data.object as Stripe.Subscription, event.id)

    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event.data.object as Stripe.Subscription, event.id)

    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription, event.id)

    case 'customer.subscription.trial_will_end':
      return handleTrialWillEnd(event.data.object as Stripe.Subscription, event.id)

    // ========================================
    // Invoice Events
    // ========================================
    case 'invoice.created':
      return handleInvoiceCreated(event.data.object as Stripe.Invoice, event.id)

    case 'invoice.paid':
      return handleInvoicePaid(event.data.object as Stripe.Invoice, event.id)

    case 'invoice.payment_failed':
      return handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, event.id)

    case 'invoice.finalized':
      return handleInvoiceFinalized(event.data.object as Stripe.Invoice, event.id)

    // ========================================
    // Payment Intent Events
    // ========================================
    case 'payment_intent.succeeded':
      return handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, event.id)

    case 'payment_intent.payment_failed':
      return handlePaymentFailed(event.data.object as Stripe.PaymentIntent, event.id)

    // ========================================
    // Customer Events
    // ========================================
    case 'customer.created':
      return handleCustomerCreated(event.data.object as Stripe.Customer, event.id)

    case 'customer.updated':
      return handleCustomerUpdated(event.data.object as Stripe.Customer, event.id)

    default:
      console.log(`Unhandled event type: ${event.type}`)
      return { success: true, message: `Unhandled event type: ${event.type}` }
  }
}

// ============================================================================
// Checkout Handlers
// ============================================================================

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripeEventId: string
): Promise<WebhookResult> {
  const orgId = session.metadata?.org_id
  const planCode = session.metadata?.plan_code

  if (!orgId) {
    return { success: false, message: 'Missing org_id in metadata', error: 'Missing org_id in metadata' }
  }

  // Get plan
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('slug', planCode)
    .single()

  if (!plan) {
    return { success: false, message: `Plan not found: ${planCode}`, error: `Plan not found: ${planCode}` }
  }

  // Create or update subscription record
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .upsert({
      org_id: orgId,
      plan_id: plan.id,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      status: 'active',
      billing_interval: session.metadata?.billing_interval || 'month',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'org_id'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating subscription:', error)
    return { success: false, message: 'Failed to create subscription', error: 'Failed to create subscription' }
  }

  // Recalculate entitlements
  await recalculateEntitlements(orgId)

  // Log event
  await logBillingEvent({
    orgId,
    subscriptionId: subscription.id,
    eventType: 'checkout.completed',
    eventSource: 'stripe',
    stripeEventId,
    newStatus: 'active',
    description: `Checkout completed for plan: ${plan.name}`,
    amountCents: session.amount_total || 0,
  })

  return { 
    success: true, 
    message: 'Checkout completed',
    eventId: stripeEventId 
  }
}

async function handleCheckoutExpired(
  session: Stripe.Checkout.Session,
  stripeEventId: string
): Promise<WebhookResult> {
  const orgId = session.metadata?.org_id

  if (orgId) {
    // Update subscription status if it exists
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'incomplete_expired',
        updated_at: new Date().toISOString()
      })
      .eq('org_id', orgId)
      .eq('status', 'incomplete')

    await logBillingEvent({
      orgId,
      eventType: 'checkout.expired',
      eventSource: 'stripe',
      stripeEventId,
      description: 'Checkout session expired',
    })
  }

  return { success: true, message: 'Checkout expired handled' }
}

// ============================================================================
// Subscription Handlers
// ============================================================================

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  stripeEventId: string
): Promise<WebhookResult> {
  // Find org by customer ID
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('org_id, id')
    .eq('stripe_customer_id', subscription.customer as string)
    .single()

  if (!existingSub) {
    console.log('No matching subscription found for customer:', subscription.customer)
    return { success: true, message: 'No matching org found' }
  }

  // Update with Stripe subscription details
  await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      status: mapStripeStatus(subscription.status),
      stripe_price_id: subscription.items.data[0]?.price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start: subscription.trial_start 
        ? new Date(subscription.trial_start * 1000).toISOString() 
        : null,
      trial_end: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSub.id)

  // Recalculate entitlements
  await recalculateEntitlements(existingSub.org_id)

  await logBillingEvent({
    orgId: existingSub.org_id,
    subscriptionId: existingSub.id,
    eventType: 'subscription.created',
    eventSource: 'stripe',
    stripeEventId,
    newStatus: mapStripeStatus(subscription.status),
    description: 'Stripe subscription created',
  })

  return { success: true, message: 'Subscription created' }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  stripeEventId: string
): Promise<WebhookResult> {
  // Find our subscription record
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, org_id, status, plan_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!existingSub) {
    return { success: true, message: 'Subscription not found' }
  }

  const previousStatus = existingSub.status as SubscriptionStatus
  const newStatus = mapStripeStatus(subscription.status)

  // Use state machine to validate transition
  const stateMachine = new BillingStateMachine(previousStatus)
  const transition = getTransitionForStatusChange(previousStatus, newStatus)
  
  if (transition && !stateMachine.canTransition(transition)) {
    console.warn(`Invalid state transition: ${previousStatus} -> ${newStatus}`)
  }

  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      status: newStatus,
      stripe_price_id: subscription.items.data[0]?.price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSub.id)

  // Recalculate entitlements
  await recalculateEntitlements(existingSub.org_id)

  await logBillingEvent({
    orgId: existingSub.org_id,
    subscriptionId: existingSub.id,
    eventType: 'subscription.updated',
    eventSource: 'stripe',
    stripeEventId,
    previousStatus,
    newStatus,
    description: `Subscription status changed: ${previousStatus} -> ${newStatus}`,
  })

  return { success: true, message: 'Subscription updated' }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  stripeEventId: string
): Promise<WebhookResult> {
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, org_id, status')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!existingSub) {
    return { success: true, message: 'Subscription not found' }
  }

  // Update to canceled
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSub.id)

  // Recalculate entitlements (will disable access)
  await recalculateEntitlements(existingSub.org_id)

  await logBillingEvent({
    orgId: existingSub.org_id,
    subscriptionId: existingSub.id,
    eventType: 'subscription.canceled',
    eventSource: 'stripe',
    stripeEventId,
    previousStatus: existingSub.status,
    newStatus: 'canceled',
    description: 'Subscription canceled',
  })

  return { success: true, message: 'Subscription canceled' }
}

async function handleTrialWillEnd(
  subscription: Stripe.Subscription,
  stripeEventId: string
): Promise<WebhookResult> {
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, org_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (existingSub) {
    await logBillingEvent({
      orgId: existingSub.org_id,
      subscriptionId: existingSub.id,
      eventType: 'trial.ending',
      eventSource: 'stripe',
      stripeEventId,
      description: 'Trial ending in 3 days',
    })

    // TODO: Send trial ending notification
  }

  return { success: true, message: 'Trial ending notification processed' }
}

// ============================================================================
// Invoice Handlers
// ============================================================================

async function handleInvoiceCreated(
  invoice: Stripe.Invoice,
  stripeEventId: string
): Promise<WebhookResult> {
  if (!invoice.subscription) {
    return { success: true, message: 'Non-subscription invoice' }
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, org_id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!existingSub) {
    return { success: true, message: 'Subscription not found' }
  }

  // Create invoice record
  await supabase
    .from('invoices')
    .upsert({
      org_id: existingSub.org_id,
      subscription_id: existingSub.id,
      stripe_invoice_id: invoice.id,
      stripe_invoice_number: invoice.number,
      stripe_hosted_invoice_url: invoice.hosted_invoice_url,
      stripe_invoice_pdf: invoice.invoice_pdf,
      status: invoice.status || 'draft',
      subtotal_cents: invoice.subtotal,
      tax_cents: invoice.tax || 0,
      total_cents: invoice.total,
      amount_paid_cents: invoice.amount_paid,
      amount_due_cents: invoice.amount_due,
      period_start: invoice.period_start 
        ? new Date(invoice.period_start * 1000).toISOString() 
        : null,
      period_end: invoice.period_end 
        ? new Date(invoice.period_end * 1000).toISOString() 
        : null,
      due_date: invoice.due_date 
        ? new Date(invoice.due_date * 1000).toISOString() 
        : null,
    }, {
      onConflict: 'stripe_invoice_id'
    })

  return { success: true, message: 'Invoice created' }
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  stripeEventId: string
): Promise<WebhookResult> {
  if (!invoice.subscription) {
    return { success: true, message: 'Non-subscription invoice' }
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, org_id, status')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!existingSub) {
    return { success: true, message: 'Subscription not found' }
  }

  const previousStatus = existingSub.status

  // Update invoice
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      amount_paid_cents: invoice.amount_paid,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_invoice_id', invoice.id)

  // If subscription was past_due or restricted, restore to active
  if (['past_due', 'restricted', 'suspended'].includes(previousStatus)) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        payment_failure_count: 0,
        last_payment_error: null,
        grace_period_start: null,
        grace_period_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSub.id)

    // Recalculate entitlements (will restore access)
    await recalculateEntitlements(existingSub.org_id)

    // TODO: Trigger resume flow if was suspended
  }

  await logBillingEvent({
    orgId: existingSub.org_id,
    subscriptionId: existingSub.id,
    eventType: 'invoice.paid',
    eventSource: 'stripe',
    stripeEventId,
    previousStatus,
    newStatus: 'active',
    amountCents: invoice.amount_paid,
    description: 'Invoice paid successfully',
  })

  return { success: true, message: 'Invoice paid' }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  stripeEventId: string
): Promise<WebhookResult> {
  if (!invoice.subscription) {
    return { success: true, message: 'Non-subscription invoice' }
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, org_id, status, payment_failure_count')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!existingSub) {
    return { success: true, message: 'Subscription not found' }
  }

  const failureCount = (existingSub.payment_failure_count || 0) + 1
  const previousStatus = existingSub.status

  // Determine new status based on failure count
  let newStatus = existingSub.status
  let gracePeriodEnd = null

  if (previousStatus === 'active') {
    // First failure - move to past_due, start grace period
    newStatus = 'past_due'
    gracePeriodEnd = new Date()
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7) // 7 day grace
  }

  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      status: newStatus,
      payment_failure_count: failureCount,
      last_payment_attempt: new Date().toISOString(),
      last_payment_error: invoice.last_finalization_error?.message || 'Payment failed',
      grace_period_start: previousStatus === 'active' ? new Date().toISOString() : undefined,
      grace_period_end: gracePeriodEnd?.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSub.id)

  // Recalculate entitlements
  await recalculateEntitlements(existingSub.org_id)

  await logBillingEvent({
    orgId: existingSub.org_id,
    subscriptionId: existingSub.id,
    eventType: 'invoice.payment_failed',
    eventSource: 'stripe',
    stripeEventId,
    previousStatus,
    newStatus,
    amountCents: invoice.amount_due,
    description: `Payment failed (attempt ${failureCount})`,
    metadata: {
      failure_count: failureCount,
      error: invoice.last_finalization_error?.message,
    },
  })

  // TODO: Send payment failed notification

  return { success: true, message: 'Payment failure processed' }
}

async function handleInvoiceFinalized(
  invoice: Stripe.Invoice,
  stripeEventId: string
): Promise<WebhookResult> {
  // Update invoice with PDF URL
  await supabase
    .from('invoices')
    .update({
      status: invoice.status || 'open',
      stripe_invoice_pdf: invoice.invoice_pdf,
      stripe_hosted_invoice_url: invoice.hosted_invoice_url,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_invoice_id', invoice.id)

  return { success: true, message: 'Invoice finalized' }
}

// ============================================================================
// Payment Intent Handlers
// ============================================================================

async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  stripeEventId: string
): Promise<WebhookResult> {
  // Most payment success handling is done via invoice.paid
  // This is for tracking purposes
  console.log(`Payment succeeded: ${paymentIntent.id}`)
  return { success: true, message: 'Payment succeeded' }
}

async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  stripeEventId: string
): Promise<WebhookResult> {
  // Most payment failure handling is done via invoice.payment_failed
  console.log(`Payment failed: ${paymentIntent.id}`)
  return { success: true, message: 'Payment failed' }
}

// ============================================================================
// Customer Handlers
// ============================================================================

async function handleCustomerCreated(
  customer: Stripe.Customer,
  stripeEventId: string
): Promise<WebhookResult> {
  const orgId = customer.metadata?.org_id
  
  if (orgId) {
    // Update org with Stripe customer ID if needed
    await supabase
      .from('organizations')
      .update({
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
  }

  return { success: true, message: 'Customer created' }
}

async function handleCustomerUpdated(
  customer: Stripe.Customer,
  stripeEventId: string
): Promise<WebhookResult> {
  // Handle customer updates if needed
  return { success: true, message: 'Customer updated' }
}

// ============================================================================
// Helpers
// ============================================================================

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'suspended',
    'trialing': 'trialing',
    'incomplete': 'incomplete',
    'incomplete_expired': 'incomplete_expired',
    'paused': 'suspended',
  }
  return statusMap[stripeStatus] || 'draft'
}

function getTransitionForStatusChange(
  from: SubscriptionStatus, 
  to: SubscriptionStatus
): BillingTransition | null {
  const transitionMap: Record<string, BillingTransition> = {
    'draft_trialing': 'START_TRIAL',
    'draft_active': 'PAYMENT_SUCCESS',
    'trialing_active': 'PAYMENT_SUCCESS',
    'active_past_due': 'PAYMENT_FAILED',
    'past_due_active': 'PAYMENT_SUCCESS',
    'past_due_restricted': 'GRACE_EXPIRED',
    'restricted_active': 'PAYMENT_SUCCESS',
    'restricted_suspended': 'SUSPEND',
    'suspended_active': 'PAYMENT_SUCCESS',
    'active_canceled': 'CANCEL',
    'past_due_canceled': 'CANCEL',
  }
  return transitionMap[`${from}_${to}`] || null
}

async function logFailedEvent(event: Stripe.Event, error: unknown): Promise<void> {
  await supabase
    .from('billing_events')
    .insert({
      event_type: event.type,
      event_source: 'stripe',
      stripe_event_id: event.id,
      processed: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      metadata: { raw_event: event },
    })
}
