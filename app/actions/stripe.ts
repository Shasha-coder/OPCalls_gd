'use server'

import { stripe } from '@/lib/stripe'
import { PHONE_PRODUCTS, type PhoneProduct } from '@/lib/products'

export async function startCheckoutSession(productId: string, metadata?: Record<string, string>) {
  const product = PHONE_PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  // Create Checkout Sessions from body params.
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: product.recurring ? {
            interval: 'month',
          } : undefined,
        },
        quantity: 1,
      },
    ],
    mode: product.recurring ? 'subscription' : 'payment',
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
