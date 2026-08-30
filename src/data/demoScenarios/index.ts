import type { AppState, ViewScope } from '../../types'
import { buildCafeDemoState, cafeDefaultViewScope } from './cafe'
import { applyDemoOperatingSnapshot } from './operatingSnapshot'
import { alignDemoSnapshotsToLivePosition } from './alignDemoSnapshots'
import { buildLeisureSoloDemoState, leisureDefaultViewScope } from './leisureSolo'
import { buildSalonDemoState, salonDefaultViewScope } from './salon'
import { DEMO_FROZEN_DATE_KEY, getDemoFrozenDate } from './demoFreeze'
import {
  getSimulatedDateKey,
  setReferenceDateOverride,
} from '../../utils/referenceDate'

export type DemoScenarioId = 'independent-leisure' | 'independent-cafe' | 'independent-salon'

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
    id: 'independent-leisure',
    title: 'Harbour Adventures Ltd',
    subtitle: 'Single-site leisure centre',
    businessType: 'Leisure & entertainment',
    historyLabel: '3 years of history',
    historyMonths: 36,
    description:
      'A fictional leisure centre with steady membership and bookings. Monthly costs accruing daily, larger bills reserved for, and one Cash Prophet Balance for the business.',
    highlights: [
      'Daily accrual of rent, payroll and utilities',
      'Reserve planning for VAT and insurance',
      'Cash Prophet Balance you can rely on',
      'Expected bookings in the cash outlook',
    ],
    defaultViewScope: leisureDefaultViewScope,
    buildState: buildLeisureSoloDemoState,
  },
  {
    id: 'independent-cafe',
    title: 'Cornerstone Coffee Co.',
    subtitle: 'Two-site independent café',
    businessType: 'Hospitality',
    historyLabel: '3 years of history',
    historyMonths: 36,
    description:
      'A growing café with a high street site and a market hall. Consistent trade income — monthly costs accruing daily, quarterly VAT reserved, one Cash Prophet Balance.',
    highlights: [
      'Daily accrual of rent, payroll & wholesale',
      'VAT and irregular bills in Reserve Planner',
      'Cash Prophet Balance for everyday confidence',
      'Expected catering income where realistic',
    ],
    defaultViewScope: cafeDefaultViewScope,
    buildState: buildCafeDemoState,
  },
  {
    id: 'independent-salon',
    title: 'Grove Hair Studio',
    subtitle: 'Single-site salon',
    businessType: 'Retail & personal care',
    historyLabel: '3 years of history',
    historyMonths: 36,
    description:
      'A neighbourhood salon with steady appointment income. Simple cost picture, reserves for VAT and rates, and one Cash Prophet Balance for the shop.',
    highlights: [
      'Daily accrual of rent, wages and stock',
      'Reserve planning for VAT and rates',
      'Cash Prophet Balance for a static income business',
      'Expected bookings in the cash outlook',
    ],
    defaultViewScope: salonDefaultViewScope,
    buildState: buildSalonDemoState,
  },
] as const

export const DEFAULT_DEMO_SCENARIO_ID: DemoScenarioId = 'independent-leisure'

export function getDemoScenario(id: string | undefined): DemoScenarioMeta {
  return DEMO_SCENARIOS.find((s) => s.id === id) ?? DEMO_SCENARIOS[0]!
}

export function buildDemoScenarioState(id: string | undefined): {
  meta: DemoScenarioMeta
  state: AppState
} {
  const meta = getDemoScenario(id)
  // Align must use the frozen demo calendar; otherwise accruals use the real clock
  // and Trends history locks to the wrong Cash Prophet Balance.
  const previousOverride = getSimulatedDateKey()
  setReferenceDateOverride(DEMO_FROZEN_DATE_KEY)
  try {
    const operated = applyDemoOperatingSnapshot(meta.buildState(), getDemoFrozenDate())
    const state = alignDemoSnapshotsToLivePosition(operated)
    return { meta, state }
  } finally {
    setReferenceDateOverride(previousOverride)
  }
}
