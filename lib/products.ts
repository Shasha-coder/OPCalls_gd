// OPCalls pricing plans - source of truth for all pricing UI
// Monthly fees include the dedicated phone number(s)

export interface Plan {
  id: 'starter' | 'business' | 'elite'
  name: string
  badge?: string
  monthlyPriceCents: number
  monthlyStripeLink: string
  setupFeeCents: number
  setupFeeStripeLink: string
  setupFeeDescription: string
  numbers: number
  minutes: number
  sms: number
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPriceCents: 14900,
    monthlyStripeLink: 'https://buy.stripe.com/14AaEYfAd44X5LLcsL7ss03',
    setupFeeCents: 9900,
    setupFeeStripeLink: 'https://buy.stripe.com/8x200kgEheJB3DDdwP7ss05',
    setupFeeDescription: 'One-time assisted onboarding, agent configuration & testing by our team.',
    numbers: 1,
    minutes: 250,
    sms: 200,
    features: [
      '1 Dedicated Professional Phone Number',
      '250 AI-powered minutes per month',
      '200 SMS segments per month',
      'Standard AI Voice models',
      'Managed A2P 10DLC registration (Starter Tier)',
      'Standard dashboard & call logging',
      'Email support (48-hour response time)',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'Most Popular',
    monthlyPriceCents: 39700,
    monthlyStripeLink: 'https://buy.stripe.com/cNi9AUco1dFx4HH78r7ss02',
    setupFeeCents: 24900,
    setupFeeStripeLink: 'https://buy.stripe.com/3cIdRa3RvfNFa21akD7ss06',
    setupFeeDescription: 'Full setup for up to 3 agents, custom prompts, integration testing & team training.',
    numbers: 3,
    minutes: 1000,
    sms: 1000,
    features: [
      'Up to 3 Dedicated Phone Numbers (multi-region)',
      '1,000 AI-powered minutes per month',
      '1,000 SMS segments per month',
      'Advanced AI Voice models',
      'Managed A2P 10DLC registration',
      'Advanced dashboard with analytics',
      'Priority email support (24-hour response)',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    monthlyPriceCents: 99700,
    monthlyStripeLink: 'https://buy.stripe.com/3cI8wQafT9phfmlcsL7ss04',
    setupFeeCents: 49900,
    setupFeeStripeLink: 'https://buy.stripe.com/aFaaEYew9eJBb658cv7ss07',
    setupFeeDescription: 'White-glove setup: custom voice training, CRM integration, HIPAA/GDPR configuration & dedicated onboarding manager.',
    numbers: 7,
    minutes: 2000,
    sms: 4000,
    features: [
      '7 Phone Numbers & custom minute tiers',
      '2,000 AI-powered minutes (inbound + outbound)',
      '4,000 SMS segments per month',
      'Premium AI Voice models + custom voice training',
      'HIPAA / GDPR compliance tools',
      'Advanced analytics & call routing',
      'Dedicated account manager',
      'SLA-backed uptime guarantee',
    ],
  },
]

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}
