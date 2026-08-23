import { newId } from '../utils/id'
import type { RecurringCandidateForAi } from './recurringCandidates'
import { groupKeyForDescription, normalizeDescription } from './normalize'
import type { BankImportSuggestion } from './types'

function norm(value: string): string {
  return normalizeDescription(value).toLowerCase()
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function scoreNameToCandidate(name: string, candidate: RecurringCandidateForAi): number {
  const needle = norm(name)
  if (!needle || needle.length < 3) return 0

  const haystacks = [candidate.bank_payee, ...candidate.sample_descriptions]
    .filter(Boolean)
    .map(norm)

  let best = 0
  for (const hay of haystacks) {
    if (!hay) continue
    if (hay === needle) best = Math.max(best, 100)
    else if (hay.includes(needle) || needle.includes(hay)) best = Math.max(best, 82)
    else if (groupKeyForDescription(hay) === groupKeyForDescription(needle)) {
      best = Math.max(best, 72)
    }
  }
  return best
}

function junkBankPayees(suggestions: BankImportSuggestion[]): Set<string> {
  const rows = suggestions.filter(
    (s) => s.reviewSection === 'monthly_accruing' || s.reviewSection === 'reserve_planner',
  )
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = norm(row.bankPayee || '')
    if (key.length < 3) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const junk = new Set<string>()
  for (const [key, count] of counts) {
    if (rows.length >= 4 && count / rows.length >= 0.4) junk.add(key)
  }
  return junk
}

function findBestCandidate(
  suggestion: BankImportSuggestion,
  candidates: RecurringCandidateForAi[],
  junkPayees: Set<string>,
): RecurringCandidateForAi | null {
  if (/payroll/i.test(suggestion.suggestedName) || suggestion.category === 'payroll') {
    return candidates.find((c) => c.is_likely_payroll) ?? null
  }

  const name = suggestion.editedName ?? suggestion.suggestedName
  const payee = junkPayees.has(norm(suggestion.bankPayee || ''))
    ? ''
    : suggestion.bankPayee || ''

  let best: RecurringCandidateForAi | null = null
  let bestScore = 0
  for (const candidate of candidates) {
    const score = Math.max(
      scoreNameToCandidate(name, candidate),
      payee ? scoreNameToCandidate(payee, candidate) : 0,
    )
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return bestScore >= 70 ? best : null
}

function monthsLabelFromCandidate(candidate: RecurringCandidateForAi): string {
  const unique = [...new Set(candidate.payment_months)].filter((m) => MONTHS.includes(m))
  unique.sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b))
  if (candidate.detected_frequency === 'quarterly' && unique.length >= 1) {
    const start = MONTHS.indexOf(unique[0]!)
    if (start >= 0) {
      return [0, 3, 6, 9].map((offset) => MONTHS[(start + offset) % 12]!).join(', ')
    }
  }
  return unique.join(', ')
}

function looksMonthly(candidate: RecurringCandidateForAi): boolean {
  return (
    candidate.detected_frequency === 'monthly' ||
    (candidate.month_coverage_ratio >= 0.45 &&
      candidate.median_gap_days != null &&
      candidate.median_gap_days >= 20 &&
      candidate.median_gap_days <= 45)
  )
}

function looksReserve(candidate: RecurringCandidateForAi): boolean {
  return (
    candidate.detected_frequency === 'quarterly' ||
    candidate.detected_frequency === 'annual' ||
    (candidate.months_seen >= 2 &&
      candidate.median_gap_days != null &&
      candidate.median_gap_days >= 70)
  )
}

function nameFromPayee(payee: string): string {
  const cleaned = payee
    .replace(/\b[A-Z0-9]*\d[A-Z0-9]{3,}\b/g, ' ')
    .replace(/[^A-Za-z0-9&./\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return payee.slice(0, 32)
  return cleaned
    .split(' ')
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function alreadyCovered(
  candidate: RecurringCandidateForAi,
  suggestions: BankImportSuggestion[],
): boolean {
  return suggestions.some((s) => {
    if (s.reviewSection !== 'monthly_accruing' && s.reviewSection !== 'reserve_planner') {
      return false
    }
    const score = Math.max(
      scoreNameToCandidate(s.editedName ?? s.suggestedName, candidate),
      s.bankPayee ? scoreNameToCandidate(s.bankPayee, candidate) : 0,
    )
    return score >= 70
  })
}

function applyCandidateFacts(
  suggestion: BankImportSuggestion,
  candidate: RecurringCandidateForAi,
): BankImportSuggestion {
  const next: BankImportSuggestion = { ...suggestion }
  const amount =
    next.reviewSection === 'reserve_planner' && candidate.max_amount >= candidate.typical_amount * 1.5
      ? candidate.max_amount
      : candidate.typical_amount

  if (candidate.suggested_due_day != null) {
    next.likelyDueDay = candidate.suggested_due_day
  }
  if (amount > 0) {
    next.amount = amount
    next.averageAmount = amount
  }
  if (candidate.bank_payee) {
    next.bankPayee = candidate.bank_payee
    next.sampleDescriptions = [
      candidate.bank_payee,
      ...candidate.sample_descriptions,
    ].slice(0, 6)
  }

  if (looksMonthly(candidate) && next.reviewSection === 'reserve_planner') {
    next.reviewSection = 'monthly_accruing'
    next.destination = 'building_commitment'
    next.frequency = 'monthly'
    next.dueMonthsLabel = undefined
  } else if (looksReserve(candidate) && !looksMonthly(candidate) && next.reviewSection === 'monthly_accruing') {
    next.reviewSection = 'reserve_planner'
    next.destination = 'reserve_bill'
    next.frequency = candidate.detected_frequency === 'quarterly' ? 'quarterly' : 'annual'
  }

  if (next.reviewSection === 'reserve_planner') {
    const months = monthsLabelFromCandidate(candidate)
    if (months) {
      next.dueMonthsLabel = months
      const first = months.split(',')[0]?.trim()
      const monthNum = first ? MONTHS.indexOf(first) : -1
      if (monthNum >= 0) next.likelyDueMonth = monthNum + 1
    }
  }

  return next
}

function suggestionFromCandidate(
  candidate: RecurringCandidateForAi,
  options?: { sourceAccountId?: string },
): BankImportSuggestion {
  const reserve = looksReserve(candidate) && !looksMonthly(candidate)
  const months = monthsLabelFromCandidate(candidate)
  const amount =
    reserve && candidate.max_amount >= candidate.typical_amount * 1.5
      ? candidate.max_amount
      : candidate.typical_amount
  const name = candidate.is_likely_payroll ? 'Payroll' : nameFromPayee(candidate.bank_payee)

  return {
    id: newId(),
    suggestedName: name,
    bankPayee: candidate.bank_payee,
    category: candidate.is_likely_payroll
      ? 'payroll'
      : candidate.is_likely_hmrc
        ? 'hmrc'
        : 'supplier',
    amount,
    averageAmount: amount,
    frequency: reserve
      ? candidate.detected_frequency === 'quarterly'
        ? 'quarterly'
        : 'annual'
      : 'monthly',
    likelyDueDay: candidate.suggested_due_day ?? undefined,
    likelyDueMonth: reserve && months ? MONTHS.indexOf(months.split(',')[0]!.trim()) + 1 : undefined,
    dueMonthsLabel: reserve ? months || undefined : undefined,
    confidence: candidate.month_coverage_ratio >= 0.6 ? 70 : 40,
    reason: 'Added from the statement pattern — check the name and keep or ignore.',
    destination: reserve ? 'reserve_bill' : 'building_commitment',
    status: candidate.month_coverage_ratio >= 0.6 ? 'accepted' : 'pending',
    transactionIds: [],
    sampleDescriptions: candidate.sample_descriptions.slice(0, 6),
    sourceAccountId: options?.sourceAccountId,
    isInflow: false,
    reviewSection: reserve ? 'reserve_planner' : 'monthly_accruing',
  }
}

/**
 * The DIY model often invents day 1, a single wage, and a repeated card payee.
 * Overlay real statement facts, then add material payees the draft missed.
 */
export function enrichAiSuggestionsFromEvidence(
  suggestions: BankImportSuggestion[],
  candidates: RecurringCandidateForAi[],
  options?: { sourceAccountId?: string; minMonthlyAmount?: number },
): BankImportSuggestion[] {
  if (candidates.length === 0) return suggestions

  const junkPayees = junkBankPayees(suggestions)
  const used = new Set<string>()
  const next: BankImportSuggestion[] = []

  for (const suggestion of suggestions) {
    if (
      suggestion.reviewSection !== 'monthly_accruing' &&
      suggestion.reviewSection !== 'reserve_planner'
    ) {
      next.push(suggestion)
      continue
    }

    const candidate = findBestCandidate(suggestion, candidates, junkPayees)
    if (!candidate) {
      if (junkPayees.has(norm(suggestion.bankPayee || ''))) {
        next.push({ ...suggestion, bankPayee: undefined })
      } else {
        next.push(suggestion)
      }
      continue
    }
    used.add(candidate.candidate_id)
    next.push(applyCandidateFacts(suggestion, candidate))
  }

  const minMonthly = options?.minMonthlyAmount && options.minMonthlyAmount > 0
    ? options.minMonthlyAmount
    : 200

  for (const candidate of candidates) {
    if (used.has(candidate.candidate_id)) continue
    if (candidate.is_likely_transfer) continue
    if (candidate.detected_frequency === 'weekly' && candidate.typical_amount < minMonthly * 2) {
      continue
    }
    if (candidate.typical_amount < minMonthly && candidate.max_amount < minMonthly * 2) {
      continue
    }
    if (alreadyCovered(candidate, next)) continue
    next.push(suggestionFromCandidate(candidate, options))
  }

  const monthly = next
    .filter((s) => s.reviewSection === 'monthly_accruing')
    .sort((a, b) => (a.likelyDueDay ?? 99) - (b.likelyDueDay ?? 99))
  const rest = next.filter((s) => s.reviewSection !== 'monthly_accruing')
  return [...monthly, ...rest]
}
