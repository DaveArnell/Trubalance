import type { Account, AppState, ViewScope } from '../types'
import { sumAccountBalances, toAmount } from './amounts'
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
import { columnLabel } from './format'
import { buildReserveAccruingRows, buildReserveAccruingRowsForSharedColumn, buildReserveDueRows, buildReserveDueRowsForSharedColumn } from './reserveCalculations'
import { businessHasVenues, getBusinessesInGroup, getVenuesInBusiness } from './scope'

export interface ScopeCostBreakdown {
  accruing: number
  accruingMonthly: number
  accruingReserve: number
  due: number
  planned: number
  expectedReceipts: number
  businessShared?: number
  businessSharedReceipts?: number
  groupShared?: number
  groupSharedReceipts?: number
}

export function getScopeCostBreakdown(state: AppState, scope: ViewScope): ScopeCostBreakdown {
  const commitments = getCommitmentsForColumnScope(state, scope)
  const reserveRows = buildReserveAccruingRows(state, scope)
  const reserveDueRows = buildReserveDueRows(state, scope)
  const views = buildCommitmentViews(commitments, reserveRows, reserveDueRows)
  const breakdown = summarizeCommittedFundsBreakdown(views)
  const expectedReceipts = getReceiptsForColumnScope(state, scope).reduce(
    (sum, receipt) => sum + toAmount(receipt.amount),
    0,
  )

  const result: ScopeCostBreakdown = {
    accruing: breakdown.accruedMonthly + breakdown.accruedReserve,
    accruingMonthly: breakdown.accruedMonthly,
    accruingReserve: breakdown.accruedReserve,
    due: breakdown.outstandingDue,
    planned: breakdown.outstandingPlanned,
    expectedReceipts,
  }

  if (scope.type === 'business' && businessHasVenues(state, scope.id)) {
    const venues = getVenuesInBusiness(state, scope.id)
    const venueAccruing = venues.reduce((sum, venue) => {
      const venueBreakdown = getScopeCostBreakdown(state, { type: 'venue', id: venue.id })
      return sum + venueBreakdown.accruing
    }, 0)
    const venueDue = venues.reduce((sum, venue) => {
      const venueBreakdown = getScopeCostBreakdown(state, { type: 'venue', id: venue.id })
      return sum + venueBreakdown.due
    }, 0)
    const sharedAccruing = Math.max(0, result.accruing - venueAccruing)
    const sharedDue = Math.max(0, result.due - venueDue)
    if (sharedAccruing + sharedDue > 0) {
      result.businessShared = sharedAccruing + sharedDue
    }

    const venueReceipts = venues.reduce((sum, venue) => {
      const venueBreakdown = getScopeCostBreakdown(state, { type: 'venue', id: venue.id })
      return sum + venueBreakdown.expectedReceipts
    }, 0)
    const sharedReceipts = result.expectedReceipts - venueReceipts
    if (sharedReceipts > 0) {
      result.businessSharedReceipts = sharedReceipts
    }
  }

  if (scope.type === 'group') {
    const businesses = getBusinessesInGroup(state, scope.id)
    const businessAccruing = businesses.reduce((sum, business) => {
      const businessBreakdown = getScopeCostBreakdown(state, { type: 'business', id: business.id })
      return sum + businessBreakdown.accruing
    }, 0)
    const businessDue = businesses.reduce((sum, business) => {
      const businessBreakdown = getScopeCostBreakdown(state, { type: 'business', id: business.id })
      return sum + businessBreakdown.due
    }, 0)
    const businessPlanned = businesses.reduce((sum, business) => {
      const businessBreakdown = getScopeCostBreakdown(state, { type: 'business', id: business.id })
      return sum + businessBreakdown.planned
    }, 0)
    const sharedAccruing = Math.max(0, result.accruing - businessAccruing)
    const sharedDue = Math.max(0, result.due - businessDue)
    const sharedPlanned = Math.max(0, result.planned - businessPlanned)
    if (sharedAccruing + sharedDue + sharedPlanned > 0) {
      result.groupShared = sharedAccruing + sharedDue + sharedPlanned
    }

    const businessReceipts = businesses.reduce((sum, business) => {
      const breakdown = getScopeCostBreakdown(state, { type: 'business', id: business.id })
      return sum + breakdown.expectedReceipts
    }, 0)
    const sharedReceipts = result.expectedReceipts - businessReceipts
    if (sharedReceipts > 0) {
      result.groupSharedReceipts = sharedReceipts
    }
  }

  return result
}

export function getSharedScopeCostBreakdown(state: AppState, scope: ViewScope): ScopeCostBreakdown {
  const commitments = getCommitmentsForSharedColumnScope(state, scope)
  const reserveRows = buildReserveAccruingRowsForSharedColumn(state, scope)
  const reserveDueRows = buildReserveDueRowsForSharedColumn(state, scope)
  const views = buildCommitmentViews(commitments, reserveRows, reserveDueRows)
  const breakdown = summarizeCommittedFundsBreakdown(views)
  const expectedReceipts = getReceiptsForSharedColumnScope(state, scope).reduce(
    (sum, receipt) => sum + toAmount(receipt.amount),
    0,
  )

  return {
    accruing: breakdown.accruedMonthly + breakdown.accruedReserve,
    accruingMonthly: breakdown.accruedMonthly,
    accruingReserve: breakdown.accruedReserve,
    due: breakdown.outstandingDue,
    planned: breakdown.outstandingPlanned,
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
  useRollupTotals = false,
): BreakdownColumn {
  const metrics = useRollupTotals ? calculateDashboard(state, scope) : calculateColumnDashboard(state, scope)
  const allAccounts = getAccountsForScope(state, scope)
  const scopedAccounts =
    !useRollupTotals && scope.type === 'venue'
      ? allAccounts.filter((account) => account.venueId === scope.id)
      : allAccounts
  const accounts = getCashAccounts(scopedAccounts)
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
    const business = state.businesses.find((b) => b.id === venue.businessId)
    if (!business) return []
    const venuesInBusiness = state.venues.filter((v) => v.businessId === business.id)
    if (venuesInBusiness.length <= 1) {
      return [columnFromScope(state, scope, columnLabel(venue.name), false, true)]
    }
    const columns = venuesInBusiness.map((v) =>
      columnFromScope(state, { type: 'venue', id: v.id }, columnLabel(v.name), false),
    )
    const shared = hasSharedScopeCosts(state, { type: 'business', id: business.id })
      ? [
          columnFromSharedScope(
            state,
            { type: 'business', id: business.id },
            'BUSINESS',
            `Business-wide — ${business.name}`,
          ),
        ]
      : []
    const rollup = columnFromScope(state, { type: 'business', id: business.id }, 'BUSINESS', true, true)
    return [...columns, ...shared, rollup]
  }

  if (scope.type === 'group') {
    const group = state.groups.find((g) => g.id === scope.id)
    const businesses = state.businesses.filter((b) => b.groupId === scope.id)
    const columns = businesses.map((b) =>
      columnFromScope(state, { type: 'business', id: b.id }, columnLabel(b.name), false, true),
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
    const rollup = columnFromScope(state, scope, 'BUSINESS', true, true)
    return [...columns, ...shared, rollup]
  }

  const business = state.businesses.find((b) => b.id === scope.id)
  if (!business) return []

  // One column per business — venue accounts are updated via the Current Acc popover.
  return [columnFromScope(state, scope, columnLabel(business.name), false, true)]
}
