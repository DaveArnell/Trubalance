import type { RecurringCandidateForAi } from './recurringCandidates'
import { groupKeyForDescription, normalizeDescription } from './normalize'
import type { BankImportSuggestion } from './types'

function norm(value: string): string {
  return normalizeDescription(value).toLowerCase()
}

function scoreMatch(suggestion: BankImportSuggestion, candidate: RecurringCandidateForAi): number {
  const haystacks = [candidate.bank_payee, ...candidate.sample_descriptions]
    .filter(Boolean)
    .map(norm)

  const needles = [suggestion.bankPayee, suggestion.suggestedName, ...suggestion.sampleDescriptions]
    .filter(Boolean)
    .map((v) => norm(String(v)))

  let best = 0
  for (const needle of needles) {
    if (!needle || needle.length < 3) continue
    for (const hay of haystacks) {
      if (!hay) continue
      if (hay === needle) best = Math.max(best, 100)
      else if (hay.includes(needle) || needle.includes(hay)) best = Math.max(best, 80)
      else if (groupKeyForDescription(hay) === groupKeyForDescription(needle)) {
        best = Math.max(best, 70)
      }
    }
  }

  if (/payroll/i.test(suggestion.suggestedName) && candidate.is_likely_payroll) {
    best = Math.max(best, 95)
  }
  return best
}

function findBestCandidate(
  suggestion: BankImportSuggestion,
  candidates: RecurringCandidateForAi[],
): RecurringCandidateForAi | null {
  let best: RecurringCandidateForAi | null = null
  let bestScore = 0
  for (const candidate of candidates) {
    const score = scoreMatch(suggestion, candidate)
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return bestScore >= 70 ? best : null
}

/**
 * After the DIY tables are mapped, fill due day / amount / due months from
 * deterministic statement evidence when the model left them blank or defaulted to 1.
 */
export function enrichAiSuggestionsFromEvidence(
  suggestions: BankImportSuggestion[],
  candidates: RecurringCandidateForAi[],
): BankImportSuggestion[] {
  if (candidates.length === 0) return suggestions

  const monthly = suggestions.filter((s) => s.reviewSection === 'monthly_accruing')
  const allDaysAreOne =
    monthly.length >= 3 &&
    monthly.every((s) => (s.editedDueDay ?? s.likelyDueDay ?? 1) === 1)

  return suggestions.map((suggestion) => {
    if (
      suggestion.reviewSection !== 'monthly_accruing' &&
      suggestion.reviewSection !== 'reserve_planner'
    ) {
      return suggestion
    }

    const candidate = findBestCandidate(suggestion, candidates)
    if (!candidate) return suggestion

    const next = { ...suggestion }
    const aiDay = suggestion.editedDueDay ?? suggestion.likelyDueDay
    const shouldReplaceDay =
      candidate.suggested_due_day != null &&
      (aiDay == null || aiDay < 1 || aiDay > 31 || (allDaysAreOne && aiDay === 1))

    if (shouldReplaceDay && candidate.suggested_due_day != null) {
      next.likelyDueDay = candidate.suggested_due_day
    }

    const aiAmount = suggestion.editedAmount ?? suggestion.averageAmount
    const evidenceAmount =
      suggestion.reviewSection === 'reserve_planner'
        ? candidate.max_amount >= candidate.typical_amount * 1.5
          ? candidate.max_amount
          : candidate.typical_amount
        : candidate.typical_amount

    // Prefer evidence when AI rounded to whole pounds far from the observed median.
    if (
      evidenceAmount > 0 &&
      (aiAmount <= 0 ||
        (Number.isInteger(aiAmount) && Math.abs(aiAmount - evidenceAmount) / evidenceAmount > 0.08))
    ) {
      next.amount = evidenceAmount
      next.averageAmount = evidenceAmount
    }

    if (
      suggestion.reviewSection === 'reserve_planner' &&
      candidate.payment_months.length > 0 &&
      (!suggestion.dueMonthsLabel ||
        suggestion.dueMonthsLabel === 'Jan, Apr, Jul, Oct' ||
        suggestion.dueMonthsLabel.split(',').length < 1)
    ) {
      // Only override the generic quarterly default when evidence has real months.
      const looksGenericQuarter =
        !suggestion.dueMonthsLabel ||
        /^Jan,\s*Apr,\s*Jul,\s*Oct$/i.test(suggestion.dueMonthsLabel.trim())
      if (looksGenericQuarter && candidate.payment_months.length >= 1) {
        const unique = [...new Set(candidate.payment_months)]
        next.dueMonthsLabel = unique.join(', ')
        const monthNum = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ].indexOf(unique[0]!)
        if (monthNum >= 0) next.likelyDueMonth = monthNum + 1
      }
    }

    return next
  })
}
