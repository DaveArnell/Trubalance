import type { ExpectedReceipt } from '../types'
import { toAmount } from './amounts'
import { parsePlannedDueDateInput, formatPlannedDueDate } from './plannedFunding'
import { getReferenceDate, dateToKey } from './referenceDate'

export type ReceiptTiming = 'lump' | 'accrual'

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseDateKey(key: string): Date | null {
  const iso = resolveReceiptDateKey(key)
  if (!iso) return null
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : dateOnly(date)
}

/** Parse receipt Start / Expected input (ISO or friendly text like "1 Jul") to YYYY-MM-DD. */
export function resolveReceiptDateKey(
  input: string | undefined,
  referenceDate: Date = getReferenceDate(),
): string | null {
  if (!input?.trim()) return null
  return parsePlannedDueDateInput(input, referenceDate)
}

/** Normalize user-entered receipt dates to ISO when possible (for storage). */
export function normalizeReceiptDateInput(
  input: string,
  referenceDate: Date = getReferenceDate(),
): string | undefined {
  const trimmed = input.trim()
  if (!trimmed) return undefined
  return resolveReceiptDateKey(trimmed, referenceDate) ?? undefined
}

/** Coerce receipt date fields to YYYY-MM-DD for database date columns. */
export function serializeReceiptDateField(
  value: string | undefined,
  referenceDate: Date = getReferenceDate(),
): string | null {
  if (!value?.trim()) return null
  return resolveReceiptDateKey(value, referenceDate)
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / (1000 * 60 * 60 * 24))
}

function periodFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Display stored receipt dates as e.g. 14 Jul 2026. */
export function formatReceiptDateDisplay(value: string | undefined): string {
  if (!value?.trim()) return ''
  return formatPlannedDueDate(value, value)
}

export function getReceiptTiming(receipt: ExpectedReceipt): ReceiptTiming {
  return receipt.receiptTiming ?? 'lump'
}

/**
 * When this receipt begins counting toward True Balance.
 * Lump sum requires an explicit Start; build-up defaults to the first of the Expected month.
 */
export function getReceiptStartDateKey(
  receipt: ExpectedReceipt,
  referenceDate: Date = getReferenceDate(),
): string | null {
  const explicit = resolveReceiptDateKey(receipt.accrualStartDate, referenceDate)
  if (explicit) return explicit

  if (getReceiptTiming(receipt) === 'accrual') {
    const expected = resolveReceiptDateKey(receipt.expectedDate, referenceDate)
    if (expected) return `${expected.slice(0, 7)}-01`
  }

  return null
}

/** Earliest calendar day to rebuild history when this receipt changes. */
export function getReceiptActiveFromDateKey(receipt: ExpectedReceipt): string {
  const start = getReceiptStartDateKey(receipt)
  if (start) return start

  if (receipt.createdAt) return receipt.createdAt.slice(0, 10)

  if (receipt.expectedDate) {
    const expected = resolveReceiptDateKey(receipt.expectedDate)
    if (expected) return `${expected.slice(0, 7)}-01`
  }

  return '1970-01-01'
}

/** Calendar day this receipt stopped accruing in expected receipts (when cash was received). */
export function getReceiptReceivedDateKey(
  receipt: ExpectedReceipt,
  fallbackDate: Date = getReferenceDate(),
): string | null {
  if (!receipt.received) return null
  if (receipt.receivedDate) return receipt.receivedDate
  return dateToKey(fallbackDate)
}

export function receiptContributesOnDate(
  receipt: ExpectedReceipt,
  dateKey: string,
  referenceDate: Date = getReferenceDate(),
): boolean {
  const start = getReceiptStartDateKey(receipt)
  if (!start || dateKey < start) return false

  const receivedOn = getReceiptReceivedDateKey(receipt, referenceDate)
  if (receivedOn && dateKey >= receivedOn) return false

  return true
}

/** Target amount for a calendar month, respecting per-period overrides. */
export function getReceiptPeriodAmount(receipt: ExpectedReceipt, period: string): number {
  const override = receipt.periodAmountOverrides?.[period]
  if (override != null) return toAmount(override)
  return toAmount(receipt.amount)
}

export function resolveReceiptAccrualWindow(
  receipt: ExpectedReceipt,
  referenceDate: Date = getReferenceDate(),
): { start: Date; end: Date; period: string } | null {
  const endKey = resolveReceiptDateKey(receipt.expectedDate, referenceDate)
  const end = endKey ? parseDateKey(endKey) : null
  if (!end) return null

  const period = periodFromDate(end)
  const startKey = resolveReceiptDateKey(receipt.accrualStartDate, referenceDate)
  const start =
    (startKey ? parseDateKey(startKey) : null) ??
    dateOnly(new Date(end.getFullYear(), end.getMonth(), 1))

  if (start.getTime() > end.getTime()) return null
  return { start, end, period }
}

export function getReceiptDailyAccrualRate(
  receipt: ExpectedReceipt,
  referenceDate: Date = getReferenceDate(),
): number {
  if (getReceiptTiming(receipt) !== 'accrual') return 0
  if (getReceiptReceivedDateKey(receipt, referenceDate)) return 0
  const window = resolveReceiptAccrualWindow(receipt, referenceDate)
  if (!window) return 0
  const target = getReceiptPeriodAmount(receipt, window.period)
  const totalDays = daysBetween(window.start, window.end)
  if (totalDays <= 0) return 0
  return target / totalDays
}

/**
 * Accrued amount as if the receipt were still open on referenceDate (ignores received status).
 * Lump: full amount from Start (no Start = no effect — avoids spikes on new rows).
 * Build up: accrues daily from Start to Expected.
 */
export function getReceiptAccruedAmountAt(
  receipt: ExpectedReceipt,
  referenceDate: Date = getReferenceDate(),
): number {
  const timing = getReceiptTiming(receipt)
  const today = dateOnly(referenceDate)

  if (timing === 'lump') {
    const startKey = getReceiptStartDateKey(receipt)
    if (!startKey) return 0
    const activeFrom = parseDateKey(startKey)
    if (activeFrom && today.getTime() < activeFrom.getTime()) return 0
    return toAmount(receipt.amount)
  }

  const window = resolveReceiptAccrualWindow(receipt, referenceDate)
  if (!window) return 0

  const target = getReceiptPeriodAmount(receipt, window.period)
  if (today.getTime() < window.start.getTime()) return 0
  if (today.getTime() >= window.end.getTime()) return target

  const totalDays = daysBetween(window.start, window.end)
  if (totalDays <= 0) return target
  const elapsed = daysBetween(window.start, today)
  return target * Math.min(1, elapsed / totalDays)
}

/**
 * How much of this receipt counts toward True Balance on a given date.
 * Active receipts accrue until marked received; from receivedDate onward the amount is zero
 * (cash should be in the current account instead). Dates before receivedDate keep their accrual.
 */
export function getEffectiveReceiptAmount(
  receipt: ExpectedReceipt,
  referenceDate: Date = getReferenceDate(),
): number {
  const receivedOn = getReceiptReceivedDateKey(receipt, referenceDate)
  if (receivedOn) {
    const asOfKey = dateToKey(dateOnly(referenceDate))
    if (asOfKey >= receivedOn) return 0
  }

  return getReceiptAccruedAmountAt(receipt, referenceDate)
}

export function getReceiptDeleteFromDateKey(receipt: ExpectedReceipt): string {
  return getReceiptActiveFromDateKey(receipt)
}

export function getReceiptRebuildFromDateKey(
  receipt: ExpectedReceipt,
  patch: Partial<ExpectedReceipt> = {},
): string {
  const merged = { ...receipt, ...patch }
  const candidates = [
    getReceiptStartDateKey(receipt),
    getReceiptStartDateKey(merged),
    getReceiptActiveFromDateKey(receipt),
    getReceiptActiveFromDateKey(merged),
  ].filter((date): date is string => date != null)

  if (patch.periodAmountOverrides) {
    const periods = Object.keys(patch.periodAmountOverrides).sort()
    if (periods[0]) candidates.push(`${periods[0]}-01`)
  }

  return candidates.sort()[0] ?? dateToKey(getReferenceDate())
}

export function buildReceiptPeriodOverridePatch(
  receipt: ExpectedReceipt,
  period: string,
  amount: number,
): Pick<ExpectedReceipt, 'periodAmountOverrides'> {
  const overrides = { ...(receipt.periodAmountOverrides ?? {}) }
  overrides[period] = toAmount(amount)
  return { periodAmountOverrides: overrides }
}
