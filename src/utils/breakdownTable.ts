import type { Account, AppState, ViewScope } from '../types'
import { sumAccountBalances } from './amounts'
import {
  calculateColumnDashboard,
  calculateDashboard,
  calculateSharedColumnDashboard,
  getAccountsForScope,
  getAccountsForSharedColumnScope,
  getCashAccounts,
  getCommitmentsForColumnScope,
  getCommitmentsForSharedColumnScope,
  getReceiptsForColumnScope,
  getReceiptsForSharedColumnScope,
} from './calculations'
import { buildCommitmentViews, summarizeCommittedFundsBreakdown } from './commitmentCalculations'
import { getEffectiveReceiptAmount } from './receiptCalculations'
import { columnLabel } from './format'
import { buildReserveAccruingRows, buildReserveAccruingRowsForSharedColumn, buildReserveDueRows, buildReserveDueRowsForSharedColumn } from './reserveCalculations'
import { businessHasVenues, getBusinessesInGroup, getVenuesInBusiness } from './scope'

export interface ScopeCostBreakdown {
  /** Accrued monthly costs still building this cycle */
  accruingMonthly: number
  /** Accrued reserve pots still building */
  accruingReserve: number
  /** Amounts in Due now (includes planned that are due) */
  due: number
  /** Planned one-offs not yet in Due */
  plannedNotDue: number
  /** Sum of the cost parts above — matches Total costs in the overview */
  totalCosts: number
  /** Expected receipts counted toward True Balance */
  expectedReceipts: number
  /**
   * Of the cost total, how much sits on child scopes vs this parent only.
   * Not additive — already included in the lines above.
   */
  ofWhichChildCosts?: number
  ofWhichSharedCosts?: number
  ofWhichChildReceipts?: number
  ofWhichSharedReceipts?: number
  /** Label for child / shared split (venue vs business-wide, or business vs group-wide) */
  childSplitLabel?: string
  sharedSplitLabel?: string
}

function sumEffectiveReceipts(receipts: ReturnType<typeof getReceiptsForColumnScope>): number {
  let expectedReceipts = 0
  for (const receipt of receipts) {
    expectedReceipts += getEffectiveReceiptAmount(receipt)
  }
  return expectedReceipts
}

function costPartsFromViews(views: ReturnType<typeof buildCommitmentViews>) {
  const breakdown = summarizeCommittedFundsBreakdown(views)
  return {
    accruingMonthly: breakdown.accruedMonthly,
    accruingReserve: breakdown.accruedReserve,
    due: breakdown.outstandingDue,
    plannedNotDue: breakdown.outstandingPlanned,
    totalCosts: breakdown.total,
  }
}

export function getScopeCostBreakdown(state: AppState, scope: ViewScope): ScopeCostBreakdown {
  const commitments = getCommitmentsForColumnScope(state, scope)
  const reserveRows = buildReserveAccruingRows(state, scope)
  const reserveDueRows = buildReserveDueRows(state, scope)
  const views = buildCommitmentViews(commitments, reserveRows, reserveDueRows)
  const parts = costPartsFromViews(views)
  const expectedReceipts = sumEffectiveReceipts(getReceiptsForColumnScope(state, scope))

  const result: ScopeCostBreakdown = {
    ...parts,
    expectedReceipts,
  }

  if (scope.type === 'business' && businessHasVenues(state, scope.id)) {
    const venues = getVenuesInBusiness(state, scope.id)
    let childCosts = 0
    let childReceipts = 0
    for (const venue of venues) {
      const venueBreakdown = getScopeCostBreakdown(state, { type: 'venue', id: venue.id })
      childCosts += venueBreakdown.totalCosts
      childReceipts += venueBreakdown.expectedReceipts
    }
    const sharedCosts = Math.max(0, result.totalCosts - childCosts)
    const sharedReceipts = Math.max(0, result.expectedReceipts - childReceipts)
    if (sharedCosts > 0 || childCosts > 0) {
      result.ofWhichChildCosts = childCosts
      result.ofWhichSharedCosts = sharedCosts
      result.childSplitLabel = 'At venues'
      result.sharedSplitLabel = 'Business-wide (not at a venue)'
    }
    if (sharedReceipts > 0 || childReceipts > 0) {
      result.ofWhichChildReceipts = childReceipts
      result.ofWhichSharedReceipts = sharedReceipts
    }
  }

  if (scope.type === 'group') {
    const businesses = getBusinessesInGroup(state, scope.id)
    let childCosts = 0
    let childReceipts = 0
    for (const business of businesses) {
      const businessBreakdown = getScopeCostBreakdown(state, { type: 'business', id: business.id })
      childCosts += businessBreakdown.totalCosts
      childReceipts += businessBreakdown.expectedReceipts
    }
    const sharedCosts = Math.max(0, result.totalCosts - childCosts)
    const sharedReceipts = Math.max(0, result.expectedReceipts - childReceipts)
    if (sharedCosts > 0 || childCosts > 0) {
      result.ofWhichChildCosts = childCosts
      result.ofWhichSharedCosts = sharedCosts
      result.childSplitLabel = 'At businesses'
      result.sharedSplitLabel = 'Group-wide (not at a business)'
    }
    if (sharedReceipts > 0 || childReceipts > 0) {
      result.ofWhichChildReceipts = childReceipts
      result.ofWhichSharedReceipts = sharedReceipts
    }
  }

  return result
}

export function getSharedScopeCostBreakdown(state: AppState, scope: ViewScope): ScopeCostBreakdown {
  const commitments = getCommitmentsForSharedColumnScope(state, scope)
  const reserveRows = buildReserveAccruingRowsForSharedColumn(state, scope)
  const reserveDueRows = buildReserveDueRowsForSharedColumn(state, scope)
  const views = buildCommitmentViews(commitments, reserveRows, reserveDueRows)
  const parts = costPartsFromViews(views)
  const expectedReceipts = sumEffectiveReceipts(getReceiptsForSharedColumnScope(state, scope))

  return {
    ...parts,
    expectedReceipts,
  }
}

export function hasSharedScopeCosts(state: AppState, scope: ViewScope): boolean {
  const { committedFunds, expectedReceipts } = calculateSharedColumnDashboard(state, scope)
  return committedFunds > 0 || expectedReceipts > 0
}

export interface BreakdownColumn {
  key: string
  label: string
  scope: ViewScope
  isRollup: boolean
  isSharedScope?: boolean
  columnTitle?: string
  current: number
  savings: number
  currentAccounts: Account[]
  savingsAccounts: Account[]
  cash: number
  committedFunds: number
  expectedReceipts: number
  trueBalance: number
}

function columnFromScope(
  state: AppState,
  scope: ViewScope,
  label: string,
  isRollup: boolean,
  /** When true, include parent-scope costs (full dashboard). Child partition columns must pass false. */
  useRollupTotals = false,
): BreakdownColumn {
  const metrics = useRollupTotals ? calculateDashboard(state, scope) : calculateColumnDashboard(state, scope)
  const accounts = getCashAccounts(getAccountsForScope(state, scope))
  const currentAccounts = accounts.filter((a) => a.type === 'current')
  const savingsAccounts = accounts.filter((a) => a.type === 'savings')
  const current = sumAccountBalances(currentAccounts)
  const savings = sumAccountBalances(savingsAccounts)
  const cash = current + savings

  return {
    key: scope.type === 'venue' ? scope.id : `${scope.type}-${scope.id}${isRollup ? '-rollup' : ''}`,
    label,
    scope,
    isRollup,
    current,
    savings,
    currentAccounts,
    savingsAccounts,
    cash,
    committedFunds: metrics.committedFunds,
    expectedReceipts: metrics.expectedReceipts,
    trueBalance: metrics.trueBalance,
  }
}

function columnFromSharedScope(state: AppState, scope: ViewScope, label: string, columnTitle: string): BreakdownColumn {
  const metrics = calculateSharedColumnDashboard(state, scope)
  const accounts = getCashAccounts(getAccountsForSharedColumnScope(state, scope))
  const currentAccounts = accounts.filter((a) => a.type === 'current')
  const savingsAccounts = accounts.filter((a) => a.type === 'savings')
  const current = sumAccountBalances(currentAccounts)
  const savings = sumAccountBalances(savingsAccounts)
  const cash = current + savings

  return {
    key: `${scope.type}-${scope.id}-shared`,
    label,
    scope,
    isRollup: false,
    isSharedScope: true,
    columnTitle,
    current,
    savings,
    currentAccounts,
    savingsAccounts,
    cash,
    committedFunds: metrics.committedFunds,
    expectedReceipts: metrics.expectedReceipts,
    trueBalance: metrics.trueBalance,
  }
}

export function buildBreakdownColumns(state: AppState, scope: ViewScope): BreakdownColumn[] {
  if (scope.type === 'venue') {
    const venue = state.venues.find((v) => v.id === scope.id)
    if (!venue) return []
    return [columnFromScope(state, scope, columnLabel(venue.name), false, true)]
  }

  if (scope.type === 'group') {
    const group = state.groups.find((g) => g.id === scope.id)
    const businesses = getBusinessesInGroup(state, scope.id)

    if (businesses.length === 1) {
      const biz = businesses[0]!
      return buildBreakdownColumns(state, { type: 'business', id: biz.id })
    }

    // Child columns are partitioned (column scope); only TOTAL uses full rollup metrics.
    const columns = businesses.map((b) =>
      columnFromScope(state, { type: 'business', id: b.id }, columnLabel(b.name), false, false),
    )
    const shared = hasSharedScopeCosts(state, scope)
      ? [
          columnFromSharedScope(
            state,
            scope,
            'GROUP',
            group ? `Group-wide — ${group.name}` : 'Group-wide costs',
          ),
        ]
      : []
    const rollup = columnFromScope(state, scope, 'TOTAL', true, true)
    return [...columns, ...shared, rollup]
  }

  const business = state.businesses.find((b) => b.id === scope.id)
  if (!business) return []

  const venues = getVenuesInBusiness(state, scope.id)
  if (venues.length === 0) {
    return [columnFromScope(state, scope, columnLabel(business.name), false, true)]
  }

  if (venues.length <= 1) {
    return [columnFromScope(state, scope, columnLabel(business.name), false, true)]
  }

  // Venue columns exclude business-wide costs (those go in BIZ); TOTAL is the full business.
  const columns = venues.map((v) =>
    columnFromScope(state, { type: 'venue', id: v.id }, columnLabel(v.name), false, false),
  )
  const shared = hasSharedScopeCosts(state, scope)
    ? [
        columnFromSharedScope(
          state,
          scope,
          'BIZ',
          `Business-wide — ${business.name}`,
        ),
      ]
    : []
  const rollup = columnFromScope(state, scope, 'TOTAL', true, true)
  return [...columns, ...shared, rollup]
}
