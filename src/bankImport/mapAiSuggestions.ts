import { newId } from '../utils/id'
import { toAmount } from '../utils/amounts'
import type { AiAnalysisResult } from './analysisSchema'
import type { BankImportSuggestion, SuggestionCategory } from './types'

function money2(value: number): number {
  return Math.round(toAmount(value) * 100) / 100
}

const MONTH_NAME_TO_NUM: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

function parseMonthToken(raw: number | string): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = Math.round(raw)
    return n >= 1 && n <= 12 ? n : null
  }
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const asNum = Number(trimmed)
  if (Number.isFinite(asNum)) {
    const n = Math.round(asNum)
    return n >= 1 && n <= 12 ? n : null
  }
  return MONTH_NAME_TO_NUM[trimmed.toLowerCase()] ?? null
}

function formatDueMonths(months: Array<number | string>): { label: string; first?: number } {
  const labels: string[] = []
  const nums: number[] = []
  for (const token of months) {
    if (typeof token === 'string' && MONTH_NAME_TO_NUM[token.trim().toLowerCase()] != null) {
      labels.push(token.trim().slice(0, 3).replace(/^./, (c) => c.toUpperCase()))
      const n = parseMonthToken(token)
      if (n) nums.push(n)
      continue
    }
    const n = parseMonthToken(token)
    if (n) {
      nums.push(n)
      labels.push(
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
          n - 1
        ]!,
      )
    }
  }
  const unique = [...new Set(labels)]
  return { label: unique.join(', '), first: nums[0] }
}

function mapCategory(raw: string): SuggestionCategory {
  const lower = (raw || '').toLowerCase()
  if (lower.includes('payroll') || lower.includes('wage')) return 'payroll'
  if (lower.includes('hmrc') || lower.includes('tax') || lower.includes('vat')) return 'hmrc'
  if (lower.includes('rent') || lower.includes('property') || lower.includes('landlord')) return 'rent'
  if (
    lower.includes('util') ||
    lower.includes('gas') ||
    lower.includes('electric') ||
    lower.includes('energy')
  ) {
    return 'utilities'
  }
  if (lower.includes('insur')) return 'insurance'
  if (
    lower.includes('loan') ||
    lower.includes('finance') ||
    lower.includes('barclaycard') ||
    lower.includes('capital')
  ) {
    return 'loan'
  }
  if (lower.includes('subscription') || lower.includes('software')) return 'subscription'
  if (lower.includes('pension')) return 'other'
  return 'supplier'
}

function mapMonthlyFrequency(raw: string): BankImportSuggestion['frequency'] {
  if (raw === 'weekly') return 'weekly'
  if (raw === 'fortnightly') return 'weekly'
  if (raw === 'monthly' || raw === 'variable_monthly') return 'monthly'
  return 'irregular'
}

function mapReserveFrequency(schedule: string): BankImportSuggestion['frequency'] {
  if (schedule === 'quarterly') return 'quarterly'
  if (schedule === 'annual' || schedule === 'specific_months') return 'annual'
  return 'irregular'
}

function defaultStatus(
  confidence: number,
  label?: string,
): BankImportSuggestion['status'] {
  if (label === 'low' || confidence < 55) return 'pending'
  return 'accepted'
}

function confidenceFromLabel(label?: string, confidence?: number): number {
  if (typeof confidence === 'number' && Number.isFinite(confidence)) {
    return Math.min(100, Math.max(0, Math.round(confidence)))
  }
  if (label === 'high') return 85
  if (label === 'medium') return 70
  if (label === 'low') return 40
  return 60
}

export function mapAiAnalysisToSuggestions(
  analysis: AiAnalysisResult,
  options?: { sourceAccountId?: string },
): BankImportSuggestion[] {
  const suggestions: BankImportSuggestion[] = []

  const monthly = [...analysis.monthly_accruing_suggestions].sort((a, b) => {
    const da = a.suggested_due_day ?? 99
    const db = b.suggested_due_day ?? 99
    return da - db
  })

  for (const item of monthly) {
    const amount = money2(item.suggested_monthly_amount)
    const bankPayee = (item.bank_payee || item.supplier_group || '').trim()
    suggestions.push({
      id: newId(),
      suggestedName: item.suggested_name,
      bankPayee: bankPayee || undefined,
      category: mapCategory(item.category || item.suggested_name),
      amount,
      averageAmount: amount,
      frequency: mapMonthlyFrequency(item.frequency),
      likelyDueDay: item.suggested_due_day ?? undefined,
      confidence: confidenceFromLabel(item.confidence_label, item.confidence),
      reason: [item.reasoning_summary, item.amount_method, ...item.warnings]
        .filter(Boolean)
        .join(' '),
      destination: 'building_commitment',
      status: defaultStatus(item.confidence, item.confidence_label),
      transactionIds: [],
      sampleDescriptions: [bankPayee, ...item.evidence.map((e) => e.description)]
        .filter(Boolean)
        .slice(0, 6),
      sourceAccountId: options?.sourceAccountId,
      isInflow: false,
      reviewSection: 'monthly_accruing',
      aiEvidence: item.evidence,
    })
  }

  for (const item of analysis.reserve_planner_suggestions) {
    const paymentAmount = money2(
      item.suggested_annual_amount > 0
        ? item.suggested_annual_amount
        : item.suggested_monthly_reserve > 0
          ? item.suggested_monthly_reserve * 12
          : 0,
    )
    const months = formatDueMonths(item.likely_payment_months ?? [])
    const bankPayee = (item.bank_payee || '').trim()
    suggestions.push({
      id: newId(),
      suggestedName: item.suggested_name,
      bankPayee: bankPayee || undefined,
      category: mapCategory(item.category || item.suggested_name),
      amount: paymentAmount,
      averageAmount: paymentAmount,
      frequency: mapReserveFrequency(item.schedule),
      likelyDueDay: item.likely_due_day ?? undefined,
      likelyDueMonth: months.first,
      dueMonthsLabel: months.label || undefined,
      confidence: confidenceFromLabel(item.confidence_label, item.confidence),
      reason: [
        item.reasoning_summary,
        item.amount_method,
        months.label ? `Due months: ${months.label}` : '',
        ...item.warnings,
      ]
        .filter(Boolean)
        .join(' '),
      destination: 'reserve_bill',
      status: defaultStatus(item.confidence, item.confidence_label),
      transactionIds: [],
      sampleDescriptions: [bankPayee, ...item.evidence.map((e) => e.description)]
        .filter(Boolean)
        .slice(0, 5),
      sourceAccountId: options?.sourceAccountId,
      isInflow: false,
      reviewSection: 'reserve_planner',
      aiEvidence: item.evidence,
    })
  }

  for (const item of analysis.expected_receipt_suggestions) {
    const amount = money2(item.suggested_amount)
    suggestions.push({
      id: newId(),
      suggestedName: item.suggested_name,
      bankPayee: item.supplier_group || undefined,
      category: 'customer_receipt',
      amount,
      averageAmount: amount,
      frequency: 'one_off',
      confidence: confidenceFromLabel(item.confidence_label, item.confidence),
      reason: [item.reasoning_summary, ...item.warnings].filter(Boolean).join(' '),
      destination: 'expected_receipt',
      status: 'pending',
      transactionIds: [],
      sampleDescriptions: item.evidence.map((e) => e.description).slice(0, 5),
      sourceAccountId: options?.sourceAccountId,
      isInflow: true,
      reviewSection: 'expected_receipt',
      aiEvidence: item.evidence,
      expectedReceiptDate: item.expected_date ?? undefined,
    })
  }

  for (const item of analysis.manual_review_items) {
    const payee = (item.supplier_group || '').trim()
    // DIY “Confirm these first” bullets used to be mapped as blank Confirm / £0 rows.
    if (!payee || /^confirm$/i.test(payee)) continue

    const payeeLower = payee.toLowerCase()
    const alreadyCovered = suggestions.some((s) => {
      if (s.reviewSection !== 'monthly_accruing' && s.reviewSection !== 'reserve_planner') {
        return false
      }
      const existing = (s.bankPayee || s.suggestedName || '').trim().toLowerCase()
      if (!payeeLower || !existing) return false
      return existing.includes(payeeLower) || payeeLower.includes(existing)
    })
    if (alreadyCovered) continue

    suggestions.push({
      id: newId(),
      suggestedName: payee,
      bankPayee: payee,
      category: 'other',
      amount: 0,
      averageAmount: 0,
      frequency: 'irregular',
      confidence: 40,
      reason: [item.issue, item.question_for_user].filter(Boolean).join(' '),
      destination: 'ignore',
      status: 'pending',
      transactionIds: [],
      sampleDescriptions: item.evidence.map((e) => e.description).slice(0, 5),
      sourceAccountId: options?.sourceAccountId,
      isInflow: false,
      reviewSection: 'manual_review',
      aiEvidence: item.evidence,
    })
  }

  for (const item of analysis.excluded_patterns) {
    suggestions.push({
      id: newId(),
      suggestedName: item.supplier_group || 'Excluded',
      bankPayee: item.supplier_group || undefined,
      category: 'other',
      amount: 0,
      averageAmount: 0,
      frequency: 'irregular',
      confidence: 0,
      reason: item.reason_excluded,
      destination: 'ignore',
      status: 'ignored',
      transactionIds: [],
      sampleDescriptions: [],
      sourceAccountId: options?.sourceAccountId,
      isInflow: false,
      reviewSection: 'excluded',
    })
  }

  return suggestions
}
