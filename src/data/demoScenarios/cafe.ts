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
  { id: bizId, type: 'business' as const, name: 'Cornerstone Coffee Co.', baseTrue: 32000, growthPerMonth: 320, annualWobble: 2200, trendShape: 'cafe-steady' as const },
  { id: venueHigh, type: 'venue' as const, name: 'High Street', baseTrue: 19500, growthPerMonth: 195, annualWobble: 1350, trendShape: 'cafe-steady' as const },
  { id: venueMarket, type: 'venue' as const, name: 'Market Hall', baseTrue: 12500, growthPerMonth: 125, annualWobble: 900, trendShape: 'cafe-steady' as const },
  { id: groupId, type: 'group' as const, name: 'Cornerstone Coffee', baseTrue: 32000, growthPerMonth: 320, annualWobble: 2200, trendShape: 'cafe-steady' as const },
]

/** Independent café with two sites — multi-year balance history. */
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
      { id: 'cafe-acc-3', venueId: venueMarket, name: 'Current Account', type: 'current', balance: 12800, active: true, updatedAt },
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
        bufferAmount: 500,
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
    financialChecklistItems: [
      {
        id: 'cafe-fc-1',
        name: 'PAYE / CIS filing',
        recurrence: 'monthly',
        dueDayOfMonth: 19,
        scopeLevel: 'business',
        scopeId: bizId,
        notes: 'File Full Payment Submission for the tax month.',
        sortOrder: 1,
        createdAt: updatedAt,
      },
      {
        id: 'cafe-fc-2',
        name: 'Business rates instalment',
        recurrence: 'once',
        dueDate: '2026-07-15',
        scopeLevel: 'business',
        scopeId: bizId,
        notes: 'Monthly rates instalment for both sites.',
        sortOrder: 2,
        createdAt: updatedAt,
      },
      {
        id: 'cafe-fc-3',
        name: 'VAT return due',
        recurrence: 'quarterly',
        dueDayOfMonth: 7,
        dueMonths: [1, 4, 7, 10],
        scopeLevel: 'business',
        scopeId: bizId,
        sortOrder: 3,
        createdAt: updatedAt,
      },
    ],
    workspaceOrigin: 'builtin-demo',
  }

  return {
    ...base,
    snapshots: buildScenarioSnapshots(base, 36, CAFE_SNAPSHOT_SCOPES),
  }
}
