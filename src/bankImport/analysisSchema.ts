/** Structured output from server-side AI financial analysis. */

export interface AiEvidenceRow {
  date: string
  description: string
  amount: number
}

export interface AiMonthlyAccruingSuggestion {
  suggested_name: string
  supplier_group: string
  category: string
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'variable_monthly' | 'other'
  suggested_monthly_amount: number
  amount_method: string
  suggested_due_day: number | null
  confidence: number
  confidence_label: 'high' | 'medium' | 'low'
  evidence: AiEvidenceRow[]
  reasoning_summary: string
  warnings: string[]
}

export interface AiReservePlannerSuggestion {
  suggested_name: string
  category: string
  schedule: 'quarterly' | 'annual' | 'specific_months' | 'irregular' | 'unknown'
  suggested_annual_amount: number
  suggested_monthly_reserve: number
  likely_payment_months: number[]
  likely_due_day: number | null
  amount_method: string
  confidence: number
  confidence_label: 'high' | 'medium' | 'low'
  evidence: AiEvidenceRow[]
  reasoning_summary: string
  warnings: string[]
}

export interface AiExpectedReceiptSuggestion {
  suggested_name: string
  supplier_group: string
  suggested_amount: number
  expected_date: string | null
  confidence: number
  confidence_label: 'high' | 'medium' | 'low'
  evidence: AiEvidenceRow[]
  reasoning_summary: string
  warnings: string[]
}

export interface AiManualReviewItem {
  supplier_group: string
  issue: string
  question_for_user: string
  evidence: AiEvidenceRow[]
}

export interface AiExcludedPattern {
  supplier_group: string
  reason_excluded: string
}

export interface AiAnalysisResult {
  analysis_period: {
    start_date: string
    end_date: string
    months_covered: number
  }
  monthly_accruing_suggestions: AiMonthlyAccruingSuggestion[]
  reserve_planner_suggestions: AiReservePlannerSuggestion[]
  expected_receipt_suggestions: AiExpectedReceiptSuggestion[]
  manual_review_items: AiManualReviewItem[]
  excluded_patterns: AiExcludedPattern[]
}

export interface TransactionGroupForAi {
  supplier_group: string
  sample_descriptions: string[]
  transaction_count: number
  total_out: number
  total_in: number
  is_likely_transfer: boolean
  is_likely_payroll: boolean
  is_likely_hmrc: boolean
  transactions: AiEvidenceRow[]
}
