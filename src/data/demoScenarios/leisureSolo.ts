import type { AppState } from '../../types'
import { buildScenarioSnapshots } from './buildSnapshots'
import {
  daysAheadDateKey,
  demoAccountUpdatedAt,
  todayDateKey,
} from './dateHelpers'

const bizId = 'leisure-solo-biz'

export const leisureDefaultViewScope = { type: 'business' as const, id: bizId }

const LEISURE_SNAPSHOT_SCOPES = [
  { id: bizId, type: 'business' as const, name: 'Harbour Adventures Ltd', baseTrue: 28500, growthPerMonth: 240, annualWobble: 1800 },
]

/** Single-site leisure business — consistent membership and booking income. */
export function buildLeisureSoloDemoState(): AppState {
  const updatedAt = demoAccountUpdatedAt()

  const base: AppState = {
    groups: [],
    businesses: [{ id: bizId, groupId: '', name: 'Harbour Adventures Ltd' }],
    venues: [],
    accounts: [
      { id: 'ls-acc-1', businessId: bizId, name: 'Current Account', type: 'current', balance: 24600, active: true, updatedAt },
      { id: 'ls-acc-2', businessId: bizId, name: 'Savings Account', type: 'savings', balance: 5400, active: true, updatedAt },
      { id: 'ls-acc-3', businessId: bizId, name: 'Reserve Account', type: 'reserve', balance: 6200, active: true, updatedAt },
    ],
    commitments: [
      { id: 'ls-c-1', name: 'Rent', schedule: 'monthly', amount: 4800, dueDayOfMonth: 1, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'ls-c-2', name: 'Payroll', schedule: 'monthly', amount: 9200, dueDayOfMonth: 28, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'ls-c-3', name: 'PAYE / HMRC', schedule: 'monthly', amount: 2100, dueDayOfMonth: 22, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'ls-c-4', name: 'Utilities', schedule: 'monthly', amount: 620, dueDayOfMonth: 10, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'ls-c-5', name: 'Insurance', schedule: 'monthly', amount: 380, dueDayOfMonth: 15, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'ls-c-6', name: 'Card processing fees', schedule: 'monthly', amount: 290, dueDayOfMonth: 5, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      {
        id: 'ls-c-7',
        name: 'Activity equipment',
        schedule: 'planned',
        amount: 4500,
        plannedLabel: 'In 6 weeks',
        plannedDueDate: daysAheadDateKey(42),
        fundingMethod: 'accrue_until_due',
        fundingStartDate: todayDateKey(),
        scopeLevel: 'business',
        scopeId: bizId,
        status: 'healthy',
      },
    ],
    expectedReceipts: [
      { id: 'ls-r-1', name: 'Birthday party deposit', amount: 650, expectedDate: daysAheadDateKey(4), scopeLevel: 'business', scopeId: bizId, received: false },
      { id: 'ls-r-2', name: 'School holiday block', amount: 1800, expectedDate: daysAheadDateKey(18), scopeLevel: 'business', scopeId: bizId, received: false },
    ],
    reservePlanners: [
      {
        id: 'ls-rp-1',
        name: 'Harbour Reserve Plan',
        businessId: bizId,
        reserveAccountId: 'ls-acc-3',
        bufferAmount: 0,
        actualBalance: 6200,
        bills: [
          {
            id: 'ls-rb-1',
            plannerId: 'ls-rp-1',
            name: 'VAT',
            monthAmounts: { Mar: 3800, Jun: 4100, Sep: 3900, Dec: 4200 },
            monthDueDays: { Mar: 7, Jun: 7, Sep: 7, Dec: 7 },
          },
          { id: 'ls-rb-2', plannerId: 'ls-rp-1', name: 'Public liability renewal', monthAmounts: { Sep: 2400 }, monthDueDays: { Sep: 1 } },
          { id: 'ls-rb-3', plannerId: 'ls-rp-1', name: 'Corporation tax', monthAmounts: { Jan: 6800 }, monthDueDays: { Jan: 31 } },
        ],
      },
    ],
    snapshots: [],
    historyRecords: [],
    dayNotes: [],
    workspaceOrigin: 'builtin-demo',
  }

  return {
    ...base,
    snapshots: buildScenarioSnapshots(base, 36, LEISURE_SNAPSHOT_SCOPES),
  }
}
