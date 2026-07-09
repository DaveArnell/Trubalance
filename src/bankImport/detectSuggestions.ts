import { newId } from '../utils/id'
import { roundCurrency } from '../utils/amounts'
import type {
  BankImportSuggestion,
  ParsedBankTransaction,
  SuggestionFrequency,
} from './types'
import { groupKeyForDescription } from './normalize'
import { passesMinMonthlyThreshold } from './importFilters'
import {
  categorizeDescription,
  categoryDisplayName,
  frequencyDisplayName,
  suggestDestination,
} from './categorize'

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!
}

function dayOfMonthFromDates(dates: string[]): number | undefined {
  const days = dates.map((date) => Number(date.slice(8, 10))).filter((d) => d >= 1 && d <= 31)
  if (days.length === 0) return undefined
  return Math.round(median(days))
}

function monthIndexFromDates(dates: string[]): number | undefined {
  const months = dates.map((date) => Number(date.slice(5, 7))).filter((m) => m >= 1 && m <= 12)
  if (months.length === 0) return undefined
  return Math.round(median(months))
}

function detectFrequency(dates: string[]): SuggestionFrequency {
  if (dates.length < 2) return 'one_off'

  const sorted = [...dates].sort()
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(`${sorted[i - 1]!}T12:00:00`).getTime()
    const b = new Date(`${sorted[i]!}T12:00:00`).getTime()
    gaps.push(Math.round((b - a) / 86_400_000))
  }

  const gap = median(gaps)
  if (gap >= 5 && gap <= 9) return 'weekly'
  if (gap >= 25 && gap <= 35) return 'monthly'
  if (gap >= 80 && gap <= 100) return 'quarterly'
  if (gap >= 330 && gap <= 400) return 'annual'
  if (dates.length >= 3) return 'irregular'
  return 'one_off'
}

function amountConsistencyScore(amounts: number[]): number {
  if (amounts.length < 2) return 0
  const avg = amounts.reduce((sum, value) => sum + value, 0) / amounts.length
  if (avg === 0) return 0
  const maxDev = Math.max(...amounts.map((value) => Math.abs(value - avg) / avg))
  if (maxDev <= 0.05) return 15
  if (maxDev <= 0.15) return 10
  if (maxDev <= 0.3) return 5
  return 0
}

function titleCaseName(text: string): string {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48)
  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function monthsSpanned(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort()
  const start = new Date(`${sorted[0]!}T12:00:00`)
  const end = new Date(`${sorted[sorted.length - 1]!}T12:00:00`)
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1,
  )
}

function buildReason(
  count: number,
  frequency: SuggestionFrequency,
  categoryLabel: string,
  amounts: number[],
  dates: string[],
  payeeName: string,
  likelyDueDay?: number,
): string {
  const avg = roundCurrency(amounts.reduce((sum, value) => sum + value, 0) / amounts.length)
  const spanMonths = monthsSpanned(dates)
  const freqLabel = frequencyDisplayName(frequency).toLowerCase()
  const duePart =
    likelyDueDay && frequency === 'monthly'
      ? `, usually around the ${likelyDueDay}${likelyDueDay === 1 ? 'st' : likelyDueDay === 2 ? 'nd' : likelyDueDay === 3 ? 'rd' : 'th'} of each month`
      : likelyDueDay
        ? `, often around day ${likelyDueDay}`
        : ''

  const spanPart =
    spanMonths >= 12
      ? `over the last ${spanMonths} months`
      : spanMonths > 1
        ? `over ${spanMonths} months`
        : 'in your statement'

  if (frequency === 'one_off') {
    return `We found ${count} large payment${count === 1 ? '' : 's'} to ${payeeName} ${spanPart}, averaging ${avg}. This may be a one-off or annual cost.`
  }

  const categoryPart =
    categoryLabel && categoryLabel !== 'Other'
      ? ` This looks like a ${freqLabel} ${categoryLabel.toLowerCase()} cost.`
      : ` This looks like a ${freqLabel} recurring cost.`

  return `We found ${count} payment${count === 1 ? '' : 's'} to ${payeeName} ${spanPart}${duePart}, with an average value of ${avg}.${categoryPart}`
}

function minimumOccurrencesForFrequency(frequency: SuggestionFrequency): number {
  switch (frequency) {
    case 'monthly':
      return 3
    case 'weekly':
      return 4
    case 'quarterly':
      return 3
    case 'annual':
      return 2
    default:
      return Number.POSITIVE_INFINITY
  }
}

export function detectSuggestionsRuleBased(
  transactions: ParsedBankTransaction[],
  options?: { minMonthlyAmount?: number },
): BankImportSuggestion[] {
  const groups = new Map<string, ParsedBankTransaction[]>()

  for (const transaction of transactions) {
    const key = groupKeyForDescription(transaction.description)
    const bucket = groups.get(key) ?? []
    bucket.push(transaction)
    groups.set(key, bucket)
  }

  const suggestions: BankImportSuggestion[] = []

  for (const [, items] of groups) {
    if (items.length === 0) continue

    const outflows = items.filter((item) => item.amount < 0)
    if (outflows.length === 0) continue

    const bucket = outflows
    const isInflow = false
    const amounts = bucket.map((item) => Math.abs(item.amount))
    const dates = bucket.map((item) => item.date)
    const frequency = detectFrequency(dates)
    if (!['monthly', 'weekly', 'quarterly', 'annual'].includes(frequency)) continue
    if (bucket.length < minimumOccurrencesForFrequency(frequency)) continue

    const sample = bucket[0]!
    const categoryMatch = categorizeDescription(sample.description, isInflow)
    const destination = suggestDestination(categoryMatch.category, frequency, isInflow)
    if (destination === 'ignore') continue

    let confidence = 30 + Math.min(bucket.length, 8) * 6
    confidence += categoryMatch.score
    confidence += amountConsistencyScore(amounts)
    if (frequency === 'monthly' || frequency === 'quarterly' || frequency === 'annual') {
      confidence += 10
    }
    confidence = Math.min(95, Math.max(15, confidence))

    const likelyDueDay = dayOfMonthFromDates(dates)
    const averageAmount = roundCurrency(amounts.reduce((sum, value) => sum + value, 0) / amounts.length)

    if (bucket.length === 1 && averageAmount < 150) {
      continue
    }

    if (!passesMinMonthlyThreshold(averageAmount, frequency, options?.minMonthlyAmount)) {
      continue
    }

    const suggestedName = titleCaseName(
      sample.description.length > 32 ? groupKeyForDescription(sample.description) : sample.description,
    )

    suggestions.push({
      id: newId(),
      suggestedName,
      category: categoryMatch.category,
      amount: roundCurrency(Math.max(...amounts)),
      averageAmount,
      frequency,
      likelyDueDay,
      likelyDueMonth: frequency === 'annual' ? monthIndexFromDates(dates) : undefined,
      confidence,
      reason: buildReason(
        bucket.length,
        frequency,
        categoryDisplayName(categoryMatch.category),
        amounts,
        dates,
        suggestedName,
        likelyDueDay,
      ),
      destination,
      status: 'pending',
      transactionIds: bucket.map((item) => item.id),
      sampleDescriptions: [...new Set(bucket.map((item) => item.description))].slice(0, 3),
      isInflow,
    })
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence || b.averageAmount - a.averageAmount)
}
