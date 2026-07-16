import type { AppState } from '../../types'
import { buildScenarioSnapshots } from './buildSnapshots'
import {
  daysAheadDateKey,
  demoAccountUpdatedAt,
  todayDateKey,
} from './dateHelpers'

const groupId = 'cafe-group'
const bizId = 'cafe-biz'
const venueHigh = 'cafe-high-st'
const venueMarket = 'cafe-market'

export const cafeDefaultViewScope = { type: 'business' as const, id: bizId }

const CAFE_SNAPSHOT_SCOPES = [
  { id: bizId, type: 'business' as const, name: 'Cornerstone Coffee Co.', baseTrue: 22000, growthPerMonth: 1800, seasonality: 8000 },
  { id: venueHigh, type: 'venue' as const, name: 'High Street', baseTrue: 14000, growthPerMonth: 1100, seasonality: 5000 },
  { id: venueMarket, type: 'venue' as const, name: 'Market Hall', baseTrue: 8000, growthPerMonth: 700, seasonality: 3500 },
  { id: groupId, type: 'group' as const, name: 'Cornerstone Coffee', baseTrue: 22000, growthPerMonth: 1800, seasonality: 8000 },
]

/** Independent café with two sites — 6 months of history. */
export function buildCafeDemoState(): AppState {
  const updatedAt = demoAccountUpdatedAt()

  const base: AppState = {
    groups: [{ id: groupId, name: 'Cornerstone Coffee' }],
    businesses: [{ id: bizId, groupId, name: 'Cornerstone Coffee Co.' }],
    venues: [
      { id: venueHigh, businessId: bizId, name: 'High Street' },
      { id: venueMarket, businessId: bizId, name: 'Market Hall' },
    ],
    accounts: [
      { id: 'cafe-acc-1', venueId: venueHigh, name: 'Current Account', type: 'current', balance: 18400, active: true, updatedAt },
      { id: 'cafe-acc-2', venueId: venueHigh, name: 'Savings Account', type: 'savings', balance: 3200, active: true, updatedAt },
      { id: 'cafe-acc-3', venueId: venueMarket, name: 'Current Account', type: 'current', balance: 12800, active: true, updatedAt },
      { id: 'cafe-acc-4', venueId: venueMarket, name: 'Savings Account', type: 'savings', balance: 2100, active: true, updatedAt },
      { id: 'cafe-acc-5', businessId: bizId, name: 'Reserve Account', type: 'reserve', balance: 4500, active: true, updatedAt },
    ],
    commitments: [
      { id: 'cafe-c-1', name: 'Rent (High Street)', schedule: 'monthly', amount: 4200, dueDayOfMonth: 1, scopeLevel: 'venue', scopeId: venueHigh, status: 'healthy' },
      { id: 'cafe-c-2', name: 'Rent (Market)', schedule: 'monthly', amount: 2800, dueDayOfMonth: 1, scopeLevel: 'venue', scopeId: venueMarket, status: 'healthy' },
      { id: 'cafe-c-3', name: 'Payroll', schedule: 'monthly', amount: 9600, dueDayOfMonth: 28, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'cafe-c-4', name: 'Coffee wholesale', schedule: 'monthly', amount: 3400, dueDayOfMonth: 15, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'cafe-c-5', name: 'Utilities', schedule: 'monthly', amount: 680, dueDayOfMonth: 10, scopeLevel: 'business', scopeId: bizId, status: 'warning' },
      { id: 'cafe-c-6', name: 'Card processing fees', schedule: 'monthly', amount: 420, dueDayOfMonth: 5, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'cafe-c-7', name: 'PAYE / HMRC', schedule: 'monthly', amount: 2100, dueDayOfMonth: 22, scopeLevel: 'business', scopeId: bizId, status: 'warning' },
      {
        id: 'cafe-c-8',
        name: 'Espresso machine service',
        schedule: 'planned',
        amount: 2800,
        plannedLabel: 'In 6 weeks',
        plannedDueDate: daysAheadDateKey(42),
        fundingMethod: 'accrue_until_due',
        fundingStartDate: todayDateKey(),
        scopeLevel: 'venue',
        scopeId: venueHigh,
        status: 'healthy',
      },
    ],
    expectedReceipts: [
      { id: 'cafe-r-1', name: 'Corporate catering', amount: 1200, expectedDate: daysAheadDateKey(5), scopeLevel: 'business', scopeId: bizId, received: false },
      { id: 'cafe-r-2', name: 'Market event deposit', amount: 450, expectedDate: daysAheadDateKey(12), scopeLevel: 'venue', scopeId: venueMarket, received: false },
    ],
    reservePlanners: [
      {
        id: 'cafe-rp-1',
        name: 'Cornerstone Reserve Plan',
        businessId: bizId,
        reserveAccountId: 'cafe-acc-5',
        bufferAmount: 800,
        actualBalance: 4500,
        bills: [
          {
            id: 'cafe-rb-1',
            plannerId: 'cafe-rp-1',
            name: 'VAT',
            monthAmounts: { Mar: 4200, Jun: 4800, Sep: 5100, Dec: 4600 },
            monthDueDays: { Mar: 7, Jun: 7, Sep: 7, Dec: 7 },
          },
          { id: 'cafe-rb-2', plannerId: 'cafe-rp-1', name: 'Business rates', monthAmounts: { Apr: 6200 }, monthDueDays: { Apr: 1 } },
          { id: 'cafe-rb-3', plannerId: 'cafe-rp-1', name: 'Equipment insurance', monthAmounts: { Oct: 1800 }, monthDueDays: { Oct: 15 } },
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
    snapshots: buildScenarioSnapshots(base, 6, CAFE_SNAPSHOT_SCOPES),
  }
}
