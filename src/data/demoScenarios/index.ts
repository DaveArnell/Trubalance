import type { AppState, ViewScope } from '../../types'
import { buildCafeDemoState, cafeDefaultViewScope } from './cafe'
import { buildLeisureGroupDemoState, leisureDefaultViewScope } from './leisureGroup'
import { applyDemoOperatingSnapshot } from './operatingSnapshot'
import { buildTradesDemoState, tradesDefaultViewScope } from './trades'

export type DemoScenarioId = 'leisure-group' | 'independent-cafe' | 'building-trades'

export interface DemoScenarioMeta {
  id: DemoScenarioId
  title: string
  subtitle: string
  businessType: string
  historyLabel: string
  historyMonths: number
  description: string
  highlights: readonly string[]
  defaultViewScope: ViewScope
  buildState: () => AppState
}

export const DEMO_SCENARIOS: readonly DemoScenarioMeta[] = [
  {
    id: 'leisure-group',
    title: 'Summit Leisure Group',
    subtitle: 'Multi-site leisure operator',
    businessType: 'Leisure & entertainment',
    historyLabel: '3 years of history',
    historyMonths: 36,
    description:
      'A fictional group with three businesses and five venues — payroll, rent, VAT, and reserve planning across sites. Balances kept up to date, bills cleared on schedule.',
    highlights: [
      '5 venues across 3 businesses',
      'Group roll-up with per-site detail',
      'Reserve planner for VAT & corporation tax',
      'Planned costs and expected receipts',
    ],
    defaultViewScope: leisureDefaultViewScope,
    buildState: buildLeisureGroupDemoState,
  },
  {
    id: 'independent-cafe',
    title: 'Cornerstone Coffee Co.',
    subtitle: 'Two-site independent café',
    businessType: 'Hospitality',
    historyLabel: '6 months of history',
    historyMonths: 6,
    description:
      'A growing café with a high street site and a market stall. Smaller numbers, same clarity — rent, payroll, wholesale, and quarterly VAT all tracked.',
    highlights: [
      '2 venues under one business',
      'Seasonal summer uplift in trends',
      'Irregular bills in Reserve Planner',
      'Expected catering income',
    ],
    defaultViewScope: cafeDefaultViewScope,
    buildState: buildCafeDemoState,
  },
  {
    id: 'building-trades',
    title: 'Riverside Building Ltd',
    subtitle: 'Sole trade growing into a team',
    businessType: 'Building & trades',
    historyLabel: '12 months of history',
    historyMonths: 12,
    description:
      'A trades business with van costs, materials, CIS, and corporation tax building up. Healthy pipeline of job payments keeps the cash outlook realistic.',
    highlights: [
      'Single business, straightforward setup',
      'CIS, van lease & materials tracked',
      'Year of upward trend history',
      'Pipeline of expected job income in forecast',
    ],
    defaultViewScope: tradesDefaultViewScope,
    buildState: buildTradesDemoState,
  },
] as const

export const DEFAULT_DEMO_SCENARIO_ID: DemoScenarioId = 'leisure-group'

export function getDemoScenario(id: string | undefined): DemoScenarioMeta {
  return DEMO_SCENARIOS.find((s) => s.id === id) ?? DEMO_SCENARIOS[0]!
}

export function buildDemoScenarioState(id: string | undefined): { meta: DemoScenarioMeta; state: AppState } {
  const meta = getDemoScenario(id)
  const state = applyDemoOperatingSnapshot(meta.buildState())
  return { meta, state }
}
