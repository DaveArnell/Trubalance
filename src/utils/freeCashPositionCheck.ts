/**
 * Free public cash-position check.
 * Monthly bills use the same accrual progress as Cash Prophet (real calendar cycles).
 * Other bills owed are deducted in full, like Due items.
 */

import type { Commitment } from '../types'
import { roundCurrency, toAmount } from './amounts'
import { getAccrualProgress } from './commitmentCalculations'
import { dateToKey, getReferenceDate } from './referenceDate'
import { formatCurrency } from './format'

export type FreeRegularCostInput = {
  id: string
  name: string
  amount: number
  /** Day of month the payment normally falls (1–31). */
  dueDayOfMonth: number
}

export type FreeOtherCostInput = {
  id: string
  name: string
  amount: number
}

export type FreeRegularCostResult = FreeRegularCostInput & {
  accrued: number
  fullAmount: number
  nextDueDate: Date
  nextDueKey: string
  daysUntilDue: number
  progress: number
  dailyRate: number
}

export type FreeOtherCostResult = FreeOtherCostInput & {
  owed: number
}

export type FreeCashPositionResult = {
  bankBalance: number
  regularCosts: FreeRegularCostResult[]
  regularAccruedTotal: number
  regularMonthlyTotal: number
  regularDailyTotal: number
  otherCosts: FreeOtherCostResult[]
  otherOwedTotal: number
  availableToday: number
}

function daysBetween(a: Date, b: Date): number {
  const ms = 1000 * 60 * 60 * 24
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((end.getTime() - start.getTime()) / ms)
}

/** Minimal monthly commitment so we reuse production accrual progress. */
function asMonthlyCommitment(amount: number, dueDayOfMonth: number): Commitment {
  return {
    id: 'free-check',
    name: '',
    schedule: 'monthly',
    amount: toAmount(amount),
    dueDayOfMonth: Math.min(31, Math.max(1, Math.round(dueDayOfMonth) || 28)),
    scopeLevel: 'business',
    scopeId: 'free-check',
    status: 'healthy',
  }
}

export function computeRegularCostAccrual(
  input: FreeRegularCostInput,
  referenceDate: Date = getReferenceDate(),
): FreeRegularCostResult {
  const fullAmount = roundCurrency(toAmount(input.amount))
  const dueDay = Math.min(31, Math.max(1, Math.round(input.dueDayOfMonth) || 28))
  const commitment = asMonthlyCommitment(fullAmount, dueDay)
  const accrual = getAccrualProgress(commitment, referenceDate)

  if (!accrual || fullAmount <= 0) {
    const today = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    )
    return {
      ...input,
      amount: fullAmount,
      dueDayOfMonth: dueDay,
      accrued: 0,
      fullAmount,
      nextDueDate: today,
      nextDueKey: dateToKey(today),
      daysUntilDue: 0,
      progress: 0,
      dailyRate: 0,
    }
  }

  const { progress, cycle } = accrual
  const accrued = roundCurrency(fullAmount * progress)
  const daysUntilDue = Math.max(0, daysBetween(cycle.today, cycle.cycleEnd))
  const cycleDays = Math.max(1, daysBetween(cycle.cycleStart, cycle.cycleEnd) + 1)
  const dailyRate = roundCurrency(fullAmount / cycleDays)

  return {
    ...input,
    amount: fullAmount,
    dueDayOfMonth: dueDay,
    accrued,
    fullAmount,
    nextDueDate: cycle.cycleEnd,
    nextDueKey: dateToKey(cycle.cycleEnd),
    daysUntilDue,
    progress,
    dailyRate,
  }
}

export function computeFreeCashPosition(input: {
  bankBalance: number
  regularCosts: FreeRegularCostInput[]
  otherCosts: FreeOtherCostInput[]
  referenceDate?: Date
}): FreeCashPositionResult {
  const referenceDate = input.referenceDate ?? getReferenceDate()
  const bankBalance = roundCurrency(toAmount(input.bankBalance))
  const regularCosts = input.regularCosts
    .filter((c) => toAmount(c.amount) > 0)
    .map((c) => computeRegularCostAccrual(c, referenceDate))
  const regularAccruedTotal = roundCurrency(
    regularCosts.reduce((sum, row) => sum + row.accrued, 0),
  )
  const regularMonthlyTotal = roundCurrency(
    regularCosts.reduce((sum, row) => sum + row.fullAmount, 0),
  )
  const regularDailyTotal = roundCurrency(
    regularCosts.reduce((sum, row) => sum + row.dailyRate, 0),
  )
  const otherCosts = input.otherCosts
    .filter((c) => toAmount(c.amount) > 0)
    .map((c) => ({
      ...c,
      name: c.name.trim() || 'Other bill',
      amount: roundCurrency(toAmount(c.amount)),
      owed: roundCurrency(toAmount(c.amount)),
    }))
  const otherOwedTotal = roundCurrency(otherCosts.reduce((sum, row) => sum + row.owed, 0))
  const availableToday = roundCurrency(bankBalance - regularAccruedTotal - otherOwedTotal)

  return {
    bankBalance,
    regularCosts,
    regularAccruedTotal,
    regularMonthlyTotal,
    regularDailyTotal,
    otherCosts,
    otherOwedTotal,
    availableToday,
  }
}

export function formatDueInDays(days: number): string {
  if (days <= 0) return 'Due today'
  if (days === 1) return 'Due in 1 day'
  return `Due in ${days} days`
}

export function formatAccruedLine(row: FreeRegularCostResult): string {
  return `${formatCurrency(row.accrued)} accrued`
}
