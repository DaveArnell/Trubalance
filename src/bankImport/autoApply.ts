import type { AppState } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { AUTO_APPLY_MIN_CONFIDENCE } from '../config/setupAutomation'
import { applyBankImportSuggestions } from './applySuggestions'
import { forecastDailyIncomeUpdatesFromImports } from './forecastIncomeSync'
import type { AccountImportResult } from './importCentre'
import type { BankImportApplyResult, BankImportSuggestion } from './types'

export interface AutoApplySummary {
  commitmentsCreated: number
  receiptsCreated: number
  reserveBillsCreated: number
  ignored: number
  accepted: number
  errors: string[]
}

export function autoAcceptSuggestions(suggestions: BankImportSuggestion[]): BankImportSuggestion[] {
  return suggestions.map((suggestion) => {
    if (
      suggestion.destination === 'ignore' ||
      suggestion.isInflow ||
      suggestion.destination === 'expected_receipt'
    ) {
      return { ...suggestion, status: 'ignored' }
    }
    if (suggestion.confidence < AUTO_APPLY_MIN_CONFIDENCE) {
      return { ...suggestion, status: 'ignored' }
    }
    return { ...suggestion, status: 'accepted' }
  })
}

export function summarizeAutoApply(results: BankImportApplyResult[]): Omit<AutoApplySummary, 'accepted'> {
  return results.reduce(
    (summary, result) => ({
      commitmentsCreated: summary.commitmentsCreated + result.commitmentsCreated,
      receiptsCreated: summary.receiptsCreated + result.receiptsCreated,
      reserveBillsCreated: summary.reserveBillsCreated + result.reserveBillsCreated,
      ignored: summary.ignored + result.ignored,
      errors: [...summary.errors, ...result.errors],
    }),
    {
      commitmentsCreated: 0,
      receiptsCreated: 0,
      reserveBillsCreated: 0,
      ignored: 0,
      errors: [] as string[],
    },
  )
}

export function runAutoApplyFromImportResults(
  state: AppState,
  importResults: AccountImportResult[],
  actions: Pick<
    AppActions,
    'addCommitment' | 'addReceipt' | 'addReserveBill' | 'setBusinessForecastDailyIncome'
  >,
): AutoApplySummary {
  const applyResults: BankImportApplyResult[] = []
  let accepted = 0

  for (const result of importResults) {
    if (result.skipped || result.session.suggestions.length === 0) continue
    const prepared = autoAcceptSuggestions(result.session.suggestions)
    accepted += prepared.filter((item) => item.status === 'accepted').length
    applyResults.push(applyBankImportSuggestions(state, result.accountId, prepared, actions))
  }

  for (const update of forecastDailyIncomeUpdatesFromImports(state, importResults)) {
    actions.setBusinessForecastDailyIncome(update.businessId, update.forecastDailyIncome)
  }

  const summary = summarizeAutoApply(applyResults)
  return { ...summary, accepted }
}
