import type { BankImportAnalysisInput, BankImportAnalysisResult } from './types'
import { enrichAiSuggestionsFromEvidence } from './enrichAiSuggestions'
import { mapAiAnalysisToSuggestions } from './mapAiSuggestions'
import {
  analysisPeriodFromTransactions,
  prepareCompactLedger,
  preparePayeeEvidenceCsv,
} from './prepareForAi'
import { buildRecurringCandidates } from './recurringCandidates'
import { analyzeBankImportWithAi, checkBankImportAiHealth } from '../services/bankImportApi'
import { isSupabaseConfigured } from '../lib/supabase'

export interface BankImportAiAdapter {
  enrichSuggestions(
    input: BankImportAnalysisInput,
    options?: {
      sourceAccountId?: string
      fileName?: string
      onStatus?: (message: string) => void
    },
  ): Promise<BankImportAnalysisResult>
}

export const serverAiBankImportAdapter: BankImportAiAdapter = {
  async enrichSuggestions(input, options) {
    const health = await checkBankImportAiHealth()
    if (!health.ok) {
      return {
        suggestions: [],
        aiConfigured: health.configured,
        aiNotes: health.message,
      }
    }

    const candidates = buildRecurringCandidates(input.transactions, {
      minMonthlyAmount: input.minMonthlyAmount,
      maxCandidates: 100,
    })
    const ledger = prepareCompactLedger(input.transactions)
    const payeeEvidence = preparePayeeEvidenceCsv(candidates)
    const analysisPeriod = analysisPeriodFromTransactions(input.transactions)

    const analysis = await analyzeBankImportWithAi(
      {
        ledger,
        payeeEvidence,
        candidates,
        analysisPeriod,
        scopeLevel: input.scopeLevel,
        scopeId: input.scopeId,
        businessId: input.businessId,
        fileName: options?.fileName,
        minMonthlyAmount: input.minMonthlyAmount,
      },
      { onStatus: options?.onStatus },
    )

    const mapped = mapAiAnalysisToSuggestions(analysis, {
      sourceAccountId: options?.sourceAccountId,
    })
    const suggestions = enrichAiSuggestionsFromEvidence(mapped, candidates, {
      sourceAccountId: options?.sourceAccountId,
      minMonthlyAmount: input.minMonthlyAmount,
    })

    return {
      suggestions,
      confirmNotes: analysis.confirm_notes ?? [],
      aiConfigured: true,
      analysisPeriod: analysis.analysis_period,
      aiNotes: `Analysed ${input.transactions.length} transactions across ${analysis.analysis_period.months_covered} month(s) with the DIY statement prompt. Review before adding.`,
    }
  },
}

let activeAdapter: BankImportAiAdapter = serverAiBankImportAdapter

export function getBankImportAiAdapter(): BankImportAiAdapter {
  return activeAdapter
}

export function setBankImportAiAdapter(adapter: BankImportAiAdapter) {
  activeAdapter = adapter
}

export async function analyzeBankTransactions(
  input: BankImportAnalysisInput,
  options?: {
    sourceAccountId?: string
    fileName?: string
    onStatus?: (message: string) => void
  },
): Promise<BankImportAnalysisResult> {
  if (!isSupabaseConfigured) {
    return {
      suggestions: [],
      aiConfigured: false,
      aiNotes:
        'AI statement analysis needs a signed-in cloud account. Add costs manually, or connect Supabase.',
    }
  }
  return getBankImportAiAdapter().enrichSuggestions(input, options)
}

export async function getBankImportAiStatus() {
  return checkBankImportAiHealth()
}
