import type { AppState, Commitment, ReserveBill, ReserveMonthConfirmation } from '../../types'
import { getReferenceDate } from '../../utils/referenceDate'
import { rollDemoRelativeDates } from './demoRollingDates'
import { demoAccountUpdatedAt } from './dateHelpers'
import { MONTHS } from '../../utils/format'
import { computeReserveMonthEndBalances } from '../../utils/reserveCalculations'

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function getDueDate(year: number, monthIndex: number, dueDay: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const day = Math.min(dueDay, lastDay)
  return dateOnly(new Date(year, monthIndex, day))
}

function periodAmount(commitment: Commitment, period: string): number {
  const override = commitment.periodAmountOverrides?.[period]
  return override != null ? override : commitment.amount
}

/** Mark monthly costs paid through today — demo looks like a business that clears bills on schedule. */
function markCommitmentsOperatingCurrent(commitments: Commitment[], today: Date): Commitment[] {
  const todayOnly = dateOnly(today)
  const year = today.getFullYear()

  return commitments.map((commitment) => {
    if (commitment.schedule !== 'monthly') {
      return { ...commitment, status: 'healthy' as const }
    }

    const dueDay = commitment.dueDayOfMonth ?? 28
    const paidPeriodAmounts = { ...(commitment.paidPeriodAmounts ?? {}) }
    const paidPeriodDates = { ...(commitment.paidPeriodDates ?? {}) }
    let lastPaid = commitment.lastPaidPeriod

    for (let monthIndex = 0; monthIndex <= today.getMonth(); monthIndex++) {
      const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
      const dueDate = getDueDate(year, monthIndex, dueDay)
      if (todayOnly.getTime() < dueDate.getTime()) continue

      paidPeriodAmounts[period] = periodAmount(commitment, period)
      const paidOn = new Date(dueDate)
      paidOn.setDate(paidOn.getDate() + 1)
      paidPeriodDates[period] = paidOn.toISOString().slice(0, 10)
      lastPaid = period
    }

    return {
      ...commitment,
      paidPeriodAmounts,
      paidPeriodDates,
      lastPaidPeriod: lastPaid,
      status: 'healthy' as const,
    }
  })
}

function reserveBillAmountInMonth(bill: ReserveBill, month: string): number {
  return bill.monthAmounts[month] ?? 0
}

function markReserveBillsOperatingCurrent(bills: ReserveBill[], today: Date): ReserveBill[] {
  const todayOnly = dateOnly(today)
  const year = today.getFullYear()

  return bills.map((bill) => {
    let latestPaid: string | undefined

    for (let monthIndex = 0; monthIndex <= today.getMonth(); monthIndex++) {
      const month = MONTHS[monthIndex]!
      const amount = reserveBillAmountInMonth(bill, month)
      if (amount <= 0) continue

      const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
      const dueDay = bill.monthDueDays?.[month] ?? 28
      const dueDate = getDueDate(year, monthIndex, dueDay)
      if (todayOnly.getTime() < dueDate.getTime()) continue

      latestPaid = period
    }

    if (!latestPaid) return bill
    return { ...bill, lastPaidPeriod: latestPaid }
  })
}

/**
 * Snap demo workspaces to a healthy operating day: due items cleared, only current-cycle accrual showing.
 * Expected receipts and planned due dates roll forward so they stay the same number of days ahead of today.
 * Reserve accounts sit at this month’s start balance — like a fresh month before the monthly transfer is done.
 */
export function applyDemoOperatingSnapshot(state: AppState, today = getReferenceDate()): AppState {
  const rolled = rollDemoRelativeDates(state, today)
  const updatedAt = demoAccountUpdatedAt(today)
  const monthIndex = today.getMonth()
  const freshMonthByPlannerId = new Map<string, number>()
  const freshMonthByAccountId = new Map<string, number>()
  const pastConfirmationsByPlannerId = new Map<string, Record<string, ReserveMonthConfirmation>>()

  for (const planner of rolled.reservePlanners) {
    const monthEnds = computeReserveMonthEndBalances(planner)
    // Start-of-month balance: transfer to next month’s plan target is still outstanding.
    const freshMonthBalance = monthEnds[monthIndex]?.startBalance
    if (freshMonthBalance != null) {
      freshMonthByPlannerId.set(planner.id, freshMonthBalance)
      if (planner.reserveAccountId) freshMonthByAccountId.set(planner.reserveAccountId, freshMonthBalance)
    }

    const confirmations: Record<string, ReserveMonthConfirmation> = {}
    for (let i = 0; i < monthIndex; i++) {
      const row = monthEnds[i]
      if (!row) continue
      confirmations[row.month] = {
        balance: row.balanceAfterBills,
        confirmedAt: new Date(today.getFullYear(), i, 28).toISOString(),
        transferDone: true,
      }
    }
    if (Object.keys(confirmations).length > 0) {
      pastConfirmationsByPlannerId.set(planner.id, confirmations)
    }
  }

  return {
    ...rolled,
    accounts: rolled.accounts.map((account) => ({
      ...account,
      updatedAt,
      balance: freshMonthByAccountId.get(account.id) ?? account.balance,
    })),
    commitments: markCommitmentsOperatingCurrent(rolled.commitments, today),
    reservePlanners: rolled.reservePlanners.map((planner) => ({
      ...planner,
      actualBalance: freshMonthByPlannerId.get(planner.id) ?? planner.actualBalance,
      monthConfirmations: pastConfirmationsByPlannerId.get(planner.id),
      bills: markReserveBillsOperatingCurrent(planner.bills, today),
    })),
  }
}
