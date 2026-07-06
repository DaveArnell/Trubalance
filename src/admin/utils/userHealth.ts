import type { HealthStatus, RiskStatus } from '../types'

export interface UserHealthInput {
  lastLoginAt: string | null
  lastBalanceUpdateAt: string | null
  onboardingPct: number
  trialEndsAt: string | null
  isActive: boolean
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

/** Simple MVP health scoring for admin triage. */
export function computeUserHealth(input: UserHealthInput): {
  healthStatus: HealthStatus
  riskStatus: RiskStatus
} {
  const daysSinceLogin = daysSince(input.lastLoginAt)
  const daysSinceBalance = daysSince(input.lastBalanceUpdateAt)
  const trialDaysLeft = daysUntil(input.trialEndsAt)
  const onboarding = input.onboardingPct

  const noLoginLong = daysSinceLogin == null || daysSinceLogin > 21
  const staleBalance = daysSinceBalance == null || daysSinceBalance > 7
  const veryStaleBalance = daysSinceBalance == null || daysSinceBalance > 14
  const lowOnboarding = onboarding < 50
  const midOnboarding = onboarding < 70
  const trialEndingSoon =
    trialDaysLeft != null && trialDaysLeft >= 0 && trialDaysLeft <= 7 && input.trialEndsAt != null

  if (
    !input.isActive ||
    noLoginLong ||
    (veryStaleBalance && lowOnboarding) ||
    (trialEndingSoon && midOnboarding)
  ) {
    return { healthStatus: 'red', riskStatus: 'high' }
  }

  if (staleBalance || lowOnboarding) {
    return { healthStatus: 'orange', riskStatus: 'high' }
  }

  if (trialEndingSoon || midOnboarding || (daysSinceLogin != null && daysSinceLogin > 7)) {
    return { healthStatus: 'yellow', riskStatus: 'medium' }
  }

  const recentLogin = daysSinceLogin != null && daysSinceLogin <= 7
  const recentBalance = daysSinceBalance != null && daysSinceBalance <= 5
  const goodOnboarding = onboarding >= 70

  if (recentLogin && recentBalance && goodOnboarding) {
    return { healthStatus: 'green', riskStatus: 'low' }
  }

  return { healthStatus: 'yellow', riskStatus: 'medium' }
}

export function onboardingPctFromUser(flags: {
  businessCount: number
  accountCount: number
  commitmentCount: number
  reservePlannerCount: number
  onboardingCompleted: boolean
}): number {
  if (flags.onboardingCompleted) return 100
  let score = 0
  if (flags.businessCount > 0) score += 25
  if (flags.accountCount > 0) score += 25
  if (flags.commitmentCount > 0) score += 25
  if (flags.reservePlannerCount > 0) score += 15
  if (flags.businessCount > 0 && flags.accountCount > 0) score += 10
  return Math.min(100, score)
}

/** Active if they logged in or updated balances within the last 30 days. */
export function isUserRecentlyActive(
  lastLoginAt: string | null,
  lastBalanceUpdateAt: string | null,
): boolean {
  const loginDays = daysSince(lastLoginAt)
  const balanceDays = daysSince(lastBalanceUpdateAt)
  return (loginDays != null && loginDays <= 30) || (balanceDays != null && balanceDays <= 30)
}
