import type { ParsedBankTransaction } from './types'
import type { TransactionGroupForAi } from './analysisSchema'
import { groupKeyForDescription } from './normalize'
import { toAmount } from '../utils/amounts'

const PAYROLL_MARKERS = /\b(PAYROLL|WAGES?|SALAR(Y|IES)|NET PAY|PAY GRP|SWINDON PAY)\b/i
const DIVIDEND_MARKERS = /\bDIVIDEND/i
const TRANSFER_MARKERS =
  /\b(TRANSFER|TFR|SWEEP|INTERNAL|BETWEEN ACCOUNTS|TO SAV|FROM SAV|RESERVE)\b/i

function isPayrollLine(description: string): boolean {
  if (DIVIDEND_MARKERS.test(description)) return false
  return PAYROLL_MARKERS.test(description)
}

function isTransferLine(description: string): boolean {
  return TRANSFER_MARKERS.test(description)
}

function money2(value: number): number {
  return Math.round(toAmount(value) * 100) / 100
}

/**
 * Compact payee groups for the model — keep payees distinct (not “Utilities”).
 * Prefer largest outflows so important bills are not dropped when capping group count.
 * Keep the payload small enough for Edge + OpenAI time limits on long statements.
 */
export function prepareTransactionGroups(
  transactions: ParsedBankTransaction[],
  options?: { maxGroups?: number },
): TransactionGroupForAi[] {
  const maxGroups = options?.maxGroups ?? 80
  const buckets = new Map<string, ParsedBankTransaction[]>()

  for (const tx of transactions) {
    // Keep HMRC / card agreements separate by normalised payee — do not merge all tax into one bucket.
    let key = groupKeyForDescription(tx.description)
    if (isPayrollLine(tx.description)) key = '__PAYROLL__'
    const list = buckets.get(key) ?? []
    list.push(tx)
    buckets.set(key, list)
  }

  const groups: TransactionGroupForAi[] = []

  for (const [supplierGroup, items] of buckets) {
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
    const outTotal = money2(
      items.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    )
    const inTotal = money2(items.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0))
    const shortDesc = (value: string) =>
      value.length > 72 ? `${value.slice(0, 69).trimEnd()}…` : value

    groups.push({
      supplier_group: supplierGroup === '__PAYROLL__' ? 'Payroll' : shortDesc(supplierGroup),
      sample_descriptions: [...new Set(items.map((t) => shortDesc(t.description)))].slice(0, 4),
      transaction_count: items.length,
      total_out: outTotal,
      total_in: inTotal,
      is_likely_transfer: items.some((t) => isTransferLine(t.description)),
      is_likely_payroll:
        supplierGroup === '__PAYROLL__' || items.some((t) => isPayrollLine(t.description)),
      is_likely_hmrc: /\bHMRC\b/i.test(items.map((t) => t.description).join(' ')),
      // Recent samples only — enough for pattern/amount, small enough for Edge timeouts.
      transactions: sorted.slice(-12).map((t) => ({
        date: t.date,
        description: shortDesc(t.description),
        amount: money2(t.amount),
      })),
    })
  }

  return groups
    .sort((a, b) => b.total_out - a.total_out || b.transaction_count - a.transaction_count)
    .slice(0, maxGroups)
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
