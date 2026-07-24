/**
 * Central subscription configuration.
 * Update pricing, limits, and feature flags here — do not hardcode elsewhere.
 *
 * IDs: solo | multi | group (display names differ).
 * Legacy paid tier `business` is normalised to `multi` on read / in SQL migration 019.
 */

export type SubscriptionTierId = 'solo' | 'multi' | 'group'

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
  | 'aiTools'
  | 'openBanking'
  | 'prioritySupport'
  | 'adminFeatures'

/** Limits enforced after trial — `businesses` and `venues` gate public plan tiers. */
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
  'Plans that grow with how your business is structured.'

export const PRICING_SUBHEADLINE =
  'Start with one business. Add venues when you expand. Move to Multi-business / Group when you operate more than one company. Every plan supports clearer day-to-day financial decisions.'

export const PRICING_FOOTNOTE =
  'Not sure which plan you need? Start free and set up however you like. After your trial, we recommend the plan that matches what you have built.'

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

export const TIER_ORDER: SubscriptionTierId[] = ['solo', 'multi', 'group']

/** Map legacy Stripe/DB value `business` → `multi`. */
export function normalizeTierId(raw: string | null | undefined): SubscriptionTierId {
  if (raw === 'multi' || raw === 'group' || raw === 'solo') return raw
  if (raw === 'business' || raw === 'professional') return 'multi'
  if (raw === 'enterprise') return 'group'
  return 'solo'
}

export function tierRank(tier: SubscriptionTierId): number {
  return TIER_ORDER.indexOf(tier)
}

export function maxTier(a: SubscriptionTierId, b: SubscriptionTierId): SubscriptionTierId {
  return tierRank(a) >= tierRank(b) ? a : b
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
  aiTools: false,
  openBanking: false,
  prioritySupport: false,
  adminFeatures: false,
}

/** Multi-site: one business, venues roll up in that business view — not group reporting. */
const MULTI_FEATURES: Record<SubscriptionFeatureFlag, boolean> = {
  ...SOLO_FEATURES,
  businessReporting: true,
  advancedReports: true,
}

/** Multi-business / Group: unlimited companies + consolidated group reporting. */
const GROUP_FEATURES: Record<SubscriptionFeatureFlag, boolean> = {
  ...MULTI_FEATURES,
  consolidatedDashboards: true,
  groupReporting: true,
  consolidatedFinancialHealth: true,
  multiCompanyRollups: true,
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTierId, SubscriptionTierDefinition> = {
  solo: {
    id: 'solo',
    name: 'Solo Business',
    priceMonthlyGbp: 5,
    priceAnnualGbp: 50,
    perfectFor: 'One business without separate venues or sites.',
    marketingFeatures: [
      '1 business',
      'Business-level accounts (current & savings)',
      'Full Cash Prophet dashboard',
      'Reserve Planner & commitments',
      'Expected receipts',
    ],
    limits: {
      workspaces: 1,
      businesses: 1,
      users: null,
      venues: 0,
      accounts: null,
      reservePlanners: null,
      commitments: null,
      expectedReceipts: null,
    },
    features: { ...SOLO_FEATURES },
  },
  multi: {
    id: 'multi',
    name: 'Multi-site Business',
    priceMonthlyGbp: 10,
    priceAnnualGbp: 100,
    perfectFor: 'One business with multiple venues or sites — a clear view across those locations.',
    marketingFeatures: [
      'Everything in Solo Business',
      '1 business',
      'Unlimited sub venues / sites',
      'Dashboard across venues in that business',
    ],
    limits: {
      workspaces: 1,
      businesses: 1,
      users: null,
      venues: null,
      accounts: null,
      reservePlanners: null,
      commitments: null,
      expectedReceipts: null,
    },
    features: { ...MULTI_FEATURES },
  },
  group: {
    id: 'group',
    name: 'Multi-business / Group',
    priceMonthlyGbp: 15,
    priceAnnualGbp: 150,
    perfectFor: 'Owners who run more than one company and want them together in one workspace.',
    marketingFeatures: [
      'Everything in Multi-site Business',
      'Unlimited businesses',
      'Unlimited venues / sites',
      'Group reporting & consolidated balances',
    ],
    limits: {
      workspaces: null,
      businesses: null,
      users: null,
      venues: null,
      accounts: null,
      reservePlanners: null,
      commitments: null,
      expectedReceipts: null,
    },
    features: { ...GROUP_FEATURES },
  },
}

/** Lowest tier that covers how the workspace is set up. */
export function minimumTierForUsage(usage: {
  businesses: number
  venues: number
  hasGroup?: boolean
}): SubscriptionTierId {
  return recommendTierForWorkspace(usage)
}

/**
 * Best-fit plan from business size:
 * - Solo: one business, no venues
 * - Multi-site: one business with venues
 * - Multi-business / Group: more than one business
 */
export function recommendTierForWorkspace(usage: {
  businesses: number
  venues: number
  hasGroup?: boolean
}): SubscriptionTierId {
  if (usage.businesses > 1 || usage.hasGroup) return 'group'
  if (usage.venues > 0) return 'multi'
  return 'solo'
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
