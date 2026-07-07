import type { AppState, Business, ScopeLevel, Venue, ViewScope } from '../types'

export function getBusinessesInGroup(state: AppState, groupId: string): Business[] {
  const grouped = state.businesses.filter((b) => b.groupId === groupId)
  if (grouped.length > 0) return grouped
  if (!state.groups.some((g) => g.id === groupId)) return state.businesses
  return grouped
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

function scopeExistsInState(state: AppState, scope: ViewScope): boolean {
  if (scope.type === 'group') return state.groups.some((group) => group.id === scope.id)
  if (scope.type === 'business') return state.businesses.some((business) => business.id === scope.id)
  return state.venues.some((venue) => venue.id === scope.id)
}

function scopesMatch(a: ViewScope, b: ViewScope): boolean {
  return a.type === b.type && a.id === b.id
}

/**
 * Default sidebar scope — group when multiple businesses, otherwise the top business (or venue).
 */
export function resolveDefaultViewScope(state: AppState, preferred?: ViewScope): ViewScope {
  if (preferred && scopeExistsInState(state, preferred)) return preferred

  const firstGroup = state.groups[0]
  if (firstGroup) {
    const inGroup = state.businesses.filter((business) => business.groupId === firstGroup.id)
    if (inGroup.length > 1) {
      return { type: 'group', id: firstGroup.id }
    }
  }

  if (state.businesses[0]) {
    return { type: 'business', id: state.businesses[0].id }
  }

  if (firstGroup) {
    return { type: 'group', id: firstGroup.id }
  }

  if (state.venues[0]) {
    return { type: 'venue', id: state.venues[0].id }
  }

  return { type: 'business', id: '' }
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

/** Reserve bill scope options limited to the current sidebar view (group / business / venue). */
export function getReserveBillScopeOptionsForView(
  state: AppState,
  businessId: string,
  viewScope: ViewScope,
): ScopeOption[] {
  return getReserveBillScopeOptions(state, businessId).filter((option) =>
    itemMatchesScope(state, viewScope, option.level, option.id),
  )
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
  return getScopePathSegmentsInner(state, scope, 0)
}

function fallbackScopePathSegments(state: AppState, scope: ViewScope): ScopePathSegment[] {
  if (!scope.id) return []
  return [
    {
      level: scope.type,
      id: scope.id,
      label: getScopeLabel(state, scope),
      isActive: true,
    },
  ]
}

function getScopePathSegmentsInner(state: AppState, scope: ViewScope, depth: number): ScopePathSegment[] {
  if (depth > 4) return fallbackScopePathSegments(state, scope)

  const singleBusiness = state.businesses.length <= 1

  if (scope.type === 'group') {
    if (singleBusiness && state.businesses[0]) {
      return [
        {
          level: 'business',
          id: state.businesses[0].id,
          label: state.businesses[0].name,
          isActive: true,
        },
      ]
    }
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
    if (group && !singleBusiness) {
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
    if (segments.length > 0) return segments
    const fallback = resolveDefaultViewScope(state)
    if (scopesMatch(fallback, scope)) return fallbackScopePathSegments(state, scope)
    return getScopePathSegmentsInner(state, fallback, depth + 1)
  }

  const venue = state.venues.find((v) => v.id === scope.id)
  const business = venue ? state.businesses.find((b) => b.id === venue.businessId) : null
  const group = business ? state.groups.find((g) => g.id === business.groupId) : null
  const segments: ScopePathSegment[] = []
  if (group && !singleBusiness) {
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
  if (segments.length > 0) return segments

  const fallback = resolveDefaultViewScope(state)
  if (scopesMatch(fallback, scope)) return fallbackScopePathSegments(state, scope)
  return getScopePathSegmentsInner(state, fallback, depth + 1)
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

export interface ScopePickerOption {
  scope: ViewScope
  label: string
  indent: number
}

/** Flat scope list for the mobile / narrow top-bar picker (mirrors sidebar tree). */
export function getSidebarScopePickerOptions(state: AppState): ScopePickerOption[] {
  const options: ScopePickerOption[] = []
  const groupedBusinessIds = new Set<string>()

  for (const group of state.groups) {
    const businesses = state.businesses.filter((business) => business.groupId === group.id)
    if (businesses.length === 0) continue

    if (businesses.length > 1) {
      options.push({
        scope: { type: 'group', id: group.id },
        label: `${group.name} (whole group)`,
        indent: 0,
      })
    }

    for (const business of businesses) {
      groupedBusinessIds.add(business.id)
      const venues = getVenuesInBusiness(state, business.id)
      const branchIndent = businesses.length > 1 ? 1 : 0

      if (venues.length <= 1) {
        options.push({
          scope: { type: 'business', id: business.id },
          label: business.name,
          indent: branchIndent,
        })
        continue
      }

      options.push({
        scope: { type: 'business', id: business.id },
        label: business.name,
        indent: branchIndent,
      })
      for (const venue of venues) {
        options.push({
          scope: { type: 'venue', id: venue.id },
          label: venue.name,
          indent: branchIndent + 1,
        })
      }
    }
  }

  for (const business of state.businesses.filter((b) => !groupedBusinessIds.has(b.id))) {
    const venues = getVenuesInBusiness(state, business.id)
    if (venues.length <= 1) {
      options.push({
        scope: { type: 'business', id: business.id },
        label: business.name,
        indent: 0,
      })
      continue
    }

    options.push({
      scope: { type: 'business', id: business.id },
      label: business.name,
      indent: 0,
    })
    for (const venue of venues) {
      options.push({
        scope: { type: 'venue', id: venue.id },
        label: venue.name,
        indent: 1,
      })
    }
  }

  return options
}

export function scopePickerValue(scope: ViewScope): string {
  return `${scope.type}:${scope.id}`
}

export function parseScopePickerValue(value: string): ViewScope | null {
  const colon = value.indexOf(':')
  if (colon <= 0) return null
  const type = value.slice(0, colon)
  const id = value.slice(colon + 1)
  if (type !== 'group' && type !== 'business' && type !== 'venue') return null
  if (!id) return null
  return { type, id }
}
