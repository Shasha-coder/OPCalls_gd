export interface PhoneProduct {
  id: string
  name: string
  description: string
  priceInCents: number
  recurring: boolean // true = monthly subscription
  type: 'local' | 'toll-free'
  country: string
}

// Phone number products - prices are validated server-side
export const PHONE_PRODUCTS: PhoneProduct[] = [
  // US Numbers
  {
    id: 'us-local',
    name: 'US Local Number',
    description: 'Local US phone number with your area code',
    priceInCents: 500, // $5.00/month
    recurring: true,
    type: 'local',
    country: 'US',
  },
  {
    id: 'us-toll-free',
    name: 'US Toll-Free Number',
    description: 'US toll-free number (800, 888, etc.)',
    priceInCents: 1500, // $15.00/month
    recurring: true,
    type: 'toll-free',
    country: 'US',
  },
  // Canada Numbers
  {
    id: 'ca-local',
    name: 'Canada Local Number',
    description: 'Local Canadian phone number',
    priceInCents: 500, // $5.00/month
    recurring: true,
    type: 'local',
    country: 'CA',
  },
  {
    id: 'ca-toll-free',
    name: 'Canada Toll-Free Number',
    description: 'Canadian toll-free number',
    priceInCents: 1500, // $15.00/month
    recurring: true,
    type: 'toll-free',
    country: 'CA',
  },
  // UK Numbers
  {
    id: 'uk-local',
    name: 'UK Local Number',
    description: 'Local UK phone number',
    priceInCents: 700, // $7.00/month
    recurring: true,
    type: 'local',
    country: 'UK',
  },
  {
    id: 'uk-toll-free',
    name: 'UK Toll-Free Number',
    description: 'UK toll-free number (0800)',
    priceInCents: 2000, // $20.00/month
    recurring: true,
    type: 'toll-free',
    country: 'UK',
  },
]

export function getProductByCountryAndType(country: string, type: 'local' | 'toll-free'): PhoneProduct | undefined {
  return PHONE_PRODUCTS.find(p => p.country === country && p.type === type)
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
