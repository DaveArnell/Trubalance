import type { AppState, Commitment, IncomePattern, ViewScope } from '../types'
import { sumAccountBalances, toAmount } from './amounts'
import {
  clampDueDay,
  commitmentEligibleForPeriodDue,
  getPeriodExpectedAmount,
  isCommitmentPaidForPeriod,
  isDismissedForPeriod,
} from './commitmentCalculations'
import { calculateDashboard, getAccountsForScope, getReceiptsForScope } from './calculations'
import { parsePlannedDueDateInput } from './plannedFunding'
import { getReferenceDate } from './referenceDate'
import {
  computeMonthlyNetTransfer,
  computeReserveMonthEndBalances,
  isReserveTransferPending,
} from './reserveCalculations'
import { getBusinessIdsForScope, itemMatchesScope } from './scope'
import { addDays } from './trendProjection'
import { MONTHS } from './format'

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
): { events: CashFlowEvent[]; unscheduled: { id: string; label: string; amount: number }[] } {
  const todayKey = isoFromDate(today)
  const endKey = isoFromDate(endDate)
  const events: CashFlowEvent[] = []
  const unscheduled: { id: string; label: string; amount: number }[] = []

  for (const receipt of getReceiptsForScope(state, scope)) {
    const amount = toAmount(receipt.amount)
    if (amount <= 0) continue
    const label = receipt.name.trim() || 'Expected receipt'
    const dueIso = receipt.expectedDate
      ? parsePlannedDueDateInput(receipt.expectedDate, today)
      : null

    if (!dueIso) {
      unscheduled.push({ id: receipt.id, label, amount })
      continue
    }

    const eventDate = clampEventDate(dueIso, todayKey, endKey)
    if (!eventDate) continue

    events.push({
      date: eventDate,
      amount,
      label,
      category: 'receipt',
    })
  }

  return { events, unscheduled }
}

function buildReserveTransferEvents(
  state: AppState,
  scope: ViewScope,
  today: Date,
  endDate: Date,
): CashFlowEvent[] {
  const events: CashFlowEvent[] = []
  const todayKey = isoFromDate(today)
  const endKey = isoFromDate(endDate)
  const businessIds = getBusinessIdsForScope(state, scope)

  for (const planner of state.reservePlanners.filter((p) => businessIds.includes(p.businessId))) {
    const monthEnds = computeReserveMonthEndBalances(planner)
    const business = state.businesses.find((b) => b.id === planner.businessId)
    const plannerLabel = business?.name ?? planner.name

    for (const monthEnd of monthEnds) {
      if (monthEnd.monthIndex < today.getMonth() && !monthEnd.isCurrentMonth) continue

      const net = computeMonthlyNetTransfer(monthEnd.monthlyDeposit, monthEnd.totalDue)
      if (net.direction === 'none' || net.amount <= 0) continue

      const transferDate = lastDayOfMonth(today.getFullYear(), monthEnd.monthIndex)
      const eventDate = clampEventDate(isoFromDate(transferDate), todayKey, endKey)
      if (!eventDate) continue

      const monthKey = MONTHS[monthEnd.monthIndex]!
      if (isReserveTransferPending(planner, monthKey, net)) {
        const signed =
          net.direction === 'to_reserve' ? -net.amount : net.amount
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

  const { events: receiptEvents, unscheduled } = buildReceiptEvents(state, scope, today, endDate)
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

  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const dateKey = addDays(isoFromDate(today), offset)
    const dayEvents = eventsByDate.get(dateKey) ?? []
    for (const event of dayEvents) {
      balance += event.amount
    }
    days.push({ date: dateKey, balance, events: dayEvents })
    if (balance < lowestBalance) {
      lowestBalance = balance
      lowestBalanceDate = dateKey
    }
  }

  const allEvents = [...rawEvents].sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))

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
  }
}
