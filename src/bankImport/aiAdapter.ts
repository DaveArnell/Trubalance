import type { BankImportAnalysisInput, BankImportAnalysisResult } from './types'
import { mapAiAnalysisToSuggestions } from './mapAiSuggestions'
import { analysisPeriodFromTransactions, prepareCompactLedger } from './prepareForAi'
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

    const ledger = prepareCompactLedger(input.transactions)
    const analysisPeriod = analysisPeriodFromTransactions(input.transactions)

    const analysis = await analyzeBankImportWithAi(
      {
        ledger,
        analysisPeriod,
        scopeLevel: input.scopeLevel,
        scopeId: input.scopeId,
        businessId: input.businessId,
        fileName: options?.fileName,
        minMonthlyAmount: input.minMonthlyAmount,
      },
      { onStatus: options?.onStatus },
    )

    return {
      suggestions: mapAiAnalysisToSuggestions(analysis, {
        sourceAccountId: options?.sourceAccountId,
      }),
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
