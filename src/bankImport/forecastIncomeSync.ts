import type { AppState } from '../types'
import type { AccountImportResult } from './importCentre'
import { scopeForAccount } from './applySuggestions'
import { calculateDailyTradingEstimate } from './dailyIncome'
import type { BankImportSuggestion, ParsedBankTransaction } from './types'

function businessIdForImportAccount(state: AppState, accountId: string): string | null {
  const scope = scopeForAccount(state, accountId)
  if (!scope) return null
  if (scope.scopeLevel === 'business') return scope.scopeId
  if (scope.scopeLevel === 'venue') {
    return state.venues.find((venue) => venue.id === scope.scopeId)?.businessId ?? null
  }
  return null
}

function transactionIdsFromSuggestions(suggestions: BankImportSuggestion[]): Set<string> {
  const ids = new Set<string>()
  for (const suggestion of suggestions) {
    if (suggestion.destination === 'ignore') continue
    for (const id of suggestion.transactionIds) {
      ids.add(id)
    }
  }
  return ids
}

export function collectTransactionsByBusiness(
  state: AppState,
  importResults: AccountImportResult[],
): Map<string, ParsedBankTransaction[]> {
  const byBusiness = new Map<string, ParsedBankTransaction[]>()

  for (const result of importResults) {
    if (result.skipped) continue
    const businessId = businessIdForImportAccount(state, result.accountId)
    if (!businessId) continue
    const list = byBusiness.get(businessId) ?? []
    list.push(...result.session.transactions)
    byBusiness.set(businessId, list)
  }

  return byBusiness
}

function suggestionsByBusiness(
  state: AppState,
  importResults: AccountImportResult[],
): Map<string, BankImportSuggestion[]> {
  const byBusiness = new Map<string, BankImportSuggestion[]>()

  for (const result of importResults) {
    if (result.skipped) continue
    const businessId = businessIdForImportAccount(state, result.accountId)
    if (!businessId) continue
    const list = byBusiness.get(businessId) ?? []
    list.push(...result.session.suggestions)
    byBusiness.set(businessId, list)
  }

  return byBusiness
}

export function forecastDailyIncomeUpdatesFromImports(
  state: AppState,
  importResults: AccountImportResult[],
): Array<{ businessId: string; forecastDailyIncome: number }> {
  const updates: Array<{ businessId: string; forecastDailyIncome: number }> = []
  const byBusiness = collectTransactionsByBusiness(state, importResults)
  const suggestionsForBusiness = suggestionsByBusiness(state, importResults)

  for (const [businessId, transactions] of byBusiness) {
    const business = state.businesses.find((item) => item.id === businessId)
    if (!business) continue
    if ((business.incomePattern ?? 'steady') !== 'steady') continue

    const excludeIds = transactionIdsFromSuggestions(suggestionsForBusiness.get(businessId) ?? [])
    const estimate = calculateDailyTradingEstimate(transactions, excludeIds)
    if (estimate.averageDailyNetTrading !== 0) {
      updates.push({ businessId, forecastDailyIncome: estimate.averageDailyNetTrading })
    }
  }

  return updates
}
