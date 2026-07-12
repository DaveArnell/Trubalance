import type { AppState, ScopeLevel } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { roundCurrency, toAmount } from '../utils/amounts'
import { getAccountBusinessId } from '../utils/accounts'
import { currentPeriod } from '../utils/commitmentCalculations'
import { getReservePlannerIdForScope } from '../utils/reserveCalculations'
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

function viewScopeFromLevel(scopeLevel: ScopeLevel, scopeId: string) {
  if (scopeLevel === 'venue') return { type: 'venue' as const, id: scopeId }
  if (scopeLevel === 'business') return { type: 'business' as const, id: scopeId }
  return { type: 'group' as const, id: scopeId }
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

  const periodKey = currentPeriod()

  for (const suggestion of accepted) {
    if (suggestion.reviewSection === 'excluded' || suggestion.reviewSection === 'manual_review') {
      result.ignored++
      continue
    }

    const destination = effectiveDestination(suggestion)
    if (destination === 'ignore') {
      result.ignored++
      continue
    }

    const name = effectiveName(suggestion)
    const amount = effectiveAmount(suggestion)
    const note = `From bank statement import. ${suggestion.reason}`

    try {
      if (destination === 'expected_receipt' || suggestion.reviewSection === 'expected_receipt') {
        actions.addReceipt({
          name,
          amount,
          expectedDate: suggestion.expectedReceiptDate,
          receiptTiming: 'lump',
          scopeLevel: scope.scopeLevel,
          scopeId: scope.scopeId,
          notes: note,
        })
        result.receiptsCreated++
        continue
      }

      if (destination === 'reserve_bill' || suggestion.reviewSection === 'reserve_planner') {
        const plannerId = getReservePlannerIdForScope(
          state,
          viewScopeFromLevel(scope.scopeLevel, scope.scopeId),
        )
        if (!plannerId) {
          result.errors.push(
            `Could not add "${name}" to Reserve Planner — create a reserve planner for this business first.`,
          )
          continue
        }
        actions.addReserveBill({
          plannerId,
          name,
          monthAmounts: { [periodKey]: amount },
          notes: note,
          venueId: scope.scopeLevel === 'venue' ? scope.scopeId : undefined,
        })
        result.reserveBillsCreated++
        continue
      }

      if (destination === 'building_commitment' || suggestion.reviewSection === 'monthly_accruing') {
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
        continue
      }

      result.ignored++
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
