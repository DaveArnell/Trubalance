/**
 * Stripe billing placeholders — not wired yet.
 * Call these from upgrade UI, settings, and webhooks once Stripe is integrated.
 */

import type { SubscriptionTierId } from '../config/subscriptionTiers'
import type { WorkspaceSubscription } from '../types/subscription'

export type BillingInterval = 'monthly' | 'annual'

export interface BillingCheckoutParams {
  tierId: SubscriptionTierId
  interval: BillingInterval
  /** Return URL after Stripe Checkout */
  successUrl: string
  cancelUrl: string
}

export interface BillingPlanChangeParams {
  subscription: WorkspaceSubscription
  targetTierId: SubscriptionTierId
  interval: BillingInterval
}

export interface BillingCancelParams {
  subscription: WorkspaceSubscription
  /** Cancel at period end vs immediately */
  atPeriodEnd: boolean
}

/** Start paid subscription after trial or from free state. */
export async function startSubscriptionCheckout(
  _params: BillingCheckoutParams,
): Promise<{ checkoutUrl: string | null; error: string | null }> {
  return {
    checkoutUrl: null,
    error: 'Stripe billing is not connected yet.',
  }
}

/** Upgrade or downgrade an existing subscription. */
export async function changeSubscriptionPlan(
  _params: BillingPlanChangeParams,
): Promise<{ ok: boolean; error: string | null }> {
  return { ok: false, error: 'Stripe billing is not connected yet.' }
}

export async function cancelSubscription(
  _params: BillingCancelParams,
): Promise<{ ok: boolean; error: string | null }> {
  return { ok: false, error: 'Stripe billing is not connected yet.' }
}

export async function resumeSubscription(
  _subscription: WorkspaceSubscription,
): Promise<{ ok: boolean; error: string | null }> {
  return { ok: false, error: 'Stripe billing is not connected yet.' }
}

/** Apply lifetime or beta access without Stripe (admin / migration). */
export function applyLifetimeAccess(
  subscription: WorkspaceSubscription,
  options: { lifetimeAccess?: boolean; betaTester?: boolean },
): WorkspaceSubscription {
  return {
    ...subscription,
    lifetimeAccess: options.lifetimeAccess ?? subscription.lifetimeAccess,
    betaTester: options.betaTester ?? subscription.betaTester,
    status: 'active',
  }
}
