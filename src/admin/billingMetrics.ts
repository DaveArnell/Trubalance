import {
  SUBSCRIPTION_TIERS,
  normalizeTierId,
  type SubscriptionTierId,
} from '../config/subscriptionTiers'

export type BillingInterval = 'monthly' | 'annual'

/** Monthly recurring revenue contribution for one subscription (GBP, net of VAT). */
export function mrrContributionGbp(
  tierId: SubscriptionTierId | string,
  interval: BillingInterval | string | null | undefined,
): number {
  const tier = SUBSCRIPTION_TIERS[normalizeTierId(tierId)]
  if (interval === 'annual') return tier.priceAnnualGbp / 12
  return tier.priceMonthlyGbp
}

/** Annualised contract value for one subscription (GBP, net of VAT). */
export function acvContributionGbp(
  tierId: SubscriptionTierId | string,
  interval: BillingInterval | string | null | undefined,
): number {
  return mrrContributionGbp(tierId, interval) * 12
}

export interface SubscriptionBillingInput {
  tier: string
  billingInterval: string | null
  status: string
  lifetimeAccess?: boolean
  betaTester?: boolean
}

export interface BillingMetrics {
  /** Paying MRR from active + past_due (excludes trial, lifetime, beta). */
  mrrGbp: number
  arrGbp: number
  /** Portion of MRR from monthly-billed customers. */
  monthlyPlanMrrGbp: number
  /** Portion of MRR from annual-billed customers (annual price ÷ 12). */
  annualPlanMrrGbp: number
  payingCustomers: number
  monthlyCustomers: number
  annualCustomers: number
  /** Trialing customers × their plan MRR (pipeline, not booked). */
  trialPipelineMrrGbp: number
  trialCustomers: number
  /** Average annualised contract value among paying customers. */
  acvGbp: number | null
  byTier: Array<{ tier: SubscriptionTierId; count: number; mrrGbp: number }>
}

const PAID_STATUSES = new Set(['active', 'past_due'])
const TRIAL_STATUSES = new Set(['trialing'])

export function computeBillingMetrics(rows: SubscriptionBillingInput[]): BillingMetrics {
  let mrrGbp = 0
  let monthlyPlanMrrGbp = 0
  let annualPlanMrrGbp = 0
  let payingCustomers = 0
  let monthlyCustomers = 0
  let annualCustomers = 0
  let trialPipelineMrrGbp = 0
  let trialCustomers = 0

  const tierTotals: Record<SubscriptionTierId, { count: number; mrrGbp: number }> = {
    solo: { count: 0, mrrGbp: 0 },
    multi: { count: 0, mrrGbp: 0 },
    group: { count: 0, mrrGbp: 0 },
  }

  for (const row of rows) {
    if (row.lifetimeAccess || row.betaTester) continue
    const tier = normalizeTierId(row.tier)
    const interval = row.billingInterval === 'annual' ? 'annual' : 'monthly'
    const contribution = mrrContributionGbp(tier, interval)

    if (PAID_STATUSES.has(row.status)) {
      mrrGbp += contribution
      payingCustomers += 1
      tierTotals[tier].count += 1
      tierTotals[tier].mrrGbp += contribution
      if (interval === 'annual') {
        annualPlanMrrGbp += contribution
        annualCustomers += 1
      } else {
        monthlyPlanMrrGbp += contribution
        monthlyCustomers += 1
      }
    } else if (TRIAL_STATUSES.has(row.status)) {
      trialPipelineMrrGbp += contribution
      trialCustomers += 1
    }
  }

  return {
    mrrGbp,
    arrGbp: mrrGbp * 12,
    monthlyPlanMrrGbp,
    annualPlanMrrGbp,
    payingCustomers,
    monthlyCustomers,
    annualCustomers,
    trialPipelineMrrGbp,
    trialCustomers,
    acvGbp: payingCustomers > 0 ? (mrrGbp * 12) / payingCustomers : null,
    byTier: (['solo', 'multi', 'group'] as SubscriptionTierId[]).map((tier) => ({
      tier,
      count: tierTotals[tier].count,
      mrrGbp: tierTotals[tier].mrrGbp,
    })),
  }
}

export function buildDailyRevenueSeries(
  payments: Array<{ paidAt: string | null; createdAt: string; amountCents: number; status: string }>,
  days = 14,
): Array<{ date: string; amountGbp: number }> {
  const series: Array<{ date: string; amountGbp: number }> = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - offset)
    const key = day.toISOString().slice(0, 10)
    const amountCents = payments
      .filter((p) => p.status === 'succeeded')
      .filter((p) => (p.paidAt ?? p.createdAt).slice(0, 10) === key)
      .reduce((sum, p) => sum + p.amountCents, 0)
    series.push({ date: key, amountGbp: amountCents / 100 })
  }
  return series
}
