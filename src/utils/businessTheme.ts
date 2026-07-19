import type { CSSProperties } from 'react'
import type { AppState, ViewScope } from '../types'
import { getBusinessesInGroup } from './scope'

/**
 * Distinct identity colours — spaced around the wheel so businesses and venues
 * can each get a unique default without colliding across the org.
 */
export const BUSINESS_ACCENT_COLORS = [
  '#0f766e', // brand teal
  '#059669', // emerald
  '#0284c7', // sky
  '#ea580c', // orange
  '#db2777', // rose
  '#ca8a04', // amber
  '#4f46e5', // indigo
  '#be123c', // crimson
  '#65a30d', // lime
  '#c026d3', // fuchsia
  '#b45309', // brown-orange
  '#0891b2', // cyan
  '#9333ea', // violet
  '#7c3aed', // purple
  '#dc2626', // red
  '#0d9488', // deep teal
] as const

const GROUP_ACCENT = '#52525b'
const GROUP_SOFT = 'rgba(82, 82, 91, 0.14)'
const GROUP_BORDER = 'rgba(82, 82, 91, 0.35)'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

export function isValidAccentColor(value: string | undefined | null): value is string {
  return typeof value === 'string' && HEX_COLOR_RE.test(value)
}

function normalizeAccent(hex: string): string {
  return hex.toLowerCase()
}

/** Shift a palette colour slightly when the base set is exhausted. */
function variantAccent(hex: string, step: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const shift = ((step % 5) + 1) * 18
  const tweak = (channel: number, direction: number) =>
    Math.max(24, Math.min(220, channel + direction * shift))
  const r = tweak(rgb.r, step % 2 === 0 ? 1 : -1)
  const g = tweak(rgb.g, step % 3 === 0 ? -1 : 1)
  const b = tweak(rgb.b, step % 2 === 0 ? -1 : 1)
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

type AccentEntity = { key: string; explicit?: string }

function listAccentEntities(state: AppState): AccentEntity[] {
  return [
    ...state.businesses.map((business) => ({
      key: `business:${business.id}`,
      explicit: business.accentColor,
    })),
    ...state.venues.map((venue) => ({
      key: `venue:${venue.id}`,
      explicit: venue.accentColor,
    })),
  ]
}

/**
 * Stable unique accent for every business and venue in the org.
 * Explicit colours win when unique; duplicates and missing colours take the next free palette slot.
 */
function buildAccentAssignmentMap(state: AppState): Map<string, string> {
  const map = new Map<string, string>()
  const taken = new Set<string>()
  const entities = listAccentEntities(state)

  for (const entity of entities) {
    if (!isValidAccentColor(entity.explicit)) continue
    const normalized = normalizeAccent(entity.explicit)
    if (taken.has(normalized)) continue
    map.set(entity.key, entity.explicit)
    taken.add(normalized)
  }

  let attempt = 0
  for (const entity of entities) {
    if (map.has(entity.key)) continue
    while (attempt < BUSINESS_ACCENT_COLORS.length * 6) {
      const baseIndex = attempt % BUSINESS_ACCENT_COLORS.length
      const cycle = Math.floor(attempt / BUSINESS_ACCENT_COLORS.length)
      const base = BUSINESS_ACCENT_COLORS[baseIndex]!
      const candidate = cycle === 0 ? base : variantAccent(base, cycle)
      attempt += 1
      const normalized = normalizeAccent(candidate)
      if (taken.has(normalized)) continue
      map.set(entity.key, candidate)
      taken.add(normalized)
      break
    }
  }

  return map
}

/** Colours already used by other businesses/venues (for the colour picker). */
export function getTakenAccentColors(
  state: AppState,
  exclude?: { type: 'business' | 'venue'; id: string },
): Set<string> {
  const map = buildAccentAssignmentMap(state)
  const taken = new Set<string>()
  const excludeKey = exclude ? `${exclude.type}:${exclude.id}` : null
  for (const [key, color] of map) {
    if (excludeKey && key === excludeKey) continue
    taken.add(normalizeAccent(color))
  }
  return taken
}

export function resolveScopeBusinessId(state: AppState, scope: ViewScope): string | null {
  if (scope.type === 'business') return scope.id
  if (scope.type === 'venue') {
    return state.venues.find((venue) => venue.id === scope.id)?.businessId ?? null
  }
  return null
}

export function getVenueAccentColor(state: AppState, venueId: string): string {
  const assigned = buildAccentAssignmentMap(state).get(`venue:${venueId}`)
  if (assigned) return assigned
  return BUSINESS_ACCENT_COLORS[0]!
}

export function getBusinessAccentColor(state: AppState, businessId: string): string {
  const assigned = buildAccentAssignmentMap(state).get(`business:${businessId}`)
  if (assigned) return assigned
  const business = state.businesses.find((entry) => entry.id === businessId)
  if (!business) return BUSINESS_ACCENT_COLORS[0]!
  const siblings = getBusinessesInGroup(state, business.groupId)
  const index = siblings.findIndex((entry) => entry.id === businessId)
  return BUSINESS_ACCENT_COLORS[Math.max(0, index) % BUSINESS_ACCENT_COLORS.length]!
}

export function getGroupAccentColor(state: AppState, groupId: string): string {
  const group = state.groups.find((entry) => entry.id === groupId)
  if (group && isValidAccentColor(group.accentColor)) return group.accentColor
  return GROUP_ACCENT
}

function scopeAccentTokens(accent: string): CSSProperties {
  return {
    '--scope-accent': accent,
    '--scope-accent-soft': softenAccentColor(accent, 0.24),
    '--scope-accent-border': softenAccentColor(accent, 0.45),
    '--scope-accent-wash': softenAccentColor(accent, 0.06),
  } as CSSProperties
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return null
  const value = Number.parseInt(normalized, 16)
  if (Number.isNaN(value)) return null
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

export function softenAccentColor(hex: string, alpha = 0.22): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return `color-mix(in srgb, ${hex} 22%, transparent)`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

export function scopeThemeStyle(state: AppState, scope: ViewScope): CSSProperties {
  if (scope.type === 'group') {
    const accent = getGroupAccentColor(state, scope.id)
    if (accent === GROUP_ACCENT) {
      return {
        '--scope-accent': GROUP_ACCENT,
        '--scope-accent-soft': GROUP_SOFT,
        '--scope-accent-border': GROUP_BORDER,
        '--scope-accent-wash': 'rgba(82, 82, 91, 0.06)',
      } as CSSProperties
    }
    return scopeAccentTokens(accent)
  }

  if (scope.type === 'venue') {
    return scopeAccentTokens(getVenueAccentColor(state, scope.id))
  }

  const businessId = resolveScopeBusinessId(state, scope)
  if (!businessId) {
    return {
      '--scope-accent': GROUP_ACCENT,
      '--scope-accent-soft': GROUP_SOFT,
      '--scope-accent-border': GROUP_BORDER,
      '--scope-accent-wash': 'rgba(82, 82, 91, 0.06)',
    } as CSSProperties
  }

  return scopeAccentTokens(getBusinessAccentColor(state, businessId))
}

export function scopeThemeBusinessId(state: AppState, scope: ViewScope): string | null {
  return resolveScopeBusinessId(state, scope)
}

export function businessAccentForScope(state: AppState, scope: ViewScope): string | null {
  if (scope.type === 'group') return null
  const businessId = resolveScopeBusinessId(state, scope)
  if (!businessId) return null
  return getBusinessAccentColor(state, businessId)
}

/** Chart line / swatch colour for a scope (group, business, or venue). */
export function chartColorForScope(state: AppState, scope: ViewScope, fallbackIndex = 0): string {
  if (scope.type === 'group') {
    return getGroupAccentColor(state, scope.id)
  }
  if (scope.type === 'business') {
    return getBusinessAccentColor(state, scope.id)
  }
  const venue = state.venues.find((entry) => entry.id === scope.id)
  if (venue) {
    return getVenueAccentColor(state, venue.id)
  }
  return BUSINESS_ACCENT_COLORS[Math.max(0, fallbackIndex) % BUSINESS_ACCENT_COLORS.length]!
}
