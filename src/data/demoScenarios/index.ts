import type { AppState, ViewScope } from '../../types'
import { buildCafeDemoState, cafeDefaultViewScope } from './cafe'
import { buildLeisureGroupDemoState, leisureDefaultViewScope } from './leisureGroup'
import { applyDemoOperatingSnapshot } from './operatingSnapshot'
import { buildTradesDemoState, tradesDefaultViewScope } from './trades'
import { getDemoFrozenDate } from './demoFreeze'

export type DemoScenarioId = 'leisure-group' | 'independent-cafe' | 'building-trades'

export { DEMO_FROZEN_DATE_KEY, getDemoFrozenDate } from './demoFreeze'

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
    historyLabel: '4 years of history',
    historyMonths: 48,
    description:
      'A fictional group with three businesses and five venues — see continuous accrual of payroll and rent, VAT reserves building, and one group Available number.',
    highlights: [
      'Continuous accrual across multiple sites',
      'Reserve planning for VAT & corporation tax',
      'One decision number at group and site level',
      'Expected receipts in the cash outlook',
    ],
    defaultViewScope: leisureDefaultViewScope,
    buildState: buildLeisureGroupDemoState,
  },
  {
    id: 'independent-cafe',
    title: 'Cornerstone Coffee Co.',
    subtitle: 'Two-site independent café',
    businessType: 'Hospitality',
    historyLabel: '3 years of history',
    historyMonths: 36,
    description:
      'A growing café with a high street site and a market stall. Smaller numbers, same Method — monthly costs accruing daily, quarterly VAT reserved, one Available number.',
    highlights: [
      'Daily accrual of rent, payroll & wholesale',
      'VAT and irregular bills in Reserve Planner',
      'One Available number for spending decisions',
      'Expected catering income where realistic',
    ],
    defaultViewScope: cafeDefaultViewScope,
    buildState: buildCafeDemoState,
  },
  {
    id: 'building-trades',
    title: 'Riverside Building Ltd',
    subtitle: 'Sole trade growing into a team',
    businessType: 'Building & trades',
    historyLabel: '3 years of history',
    historyMonths: 36,
    description:
      'A trades business with van costs, materials, CIS and corporation tax building into today’s position. A healthy job pipeline keeps expected receipts realistic.',
    highlights: [
      'Continuous accrual for van, CIS & materials',
      'Corporation tax and irregular costs reserved',
      'One Available number before you quote or hire',
      'Pipeline of expected job receipts',
    ],
    defaultViewScope: tradesDefaultViewScope,
    buildState: buildTradesDemoState,
  },
] as const

export const DEFAULT_DEMO_SCENARIO_ID: DemoScenarioId = 'leisure-group'

export function getDemoScenario(id: string | undefined): DemoScenarioMeta {
  return DEMO_SCENARIOS.find((s) => s.id === id) ?? DEMO_SCENARIOS[0]!
}

export function buildDemoScenarioState(id: string | undefined): {
  meta: DemoScenarioMeta
  state: AppState
} {
  const meta = getDemoScenario(id)
  const state = applyDemoOperatingSnapshot(meta.buildState(), getDemoFrozenDate())
  return { meta, state }
}
