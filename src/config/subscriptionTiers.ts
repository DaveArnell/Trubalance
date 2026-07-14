/**
 * Central subscription configuration.
 * Update pricing, limits, and feature flags here — do not hardcode elsewhere.
 */

export type SubscriptionTierId = 'solo' | 'business' | 'group'

export type SubscriptionFeatureFlag =
  | 'sharedWorkspace'
  | 'rolePermissions'
  | 'businessReporting'
  | 'consolidatedDashboards'
  | 'advancedReports'
  | 'teamCollaboration'
  | 'groupReporting'
  | 'consolidatedFinancialHealth'
  | 'multiCompanyRollups'
  | 'companyReferenceVault'
  | 'businessDiary'
  | 'aiTools'
  | 'openBanking'
  | 'prioritySupport'
  | 'adminFeatures'

/** Limits enforced after trial — only `businesses` gates public plan tiers. */
export type SubscriptionLimitKey =
  | 'workspaces'
  | 'businesses'
  | 'users'
  | 'venues'
  | 'accounts'
  | 'reservePlanners'
  | 'commitments'
  | 'expectedReceipts'

export interface SubscriptionTierLimits {
  workspaces: number | null
  businesses: number | null
  users: number | null
  venues: number | null
  accounts: number | null
  reservePlanners: number | null
  commitments: number | null
  expectedReceipts: number | null
}

export interface SubscriptionTierDefinition {
  id: SubscriptionTierId
  name: string
  priceMonthlyGbp: number
  priceAnnualGbp: number
  /** One sentence — who this plan is for (pricing page). */
  perfectFor: string
  marketingFeatures: string[]
  limits: SubscriptionTierLimits
  features: Record<SubscriptionFeatureFlag, boolean>
}

export const TRIAL_DAYS = 90

export const ANNUAL_SAVINGS_COPY = 'Pay annually and get 2 months free.'

export const PRICING_HEADLINE =
  'Follow the True Balance Method in software — start free.'

export const PRICING_SUBHEADLINE =
  'Every plan is for running the Method continuously: accruals, reserves and one True Balance. We recommend the right plan from what you set up — you do not need to decide upfront.'

export const PRICING_FOOTNOTE =
  'Not sure which plan you need? Start your free trial and build your business first. True Balance will tell you when you are ready for the next level.'

export function formatPriceGbp(amount: number): string {
  return `£${amount.toFixed(2)}`
}

export function formatTierPrice(tierId: SubscriptionTierId): string {
  return formatPriceGbp(SUBSCRIPTION_TIERS[tierId].priceMonthlyGbp)
}

export function formatTierAnnualPrice(tierId: SubscriptionTierId): string {
  return `${formatPriceGbp(SUBSCRIPTION_TIERS[tierId].priceAnnualGbp)}/year`
}

export function formatTierPriceMonthly(tierId: SubscriptionTierId): string {
  return `${formatPriceGbp(SUBSCRIPTION_TIERS[tierId].priceMonthlyGbp)}/month`
}

export const TIER_ORDER: SubscriptionTierId[] = ['solo', 'business', 'group']

export function tierRank(tier: SubscriptionTierId): number {
  return TIER_ORDER.indexOf(tier)
}

export function maxTier(a: SubscriptionTierId, b: SubscriptionTierId): SubscriptionTierId {
  return tierRank(a) >= tierRank(b) ? a : b
}

const UNLIMITED_RESOURCE_LIMITS: Omit<SubscriptionTierLimits, 'businesses' | 'workspaces' | 'users'> = {
  venues: null,
  accounts: null,
  reservePlanners: null,
  commitments: null,
  expectedReceipts: null,
}

const SOLO_FEATURES: Record<SubscriptionFeatureFlag, boolean> = {
  sharedWorkspace: false,
  rolePermissions: false,
  businessReporting: false,
  consolidatedDashboards: false,
  advancedReports: false,
  teamCollaboration: false,
  groupReporting: false,
  consolidatedFinancialHealth: false,
  multiCompanyRollups: false,
  companyReferenceVault: false,
  businessDiary: false,
  aiTools: false,
  openBanking: false,
  prioritySupport: false,
  adminFeatures: false,
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTierId, SubscriptionTierDefinition> = {
  solo: {
    id: 'solo',
    name: 'Solo',
    priceMonthlyGbp: 4.99,
    priceAnnualGbp: 49.9,
    perfectFor: 'One business owner managing one business.',
    marketingFeatures: [
      '1 business',
      'Unlimited venues',
      'Unlimited accounts',
      'Unlimited committed funds',
      'Unlimited reserve planners',
      'Unlimited expected receipts',
      'Unlimited reports',
      'Full True Balance dashboard',
    ],
    limits: {
      workspaces: 1,
      businesses: 1,
      users: null,
      ...UNLIMITED_RESOURCE_LIMITS,
    },
    features: { ...SOLO_FEATURES },
  },
  business: {
    id: 'business',
    name: 'Business',
    priceMonthlyGbp: 9.99,
    priceAnnualGbp: 99.9,
    perfectFor: 'Up to 10 separate companies — switch between each in the sidebar.',
    marketingFeatures: [
      'Everything in Solo',
      'Up to 10 businesses',
      'Separate view per company',
      'Unlimited sites, accounts & reserves',
    ],
    limits: {
      workspaces: 1,
      businesses: 10,
      users: null,
      ...UNLIMITED_RESOURCE_LIMITS,
    },
    features: {
      ...SOLO_FEATURES,
      businessReporting: true,
      advancedReports: true,
    },
  },
  group: {
    id: 'group',
    name: 'Group',
    priceMonthlyGbp: 14.99,
    priceAnnualGbp: 149.9,
    perfectFor: 'A group of companies — one roll-up view across the whole group.',
    marketingFeatures: [
      'Everything in Business',
      'Unlimited businesses',
      'Group scope & consolidated True Balance',
      'Business Hub — company references & diary',
      'Group reporting & multi-company roll-ups',
    ],
    limits: {
      workspaces: null,
      businesses: null,
      users: null,
      ...UNLIMITED_RESOURCE_LIMITS,
    },
    features: {
      ...SOLO_FEATURES,
      businessReporting: true,
      advancedReports: true,
      companyReferenceVault: true,
      businessDiary: true,
      consolidatedDashboards: true,
      groupReporting: true,
      consolidatedFinancialHealth: true,
      multiCompanyRollups: true,
    },
  },
}

/** Lowest tier that covers how the workspace is set up (roll-up needs Group). */
export function minimumTierForUsage(usage: { businesses: number; hasGroup?: boolean }): SubscriptionTierId {
  return recommendTierForWorkspace(usage)
}

/**
 * Best-fit plan for how the workspace is used.
 * Multiple companies with roll-up → Group tier.
 */
export function recommendTierForWorkspace(usage: { businesses: number; hasGroup?: boolean }): SubscriptionTierId {
  if (usage.businesses <= 1) return 'solo'
  return 'group'
}

export function tierForLimitViolation(
  limit: SubscriptionLimitKey,
  nextCount: number,
): SubscriptionTierId | null {
  for (const tierId of TIER_ORDER) {
    const cap = SUBSCRIPTION_TIERS[tierId].limits[limit]
    if (cap == null || nextCount <= cap) return tierId
  }
  return null
}
