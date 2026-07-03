import type { AppState, Account, HealthLevel, ViewScope } from '../types'
import { getAccountsForScope, getCashAccounts } from './calculations'
import { daysBetween, getFreshness, getFreshnessLabel } from './snapshots'

export interface AccountFreshnessEntry {
  accountId: string
  label: string
  daysAgo: number
  freshness: HealthLevel
  freshnessLabel: string
}

export interface GroupedAccountFreshness {
  freshnessLabel: string
  freshness: HealthLevel
  count: number
  accountNames: string[]
}

/** Short label for freshness UI — venue or business name only. */
export function accountFreshnessLabel(state: AppState, account: Account): string {
  if (account.venueId) {
    return state.venues.find((v) => v.id === account.venueId)?.name ?? account.name
  }
  if (account.businessId) {
    return state.businesses.find((b) => b.id === account.businessId)?.name ?? account.name
  }
  return account.name
}

/** Current accounts only — when each was last updated for the overview widget. */
export function getCurrentAccountFreshnessEntries(
  state: AppState,
  scope: ViewScope,
): AccountFreshnessEntry[] {
  return getCashAccounts(getAccountsForScope(state, scope))
    .filter((account) => account.active && account.type === 'current')
    .map((account) => {
      const daysAgo = daysBetween(account.updatedAt)
      return {
        accountId: account.id,
        label: accountFreshnessLabel(state, account),
        daysAgo,
        freshness: getFreshness(daysAgo),
        freshnessLabel: getFreshnessLabel(daysAgo),
      }
    })
    .sort((a, b) => b.daysAgo - a.daysAgo || a.label.localeCompare(b.label))
}

export function groupAccountFreshnessEntries(entries: AccountFreshnessEntry[]): GroupedAccountFreshness[] {
  const groups = new Map<string, GroupedAccountFreshness>()
  for (const entry of entries) {
    const existing = groups.get(entry.freshnessLabel)
    if (existing) {
      existing.count += 1
      existing.accountNames.push(entry.label)
      continue
    }
    groups.set(entry.freshnessLabel, {
      freshnessLabel: entry.freshnessLabel,
      freshness: entry.freshness,
      count: 1,
      accountNames: [entry.label],
    })
  }

  const rank: Record<HealthLevel, number> = { green: 0, yellow: 1, orange: 2, red: 3 }
  return [...groups.values()].sort(
    (a, b) => rank[b.freshness] - rank[a.freshness] || b.count - a.count,
  )
}

export function getWorstAccountFreshness(entries: AccountFreshnessEntry[]): HealthLevel {
  const rank: Record<HealthLevel, number> = { green: 0, yellow: 1, orange: 2, red: 3 }
  return entries.reduce<HealthLevel>(
    (worst, entry) => (rank[entry.freshness] > rank[worst] ? entry.freshness : worst),
    'green',
  )
}
