import type { AppState, ScopeLevel } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { toAmount } from '../utils/amounts'

/** Import amounts keep pence (statement figures), not whole-pound rounding. */
function money2(value: number): number {
  return Math.round(toAmount(value) * 100) / 100
}
import { getAccountBusinessId } from '../utils/accounts'
import { getScopeItemLabel } from '../utils/scope'
import { currentPeriod } from '../utils/commitmentCalculations'
import { getImportableAccounts } from './importableAccounts'
import { getReservePlannerIdForScope } from '../utils/reserveCalculations'
import {
  isStatementImportGreen,
  type BankImportApplyResult,
  type BankImportSuggestion,
  type SuggestionDestination,
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

export interface ImportScopeOption {
  scopeLevel: ScopeLevel
  scopeId: string
  label: string
}

/** Shown only when this business has more than one venue or current account. */
export function importAssignmentOptions(
  state: AppState,
  accountId: string,
): ImportScopeOption[] {
  const account = state.accounts.find((item) => item.id === accountId)
  if (!account) return []
  const businessId = getAccountBusinessId(state, account)
  if (!businessId) return []
  const venues = state.venues.filter((venue) => venue.businessId === businessId)
  const currentAccounts = getImportableAccounts(state).filter(
    (item) => getAccountBusinessId(state, item) === businessId,
  )
  if (venues.length < 2 && currentAccounts.length < 2) return []

  const business = state.businesses.find((item) => item.id === businessId)
  const options: ImportScopeOption[] = []
  if (business) {
    options.push({
      scopeLevel: 'business',
      scopeId: business.id,
      label: `${business.name} (whole business)`,
    })
  }
  for (const venue of venues) {
    options.push({
      scopeLevel: 'venue',
      scopeId: venue.id,
      label: getScopeItemLabel(state, 'venue', venue.id),
    })
  }
  return options
}

function scopeForSuggestion(
  state: AppState,
  accountId: string,
  suggestion: BankImportSuggestion,
): { scopeLevel: ScopeLevel; scopeId: string } | null {
  if (suggestion.editedScopeLevel && suggestion.editedScopeId) {
    return { scopeLevel: suggestion.editedScopeLevel, scopeId: suggestion.editedScopeId }
  }
  return scopeForAccount(state, accountId)
}

function effectiveDestination(suggestion: BankImportSuggestion): SuggestionDestination {
  return normalizeDestination(suggestion.editedDestination ?? suggestion.destination)
}

function effectiveName(suggestion: BankImportSuggestion): string {
  return (suggestion.editedName ?? suggestion.suggestedName).trim() || suggestion.suggestedName
}

function effectiveAmount(suggestion: BankImportSuggestion): number {
  return money2(suggestion.editedAmount ?? suggestion.averageAmount)
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
  const fallbackScope = scopeForAccount(state, accountId)
  const result: BankImportApplyResult = {
    commitmentsCreated: 0,
    receiptsCreated: 0,
    reserveBillsCreated: 0,
    ignored: 0,
    errors: [],
  }

  if (!fallbackScope) {
    result.errors.push('Could not determine scope for the selected account.')
    return result
  }

  const accepted = suggestions.filter(
    (item) =>
      isStatementImportGreen(item) &&
      (item.reviewSection === 'monthly_accruing' || item.reviewSection === 'reserve_planner'),
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

    const scope = scopeForSuggestion(state, accountId, suggestion) ?? fallbackScope
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
          dueDayOfMonth: suggestion.editedDueDay ?? suggestion.likelyDueDay ?? 28,
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
