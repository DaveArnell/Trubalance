import type { Account, AppState } from '../types'

function accountBusinessId(state: AppState, account: Account): string | undefined {
  if (account.businessId) return account.businessId
  if (!account.venueId) return undefined
  return state.venues.find((venue) => venue.id === account.venueId)?.businessId
}

function businessHasVenues(state: AppState, businessId: string): boolean {
  return state.venues.some((venue) => venue.businessId === businessId)
}

/** Businesses that already have a current account on a venue (not business-level). */
function businessIdsWithVenueCurrent(state: AppState): Set<string> {
  const ids = new Set<string>()
  for (const account of state.accounts) {
    if (!account.active || account.type !== 'current' || !account.venueId) continue
    const venue = state.venues.find((venue) => venue.id === account.venueId)
    if (venue) ids.add(venue.businessId)
  }
  return ids
}

/**
 * Cash accounts that need their own bank statement upload.
 * Single-site businesses only show the business-level account.
 * Multi-site hides duplicate business-level current accounts when a venue already has one.
 */
export function getImportableAccounts(state: AppState): Account[] {
  const venueCurrentBusinesses = businessIdsWithVenueCurrent(state)

  return state.accounts.filter((account) => {
    if (!account.active) return false
    if (account.type !== 'current' && account.type !== 'savings') return false
    if (!account.businessId && !account.venueId) return false

    const businessId = accountBusinessId(state, account)
    if (!businessId) return false

    if (!businessHasVenues(state, businessId)) {
      return Boolean(account.businessId && !account.venueId)
    }

    if (
      !account.venueId &&
      account.businessId &&
      account.type === 'current' &&
      venueCurrentBusinesses.has(account.businessId)
    ) {
      return false
    }

    return true
  })
}

export function businessHasImportableCashAccount(state: AppState, businessId: string): boolean {
  return getImportableAccounts(state).some((account) => accountBusinessId(state, account) === businessId)
}
