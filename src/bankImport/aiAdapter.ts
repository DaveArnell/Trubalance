import type { BankImportAnalysisInput, BankImportAnalysisResult } from './types'
import { detectSuggestionsRuleBased } from './detectSuggestions'
import { detectTrendInsights } from './trendInsights'

/**
 * Future AI enrichment hook.
 * Call an external API here to refine names, categories, or confidence — never auto-apply results.
 */
export interface BankImportAiAdapter {
  enrichSuggestions(input: BankImportAnalysisInput): Promise<BankImportAnalysisResult>
}

/** Rule-based analysis only — safe default until an AI adapter is configured. */
export const ruleBasedBankImportAdapter: BankImportAiAdapter = {
  async enrichSuggestions(input) {
    return {
      suggestions: detectSuggestionsRuleBased(input.transactions),
      insights: detectTrendInsights(input.transactions),
      aiNotes: undefined,
    }
  },
}

let activeAdapter: BankImportAiAdapter = ruleBasedBankImportAdapter

export function getBankImportAiAdapter(): BankImportAiAdapter {
  return activeAdapter
}

/** Swap in an API-backed adapter when ready (e.g. from env or admin settings). */
export function setBankImportAiAdapter(adapter: BankImportAiAdapter) {
  activeAdapter = adapter
}

export async function analyzeBankTransactions(
  input: BankImportAnalysisInput,
): Promise<BankImportAnalysisResult> {
  return getBankImportAiAdapter().enrichSuggestions(input)
}
