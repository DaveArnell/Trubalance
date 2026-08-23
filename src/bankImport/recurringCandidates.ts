import { toAmount } from '../utils/amounts'
import { groupKeyForDescription, normalizeDescription } from './normalize'
import type { ParsedBankTransaction, SuggestionFrequency } from './types'

export interface RecurringCandidateForAi {
  candidate_id: string
  bank_payee: string
  sample_descriptions: string[]
  transaction_count: number
  months_seen: number
  months_covered: number
  month_coverage_ratio: number
  detected_frequency: SuggestionFrequency | 'unknown'
  median_gap_days: number | null
  typical_amount: number
  recent_amount: number
  max_amount: number
  suggested_due_day: number | null
  payment_months: string[]
  total_out: number
  is_likely_payroll: boolean
  is_likely_hmrc: boolean
  is_likely_transfer: boolean
  recent_transactions: Array<{ date: string; description: string; amount: number }>
}

function money2(value: number): number {
  return Math.round(toAmount(value) * 100) / 100
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!
}

function shortDesc(value: string, max = 80): string {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1).trimEnd()}…`
}

function monthKey(date: string): string {
  return date.slice(0, 7)
}

function monthLabel(date: string): string {
  const month = Number(date.slice(5, 7))
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
    month - 1
  ]!
}

const PAYROLL_MARKERS = /\b(PAYROLL|WAGES?|SALAR(Y|IES)|NET PAY|PAY GRP|WAGE GRP)\b/i
const DIVIDEND_MARKERS = /\bDIVIDEND/i
const TRANSFER_MARKERS =
  /\b(TRANSFER|TFR|TRNS\s+FT|SWEEP|INTERNAL|BETWEEN ACCOUNTS|TO SAV|FROM SAV|RESERVE)\b/i

function isPayrollLine(description: string): boolean {
  if (DIVIDEND_MARKERS.test(description)) return false
  return PAYROLL_MARKERS.test(description)
}

function isTransferLine(description: string): boolean {
  return TRANSFER_MARKERS.test(description)
}

/**
 * Keep separate finance / collection agreements when the statement includes
 * a distinct reference, so two contracts to the same lender stay two rows.
 */
export function candidateKeyForDescription(description: string): string {
  if (isPayrollLine(description)) return '__PAYROLL__'

  const upper = description.toUpperCase()
  const agreement =
    upper.match(/\b(BCD\d{6,})\b/) ||
    upper.match(/\b(VEC[A-Z0-9]{5,})\b/) ||
    upper.match(/\b(LQGB-[A-Z0-9]+)\b/) ||
    upper.match(/\b(TP\d{5,}-\d)\b/)

  const base = groupKeyForDescription(description)
  if (agreement) return `${base} ${agreement[1]}`
  return base || normalizeDescription(description)
}

function detectFrequencyFromGaps(gaps: number[]): {
  frequency: SuggestionFrequency | 'unknown'
  medianGap: number | null
} {
  if (gaps.length === 0) return { frequency: 'unknown', medianGap: null }
  const gap = median(gaps)
  if (gap >= 5 && gap <= 10) return { frequency: 'weekly', medianGap: gap }
  if (gap >= 12 && gap <= 18) return { frequency: 'weekly', medianGap: gap } // fortnightly-ish → treat carefully upstream
  if (gap >= 25 && gap <= 40) return { frequency: 'monthly', medianGap: gap }
  if (gap >= 80 && gap <= 110) return { frequency: 'quarterly', medianGap: gap }
  if (gap >= 150 && gap <= 220) return { frequency: 'annual', medianGap: gap } // six-monthly-ish
  if (gap >= 300 && gap <= 420) return { frequency: 'annual', medianGap: gap }
  if (gaps.length >= 2) return { frequency: 'irregular', medianGap: gap }
  return { frequency: 'unknown', medianGap: gap }
}

function dayOfMonthFromDates(dates: string[]): number | null {
  const days = dates.map((date) => Number(date.slice(8, 10))).filter((d) => d >= 1 && d <= 31)
  if (days.length === 0) return null
  return Math.round(median(days))
}

function daysBetween(a: string, b: string): number {
  const start = new Date(`${a}T12:00:00`).getTime()
  const end = new Date(`${b}T12:00:00`).getTime()
  return Math.round((end - start) / 86_400_000)
}

/** One payroll payday cluster per month — the recent-run total ChatGPT used, not one wage line. */
function payrollMonthlyRuns(
  items: ParsedBankTransaction[],
): Array<{ date: string; total: number }> {
  const byMonth = new Map<string, ParsedBankTransaction[]>()
  for (const tx of items) {
    const key = monthKey(tx.date)
    const list = byMonth.get(key) ?? []
    list.push(tx)
    byMonth.set(key, list)
  }

  const runs: Array<{ date: string; total: number }> = []
  for (const monthItems of byMonth.values()) {
    const sorted = [...monthItems].sort((a, b) => a.date.localeCompare(b.date))
    const clusters: ParsedBankTransaction[][] = []
    let current: ParsedBankTransaction[] = []
    for (const tx of sorted) {
      if (current.length === 0) {
        current = [tx]
        continue
      }
      const prev = current[current.length - 1]!
      if (daysBetween(prev.date, tx.date) <= 1) {
        current.push(tx)
      } else {
        clusters.push(current)
        current = [tx]
      }
    }
    if (current.length > 0) clusters.push(current)

    let best = clusters[0] ?? []
    let bestTotal = best.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    for (const cluster of clusters.slice(1)) {
      const total = cluster.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
      if (total > bestTotal) {
        best = cluster
        bestTotal = total
      }
    }
    if (best.length === 0) continue
    const dayTotals = new Map<string, number>()
    for (const tx of best) {
      dayTotals.set(tx.date, (dayTotals.get(tx.date) ?? 0) + Math.abs(tx.amount))
    }
    const bestDay =
      [...dayTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? best[0]!.date
    runs.push({ date: bestDay, total: money2(bestTotal) })
  }

  return runs.sort((a, b) => a.date.localeCompare(b.date))
}

function analysisSpanMonths(transactions: ParsedBankTransaction[]): number {
  if (transactions.length === 0) return 1
  const dates = transactions.map((t) => t.date).sort()
  const start = new Date(`${dates[0]!}T12:00:00`)
  const end = new Date(`${dates[dates.length - 1]!}T12:00:00`)
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1,
  )
}

/**
 * Discover recurring outflow candidates deterministically — same discovery step a careful
 * reviewer does before naming/classifying. The AI then classifies; it should not invent sparse lists.
 */
export function buildRecurringCandidates(
  transactions: ParsedBankTransaction[],
  options?: { minMonthlyAmount?: number; maxCandidates?: number },
): RecurringCandidateForAi[] {
  const minMonthly = options?.minMonthlyAmount && options.minMonthlyAmount > 0
    ? options.minMonthlyAmount
    : 200
  const maxCandidates = options?.maxCandidates ?? 80
  const spanMonths = analysisSpanMonths(transactions)

  const buckets = new Map<string, ParsedBankTransaction[]>()
  for (const tx of transactions) {
    if (tx.amount >= 0) continue
    const key = candidateKeyForDescription(tx.description)
    const list = buckets.get(key) ?? []
    list.push(tx)
    buckets.set(key, list)
  }

  const candidates: RecurringCandidateForAi[] = []
  let index = 0

  for (const [key, items] of buckets) {
    if (items.length < 2 && Math.abs(items[0]?.amount ?? 0) < minMonthly * 3) continue

    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
    const isPayroll = key === '__PAYROLL__'
    const payrollRuns = isPayroll ? payrollMonthlyRuns(sorted) : []

    const amounts = isPayroll && payrollRuns.length > 0
      ? payrollRuns.map((run) => run.total)
      : sorted.map((t) => Math.abs(t.amount))
    const dates = isPayroll && payrollRuns.length > 0
      ? payrollRuns.map((run) => run.date)
      : sorted.map((t) => t.date)
    const gaps: number[] = []
    for (let i = 1; i < dates.length; i++) {
      gaps.push(daysBetween(dates[i - 1]!, dates[i]!))
    }
    const { frequency, medianGap } = detectFrequencyFromGaps(gaps)

    const months = new Set(dates.map(monthKey))
    const monthsSeen = months.size
    const coverage = monthsSeen / spanMonths
    const typical = money2(median(amounts.slice(-6)))
    const recent = money2(amounts[amounts.length - 1] ?? 0)
    const maxAmount = money2(Math.max(...amounts))
    const totalOut = money2(
      isPayroll && payrollRuns.length > 0
        ? payrollRuns.reduce((sum, run) => sum + run.total, 0)
        : sorted.reduce((sum, t) => sum + Math.abs(t.amount), 0),
    )

    // Keep candidates that look monthly/reserve-worthy OR large / high coverage.
    const looksMonthly =
      frequency === 'monthly' ||
      (monthsSeen >= Math.min(4, spanMonths) && coverage >= 0.45 && medianGap != null && medianGap >= 20 && medianGap <= 45)
    const looksReserve =
      frequency === 'quarterly' ||
      frequency === 'annual' ||
      (monthsSeen >= 2 && medianGap != null && medianGap >= 70)
    const looksLarge = typical >= minMonthly || maxAmount >= minMonthly * 2

    // Drop clear weekly noise under threshold
    if (frequency === 'weekly' && typical < minMonthly) continue
    if (!looksMonthly && !looksReserve && !(looksLarge && monthsSeen >= 2)) continue
    if (looksMonthly && typical < minMonthly * 0.85 && maxAmount < minMonthly) continue

    const sampleDescriptions = [...new Set(sorted.map((t) => shortDesc(t.description)))].slice(0, 5)
    const bankPayee =
      key === '__PAYROLL__'
        ? 'Payroll'
        : sampleDescriptions[0] || key

    const paymentMonths = [...new Set(dates.map(monthLabel))]

    candidates.push({
      candidate_id: `c${index++}`,
      bank_payee: shortDesc(bankPayee, 72),
      sample_descriptions: sampleDescriptions,
      transaction_count: sorted.length,
      months_seen: monthsSeen,
      months_covered: spanMonths,
      month_coverage_ratio: money2(coverage),
      detected_frequency: frequency,
      median_gap_days: medianGap == null ? null : Math.round(medianGap),
      typical_amount: typical,
      recent_amount: recent,
      max_amount: maxAmount,
      suggested_due_day: dayOfMonthFromDates(dates),
      payment_months: paymentMonths,
      total_out: totalOut,
      is_likely_payroll: key === '__PAYROLL__' || sorted.some((t) => isPayrollLine(t.description)),
      is_likely_hmrc: sorted.some((t) => /\bHMRC\b/i.test(t.description)),
      is_likely_transfer: sorted.some((t) => isTransferLine(t.description)),
      recent_transactions: sorted.slice(-8).map((t) => ({
        date: t.date,
        description: shortDesc(t.description),
        amount: money2(t.amount),
      })),
    })
  }

  return candidates
    .sort((a, b) => b.typical_amount - a.typical_amount || b.transaction_count - a.transaction_count)
    .slice(0, maxCandidates)
}
