import type { ExpectedReceipt } from '../types'
import { toAmount } from './amounts'
import { getReferenceDate, dateToKey } from './referenceDate'

export type ReceiptTiming = 'lump' | 'accrual'

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseDateKey(key: string): Date | null {
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : dateOnly(date)
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / (1000 * 60 * 60 * 24))
}

function periodFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getReceiptTiming(receipt: ExpectedReceipt): ReceiptTiming {
  return receipt.receiptTiming ?? 'lump'
}

/** First calendar day this receipt should affect True Balance and history. */
export function getReceiptActiveFromDateKey(receipt: ExpectedReceipt): string {
  const timing = getReceiptTiming(receipt)

  if (timing === 'accrual') {
    const start = receipt.accrualStartDate?.slice(0, 10)
    if (start) return start
    const expected = receipt.expectedDate?.slice(0, 10)
    if (expected) return `${expected.slice(0, 7)}-01`
  }

  if (timing === 'lump') {
    const start = receipt.accrualStartDate?.slice(0, 10)
    if (start) return start
  }

  if (receipt.createdAt) return receipt.createdAt.slice(0, 10)

  if (receipt.expectedDate) return `${receipt.expectedDate.slice(0, 7)}-01`

  return '1970-01-01'
}

export function receiptContributesOnDate(receipt: ExpectedReceipt, dateKey: string): boolean {
  return dateKey >= getReceiptActiveFromDateKey(receipt)
}

/** Target amount for a calendar month, respecting per-period overrides. */
export function getReceiptPeriodAmount(receipt: ExpectedReceipt, period: string): number {
  const override = receipt.periodAmountOverrides?.[period]
  if (override != null) return toAmount(override)
  return toAmount(receipt.amount)
}

function resolveAccrualWindow(receipt: ExpectedReceipt): { start: Date; end: Date; period: string } | null {
  const end = receipt.expectedDate ? parseDateKey(receipt.expectedDate) : null
  if (!end) return null

  const period = periodFromDate(end)
  const start =
    parseDateKey(receipt.accrualStartDate ?? '') ??
    dateOnly(new Date(end.getFullYear(), end.getMonth(), 1))

  if (start.getTime() > end.getTime()) return null
  return { start, end, period }
}

/**
 * How much of this receipt counts toward True Balance on a given date.
 * Lump: full headline amount from accrual-from (or row created date) until received.
 * Accrual: builds daily from start date to expected date.
 */
export function getEffectiveReceiptAmount(
  receipt: ExpectedReceipt,
  referenceDate: Date = getReferenceDate(),
): number {
  if (receipt.received) return 0

  const timing = getReceiptTiming(receipt)
  const today = dateOnly(referenceDate)

  if (timing === 'lump') {
    const activeFrom = parseDateKey(getReceiptActiveFromDateKey(receipt))
    if (activeFrom && today.getTime() < activeFrom.getTime()) return 0
    return toAmount(receipt.amount)
  }

  const window = resolveAccrualWindow(receipt)
  if (!window) return toAmount(receipt.amount)

  const target = getReceiptPeriodAmount(receipt, window.period)
  if (today.getTime() < window.start.getTime()) return 0
  if (today.getTime() >= window.end.getTime()) return target

  const totalDays = daysBetween(window.start, window.end)
  if (totalDays <= 0) return target
  const elapsed = daysBetween(window.start, today)
  return target * Math.min(1, elapsed / totalDays)
}

export function getReceiptDeleteFromDateKey(receipt: ExpectedReceipt): string {
  return getReceiptActiveFromDateKey(receipt)
}

export function getReceiptRebuildFromDateKey(
  receipt: ExpectedReceipt,
  patch: Partial<ExpectedReceipt> = {},
): string {
  const merged = { ...receipt, ...patch }
  const candidates = [getReceiptActiveFromDateKey(receipt), getReceiptActiveFromDateKey(merged)]

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
