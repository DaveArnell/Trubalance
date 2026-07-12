import type { ParsedBankTransaction } from './types'
import type { TransactionGroupForAi } from './analysisSchema'
import { groupKeyForDescription } from './normalize'
import { roundCurrency } from '../utils/amounts'

const PAYROLL_MARKERS = /\b(PAYROLL|WAGES?|SALAR(Y|IES)|NET PAY)\b/i
const HMRC_MARKERS = /\b(HMRC|VAT|PAYE|CORPORATION TAX)\b/i
const TRANSFER_MARKERS =
  /\b(TRANSFER|TFR|SWEEP|INTERNAL|BETWEEN ACCOUNTS|TO SAV|FROM SAV|RESERVE)\b/i

function isPayrollLine(description: string): boolean {
  return PAYROLL_MARKERS.test(description)
}

function isHmrcLine(description: string): boolean {
  return HMRC_MARKERS.test(description)
}

function isTransferLine(description: string): boolean {
  return TRANSFER_MARKERS.test(description)
}

export function prepareTransactionGroups(
  transactions: ParsedBankTransaction[],
): TransactionGroupForAi[] {
  const buckets = new Map<string, ParsedBankTransaction[]>()

  for (const tx of transactions) {
    let key = groupKeyForDescription(tx.description)
    if (isPayrollLine(tx.description)) key = '__PAYROLL__'
    const list = buckets.get(key) ?? []
    list.push(tx)
    buckets.set(key, list)
  }

  const groups: TransactionGroupForAi[] = []

  for (const [supplierGroup, items] of buckets) {
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
    const outTotal = roundCurrency(
      items.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    )
    const inTotal = roundCurrency(
      items.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    )

    groups.push({
      supplier_group: supplierGroup === '__PAYROLL__' ? 'Payroll' : supplierGroup,
      sample_descriptions: [...new Set(items.map((t) => t.description))].slice(0, 5),
      transaction_count: items.length,
      total_out: outTotal,
      total_in: inTotal,
      is_likely_transfer: items.some((t) => isTransferLine(t.description)),
      is_likely_payroll: supplierGroup === '__PAYROLL__' || items.some((t) => isPayrollLine(t.description)),
      is_likely_hmrc: items.some((t) => isHmrcLine(t.description)),
      transactions: sorted.slice(0, 12).map((t) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
      })),
    })
  }

  return groups.sort((a, b) => b.transaction_count - a.transaction_count)
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
