import type { AppState, Commitment, CommitmentDueRow, ExpectedReceipt, IncomePattern, ReserveBill, ViewScope } from '../types'
import { sumAccountBalances, toAmount, roundCurrency } from './amounts'
import {
  clampDueDay,
  commitmentEligibleForPeriodDue,
  getPeriodExpectedAmount,
  isCommitmentPaidForPeriod,
  isDismissedForPeriod,
} from './commitmentCalculations'
import { getAccountsForScope, getCommitmentsForScope, getReceiptsForScope } from './calculations'
import {
  getAccruedAmount,
  getActiveAccrualPeriod,
  getCommitmentDueOccurrences,
  getCommitmentDueRowAmount,
  getDueRowCommittedAmount,
  isPaidThisCycle,
} from './commitmentCalculations'
import { parsePlannedDueDateInput, getPlannedCommittedAmount } from './plannedFunding'
import {
  getEffectiveReceiptAmount,
  resolveReceiptDateKey,
} from './receiptCalculations'
import { getReferenceDate } from './referenceDate'
import { MONTHS } from './format'
import {
  buildReserveAccruingRows,
  buildReserveDueRows,
  computeReserveOperatingTransfer,
  computeReserveMonthEndBalances,
  getBillDueDay,
  getPlannerActualBalance,
  getReserveDueOccurrenceAmount,
  getReserveDueRowAmount,
  getReserveTransferTargetForMonth,
  getUnpaidReserveBillDueOccurrences,
  isReserveBillDismissedThisPeriod,
  isReserveBillPaidThisPeriod,
} from './reserveCalculations'
import { getBusinessIdsForScope, getVenueIdsForScope, itemMatchesScope } from './scope'
import { addDays } from './trendProjection'

const AUTO_PAY_DAYS = 1

export type CashFlowEventCategory = 'receipt' | 'monthly_cost' | 'planned' | 'reserve_transfer' | 'daily_income'

export interface CashFlowEvent {
  date: string
  amount: number
  label: string
  category: CashFlowEventCategory
}

export interface ForwardCashFlowDay {
  date: string
  balance: number
  trueBalance: number
  events: CashFlowEvent[]
}

export interface ForwardCashFlowProjection {
  startDate: string
  horizonDays: number
  openingCurrentBalance: number
  openingTrueBalance: number
  incomePattern: IncomePattern | 'mixed'
  /** Net day-to-day margin baked into the cash line (not listed as daily movements). */
  dailyTradingNet: number
  days: ForwardCashFlowDay[]
  events: CashFlowEvent[]
  unscheduledReceipts: { id: string; label: string; amount: number }[]
  lowestBalance: number
  lowestBalanceDate: string
  endingBalance: number
  endingTrueBalance: number
  lowestTrueBalance: number
  lowestTrueBalanceDate: string
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDueDate(year: number, monthIndex: number, dueDay: number): Date {
  return dateOnly(new Date(year, monthIndex, clampDueDay(year, monthIndex, dueDay)))
}

function payDateForDue(dueDate: Date): Date {
  const result = new Date(dueDate)
  result.setDate(result.getDate() + AUTO_PAY_DAYS)
  return dateOnly(result)
}

function lastDayOfMonth(year: number, monthIndex: number): Date {
  return dateOnly(new Date(year, monthIndex + 1, 0))
}

function clampEventDate(dateKey: string, todayKey: string, endKey: string): string | null {
  if (dateKey > endKey) return null
  if (dateKey < todayKey) return todayKey
  return dateKey
}

/** Cash that lands in the bank on the expected date (forecast only — not gated by Start). */
function getForecastReceiptCashAmount(receipt: ExpectedReceipt): number {
  return toAmount(receipt.amount)
}

/**
 * Expected-receipt contribution for the True Balance line on a forecast day.
 * Uses the same rules as the dashboard (lump needs Start; build-up accrues daily).
 */
function getForecastTrueBalanceReceiptAmount(
  receipt: ExpectedReceipt,
  referenceDate: Date,
  cashDateKey: string | undefined,
  endOfDay: boolean,
): number {
  if (receipt.received) return 0
  const dateKey = isoFromDate(referenceDate)
  if (cashDateKey && (endOfDay ? dateKey >= cashDateKey : dateKey > cashDateKey)) return 0
  return getEffectiveReceiptAmount(receipt, referenceDate)
}

function forecastSettlementKey(commitmentId: string, period: string): string {
  return `${commitmentId}:${period}`
}

function reserveSettlementKey(plannerId: string, billId: string, period: string): string {
  return `reserve:${plannerId}:${billId}:${period}`
}

function reserveBillAppliesToScope(state: AppState, scope: ViewScope, bill: ReserveBill): boolean {
  if (!bill.venueId) return scope.type !== 'venue'
  const venue = state.venues.find((v) => v.id === bill.venueId)
  if (!venue) return scope.type !== 'venue'
  if (scope.type === 'venue') return bill.venueId === scope.id
  if (scope.type === 'business') return venue.businessId === scope.id
  return getVenueIdsForScope(state, scope).includes(bill.venueId)
}

function getForecastReserveBillDueAmount(
  bill: ReserveBill,
  plannerId: string,
  referenceDate: Date,
  reserveSettlements: ReadonlyMap<string, string>,
  endOfDay: boolean,
): number {
  const dateKey = isoFromDate(referenceDate)
  const occurrences = getUnpaidReserveBillDueOccurrences(bill, referenceDate).filter(
    (occurrence) =>
      !isForecastSettled(reserveSettlements, plannerId, occurrence.period, dateKey, endOfDay, bill.id),
  )
  return getReserveDueRowAmount(bill, occurrences)
}

function getForecastDueRowCommittedAmount(
  state: AppState,
  row: CommitmentDueRow,
  referenceDate: Date,
  reserveSettlements: ReadonlyMap<string, string>,
  endOfDay: boolean,
): number {
  if (row.source !== 'reserve' || !row.reserveBillId || !row.reservePlannerId) {
    return getDueRowCommittedAmount(row, referenceDate)
  }
  const planner = state.reservePlanners.find((entry) => entry.id === row.reservePlannerId)
  const bill = planner?.bills.find((entry) => entry.id === row.reserveBillId)
  if (!bill) return getDueRowCommittedAmount(row, referenceDate)
  return getForecastReserveBillDueAmount(bill, row.reservePlannerId, referenceDate, reserveSettlements, endOfDay)
}

function collectReserveBillSettlements(
  state: AppState,
  scope: ViewScope,
  today: Date,
  endDate: Date,
): Map<string, string> {
  const settlements = new Map<string, string>()
  const todayKey = isoFromDate(today)
  const endKey = isoFromDate(endDate)
  const businessIds = getBusinessIdsForScope(state, scope)

  for (const planner of state.reservePlanners.filter((entry) => businessIds.includes(entry.businessId))) {
    for (const bill of planner.bills) {
      if (!reserveBillAppliesToScope(state, scope, bill)) continue

      const scheduledPeriods = new Set<string>()
      const schedulePeriod = (period: string, month: string, year: number, monthIndex: number) => {
        if (scheduledPeriods.has(period)) return
        if (isReserveBillPaidThisPeriod(bill, period, today) || isReserveBillDismissedThisPeriod(bill, period)) return
        if (getReserveDueOccurrenceAmount(bill, period, month) <= 0) return

        const dueDay = getBillDueDay(bill, month)
        const dueDate = dateOnly(new Date(year, monthIndex, clampDueDay(year, monthIndex, dueDay)))
        const eventDate = clampEventDate(isoFromDate(dueDate), todayKey, endKey)
        if (!eventDate) return

        settlements.set(reserveSettlementKey(planner.id, bill.id, period), eventDate)
        scheduledPeriods.add(period)
      }

      for (const occurrence of getUnpaidReserveBillDueOccurrences(bill, today)) {
        const [year, month] = occurrence.period.split('-').map(Number)
        schedulePeriod(occurrence.period, occurrence.month, year, month - 1)
      }

      let year = today.getFullYear()
      let monthIndex = today.getMonth()
      const endYear = endDate.getFullYear()
      const endMonth = endDate.getMonth()

      while (year < endYear || (year === endYear && monthIndex <= endMonth)) {
        const month = MONTHS[monthIndex]!
        const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
        schedulePeriod(period, month, year, monthIndex)

        monthIndex += 1
        if (monthIndex > 11) {
          monthIndex = 0
          year += 1
        }
      }
    }
  }

  return settlements
}

function isForecastSettled(
  settlements: ReadonlyMap<string, string>,
  commitmentId: string,
  period: string,
  dateKey: string,
  endOfDay: boolean,
  reserveBillId?: string,
): boolean {
  const key = reserveBillId
    ? reserveSettlementKey(commitmentId, reserveBillId, period)
    : forecastSettlementKey(commitmentId, period)
  const payDate = settlements.get(key)
  if (!payDate) return false
  return endOfDay ? dateKey >= payDate : dateKey > payDate
}

export function cashOutlookHorizonDays(graphRange: string): number {
  if (graphRange === '30d') return 30
  return 90
}

export function getIncomePatternForScope(state: AppState, scope: ViewScope): IncomePattern | 'mixed' {
  const businessIds = getBusinessIdsForScope(state, scope)
  if (businessIds.length === 0) return 'steady'
  const patterns = new Set(
    businessIds.map((id) => state.businesses.find((b) => b.id === id)?.incomePattern ?? 'steady'),
  )
  if (patterns.size === 1) return [...patterns][0]!
  return 'mixed'
}

/** Sum daily income for steady-pattern businesses in scope that have a forecast value set. */
export function getForecastDailyIncomeForScope(state: AppState, scope: ViewScope): number {
  const businessIds = getBusinessIdsForScope(state, scope)
  return roundCurrency(
    businessIds.reduce((sum, businessId) => {
      const business = state.businesses.find((item) => item.id === businessId)
      if (!business) return sum
      if ((business.incomePattern ?? 'steady') !== 'steady') return sum
      return sum + (business.forecastDailyIncome ?? 0)
    }, 0),
  )
}

export function getSteadyBusinessesForScope(
  state: AppState,
  scope: ViewScope,
): Array<{ id: string; name: string; forecastDailyIncome?: number }> {
  return getBusinessIdsForScope(state, scope)
    .map((id) => state.businesses.find((business) => business.id === id))
    .filter((business): business is NonNullable<typeof business> => Boolean(business))
    .filter((business) => (business.incomePattern ?? 'steady') === 'steady')
    .map((business) => ({
      id: business.id,
      name: business.name,
      forecastDailyIncome: business.forecastDailyIncome,
    }))
}

function getCurrentAccountBalance(state: AppState, scope: ViewScope): number {
  const accounts = getAccountsForScope(state, scope).filter((a) => a.type === 'current')
  return sumAccountBalances(accounts)
}

function commitmentsInScope(state: AppState, scope: ViewScope): Commitment[] {
  return state.commitments.filter((c) => itemMatchesScope(state, scope, c.scopeLevel, c.scopeId))
}

function buildMonthlyCostEvents(
  commitment: Commitment,
  today: Date,
  endDate: Date,
): { events: CashFlowEvent[]; settlements: Map<string, string> } {
  if (commitment.schedule !== 'monthly') return { events: [], settlements: new Map() }

  const todayKey = isoFromDate(today)
  const endKey = isoFromDate(endDate)
  const dueDay = commitment.dueDayOfMonth ?? 28
  const events: CashFlowEvent[] = []
  const settlements = new Map<string, string>()
  const scheduledPeriods = new Set<string>()

  const pushMonthlyPayment = (period: string, year: number, monthIndex: number) => {
    if (scheduledPeriods.has(period)) return
    if (isCommitmentPaidForPeriod(commitment, period) || isDismissedForPeriod(commitment, period)) return
    if (!commitmentEligibleForPeriodDue(commitment, year, monthIndex)) return

    const dueDate = getDueDate(year, monthIndex, dueDay)
    const payDate = payDateForDue(dueDate)
    const eventDate = clampEventDate(isoFromDate(payDate), todayKey, endKey)
    if (!eventDate) return

    const amount = getPeriodExpectedAmount(commitment, period)
    if (amount <= 0) return

    events.push({
      date: eventDate,
      amount: -amount,
      label: commitment.name.trim() || 'Monthly cost',
      category: 'monthly_cost',
    })
    settlements.set(forecastSettlementKey(commitment.id, period), eventDate)
    scheduledPeriods.add(period)
  }

  for (const occurrence of getCommitmentDueOccurrences(commitment, today)) {
    const [year, month] = occurrence.period.split('-').map(Number)
    pushMonthlyPayment(occurrence.period, year, month - 1)
  }

  let year = today.getFullYear()
  let monthIndex = today.getMonth()
  const endYear = endDate.getFullYear()
  const endMonth = endDate.getMonth()

  while (year < endYear || (year === endYear && monthIndex <= endMonth)) {
    const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    pushMonthlyPayment(period, year, monthIndex)

    monthIndex += 1
    if (monthIndex > 11) {
      monthIndex = 0
      year += 1
    }
  }

  return { events, settlements }
}

function buildPlannedCostEvents(
  commitment: Commitment,
  today: Date,
  endDate: Date,
): CashFlowEvent[] {
  if (commitment.schedule !== 'planned') return []
  const dueIso =
    commitment.plannedDueDate ??
    (commitment.plannedLabel ? parsePlannedDueDateInput(commitment.plannedLabel, today) : null)
  if (!dueIso) return []

  const period = dueIso.slice(0, 7)
  if (isCommitmentPaidForPeriod(commitment, period)) return []

  const todayKey = isoFromDate(today)
  const endKey = isoFromDate(endDate)
  const eventDate = clampEventDate(dueIso, todayKey, endKey)
  if (!eventDate) return []

  const amount = toAmount(commitment.amount)
  if (amount <= 0) return []

  return [
    {
      date: eventDate,
      amount: -amount,
      label: commitment.name.trim() || 'Planned cost',
      category: 'planned',
    },
  ]
}

function buildReceiptEvents(
  state: AppState,
  scope: ViewScope,
  today: Date,
  endDate: Date,
): {
  events: CashFlowEvent[]
  unscheduled: { id: string; label: string; amount: number }[]
  receiptCashDates: Map<string, string>
} {
  const todayKey = isoFromDate(today)
  const endKey = isoFromDate(endDate)
  const events: CashFlowEvent[] = []
  const unscheduled: { id: string; label: string; amount: number }[] = []
  const receiptCashDates = new Map<string, string>()

  for (const receipt of getReceiptsForScope(state, scope)) {
    if (receipt.received) continue
    const label = receipt.name.trim() || 'Expected receipt'
    const dueIso =
      resolveReceiptDateKey(receipt.expectedDate, today) ??
      (receipt.expectedDate ? parsePlannedDueDateInput(receipt.expectedDate, today) : null)

    if (!dueIso) {
      const headline = toAmount(receipt.amount)
      if (headline > 0) unscheduled.push({ id: receipt.id, label, amount: headline })
      continue
    }

    receiptCashDates.set(receipt.id, dueIso)

    const cashAmount = getForecastReceiptCashAmount(receipt)
    if (cashAmount <= 0) continue

    const eventDate = clampEventDate(dueIso, todayKey, endKey)
    if (!eventDate) continue

    events.push({
      date: eventDate,
      amount: cashAmount,
      label,
      category: 'receipt',
    })
  }

  return { events, unscheduled, receiptCashDates }
}

function projectedExpectedReceiptsAt(
  state: AppState,
  scope: ViewScope,
  referenceDate: Date,
  receiptCashDates: ReadonlyMap<string, string>,
  endOfDay: boolean,
): number {
  const dateKey = isoFromDate(referenceDate)
  let total = 0

  for (const receipt of getReceiptsForScope(state, scope)) {
    if (receipt.received) continue
    const cashDate = receiptCashDates.get(receipt.id)
    if (cashDate && (endOfDay ? dateKey >= cashDate : dateKey > cashDate)) continue
    total += getForecastTrueBalanceReceiptAmount(receipt, referenceDate, cashDate, endOfDay)
  }

  return total
}

/** Monthly accrual/due amounts stop counting once forecast cash leaves on the pay date. */
function getForecastMonthlyCommittedAmount(
  commitment: Commitment,
  referenceDate: Date,
  monthlySettlements: ReadonlyMap<string, string>,
  endOfDay: boolean,
): number {
  const dateKey = isoFromDate(referenceDate)
  const dueOccurrences = getCommitmentDueOccurrences(commitment, referenceDate).filter(
    (occurrence) => !isForecastSettled(monthlySettlements, commitment.id, occurrence.period, dateKey, endOfDay),
  )
  if (dueOccurrences.length > 0) {
    return getCommitmentDueRowAmount(commitment, dueOccurrences)
  }
  if (isPaidThisCycle(commitment, referenceDate)) return 0

  const activePeriod = getActiveAccrualPeriod(commitment, referenceDate)
  if (
    activePeriod &&
    isForecastSettled(monthlySettlements, commitment.id, activePeriod, dateKey, endOfDay)
  ) {
    return 0
  }

  return getAccruedAmount(commitment, referenceDate)
}

/** Planned build-up stops counting toward True Balance once cash leaves on the due date. */
function getForecastPlannedCommittedAmount(
  commitment: Commitment,
  referenceDate: Date,
  cashDateKey: string | undefined,
  endOfDay: boolean,
): number {
  const dateKey = isoFromDate(referenceDate)
  if (cashDateKey && (endOfDay ? dateKey >= cashDateKey : dateKey > cashDateKey)) return 0
  return getPlannedCommittedAmount(commitment, referenceDate)
}

function collectPlannedCashDates(state: AppState, scope: ViewScope, today: Date): Map<string, string> {
  const dates = new Map<string, string>()
  for (const commitment of commitmentsInScope(state, scope)) {
    if (commitment.schedule !== 'planned') continue
    const dueIso =
      commitment.plannedDueDate ??
      (commitment.plannedLabel ? parsePlannedDueDateInput(commitment.plannedLabel, today) : null)
    if (dueIso) dates.set(commitment.id, dueIso)
  }
  return dates
}

function projectedCommittedFundsAt(
  state: AppState,
  scope: ViewScope,
  referenceDate: Date,
  plannedCashDates: ReadonlyMap<string, string>,
  monthlySettlements: ReadonlyMap<string, string>,
  reserveSettlements: ReadonlyMap<string, string>,
  endOfDay: boolean,
): number {
  let total = 0
  for (const commitment of getCommitmentsForScope(state, scope)) {
    if (commitment.schedule === 'planned') {
      total += getForecastPlannedCommittedAmount(
        commitment,
        referenceDate,
        plannedCashDates.get(commitment.id),
        endOfDay,
      )
      continue
    }
    if (commitment.schedule === 'monthly') {
      total += getForecastMonthlyCommittedAmount(commitment, referenceDate, monthlySettlements, endOfDay)
      continue
    }
  }
  for (const row of buildReserveAccruingRows(state, scope, referenceDate)) {
    total += row.accruedAmount
  }
  for (const row of buildReserveDueRows(state, scope, referenceDate)) {
    total += getForecastDueRowCommittedAmount(state, row, referenceDate, reserveSettlements, endOfDay)
  }
  return total
}

function buildReserveTransferEvents(
  state: AppState,
  scope: ViewScope,
  today: Date,
  endDate: Date,
): CashFlowEvent[] {
  if (state.workspaceOrigin === 'builtin-demo') return []

  const events: CashFlowEvent[] = []
  const todayKey = isoFromDate(today)
  const endKey = isoFromDate(endDate)
  const businessIds = getBusinessIdsForScope(state, scope)

  for (const planner of state.reservePlanners.filter((p) => businessIds.includes(p.businessId))) {
    const monthEnds = computeReserveMonthEndBalances(planner)
    const business = state.businesses.find((b) => b.id === planner.businessId)
    const plannerLabel = business?.name ?? planner.name

    let simulatedReserve = getPlannerActualBalance(state, planner)

    let year = today.getFullYear()
    let monthIndex = today.getMonth()
    const endYear = endDate.getFullYear()
    const endMonth = endDate.getMonth()

    while (year < endYear || (year === endYear && monthIndex <= endMonth)) {
      const monthEnd = monthEnds[monthIndex]
      const transferDate = lastDayOfMonth(year, monthIndex)

      if (monthEnd) {
        if (transferDate < today) {
          simulatedReserve = monthEnd.confirmation?.balance ?? monthEnd.balanceAfterBills
        } else {
          const transferTarget = getReserveTransferTargetForMonth(monthEnds, monthIndex)
          const net = computeReserveOperatingTransfer(simulatedReserve, transferTarget)
          if (net.direction !== 'none' && net.amount > 0) {
            const eventDate = clampEventDate(isoFromDate(transferDate), todayKey, endKey)
            if (eventDate) {
              const signed = net.direction === 'to_reserve' ? -net.amount : net.amount
              events.push({
                date: eventDate,
                amount: signed,
                label:
                  net.direction === 'to_reserve'
                    ? `Reserve transfer · ${plannerLabel}`
                    : `Reserve return · ${plannerLabel}`,
                category: 'reserve_transfer',
              })
            }
          }
          simulatedReserve = transferTarget
        }
      }

      monthIndex += 1
      if (monthIndex > 11) {
        monthIndex = 0
        year += 1
      }
    }
  }

  return events
}

export function buildForwardCashFlowProjection(
  state: AppState,
  scope: ViewScope,
  horizonDays: number,
  referenceDate: Date = getReferenceDate(),
): ForwardCashFlowProjection {
  const today = dateOnly(referenceDate)
  const endDate = dateOnly(new Date(today))
  endDate.setDate(endDate.getDate() + horizonDays)

  const openingCurrentBalance = getCurrentAccountBalance(state, scope)
  const plannedCashDates = collectPlannedCashDates(state, scope, today)
  const monthlySettlements = new Map<string, string>()
  const reserveSettlements = collectReserveBillSettlements(state, scope, today, endDate)

  const rawEvents: CashFlowEvent[] = []
  for (const commitment of commitmentsInScope(state, scope)) {
    const monthly = buildMonthlyCostEvents(commitment, today, endDate)
    rawEvents.push(...monthly.events)
    for (const [key, date] of monthly.settlements) {
      monthlySettlements.set(key, date)
    }
    rawEvents.push(...buildPlannedCostEvents(commitment, today, endDate))
  }

  const { events: receiptEvents, unscheduled, receiptCashDates } = buildReceiptEvents(
    state,
    scope,
    today,
    endDate,
  )
  rawEvents.push(...receiptEvents)
  rawEvents.push(...buildReserveTransferEvents(state, scope, today, endDate))

  const dailyTradingNet = getForecastDailyIncomeForScope(state, scope)

  const eventsByDate = new Map<string, CashFlowEvent[]>()
  for (const event of rawEvents) {
    const list = eventsByDate.get(event.date) ?? []
    list.push(event)
    eventsByDate.set(event.date, list)
  }

  const days: ForwardCashFlowDay[] = []
  let balance = openingCurrentBalance
  let lowestBalance = balance
  let lowestBalanceDate = isoFromDate(today)

  const openingReferenceDate = dateOnly(today)
  const openingCommittedFunds = projectedCommittedFundsAt(
    state,
    scope,
    openingReferenceDate,
    plannedCashDates,
    monthlySettlements,
    reserveSettlements,
    false,
  )
  const openingExpectedReceipts = projectedExpectedReceiptsAt(
    state,
    scope,
    openingReferenceDate,
    receiptCashDates,
    false,
  )
  const openingTrueBalance = roundCurrency(
    openingCurrentBalance - openingCommittedFunds + openingExpectedReceipts,
  )
  let lowestTrueBalance = openingTrueBalance
  let lowestTrueBalanceDate = isoFromDate(today)

  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const dateKey = addDays(isoFromDate(today), offset)
    const referenceDate = dateOnly(new Date(today))
    referenceDate.setDate(referenceDate.getDate() + offset)
    const committedFunds = projectedCommittedFundsAt(
      state,
      scope,
      referenceDate,
      plannedCashDates,
      monthlySettlements,
      reserveSettlements,
      false,
    )
    const expectedReceipts = projectedExpectedReceiptsAt(
      state,
      scope,
      referenceDate,
      receiptCashDates,
      false,
    )
    const startOfDayBalance = balance
    const trueBalance = roundCurrency(startOfDayBalance - committedFunds + expectedReceipts)

    const dayEvents = eventsByDate.get(dateKey) ?? []
    days.push({ date: dateKey, balance: startOfDayBalance, trueBalance, events: dayEvents })

    for (const event of dayEvents) {
      balance += event.amount
    }
    if (dailyTradingNet !== 0) {
      balance = roundCurrency(balance + dailyTradingNet)
    }

    if (startOfDayBalance < lowestBalance) {
      lowestBalance = startOfDayBalance
      lowestBalanceDate = dateKey
    }
    if (trueBalance < lowestTrueBalance) {
      lowestTrueBalance = trueBalance
      lowestTrueBalanceDate = dateKey
    }
  }

  const allEvents = [...rawEvents].sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))

  const lastReferenceDate = dateOnly(endDate)
  const endingCommittedFunds = projectedCommittedFundsAt(
    state,
    scope,
    lastReferenceDate,
    plannedCashDates,
    monthlySettlements,
    reserveSettlements,
    true,
  )
  const endingExpectedReceipts = projectedExpectedReceiptsAt(
    state,
    scope,
    lastReferenceDate,
    receiptCashDates,
    true,
  )
  const endingTrueBalance = roundCurrency(balance - endingCommittedFunds + endingExpectedReceipts)

  return {
    startDate: isoFromDate(today),
    horizonDays,
    openingCurrentBalance,
    openingTrueBalance,
    incomePattern: getIncomePatternForScope(state, scope),
    dailyTradingNet,
    days,
    events: allEvents,
    unscheduledReceipts: unscheduled,
    lowestBalance,
    lowestBalanceDate,
    endingBalance: balance,
    endingTrueBalance,
    lowestTrueBalance,
    lowestTrueBalanceDate,
  }
}
