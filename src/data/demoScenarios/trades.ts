import type { AppState } from '../../types'
import { buildScenarioSnapshots } from './buildSnapshots'
import { buildTradesBusinessHub } from './demoBusinessHub'
import {
  daysAheadDateKey,
  daysAgoDateKey,
  demoAccountUpdatedAt,
  todayDateKey,
} from './dateHelpers'

const bizId = 'trades-biz'

export const tradesDefaultViewScope = { type: 'business' as const, id: bizId }

const TRADES_SNAPSHOT_SCOPES = [
  { id: bizId, type: 'business' as const, name: 'Riverside Building Ltd', baseTrue: 18000, growthPerMonth: 2200 },
]

/** Growing building trades business — 12 months of history. */
export function buildTradesDemoState(): AppState {
  const updatedAt = demoAccountUpdatedAt()
  const hub = buildTradesBusinessHub()

  const base: AppState = {
    groups: [],
    businesses: [{ id: bizId, groupId: '', name: 'Riverside Building Ltd', incomePattern: 'lumpy' }],
    venues: [],
    accounts: [
      { id: 'trades-acc-1', businessId: bizId, name: 'Current Account', type: 'current', balance: 34200, active: true, updatedAt },
      { id: 'trades-acc-2', businessId: bizId, name: 'Savings Account', type: 'savings', balance: 8600, active: true, updatedAt },
      { id: 'trades-acc-3', businessId: bizId, name: 'Reserve Account', type: 'reserve', balance: 5200, active: true, updatedAt },
    ],
    commitments: [
      { id: 'trades-c-1', name: 'Van lease', schedule: 'monthly', amount: 890, dueDayOfMonth: 8, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'trades-c-2', name: 'Materials supplier', schedule: 'monthly', amount: 2400, dueDayOfMonth: 18, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'trades-c-3', name: 'Subcontractor retainer', schedule: 'monthly', amount: 1800, dueDayOfMonth: 25, scopeLevel: 'business', scopeId: bizId, status: 'warning' },
      { id: 'trades-c-4', name: 'Payroll', schedule: 'monthly', amount: 6200, dueDayOfMonth: 28, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'trades-c-5', name: 'CIS / PAYE', schedule: 'monthly', amount: 1450, dueDayOfMonth: 22, scopeLevel: 'business', scopeId: bizId, status: 'warning' },
      { id: 'trades-c-6', name: 'Tool insurance', schedule: 'monthly', amount: 156, dueDayOfMonth: 15, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      {
        id: 'trades-c-7',
        name: 'Replacement van',
        schedule: 'planned',
        amount: 22000,
        plannedLabel: 'In 3 months',
        plannedDueDate: daysAheadDateKey(90),
        fundingMethod: 'accrue_until_due',
        fundingStartDate: todayDateKey(),
        scopeLevel: 'business',
        scopeId: bizId,
        status: 'warning',
      },
    ],
    expectedReceipts: [
      { id: 'trades-r-1', name: 'Office fit-out — stage 2', amount: 8500, expectedDate: daysAheadDateKey(14), scopeLevel: 'business', scopeId: bizId, received: false },
      { id: 'trades-r-2', name: 'Kitchen refit — final payment', amount: 1850, expectedDate: daysAheadDateKey(3), scopeLevel: 'business', scopeId: bizId, received: false },
      { id: 'trades-r-3', name: 'Warehouse conversion — deposit', amount: 12000, expectedDate: daysAheadDateKey(21), scopeLevel: 'business', scopeId: bizId, received: false },
      { id: 'trades-r-4', name: 'Bathroom refurb — balance', amount: 3200, expectedDate: daysAheadDateKey(7), scopeLevel: 'business', scopeId: bizId, received: false },
      {
        id: 'trades-r-5',
        name: 'Extension project — interim',
        amount: 14500,
        expectedDate: daysAheadDateKey(38),
        receiptTiming: 'accrual',
        accrualStartDate: daysAgoDateKey(10),
        scopeLevel: 'business',
        scopeId: bizId,
        received: false,
      },
      { id: 'trades-r-6', name: 'Shopfront renovation', amount: 6800, expectedDate: daysAheadDateKey(52), scopeLevel: 'business', scopeId: bizId, received: false },
      { id: 'trades-r-7', name: 'Loft conversion — stage 1', amount: 11200, expectedDate: daysAheadDateKey(28), scopeLevel: 'business', scopeId: bizId, received: false },
      { id: 'trades-r-8', name: 'Commercial maintenance contract', amount: 2400, expectedDate: daysAheadDateKey(45), scopeLevel: 'business', scopeId: bizId, received: false },
    ],
    reservePlanners: [
      {
        id: 'trades-rp-1',
        name: 'Riverside Reserve Plan',
        businessId: bizId,
        reserveAccountId: 'trades-acc-3',
        bufferAmount: 1200,
        actualBalance: 5200,
        bills: [
          {
            id: 'trades-rb-1',
            plannerId: 'trades-rp-1',
            name: 'VAT',
            monthAmounts: { Mar: 6800, Jun: 7200, Sep: 7500, Dec: 6900 },
            monthDueDays: { Mar: 7, Jun: 7, Sep: 7, Dec: 7 },
          },
          { id: 'trades-rb-2', plannerId: 'trades-rp-1', name: 'Corporation tax', monthAmounts: { Dec: 14000 }, monthDueDays: { Dec: 1 } },
          { id: 'trades-rb-3', plannerId: 'trades-rp-1', name: 'Public liability insurance', monthAmounts: { Jan: 2200 }, monthDueDays: { Jan: 31 } },
          { id: 'trades-rb-4', plannerId: 'trades-rp-1', name: 'Vehicle tax & MOT', monthAmounts: { Apr: 680 }, monthDueDays: { Apr: 1 } },
        ],
      },
    ],
    snapshots: [],
    historyRecords: [],
    dayNotes: [],
    businessReferenceProfiles: hub.businessReferenceProfiles,
    diaryReminders: hub.diaryReminders,
    workspaceOrigin: 'builtin-demo',
  }

  return {
    ...base,
    snapshots: buildScenarioSnapshots(base, 12, TRADES_SNAPSHOT_SCOPES),
  }
}
