import type { Account, AppState, BalanceSnapshot, GraphRange, HealthLevel, TrendDirection, ViewScope } from '../types'
import { getBusinessIdsForScope, getVenueIdsForScope } from './scope'
import { getReferenceDate, getReferenceDateKey } from './referenceDate'

export const todayDateKey = () => getReferenceDateKey()

export const daysBetween = (from: string | Date, to: Date = getReferenceDate()) => {
  const start = typeof from === 'string' ? new Date(from) : from
  if (isNaN(start.getTime())) return 0
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  const diff = toDay.getTime() - startDay.getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

export function getFreshness(daysAgo: number): HealthLevel {
  if (daysAgo === 0) return 'green'
  if (daysAgo <= 3) return 'yellow'
  if (daysAgo <= 7) return 'orange'
  return 'red'
}

export function getFreshnessLabel(daysAgo: number): string {
  if (daysAgo === 0) return 'Updated today'
  if (daysAgo === 1) return 'Updated yesterday'
  return `Updated ${daysAgo} days ago`
}

const FRESHNESS_RANK: Record<HealthLevel, number> = {
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3,
}

export function getAccountsFreshness(accounts: Pick<Account, 'updatedAt'>[]): HealthLevel {
  if (accounts.length === 0) return 'red'
  return accounts.reduce<HealthLevel>((worst, account) => {
    const level = getFreshness(daysBetween(account.updatedAt))
    return FRESHNESS_RANK[level] > FRESHNESS_RANK[worst] ? level : worst
  }, 'green')
}

export function getAccountsFreshnessLabel(accounts: Pick<Account, 'updatedAt'>[]): string {
  if (accounts.length === 0) return 'Never updated'
  const days = Math.max(...accounts.map((account) => daysBetween(account.updatedAt)))
  return getFreshnessLabel(days)
}

const rangeLabels: Record<GraphRange, string> = {
  '30d': '30 days',
  '90d': '90 days',
  '12m': '12 months',
  all: 'all time',
}

export function getRangeLabel(range: GraphRange) {
  return rangeLabels[range]
}

export function getSnapshotsForScope(state: AppState, scope: ViewScope): BalanceSnapshot[] {
  return state.snapshots
    .filter((s) => s.scopeType === scope.type && s.scopeId === scope.id)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** All snapshot ids for a calendar day within the current view scope and scopes below it. */
export function getSnapshotIdsForDateInScope(
  state: AppState,
  date: string,
  viewScope: ViewScope,
): string[] {
  const businessIds = new Set(getBusinessIdsForScope(state, viewScope))
  const venueIds = new Set(getVenueIdsForScope(state, viewScope))

  return state.snapshots
    .filter((snap) => {
      if (snap.date !== date) return false
      if (snap.scopeType === viewScope.type && snap.scopeId === viewScope.id) return true
      if (snap.scopeType === 'business' && businessIds.has(snap.scopeId)) return true
      if (snap.scopeType === 'venue' && venueIds.has(snap.scopeId)) return true
      return false
    })
    .map((snap) => snap.id)
}

/** Parent scopes above the current scope (business → group, venue → business → group). */
export function getAncestorScopes(state: AppState, scope: ViewScope): ViewScope[] {
  const ancestors: ViewScope[] = []

  if (scope.type === 'venue') {
    const venue = state.venues.find((v) => v.id === scope.id)
    if (!venue) return ancestors
    ancestors.push({ type: 'business', id: venue.businessId })
    const business = state.businesses.find((b) => b.id === venue.businessId)
    if (business) ancestors.push({ type: 'group', id: business.groupId })
    return ancestors
  }

  if (scope.type === 'business') {
    const business = state.businesses.find((b) => b.id === scope.id)
    if (business) ancestors.push({ type: 'group', id: business.groupId })
  }

  return ancestors
}

/** Snapshot ids for a scope and its ancestors on a calendar day (for historical account balances). */
export function getSnapshotIdsForDateInScopeTree(
  state: AppState,
  date: string,
  scope: ViewScope,
): string[] {
  const ids = new Set(getSnapshotIdsForDateInScope(state, date, scope))
  for (const ancestor of getAncestorScopes(state, scope)) {
    for (const id of getSnapshotIdsForDateInScope(state, date, ancestor)) {
      ids.add(id)
    }
  }
  return [...ids]
}

export function snapshotScopeSpecificity(snap: BalanceSnapshot): number {
  if (snap.scopeType === 'venue') return 3
  if (snap.scopeType === 'business') return 2
  return 1
}

/** Saved snapshots for a scope tree on one day — least specific first so child scopes override. */
export function getSnapshotsForDateInScopeTree(
  state: AppState,
  date: string,
  scope: ViewScope,
): BalanceSnapshot[] {
  const ids = new Set(getSnapshotIdsForDateInScopeTree(state, date, scope))
  return state.snapshots
    .filter((snap) => ids.has(snap.id))
    .sort((a, b) => snapshotScopeSpecificity(a) - snapshotScopeSpecificity(b))
}

export function filterSnapshotsByRange(
  snapshots: BalanceSnapshot[],
  range: GraphRange,
  fromDate?: string | null,
): BalanceSnapshot[] {
  let filtered = snapshots

  if (range !== 'all') {
    const cutoff = new Date()
    if (range === '30d') cutoff.setDate(cutoff.getDate() - 30)
    else if (range === '90d') cutoff.setDate(cutoff.getDate() - 90)
    else cutoff.setMonth(cutoff.getMonth() - 12)

    const cutoffKey = cutoff.toISOString().slice(0, 10)
    filtered = filtered.filter((s) => s.date >= cutoffKey)
  }

  // Explicit start date: ignore anything earlier (e.g. before a major one-off event).
  if (fromDate) {
    filtered = filtered.filter((s) => s.date >= fromDate)
  }

  return filtered
}

export function computeTrendStats(snapshots: BalanceSnapshot[], range: GraphRange) {
  const rangeLabel = getRangeLabel(range)

  if (snapshots.length < 2) {
    return { change: null, direction: null as TrendDirection | null, rangeLabel }
  }

  const first = snapshots[0].trueBalance
  const last = snapshots[snapshots.length - 1].trueBalance
  const change = last - first
  const threshold = Math.max(100, Math.abs(first) * 0.01)

  let direction: TrendDirection
  if (change > threshold) direction = 'improving'
  else if (change < -threshold) direction = 'declining'
  else direction = 'stable'

  return { change, direction, rangeLabel }
}

export function formatSnapshotDate(dateKey: string) {
  const d = new Date(dateKey + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatSnapshotDateLong(dateKey: string) {
  const d = new Date(dateKey + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
