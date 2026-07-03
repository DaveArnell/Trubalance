import type { AppState, ScopeLevel } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { roundCurrency, toAmount } from '../utils/amounts'
import { getAccountBusinessId } from '../utils/accounts'
import { MONTHS } from '../utils/format'
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

function monthKeyFromIndex(index: number | undefined): string {
  if (!index || index < 1 || index > 12) return 'Jan'
  return MONTHS[index - 1]!
}

function buildReserveMonthAmounts(suggestion: BankImportSuggestion): Record<string, number> {
  const amount = effectiveAmount(suggestion)
  const month = monthKeyFromIndex(suggestion.likelyDueMonth)
  if (suggestion.frequency === 'annual') {
    return { [month]: amount }
  }
  if (suggestion.frequency === 'quarterly') {
    const start = suggestion.likelyDueMonth ?? 1
    const keys = [0, 3, 6, 9].map((offset) => MONTHS[(start - 1 + offset) % 12]!)
    return Object.fromEntries(keys.map((key) => [key, amount]))
  }
  return { [month]: amount }
}

function findReservePlanner(state: AppState, businessId: string) {
  return state.reservePlanners.find((planner) => planner.businessId === businessId)
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

    const name = effectiveName(suggestion)
    const amount = effectiveAmount(suggestion)
    const note = `From bank import. ${suggestion.reason}`

    try {
      if (destination === 'expected_receipt') {
        actions.addReceipt({
          name,
          amount,
          scopeLevel: scope.scopeLevel,
          scopeId: scope.scopeId,
          notes: note,
          receiptTiming: suggestion.frequency === 'monthly' ? 'accrual' : 'lump',
        })
        result.receiptsCreated++
        continue
      }

      if (destination === 'reserve_bill') {
        const businessId = getAccountBusinessId(state, state.accounts.find((a) => a.id === accountId)!)
        const planner = businessId ? findReservePlanner(state, businessId) : undefined
        if (!planner) {
          actions.addCommitment({
            name,
            schedule: suggestion.frequency === 'annual' ? 'planned' : 'monthly',
            amount,
            dueDayOfMonth: suggestion.likelyDueDay ?? 28,
            plannedDueDate:
              suggestion.frequency === 'annual' && suggestion.likelyDueMonth
                ? `${new Date().getFullYear()}-${String(suggestion.likelyDueMonth).padStart(2, '0')}-${String(suggestion.likelyDueDay ?? 28).padStart(2, '0')}`
                : undefined,
            fundingMethod: suggestion.frequency === 'annual' ? 'accrue_until_due' : undefined,
            scopeLevel: scope.scopeLevel,
            scopeId: scope.scopeId,
            status: 'healthy',
            linkedAccountId: accountId,
            notes: `${note} (no reserve planner — added as commitment)`,
          })
          result.commitmentsCreated++
          continue
        }

        actions.addReserveBill({
          plannerId: planner.id,
          name,
          monthAmounts: buildReserveMonthAmounts(suggestion),
          monthDueDays: suggestion.likelyDueDay
            ? Object.fromEntries(
                Object.keys(buildReserveMonthAmounts(suggestion)).map((month) => [
                  month,
                  suggestion.likelyDueDay!,
                ]),
              )
            : undefined,
          notes: note,
          venueId: scope.scopeLevel === 'venue' ? scope.scopeId : undefined,
        })
        result.reserveBillsCreated++
        continue
      }

      const isPlanned = destination === 'planned_commitment'

      if (isPlanned) {
        const dueMonth = suggestion.likelyDueMonth ?? new Date().getMonth() + 1
        const dueDay = suggestion.likelyDueDay ?? 28
        actions.addCommitment({
          name,
          schedule: 'planned',
          amount,
          plannedDueDate: `${new Date().getFullYear()}-${String(dueMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`,
          fundingMethod: 'accrue_until_due',
          scopeLevel: scope.scopeLevel,
          scopeId: scope.scopeId,
          status: 'healthy',
          linkedAccountId: accountId,
          notes: note,
        })
      } else {
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
      }
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
