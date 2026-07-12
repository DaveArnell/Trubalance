import type { ScopeLevel } from '../types'

import type { ImportTrendInsight } from './trendInsights'

export type BankImportColumnKey = 'date' | 'description' | 'moneyIn' | 'moneyOut' | 'balance'

export interface BankImportColumnMapping {
  date: number
  description: number
  moneyIn?: number
  moneyOut?: number
  balance?: number
}

export interface ParsedBankTransaction {
  id: string
  date: string
  description: string
  moneyIn: number
  moneyOut: number
  amount: number
  balance?: number
  normalizedDescription: string
}

export type SuggestionCategory =
  | 'payroll'
  | 'hmrc'
  | 'rent'
  | 'utilities'
  | 'insurance'
  | 'loan'
  | 'subscription'
  | 'supplier'
  | 'customer_receipt'
  | 'transfer'
  | 'other'

export type SuggestionFrequency =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'irregular'
  | 'one_off'

export type SuggestionDestination =
  | 'building_commitment'
  | 'due_commitment'
  | 'planned_commitment'
  | 'reserve_bill'
  | 'expected_receipt'
  | 'ignore'
  /** @deprecated Use building_commitment, due_commitment, or planned_commitment */
  | 'commitment'

export type ImportSuggestionStatus = 'pending' | 'accepted' | 'edited' | 'ignored'

export type BankImportReviewSection =
  | 'monthly_accruing'
  | 'reserve_planner'
  | 'expected_receipt'
  | 'manual_review'
  | 'excluded'

export interface BankImportSuggestion {
  id: string
  suggestedName: string
  category: SuggestionCategory
  amount: number
  averageAmount: number
  frequency: SuggestionFrequency
  likelyDueDay?: number
  likelyDueMonth?: number
  confidence: number
  reason: string
  destination: SuggestionDestination
  status: ImportSuggestionStatus
  transactionIds: string[]
  sampleDescriptions: string[]
  /** Which account this was imported from — used by Import Centre later. */
  sourceAccountId?: string
  editedName?: string
  editedAmount?: number
  editedDestination?: SuggestionDestination
  isInflow: boolean
  /** AI review bucket */
  reviewSection?: BankImportReviewSection
  aiEvidence?: { date: string; description: string; amount: number }[]
  expectedReceiptDate?: string
}

export interface BankImportSession {
  accountId: string
  scopeLevel: ScopeLevel
  scopeId: string
  fileName: string
  rawHeaders: string[]
  rawRows: string[][]
  mapping: BankImportColumnMapping
  transactions: ParsedBankTransaction[]
  suggestions: BankImportSuggestion[]
}

export interface BankImportAnalysisInput {
  transactions: ParsedBankTransaction[]
  scopeLevel: ScopeLevel
  scopeId: string
  /** Ignore recurring suggestions below this approximate monthly amount. */
  minMonthlyAmount?: number
}

export interface BankImportAnalysisResult {
  suggestions: BankImportSuggestion[]
  /** Trend insights only — never auto-applied. */
  insights?: ImportTrendInsight[]
  aiNotes?: string
  aiConfigured?: boolean
  analysisPeriod?: { start_date: string; end_date: string; months_covered: number }
}

export interface BankImportApplyResult {
  commitmentsCreated: number
  receiptsCreated: number
  reserveBillsCreated: number
  ignored: number
  errors: string[]
}
