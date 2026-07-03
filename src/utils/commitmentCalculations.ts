import type { Commitment, CommitmentAccruingRow, CommitmentDueRow, CommitmentViews, DueRowKind, DueRowSection, HealthLevel, StatusColor } from '../types'
import { roundCurrency, toAmount } from './amounts'
import { sortByOrder } from './sortOrder'
import { getPlannedCommittedAmount, getPlannedDueTimingOffset, isPlannedDueAttentionDismissed, parsePlannedDueDateInput } from './plannedFunding'
import { getReferenceDate, getReferenceDateKey, dateToKey } from './referenceDate'
import { formatCurrency, MONTHS } from './format'

export function getCurrentDayOfMonth(): number {
  return getReferenceDate().getDate()
}

export function currentPeriod(): string {
  const key = getReferenceDateKey()
  return key.slice(0, 7)
}

/** Headline monthly budget — only edited in the Monthly accruing table. */
export function getMonthlyBudgetAmount(commitment: Commitment): number {
  return toAmount(commitment.amount)
}

/** Expected amount for a monthly period (YYYY-MM), respecting per-period overrides. */
export function getPeriodExpectedAmount(commitment: Commitment, period: string): number {
  const override = commitment.periodAmountOverrides?.[period]
  if (override != null) return toAmount(override)
  return getMonthlyBudgetAmount(commitment)
}

/** Accrual target for the active cycle — may use a one-month override without changing the headline budget. */
export function getAccrualTargetAmount(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): number {
  if (commitment.schedule !== 'monthly') return getMonthlyBudgetAmount(commitment)
  const activePeriod = getActiveAccrualPeriod(commitment, referenceDate)
  if (!activePeriod) return getMonthlyBudgetAmount(commitment)
  return getPeriodExpectedAmount(commitment, activePeriod)
}

/** @deprecated Use getAccrualTargetAmount or getMonthlyBudgetAmount */
export function getCurrentCycleAmount(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): number {
  return getAccrualTargetAmount(commitment, referenceDate)
}

/** Total shown on a rolled-up Due row for a monthly commitment. */
export function getCommitmentDueRowAmount(
  commitment: Commitment,
  occurrences: CommitmentDueOccurrence[],
): number {
  if (occurrences.length === 0) return 0
  const primary = occurrences[0]!
  if (occurrences.length === 1) {
    return getPeriodExpectedAmount(commitment, primary.period)
  }

  const overrides = commitment.periodAmountOverrides ?? {}
  const periodsWithOverrides = occurrences.filter((entry) => overrides[entry.period] != null)
  if (periodsWithOverrides.length === 1 && periodsWithOverrides[0]!.period === primary.period) {
    return toAmount(overrides[primary.period]!)
  }

  return occurrences.reduce(
    (sum, entry) => sum + getPeriodExpectedAmount(commitment, entry.period),
    0,
  )
}

export function buildCommitmentDueAmountOverridePatch(
  commitment: Commitment,
  primaryPeriod: string,
  amount: number,
  occurrences: CommitmentDueOccurrence[],
): Pick<Commitment, 'periodAmountOverrides'> {
  const overrides = { ...(commitment.periodAmountOverrides ?? {}) }
  const nextAmount = toAmount(amount)

  if (occurrences.length <= 1) {
    overrides[primaryPeriod] = nextAmount
    return { periodAmountOverrides: overrides }
  }

  overrides[primaryPeriod] = nextAmount
  for (const occurrence of occurrences.slice(1)) {
    delete overrides[occurrence.period]
  }
  return { periodAmountOverrides: overrides }
}

function isCommitmentDueRollupOverride(
  commitment: Commitment,
  occurrences: CommitmentDueOccurrence[],
): boolean {
  if (occurrences.length <= 1) return false
  const primary = occurrences[0]!
  const overrides = commitment.periodAmountOverrides ?? {}
  const periodsWithOverrides = occurrences.filter((entry) => overrides[entry.period] != null)
  return periodsWithOverrides.length === 1 && periodsWithOverrides[0]!.period === primary.period
}

function getOccurrenceDueShareAmount(
  commitment: Commitment,
  occurrences: CommitmentDueOccurrence[],
  occurrence: CommitmentDueOccurrence,
  index: number,
): number {
  if (isCommitmentDueRollupOverride(commitment, occurrences)) {
    return index === 0 ? getCommitmentDueRowAmount(commitment, occurrences) : 0
  }
  return getPeriodExpectedAmount(commitment, occurrence.period)
}

/** Actual amount recorded when a period was marked paid (falls back to expected). */
export function getPaidPeriodAmount(commitment: Commitment, period: string): number {
  const paid = commitment.paidPeriodAmounts?.[period]
  if (paid != null) return toAmount(paid)
  return getPeriodExpectedAmount(commitment, period)
}

/**
 * The monthly period whose accrual cycle is currently building (the upcoming due month).
 */
export function getActiveAccrualPeriod(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): string | null {
  if (commitment.schedule !== 'monthly') return null

  const dueDay = commitment.dueDayOfMonth ?? 28
  const today = dateOnly(referenceDate)
  const year = today.getFullYear()
  const month = today.getMonth()
  const thisMonthDue = getDueDate(year, month, dueDay)

  if (today.getTime() < thisMonthDue.getTime()) {
    return `${year}-${String(month + 1).padStart(2, '0')}`
  }

  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  return `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`
}

export interface MarkPaidOptions {
  paidAmount?: number
}

/**
 * When the headline monthly budget changes, lock unpaid due periods at the previous amount.
 * Per-month corrections in periodAmountOverrides are left untouched.
 */
export function buildAmountChangePatch(
  commitment: Commitment,
  newAmount: number,
  referenceDate: Date = getReferenceDate(),
): Partial<Commitment> {
  const oldAmount = getMonthlyBudgetAmount(commitment)
  const nextAmount = toAmount(newAmount)
  if (nextAmount === oldAmount) return {}

  if (commitment.schedule !== 'monthly') {
    return { amount: nextAmount }
  }

  const overrides = { ...(commitment.periodAmountOverrides ?? {}) }
  const dueOccurrences = getCommitmentDueOccurrences(commitment, referenceDate)

  for (const occurrence of dueOccurrences) {
    if (overrides[occurrence.period] == null) {
      overrides[occurrence.period] = oldAmount
    }
  }

  const patch: Partial<Commitment> = { amount: nextAmount }
  if (Object.keys(overrides).length > 0) {
    patch.periodAmountOverrides = overrides
  }
  return patch
}

/** Apply a one-month Due correction without changing the headline monthly budget. */
export function mergeCommitmentDuePeriodOverride(
  commitment: Commitment,
  primaryPeriod: string,
  amount: number,
  occurrences: CommitmentDueOccurrence[],
): Commitment {
  return {
    ...commitment,
    ...buildCommitmentDueAmountOverridePatch(commitment, primaryPeriod, amount, occurrences),
    amount: commitment.amount,
  }
}

/** Build paid-period amounts and lastPaidPeriod when marking a monthly commitment paid. */
export function buildMarkPaidPatch(
  commitment: Commitment,
  occurrences: CommitmentDueOccurrence[],
  options: MarkPaidOptions = {},
  referenceDate: Date = getReferenceDate(),
): Partial<Commitment> {
  const paidPeriodAmounts = { ...(commitment.paidPeriodAmounts ?? {}) }
  const paidPeriodDates = { ...(commitment.paidPeriodDates ?? {}) }
  const paidOn = dateToKey(referenceDate)

  if (occurrences.length === 0) {
    const period = getActiveAccrualPeriod(commitment, referenceDate) ?? getReferenceDateKey().slice(0, 7)
    const expected = getAccruedAmount(commitment, referenceDate)
    const actual = options.paidAmount != null ? toAmount(options.paidAmount) : expected
    paidPeriodAmounts[period] = roundCurrency(actual)
    paidPeriodDates[period] = paidOn
    return {
      lastPaidPeriod: period,
      paidPeriodAmounts,
      paidPeriodDates,
    }
  }

  const expectedTotal = getCommitmentDueRowAmount(commitment, occurrences)
  const actualTotal = options.paidAmount != null ? toAmount(options.paidAmount) : expectedTotal

  let remaining = actualTotal
  occurrences.forEach((occurrence, index) => {
    const expected = getOccurrenceDueShareAmount(commitment, occurrences, occurrence, index)
    let share: number
    if (options.paidAmount == null) {
      share = expected
    } else if (expectedTotal > 0) {
      share =
        index === occurrences.length - 1
          ? remaining
          : roundCurrency((expected / expectedTotal) * actualTotal)
    } else {
      share = roundCurrency(actualTotal / occurrences.length)
    }
    paidPeriodAmounts[occurrence.period] = roundCurrency(share)
    paidPeriodDates[occurrence.period] = paidOn
    remaining = roundCurrency(remaining - share)
  })

  const latest = occurrences[occurrences.length - 1]!.period
  return {
    lastPaidPeriod: latest,
    paidPeriodAmounts,
    paidPeriodDates,
  }
}

/** Total expected payoff for unpaid due rows (or current accrual if still building). */
export function getCommitmentPayoffExpectedTotal(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): number {
  const occurrences = getCommitmentDueOccurrences(commitment, referenceDate)
  if (occurrences.length > 0) {
    return getCommitmentDueRowAmount(commitment, occurrences)
  }
  return getAccruedAmount(commitment, referenceDate)
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Clamp due day to valid calendar day (e.g. 31 → 30 in April). */
export function clampDueDay(year: number, month: number, dueDay: number): number {
  const last = new Date(year, month + 1, 0).getDate()
  return Math.min(Math.max(1, dueDay), last)
}

function getDueDate(year: number, month: number, dueDay: number): Date {
  return dateOnly(new Date(year, month, clampDueDay(year, month, dueDay)))
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return dateOnly(result)
}

function daysBetweenDates(a: Date, b: Date): number {
  return Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / (1000 * 60 * 60 * 24))
}

export interface AccrualCycle {
  cycleStart: Date
  cycleEnd: Date
  today: Date
}

/**
 * Accrual runs from the day after the previous due date through the next due date (inclusive).
 * The monthly amount is spread evenly across that period.
 */
export function getAccrualCycle(referenceDate: Date, dueDayOfMonth: number): AccrualCycle {
  const dueDay = dueDayOfMonth ?? 28
  const today = dateOnly(referenceDate)
  const year = today.getFullYear()
  const month = today.getMonth()

  let cycleEnd = getDueDate(year, month, dueDay)

  if (today.getTime() > cycleEnd.getTime()) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    cycleEnd = getDueDate(nextYear, nextMonth, dueDay)
  }

  const prevMonth = cycleEnd.getMonth() === 0 ? 11 : cycleEnd.getMonth() - 1
  const prevYear = cycleEnd.getMonth() === 0 ? cycleEnd.getFullYear() - 1 : cycleEnd.getFullYear()
  const prevDue = getDueDate(prevYear, prevMonth, dueDay)
  const cycleStart = addDays(prevDue, 1)

  return { cycleStart, cycleEnd, today }
}

export function isPaidThisCycle(commitment: Commitment, referenceDate: Date = getReferenceDate()): boolean {
  if (commitment.schedule !== 'monthly') {
    return isCommitmentPaidForPeriod(commitment, currentPeriod(), referenceDate)
  }
  const period = getActiveAccrualPeriod(commitment, referenceDate) ?? currentPeriod()
  return isCommitmentPaidForPeriod(commitment, period, referenceDate)
}

function periodHasPaidRecord(commitment: Commitment, period: string): boolean {
  if (commitment.paidPeriodAmounts && period in commitment.paidPeriodAmounts) return true
  if (!commitment.lastPaidPeriod) return false
  return period <= commitment.lastPaidPeriod.slice(0, 7)
}

function getPeriodDueDateKey(commitment: Commitment, period: string): string | null {
  const [year, month] = period.split('-').map(Number)
  if (!year || !month) return null
  const dueDay = commitment.dueDayOfMonth ?? 28
  return dateToKey(getDueDate(year, month - 1, dueDay))
}

/** First calendar date a period counts as paid (explicit mark-paid date, or legacy estimate). */
export function getPeriodPaidFromDateKey(commitment: Commitment, period: string): string | null {
  if (!periodHasPaidRecord(commitment, period)) return null

  const explicit = commitment.paidPeriodDates?.[period]
  if (explicit) return explicit

  const dueKey = getPeriodDueDateKey(commitment, period)
  if (!dueKey) return null

  const [year, month, day] = dueKey.split('-').map(Number)
  const dueDate = dateOnly(new Date(year!, month! - 1, day!))
  return dateToKey(addDays(dueDate, 1))
}

export function isCommitmentPaidForPeriod(
  commitment: Commitment,
  period: string,
  referenceDate?: Date,
): boolean {
  const paidFrom = getPeriodPaidFromDateKey(commitment, period)
  if (!paidFrom) return false
  if (!referenceDate) return true
  return dateToKey(referenceDate) >= paidFrom
}

export function isAcknowledgedForPeriod(commitment: Commitment, period: string): boolean {
  return commitment.acknowledgedDuePeriods?.includes(period) ?? false
}

export function isDueAlertAcknowledged(row: CommitmentDueRow): boolean {
  if (row.commitment.schedule === 'planned') {
    const period = row.commitment.plannedDueDate?.slice(0, 7)
    return period ? isAcknowledgedForPeriod(row.commitment, period) : false
  }
  const period = row.dueReferencePeriod ?? row.period
  return isAcknowledgedForPeriod(row.commitment, period)
}

export function isDismissedForPeriod(commitment: Commitment, period: string): boolean {
  return commitment.dismissedDuePeriods?.includes(period) ?? false
}

function parseCommitmentCreatedDate(commitment: Commitment): Date | null {
  if (!commitment.createdAt) return null
  const d = new Date(commitment.createdAt)
  if (isNaN(d.getTime())) return null
  return dateOnly(d)
}

/** Monthly costs only roll into Due for periods whose due date is after the item was added. */
export function commitmentEligibleForPeriodDue(
  commitment: Commitment,
  year: number,
  monthIndex: number,
): boolean {
  const created = parseCommitmentCreatedDate(commitment)
  if (!created) return true
  const dueDay = commitment.dueDayOfMonth ?? 28
  const periodDueDate = getDueDate(year, monthIndex, dueDay)
  return created.getTime() < periodDueDate.getTime()
}

export interface CommitmentDueOccurrence {
  month: string
  monthIndex: number
  amount: number
  period: string
}

/** Unpaid monthly due periods in the current year that are on or past their due date. */
export function getCommitmentDueOccurrences(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): CommitmentDueOccurrence[] {
  if (commitment.schedule !== 'monthly') return []

  const year = referenceDate.getFullYear()
  const today = dateOnly(referenceDate)
  const dueDay = commitment.dueDayOfMonth ?? 28
  const preserved = new Set(commitment.preservedDuePeriods ?? [])
  const results: CommitmentDueOccurrence[] = []

  for (let monthIndex = 0; monthIndex <= today.getMonth(); monthIndex++) {
    const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    if (isCommitmentPaidForPeriod(commitment, period, referenceDate)) continue
    if (isDismissedForPeriod(commitment, period)) continue

    const keepInDue = preserved.has(period)
    if (!keepInDue) {
      const dueDate = getDueDate(year, monthIndex, dueDay)
      if (today.getTime() < dueDate.getTime()) continue
      if (!commitmentEligibleForPeriodDue(commitment, year, monthIndex)) continue
    }

    results.push({
      month: MONTHS[monthIndex]!,
      monthIndex,
      amount: getPeriodExpectedAmount(commitment, period),
      period,
    })
  }

  return results
}

export function getDueTimingOffsetForPeriod(
  commitment: Commitment,
  period: string,
  referenceDate: Date = getReferenceDate(),
): number | null {
  if (commitment.schedule !== 'monthly') return null
  if (isCommitmentPaidForPeriod(commitment, period, referenceDate)) return null

  const [year, month] = period.split('-').map(Number)
  if (!year || !month) return null
  const dueDay = commitment.dueDayOfMonth ?? 28
  const dueDate = getDueDate(year, month - 1, dueDay)
  return daysBetweenDates(dateOnly(referenceDate), dueDate)
}

export function formatDueRowTiming(row: CommitmentDueRow, referenceDate: Date = getReferenceDate()): string | null {
  if (row.reserveTransferDirection) return 'Reserve planner'

  if (row.commitment.schedule === 'planned') {
    const offset = getPlannedDueTimingOffset(row.commitment, referenceDate)
    if (offset === null) {
      return row.commitment.plannedLabel?.trim() || null
    }
    if (offset < 0) return `${-offset}d over`
    if (offset === 0) return 'Due'
    return `in ${offset}d`
  }

  const referencePeriod = row.dueReferencePeriod ?? row.period
  const offset = getDueTimingOffsetForPeriod(row.commitment, referencePeriod, referenceDate)
  if (offset === null) return formatDueTiming(row.commitment, referenceDate)
  if (offset < 0) return `${-offset}d over`
  if (offset === 0) return 'Due'
  return `in ${offset}d`
}

export function formatRolledDueTooltip(row: CommitmentDueRow): string | null {
  if (row.reserveTransferDirection) return row.commitment.notes ?? null
  if (!row.rolledPeriodCount || row.rolledPeriodCount <= 1) return null
  const months = row.rolledMonths?.join(', ') ?? ''
  return `Accrued ${row.rolledPeriodCount} times${months ? ` (${months})` : ''}`
}

export function getDerivedDueRowStatus(
  row: CommitmentDueRow,
  referenceDate: Date = getReferenceDate(),
): StatusColor {
  if (isDueAlertAcknowledged(row)) return 'healthy'

  if (row.reserveTransferDirection) return 'warning'

  if (row.commitment.schedule === 'planned') {
    if (isPlannedDueAttentionDismissed(row.commitment)) return 'healthy'
    const offset = getPlannedDueTimingOffset(row.commitment, referenceDate)
    if (offset === null) return 'healthy'
    if (offset > 7) return 'healthy'
    if (offset > 0) return 'warning'
    if (offset === 0) return 'risk'
    if (offset >= -1) return 'risk'
    if (offset >= -7) return 'critical'
    return 'critical'
  }

  const referencePeriod = row.dueReferencePeriod ?? row.period
  const offset = getDueTimingOffsetForPeriod(row.commitment, referencePeriod, referenceDate)
  if (offset === null) return getDerivedCommitmentStatus(row.commitment, referenceDate)
  const overdue = offset < 0 ? -offset : offset === 0 ? 0 : null
  if (overdue === null) return 'healthy'
  if (overdue <= 1) return 'warning'
  if (overdue === 2) return 'risk'
  return 'critical'
}

export function isDismissedThisCycle(commitment: Commitment): boolean {
  return commitment.dismissedDuePeriods?.includes(currentPeriod()) ?? false
}

/** Due-now row is active for this cycle (created on due date, not paid or dismissed). */
export function isDueEntryActive(commitment: Commitment, referenceDate: Date = getReferenceDate()): boolean {
  return isDueNow(commitment, referenceDate) && !isPaidThisCycle(commitment, referenceDate) && !isDismissedThisCycle(commitment)
}

export function isDueNow(commitment: Commitment, referenceDate: Date = getReferenceDate()): boolean {
  if (commitment.schedule !== 'monthly') return false
  if (isPaidThisCycle(commitment, referenceDate)) return false

  const dueDay = commitment.dueDayOfMonth ?? 28
  const today = dateOnly(referenceDate)
  const thisMonthDue = getDueDate(today.getFullYear(), today.getMonth(), dueDay)

  return today.getTime() >= thisMonthDue.getTime()
}

export function getAccrualProgress(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): { progress: number; cycle: AccrualCycle } | null {
  if (commitment.schedule !== 'monthly') return null
  if (isPaidThisCycle(commitment, referenceDate)) return null

  const dueDay = commitment.dueDayOfMonth ?? 28
  const today = dateOnly(referenceDate)
  const year = today.getFullYear()
  const month = today.getMonth()
  const thisMonthDue = getDueDate(year, month, dueDay)

  // On or after due day (unpaid): accrual resets and ticks toward the next due date.
  if (today.getTime() >= thisMonthDue.getTime()) {
    const cycleStart = addDays(thisMonthDue, 1)
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    const cycleEnd = getDueDate(nextYear, nextMonth, dueDay)

    if (today.getTime() < cycleStart.getTime()) {
      return { progress: 0, cycle: { cycleStart, cycleEnd, today } }
    }

    const totalDays = daysBetweenDates(cycleStart, cycleEnd) + 1
    const elapsedDays = daysBetweenDates(cycleStart, today) + 1
    const progress = Math.min(1, elapsedDays / totalDays)

    return { progress, cycle: { cycleStart, cycleEnd, today } }
  }

  const cycle = getAccrualCycle(referenceDate, dueDay)

  if (cycle.today.getTime() < cycle.cycleStart.getTime()) {
    return { progress: 0, cycle }
  }

  const totalDays = daysBetweenDates(cycle.cycleStart, cycle.cycleEnd) + 1
  const elapsedDays = daysBetweenDates(cycle.cycleStart, cycle.today) + 1
  const progress = Math.min(1, elapsedDays / totalDays)

  return { progress, cycle }
}

function shouldSuppressAccrualForPaidPeriod(commitment: Commitment, referenceDate: Date): boolean {
  if (!isPaidThisCycle(commitment, referenceDate)) return false

  const accrual = getAccrualProgress(commitment, referenceDate)
  if (!accrual) return true

  const today = dateOnly(referenceDate)
  const dueDay = commitment.dueDayOfMonth ?? 28
  const period = getActiveAccrualPeriod(commitment, referenceDate)
  if (!period) return true

  const [year, month] = period.split('-').map(Number)
  const dueDate = getDueDate(year, month - 1, dueDay)

  // Keep historic build-up visible through the due date even after the item is marked paid.
  if (today.getTime() <= dueDate.getTime()) return false
  return true
}

export function getAccruedAmount(commitment: Commitment, referenceDate: Date = getReferenceDate()): number {
  if (commitment.schedule !== 'monthly') return 0
  if (shouldSuppressAccrualForPaidPeriod(commitment, referenceDate)) return 0

  const accrual = getAccrualProgress(commitment, referenceDate)
  if (!accrual) return 0

  return toAmount(getCurrentCycleAmount(commitment, referenceDate)) * accrual.progress
}

/** Steady daily accrual rate for the active cycle (monthly budget ÷ days in cycle). */
export function getDailyAccrualRate(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): number {
  if (commitment.schedule !== 'monthly') return 0
  if (shouldSuppressAccrualForPaidPeriod(commitment, referenceDate)) return 0

  const accrual = getAccrualProgress(commitment, referenceDate)
  if (!accrual) return 0

  const totalDays = daysBetweenDates(accrual.cycle.cycleStart, accrual.cycle.cycleEnd) + 1
  if (totalDays <= 0) return 0

  return toAmount(getCurrentCycleAmount(commitment, referenceDate)) / totalDays
}

export function getAccruingRowDailyRate(
  row: CommitmentAccruingRow,
  referenceDate: Date = getReferenceDate(),
): number {
  if (row.source === 'reserve') {
    const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()
    return daysInMonth > 0 ? toAmount(row.commitment.amount) / daysInMonth : 0
  }
  return getDailyAccrualRate(row.commitment, referenceDate)
}

/** Days past the due date (0 on due day). null if not yet due or paid. */
export function getDaysOverdue(commitment: Commitment, referenceDate: Date = getReferenceDate()): number | null {
  const offset = getDueTimingOffset(commitment, referenceDate)
  if (offset === null || offset > 0) return null
  return -offset
}

/**
 * Signed offset to due date in the current month: negative = overdue, 0 = due today, positive = days until due.
 */
export function getDueTimingOffset(commitment: Commitment, referenceDate: Date = getReferenceDate()): number | null {
  if (commitment.schedule !== 'monthly') return null
  if (isPaidThisCycle(commitment, referenceDate)) return null

  const dueDay = commitment.dueDayOfMonth ?? 28
  const today = dateOnly(referenceDate)
  const dueDate = getDueDate(today.getFullYear(), today.getMonth(), dueDay)

  return daysBetweenDates(today, dueDate)
}

export function formatDueTiming(commitment: Commitment, referenceDate: Date = getReferenceDate()): string | null {
  const offset = getDueTimingOffset(commitment, referenceDate)
  if (offset === null) return null
  if (offset < 0) return `${-offset}d over`
  if (offset === 0) return 'Due'
  return `in ${offset}d`
}

/** Most overdue / earliest due date first; furthest from due date last. */
const DUE_KIND_ORDER: DueRowKind[] = [
  'monthly',
  'reserve',
  'planned-due',
  'planned-open',
  'planned-saving',
]

const DUE_SECTION_LABELS: Record<DueRowKind, string> = {
  monthly: 'From monthly costs',
  reserve: 'From reserve plans',
  'planned-due': 'Planned · due now',
  'planned-open': 'Planned · no date yet',
  'planned-saving': 'Saving for',
}

export function getDueRowKind(
  row: CommitmentDueRow,
  referenceDate: Date = getReferenceDate(),
): DueRowKind {
  if (row.source === 'reserve') return 'reserve'
  if (row.commitment.schedule === 'monthly') return 'monthly'

  const offset = getPlannedDueTimingOffset(row.commitment, referenceDate)
  if (!row.commitment.plannedDueDate) return 'planned-open'
  if (offset !== null && offset > 0) return 'planned-saving'
  return 'planned-due'
}

export function getDueRowKindLabel(kind: DueRowKind): string {
  switch (kind) {
    case 'monthly':
      return 'Monthly'
    case 'reserve':
      return 'Reserve'
    case 'planned-open':
      return 'No date'
    case 'planned-saving':
      return 'Saving for'
    case 'planned-due':
      return 'Due'
  }
}

export function buildDueRowSections(
  rows: CommitmentDueRow[],
  referenceDate: Date = getReferenceDate(),
): DueRowSection[] {
  const buckets = new Map<DueRowKind, CommitmentDueRow[]>()
  for (const row of rows) {
    const kind = getDueRowKind(row, referenceDate)
    const bucket = buckets.get(kind) ?? []
    bucket.push(row)
    buckets.set(kind, bucket)
  }

  const sections: DueRowSection[] = []
  for (const kind of DUE_KIND_ORDER) {
    const bucket = buckets.get(kind)
    if (!bucket?.length) continue
    sections.push({
      kind,
      label: DUE_SECTION_LABELS[kind],
      rows: sortDueRowsByUrgency(bucket, referenceDate),
    })
  }
  return sections
}

export function sortDueRowsByUrgency(rows: CommitmentDueRow[], referenceDate: Date = getReferenceDate()): CommitmentDueRow[] {
  return [...rows].sort((a, b) => {
    const periodA = a.dueReferencePeriod ?? a.period
    const periodB = b.dueReferencePeriod ?? b.period
    const offsetA =
      getDueTimingOffsetForPeriod(a.commitment, periodA, referenceDate) ??
      getDueTimingOffset(a.commitment, referenceDate) ??
      Infinity
    const offsetB =
      getDueTimingOffsetForPeriod(b.commitment, periodB, referenceDate) ??
      getDueTimingOffset(b.commitment, referenceDate) ??
      Infinity
    return offsetA - offsetB
  })
}

export function sortDueRows(rows: CommitmentDueRow[], referenceDate: Date = getReferenceDate()): CommitmentDueRow[] {
  const hasCustomOrder = rows.some((row) => row.sortOrder !== undefined)
  if (hasCustomOrder) {
    return sortByOrder(rows, (row) => row.sortOrder)
  }
  return sortDueRowsByUrgency(rows, referenceDate)
}

/** Amount this due row contributes to committed / due totals. */
export function getDueRowCommittedAmount(
  row: CommitmentDueRow,
  referenceDate: Date = getReferenceDate(),
): number {
  if (row.reserveTransferDirection === 'from_reserve') return 0
  if (row.reserveTransferDirection === 'to_reserve') return row.amount

  const kind = getDueRowKind(row, referenceDate)
  if (kind === 'monthly' || kind === 'reserve' || kind === 'planned-due') {
    return row.amount
  }
  if (kind === 'planned-saving' || kind === 'planned-open') {
    return getPlannedCommittedAmount(row.commitment, referenceDate)
  }
  return row.amount
}

export function sumDueRowAmounts(
  rows: CommitmentDueRow[],
  referenceDate: Date = getReferenceDate(),
): number {
  return rows.reduce((sum, row) => sum + getDueRowCommittedAmount(row, referenceDate), 0)
}

/** Full face value of due rows (Due panel header total). */
export function sumDueRowDisplayAmounts(rows: CommitmentDueRow[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0)
}

export function isReserveTransferDueRow(row: CommitmentDueRow): boolean {
  return row.reserveTransferDirection === 'to_reserve' || row.reserveTransferDirection === 'from_reserve'
}

export function getDerivedCommitmentStatus(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): StatusColor {
  if (commitment.schedule === 'planned') return 'healthy'
  if (commitment.schedule === 'monthly') {
    return getMonthlyCostAttentionStatus(commitment, referenceDate)
  }
  if (isPaidThisCycle(commitment)) return 'healthy'

  const overdue = getDaysOverdue(commitment, referenceDate)
  if (overdue === null) return 'healthy'
  if (overdue <= 1) return 'warning'
  if (overdue === 2) return 'risk'
  return 'critical'
}

/** Status for a monthly cost — uses earliest unpaid due period (matches Due table). */
export function getMonthlyCostAttentionStatus(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): StatusColor {
  if (commitment.schedule !== 'monthly') return 'healthy'

  const occurrences = getCommitmentDueOccurrences(commitment, referenceDate)
  if (occurrences.length === 0) return 'healthy'

  const primary = occurrences[0]!
  if (isAcknowledgedForPeriod(commitment, primary.period)) return 'healthy'

  const offset = getDueTimingOffsetForPeriod(commitment, primary.period, referenceDate)
  if (offset === null || offset > 0) return 'healthy'

  const overdue = offset < 0 ? -offset : 0
  if (overdue <= 1) return 'warning'
  if (overdue === 2) return 'risk'
  return 'critical'
}

export function formatMonthlyCostAttentionTiming(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): string | null {
  const occurrences = getCommitmentDueOccurrences(commitment, referenceDate)
  if (occurrences.length === 0) return null

  const primary = occurrences[0]!
  const offset = getDueTimingOffsetForPeriod(commitment, primary.period, referenceDate)
  if (offset === null) return null

  const rolled = occurrences.length > 1 ? ` · ${occurrences.length} unpaid periods` : ''

  if (offset < 0) return `${-offset}d overdue (${primary.month})${rolled}`
  if (offset === 0) return `Due today (${primary.month})${rolled}`
  return `Due in ${offset}d (${primary.month})`
}

export function monthlyCostNeedsAttention(
  commitment: Commitment,
  referenceDate: Date = getReferenceDate(),
): boolean {
  return getMonthlyCostAttentionStatus(commitment, referenceDate) !== 'healthy'
}

export function statusColorToHealthLevel(status: StatusColor): HealthLevel {
  if (status === 'critical') return 'red'
  if (status === 'risk') return 'orange'
  if (status === 'warning') return 'yellow'
  return 'green'
}

export function countDueRowsNeedingAttention(
  views: CommitmentViews,
  referenceDate: Date = getReferenceDate(),
): CommitmentDueRow[] {
  return views.due.filter((row) => {
    if (isDueAlertAcknowledged(row)) return false
    if (row.commitment.schedule === 'planned') {
      const offset = getPlannedDueTimingOffset(row.commitment, referenceDate)
      if (offset === null) return false
      return offset <= 0
    }
    return getDerivedDueRowStatus(row, referenceDate) !== 'healthy'
  })
}

export function worstDueRowStatus(rows: CommitmentDueRow[], referenceDate: Date = getReferenceDate()): StatusColor {
  const rank: Record<StatusColor, number> = {
    healthy: 0,
    warning: 1,
    risk: 2,
    critical: 3,
  }
  let worst: StatusColor = 'healthy'
  for (const row of rows) {
    const status = getDerivedDueRowStatus(row, referenceDate)
    if (rank[status] > rank[worst]) worst = status
  }
  return worst
}

export function formatDueRowAttentionDetail(
  row: CommitmentDueRow,
  referenceDate: Date = getReferenceDate(),
): string {
  const amount = row.amount
  const fmtAmount = formatCurrency(amount)

  if (row.commitment.schedule === 'planned') {
    const offset = getPlannedDueTimingOffset(row.commitment, referenceDate)
    if (offset === null) return fmtAmount
    if (offset < 0) return `${fmtAmount} · ${-offset}d overdue`
    if (offset === 0) return `${fmtAmount} · due today`
    return `${fmtAmount} · due in ${offset}d`
  }

  if (row.source === 'reserve') {
    const status = getDerivedDueRowStatus(row, referenceDate)
    if (status === 'critical' || status === 'risk') return `${fmtAmount} · overdue`
    if (status === 'warning') return `${fmtAmount} · due soon`
    return fmtAmount
  }

  const referencePeriod = row.dueReferencePeriod ?? row.period
  const offset = getDueTimingOffsetForPeriod(row.commitment, referencePeriod, referenceDate)
  if (offset !== null && offset < 0) return `${fmtAmount} · ${-offset}d overdue`
  if (offset === 0) return `${fmtAmount} · due today`
  if (offset !== null && offset > 0 && offset <= 7) return `${fmtAmount} · due in ${offset}d`
  return fmtAmount
}

export function formatDueAttentionSummary(rows: CommitmentDueRow[]): string {
  const monthly = rows.filter((r) => r.commitment.schedule === 'monthly').length
  const reserve = rows.filter((r) => r.source === 'reserve').length
  const planned = rows.filter((r) => r.commitment.schedule === 'planned').length

  const parts: string[] = []
  if (monthly > 0) parts.push(`${monthly} monthly`)
  if (reserve > 0) parts.push(`${reserve} reserve`)
  if (planned > 0) parts.push(`${planned} planned`)

  const breakdown = parts.length > 0 ? parts.join(', ') : `${rows.length} item(s)`
  return `${rows.length} in Due (${breakdown}). Coloured dots are on those rows — same names at different venues count separately.`
}

export function getAccrualTooltip(commitment: Commitment): string {
  if (isPaidThisCycle(commitment)) return 'Marked paid this month'

  const accrual = getAccrualProgress(commitment)
  if (!accrual) return ''

  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const { cycle, progress } = accrual
  const overdue = getDaysOverdue(commitment)
  const overdueNote =
    overdue !== null && overdue > 0 ? ` · ${overdue} day${overdue === 1 ? '' : 's'} overdue` : overdue === 0 ? ' · due today' : ''

  return `Accruing ${fmt(cycle.cycleStart)} – ${fmt(cycle.cycleEnd)} (${Math.round(progress * 100)}%)${overdueNote}`
}

export function getEffectiveCommittedAmount(commitment: Commitment, referenceDate: Date = getReferenceDate()): number {
  if (commitment.schedule === 'planned') return getPlannedCommittedAmount(commitment, referenceDate)
  const dueOccurrences = getCommitmentDueOccurrences(commitment, referenceDate)
  if (dueOccurrences.length > 0) {
    return getCommitmentDueRowAmount(commitment, dueOccurrences)
  }
  if (isPaidThisCycle(commitment, referenceDate)) return 0
  return getAccruedAmount(commitment, referenceDate)
}

export function buildCommitmentViews(
  commitments: Commitment[],
  reserveRows: CommitmentAccruingRow[] = [],
  reserveDueRows: CommitmentDueRow[] = [],
  referenceDate: Date = getReferenceDate(),
): CommitmentViews {
  const monthly = sortByOrder(
    commitments.filter((c) => c.schedule === 'monthly'),
    (c) => c.sortOrder,
  )
  const planned = sortByOrder(
    commitments.filter((c) => c.schedule === 'planned'),
    (c) => c.sortOrder,
  )
  const period = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`

  const commitmentBuilding = sortByOrder(
    monthly.map((commitment) => ({
      commitment,
      accruedAmount: getAccruedAmount(commitment, referenceDate),
      source: 'commitment' as const,
    })),
    (row) => row.commitment.sortOrder,
  )

  // Monthly costs always stay in the monthly table — they keep accruing each cycle.
  const buildingUp: CommitmentAccruingRow[] = [...commitmentBuilding, ...reserveRows]

  const plannedDueRows: CommitmentDueRow[] = planned.map((commitment) => ({
    id: `planned-${commitment.id}`,
    commitment,
    amount: toAmount(commitment.amount),
    period: commitment.plannedDueDate?.slice(0, 7) ?? '2099-12',
    source: 'commitment',
    sortOrder: commitment.sortOrder,
  }))

  // Due: monthly costs on due date; reserve bills; one-off planned costs. Sorted most urgent first.
  const due = sortDueRows([
    ...monthly.flatMap((commitment) => {
      const occurrences = getCommitmentDueOccurrences(commitment, referenceDate)
      if (occurrences.length === 0) return []

      const primary = occurrences[0]!
      const totalAmount = getCommitmentDueRowAmount(commitment, occurrences)

      return [
        {
          id: `${commitment.id}-${period}`,
          commitment,
          amount: totalAmount,
          period,
          source: 'commitment' as const,
          sortOrder: commitment.sortOrder,
          dueReferencePeriod: primary.period,
          rolledPeriodCount: occurrences.length,
          rolledMonths: occurrences.map((entry) => entry.month),
        },
      ]
    }),
    ...plannedDueRows,
    ...reserveDueRows,
  ])

  return { monthly, buildingUp, due, planned }
}

export interface CommittedFundsBreakdown {
  outstandingDue: number
  outstandingPlanned: number
  accruedMonthly: number
  accruedReserve: number
  total: number
}

/** Split committed funds into amounts due/outstanding vs still accruing this cycle. */
export function summarizeCommittedFundsBreakdown(
  views: CommitmentViews,
  referenceDate: Date = getReferenceDate(),
): CommittedFundsBreakdown {
  const outstandingDue = sumDueRowAmounts(views.due, referenceDate)
  const outstandingPlanned = views.planned.reduce(
    (sum, c) => sum + getPlannedCommittedAmount(c, referenceDate),
    0,
  )
  const accruedMonthly = views.monthly.reduce((sum, commitment) => {
    if (getCommitmentDueOccurrences(commitment, referenceDate).length > 0) return sum
    return sum + getAccruedAmount(commitment, referenceDate)
  }, 0)
  const accruedReserve = views.buildingUp
    .filter((row) => row.source === 'reserve')
    .reduce((sum, row) => sum + row.accruedAmount, 0)

  return {
    outstandingDue,
    outstandingPlanned,
    accruedMonthly,
    accruedReserve,
    total: outstandingDue + accruedMonthly + accruedReserve,
  }
}

export function sumCommittedFunds(
  commitments: Commitment[],
  reserveRows: CommitmentAccruingRow[] = [],
  reserveDueRows: CommitmentDueRow[] = [],
  referenceDate: Date = getReferenceDate(),
): number {
  let total = 0
  for (const commitment of commitments) {
    total += getEffectiveCommittedAmount(commitment, referenceDate)
  }
  for (const row of reserveRows) {
    total += row.accruedAmount
  }
  for (const row of reserveDueRows) {
    total += getDueRowCommittedAmount(row, referenceDate)
  }
  return total
}

export function parseDueDayFromLegacyDate(dueDate?: string): number {
  if (!dueDate) return 28
  const match = dueDate.match(/^(\d{1,2})/)
  if (match) {
    const day = Number(match[1])
    if (day >= 1 && day <= 31) return day
  }
  return 28
}

function backfillPaidPeriodDates(commitment: Commitment): Record<string, string> | undefined {
  if (commitment.schedule !== 'monthly') return commitment.paidPeriodDates

  const dates = { ...(commitment.paidPeriodDates ?? {}) }
  const periods = new Set<string>([...Object.keys(commitment.paidPeriodAmounts ?? {})])
  if (commitment.lastPaidPeriod) periods.add(commitment.lastPaidPeriod.slice(0, 7))

  let changed = false
  for (const period of periods) {
    if (dates[period] || !periodHasPaidRecord(commitment, period)) continue
    const dueKey = getPeriodDueDateKey(commitment, period)
    if (!dueKey) continue
    const [year, month, day] = dueKey.split('-').map(Number)
    const dueDate = dateOnly(new Date(year!, month! - 1, day!))
    dates[period] = dateToKey(addDays(dueDate, 1))
    changed = true
  }

  if (!changed) return commitment.paidPeriodDates
  return dates
}

export function migrateCommitment(raw: Record<string, unknown>): Commitment {
  const legacy = raw as unknown as Commitment & {
    type?: 'buildingUp' | 'due' | 'planned'
    dueDate?: string
    paid?: boolean
  }

  if (legacy.schedule === 'monthly' || legacy.schedule === 'planned') {
    const plannedDueDate =
      legacy.plannedDueDate ??
      (legacy.schedule === 'planned' && legacy.plannedLabel
        ? parsePlannedDueDateInput(legacy.plannedLabel) ?? undefined
        : undefined)

    const migrated: Commitment = {
      ...legacy,
      amount: toAmount(legacy.amount),
      dueDayOfMonth: legacy.dueDayOfMonth,
      plannedDueDate,
      fundingMethod:
        legacy.schedule === 'planned' ? (legacy.fundingMethod ?? 'immediate') : legacy.fundingMethod,
      amountToReserveNow:
        legacy.amountToReserveNow != null ? toAmount(legacy.amountToReserveNow) : undefined,
      periodAmountOverrides: legacy.periodAmountOverrides,
      paidPeriodAmounts: legacy.paidPeriodAmounts,
      paidPeriodDates: legacy.paidPeriodDates,
    }
    return { ...migrated, paidPeriodDates: backfillPaidPeriodDates(migrated) }
  }

  const schedule = legacy.type === 'planned' ? 'planned' : 'monthly'

  const migrated: Commitment = {
    id: legacy.id,
    name: legacy.name,
    schedule,
    amount: toAmount(legacy.amount),
    dueDayOfMonth: schedule === 'monthly' ? parseDueDayFromLegacyDate(legacy.dueDate) : undefined,
    plannedLabel: schedule === 'planned' ? legacy.dueDate : undefined,
    plannedDueDate:
      schedule === 'planned' && legacy.dueDate
        ? parsePlannedDueDateInput(legacy.dueDate) ?? undefined
        : undefined,
    fundingMethod: schedule === 'planned' ? 'immediate' : undefined,
    scopeLevel: legacy.scopeLevel,
    scopeId: legacy.scopeId,
    status: legacy.status,
    notes: legacy.notes,
    lastPaidPeriod: legacy.paid ? currentPeriod() : legacy.lastPaidPeriod,
  }
  return { ...migrated, paidPeriodDates: backfillPaidPeriodDates(migrated) }
}
