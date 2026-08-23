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

function looksReserve(candidate: RecurringCandidateForAi, minMonthly = 200): boolean {
  if (!looksMonthly(candidate) && candidate.typical_amount >= minMonthly * 5) return true
  return (
    candidate.detected_frequency === 'quarterly' ||
    candidate.detected_frequency === 'annual' ||
    (candidate.months_seen >= 2 &&
      candidate.median_gap_days != null &&
      candidate.median_gap_days >= 70)
  )
}

function coversCandidate(
  rows: BankImportSuggestion[],
  candidate: RecurringCandidateForAi,
): boolean {
  return rows.some((s) => {
    if (s.reviewSection !== 'monthly_accruing' && s.reviewSection !== 'reserve_planner') {
      return false
    }
    const score = Math.max(
      scoreNameToCandidate(s.suggestedName, candidate),
      scoreNameToCandidate(s.bankPayee || '', candidate),
    )
    return score >= 70
  })
}

const TYPE_PREFIX =
  /^(bill payment|direct debit|standing order|counter credit|bank giro credit|faster payment|card payment|debit|credit)\s+/i

function isInflowLabel(value: string): boolean {
  return /^(counter\s+credit|bank giro credit|credit\b)/i.test(value.trim())
}

/** Short Cash Prophet labels for common UK payees — not a specific business. */
function friendlyName(name: string, payee: string): string {
  const blob = `${name} ${payee}`
  if (/payroll|pay grp|wage grp/i.test(blob)) return 'Payroll'
  if (/\bnest\b/i.test(blob)) return 'Pension'
  if (/mailchi/i.test(blob)) return 'Mailchimp'
  if (/hmrc/i.test(blob) && /vat/i.test(blob)) return 'HMRC VAT'
  if (/hmrc/i.test(blob) && /sdds/i.test(blob)) return 'HMRC monthly payment'
  if (/hmrc/i.test(blob) && /shipley/i.test(blob)) return 'HMRC annual payment'
  if (/capital\s+on\s+tap/i.test(blob)) return 'Capital on Tap'
  if (/business\s+rates|\bnndr\b|council\s+rates|\bbc\s+central\b/i.test(blob)) {
    return 'Business rates'
  }
  return name
}

function nameFromPayee(payee: string): string {
  const cleaned = payee
    .replace(TYPE_PREFIX, '')
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

function applyCandidateFacts(
  suggestion: BankImportSuggestion,
  candidate: RecurringCandidateForAi,
): BankImportSuggestion {
  const next: BankImportSuggestion = { ...suggestion }
  const amount = candidate.typical_amount

  if (candidate.suggested_due_day != null) {
    next.likelyDueDay = candidate.suggested_due_day
  }
  if (amount > 0) {
    next.amount = amount
    next.averageAmount = amount
  }
  if (candidate.is_likely_payroll) {
    next.suggestedName = 'Payroll'
    next.bankPayee = 'Payroll'
    next.sampleDescriptions = candidate.sample_descriptions.slice(0, 6)
  } else if (candidate.bank_payee) {
    next.bankPayee = candidate.bank_payee.replace(TYPE_PREFIX, '').trim() || candidate.bank_payee
    next.sampleDescriptions = [
      next.bankPayee,
      ...candidate.sample_descriptions,
    ].slice(0, 6)
    if (TYPE_PREFIX.test(next.suggestedName)) {
      next.suggestedName = nameFromPayee(next.suggestedName)
    }
    next.suggestedName = friendlyName(next.suggestedName, next.bankPayee || candidate.bank_payee)
  }

  if (looksMonthly(candidate) && next.reviewSection === 'reserve_planner') {
    next.reviewSection = 'monthly_accruing'
    next.destination = 'building_commitment'
    next.frequency = 'monthly'
    next.dueMonthsLabel = undefined
  } else if (
    looksReserve(candidate) &&
    !looksMonthly(candidate) &&
    next.reviewSection === 'monthly_accruing'
  ) {
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

function rowFromCandidate(
  candidate: RecurringCandidateForAi,
  section: 'monthly_accruing' | 'reserve_planner',
  options?: { sourceAccountId?: string },
): BankImportSuggestion {
  const name = friendlyName(nameFromPayee(candidate.bank_payee), candidate.bank_payee)
  const stub: BankImportSuggestion = {
    id: newId(),
    suggestedName: name,
    bankPayee: candidate.bank_payee,
    category: candidate.is_likely_hmrc ? 'hmrc' : 'supplier',
    amount: candidate.typical_amount,
    averageAmount: candidate.typical_amount,
    frequency: section === 'monthly_accruing' ? 'monthly' : 'annual',
    likelyDueDay: candidate.suggested_due_day ?? undefined,
    confidence: 60,
    reason: '',
    destination: section === 'monthly_accruing' ? 'building_commitment' : 'reserve_bill',
    status: 'accepted',
    transactionIds: [],
    sampleDescriptions: candidate.sample_descriptions.slice(0, 6),
    sourceAccountId: options?.sourceAccountId,
    isInflow: false,
    reviewSection: section,
  }
  return applyCandidateFacts(stub, candidate)
}

/**
 * Overlay statement days/amounts on the AI draft. Do not invent extra rows
 * from every payee — that dumped income and one-off spend into the tables.
 */
export function enrichAiSuggestionsFromEvidence(
  suggestions: BankImportSuggestion[],
  candidates: RecurringCandidateForAi[],
  options?: { sourceAccountId?: string; minMonthlyAmount?: number },
): BankImportSuggestion[] {
  if (candidates.length === 0) {
    return suggestions.filter(
      (s) =>
        !isInflowLabel(s.suggestedName) &&
        !isInflowLabel(s.bankPayee || ''),
    )
  }

  const junkPayees = junkBankPayees(suggestions)
  const next: BankImportSuggestion[] = []

  for (const suggestion of suggestions) {
    if (
      suggestion.reviewSection !== 'monthly_accruing' &&
      suggestion.reviewSection !== 'reserve_planner'
    ) {
      next.push(suggestion)
      continue
    }

    if (isInflowLabel(suggestion.suggestedName) || isInflowLabel(suggestion.bankPayee || '')) {
      continue
    }

    const candidate = findBestCandidate(suggestion, candidates, junkPayees)
    if (!candidate) {
      const cleanedName = TYPE_PREFIX.test(suggestion.suggestedName)
        ? nameFromPayee(suggestion.suggestedName)
        : suggestion.suggestedName
      const bankPayee =
        (suggestion.bankPayee || '').replace(TYPE_PREFIX, '').trim() || suggestion.bankPayee
      next.push({
        ...suggestion,
        suggestedName: friendlyName(cleanedName, bankPayee || ''),
        bankPayee,
      })
      continue
    }
    if (candidate.is_likely_transfer) continue
    next.push(applyCandidateFacts(suggestion, candidate))
  }

  const minMonthly =
    options?.minMonthlyAmount && options.minMonthlyAmount > 0 ? options.minMonthlyAmount : 200
  const minReserveAnnual = minMonthly * 5

  const payroll = candidates.find((c) => c.is_likely_payroll && c.typical_amount >= minMonthly)
  const hasPayroll = next.some(
    (s) => s.category === 'payroll' || /payroll/i.test(s.suggestedName),
  )
  if (payroll && !hasPayroll) {
    next.push({
      id: newId(),
      suggestedName: 'Payroll',
      bankPayee: 'Payroll',
      category: 'payroll',
      amount: payroll.typical_amount,
      averageAmount: payroll.typical_amount,
      frequency: 'monthly',
      likelyDueDay: payroll.suggested_due_day ?? undefined,
      confidence: 70,
      reason: '',
      destination: 'building_commitment',
      status: 'accepted',
      transactionIds: [],
      sampleDescriptions: payroll.sample_descriptions.slice(0, 6),
      sourceAccountId: options?.sourceAccountId,
      isInflow: false,
      reviewSection: 'monthly_accruing',
    })
  }

  for (const candidate of candidates) {
    if (candidate.is_likely_transfer || candidate.is_likely_payroll) continue
    if (candidate.detected_frequency === 'weekly') continue
    if (coversCandidate(next, candidate)) continue

    const monthlyLike =
      looksMonthly(candidate) &&
      candidate.typical_amount >= minMonthly &&
      (candidate.month_coverage_ratio >= 0.35 || candidate.months_seen >= 4)
    const reserveLike =
      !looksMonthly(candidate) &&
      looksReserve(candidate, minMonthly) &&
      (candidate.typical_amount >= minMonthly * 5 ||
        candidate.typical_amount * Math.max(candidate.payment_months.length, 1) >= minReserveAnnual)

    if (monthlyLike) {
      next.push(rowFromCandidate(candidate, 'monthly_accruing', options))
      continue
    }
    if (reserveLike) {
      next.push(rowFromCandidate(candidate, 'reserve_planner', options))
    }
  }

  const kept = next.filter((s) => {
    const amount = s.editedAmount ?? s.averageAmount
    if (s.reviewSection === 'monthly_accruing') {
      return amount >= minMonthly
    }
    if (s.reviewSection === 'reserve_planner') {
      const monthCount = (s.dueMonthsLabel || '')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean).length
      const annual = amount * Math.max(monthCount, 1)
      return annual >= minReserveAnnual || amount >= minMonthly * 2
    }
    return true
  })

  const listed = kept.filter(
    (s) => s.reviewSection === 'monthly_accruing' || s.reviewSection === 'reserve_planner',
  )
  const withoutPromoted = kept.filter((s) => {
    if (s.reviewSection !== 'excluded' && s.reviewSection !== 'manual_review') return true
    return !candidates.some((candidate) => {
      if (!coversCandidate(listed, candidate)) return false
      return (
        scoreNameToCandidate(s.suggestedName, candidate) >= 70 ||
        scoreNameToCandidate(s.bankPayee || '', candidate) >= 70
      )
    })
  })

  const monthly = withoutPromoted
    .filter((s) => s.reviewSection === 'monthly_accruing')
    .sort((a, b) => (a.likelyDueDay ?? 99) - (b.likelyDueDay ?? 99))
  const rest = withoutPromoted.filter((s) => s.reviewSection !== 'monthly_accruing')
  return [...monthly, ...rest]
}
