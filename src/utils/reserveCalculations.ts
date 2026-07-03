import type {
  Account,
  AppState,
  Commitment,
  CommitmentAccruingRow,
  CommitmentDueRow,
  HealthLevel,
  ReserveBill,
  ReserveMonthConfirmation,
  ReserveMonthPlan,
  ReservePlanner,
  ReservePlannerSummary,
  ViewScope,
} from '../types'
import { toAmount } from './amounts'
import { getAccountBusinessId } from './accounts'
import { currentPeriod } from './commitmentCalculations'
import { MONTHS, currentMonthIndex, formatCurrency } from './format'
import { getBusinessIdsForScope, getVenueIdsForScope } from './scope'
import { getReferenceDate } from './referenceDate'
import { sortByOrder } from './sortOrder'

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export const BILL_CATEGORIES = [
  'VAT',
  'Corporation Tax',
  'Business Insurance',
  'Building Insurance',
  'Insurance',
  'Rent',
  'Rates',
  'Utilities',
  'Licences',
  'Service Charge',
  'Other',
] as const

export const NEW_BILL_TYPE = '__new__'
export const DEFAULT_RESERVE_BILL_DUE_DAY = 1

export function getBillTypeOptions(state: AppState): string[] {
  const fromBills = state.reservePlanners.flatMap((p) => p.bills.map((b) => b.name))
  const combined = [...BILL_CATEGORIES, ...fromBills]
  return [...new Set(combined)].sort((a, b) => a.localeCompare(b))
}

export function billAmountInMonth(bill: ReserveBill, month: string): number {
  return toAmount(bill.monthAmounts[month])
}

export function billAnnualAmount(bill: ReserveBill): number {
  return MONTHS.reduce((sum, month) => sum + billAmountInMonth(bill, month), 0)
}

export function billMonthlyAmount(bill: ReserveBill): number {
  return billAnnualAmount(bill) / 12
}

export function plannerTotalAnnual(bills: ReserveBill[]): number {
  return bills.reduce((sum, bill) => sum + billAnnualAmount(bill), 0)
}

/** Fixed monthly transfer — total annual bills spread evenly across the year. */
export function plannerMonthlyDeposit(bills: ReserveBill[]): number {
  const annual = plannerTotalAnnual(bills)
  return annual > 0 ? annual / 12 : 0
}

export function monthAmountsFromPatch(
  current: Record<string, number>,
  month: string,
  amount: number | null,
): Record<string, number> {
  const next = { ...current }
  if (amount == null || Number.isNaN(amount) || amount === 0) {
    delete next[month]
  } else {
    next[month] = amount
  }
  return next
}

export function monthDueDaysFromPatch(
  current: Record<string, number>,
  month: string,
  amount: number | null,
  dueDay?: number,
): Record<string, number> {
  const next = { ...current }
  if (amount == null || Number.isNaN(amount) || amount === 0) {
    delete next[month]
  } else {
    const day = dueDay ?? current[month] ?? DEFAULT_RESERVE_BILL_DUE_DAY
    next[month] = Math.min(31, Math.max(1, day))
  }
  return next
}

export function getBillDueDay(bill: ReserveBill, month: string): number {
  return bill.monthDueDays?.[month] ?? DEFAULT_RESERVE_BILL_DUE_DAY
}

/** Amount due for a reserve bill period — override in Due, else planner schedule. */
export function getReserveDueOccurrenceAmount(
  bill: ReserveBill,
  period: string,
  month: string,
): number {
  const override = bill.duePeriodAmountOverrides?.[period]
  if (override != null) return toAmount(override)
  return billAmountInMonth(bill, month)
}

/** Total shown on a rolled-up Due row for a reserve bill. */
export function getReserveDueRowAmount(
  bill: ReserveBill,
  occurrences: ReserveDueOccurrence[],
): number {
  if (occurrences.length === 0) return 0
  const primary = occurrences[0]!
  const rollupOverride = bill.duePeriodAmountOverrides?.[primary.period]
  if (occurrences.length === 1) {
    return rollupOverride ?? primary.amount
  }
  if (rollupOverride != null) return rollupOverride
  return occurrences.reduce((sum, entry) => sum + entry.amount, 0)
}

export function buildReserveDueAmountOverridePatch(
  bill: ReserveBill,
  primaryPeriod: string,
  amount: number,
): Pick<ReserveBill, 'duePeriodAmountOverrides'> {
  return {
    duePeriodAmountOverrides: {
      ...(bill.duePeriodAmountOverrides ?? {}),
      [primaryPeriod]: amount,
    },
  }
}

export function clearReserveDueAmountOverridesForPeriods(
  bill: ReserveBill,
  periods: string[],
): Pick<ReserveBill, 'duePeriodAmountOverrides'> | Record<string, never> {
  if (!bill.duePeriodAmountOverrides || periods.length === 0) return {}
  const next = { ...bill.duePeriodAmountOverrides }
  for (const period of periods) delete next[period]
  return Object.keys(next).length > 0 ? { duePeriodAmountOverrides: next } : { duePeriodAmountOverrides: undefined }
}

export function isReserveBillPaidThisPeriod(bill: ReserveBill, period: string = currentPeriod()): boolean {
  if (!bill.lastPaidPeriod) return false
  const paidThrough = bill.lastPaidPeriod.slice(0, 7)
  return paidThrough >= period.slice(0, 7)
}

export function isReserveBillDismissedThisPeriod(bill: ReserveBill, period: string = currentPeriod()): boolean {
  return bill.dismissedDuePeriods?.includes(period) ?? false
}

export interface ReserveDueOccurrence {
  month: string
  monthIndex: number
  amount: number
  period: string
  dueDay: number
}

/** Unpaid reserve bill due months in the current year through today (rolls prior months forward). */
export function getUnpaidReserveBillDueOccurrences(
  bill: ReserveBill,
  referenceDate: Date = getReferenceDate(),
): ReserveDueOccurrence[] {
  const year = referenceDate.getFullYear()
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  const results: ReserveDueOccurrence[] = []

  for (let monthIndex = 0; monthIndex <= today.getMonth(); monthIndex++) {
    const month = MONTHS[monthIndex]!
    const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    const amount = getReserveDueOccurrenceAmount(bill, period, month)
    if (amount <= 0) continue

    if (isReserveBillPaidThisPeriod(bill, period)) continue
    if (isReserveBillDismissedThisPeriod(bill, period)) continue

    results.push({
      month,
      monthIndex,
      amount,
      period,
      dueDay: getBillDueDay(bill, month),
    })
  }

  return results
}

/** @deprecated Use getUnpaidReserveBillDueOccurrences — kept for tests/migration. */
export function isReserveBillDueEntryActive(
  bill: ReserveBill,
  month: string,
  referenceDate: Date = getReferenceDate(),
): boolean {
  if (referenceDate.getMonth() !== MONTHS.indexOf(month as (typeof MONTHS)[number])) return false
  return getUnpaidReserveBillDueOccurrences(bill, referenceDate).some((entry) => entry.month === month)
}

function syntheticCommitmentFromReserveBill(
  planner: ReservePlanner,
  bill: ReserveBill,
  month: string,
  amountOverride?: number,
): Commitment {
  const amount = amountOverride ?? billAmountInMonth(bill, month)
  const dueDay = getBillDueDay(bill, month)

  return {
    id: `reserve-due-${planner.id}-${bill.id}`,
    name: bill.name,
    schedule: 'monthly',
    amount,
    dueDayOfMonth: dueDay,
    scopeLevel: bill.venueId ? 'venue' : 'business',
    scopeId: bill.venueId ?? planner.businessId,
    status: 'healthy',
    lastPaidPeriod: bill.lastPaidPeriod,
    dismissedDuePeriods: bill.dismissedDuePeriods,
    acknowledgedDuePeriods: bill.acknowledgedDuePeriods,
  }
}

/** Due-now rows from reserve bills — unpaid months roll up into one entry per bill. */
export function buildReserveDueRows(state: AppState, scope: ViewScope, referenceDate: Date = getReferenceDate()): CommitmentDueRow[] {
  const billRows = buildReserveBillDueRows(state, scope, referenceDate)
  const transferRows = buildReserveTransferDueRows(state, scope, referenceDate)
  return [...billRows, ...transferRows]
}

function buildReserveBillDueRows(state: AppState, scope: ViewScope, referenceDate: Date = getReferenceDate()): CommitmentDueRow[] {
  const period = currentPeriod()
  const rows: CommitmentDueRow[] = []

  for (const planner of plannersInScope(state, scope)) {
    for (const bill of planner.bills) {
      if (!billAppliesToScope(state, scope, bill)) continue

      const occurrences = getUnpaidReserveBillDueOccurrences(bill, referenceDate)
      if (occurrences.length === 0) continue

      const primary = occurrences[0]!
      const totalAmount = getReserveDueRowAmount(bill, occurrences)
      const rolledMonths = occurrences.map((entry) => entry.month)

      rows.push({
        id: `reserve-due-${planner.id}-${bill.id}-${period}`,
        commitment: syntheticCommitmentFromReserveBill(planner, bill, primary.month, totalAmount),
        amount: totalAmount,
        period,
        source: 'reserve',
        reservePlannerId: planner.id,
        reserveBillId: bill.id,
        sortOrder: bill.sortOrder,
        dueReferencePeriod: primary.period,
        rolledPeriodCount: occurrences.length,
        rolledMonths,
      })
    }
  }

  return rows
}

export function isReserveTransferPending(
  planner: ReservePlanner,
  monthKey: string,
  netTransfer: MonthlyNetTransfer,
): boolean {
  if (netTransfer.direction === 'none') return false
  const confirmation = planner.monthConfirmations?.[monthKey]
  if (!confirmation) return true
  return confirmation.transferDone !== true
}

function syntheticCommitmentFromReserveTransfer(
  planner: ReservePlanner,
  displayName: string,
  transferDescription: string,
  amount: number,
): Commitment {
  return {
    id: `reserve-transfer-${planner.id}`,
    name: displayName,
    schedule: 'monthly',
    amount,
    dueDayOfMonth: 28,
    scopeLevel: 'business',
    scopeId: planner.businessId,
    status: 'warning',
    notes: transferDescription,
  }
}

/** Due row for a pending monthly operating ↔ reserve transfer (confirmed in Reserve Planner). */
export function buildReserveTransferDueRows(
  state: AppState,
  scope: ViewScope,
  referenceDate: Date = getReferenceDate(),
): CommitmentDueRow[] {
  const period = currentPeriod()
  const monthIndex = referenceDate.getMonth()
  const monthKey = MONTHS[monthIndex]!
  const rows: CommitmentDueRow[] = []

  for (const planner of plannersInScope(state, scope)) {
    const monthEnd = computeReserveMonthEndBalances(planner)[monthIndex]
    if (!monthEnd) continue

    const netTransfer = computeMonthlyNetTransfer(monthEnd.monthlyDeposit, monthEnd.totalDue)
    if (!isReserveTransferPending(planner, monthKey, netTransfer)) continue

    const reserveAccount = getPlannerReserveAccount(state, planner)
    const operatingAccount = getPlannerOperatingAccount(state, planner)
    const reserveName = reserveAccount?.name ?? 'reserve'
    const operatingName = operatingAccount?.name ?? 'current account'
    const transferDescription = formatMonthlyNetTransfer(netTransfer, reserveName, operatingName)
    const business = state.businesses.find((b) => b.id === planner.businessId)
    const displayName = business?.name ?? planner.name

    rows.push({
      id: `reserve-transfer-${planner.id}-${period}`,
      commitment: syntheticCommitmentFromReserveTransfer(
        planner,
        displayName,
        transferDescription,
        netTransfer.amount,
      ),
      amount: netTransfer.amount,
      period,
      source: 'reserve',
      reservePlannerId: planner.id,
      reserveTransferDirection:
        netTransfer.direction === 'none' ? undefined : netTransfer.direction,
      sortOrder: -1,
      dueReferencePeriod: period,
    })
  }

  return rows
}

export function getPlannerActualBalance(state: AppState, planner: ReservePlanner): number {
  if (planner.reserveAccountId) {
    const account = state.accounts.find((a) => a.id === planner.reserveAccountId && a.active)
    if (account) return account.balance
  }
  return planner.actualBalance
}

function plannersInScope(state: AppState, scope: ViewScope): ReservePlanner[] {
  const businessIds = getBusinessIdsForScope(state, scope)
  return state.reservePlanners.filter((p) => businessIds.includes(p.businessId))
}

function billAppliesToScope(state: AppState, scope: ViewScope, bill: ReserveBill): boolean {
  if (!bill.venueId) return scope.type !== 'venue'
  const venue = state.venues.find((v) => v.id === bill.venueId)
  if (!venue) return scope.type !== 'venue'
  if (scope.type === 'venue') return bill.venueId === scope.id
  if (scope.type === 'business') return venue.businessId === scope.id
  return getVenueIdsForScope(state, scope).includes(bill.venueId)
}

function billAppliesToSharedColumnScope(
  parentScope: ViewScope,
  plannerBusinessId: string,
  bill: ReserveBill,
): boolean {
  if (parentScope.type === 'business') {
    return plannerBusinessId === parentScope.id && !bill.venueId
  }
  return false
}

function plannerMonthlyDepositForSharedColumn(
  parentScope: ViewScope,
  planner: ReservePlanner,
): number {
  return planner.bills
    .filter((bill) => billAppliesToSharedColumnScope(parentScope, planner.businessId, bill))
    .reduce((sum, bill) => sum + billMonthlyAmount(bill), 0)
}

export function getReserveMonthlyTargetForScope(state: AppState, scope: ViewScope): number {
  let total = 0
  for (const planner of plannersInScope(state, scope)) {
    for (const bill of planner.bills) {
      if (billAppliesToScope(state, scope, bill)) {
        total += billMonthlyAmount(bill)
      }
    }
  }
  return total
}

export function getDaysInMonthForDate(referenceDate: Date = getReferenceDate()): number {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()
}

export function getDaysInCurrentMonth(referenceDate: Date = getReferenceDate()): number {
  return getDaysInMonthForDate(referenceDate)
}

export function getMonthAccrualProgress(referenceDate: Date = getReferenceDate()): number {
  return referenceDate.getDate() / getDaysInMonthForDate(referenceDate)
}

export function getMonthAccruingReserve(monthlyTarget: number): number {
  if (monthlyTarget <= 0) return 0
  return monthlyTarget * getMonthAccrualProgress()
}

export function getReserveAccrualTooltip(referenceDate: Date = getReferenceDate()): string {
  const day = referenceDate.getDate()
  const daysInMonth = getDaysInMonthForDate(referenceDate)
  const pct = Math.round((day / daysInMonth) * 100)
  return `Accruing through this month (day ${day} of ${daysInMonth}, ${pct}%)`
}

function plannerMonthlyDepositForScope(state: AppState, scope: ViewScope, planner: ReservePlanner): number {
  return planner.bills
    .filter((bill) => billAppliesToScope(state, scope, bill))
    .reduce((sum, bill) => sum + billMonthlyAmount(bill), 0)
}

/** Virtual monthly-cost rows derived from active reserve planners in scope. */
export function buildReserveAccruingRows(
  state: AppState,
  scope: ViewScope,
  referenceDate: Date = getReferenceDate(),
): CommitmentAccruingRow[] {
  const progress = getMonthAccrualProgress(referenceDate)
  const daysInMonth = getDaysInMonthForDate(referenceDate)
  const rows: CommitmentAccruingRow[] = []

  for (const planner of plannersInScope(state, scope)) {
    const monthlyAmount = plannerMonthlyDepositForScope(state, scope, planner)
    if (monthlyAmount <= 0) continue

    const business = state.businesses.find((b) => b.id === planner.businessId)

    rows.push({
      source: 'reserve',
      reservePlannerId: planner.id,
      accruedAmount: monthlyAmount * progress,
      commitment: {
        id: `reserve-${planner.id}`,
        name: planner.name || `${business?.name ?? 'Business'} reserve`,
        schedule: 'monthly',
        amount: monthlyAmount,
        dueDayOfMonth: daysInMonth,
        scopeLevel: 'business',
        scopeId: planner.businessId,
        status: 'healthy',
      },
    })
  }

  return rows
}

/** Reserve accruing rows for a shared business column (bills not tied to a venue). */
export function buildReserveAccruingRowsForSharedColumn(
  state: AppState,
  parentScope: ViewScope,
  referenceDate: Date = getReferenceDate(),
): CommitmentAccruingRow[] {
  if (parentScope.type !== 'business') return []

  const progress = getMonthAccrualProgress(referenceDate)
  const daysInMonth = getDaysInMonthForDate(referenceDate)
  const rows: CommitmentAccruingRow[] = []

  for (const planner of plannersInScope(state, parentScope)) {
    const monthlyAmount = plannerMonthlyDepositForSharedColumn(parentScope, planner)
    if (monthlyAmount <= 0) continue

    const business = state.businesses.find((b) => b.id === planner.businessId)

    rows.push({
      source: 'reserve',
      reservePlannerId: planner.id,
      accruedAmount: monthlyAmount * progress,
      commitment: {
        id: `reserve-shared-${planner.id}`,
        name: planner.name || `${business?.name ?? 'Business'} reserve`,
        schedule: 'monthly',
        amount: monthlyAmount,
        dueDayOfMonth: daysInMonth,
        scopeLevel: 'business',
        scopeId: planner.businessId,
        status: 'healthy',
      },
    })
  }

  return rows
}

function buildReserveBillDueRowsForSharedColumn(
  state: AppState,
  parentScope: ViewScope,
  referenceDate: Date = getReferenceDate(),
): CommitmentDueRow[] {
  if (parentScope.type !== 'business') return []

  const period = currentPeriod()
  const rows: CommitmentDueRow[] = []

  for (const planner of plannersInScope(state, parentScope)) {
    for (const bill of planner.bills) {
      if (!billAppliesToSharedColumnScope(parentScope, planner.businessId, bill)) continue

      const occurrences = getUnpaidReserveBillDueOccurrences(bill, referenceDate)
      if (occurrences.length === 0) continue

      const primary = occurrences[0]!
      const totalAmount = getReserveDueRowAmount(bill, occurrences)
      const rolledMonths = occurrences.map((entry) => entry.month)

      rows.push({
        id: `reserve-due-shared-${planner.id}-${bill.id}-${period}`,
        commitment: syntheticCommitmentFromReserveBill(planner, bill, primary.month, totalAmount),
        amount: totalAmount,
        period,
        source: 'reserve',
        reservePlannerId: planner.id,
        reserveBillId: bill.id,
        sortOrder: bill.sortOrder,
        dueReferencePeriod: primary.period,
        rolledPeriodCount: occurrences.length,
        rolledMonths,
      })
    }
  }

  return rows
}

/** Reserve due rows for a shared business column (business-wide bills and transfers). */
export function buildReserveDueRowsForSharedColumn(
  state: AppState,
  parentScope: ViewScope,
  referenceDate: Date = getReferenceDate(),
): CommitmentDueRow[] {
  if (parentScope.type !== 'business') return []

  const billRows = buildReserveBillDueRowsForSharedColumn(state, parentScope, referenceDate)
  const transferRows = buildReserveTransferDueRows(state, parentScope, referenceDate)
  return [...billRows, ...transferRows]
}

function billsDueInMonth(bills: ReserveBill[], month: string) {
  return bills.filter((b) => billAmountInMonth(b, month) > 0)
}

function totalDueInMonth(bills: ReserveBill[], month: string) {
  return bills.reduce((sum, b) => sum + billAmountInMonth(b, month), 0)
}

/**
 * January opening balance so that, with a fixed monthly deposit and bills paid each month,
 * the end-of-month balance never drops below the buffer.
 *
 * Simulates from £0 at the start of January (before the January deposit), finds the
 * lowest end-of-month balance, then sets opening = buffer − that minimum.
 */
export function computeRequiredJanuaryOpening(
  bills: ReserveBill[],
  buffer: number,
  monthlyDeposit: number,
): number {
  if (monthlyDeposit <= 0 && plannerTotalAnnual(bills) <= 0) return buffer

  let balance = 0
  let minAfterBills = Infinity

  for (const month of MONTHS) {
    balance = roundMoney(balance + monthlyDeposit - totalDueInMonth(bills, month))
    minAfterBills = Math.min(minAfterBills, balance)
  }

  if (!Number.isFinite(minAfterBills)) return buffer

  return roundMoney(Math.max(0, buffer - minAfterBills))
}

export interface ReservePlanSummary {
  januaryOpening: number
  monthlyDeposit: number
  lowestMonthBalance: number
  lowestMonth: string
}

/** Metadata for the calibrated plan (lowest month hits the buffer). */
export function computeReservePlanSummary(
  bills: ReserveBill[],
  buffer: number,
): ReservePlanSummary {
  const monthlyDeposit = plannerMonthlyDeposit(bills)
  const januaryOpening = computeRequiredJanuaryOpening(bills, buffer, monthlyDeposit)
  const simulated = simulateReservePlan({ bills, bufferAmount: buffer } as ReservePlanner)

  let lowestMonthBalance = Infinity
  let lowestMonth: string = MONTHS[0]
  for (const row of simulated) {
    if (row.balanceAfterBills < lowestMonthBalance) {
      lowestMonthBalance = row.balanceAfterBills
      lowestMonth = row.month
    }
  }

  return {
    januaryOpening,
    monthlyDeposit,
    lowestMonthBalance,
    lowestMonth,
  }
}

export interface SimulatedReserveMonth {
  month: string
  monthIndex: number
  startBalance: number
  monthlyDeposit: number
  transferRequired: number
  /** Balance after monthly deposit, before bills. */
  balanceAfterDeposit: number
  totalDue: number
  /** Target balance after deposit and bills — never below buffer in the calibrated plan. */
  balanceAfterBills: number
  isCurrentMonth: boolean
  isPastMonth: boolean
}

/** Full-year plan from calibrated January opening. Does not use the live account balance. */
export function simulateReservePlan(planner: ReservePlanner): SimulatedReserveMonth[] {
  const bills = planner.bills
  const buffer = planner.bufferAmount
  const monthIdx = currentMonthIndex()
  const monthlyDeposit = plannerMonthlyDeposit(bills)
  const januaryOpening = computeRequiredJanuaryOpening(bills, buffer, monthlyDeposit)
  const results: SimulatedReserveMonth[] = []

  for (let i = 0; i < 12; i++) {
    const month = MONTHS[i]
    const totalDue = totalDueInMonth(bills, month)
    const isCurrentMonth = i === monthIdx
    const isPastMonth = i < monthIdx

    const startBalance = roundMoney(i === 0 ? januaryOpening : results[i - 1].balanceAfterBills)
    const balanceAfterDeposit = roundMoney(startBalance + monthlyDeposit)
    const balanceAfterBills = roundMoney(balanceAfterDeposit - totalDue)

    results.push({
      month,
      monthIndex: i,
      startBalance,
      monthlyDeposit,
      transferRequired: monthlyDeposit,
      balanceAfterDeposit,
      totalDue,
      balanceAfterBills,
      isCurrentMonth,
      isPastMonth,
    })
  }

  return results
}

/** @deprecated Use simulateReservePlan — actual balance is not part of the plan row. */
export function simulateReserveYear(
  planner: ReservePlanner,
  _actualBalance?: number,
): SimulatedReserveMonth[] {
  return simulateReservePlan(planner)
}

export function getReserveStatus(actual: number, target: number, belowBuffer: boolean): HealthLevel {
  if (belowBuffer) return 'red'
  if (target <= 0) return actual >= 0 ? 'green' : 'red'
  if (actual >= target) return 'green'
  const pctBelow = (target - actual) / target
  if (pctBelow <= 0.05) return 'yellow'
  if (pctBelow <= 0.15) return 'orange'
  return 'red'
}

export function computeReserveMonthPlans(
  state: AppState,
  planner: ReservePlanner,
): ReserveMonthPlan[] {
  const actual = getPlannerActualBalance(state, planner)
  const bills = planner.bills
  const simulated = simulateReservePlan(planner)

  return simulated.map((row) => ({
    month: row.month,
    monthIndex: row.monthIndex,
    billsDue: billsDueInMonth(bills, row.month),
    totalDue: row.totalDue,
    targetBalance: row.balanceAfterBills,
    projectedBalance: row.isPastMonth ? null : row.isCurrentMonth ? actual : row.balanceAfterBills,
    transferRequired: row.transferRequired,
    isCurrentMonth: row.isCurrentMonth,
    isPastMonth: row.isPastMonth,
  }))
}

export function getReserveAction(difference: number): 'Transfer in' | 'Withdraw' | 'On target' {
  if (Math.abs(difference) <= 100) return 'On target'
  if (difference < 0) return 'Transfer in'
  return 'Withdraw'
}

export function formatReserveHealthLabel(status: HealthLevel): string {
  switch (status) {
    case 'green':
      return 'On track'
    case 'yellow':
      return 'Slightly below'
    case 'orange':
      return 'Below target'
    case 'red':
      return 'Needs attention'
    default:
      return 'On track'
  }
}

export function reserveHealthHint(status: HealthLevel, action: string): string {
  const actionPart = action !== 'On target' ? ` Suggested: ${action.toLowerCase()}.` : ''
  switch (status) {
    case 'green':
      return `Reserve balance looks healthy for this month.${actionPart}`
    case 'yellow':
      return `Reserve is a little under where it should be by month-end.${actionPart}`
    case 'orange':
      return `Reserve is noticeably below the planned balance or buffer.${actionPart}`
    case 'red':
      return `Reserve needs topping up — below buffer or well under target.${actionPart}`
    default:
      return ''
  }
}

export type ReserveTransferDirection = 'none' | 'to_reserve' | 'from_reserve'

export interface MonthlyNetTransfer {
  amount: number
  direction: ReserveTransferDirection
}

/** Net cash movement for one month: deposit to reserve minus bills paid from reserve. */
export function computeMonthlyNetTransfer(
  monthlyDeposit: number,
  totalDue: number,
): MonthlyNetTransfer {
  const net = roundMoney(monthlyDeposit - totalDue)
  if (Math.abs(net) < 0.5) return { amount: 0, direction: 'none' }
  if (net > 0) return { amount: net, direction: 'to_reserve' }
  return { amount: Math.abs(net), direction: 'from_reserve' }
}

export function formatMonthlyNetTransfer(
  transfer: MonthlyNetTransfer,
  reserveAccountName: string,
  operatingAccountName: string,
): string {
  if (transfer.direction === 'none') return 'No transfer needed this month'
  if (transfer.direction === 'from_reserve') {
    return `Move ${formatCurrency(transfer.amount)} from ${reserveAccountName} to ${operatingAccountName}`
  }
  return `Move ${formatCurrency(transfer.amount)} from ${operatingAccountName} to ${reserveAccountName}`
}

export interface ReserveBalanceCheck {
  requiredBalance: number
  actualBalance: number
  difference: number
  transferAmount: number
  direction: ReserveTransferDirection
  reserveAccountName: string
  operatingAccountName: string
  monthlyDeposit: number
}

export function getPlannerReserveAccount(state: AppState, planner: ReservePlanner): Account | null {
  if (!planner.reserveAccountId) return null
  return state.accounts.find((a) => a.id === planner.reserveAccountId && a.active) ?? null
}

/** Main bank account paired with the planner's reserve account (same venue, else same business). */
export function getPlannerOperatingAccount(state: AppState, planner: ReservePlanner): Account | null {
  const reserve = getPlannerReserveAccount(state, planner)
  const businessId = reserve ? getAccountBusinessId(state, reserve) : planner.businessId

  if (reserve?.venueId) {
    const venueCurrent = state.accounts.find(
      (a) => a.active && a.type === 'current' && a.venueId === reserve.venueId,
    )
    if (venueCurrent) return venueCurrent
  }

  if (businessId) {
    return (
      state.accounts.find(
        (a) => a.active && a.type === 'current' && getAccountBusinessId(state, a) === businessId,
      ) ?? null
    )
  }

  return state.accounts.find((a) => a.active && a.type === 'current') ?? null
}

export function getPlannerOperatingBalance(state: AppState, planner: ReservePlanner): number {
  const account = getPlannerOperatingAccount(state, planner)
  return account?.balance ?? 0
}

/** Operating balance at the end of a confirmed month (after any transfer). */
export function getOperatingBalanceAfterConfirmation(
  planner: ReservePlanner,
  monthIndex: number,
  confirmation: ReserveMonthConfirmation,
): number | null {
  if (confirmation.operatingBalanceBefore == null) return null
  const monthEnd = computeReserveMonthEndBalances(planner)[monthIndex]
  if (!monthEnd) return confirmation.operatingBalanceBefore

  const netTransfer = computeMonthlyNetTransfer(monthEnd.monthlyDeposit, monthEnd.totalDue)
  if (netTransfer.direction === 'none' || confirmation.transferDone === false) {
    return confirmation.operatingBalanceBefore
  }
  if (netTransfer.direction === 'to_reserve') {
    return roundMoney(confirmation.operatingBalanceBefore - netTransfer.amount)
  }
  return roundMoney(confirmation.operatingBalanceBefore + netTransfer.amount)
}

function getLatestConfirmationBeforeMonth(
  planner: ReservePlanner,
  monthIndex: number,
): { monthIndex: number; confirmation: ReserveMonthConfirmation } | null {
  for (let i = monthIndex - 1; i >= 0; i--) {
    const month = MONTHS[i]!
    const confirmation = planner.monthConfirmations?.[month]
    if (confirmation) return { monthIndex: i, confirmation }
  }
  return null
}

/** Default "Current" field for a month check-in — carried forward from the prior month. */
export function getSuggestedOperatingBalanceForMonth(
  state: AppState,
  planner: ReservePlanner,
  monthIndex: number,
): number {
  const prior = getLatestConfirmationBeforeMonth(planner, monthIndex)
  if (prior?.confirmation.operatingBalanceBefore != null) {
    const carried = getOperatingBalanceAfterConfirmation(
      planner,
      prior.monthIndex,
      prior.confirmation,
    )
    if (carried != null) return carried
  }
  return getPlannerOperatingBalance(state, planner)
}

/** Default "Reserve" field for a month check-in — last confirmed reserve balance. */
export function getSuggestedReserveBalanceForMonth(
  state: AppState,
  planner: ReservePlanner,
  monthIndex: number,
): number {
  const prior = getLatestConfirmationBeforeMonth(planner, monthIndex)
  if (prior) return prior.confirmation.balance
  // Prefer last saved planner balance over live bank feed (which can change on sync/navigation).
  if (planner.actualBalance != null) return planner.actualBalance
  return getPlannerActualBalance(state, planner)
}

export function computeReserveBalanceCheck(
  state: AppState,
  planner: ReservePlanner,
  requiredBalance: number,
  actualBalance: number,
  monthlyDeposit: number,
): ReserveBalanceCheck {
  const difference = roundMoney(actualBalance - requiredBalance)
  const transferAmount = Math.abs(difference)
  const reserveAccount = getPlannerReserveAccount(state, planner)
  const operatingAccount = getPlannerOperatingAccount(state, planner)
  const reserveAccountName = reserveAccount?.name ?? 'reserve account'
  const operatingAccountName = operatingAccount?.name ?? 'bank account'

  if (transferAmount < 0.5) {
    return {
      requiredBalance,
      actualBalance,
      difference,
      transferAmount: 0,
      direction: 'none',
      reserveAccountName,
      operatingAccountName,
      monthlyDeposit,
    }
  }

  if (difference > 0) {
    return {
      requiredBalance,
      actualBalance,
      difference,
      transferAmount,
      direction: 'from_reserve',
      reserveAccountName,
      operatingAccountName,
      monthlyDeposit,
    }
  }

  return {
    requiredBalance,
    actualBalance,
    difference,
    transferAmount,
    direction: 'to_reserve',
    reserveAccountName,
    operatingAccountName,
    monthlyDeposit,
  }
}

export interface ReserveGridRow {
  billId: string
  name: string
  monthAmounts: (number | null)[]
  annual: number
  monthly: number
}

export interface ReserveMonthEndBalance {
  month: string
  monthIndex: number
  /** Reserve balance after monthly deposit and bills paid out. */
  targetBalance: number
  isCurrentMonth: boolean
  isPastMonth: boolean
  /** Tightest month in the plan — should equal the buffer. */
  isLowestMonth: boolean
  confirmation?: ReserveMonthConfirmation
  variance: number | null
  transferRequired: number
  balanceAfterBills: number
  balanceAfterDeposit: number
  totalDue: number
  monthlyDeposit: number
  startBalance: number
}

export interface ReserveGrid {
  rows: ReserveGridRow[]
  totalAnnual: number
  totalMonthly: number
}

export function computeReserveMonthEndBalances(planner: ReservePlanner): ReserveMonthEndBalance[] {
  const confirmations = planner.monthConfirmations ?? {}
  const simulated = simulateReservePlan(planner)
  const planSummary = computeReservePlanSummary(planner.bills, planner.bufferAmount)

  return simulated.map((row) => ({
    month: row.month,
    monthIndex: row.monthIndex,
    targetBalance: row.balanceAfterBills,
    isCurrentMonth: row.isCurrentMonth,
    isPastMonth: row.isPastMonth,
    isLowestMonth: row.month === planSummary.lowestMonth,
    confirmation: confirmations[row.month],
    variance: confirmations[row.month]
      ? roundMoney(confirmations[row.month].balance - row.balanceAfterBills)
      : null,
    transferRequired: row.transferRequired,
    balanceAfterBills: row.balanceAfterBills,
    balanceAfterDeposit: row.balanceAfterDeposit,
    totalDue: row.totalDue,
    monthlyDeposit: row.monthlyDeposit,
    startBalance: row.startBalance,
  }))
}

export function buildReserveGrid(bills: ReserveBill[]): ReserveGrid {
  const orderedBills = sortByOrder(bills, (bill) => bill.sortOrder)
  const rows: ReserveGridRow[] = orderedBills.map((bill) => ({
    billId: bill.id,
    name: bill.name,
    monthAmounts: MONTHS.map((month) => {
      const amount = billAmountInMonth(bill, month)
      return amount > 0 ? amount : null
    }),
    annual: billAnnualAmount(bill),
    monthly: billMonthlyAmount(bill),
  }))

  const totalMonthly = rows.reduce((sum, row) => sum + row.monthly, 0)
  const totalAnnual = rows.reduce((sum, row) => sum + row.annual, 0)

  return { rows, totalAnnual, totalMonthly }
}

export function summarizeReservePlanner(state: AppState, planner: ReservePlanner): ReservePlannerSummary {
  const months = computeReserveMonthPlans(state, planner)
  const currentMonth = months[currentMonthIndex()]
  const actualBalance = getPlannerActualBalance(state, planner)
  const simulated = simulateReservePlan(planner)
  const currentSim = simulated[currentMonthIndex()]
  const monthEndTarget = currentSim.balanceAfterBills
  const difference = actualBalance - monthEndTarget
  const belowBuffer = actualBalance < planner.bufferAmount || actualBalance < monthEndTarget - 0.01
  const business = state.businesses.find((b) => b.id === planner.businessId)

  return {
    planner,
    businessName: business?.name ?? 'Unknown business',
    actualBalance,
    months,
    currentMonth,
    status: getReserveStatus(actualBalance, monthEndTarget, belowBuffer),
    action: getReserveAction(difference),
    difference,
  }
}

// TODO: Auto-create committed fund items from reserve bills due this month (Build Mode 6+).
