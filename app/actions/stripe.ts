'use server'

import { stripe } from '@/lib/stripe'
import { PLANS } from '@/lib/products'

// Kept for future use — allows creating embedded checkout sessions
// if needed. Currently the app uses direct Stripe payment links.
export async function startCheckoutSession(planId: string, metadata?: Record<string, string>) {
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) {
    throw new Error(`Plan with id "${planId}" not found`)
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: `OPCalls ${plan.name} Plan`,
          },
          unit_amount: plan.monthlyPriceCents,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    metadata: metadata || {},
  })

  return session.client_secret
}

export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return {
    status: session.status,
    customer_email: session.customer_details?.email,
    payment_status: session.payment_status,
    metadata: session.metadata,
  }
}
