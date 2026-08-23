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

function candidateBlob(candidate: RecurringCandidateForAi): string {
  return `${candidate.bank_payee} ${candidate.sample_descriptions.join(' ')}`
}

function looksRatesPayee(candidate: RecurringCandidateForAi): boolean {
  return /business\s+rates|\bnndr\b|council\s+rates|\bbc\s+central\b/i.test(candidateBlob(candidate))
}

function looksMonthly(candidate: RecurringCandidateForAi): boolean {
  if (looksRatesPayee(candidate) && candidate.months_seen >= 3) return true
  if (candidate.detected_frequency === 'weekly') return false
  if (candidate.detected_frequency === 'quarterly' || candidate.detected_frequency === 'annual') {
    return false
  }
  if (candidate.detected_frequency === 'monthly') {
    const need = Math.min(4, Math.max(2, candidate.months_covered - 1))
    return candidate.month_coverage_ratio >= 0.4 || candidate.months_seen >= need
  }
  return (
    candidate.month_coverage_ratio >= 0.4 &&
    candidate.median_gap_days != null &&
    candidate.median_gap_days >= 25 &&
    candidate.median_gap_days <= 40 &&
    candidate.months_seen >= Math.min(4, candidate.months_covered)
  )
}

function looksReservePattern(candidate: RecurringCandidateForAi): boolean {
  return (
    candidate.detected_frequency === 'quarterly' ||
    candidate.detected_frequency === 'annual' ||
    (candidate.months_seen >= 2 &&
      candidate.median_gap_days != null &&
      candidate.median_gap_days >= 70)
  )
}

function looksReserve(candidate: RecurringCandidateForAi, minMonthly = 200): boolean {
  if (looksRatesPayee(candidate) && candidate.months_seen >= 3) return false
  if (looksReservePattern(candidate)) return true
  return !looksMonthly(candidate) && candidate.typical_amount >= minMonthly * 5
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

/** Short labels only when the bank payee itself makes the purpose obvious. */
function friendlyName(name: string, payee: string): string {
  const evidence = payee || name
  if (/payroll|pay grp|wage grp/i.test(evidence)) return 'Payroll'
  if (/\bnest\b/i.test(evidence)) return 'Pension'
  if (/mailchi/i.test(evidence)) return 'Mailchimp'
  if (/hmrc/i.test(evidence) && /vat/i.test(evidence)) return 'HMRC VAT'
  if (/hmrc/i.test(evidence) && /sdds/i.test(evidence)) return 'HMRC monthly payment'
  if (/hmrc/i.test(evidence) && /shipley/i.test(evidence)) return 'HMRC annual payment'
  if (/capital\s+on\s+tap/i.test(evidence)) return 'Capital on Tap'
  if (/business\s+rates|\bnndr\b|council\s+rates|\bbc\s+central\b/i.test(evidence)) {
    return 'Business rates'
  }
  if (/hmrc/i.test(name) && payee && !/hmrc/i.test(payee)) {
    return nameFromPayee(payee)
  }
  if (/payroll/i.test(name) && payee && !/payroll|pay grp|wage grp/i.test(payee)) {
    return nameFromPayee(payee)
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
    next.suggestedName = friendlyName(
      nameFromPayee(next.bankPayee || candidate.bank_payee),
      next.bankPayee || candidate.bank_payee,
    )
  }

  const rates = looksRatesPayee(candidate)
  if ((looksMonthly(candidate) || (rates && candidate.months_seen >= 3)) && next.reviewSection === 'reserve_planner') {
    next.reviewSection = 'monthly_accruing'
    next.destination = 'building_commitment'
    next.frequency = 'monthly'
    next.dueMonthsLabel = undefined
  } else if (
    !rates &&
    looksReserve(candidate) &&
    !looksMonthly(candidate) &&
    next.reviewSection === 'monthly_accruing'
  ) {
    next.reviewSection = 'reserve_planner'
    next.destination = 'reserve_bill'
    next.frequency = candidate.detected_frequency === 'quarterly' ? 'quarterly' : 'annual'
  }

  if (candidate.is_likely_payroll) {
    next.confidence = Math.max(next.confidence, 85)
  }

  if (next.reviewSection === 'reserve_planner') {
    const months = collapseSparseReserveMonths(candidate, monthsLabelFromCandidate(candidate))
    if (months) {
      next.dueMonthsLabel = months
      const first = months.split(',')[0]?.trim()
      const monthNum = first ? MONTHS.indexOf(first) : -1
      if (monthNum >= 0) next.likelyDueMonth = monthNum + 1
    }
  }

  return next
}

function collapseSparseReserveMonths(
  candidate: RecurringCandidateForAi,
  label: string,
): string {
  const unique = label
    .split(',')
    .map((part) => part.trim())
    .filter((month) => MONTHS.includes(month))
  if (unique.length !== 2) return label
  const start = MONTHS.indexOf(unique[0]!)
  const end = MONTHS.indexOf(unique[1]!)
  const gap = Math.min(Math.abs(end - start), 12 - Math.abs(end - start))
  if (gap >= 5 && gap <= 7) return unique.join(', ')
  const top = [...candidate.recent_transactions].sort(
    (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
  )[0]
  if (!top?.date) return unique[unique.length - 1]!
  return MONTHS[Number(top.date.slice(5, 7)) - 1] ?? unique[unique.length - 1]!
}

function dueMonthCount(suggestion: BankImportSuggestion): number {
  return (suggestion.dueMonthsLabel || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean).length
}

function keepReliableReserve(suggestion: BankImportSuggestion, minMonthly: number): boolean {
  const blob = `${suggestion.suggestedName} ${suggestion.bankPayee || ''}`
  if (/\bdividend/i.test(blob)) return false
  if (/bills\s+acc|\bacc\s+ft\b/i.test(blob)) return false
  if (/hmrc|\bvat\b/i.test(blob)) return true
  const months = dueMonthCount(suggestion)
  const amount = suggestion.editedAmount ?? suggestion.averageAmount
  if (suggestion.confidence >= 80) return true
  if (months >= 3 && amount >= minMonthly * 2) return true
  if (months === 2 && amount >= minMonthly * 5) return true
  return (
    months <= 1 &&
    amount >= minMonthly * 5 &&
    /insur|licence|license|\bsuite\b|software|\bbroker\b/i.test(blob)
  )
}

function dedupeSimilarReserve(rows: BankImportSuggestion[]): BankImportSuggestion[] {
  const kept: BankImportSuggestion[] = []
  for (const row of rows) {
    const index = kept.findIndex((existing) => {
      const score = Math.max(
        scoreNameToCandidate(row.suggestedName, {
          bank_payee: existing.suggestedName,
          sample_descriptions: [existing.bankPayee || ''],
        } as RecurringCandidateForAi),
        scoreNameToCandidate(existing.suggestedName, {
          bank_payee: row.suggestedName,
          sample_descriptions: [row.bankPayee || ''],
        } as RecurringCandidateForAi),
      )
      return score >= 72
    })
    if (index < 0) {
      kept.push(row)
      continue
    }
    const other = kept[index]!
    const rowMonths = dueMonthCount(row)
    const otherMonths = dueMonthCount(other)
    kept[index] =
      rowMonths > otherMonths ||
      (rowMonths === otherMonths && (row.averageAmount || 0) > (other.averageAmount || 0))
        ? row
        : other
  }
  return kept
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
    if (/bcard\d+/i.test(suggestion.suggestedName) || /bcard\d+/i.test(suggestion.bankPayee || '')) {
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
      confidence: 85,
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
      (candidate.month_coverage_ratio >= 0.4 ||
        candidate.months_seen >= Math.min(4, candidate.months_covered))
    const reserveLike =
      !looksMonthly(candidate) &&
      looksReservePattern(candidate) &&
      (candidate.typical_amount >= minMonthly * 5 ||
        candidate.typical_amount * Math.max(candidate.payment_months.length, 1) >= minReserveAnnual)

    if (monthlyLike) {
      next.push(rowFromCandidate(candidate, 'monthly_accruing', options))
      continue
    }
    if (reserveLike || (candidate.is_likely_hmrc && !looksMonthly(candidate))) {
      next.push(rowFromCandidate(candidate, 'reserve_planner', options))
    }
  }

  const kept = next.filter((s) => {
    const blob = `${s.suggestedName} ${s.bankPayee || ''}`
    if (/\bdividend/i.test(blob)) return false
    const amount = s.editedAmount ?? s.averageAmount
    if (s.reviewSection === 'monthly_accruing') {
      return amount >= minMonthly
    }
    if (s.reviewSection === 'reserve_planner') {
      return keepReliableReserve(s, minMonthly)
    }
    return true
  })

  const monthly = kept
    .filter((s) => s.reviewSection === 'monthly_accruing')
    .sort((a, b) => (a.likelyDueDay ?? 99) - (b.likelyDueDay ?? 99))
  const reserve = dedupeSimilarReserve(
    kept.filter((s) => s.reviewSection === 'reserve_planner'),
  ).sort((a, b) => {
    const light = (b.confidence >= 80 ? 1 : 0) - (a.confidence >= 80 ? 1 : 0)
    if (light !== 0) return light
    return (b.averageAmount || 0) - (a.averageAmount || 0)
  })
  return [...monthly, ...reserve]
}
