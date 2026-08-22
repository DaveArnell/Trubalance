import type { ParsedBankTransaction } from './types'
import { toAmount } from '../utils/amounts'

function money2(value: number): number {
  return Math.round(toAmount(value) * 100) / 100
}

function shortDesc(value: string, max = 55): string {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1).trimEnd()}…`
}

/**
 * Compact money-out ledger for the DIY prompt.
 * Keeps payee/date/amount detail the model needs, but stays small enough for
 * OpenAI tokens-per-minute limits (full 1800-line CSVs were ~100k+ input tokens).
 */
export function prepareCompactLedger(
  transactions: ParsedBankTransaction[],
  options?: { maxLines?: number },
): string {
  // ~900 short outflow lines ≈ a workable statement without burning the rate limit.
  const maxLines = options?.maxLines ?? 900

  const outflows = [...transactions]
    .filter((t) => t.amount < 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

  // Prefer the most recent history (patterns that matter for setup).
  const rows = outflows.length > maxLines ? outflows.slice(-maxLines) : outflows

  return rows
    .map((t) => `${t.date}\t${shortDesc(t.description)}\t${money2(t.amount).toFixed(2)}`)
    .join('\n')
}

export function analysisPeriodFromTransactions(transactions: ParsedBankTransaction[]): {
  start_date: string
  end_date: string
  months_covered: number
} {
  if (transactions.length === 0) {
    const today = new Date().toISOString().slice(0, 10)
    return { start_date: today, end_date: today, months_covered: 0 }
  }
  const dates = transactions.map((t) => t.date).sort()
  const start = dates[0]!
  const end = dates[dates.length - 1]!
  const startDate = new Date(`${start}T12:00:00`)
  const endDate = new Date(`${end}T12:00:00`)
  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    1
  return { start_date: start, end_date: end, months_covered: Math.max(1, months) }
}
