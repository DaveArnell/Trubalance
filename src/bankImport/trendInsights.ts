import { newId } from '../utils/id'
import { roundCurrency } from '../utils/amounts'
import { categorizeDescription, categoryDisplayName } from './categorize'
import { groupKeyForDescription } from './normalize'
import type { ParsedBankTransaction, SuggestionCategory } from './types'

export interface ImportTrendInsight {
  id: string
  message: string
  category?: SuggestionCategory
  /** Insights only — never auto-apply. */
  informational: true
}

function monthsBetween(first: string, last: string): number {
  const start = new Date(`${first}T12:00:00`)
  const end = new Date(`${last}T12:00:00`)
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1,
  )
}

function payeeLabel(description: string): string {
  const key = groupKeyForDescription(description)
  return key
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/** Rule-based trend insights — shown for user awareness only. */
export function detectTrendInsights(transactions: ParsedBankTransaction[]): ImportTrendInsight[] {
  if (transactions.length < 4) return []

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
  const firstDate = sorted[0]!.date
  const lastDate = sorted[sorted.length - 1]!.date
  const spanMonths = monthsBetween(firstDate, lastDate)

  const groups = new Map<string, ParsedBankTransaction[]>()
  for (const transaction of transactions) {
    const key = groupKeyForDescription(transaction.description)
    const bucket = groups.get(key) ?? []
    bucket.push(transaction)
    groups.set(key, bucket)
  }

  const insights: ImportTrendInsight[] = []

  for (const [key, items] of groups) {
    if (items.length < 3) continue

    const outflows = items.filter((item) => item.amount < 0)
    if (outflows.length < 3) continue

    const amounts = outflows.map((item) => Math.abs(item.amount))
    const dates = outflows.map((item) => item.date).sort()
    const label = payeeLabel(outflows[0]!.description)
    const category = categorizeDescription(outflows[0]!.description, false).category
    const categoryLabel = categoryDisplayName(category)

    const midpoint = Math.floor(outflows.length / 2)
    const early = amounts.slice(0, midpoint)
    const late = amounts.slice(midpoint)
    const earlyAvg = early.reduce((sum, value) => sum + value, 0) / early.length
    const lateAvg = late.reduce((sum, value) => sum + value, 0) / late.length

    if (earlyAvg > 0 && lateAvg > earlyAvg * 1.12) {
      const pct = Math.round(((lateAvg - earlyAvg) / earlyAvg) * 100)
      insights.push({
        id: newId(),
        message: `${label} appears to have risen — about ${pct}% higher in recent months (average ${roundCurrency(lateAvg)} vs ${roundCurrency(earlyAvg)} earlier).`,
        category,
        informational: true,
      })
    } else if (earlyAvg > 0 && lateAvg < earlyAvg * 0.88) {
      const pct = Math.round(((earlyAvg - lateAvg) / earlyAvg) * 100)
      insights.push({
        id: newId(),
        message: `${label} appears to have fallen — about ${pct}% lower in recent months.`,
        category,
        informational: true,
      })
    } else if (amounts.every((value) => Math.abs(value - amounts[0]!) / amounts[0]! <= 0.05)) {
      if (category === 'rent' || category === 'loan' || category === 'subscription') {
        insights.push({
          id: newId(),
          message: `${label} looks steady at around ${roundCurrency(amounts[0]!)} each time.`,
          category,
          informational: true,
        })
      }
    }

    const lastPayment = dates[dates.length - 1]!
    const monthsSinceLast =
      monthsBetween(lastPayment, lastDate) - 1
    if (outflows.length >= 4 && monthsSinceLast >= 2 && spanMonths >= 6) {
      insights.push({
        id: newId(),
        message: `A regular payment to ${label} may have stopped — nothing seen in the last ${monthsSinceLast} months.`,
        category,
        informational: true,
      })
    }

    const firstPayment = dates[0]!
    const monthsBeforeFirst = monthsBetween(firstDate, firstPayment) - 1
    if (outflows.length >= 2 && monthsBeforeFirst <= 2 && spanMonths >= 6) {
      insights.push({
        id: newId(),
        message: `${label} looks like a newer regular payment — only seen in the last few months.`,
        category,
        informational: true,
      })
    }

    if (category === 'hmrc' && outflows.length >= 3) {
      const quarterly = amounts.length >= 4
      if (quarterly) {
        insights.push({
          id: newId(),
          message: `${categoryLabel} payments (${label}) fluctuate by quarter — worth checking against your VAT or tax cycle.`,
          category,
          informational: true,
        })
      }
    }
  }

  const seen = new Set<string>()
  return insights
    .filter((insight) => {
      if (seen.has(insight.message)) return false
      seen.add(insight.message)
      return true
    })
    .slice(0, 8)
}

export function historySpanMonths(transactions: ParsedBankTransaction[]): number {
  if (transactions.length === 0) return 0
  const dates = transactions.map((item) => item.date).sort()
  return monthsBetween(dates[0]!, dates[dates.length - 1]!)
}
