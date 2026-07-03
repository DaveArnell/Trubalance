import type { AppState, Business, ScopeLevel, Venue, ViewScope } from '../types'

export function getBusinessesInGroup(state: AppState, groupId: string): Business[] {
  return state.businesses.filter((b) => b.groupId === groupId)
}

export function getVenuesInBusiness(state: AppState, businessId: string): Venue[] {
  return state.venues.filter((v) => v.businessId === businessId)
}

export function businessHasVenues(state: AppState, businessId: string): boolean {
  return getVenuesInBusiness(state, businessId).length > 0
}

export function getVenuesInGroup(state: AppState, groupId: string): Venue[] {
  const businessIds = getBusinessesInGroup(state, groupId).map((b) => b.id)
  return state.venues.filter((v) => businessIds.includes(v.businessId))
}

export function getVenueIdsForScope(state: AppState, scope: ViewScope): string[] {
  if (scope.type === 'venue') return [scope.id]
  if (scope.type === 'business') return getVenuesInBusiness(state, scope.id).map((v) => v.id)
  return getVenuesInGroup(state, scope.id).map((v) => v.id)
}

export function getBusinessIdsForScope(state: AppState, scope: ViewScope): string[] {
  if (scope.type === 'venue') {
    const venue = state.venues.find((v) => v.id === scope.id)
    return venue ? [venue.businessId] : []
  }
  if (scope.type === 'business') return [scope.id]
  return getBusinessesInGroup(state, scope.id).map((b) => b.id)
}

export function getGroupIdForScope(state: AppState, scope: ViewScope): string | null {
  if (scope.type === 'group') return scope.id
  if (scope.type === 'business') {
    return state.businesses.find((b) => b.id === scope.id)?.groupId ?? null
  }
  const venue = state.venues.find((v) => v.id === scope.id)
  if (!venue) return null
  return state.businesses.find((b) => b.id === venue.businessId)?.groupId ?? null
}

export function itemMatchesExactScope(
  scope: ViewScope,
  itemScopeLevel: ScopeLevel,
  itemScopeId: string,
): boolean {
  return scope.type === itemScopeLevel && scope.id === itemScopeId
}

export function itemMatchesScope(
  state: AppState,
  scope: ViewScope,
  itemScopeLevel: ScopeLevel,
  itemScopeId: string,
): boolean {
  if (!isValidScopeReference(state, itemScopeLevel, itemScopeId)) return false

  if (scope.type === 'group' && scope.id === itemScopeId && itemScopeLevel === 'group') return true
  if (scope.type === 'business' && scope.id === itemScopeId && itemScopeLevel === 'business') return true
  if (scope.type === 'venue' && scope.id === itemScopeId && itemScopeLevel === 'venue') return true

  const venueIds = getVenueIdsForScope(state, scope)
  const businessIds = getBusinessIdsForScope(state, scope)
  const groupId = getGroupIdForScope(state, scope)

  if (itemScopeLevel === 'venue' && venueIds.includes(itemScopeId)) return true
  if (itemScopeLevel === 'business' && businessIds.includes(itemScopeId)) return true
  if (itemScopeLevel === 'group' && groupId === itemScopeId) return true

  return false
}

/** Breakdown table columns: venue cells count only that venue; business cells exclude group-wide items. */
export function itemMatchesColumnScope(
  state: AppState,
  columnScope: ViewScope,
  itemScopeLevel: ScopeLevel,
  itemScopeId: string,
): boolean {
  if (!isValidScopeReference(state, itemScopeLevel, itemScopeId)) return false

  if (columnScope.type === 'venue') {
    return itemScopeLevel === 'venue' && itemScopeId === columnScope.id
  }

  if (columnScope.type === 'business') {
    if (itemScopeLevel === 'group') return false
    if (itemScopeLevel === 'business' && itemScopeId === columnScope.id) return true
    if (itemScopeLevel === 'venue') {
      const venue = state.venues.find((v) => v.id === itemScopeId)
      return venue?.businessId === columnScope.id
    }
    return false
  }

  return itemMatchesScope(state, columnScope, itemScopeLevel, itemScopeId)
}

/** Shared breakdown column: exact business or group scope only — not venues or child businesses. */
export function itemMatchesSharedColumnScope(
  _state: AppState,
  parentScope: ViewScope,
  itemScopeLevel: ScopeLevel,
  itemScopeId: string,
): boolean {
  if (parentScope.type === 'business') {
    return itemScopeLevel === 'business' && itemScopeId === parentScope.id
  }
  if (parentScope.type === 'group') {
    return itemScopeLevel === 'group' && itemScopeId === parentScope.id
  }
  return false
}

export function getScopeLabel(state: AppState, scope: ViewScope): string {
  if (scope.type === 'group') return state.groups.find((g) => g.id === scope.id)?.name ?? 'Group'
  if (scope.type === 'business') return state.businesses.find((b) => b.id === scope.id)?.name ?? 'Business'
  return state.venues.find((v) => v.id === scope.id)?.name ?? 'Venue'
}

export type ScopeOption = { level: ScopeLevel; id: string; label: string }

export function getScopeOptionsForView(state: AppState, viewScope: ViewScope): ScopeOption[] {
  const options: ScopeOption[] = []

  if (viewScope.type === 'group') {
    const group = state.groups.find((g) => g.id === viewScope.id)
    if (group) options.push({ level: 'group', id: group.id, label: group.name })
    for (const business of getBusinessesInGroup(state, viewScope.id)) {
      options.push({ level: 'business', id: business.id, label: business.name })
      for (const venue of getVenuesInBusiness(state, business.id)) {
        options.push({ level: 'venue', id: venue.id, label: venue.name })
      }
    }
    return options
  }

  if (viewScope.type === 'business') {
    const business = state.businesses.find((b) => b.id === viewScope.id)
    if (business) options.push({ level: 'business', id: business.id, label: business.name })
    for (const venue of getVenuesInBusiness(state, viewScope.id)) {
      options.push({ level: 'venue', id: venue.id, label: venue.name })
    }
    return options
  }

  const venue = state.venues.find((v) => v.id === viewScope.id)
  if (venue) options.push({ level: 'venue', id: venue.id, label: venue.name })
  return options
}

/** Commitments (monthly / planned / due) must attach to a business or venue — not a group. */
export function isCommitmentScopeLevel(level: ScopeLevel): boolean {
  return level === 'business' || level === 'venue'
}

export function isCommitmentScopeAllowed(state: AppState, level: ScopeLevel, id: string): boolean {
  return isCommitmentScopeLevel(level) && isValidScopeReference(state, level, id)
}

export function getCommitmentScopeOptionsForView(state: AppState, viewScope: ViewScope): ScopeOption[] {
  return getScopeOptionsForView(state, viewScope).filter((option) => option.level !== 'group')
}

/** Scope picker options for a reserve bill (business-wide or one of its venues). */
export function getReserveBillScopeOptions(state: AppState, businessId: string): ScopeOption[] {
  const business = state.businesses.find((b) => b.id === businessId)
  const options: ScopeOption[] = []
  if (business) {
    options.push({ level: 'business', id: business.id, label: business.name })
  }
  for (const venue of getVenuesInBusiness(state, businessId)) {
    options.push({ level: 'venue', id: venue.id, label: venue.name })
  }
  return options
}

/** Default scope when adding a commitment from the current view (never group-level). */
export function getDefaultCommitmentScope(
  state: AppState,
  viewScope: ViewScope,
): { scopeLevel: ScopeLevel; scopeId: string } {
  if (viewScope.type === 'venue') {
    return { scopeLevel: 'venue', scopeId: viewScope.id }
  }
  if (viewScope.type === 'business') {
    return { scopeLevel: 'business', scopeId: viewScope.id }
  }
  const firstBusiness = getBusinessesInGroup(state, viewScope.id)[0]
  if (firstBusiness) {
    return { scopeLevel: 'business', scopeId: firstBusiness.id }
  }
  const firstVenue = getVenuesInGroup(state, viewScope.id)[0]
  if (firstVenue) {
    return { scopeLevel: 'venue', scopeId: firstVenue.id }
  }
  return { scopeLevel: 'business', scopeId: '' }
}

export function getScopeItemLabel(state: AppState, level: ScopeLevel, id: string): string {
  if (!id) return 'Unassigned'
  if (level === 'group') return state.groups.find((g) => g.id === id)?.name ?? 'Unassigned'
  if (level === 'business') return state.businesses.find((b) => b.id === id)?.name ?? 'Unassigned'
  return state.venues.find((v) => v.id === id)?.name ?? 'Unassigned'
}

export function isValidScopeReference(state: AppState, level: ScopeLevel, id: string): boolean {
  if (!id?.trim()) return false
  if (level === 'group') return state.groups.some((g) => g.id === id)
  if (level === 'business') return state.businesses.some((b) => b.id === id)
  return state.venues.some((v) => v.id === id)
}

export function getScopeBreadcrumb(state: AppState, scope: ViewScope): string {
  return getScopePathSegments(state, scope)
    .map((segment) => segment.label)
    .join(' › ')
}

export interface ScopePathSegment {
  level: ScopeLevel
  id: string
  label: string
  isActive: boolean
}

const SCOPE_LEVEL_LABELS: Record<ScopeLevel, string> = {
  group: 'Group',
  business: 'Business',
  venue: 'Venue',
}

export function getScopeLevelLabel(level: ScopeLevel): string {
  return SCOPE_LEVEL_LABELS[level]
}

/** Structured path for the current sidebar scope (group → business → venue). */
export function getScopePathSegments(state: AppState, scope: ViewScope): ScopePathSegment[] {
  if (scope.type === 'group') {
    return [
      {
        level: 'group',
        id: scope.id,
        label: getScopeLabel(state, scope),
        isActive: true,
      },
    ]
  }

  if (scope.type === 'business') {
    const business = state.businesses.find((b) => b.id === scope.id)
    const group = business ? state.groups.find((g) => g.id === business.groupId) : null
    const segments: ScopePathSegment[] = []
    if (group) {
      segments.push({
        level: 'group',
        id: group.id,
        label: group.name,
        isActive: false,
      })
    }
    if (business) {
      segments.push({
        level: 'business',
        id: business.id,
        label: business.name,
        isActive: true,
      })
    }
    return segments
  }

  const venue = state.venues.find((v) => v.id === scope.id)
  const business = venue ? state.businesses.find((b) => b.id === venue.businessId) : null
  const group = business ? state.groups.find((g) => g.id === business.groupId) : null
  const segments: ScopePathSegment[] = []
  if (group) {
    segments.push({
      level: 'group',
      id: group.id,
      label: group.name,
      isActive: false,
    })
  }
  if (business) {
    segments.push({
      level: 'business',
      id: business.id,
      label: business.name,
      isActive: false,
    })
  }
  if (venue) {
    segments.push({
      level: 'venue',
      id: venue.id,
      label: venue.name,
      isActive: true,
    })
  }
  return segments
}

/** Venue view: only costs assigned to that venue — not parent-business rollups. */
export function filterAccruingRowsForView<T extends { commitment: { scopeLevel: ScopeLevel; scopeId: string } }>(
  rows: T[],
  viewScope: ViewScope,
): T[] {
  if (viewScope.type !== 'venue') return rows
  return rows.filter(
    (row) => row.commitment.scopeLevel === 'venue' && row.commitment.scopeId === viewScope.id,
  )
}
