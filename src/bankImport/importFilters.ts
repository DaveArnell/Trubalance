import type { SuggestionFrequency } from './types'

/** Convert a recurring payment average to an approximate monthly amount for threshold checks. */
export function monthlyEquivalentAmount(averageAmount: number, frequency: SuggestionFrequency): number {
  switch (frequency) {
    case 'weekly':
      return averageAmount * (52 / 12)
    case 'monthly':
      return averageAmount
    case 'quarterly':
      return averageAmount / 3
    case 'annual':
      return averageAmount / 12
    case 'irregular':
    case 'one_off':
    default:
      return averageAmount
  }
}

export function passesMinMonthlyThreshold(
  averageAmount: number,
  frequency: SuggestionFrequency,
  minMonthlyAmount: number | undefined,
): boolean {
  if (!minMonthlyAmount || minMonthlyAmount <= 0) return true
  return monthlyEquivalentAmount(averageAmount, frequency) >= minMonthlyAmount
}
