import type { SubscriptionTierId } from './subscriptionTiers'

type BillingInterval = 'monthly' | 'annual'

const PRICE_ENV_KEYS: Record<SubscriptionTierId, Record<BillingInterval, string>> = {
  solo: {
    monthly: 'VITE_STRIPE_PRICE_SOLO_MONTHLY',
    annual: 'VITE_STRIPE_PRICE_SOLO_ANNUAL',
  },
  multi: {
    monthly: 'VITE_STRIPE_PRICE_MULTI_MONTHLY',
    annual: 'VITE_STRIPE_PRICE_MULTI_ANNUAL',
  },
  group: {
    monthly: 'VITE_STRIPE_PRICE_GROUP_MONTHLY',
    annual: 'VITE_STRIPE_PRICE_GROUP_ANNUAL',
  },
}

/** Legacy env names if MULTI not set yet (old Business tier). */
const MULTI_LEGACY_ENV: Record<BillingInterval, string> = {
  monthly: 'VITE_STRIPE_PRICE_BUSINESS_MONTHLY',
  annual: 'VITE_STRIPE_PRICE_BUSINESS_ANNUAL',
}

/** Stripe Price IDs from environment (set in Vercel + local .env.local). */
export function getStripePriceId(tierId: SubscriptionTierId, interval: BillingInterval): string | null {
  const key = PRICE_ENV_KEYS[tierId][interval]
  const primary = (import.meta.env[key] as string | undefined)?.trim()
  if (primary) return primary
  if (tierId === 'multi') {
    const legacy = (import.meta.env[MULTI_LEGACY_ENV[interval]] as string | undefined)?.trim()
    return legacy || null
  }
  return null
}
