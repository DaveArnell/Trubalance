import type { BankImportAnalysisInput, BankImportAnalysisResult } from './types'
import { mapAiAnalysisToSuggestions } from './mapAiSuggestions'
import { analysisPeriodFromTransactions, prepareTransactionGroups } from './prepareForAi'
import { analyzeBankImportWithAi, checkBankImportAiHealth } from '../services/bankImportApi'
import { isSupabaseConfigured } from '../lib/supabase'

export interface BankImportAiAdapter {
  enrichSuggestions(
    input: BankImportAnalysisInput,
    options?: { sourceAccountId?: string; fileName?: string },
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

    const groups = prepareTransactionGroups(input.transactions)
    const analysisPeriod = analysisPeriodFromTransactions(input.transactions)

    const analysis = await analyzeBankImportWithAi({
      groups,
      analysisPeriod,
      scopeLevel: input.scopeLevel,
      scopeId: input.scopeId,
      fileName: options?.fileName,
    })

    return {
      suggestions: mapAiAnalysisToSuggestions(analysis, {
        sourceAccountId: options?.sourceAccountId,
      }),
      aiConfigured: true,
      analysisPeriod: analysis.analysis_period,
      aiNotes: `Analysed ${input.transactions.length} transactions across ${analysis.analysis_period.months_covered} month(s). Review each suggestion before adding.`,
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
  options?: { sourceAccountId?: string; fileName?: string },
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
