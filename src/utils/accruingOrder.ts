import type { CommitmentAccruingRow } from '../types'
import { getAccrualCycle, getAccrualProgress } from './commitmentCalculations'
import { getReferenceDate } from './referenceDate'

function dateToKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Calendar day the upcoming payment lands on for this commitment.
 * Stored dueDayOfMonth can stay 31 to mean “last day of every month”
 * (→ 30 in September, 28/29 in February, etc.).
 */
export function accruingDueDayForDisplay(
  dueDayOfMonth: number | undefined,
  referenceDate: Date = getReferenceDate(),
): number {
  const stored = dueDayOfMonth ?? 28
  return getAccrualCycle(referenceDate, stored).cycleEnd.getDate()
}

/**
 * Next due date for timeline order.
 * Uses accrual progress so that on/after the due day (cycle reset) the next month’s
 * due date is used — freshly reset / least-full cards sort to the bottom.
 */
export function accruingNextDueDateKey(
  row: CommitmentAccruingRow,
  referenceDate: Date = getReferenceDate(),
): string {
  const progress = getAccrualProgress(row.commitment, referenceDate)
  if (progress) return dateToKey(progress.cycle.cycleEnd)

  const dueDay = row.commitment.dueDayOfMonth ?? 28
  const cycle = getAccrualCycle(referenceDate, dueDay)
  return dateToKey(cycle.cycleEnd)
}

/** Soonest upcoming due date first; earlier stored days before 31-as-EOM; reserve plans grouped. */
export function sortAccruingRowsByNextDue(
  rows: CommitmentAccruingRow[],
  referenceDate: Date = getReferenceDate(),
): CommitmentAccruingRow[] {
  return [...rows].sort((a, b) => {
    const dueCmp = accruingNextDueDateKey(a, referenceDate).localeCompare(
      accruingNextDueDateKey(b, referenceDate),
    )
    if (dueCmp !== 0) return dueCmp
    const dayA = a.commitment.dueDayOfMonth ?? 28
    const dayB = b.commitment.dueDayOfMonth ?? 28
    if (dayA !== dayB) return dayA - dayB
    const reserveCmp = Number(a.source !== 'reserve') - Number(b.source !== 'reserve')
    if (reserveCmp !== 0) return reserveCmp
    return a.commitment.name.localeCompare(b.commitment.name)
  })
}

/** Keep the user’s arranged order (sortOrder), then name. */
export function sortAccruingRowsBySortOrder(rows: CommitmentAccruingRow[]): CommitmentAccruingRow[] {
  return [...rows].sort((a, b) => {
    const orderA = a.commitment.sortOrder ?? 0
    const orderB = b.commitment.sortOrder ?? 0
    if (orderA !== orderB) return orderA - orderB
    return a.commitment.name.localeCompare(b.commitment.name)
  })
}
