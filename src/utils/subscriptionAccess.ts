import {
  SUBSCRIPTION_TIERS,
  TRIAL_DAYS,
  TIER_ORDER,
  maxTier,
  minimumTierForUsage,
  tierForLimitViolation,
  tierRank,
  type SubscriptionFeatureFlag,
  type SubscriptionLimitKey,
  type SubscriptionTierId,
} from '../config/subscriptionTiers'
import type { AccessCheckResult, WorkspaceSubscription, WorkspaceUsage } from '../types/subscription'

export function addDays(iso: string | Date, days: number): string {
  const date = new Date(iso)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function createDefaultSubscription(now = new Date()): WorkspaceSubscription {
  return {
    tierId: 'solo',
    status: 'trialing',
    trialEndsAt: addDays(now, TRIAL_DAYS),
    lifetimeAccess: false,
    betaTester: false,
    adminTierOverride: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    gracePeriodEndsAt: null,
    billingInterval: null,
  }
}

export function isBillingExempt(subscription: WorkspaceSubscription): boolean {
  return subscription.lifetimeAccess || subscription.betaTester
}

export function isTrialActive(subscription: WorkspaceSubscription, now = new Date()): boolean {
  if (subscription.status !== 'trialing') return false
  if (!subscription.trialEndsAt) return true
  return new Date(subscription.trialEndsAt) > now
}

export function isGracePeriodActive(subscription: WorkspaceSubscription, now = new Date()): boolean {
  if (!subscription.gracePeriodEndsAt) return false
  return new Date(subscription.gracePeriodEndsAt) > now
}

export function hasActiveBilling(subscription: WorkspaceSubscription, now = new Date()): boolean {
  if (isBillingExempt(subscription)) return true
  if (subscription.status === 'active') return true
  if (subscription.status === 'grace_period') return true
  if (isGracePeriodActive(subscription, now)) return true
  return false
}

/** Whether the workspace can be edited (not view-only). */
export function canEditWorkspace(subscription: WorkspaceSubscription, now = new Date()): boolean {
  if (isBillingExempt(subscription)) return true
  if (isTrialActive(subscription, now)) return true
  if (subscription.status === 'active') return true
  if (subscription.status === 'grace_period') return true
  if (isGracePeriodActive(subscription, now)) return true
  return false
}

export function isSubscriptionReadOnly(subscription: WorkspaceSubscription, now = new Date()): boolean {
  return !canEditWorkspace(subscription, now)
}

/** Full feature access during trial or lifetime/beta. */
export function hasFullTrialAccess(subscription: WorkspaceSubscription, now = new Date()): boolean {
  return isBillingExempt(subscription) || isTrialActive(subscription, now)
}

export type TrialWarningLevel = 'none' | '7days' | '3days' | '1day' | 'expired'

export function getTrialWarningLevel(
  subscription: WorkspaceSubscription,
  now = new Date(),
): TrialWarningLevel {
  if (isBillingExempt(subscription)) return 'none'
  if (subscription.status === 'active') return 'none'
  if (!subscription.trialEndsAt) return 'none'

  const trialEnd = new Date(subscription.trialEndsAt)
  if (trialEnd <= now) return 'expired'

  if (!isTrialActive(subscription, now)) return 'none'

  const days = trialDaysRemaining(subscription, now)
  if (days == null) return 'none'
  if (days <= 1) return '1day'
  if (days <= 3) return '3days'
  if (days <= 7) return '7days'
  return 'none'
}

export function subscribedTier(subscription: WorkspaceSubscription): SubscriptionTierId {
  if (subscription.adminTierOverride) return subscription.adminTierOverride
  return subscription.tierId
}

/**
 * Tier used for limit and feature checks after trial.
 * During trial / lifetime / beta → group (all features).
 * After trial, paid/grace workspaces keep capacity for what they built; unpaid → paid tier only.
 */
export function effectiveTier(
  subscription: WorkspaceSubscription,
  usage: WorkspaceUsage,
  now = new Date(),
): SubscriptionTierId {
  if (hasFullTrialAccess(subscription, now)) return 'group'
  const paid = subscribedTier(subscription)
  if (hasActiveBilling(subscription, now)) {
    return maxTier(paid, minimumTierForUsage(usage))
  }
  return paid
}

export function getLimit(
  subscription: WorkspaceSubscription,
  usage: WorkspaceUsage,
  limit: SubscriptionLimitKey,
  now = new Date(),
): number | null {
  const tier = effectiveTier(subscription, usage, now)
  return SUBSCRIPTION_TIERS[tier].limits[limit]
}

export function hasFeature(
  subscription: WorkspaceSubscription,
  usage: WorkspaceUsage,
  feature: SubscriptionFeatureFlag,
  now = new Date(),
): boolean {
  const tier = effectiveTier(subscription, usage, now)
  return SUBSCRIPTION_TIERS[tier].features[feature]
}

export function buildLimitUpgradePrompt(
  limit: SubscriptionLimitKey,
  requiredTier: SubscriptionTierId,
  subscription: WorkspaceSubscription,
): { headline: string; body: string } {
  const tier = SUBSCRIPTION_TIERS[requiredTier]
  const currentTier = SUBSCRIPTION_TIERS[subscribedTier(subscription)]
  const price = `£${tier.priceMonthlyGbp.toFixed(2)}/month`

  if (limit === 'venues') {
    return {
      headline: "You're ready for Multi-site Business.",
      body: `Solo Business is for one company without separate venues. Upgrade to ${tier.name} for ${price} to add venues and sites under that business.`,
    }
  }

  if (limit === 'businesses') {
    return {
      headline: "You're ready for Business Group.",
      body: `Your current plan (${currentTier.name}) is for a single company. Upgrade to ${tier.name} for ${price} when you need unlimited businesses, switching between companies, and group reporting.`,
    }
  }

  return {
    headline: `You're ready for ${tier.name}.`,
    body: `This needs the ${tier.name} plan (${price}). Your ${currentTier.name} plan does not include enough capacity for what you are building.`,
  }
}

export function buildFeatureUpgradePrompt(
  feature: SubscriptionFeatureFlag,
  requiredTier: SubscriptionTierId,
): { headline: string; body: string } {
  const tier = SUBSCRIPTION_TIERS[requiredTier]
  const price = `£${tier.priceMonthlyGbp.toFixed(2)}/month`

  if (feature === 'groupReporting' || feature === 'consolidatedDashboards' || feature === 'multiCompanyRollups') {
    return {
      headline: "You're ready for Business Group.",
      body: `Group reporting and a consolidated view across companies are on the Business Group plan (${price}).`,
    }
  }

  return {
    headline: `You're ready for ${tier.name}.`,
    body: `This feature is included on the ${tier.name} plan (${price}).`,
  }
}

export function checkLimit(
  subscription: WorkspaceSubscription,
  usage: WorkspaceUsage,
  limit: SubscriptionLimitKey,
  nextCount: number,
  now = new Date(),
): AccessCheckResult {
  if (hasFullTrialAccess(subscription, now)) return { allowed: true }

  const cap = getLimit(subscription, usage, limit, now)
  if (cap == null || nextCount <= cap) return { allowed: true }

  const requiredTier = tierForLimitViolation(limit, nextCount)
  if (!requiredTier) return { allowed: true }

  const { headline, body } = buildLimitUpgradePrompt(limit, requiredTier, subscription)
  return {
    allowed: false,
    requiredTier,
    headline,
    message: body,
  }
}

export function checkFeature(
  subscription: WorkspaceSubscription,
  usage: WorkspaceUsage,
  feature: SubscriptionFeatureFlag,
  now = new Date(),
): AccessCheckResult {
  if (hasFeature(subscription, usage, feature, now)) return { allowed: true }

  const requiredTier = TIER_WITH_FEATURE(feature)
  const { headline, body } = buildFeatureUpgradePrompt(feature, requiredTier)
  return {
    allowed: false,
    requiredTier,
    headline,
    message: body,
  }
}

function TIER_WITH_FEATURE(feature: SubscriptionFeatureFlag): SubscriptionTierId {
  for (const tierId of TIER_ORDER) {
    if (SUBSCRIPTION_TIERS[tierId].features[feature]) return tierId
  }
  return 'group'
}

export function tierRequiredForFeature(feature: SubscriptionFeatureFlag): SubscriptionTierId {
  return TIER_WITH_FEATURE(feature)
}

export function trialDaysRemaining(subscription: WorkspaceSubscription, now = new Date()): number | null {
  if (!subscription.trialEndsAt || !isTrialActive(subscription, now)) return null
  const ms = new Date(subscription.trialEndsAt).getTime() - now.getTime()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

export function postTrialRequiredTier(usage: WorkspaceUsage): SubscriptionTierId {
  return minimumTierForUsage(usage)
}

export function subscriptionNeedsUpgrade(
  subscription: WorkspaceSubscription,
  usage: WorkspaceUsage,
  now = new Date(),
): { needed: boolean; requiredTier: SubscriptionTierId; headline: string; message: string } | null {
  if (hasFullTrialAccess(subscription, now)) return null

  const paid = subscribedTier(subscription)
  const required = minimumTierForUsage(usage)
  if (tierRank(paid) >= tierRank(required)) return null

  const tier = SUBSCRIPTION_TIERS[required]
  return {
    needed: true,
    requiredTier: required,
    headline: `Your setup fits the ${tier.name} plan.`,
    message: `Based on what you have created, True Balance recommends ${tier.name} (${formatTierMonthly(required)}). Upgrade when you are ready — nothing changes until you choose.`,
  }
}

function formatTierMonthly(tierId: SubscriptionTierId): string {
  return `£${SUBSCRIPTION_TIERS[tierId].priceMonthlyGbp.toFixed(2)}/month`
}

export function buildRecommendedTierPrompt(usage: WorkspaceUsage): {
  requiredTier: SubscriptionTierId
  headline: string
  body: string
} {
  const required = minimumTierForUsage(usage)
  const tier = SUBSCRIPTION_TIERS[required]
  return {
    requiredTier: required,
    headline: `We recommend ${tier.name}.`,
    body: `Based on how your workspace is set up, the ${tier.name} plan (${formatTierMonthly(required)}) is the best fit. You can keep building on your trial until day ${TRIAL_DAYS + 1}.`,
  }
}
