import type { AppState, ScopeLevel } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { roundCurrency, toAmount } from '../utils/amounts'
import { getAccountBusinessId } from '../utils/accounts'
import type {
  BankImportApplyResult,
  BankImportSuggestion,
  SuggestionDestination,
} from './types'
import { normalizeDestination } from './categorize'

type ApplyActions = Pick<
  AppActions,
  'addCommitment' | 'addReceipt' | 'addReserveBill'
>

export function scopeForAccount(
  state: AppState,
  accountId: string,
): { scopeLevel: ScopeLevel; scopeId: string } | null {
  const account = state.accounts.find((item) => item.id === accountId)
  if (!account) return null

  if (account.venueId) {
    return { scopeLevel: 'venue', scopeId: account.venueId }
  }
  const businessId = getAccountBusinessId(state, account)
  if (businessId) {
    return { scopeLevel: 'business', scopeId: businessId }
  }
  return null
}

function effectiveDestination(suggestion: BankImportSuggestion): SuggestionDestination {
  return normalizeDestination(suggestion.editedDestination ?? suggestion.destination)
}

function effectiveName(suggestion: BankImportSuggestion): string {
  return (suggestion.editedName ?? suggestion.suggestedName).trim() || suggestion.suggestedName
}

function effectiveAmount(suggestion: BankImportSuggestion): number {
  return roundCurrency(suggestion.editedAmount ?? suggestion.averageAmount)
}

export function applyBankImportSuggestions(
  state: AppState,
  accountId: string,
  suggestions: BankImportSuggestion[],
  actions: ApplyActions,
): BankImportApplyResult {
  const scope = scopeForAccount(state, accountId)
  const result: BankImportApplyResult = {
    commitmentsCreated: 0,
    receiptsCreated: 0,
    reserveBillsCreated: 0,
    ignored: 0,
    errors: [],
  }

  if (!scope) {
    result.errors.push('Could not determine scope for the selected account.')
    return result
  }

  const accepted = suggestions.filter(
    (item) => item.status === 'accepted' || item.status === 'edited',
  )

  for (const suggestion of accepted) {
    const destination = effectiveDestination(suggestion)
    if (destination === 'ignore') {
      result.ignored++
      continue
    }

    // Historic statement lines identify regular monthly outgoings only — not due bills or reserve items.
    if (suggestion.frequency !== 'monthly') {
      result.ignored++
      continue
    }

    const name = effectiveName(suggestion)
    const amount = effectiveAmount(suggestion)
    const note = `From bank import (historic pattern). ${suggestion.reason}`

    try {
      actions.addCommitment({
        name,
        schedule: 'monthly',
        amount,
        dueDayOfMonth: suggestion.likelyDueDay ?? 28,
        scopeLevel: scope.scopeLevel,
        scopeId: scope.scopeId,
        status: 'healthy',
        linkedAccountId: accountId,
        notes: note,
      })
      result.commitmentsCreated++
    } catch (error) {
      result.errors.push(
        `Could not create "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  const ignored = suggestions.filter((item) => item.status === 'ignored')
  result.ignored += ignored.length

  return result
}

export function suggestionAmountForInput(suggestion: BankImportSuggestion): string {
  return String(toAmount(suggestion.editedAmount ?? suggestion.averageAmount))
}
