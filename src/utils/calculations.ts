import type {
  Account,
  AppState,
  Commitment,
  CommitmentViews,
  DashboardMetrics,
  HealthLevel,
  ReservePlanner,
  ViewScope,
} from '../types'
import {
  buildCommitmentViews,
  countDueRowsNeedingAttention,
  getDerivedDueRowStatus,
  sumCommittedFunds,
  worstDueRowStatus,
} from './commitmentCalculations'
import {
  buildReserveAccruingRows,
  buildReserveAccruingRowsForSharedColumn,
  buildReserveDueRows,
  buildReserveDueRowsForSharedColumn,
  summarizeReservePlanner,
  getMonthAccrualProgress,
  getReserveMonthlyTargetForScope,
} from './reserveCalculations'
import { sortByOrder } from './sortOrder'
import {
  daysBetween,
  getFreshness,
  getFreshnessLabel,
} from './snapshots'
import {
  businessHasVenues,
  getBusinessIdsForScope,
  getBusinessesInGroup,
  getVenueIdsForScope,
  getVenuesInBusiness,
  itemMatchesColumnScope,
  itemMatchesScope,
  itemMatchesSharedColumnScope,
} from './scope'
import { sumAccountBalances } from './amounts'
import { getEffectiveReceiptAmount } from './receiptCalculations'
import { FRESHNESS_ENCOURAGEMENT } from '../content/livingDashboard'
import { filterRemindersForScope, getDiaryAttentionBuckets } from './businessHub'
import { getPlannersNeedingMonthlyCheckIn } from './reserveCheckIn'

export function getAccountsForScope(state: AppState, scope: ViewScope): Account[] {
  const venueIds = getVenueIdsForScope(state, scope)
  const businessIds = getBusinessIdsForScope(state, scope)

  return state.accounts.filter((a) => {
    if (!a.active) return false
    if (a.venueId && venueIds.includes(a.venueId)) return true
    if (a.businessId && !a.venueId && businessIds.includes(a.businessId)) return true
    return false
  })
}

/** Accounts on a shared breakdown column (business-wide or group-wide, not venue). */
export function getAccountsForSharedColumnScope(state: AppState, scope: ViewScope): Account[] {
  if (scope.type === 'business') {
    return state.accounts.filter((a) => a.active && a.businessId === scope.id && !a.venueId)
  }
  if (scope.type === 'group') {
    return state.accounts.filter((a) => a.active && !a.businessId && !a.venueId)
  }
  return []
}

export function getCashAccounts(accounts: Account[]): Account[] {
  return accounts.filter((a) => a.type === 'current' || a.type === 'savings')
}

export function groupAccountsForDisplay(
  state: AppState,
  scope: ViewScope,
): Array<{ businessName: string; venueName: string | null; label: string; accounts: Account[] }> {
  const accounts = getAccountsForScope(state, scope)
  const groups: Array<{ businessName: string; venueName: string | null; label: string; accounts: Account[] }> = []

  const businessLevelIds = [
    ...new Set(accounts.filter((a) => a.businessId && !a.venueId).map((a) => a.businessId!)),
  ]
  for (const businessId of businessLevelIds) {
    const business = state.businesses.find((b) => b.id === businessId)!
    const bizAccounts = accounts.filter((a) => a.businessId === businessId && !a.venueId)
    if (bizAccounts.length > 0) {
      groups.push({
        businessName: business.name,
        venueName: null,
        label: businessHasVenues(state, businessId) ? 'Business savings' : business.name,
        accounts: bizAccounts,
      })
    }
  }

  const venueIds = [...new Set(accounts.filter((a) => a.venueId).map((a) => a.venueId!))]
  for (const venueId of venueIds) {
    const venue = state.venues.find((v) => v.id === venueId)!
    const business = state.businesses.find((b) => b.id === venue.businessId)!
    groups.push({
      businessName: business.name,
      venueName: venue.name,
      label: venue.name,
      accounts: accounts.filter((a) => a.venueId === venueId),
    })
  }

  return groups
}

export function getCommitmentsForScope(state: AppState, scope: ViewScope): Commitment[] {
  return state.commitments.filter((c) => itemMatchesScope(state, scope, c.scopeLevel, c.scopeId))
}

export function getCommitmentsForColumnScope(state: AppState, scope: ViewScope): Commitment[] {
  return state.commitments.filter((c) =>
    itemMatchesColumnScope(state, scope, c.scopeLevel, c.scopeId),
  )
}

export function getReceiptsForScope(state: AppState, scope: ViewScope) {
  const receipts = state.expectedReceipts.filter(
    (r) => !r.received && itemMatchesScope(state, scope, r.scopeLevel, r.scopeId),
  )
  return sortByOrder(receipts, (r) => r.sortOrder)
}

export function getReceiptsForColumnScope(state: AppState, scope: ViewScope) {
  const receipts = state.expectedReceipts.filter(
    (r) => !r.received && itemMatchesColumnScope(state, scope, r.scopeLevel, r.scopeId),
  )
  return sortByOrder(receipts, (r) => r.sortOrder)
}

export function getCommitmentsForSharedColumnScope(state: AppState, scope: ViewScope): Commitment[] {
  return state.commitments.filter((c) =>
    itemMatchesSharedColumnScope(state, scope, c.scopeLevel, c.scopeId),
  )
}

export function getReceiptsForSharedColumnScope(state: AppState, scope: ViewScope) {
  const receipts = state.expectedReceipts.filter(
    (r) => !r.received && itemMatchesSharedColumnScope(state, scope, r.scopeLevel, r.scopeId),
  )
  return sortByOrder(receipts, (r) => r.sortOrder)
}

/** Metrics for a single breakdown column (venue columns exclude shared business costs). */
export function calculateColumnDashboard(
  state: AppState,
  scope: ViewScope,
): Pick<DashboardMetrics, 'cash' | 'committedFunds' | 'expectedReceipts' | 'trueBalance'> {
  const accounts = getAccountsForScope(state, scope)
  const cashAccounts = getCashAccounts(accounts)
  const cash = sumAccountBalances(cashAccounts)

  const commitments = getCommitmentsForColumnScope(state, scope)
  const reserveRows = buildReserveAccruingRows(state, scope)
  const reserveDueRows = buildReserveDueRows(state, scope)
  const committedFunds = sumCommittedFunds(commitments, reserveRows, reserveDueRows)
  const receipts = getReceiptsForColumnScope(state, scope)
  const expectedReceipts = receipts.reduce((sum, r) => sum + getEffectiveReceiptAmount(r), 0)
  const trueBalance = cash - committedFunds + expectedReceipts

  return { cash, committedFunds, expectedReceipts, trueBalance }
}

/** Metrics for a shared breakdown column (business-wide or group-wide items only). */
export function calculateSharedColumnDashboard(
  state: AppState,
  scope: ViewScope,
): Pick<DashboardMetrics, 'cash' | 'committedFunds' | 'expectedReceipts' | 'trueBalance'> {
  const accounts = getAccountsForSharedColumnScope(state, scope)
  const cashAccounts = getCashAccounts(accounts)
  const cash = sumAccountBalances(cashAccounts)

  const commitments = getCommitmentsForSharedColumnScope(state, scope)
  const reserveRows = buildReserveAccruingRowsForSharedColumn(state, scope)
  const reserveDueRows = buildReserveDueRowsForSharedColumn(state, scope)
  const committedFunds = sumCommittedFunds(commitments, reserveRows, reserveDueRows)
  const receipts = getReceiptsForSharedColumnScope(state, scope)
  const expectedReceipts = receipts.reduce((sum, r) => sum + getEffectiveReceiptAmount(r), 0)
  const trueBalance = cash - committedFunds + expectedReceipts

  return { cash, committedFunds, expectedReceipts, trueBalance }
}

export function getReservePlannersForScope(state: AppState, scope: ViewScope): ReservePlanner[] {
  const businessIds = getBusinessIdsForScope(state, scope)
  return state.reservePlanners.filter((p) => businessIds.includes(p.businessId))
}

export function getReservePlannerForScope(state: AppState, scope: ViewScope) {
  const planners = getReservePlannersForScope(state, scope)
  return planners[0] ?? null
}

export function getLastBalanceUpdateDate(state: AppState, scope: ViewScope): Date | null {
  const scoped = state.snapshots
    .filter((s) => s.scopeType === scope.type && s.scopeId === scope.id)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (scoped.length > 0) {
    return new Date(scoped[scoped.length - 1].updatedAt)
  }

  const accounts = getCashAccounts(getAccountsForScope(state, scope))
  if (accounts.length === 0) return null

  const latestMs = Math.max(...accounts.map((a) => new Date(a.updatedAt).getTime()))
  return new Date(latestMs)
}

function buildAttention(
  commitmentViews: CommitmentViews,
  reserveBelowTarget: boolean,
  freshness: HealthLevel,
  state: AppState,
  scope: ViewScope,
): DashboardMetrics['attentionItems'] {
  const items: DashboardMetrics['attentionItems'] = []

  if (freshness === 'orange' || freshness === 'red') {
    items.push({
      id: 'balances-stale',
      level: freshness === 'red' ? 'red' : 'orange',
      title: freshness === 'red' ? 'Balances need updating' : 'Balances getting older',
      detail: FRESHNESS_ENCOURAGEMENT[freshness],
      targetSection: 'committed-funds',
      widgetId: 'overview-balances',
    })
  }

  const diaryReminders = filterRemindersForScope(state, scope)
  const { overdue: diaryOverdue, dueSoon: diaryDueSoon } = getDiaryAttentionBuckets(diaryReminders)

  if (diaryOverdue.length > 0) {
    const first = diaryOverdue[0]!
    items.push({
      id: 'diary-overdue',
      level: 'red',
      title:
        diaryOverdue.length === 1
          ? `Diary overdue: ${first.title}`
          : `${diaryOverdue.length} diary items overdue`,
      detail:
        diaryOverdue.length === 1
          ? `Was due ${first.date}. Open Business Hub to clear it.`
          : 'Open your business diary to clear overdue reminders.',
      targetSection: 'business-hub',
      widgetId: 'business-diary',
      dismissible: false,
    })
  }

  const pendingReserveCheckIn = getPlannersNeedingMonthlyCheckIn(state, scope)
  if (pendingReserveCheckIn.length > 0) {
    items.push({
      id: 'reserve-monthly-checkin',
      level: 'orange',
      title:
        pendingReserveCheckIn.length === 1
          ? 'Reserve planner — monthly review'
          : `${pendingReserveCheckIn.length} reserve planners need a monthly review`,
      detail: 'Review this month’s reserve target and confirm your transfer in the Reserve Planner.',
      targetSection: 'reserve-planner',
      widgetId: 'reserve-planner',
    })
  }

  const urgentDue = countDueRowsNeedingAttention(commitmentViews)
  const overdue = urgentDue.filter((row) => {
    const status = getDerivedDueRowStatus(row)
    return status === 'critical' || status === 'risk'
  })
  const dueSoon = urgentDue.filter((row) => getDerivedDueRowStatus(row) === 'warning')

  if (overdue.length > 0) {
    items.push({
      id: 'due-overdue',
      level: 'red',
      title: overdue.length === 1 ? '1 overdue item in Due' : `${overdue.length} overdue items in Due`,
      detail: 'Click to acknowledge',
      targetSection: 'committed-funds',
      widgetId: 'due',
      dismissible: true,
    })
  }
  if (dueSoon.length > 0) {
    items.push({
      id: 'due-soon',
      level: 'orange',
      title: dueSoon.length === 1 ? '1 item due soon' : `${dueSoon.length} items due soon`,
      detail: 'Click to acknowledge',
      targetSection: 'committed-funds',
      widgetId: 'due',
      dismissible: true,
    })
  }

  if (reserveBelowTarget) {
    items.push({
      id: 'reserve',
      level: 'orange',
      title: 'Reserve below target',
      detail: 'At least one reserve planner is below this month’s target.',
      targetSection: 'reserve-planner',
      widgetId: 'reserve-planner',
    })
  }


  if (diaryDueSoon.length > 0) {
    const first = diaryDueSoon[0]!
    items.push({
      id: 'diary-due-soon',
      level: 'orange',
      title:
        diaryDueSoon.length === 1
          ? `Diary due soon: ${first.title}`
          : `${diaryDueSoon.length} diary items due within a week`,
      detail:
        diaryDueSoon.length === 1
          ? `Due ${first.date}. Click to acknowledge or open Business Hub.`
          : 'Click to acknowledge these reminders.',
      targetSection: 'business-hub',
      widgetId: 'business-diary',
      dismissible: true,
    })
  }

  return items
}

function deriveHealth(
  freshness: HealthLevel,
  commitmentViews: CommitmentViews,
  reserveBelowTarget: boolean,
): HealthLevel {
  if (worstDueRowStatus(countDueRowsNeedingAttention(commitmentViews)) === 'critical') return 'red'
  if (reserveBelowTarget) return 'orange'
  if (freshness !== 'green') return freshness
  return 'green'
}

function getChildScopes(state: AppState, scope: ViewScope): ViewScope[] {
  if (scope.type === 'group') {
    return getBusinessesInGroup(state, scope.id).map((b) => ({ type: 'business' as const, id: b.id }))
  }
  if (scope.type === 'business') {
    return getVenuesInBusiness(state, scope.id).map((v) => ({ type: 'venue' as const, id: v.id }))
  }
  return []
}

function sumChildFinancials(state: AppState, scope: ViewScope) {
  const children = getChildScopes(state, scope)
  if (children.length === 0) return null

  const metrics = children.map((child) => calculateDashboard(state, child))
  return {
    cash: metrics.reduce((sum, m) => sum + m.cash, 0),
    committedFunds: metrics.reduce((sum, m) => sum + m.committedFunds, 0),
    monthAccruingReserve: metrics.reduce((sum, m) => sum + m.monthAccruingReserve, 0),
    reserveMonthlyTarget: metrics.reduce((sum, m) => sum + m.reserveMonthlyTarget, 0),
    expectedReceipts: metrics.reduce((sum, m) => sum + m.expectedReceipts, 0),
    trueBalance: metrics.reduce((sum, m) => sum + m.trueBalance, 0),
  }
}

export function calculateDashboard(state: AppState, scope: ViewScope): DashboardMetrics {
  const accounts = getAccountsForScope(state, scope)
  const cashAccounts = getCashAccounts(accounts)
  const cashFromAccounts = sumAccountBalances(cashAccounts)

  const commitments = getCommitmentsForScope(state, scope)
  const reserveRows = buildReserveAccruingRows(state, scope)
  const reserveDueRows = buildReserveDueRows(state, scope)
  const reserveMonthlyTarget = getReserveMonthlyTargetForScope(state, scope)
  const monthAccrualProgress = getMonthAccrualProgress()
  const monthAccruingReserve = reserveRows.reduce((sum, row) => sum + row.accruedAmount, 0)
  const committedFundsFromScope = sumCommittedFunds(commitments, reserveRows, reserveDueRows)
  const commitmentViews = buildCommitmentViews(commitments, reserveRows, reserveDueRows)

  const receipts = getReceiptsForScope(state, scope)
  const expectedReceiptsFromScope = receipts.reduce(
    (sum, r) => sum + getEffectiveReceiptAmount(r),
    0,
  )

  const childTotals = sumChildFinancials(state, scope)
  const cash = childTotals?.cash ?? cashFromAccounts
  const committedFunds = committedFundsFromScope
  const monthAccruingReserveTotal = monthAccruingReserve
  const reserveMonthlyTargetTotal = reserveMonthlyTarget
  const expectedReceipts = expectedReceiptsFromScope
  const trueBalance = cash - committedFunds + expectedReceipts

  const lastUpdate = getLastBalanceUpdateDate(state, scope)
  const updatedDaysAgo = lastUpdate ? daysBetween(lastUpdate) : null
  const freshness = updatedDaysAgo !== null ? getFreshness(updatedDaysAgo) : 'red'
  const freshnessLabel = lastUpdate && updatedDaysAgo !== null ? getFreshnessLabel(updatedDaysAgo) : 'Never updated'

  const reservePlannersList = getReservePlannersForScope(state, scope)
  const reserveSummaries = reservePlannersList.map((p) => summarizeReservePlanner(state, p))
  const reservePlanner = reservePlannersList[0] ?? null
  const reserveBelowTarget = reserveSummaries.some((s) => s.status !== 'green')

  return {
    cash,
    committedFunds,
    monthAccruingReserve: monthAccruingReserveTotal,
    reserveMonthlyTarget: reserveMonthlyTargetTotal,
    monthAccrualProgress,
    expectedReceipts,
    trueBalance,
    updatedDaysAgo: updatedDaysAgo ?? 999,
    freshness,
    freshnessLabel,
    health: deriveHealth(freshness, commitmentViews, reserveBelowTarget),
    commitmentViews,
    receipts,
    reservePlanner,
    reservePlanners: reserveSummaries,
    attentionItems: buildAttention(commitmentViews, reserveBelowTarget, freshness, state, scope),
  }
}
