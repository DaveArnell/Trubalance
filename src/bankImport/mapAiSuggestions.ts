import { newId } from '../utils/id'
import { roundCurrency } from '../utils/amounts'
import type { AiAnalysisResult } from './analysisSchema'
import type { BankImportSuggestion, SuggestionCategory } from './types'

function mapCategory(raw: string): SuggestionCategory {
  const lower = raw.toLowerCase()
  if (lower.includes('payroll') || lower.includes('wage')) return 'payroll'
  if (lower.includes('hmrc') || lower.includes('tax') || lower.includes('vat')) return 'hmrc'
  if (lower.includes('rent')) return 'rent'
  if (lower.includes('util')) return 'utilities'
  if (lower.includes('insur')) return 'insurance'
  if (lower.includes('loan') || lower.includes('finance')) return 'loan'
  if (lower.includes('subscription')) return 'subscription'
  return 'supplier'
}

function mapMonthlyFrequency(
  raw: string,
): BankImportSuggestion['frequency'] {
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

export function mapAiAnalysisToSuggestions(
  analysis: AiAnalysisResult,
  options?: { sourceAccountId?: string },
): BankImportSuggestion[] {
  const suggestions: BankImportSuggestion[] = []

  for (const item of analysis.monthly_accruing_suggestions) {
    suggestions.push({
      id: newId(),
      suggestedName: item.suggested_name,
      category: mapCategory(item.category),
      amount: roundCurrency(item.suggested_monthly_amount),
      averageAmount: roundCurrency(item.suggested_monthly_amount),
      frequency: mapMonthlyFrequency(item.frequency),
      likelyDueDay: item.suggested_due_day ?? undefined,
      confidence: Math.min(100, Math.max(0, Math.round(item.confidence))),
      reason: [item.reasoning_summary, ...item.warnings].filter(Boolean).join(' '),
      destination: 'building_commitment',
      status: 'pending',
      transactionIds: [],
      sampleDescriptions: item.evidence.map((e) => e.description).slice(0, 5),
      sourceAccountId: options?.sourceAccountId,
      isInflow: false,
      reviewSection: 'monthly_accruing',
      aiEvidence: item.evidence,
    })
  }

  for (const item of analysis.reserve_planner_suggestions) {
    const month = item.likely_payment_months[0]
    suggestions.push({
      id: newId(),
      suggestedName: item.suggested_name,
      category: mapCategory(item.category),
      amount: roundCurrency(item.suggested_monthly_reserve || item.suggested_annual_amount / 12),
      averageAmount: roundCurrency(item.suggested_annual_amount),
      frequency: mapReserveFrequency(item.schedule),
      likelyDueDay: item.likely_due_day ?? undefined,
      likelyDueMonth: month,
      confidence: Math.min(100, Math.max(0, Math.round(item.confidence))),
      reason: [item.reasoning_summary, ...item.warnings].filter(Boolean).join(' '),
      destination: 'reserve_bill',
      status: 'pending',
      transactionIds: [],
      sampleDescriptions: item.evidence.map((e) => e.description).slice(0, 5),
      sourceAccountId: options?.sourceAccountId,
      isInflow: false,
      reviewSection: 'reserve_planner',
      aiEvidence: item.evidence,
    })
  }

  for (const item of analysis.expected_receipt_suggestions) {
    suggestions.push({
      id: newId(),
      suggestedName: item.suggested_name,
      category: 'customer_receipt',
      amount: roundCurrency(item.suggested_amount),
      averageAmount: roundCurrency(item.suggested_amount),
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
      suggestedName: item.supplier_group,
      category: 'other',
      amount: 0,
      averageAmount: 0,
      frequency: 'irregular',
      confidence: 40,
      reason: `${item.issue} ${item.question_for_user}`,
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
      suggestedName: item.supplier_group,
      category: 'transfer',
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
