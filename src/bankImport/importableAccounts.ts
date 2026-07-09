import type { Account, AppState } from '../types'

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
 * Hides duplicate business-level current accounts when a venue already has one.
 */
export function getImportableAccounts(state: AppState): Account[] {
  const venueCurrentBusinesses = businessIdsWithVenueCurrent(state)

  return state.accounts.filter((account) => {
    if (!account.active) return false
    if (account.type !== 'current' && account.type !== 'savings') return false
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
  return getImportableAccounts(state).some((account) => {
    if (account.businessId === businessId && !account.venueId) return true
    if (!account.venueId) return false
    const venue = state.venues.find((venue) => venue.id === account.venueId)
    return venue?.businessId === businessId
  })
}
