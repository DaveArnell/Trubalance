import type { AppState, ViewScope } from '../types'
import {
  getBusinessesInGroup,
  getGroupIdForScope,
  getScopeLabel,
  getVenuesInBusiness,
} from './scope'

export interface ChartScopeOption {
  key: string
  scope: ViewScope
  label: string
  level: 'group' | 'business' | 'venue'
  indent: number
}

export const CHART_COLORS = [
  '#9333ea',
  '#059669',
  '#ea580c',
  '#db2777',
  '#ca8a04',
  '#0d9488',
  '#4f46e5',
  '#be123c',
  '#64748b',
]

export function scopeKey(scope: ViewScope): string {
  return `${scope.type}:${scope.id}`
}

export type ChartScopeLevel = ChartScopeOption['level']

/** Line weight: group thickest, then business, then venue. */
export function chartStrokeWidthForLevel(level: ChartScopeLevel): number {
  switch (level) {
    case 'group':
      return 3.75
    case 'business':
      return 2.5
    case 'venue':
      return 1.5
  }
}

export function chartDotRadiusForLevel(level: ChartScopeLevel, highlighted: boolean): number {
  const base = level === 'group' ? 4.25 : level === 'business' ? 3.5 : 2.75
  return highlighted ? base + 1.75 : base
}

const SCOPE_LEVEL_DASH: Record<ChartScopeLevel, string | undefined> = {
  group: undefined,
  business: undefined,
  venue: '6 4',
}

const SCOPE_METRIC_DASH = ['', '6 4', '2 6', '10 4 2 4']

/**
 * Dash pattern when multiple series are shown.
 * Venues use a light dash at single-metric; metric+scope combos keep legacy patterns.
 */
export function chartDashArrayForLevel(
  level: ChartScopeLevel,
  multiMetric: boolean,
  multiScope: boolean,
  scopeIdx: number,
): string | undefined {
  if (multiMetric && multiScope) {
    return SCOPE_METRIC_DASH[scopeIdx % SCOPE_METRIC_DASH.length] || undefined
  }
  if (!multiScope) return undefined
  return SCOPE_LEVEL_DASH[level]
}

export function getChartScopeOptions(state: AppState, viewScope: ViewScope): ChartScopeOption[] {
  const options: ChartScopeOption[] = []
  const seen = new Set<string>()

  const add = (scope: ViewScope, indent: number) => {
    const key = scopeKey(scope)
    if (seen.has(key)) return
    seen.add(key)
    options.push({
      key,
      scope,
      label: getScopeLabel(state, scope),
      level: scope.type,
      indent,
    })
  }

  const groupId = getGroupIdForScope(state, viewScope)

  if (viewScope.type === 'group') {
    add(viewScope, 0)
    for (const business of getBusinessesInGroup(state, viewScope.id)) {
      add({ type: 'business', id: business.id }, 1)
      for (const venue of getVenuesInBusiness(state, business.id)) {
        add({ type: 'venue', id: venue.id }, 2)
      }
    }
    return options
  }

  if (viewScope.type === 'business') {
    if (groupId) add({ type: 'group', id: groupId }, 0)
    add(viewScope, 1)
    for (const venue of getVenuesInBusiness(state, viewScope.id)) {
      add({ type: 'venue', id: venue.id }, 2)
    }
    return options
  }

  const venue = state.venues.find((v) => v.id === viewScope.id)
  const business = venue ? state.businesses.find((b) => b.id === venue.businessId) : null
  if (groupId) add({ type: 'group', id: groupId }, 0)
  if (business) add({ type: 'business', id: business.id }, 1)
  add(viewScope, 2)
  return options
}
