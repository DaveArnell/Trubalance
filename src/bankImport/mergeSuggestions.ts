import type { BankImportSuggestion } from './types'
import { groupKeyForDescription } from './normalize'

function suggestionMergeKey(suggestion: BankImportSuggestion): string {
  const name = suggestion.editedName ?? suggestion.suggestedName
  return `${groupKeyForDescription(name)}|${suggestion.frequency}|${suggestion.isInflow ? 'in' : 'out'}`
}

/** Combine suggestions from multiple account imports — prefer higher confidence. */
export function mergeImportSuggestions(suggestions: BankImportSuggestion[]): BankImportSuggestion[] {
  const merged = new Map<string, BankImportSuggestion>()

  for (const suggestion of suggestions) {
    const key = suggestionMergeKey(suggestion)
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, { ...suggestion })
      continue
    }

    const combinedIds = [...new Set([...existing.transactionIds, ...suggestion.transactionIds])]
    const combinedSamples = [
      ...new Set([...existing.sampleDescriptions, ...suggestion.sampleDescriptions]),
    ].slice(0, 3)

    merged.set(key, {
      ...(suggestion.confidence >= existing.confidence ? suggestion : existing),
      transactionIds: combinedIds,
      sampleDescriptions: combinedSamples,
      confidence: Math.max(existing.confidence, suggestion.confidence),
    })
  }

  return [...merged.values()].sort(
    (a, b) => b.confidence - a.confidence || b.averageAmount - a.averageAmount,
  )
}
