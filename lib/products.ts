export interface PhoneProduct {
  id: string
  name: string
  description: string
  priceInCents: number
  recurring: boolean
  type: 'local' | 'toll-free'
  country: string
  stripeLink?: string // Direct Stripe payment link
}

export interface AgentProduct {
  id: string
  name: string
  description: string
  priceInCents: number
  recurring: boolean
  features: string[]
  stripeLink?: string // Direct Stripe payment link
}

// Phone number products - prices are validated server-side
export const PHONE_PRODUCTS: PhoneProduct[] = [
  {
    id: 'us-local',
    name: 'US Local Number',
    description: 'Local US phone number with your area code',
    priceInCents: 500,
    recurring: true,
    type: 'local',
    country: 'US',
    stripeLink: 'https://buy.stripe.com/14A5kEbjXfNFb65gJ17ss00',
  },
  {
    id: 'us-toll-free',
    name: 'US Toll-Free Number',
    description: 'US toll-free number (800, 888, etc.)',
    priceInCents: 1500,
    recurring: true,
    type: 'toll-free',
    country: 'US',
    stripeLink: 'https://buy.stripe.com/14A5kEbjXfNFb65gJ17ss00',
  },
  {
    id: 'ca-local',
    name: 'Canada Local Number',
    description: 'Local Canadian phone number',
    priceInCents: 500,
    recurring: true,
    type: 'local',
    country: 'CA',
    stripeLink: 'https://buy.stripe.com/14A5kEbjXfNFb65gJ17ss00',
  },
  {
    id: 'ca-toll-free',
    name: 'Canada Toll-Free Number',
    description: 'Canadian toll-free number',
    priceInCents: 1500,
    recurring: true,
    type: 'toll-free',
    country: 'CA',
    stripeLink: 'https://buy.stripe.com/14A5kEbjXfNFb65gJ17ss00',
  },
  {
    id: 'uk-local',
    name: 'UK Local Number',
    description: 'Local UK phone number',
    priceInCents: 700,
    recurring: true,
    type: 'local',
    country: 'UK',
    stripeLink: 'https://buy.stripe.com/14A5kEbjXfNFb65gJ17ss00',
  },
  {
    id: 'uk-toll-free',
    name: 'UK Toll-Free Number',
    description: 'UK toll-free number (0800)',
    priceInCents: 2000,
    recurring: true,
    type: 'toll-free',
    country: 'UK',
    stripeLink: 'https://buy.stripe.com/14A5kEbjXfNFb65gJ17ss00',
  },
]

// Agent pricing plans
export const AGENT_PRODUCTS: AgentProduct[] = [
  {
    id: 'agent-basic',
    name: 'Agent Basic',
    description: 'Essential AI agent with Twilio integration',
    priceInCents: 9900, // $99/month (example - adjust as needed)
    recurring: true,
    features: [
      'Dedicated Twilio Number',
      'Up to 300 minutes of AI-powered inbound/outbound calls per month',
      '300 SMS per month',
      'Standard dashboard with call logging',
      'Standard AI voice models',
      'Email support (48-hour response time)',
    ],
    stripeLink: 'https://buy.stripe.com/5kQ28s0Fj44XfmldwP7ss01',
  },
  {
    id: 'agent-pro',
    name: 'Agent Pro',
    description: 'Advanced AI agent with premium features',
    priceInCents: 29900, // $299/month (example - adjust as needed)
    recurring: true,
    features: [
      'Dedicated Twilio Number',
      'Up to 1000 minutes of AI-powered calls per month',
      '1000 SMS per month',
      'Advanced dashboard with analytics',
      'Premium AI voice models',
      'Priority email & chat support (24-hour response)',
      'Custom voice training',
      'Advanced call routing',
    ],
    stripeLink: 'https://buy.stripe.com/5kQ28s0Fj44XfmldwP7ss02', // Update with actual Pro link
  },
]

export function getProductByCountryAndType(country: string, type: 'local' | 'toll-free'): PhoneProduct | undefined {
  return PHONE_PRODUCTS.find(p => p.country === country && p.type === type)
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
