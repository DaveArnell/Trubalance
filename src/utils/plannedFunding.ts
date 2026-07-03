import type { Commitment } from '../types'
import { getReferenceDate } from './referenceDate'
import { toAmount } from './amounts'
import { formatCurrency } from './format'

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysBetweenDates(a: Date, b: Date): number {
  return Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / (1000 * 60 * 60 * 24))
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoDate(iso: string): Date | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const d = dateOnly(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (Number.isNaN(d.getTime())) return null
  return d
}

/** Parse user due-date input into YYYY-MM-DD. */
export function parsePlannedDueDateInput(input: string, referenceDate: Date = getReferenceDate()): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const iso = parseIsoDate(trimmed)
  if (iso) return isoFromDate(iso)

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slash) {
    const d = dateOnly(new Date(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1])))
    if (!Number.isNaN(d.getTime())) return isoFromDate(d)
  }

  const dayMonth = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?$/i)
  if (dayMonth) {
    const day = Number(dayMonth[1])
    const monthIdx = MONTH_SHORT.findIndex((m) => m.toLowerCase() === dayMonth[2].slice(0, 3).toLowerCase())
    if (monthIdx >= 0) {
      const year = dayMonth[3] ? Number(dayMonth[3]) : referenceDate.getFullYear()
      const d = dateOnly(new Date(year, monthIdx, day))
      if (!Number.isNaN(d.getTime())) return isoFromDate(d)
    }
  }

  const monthOnly = MONTH_SHORT.findIndex((m) => trimmed.toLowerCase().startsWith(m.toLowerCase()))
  if (monthOnly >= 0) {
    const ref = dateOnly(referenceDate)
    let year = ref.getFullYear()
    const candidate = dateOnly(new Date(year, monthOnly, 1))
    if (candidate.getTime() < ref.getTime()) year += 1
    return isoFromDate(new Date(year, monthOnly, 1))
  }

  return null
}

export function formatPlannedDueDate(iso: string | undefined, fallbackLabel?: string): string {
  if (iso) {
    const d = parseIsoDate(iso)
    if (d) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  }
  return fallbackLabel?.trim() || '—'
}

export function getPlannedFundingLabel(method: Commitment['fundingMethod']): string {
  switch (method) {
    case 'immediate':
      return 'Reserve now'
    case 'accrue_until_due':
      return 'Build up'
    case 'hybrid':
      return 'Part now + build'
    default:
      return 'Set funding'
  }
}

/** YYYY-MM period used when acknowledging a planned due notification. */
export function getPlannedDueDismissPeriod(commitment: Commitment): string | null {
  if (commitment.schedule !== 'planned' || !commitment.plannedDueDate) return null
  return commitment.plannedDueDate.slice(0, 7)
}

export function isPlannedDueAttentionDismissed(commitment: Commitment): boolean {
  const period = getPlannedDueDismissPeriod(commitment)
  if (!period) return false
  return commitment.acknowledgedDuePeriods?.includes(period) ?? false
}

export function getPlannedFundingStartDate(commitment: Commitment, referenceDate: Date = getReferenceDate()): Date {
  if (commitment.fundingStartDate) {
    const parsed = parseIsoDate(commitment.fundingStartDate)
    if (parsed) return parsed
  }
  return dateOnly(referenceDate)
}

function accrualProgress(start: Date, due: Date, today: Date): number {
  if (today.getTime() >= due.getTime()) return 1
  if (today.getTime() < start.getTime()) return 0
  const totalDays = Math.max(1, daysBetweenDates(start, due) + 1)
  const elapsedDays = Math.min(totalDays, daysBetweenDates(start, today) + 1)
  return elapsedDays / totalDays
}

/** Committed amount today for a planned commitment (does not affect monthly/due rows). */
export function getPlannedCommittedAmount(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): number {
  if (commitment.schedule !== 'planned') return 0

  const amount = toAmount(commitment.amount)
  if (amount <= 0) return 0

  const dueIso = commitment.plannedDueDate
  const dueDate = dueIso ? parseIsoDate(dueIso) : null
  const method = commitment.fundingMethod ?? 'immediate'
  const today = dateOnly(referenceDate)

  if (!dueDate) {
    return method === 'immediate' ? amount : 0
  }

  if (today.getTime() >= dueDate.getTime()) return amount

  if (method === 'immediate') return amount

  const start = getPlannedFundingStartDate(commitment, referenceDate)
  const progress = accrualProgress(start, dueDate, today)

  if (method === 'accrue_until_due') {
    return toAmount(amount * progress)
  }

  const reserveNow = Math.min(amount, Math.max(0, toAmount(commitment.amountToReserveNow ?? 0)))
  const remaining = amount - reserveNow
  return toAmount(reserveNow + remaining * progress)
}

export function getPlannedFundingTooltip(commitment: Commitment, referenceDate: Date = getReferenceDate()): string {
  const amount = toAmount(commitment.amount)
  const committed = getPlannedCommittedAmount(commitment, referenceDate)
  const method = commitment.fundingMethod ?? 'immediate'
  const due = formatPlannedDueDate(commitment.plannedDueDate, commitment.plannedLabel)

  if (method === 'immediate') {
    return `Full ${formatCurrency(amount)} reserved now · due ${due}`
  }
  if (method === 'accrue_until_due') {
    return `Building up to due date (${due}) · ${formatCurrency(committed)} reserved so far`
  }
  const reserveNow = toAmount(commitment.amountToReserveNow ?? 0)
  return `${formatCurrency(reserveNow)} reserved now, rest building until ${due}`
}

/** Linear daily accrual toward the due date (0 once fully reserved or for immediate funding). */
export function getPlannedAccrualDailyRate(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): number {
  if (commitment.schedule !== 'planned') return 0

  const method = commitment.fundingMethod ?? 'immediate'
  const amount = toAmount(commitment.amount)
  if (amount <= 0 || method === 'immediate') return 0

  const dueDate = commitment.plannedDueDate ? parseIsoDate(commitment.plannedDueDate) : null
  if (!dueDate) return 0

  const today = dateOnly(referenceDate)
  if (today.getTime() >= dueDate.getTime()) return 0

  const start = getPlannedFundingStartDate(commitment, referenceDate)
  const totalDays = Math.max(1, daysBetweenDates(start, dueDate) + 1)

  if (method === 'accrue_until_due') {
    return toAmount(amount / totalDays)
  }

  const reserveNow = Math.min(amount, Math.max(0, toAmount(commitment.amountToReserveNow ?? 0)))
  const remaining = amount - reserveNow
  return toAmount(remaining / totalDays)
}

/** Short line for the Due table funding column (committed total and daily rate). */
export function formatPlannedFundingStats(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): string | null {
  if (!plannedCommitmentReadyForFunding(commitment)) return null

  const committed = getPlannedCommittedAmount(commitment, referenceDate)
  const method = commitment.fundingMethod ?? 'immediate'

  if (method === 'immediate') {
    return `${formatCurrency(committed)} reserved`
  }

  const daily = getPlannedAccrualDailyRate(commitment, referenceDate)
  const committedLabel = formatCurrency(committed)
  if (daily > 0) {
    return `${committedLabel} · ${formatCurrency(daily)}/day`
  }
  return `${committedLabel} reserved`
}

export function getPlannedDueTimingOffset(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): number | null {
  if (commitment.schedule !== 'planned') return null
  const due = commitment.plannedDueDate ? parseIsoDate(commitment.plannedDueDate) : null
  if (!due) return null
  return daysBetweenDates(dateOnly(referenceDate), due)
}

export function plannedCommitmentReadyForFunding(commitment: Commitment): boolean {
  return (
    commitment.schedule === 'planned' &&
    toAmount(commitment.amount) > 0 &&
    !!commitment.plannedDueDate
  )
}

export function inferPlannedDueDate(commitment: Commitment, referenceDate: Date = getReferenceDate()): string | undefined {
  if (commitment.plannedDueDate) return commitment.plannedDueDate
  if (!commitment.plannedLabel?.trim()) return undefined
  return parsePlannedDueDateInput(commitment.plannedLabel, referenceDate) ?? undefined
}
