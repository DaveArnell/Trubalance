import type { ParsedBankTransaction } from './types'
import { toAmount } from '../utils/amounts'

function money2(value: number): number {
  return Math.round(toAmount(value) * 100) / 100
}

function shortDesc(value: string, max = 90): string {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1).trimEnd()}…`
}

/**
 * Compact ledger for the model — same raw visibility ChatGPT gets from a statement,
 * without our earlier aggressive pre-grouping that collapsed payees.
 */
export function prepareCompactLedger(
  transactions: ParsedBankTransaction[],
  options?: { maxLines?: number },
): string {
  const maxLines = options?.maxLines ?? 2800
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

  // Prefer keeping outflows if we must truncate (bills matter more for this draft).
  let rows = sorted
  if (rows.length > maxLines) {
    const outflows = sorted.filter((t) => t.amount < 0)
    const inflows = sorted.filter((t) => t.amount >= 0)
    if (outflows.length >= maxLines) {
      rows = outflows.slice(-maxLines)
    } else {
      const inflowBudget = maxLines - outflows.length
      rows = [...outflows, ...inflows.slice(-inflowBudget)].sort((a, b) =>
        a.date.localeCompare(b.date),
      )
    }
  }

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
