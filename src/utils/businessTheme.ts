import type { CSSProperties } from 'react'
import type { AppState, ViewScope } from '../types'
import { getBusinessesInGroup } from './scope'

/**
 * Distinct business identity colours — spaced around the wheel (one indigo, no similar blues).
 */
export const BUSINESS_ACCENT_COLORS = [
  '#9333ea', // violet
  '#059669', // emerald
  '#ea580c', // orange
  '#db2777', // rose
  '#ca8a04', // amber
  '#0d9488', // teal
  '#4f46e5', // indigo
  '#be123c', // crimson
] as const

const GROUP_ACCENT = '#52525b'
const GROUP_SOFT = 'rgba(82, 82, 91, 0.14)'
const GROUP_BORDER = 'rgba(82, 82, 91, 0.35)'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

export function isValidAccentColor(value: string | undefined | null): value is string {
  return typeof value === 'string' && HEX_COLOR_RE.test(value)
}

export function resolveScopeBusinessId(state: AppState, scope: ViewScope): string | null {
  if (scope.type === 'business') return scope.id
  if (scope.type === 'venue') {
    return state.venues.find((venue) => venue.id === scope.id)?.businessId ?? null
  }
  return null
}

export function getBusinessAccentColor(state: AppState, businessId: string): string {
  const business = state.businesses.find((entry) => entry.id === businessId)
  if (!business) return BUSINESS_ACCENT_COLORS[0]
  if (isValidAccentColor(business.accentColor)) return business.accentColor
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
