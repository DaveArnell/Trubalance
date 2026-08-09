import type { SubscriptionTierId } from '../config/subscriptionTiers'
import { getStripePriceId } from '../config/stripePrices'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { hasAdvertisingConsent } from '../utils/cookieConsent'
import { readMetaFbc, readMetaFbp } from '../utils/metaMatching'
import { trackMetaInitiateCheckout } from './metaConversions'

export function isBillingConfigured(): boolean {
  if (!isSupabaseConfigured) return false
  // Solo monthly is the minimum gate used across the app; prefer configuring all six prices.
  return Boolean(getStripePriceId('solo', 'monthly'))
}

/** True when monthly and annual prices exist for every public tier. */
export function isBillingFullyConfigured(): boolean {
  if (!isSupabaseConfigured) return false
  const tiers: SubscriptionTierId[] = ['solo', 'multi', 'group']
  const intervals: Array<'monthly' | 'annual'> = ['monthly', 'annual']
  return tiers.every((tier) => intervals.every((interval) => Boolean(getStripePriceId(tier, interval))))
}

interface CheckoutOptions {
  tierId: SubscriptionTierId
  billingInterval: 'monthly' | 'annual'
  /** When true and still trialing, subscription billing starts after trial ends. */
  deferUntilTrialEnd?: boolean
  userId?: string | null
  email?: string | null
}

export async function startCheckout(options: CheckoutOptions): Promise<void> {
  const priceId = getStripePriceId(options.tierId, options.billingInterval)
  if (!priceId) {
    throw new Error('Stripe price is not configured for this plan')
  }

  const advertisingConsent = hasAdvertisingConsent()
  const fbp = advertisingConsent ? readMetaFbp() : undefined
  const fbc = advertisingConsent ? readMetaFbc() : undefined

  const supabase = getSupabase()
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      tierId: options.tierId,
      billingInterval: options.billingInterval,
      deferUntilTrialEnd: options.deferUntilTrialEnd ?? true,
      advertisingConsent,
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
    },
  })

  if (error) throw error
  const payload = data as { url?: string; sessionId?: string } | null
  const url = payload?.url
  if (!url) throw new Error('Checkout session did not return a URL')

  // Meta tracking is best-effort — never block redirect to Stripe.
  if (payload.sessionId) {
    try {
      await trackMetaInitiateCheckout({
        sessionId: payload.sessionId,
        userId: options.userId,
        email: options.email,
        tierId: options.tierId,
        billingInterval: options.billingInterval,
      })
    } catch {
      /* ignore */
    }
  }

  window.location.assign(url)
}

export async function startBillingPortal(): Promise<void> {
  const supabase = getSupabase()
  const { data, error } = await supabase.functions.invoke('create-billing-portal', { body: {} })

  if (error) throw error
  const url = (data as { url?: string } | null)?.url
  if (!url) throw new Error('Billing portal did not return a URL')
  window.location.assign(url)
}
