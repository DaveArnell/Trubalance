import type { AppState, ViewScope } from '../types'
import { scopeKey } from './chartScopes'
import { getScopeLabel } from './scope'

const REVEAL_FROM_KEY = 'trubalance-data-reveal-from-v1'
const LEGACY_TREND_FROM_KEY = 'trubalance-trends-from-date'

export type RevealFromOverrides = Record<string, string>

export type RevealFromSource = 'own' | 'inherited'

export interface RevealFromContext {
  effectiveDate: string | null
  source: RevealFromSource | null
  inheritedFromLabel: string | null
  hasOwnOverride: boolean
}

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function loadRevealFromOverrides(): RevealFromOverrides {
  try {
    const raw = localStorage.getItem(REVEAL_FROM_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const entries = Object.entries(parsed as Record<string, unknown>).filter(
          (entry): entry is [string, string] =>
            typeof entry[0] === 'string' && typeof entry[1] === 'string' && isValidDateKey(entry[1]),
        )
        if (entries.length > 0) return Object.fromEntries(entries)
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const legacy = localStorage.getItem(LEGACY_TREND_FROM_KEY)
    if (legacy && isValidDateKey(legacy)) {
      return { _default: legacy }
    }
  } catch {
    /* ignore */
  }

  return {}
}

export function saveRevealFromOverrides(overrides: RevealFromOverrides) {
  try {
    if (Object.keys(overrides).length === 0) localStorage.removeItem(REVEAL_FROM_KEY)
    else localStorage.setItem(REVEAL_FROM_KEY, JSON.stringify(overrides))
    localStorage.removeItem(LEGACY_TREND_FROM_KEY)
  } catch {
    /* ignore */
  }
}

function ancestorScopes(state: AppState, viewScope: ViewScope): ViewScope[] {
  const ancestors: ViewScope[] = []

  if (viewScope.type === 'venue') {
    const venue = state.venues.find((v) => v.id === viewScope.id)
    if (!venue) return ancestors
    ancestors.push({ type: 'business', id: venue.businessId })
    const business = state.businesses.find((b) => b.id === venue.businessId)
    if (business) ancestors.push({ type: 'group', id: business.groupId })
    return ancestors
  }

  if (viewScope.type === 'business') {
    const business = state.businesses.find((b) => b.id === viewScope.id)
    if (business) ancestors.push({ type: 'group', id: business.groupId })
  }

  return ancestors
}

export function getEffectiveRevealFromDate(
  overrides: RevealFromOverrides,
  state: AppState,
  viewScope: ViewScope,
): string | null {
  const own = overrides[scopeKey(viewScope)]
  if (own) return own

  for (const ancestor of ancestorScopes(state, viewScope)) {
    const inherited = overrides[scopeKey(ancestor)]
    if (inherited) return inherited
  }

  return overrides._default ?? null
}

export function getRevealFromContext(
  overrides: RevealFromOverrides,
  state: AppState,
  viewScope: ViewScope,
): RevealFromContext {
  const ownKey = scopeKey(viewScope)
  const hasOwnOverride = Boolean(overrides[ownKey])
  const effectiveDate = getEffectiveRevealFromDate(overrides, state, viewScope)

  if (!effectiveDate) {
    return {
      effectiveDate: null,
      source: null,
      inheritedFromLabel: null,
      hasOwnOverride: false,
    }
  }

  if (hasOwnOverride) {
    return {
      effectiveDate,
      source: 'own',
      inheritedFromLabel: null,
      hasOwnOverride: true,
    }
  }

  for (const ancestor of ancestorScopes(state, viewScope)) {
    if (overrides[scopeKey(ancestor)]) {
      return {
        effectiveDate,
        source: 'inherited',
        inheritedFromLabel: getScopeLabel(state, ancestor),
        hasOwnOverride: false,
      }
    }
  }

  if (overrides._default) {
    return {
      effectiveDate,
      source: 'inherited',
      inheritedFromLabel: 'saved preference',
      hasOwnOverride: false,
    }
  }

  return {
    effectiveDate,
    source: 'own',
    inheritedFromLabel: null,
    hasOwnOverride: false,
  }
}

export function setRevealFromForScope(
  overrides: RevealFromOverrides,
  viewScope: ViewScope,
  date: string | null,
): RevealFromOverrides {
  const key = scopeKey(viewScope)
  const next = { ...overrides }
  if (date) next[key] = date
  else delete next[key]
  return next
}
