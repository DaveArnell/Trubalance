import type { SubscriptionTierId } from '../config/subscriptionTiers'

/** Billing lifecycle — Stripe-ready, not wired yet. */
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'grace_period'

export interface WorkspaceSubscription {
  /** Paid tier once billing is active; during trial this may still be `solo`. */
  tierId: SubscriptionTierId
  status: SubscriptionStatus
  trialEndsAt: string | null
  lifetimeAccess: boolean
  betaTester: boolean
  /** Manual admin override of tier (optional). */
  adminTierOverride: SubscriptionTierId | null
  /** Stripe-ready placeholders */
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  gracePeriodEndsAt: string | null
  billingInterval: 'monthly' | 'annual' | null
}

export interface WorkspaceUsage {
  workspaces: number
  businesses: number
  users: number
  venues: number
  accounts: number
  reservePlanners: number
  commitments: number
  expectedReceipts: number
}

export interface AccessCheckResult {
  allowed: boolean
  requiredTier?: SubscriptionTierId
  headline?: string
  message?: string
}

export interface UpgradePromptState {
  open: boolean
  requiredTier: SubscriptionTierId
  headline: string
  body: string
}
