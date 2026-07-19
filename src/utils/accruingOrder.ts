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

/** Soonest upcoming due date first — same order as the mobile accruing list. */
export function sortAccruingRowsByNextDue(
  rows: CommitmentAccruingRow[],
  referenceDate: Date = getReferenceDate(),
): CommitmentAccruingRow[] {
  return [...rows].sort((a, b) => {
    const dueCmp = accruingNextDueDateKey(a, referenceDate).localeCompare(
      accruingNextDueDateKey(b, referenceDate),
    )
    if (dueCmp !== 0) return dueCmp
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
