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
import { getEffectiveReceiptAmount, getReceiptTiming } from './receiptCalculations'
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
  receiptsBuildingUp?: number
  businessShared?: number
  businessSharedReceipts?: number
  groupShared?: number
  groupSharedReceipts?: number
}

function sumEffectiveReceipts(receipts: ReturnType<typeof getReceiptsForColumnScope>): {
  expectedReceipts: number
  receiptsBuildingUp: number
} {
  let expectedReceipts = 0
  let receiptsBuildingUp = 0
  for (const receipt of receipts) {
    const effective = getEffectiveReceiptAmount(receipt)
    expectedReceipts += effective
    if (getReceiptTiming(receipt) === 'accrual' && !receipt.received && effective > 0) {
      receiptsBuildingUp += effective
    }
  }
  return { expectedReceipts, receiptsBuildingUp }
}

export function getScopeCostBreakdown(state: AppState, scope: ViewScope): ScopeCostBreakdown {
  const commitments = getCommitmentsForColumnScope(state, scope)
  const reserveRows = buildReserveAccruingRows(state, scope)
  const reserveDueRows = buildReserveDueRows(state, scope)
  const views = buildCommitmentViews(commitments, reserveRows, reserveDueRows)
  const breakdown = summarizeCommittedFundsBreakdown(views)
  const { expectedReceipts, receiptsBuildingUp } = sumEffectiveReceipts(
    getReceiptsForColumnScope(state, scope),
  )

  const result: ScopeCostBreakdown = {
    accruing: breakdown.accruedMonthly + breakdown.accruedReserve,
    accruingMonthly: breakdown.accruedMonthly,
    accruingReserve: breakdown.accruedReserve,
    due: breakdown.outstandingDue,
    planned: breakdown.outstandingPlanned,
    expectedReceipts,
    receiptsBuildingUp,
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
  const { expectedReceipts, receiptsBuildingUp } = sumEffectiveReceipts(
    getReceiptsForSharedColumnScope(state, scope),
  )

  return {
    accruing: breakdown.accruedMonthly + breakdown.accruedReserve,
    accruingMonthly: breakdown.accruedMonthly,
    accruingReserve: breakdown.accruedReserve,
    due: breakdown.outstandingDue,
    planned: breakdown.outstandingPlanned,
    expectedReceipts,
    receiptsBuildingUp,
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

  const columns = venues.map((v) =>
    columnFromScope(state, { type: 'venue', id: v.id }, columnLabel(v.name), false, true),
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
