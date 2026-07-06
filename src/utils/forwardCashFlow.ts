import type { AppState, Commitment, IncomePattern, ViewScope } from '../types'
import { sumAccountBalances, toAmount, roundCurrency } from './amounts'
import {
  clampDueDay,
  commitmentEligibleForPeriodDue,
  getPeriodExpectedAmount,
  isCommitmentPaidForPeriod,
  isDismissedForPeriod,
} from './commitmentCalculations'
import { calculateDashboard, getReceiptsForScope } from './calculations'
import { parsePlannedDueDateInput } from './plannedFunding'
import { computeCommittedFundsAt } from './metricsAtDate'
import {
  getEffectiveReceiptAmount,
  getReceiptTiming,
  resolveReceiptDateKey,
} from './receiptCalculations'
import { getReferenceDate } from './referenceDate'
import {
  computeReserveOperatingTransfer,
  computeReserveMonthEndBalances,
  getPlannerActualBalance,
  getReserveTransferTargetForMonth,
} from './reserveCalculations'
import { getBusinessIdsForScope, itemMatchesScope } from './scope'
import { addDays } from './trendProjection'

const AUTO_PAY_DAYS = 1

export type CashFlowEventCategory = 'receipt' | 'monthly_cost' | 'planned' | 'reserve_transfer'

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
): CashFlowEvent[] {
  if (commitment.schedule !== 'monthly') return []

  const todayKey = isoFromDate(today)
  const endKey = isoFromDate(endDate)
  const dueDay = commitment.dueDayOfMonth ?? 28
  const events: CashFlowEvent[] = []

  let year = today.getFullYear()
  let monthIndex = today.getMonth()
  const endYear = endDate.getFullYear()
  const endMonth = endDate.getMonth()

  while (year < endYear || (year === endYear && monthIndex <= endMonth)) {
    const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    if (!isCommitmentPaidForPeriod(commitment, period) && !isDismissedForPeriod(commitment, period)) {
      if (commitmentEligibleForPeriodDue(commitment, year, monthIndex)) {
        const dueDate = getDueDate(year, monthIndex, dueDay)
        const payDate = payDateForDue(dueDate)
        const eventDate = clampEventDate(isoFromDate(payDate), todayKey, endKey)
        if (eventDate) {
          const amount = getPeriodExpectedAmount(commitment, period)
          if (amount > 0) {
            events.push({
              date: eventDate,
              amount: -amount,
              label: commitment.name.trim() || 'Monthly cost',
              category: 'monthly_cost',
            })
          }
        }
      }
    }

    monthIndex += 1
    if (monthIndex > 11) {
      monthIndex = 0
      year += 1
    }
  }

  return events
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
    const timing = getReceiptTiming(receipt)
    const dueIso =
      resolveReceiptDateKey(receipt.expectedDate, today) ??
      (receipt.expectedDate ? parsePlannedDueDateInput(receipt.expectedDate, today) : null)

    if (!dueIso) {
      const headline = toAmount(receipt.amount)
      if (headline > 0) unscheduled.push({ id: receipt.id, label, amount: headline })
      continue
    }

    receiptCashDates.set(receipt.id, dueIso)

    const cashAmount =
      timing === 'accrual'
        ? toAmount(receipt.amount)
        : getEffectiveReceiptAmount(receipt, today)

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
): number {
  const dateKey = isoFromDate(referenceDate)
  let total = 0

  for (const receipt of getReceiptsForScope(state, scope)) {
    if (receipt.received) continue
    const cashDate = receiptCashDates.get(receipt.id)
    if (cashDate && dateKey >= cashDate) continue
    total += getEffectiveReceiptAmount(receipt, referenceDate)
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
  const metrics = calculateDashboard(state, scope)
  const openingTrueBalance = metrics.trueBalance

  const rawEvents: CashFlowEvent[] = []
  for (const commitment of commitmentsInScope(state, scope)) {
    rawEvents.push(...buildMonthlyCostEvents(commitment, today, endDate))
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
  let lowestTrueBalance = openingTrueBalance
  let lowestTrueBalanceDate = isoFromDate(today)

  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const dateKey = addDays(isoFromDate(today), offset)
    const dayEvents = eventsByDate.get(dateKey) ?? []
    for (const event of dayEvents) {
      balance += event.amount
    }
    const referenceDate = dateOnly(new Date(today))
    referenceDate.setDate(referenceDate.getDate() + offset)
    const committedFunds = computeCommittedFundsAt(state, scope, referenceDate)
    const expectedReceipts = projectedExpectedReceiptsAt(state, scope, referenceDate, receiptCashDates)
    const trueBalance = roundCurrency(balance - committedFunds + expectedReceipts)

    days.push({ date: dateKey, balance, trueBalance, events: dayEvents })
    if (balance < lowestBalance) {
      lowestBalance = balance
      lowestBalanceDate = dateKey
    }
    if (trueBalance < lowestTrueBalance) {
      lowestTrueBalance = trueBalance
      lowestTrueBalanceDate = dateKey
    }
  }

  const allEvents = [...rawEvents].sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))

  const endingTrueBalance = days[days.length - 1]?.trueBalance ?? openingTrueBalance

  return {
    startDate: isoFromDate(today),
    horizonDays,
    openingCurrentBalance,
    openingTrueBalance,
    incomePattern: getIncomePatternForScope(state, scope),
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
