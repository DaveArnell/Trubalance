import type { AppState } from '../../types'
import { buildScenarioSnapshots } from './buildSnapshots'
import {
  daysAheadDateKey,
  demoAccountUpdatedAt,
  todayDateKey,
} from './dateHelpers'

const bizId = 'salon-biz'

export const salonDefaultViewScope = { type: 'business' as const, id: bizId }

const SALON_SNAPSHOT_SCOPES = [
  {
    id: bizId,
    type: 'business' as const,
    name: 'Grove Hair Studio',
    baseTrue: 16800,
    growthPerMonth: 145,
    annualWobble: 950,
    trendShape: 'salon-autumn' as const,
  },
]

/** Single-site salon — steady appointment income, simple cost picture. */
export function buildSalonDemoState(): AppState {
  const updatedAt = demoAccountUpdatedAt()

  const base: AppState = {
    groups: [],
    businesses: [{ id: bizId, groupId: '', name: 'Grove Hair Studio' }],
    venues: [],
    accounts: [
      { id: 'salon-acc-1', businessId: bizId, name: 'Current Account', type: 'current', balance: 14200, active: true, updatedAt },
      { id: 'salon-acc-3', businessId: bizId, name: 'Reserve Account', type: 'reserve', balance: 2800, active: true, updatedAt },
    ],
    commitments: [
      { id: 'salon-c-1', name: 'Rent', schedule: 'monthly', amount: 2200, dueDayOfMonth: 1, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'salon-c-2', name: 'Stylist wages', schedule: 'monthly', amount: 5400, dueDayOfMonth: 28, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'salon-c-3', name: 'Product wholesale', schedule: 'monthly', amount: 980, dueDayOfMonth: 12, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'salon-c-4', name: 'Utilities', schedule: 'monthly', amount: 310, dueDayOfMonth: 10, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'salon-c-5', name: 'Card processing fees', schedule: 'monthly', amount: 185, dueDayOfMonth: 5, scopeLevel: 'business', scopeId: bizId, status: 'healthy' },
      { id: 'salon-c-6', name: 'PAYE / HMRC', schedule: 'monthly', amount: 980, dueDayOfMonth: 22, scopeLevel: 'business', scopeId: bizId, status: 'warning' },
      {
        id: 'salon-c-7',
        name: 'Chair and dryer refresh',
        schedule: 'planned',
        amount: 3200,
        plannedLabel: 'In 8 weeks',
        plannedDueDate: daysAheadDateKey(56),
        fundingMethod: 'accrue_until_due',
        fundingStartDate: todayDateKey(),
        scopeLevel: 'business',
        scopeId: bizId,
        status: 'healthy',
      },
    ],
    expectedReceipts: [
      { id: 'salon-r-1', name: 'Wedding party booking', amount: 480, expectedDate: daysAheadDateKey(9), scopeLevel: 'business', scopeId: bizId, received: false },
      { id: 'salon-r-2', name: 'Colour course deposit', amount: 220, expectedDate: daysAheadDateKey(16), scopeLevel: 'business', scopeId: bizId, received: false },
    ],
    reservePlanners: [
      {
        id: 'salon-rp-1',
        name: 'Grove Reserve Plan',
        businessId: bizId,
        reserveAccountId: 'salon-acc-3',
        bufferAmount: 400,
        actualBalance: 2800,
        bills: [
          {
            id: 'salon-rb-1',
            plannerId: 'salon-rp-1',
            name: 'VAT',
            monthAmounts: { Mar: 2100, Jun: 2300, Sep: 2200, Dec: 2400 },
            monthDueDays: { Mar: 7, Jun: 7, Sep: 7, Dec: 7 },
          },
          { id: 'salon-rb-2', plannerId: 'salon-rp-1', name: 'Business rates', monthAmounts: { Apr: 3600 }, monthDueDays: { Apr: 1 } },
          { id: 'salon-rb-3', plannerId: 'salon-rp-1', name: 'Salon insurance', monthAmounts: { Oct: 980 }, monthDueDays: { Oct: 15 } },
        ],
      },
    ],
    snapshots: [],
    historyRecords: [],
    dayNotes: [],
    financialChecklistItems: [
      {
        id: 'salon-fc-1',
        name: 'Self Assessment payment on account',
        recurrence: 'once',
        dueDate: '2026-07-31',
        scopeLevel: 'business',
        scopeId: bizId,
        notes: 'Second payment on account for the tax year.',
        sortOrder: 1,
        createdAt: updatedAt,
      },
      {
        id: 'salon-fc-2',
        name: 'Chair rental renewals',
        recurrence: 'once',
        dueDate: '2026-07-18',
        scopeLevel: 'business',
        scopeId: bizId,
        notes: 'Confirm renewals with self-employed stylists.',
        sortOrder: 2,
        createdAt: updatedAt,
      },
      {
        id: 'salon-fc-3',
        name: 'VAT return due',
        recurrence: 'quarterly',
        dueDayOfMonth: 7,
        dueMonths: [3, 6, 9, 12],
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
    snapshots: buildScenarioSnapshots(base, 36, SALON_SNAPSHOT_SCOPES),
  }
}
