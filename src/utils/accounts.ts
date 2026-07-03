import type { Account, AppState } from '../types'

export function getAccountBusinessId(state: AppState, account: Account): string | null {
  if (account.businessId) return account.businessId
  if (account.venueId) {
    return state.venues.find((v) => v.id === account.venueId)?.businessId ?? null
  }
  return null
}

export function getAccountGroupId(state: AppState, account: Account): string | null {
  const businessId = getAccountBusinessId(state, account)
  if (!businessId) return null
  return state.businesses.find((b) => b.id === businessId)?.groupId ?? null
}

export function getAccountLocationLabel(state: AppState, account: Account): string {
  if (account.venueId) {
    return state.venues.find((v) => v.id === account.venueId)?.name ?? 'Venue'
  }
  if (account.businessId) {
    const business = state.businesses.find((b) => b.id === account.businessId)
    return business ? `${business.name} savings` : 'Business savings'
  }
  return 'Unknown'
}
