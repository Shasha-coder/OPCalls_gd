'use client'

import { useCallback } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { startCheckoutSession } from '@/app/actions/stripe'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutProps {
  productId: string
  metadata?: Record<string, string>
  onComplete?: () => void
}

export default function Checkout({ productId, metadata, onComplete }: CheckoutProps) {
  const startCheckoutSessionForProduct = useCallback(
    () => startCheckoutSession(productId, metadata),
    [productId, metadata],
  )

  return (
    <div id="checkout" className="bg-white rounded-2xl overflow-hidden">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ 
          clientSecret: startCheckoutSessionForProduct,
          onComplete: onComplete,
        }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
