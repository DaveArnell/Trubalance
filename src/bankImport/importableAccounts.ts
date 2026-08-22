import type { Account, AppState } from '../types'

function accountBusinessId(state: AppState, account: Account): string | undefined {
  if (account.businessId) return account.businessId
  if (!account.venueId) return undefined
  return state.venues.find((venue) => venue.id === account.venueId)?.businessId
}

function businessHasVenues(state: AppState, businessId: string): boolean {
  return state.venues.some((venue) => venue.businessId === businessId)
}

/**
 * Current accounts that need their own bank statement upload.
 * Savings and reserve accounts are excluded — statements belong to operating current accounts.
 * Single-site businesses only show the business-level current account.
 * Multi-site shows venue current accounts only (not an overall business current).
 */
export function getImportableAccounts(state: AppState): Account[] {
  return state.accounts.filter((account) => {
    if (!account.active) return false
    if (account.type !== 'current') return false
    if (!account.businessId && !account.venueId) return false

    const businessId = accountBusinessId(state, account)
    if (!businessId) return false

    if (!businessHasVenues(state, businessId)) {
      return Boolean(account.businessId && !account.venueId)
    }

    // Multi-site: only venue current accounts — not the overall business current.
    return Boolean(account.venueId)
  })
}

export function businessHasImportableCashAccount(state: AppState, businessId: string): boolean {
  return getImportableAccounts(state).some((account) => accountBusinessId(state, account) === businessId)
}
