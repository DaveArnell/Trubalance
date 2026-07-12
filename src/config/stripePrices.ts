import type { SubscriptionTierId } from './subscriptionTiers'

type BillingInterval = 'monthly' | 'annual'

const PRICE_ENV_KEYS: Record<SubscriptionTierId, Record<BillingInterval, string>> = {
  solo: {
    monthly: 'VITE_STRIPE_PRICE_SOLO_MONTHLY',
    annual: 'VITE_STRIPE_PRICE_SOLO_ANNUAL',
  },
  business: {
    monthly: 'VITE_STRIPE_PRICE_BUSINESS_MONTHLY',
    annual: 'VITE_STRIPE_PRICE_BUSINESS_ANNUAL',
  },
  group: {
    monthly: 'VITE_STRIPE_PRICE_GROUP_MONTHLY',
    annual: 'VITE_STRIPE_PRICE_GROUP_ANNUAL',
  },
}

/** Stripe Price IDs from environment (set in Vercel + local .env.local). */
export function getStripePriceId(tierId: SubscriptionTierId, interval: BillingInterval): string | null {
  const key = PRICE_ENV_KEYS[tierId][interval]
  const value = import.meta.env[key] as string | undefined
  return value?.trim() || null
}
