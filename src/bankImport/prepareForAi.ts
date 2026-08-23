import type { ParsedBankTransaction } from './types'
import type { RecurringCandidateForAi } from './recurringCandidates'
import { toAmount } from '../utils/amounts'

function money2(value: number): number {
  return Math.round(toAmount(value) * 100) / 100
}

function shortDesc(value: string, max = 55): string {
  const cleaned = value
    .replace(
      /^(Bill Payment|Direct Debit|Standing Order|Counter Credit|Bank Giro Credit|Faster Payment|Card Payment|Debit|Credit)\s+/i,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim()
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
  // ~1100 short outflow lines — more history for rent/VAT/annual patterns.
  const maxLines = options?.maxLines ?? 1100

  const outflows = [...transactions]
    .filter((t) => t.amount < 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

  // Prefer the most recent history (patterns that matter for setup).
  const rows = outflows.length > maxLines ? outflows.slice(-maxLines) : outflows

  return rows
    .map((t) => `${t.date}\t${shortDesc(t.description, 72)}\t${money2(t.amount).toFixed(2)}`)
    .join('\n')
}

/** Compact CSV of payee evidence so the model gets real due days / amounts / months. */
export function preparePayeeEvidenceCsv(candidates: RecurringCandidateForAi[]): string {
  const header =
    'bank_payee,count,months_seen,median_gap_days,typical_amount,recent_amount,max_amount,due_day,payment_months,flags'
  const lines = candidates.map((c) => {
    const payee = c.bank_payee.replace(/"/g, '""')
    const months = c.payment_months.join(' ')
    const flags = [
      c.is_likely_payroll ? 'payroll' : '',
      c.is_likely_hmrc ? 'hmrc' : '',
      c.is_likely_transfer ? 'transfer' : '',
      c.detected_frequency !== 'unknown' ? c.detected_frequency : '',
    ]
      .filter(Boolean)
      .join('|')
    return `"${payee}",${c.transaction_count},${c.months_seen},${c.median_gap_days ?? ''},${c.typical_amount.toFixed(2)},${c.recent_amount.toFixed(2)},${c.max_amount.toFixed(2)},${c.suggested_due_day ?? ''},"${months}","${flags}"`
  })
  return [header, ...lines].join('\n')
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
