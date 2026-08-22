import { newId } from '../utils/id'
import { toAmount } from '../utils/amounts'
import type { AiAnalysisResult } from './analysisSchema'
import type { BankImportSuggestion, SuggestionCategory } from './types'

/** Keep pence — do not round to whole pounds (that produced 20000 / 12000 junk). */
function money2(value: number): number {
  return Math.round(toAmount(value) * 100) / 100
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

/** High / medium drafts start accepted so the user mainly edits or ignores. */
function defaultStatus(confidence: number, label?: string): BankImportSuggestion['status'] {
  if (label === 'low' || confidence < 55) return 'pending'
  return 'accepted'
}

export function mapAiAnalysisToSuggestions(
  analysis: AiAnalysisResult,
  options?: { sourceAccountId?: string },
): BankImportSuggestion[] {
  const suggestions: BankImportSuggestion[] = []

  for (const item of analysis.monthly_accruing_suggestions) {
    const amount = money2(item.suggested_monthly_amount)
    suggestions.push({
      id: newId(),
      suggestedName: item.suggested_name,
      category: mapCategory(item.category || item.suggested_name),
      amount,
      averageAmount: amount,
      frequency: mapMonthlyFrequency(item.frequency),
      likelyDueDay: item.suggested_due_day ?? undefined,
      confidence: Math.min(100, Math.max(0, Math.round(item.confidence))),
      reason: [item.reasoning_summary, item.amount_method, ...item.warnings]
        .filter(Boolean)
        .join(' '),
      destination: 'building_commitment',
      status: defaultStatus(item.confidence, item.confidence_label),
      transactionIds: [],
      sampleDescriptions: [item.supplier_group, ...item.evidence.map((e) => e.description)]
        .filter(Boolean)
        .slice(0, 6),
      sourceAccountId: options?.sourceAccountId,
      isInflow: false,
      reviewSection: 'monthly_accruing',
      aiEvidence: item.evidence,
    })
  }

  for (const item of analysis.reserve_planner_suggestions) {
    // Payment size when due (ChatGPT “Amount” column) — not a monthly provision slice.
    const paymentAmount = money2(
      item.suggested_annual_amount > 0
        ? item.suggested_annual_amount
        : item.suggested_monthly_reserve > 0
          ? item.suggested_monthly_reserve * 12
          : 0,
    )
    const month = item.likely_payment_months[0]
    suggestions.push({
      id: newId(),
      suggestedName: item.suggested_name,
      category: mapCategory(item.category || item.suggested_name),
      amount: paymentAmount,
      averageAmount: paymentAmount,
      frequency: mapReserveFrequency(item.schedule),
      likelyDueDay: item.likely_due_day ?? undefined,
      likelyDueMonth: month,
      confidence: Math.min(100, Math.max(0, Math.round(item.confidence))),
      reason: [
        item.reasoning_summary,
        item.amount_method,
        item.likely_payment_months.length
          ? `Due months: ${item.likely_payment_months.join(', ')}`
          : '',
        ...item.warnings,
      ]
        .filter(Boolean)
        .join(' '),
      destination: 'reserve_bill',
      status: defaultStatus(item.confidence, item.confidence_label),
      transactionIds: [],
      sampleDescriptions: item.evidence.map((e) => e.description).slice(0, 5),
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
      category: 'customer_receipt',
      amount,
      averageAmount: amount,
      frequency: 'one_off',
      confidence: Math.min(100, Math.max(0, Math.round(item.confidence))),
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
    suggestions.push({
      id: newId(),
      suggestedName: item.supplier_group || 'Needs review',
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
