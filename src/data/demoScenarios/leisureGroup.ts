import type { AppState } from '../../types'
import { buildScenarioSnapshots } from './buildSnapshots'
import {
  daysAheadDateKey,
  demoAccountUpdatedAt,
  todayDateKey,
} from './dateHelpers'

const groupId = 'demo-leisure-group'
const bizMain = 'demo-leisure-main'
const bizNorth = 'demo-leisure-north'
const bizCoast = 'demo-leisure-coast'
const venueRiverside = 'demo-venue-riverside'
const venueCity = 'demo-venue-city'
const venueHarbour = 'demo-venue-harbour'
const venueNorthgate = 'demo-venue-northgate'
const venuePromenade = 'demo-venue-promenade'

export const leisureDefaultViewScope = { type: 'group' as const, id: groupId }

const LEISURE_SNAPSHOT_SCOPES = [
  { id: groupId, type: 'group' as const, name: 'Summit Leisure Group', baseTrue: 112000, growthPerMonth: 180, annualWobble: 900 },
  { id: bizMain, type: 'business' as const, name: 'Summit Adventures Ltd', baseTrue: 64000, growthPerMonth: 100, annualWobble: 500 },
  { id: bizNorth, type: 'business' as const, name: 'Northgate Venues Ltd', baseTrue: 28000, growthPerMonth: 45, annualWobble: 220 },
  { id: bizCoast, type: 'business' as const, name: 'Coastal Attractions Ltd', baseTrue: 20000, growthPerMonth: 35, annualWobble: 180 },
  { id: venueRiverside, type: 'venue' as const, name: 'Riverside Centre', baseTrue: 25000, growthPerMonth: 40, annualWobble: 200 },
  { id: venueCity, type: 'venue' as const, name: 'City Centre', baseTrue: 22000, growthPerMonth: 35, annualWobble: 170 },
  { id: venueHarbour, type: 'venue' as const, name: 'Harbour Lounge', baseTrue: 17000, growthPerMonth: 25, annualWobble: 130 },
  { id: venueNorthgate, type: 'venue' as const, name: 'Northgate', baseTrue: 28000, growthPerMonth: 45, annualWobble: 220 },
  { id: venuePromenade, type: 'venue' as const, name: 'Promenade', baseTrue: 20000, growthPerMonth: 35, annualWobble: 180 },
]

/** Fictional multi-site leisure group — 3 years of trend history. */
export function buildLeisureGroupDemoState(): AppState {
  const updatedAt = demoAccountUpdatedAt()

  const stateWithoutSnapshots: Omit<AppState, 'snapshots'> = {
    groups: [{ id: groupId, name: 'Summit Leisure Group' }],
    businesses: [
      { id: bizMain, groupId, name: 'Summit Adventures Ltd' },
      { id: bizNorth, groupId, name: 'Northgate Venues Ltd' },
      { id: bizCoast, groupId, name: 'Coastal Attractions Ltd' },
    ],
    venues: [
      { id: venueRiverside, businessId: bizMain, name: 'Riverside Centre' },
      { id: venueCity, businessId: bizMain, name: 'City Centre' },
      { id: venueHarbour, businessId: bizMain, name: 'Harbour Lounge' },
      { id: venueNorthgate, businessId: bizNorth, name: 'Northgate' },
      { id: venuePromenade, businessId: bizCoast, name: 'Promenade' },
    ],
    accounts: [
      { id: 'lg-acc-1', venueId: venueRiverside, name: 'Current Account', type: 'current', balance: 38500, active: true, updatedAt },
      { id: 'lg-acc-2', venueId: venueRiverside, name: 'Savings Account', type: 'savings', balance: 7200, active: true, updatedAt },
      { id: 'lg-acc-3', businessId: bizMain, name: 'Business Savings', type: 'savings', balance: 12400, active: true, updatedAt },
      { id: 'lg-acc-4', venueId: venueCity, name: 'Current Account', type: 'current', balance: 31200, active: true, updatedAt },
      { id: 'lg-acc-5', venueId: venueCity, name: 'Savings Account', type: 'savings', balance: 5400, active: true, updatedAt },
      { id: 'lg-acc-6', venueId: venueHarbour, name: 'Current Account', type: 'current', balance: 19800, active: true, updatedAt },
      { id: 'lg-acc-7', venueId: venueNorthgate, name: 'Current Account', type: 'current', balance: 27600, active: true, updatedAt },
      { id: 'lg-acc-8', venueId: venueNorthgate, name: 'Savings Account', type: 'savings', balance: 9800, active: true, updatedAt },
      { id: 'lg-acc-9', venueId: venuePromenade, name: 'Current Account', type: 'current', balance: 22100, active: true, updatedAt },
      { id: 'lg-acc-10', venueId: venuePromenade, name: 'Savings Account', type: 'savings', balance: 6100, active: true, updatedAt },
      { id: 'lg-acc-11', venueId: venueRiverside, name: 'Reserve Account', type: 'reserve', balance: 8400, active: true, updatedAt },
    ],
    commitments: [
      { id: 'lg-c-1', name: 'Payroll', schedule: 'monthly', amount: 18500, dueDayOfMonth: 28, scopeLevel: 'business', scopeId: bizMain, status: 'healthy' },
      { id: 'lg-c-2', name: 'Rent', schedule: 'monthly', amount: 9800, dueDayOfMonth: 1, scopeLevel: 'business', scopeId: bizMain, status: 'healthy' },
      { id: 'lg-c-3', name: 'PAYE / HMRC', schedule: 'monthly', amount: 6400, dueDayOfMonth: 22, scopeLevel: 'business', scopeId: bizMain, status: 'healthy' },
      { id: 'lg-c-4', name: 'Pension', schedule: 'monthly', amount: 2200, dueDayOfMonth: 20, scopeLevel: 'business', scopeId: bizMain, status: 'healthy' },
      { id: 'lg-c-5', name: 'Merchant services', schedule: 'monthly', amount: 2800, dueDayOfMonth: 12, scopeLevel: 'venue', scopeId: venueCity, status: 'healthy' },
      { id: 'lg-c-6', name: 'Payroll', schedule: 'monthly', amount: 9200, dueDayOfMonth: 28, scopeLevel: 'venue', scopeId: venueNorthgate, status: 'healthy' },
      { id: 'lg-c-6b', name: 'Rent', schedule: 'monthly', amount: 4800, dueDayOfMonth: 1, scopeLevel: 'venue', scopeId: venueNorthgate, status: 'healthy' },
      { id: 'lg-c-7', name: 'Insurance', schedule: 'monthly', amount: 890, dueDayOfMonth: 15, scopeLevel: 'business', scopeId: bizCoast, status: 'healthy' },
      { id: 'lg-c-8', name: 'Utilities', schedule: 'monthly', amount: 1450, dueDayOfMonth: 10, scopeLevel: 'venue', scopeId: venuePromenade, status: 'healthy' },
      { id: 'lg-c-8b', name: 'Payroll', schedule: 'monthly', amount: 6800, dueDayOfMonth: 28, scopeLevel: 'venue', scopeId: venuePromenade, status: 'healthy' },
      { id: 'lg-c-8c', name: 'Rent', schedule: 'monthly', amount: 3600, dueDayOfMonth: 1, scopeLevel: 'venue', scopeId: venuePromenade, status: 'healthy' },
      {
        id: 'lg-c-9',
        name: 'Activity equipment',
        schedule: 'planned',
        amount: 12000,
        plannedLabel: 'In 6 weeks',
        plannedDueDate: daysAheadDateKey(42),
        fundingMethod: 'accrue_until_due',
        fundingStartDate: todayDateKey(),
        scopeLevel: 'business',
        scopeId: bizNorth,
        status: 'healthy',
      },
      {
        id: 'lg-c-10',
        name: 'Seasonal marketing',
        schedule: 'planned',
        amount: 4500,
        plannedLabel: 'Reserved now',
        plannedDueDate: daysAheadDateKey(35),
        fundingMethod: 'immediate',
        fundingStartDate: todayDateKey(),
        scopeLevel: 'business',
        scopeId: bizCoast,
        status: 'healthy',
      },
    ],
    expectedReceipts: [
      { id: 'lg-r-1', name: 'Corporate event booking', amount: 2400, expectedDate: daysAheadDateKey(9), scopeLevel: 'venue', scopeId: venueCity, received: false },
      { id: 'lg-r-2', name: 'Birthday party deposit', amount: 650, expectedDate: daysAheadDateKey(4), scopeLevel: 'venue', scopeId: venueRiverside, received: false },
      { id: 'lg-r-3', name: 'School holiday block', amount: 1800, expectedDate: daysAheadDateKey(18), scopeLevel: 'venue', scopeId: venueNorthgate, received: false },
    ],
    reservePlanners: [
      {
        id: 'lg-rp-1',
        name: 'Summit Reserve Plan',
        businessId: bizMain,
        reserveAccountId: 'lg-acc-11',
        bufferAmount: 2000,
        actualBalance: 8400,
        bills: [
          {
            id: 'lg-rb-1',
            plannerId: 'lg-rp-1',
            name: 'VAT',
            monthAmounts: { Mar: 18500, Jun: 19200, Sep: 17800, Dec: 20100 },
            monthDueDays: { Mar: 7, Jun: 7, Sep: 7, Dec: 7 },
            notes: 'Quarterly VAT',
          },
          { id: 'lg-rb-2', plannerId: 'lg-rp-1', name: 'Corporation tax', monthAmounts: { Dec: 32000 }, monthDueDays: { Dec: 15 } },
          { id: 'lg-rb-3', plannerId: 'lg-rp-1', name: 'Insurance renewal', monthAmounts: { Oct: 2800 }, monthDueDays: { Oct: 20 } },
        ],
      },
      {
        id: 'lg-rp-2',
        name: 'Northgate Reserve Plan',
        businessId: bizNorth,
        bufferAmount: 800,
        actualBalance: 4600,
        bills: [
          { id: 'lg-rb-4', plannerId: 'lg-rp-2', name: 'VAT', monthAmounts: { Mar: 8200, Jun: 8400, Sep: 7900, Dec: 8600 }, monthDueDays: { Mar: 7, Jun: 7, Sep: 7, Dec: 7 } },
          { id: 'lg-rb-5', plannerId: 'lg-rp-2', name: 'Business rates', monthAmounts: { Apr: 5400 }, monthDueDays: { Apr: 28 } },
        ],
      },
      {
        id: 'lg-rp-3',
        name: 'Coastal Reserve Plan',
        businessId: bizCoast,
        bufferAmount: 500,
        actualBalance: 3200,
        bills: [
          {
            id: 'lg-rb-6',
            plannerId: 'lg-rp-3',
            name: 'Service charge',
            monthAmounts: { Mar: 720, Jun: 720, Sep: 720, Dec: 720 },
            monthDueDays: { Mar: 25, Jun: 25, Sep: 25, Dec: 25 },
          },
          { id: 'lg-rb-7', plannerId: 'lg-rp-3', name: 'Licences', monthAmounts: { Jan: 980 }, monthDueDays: { Jan: 31 } },
        ],
      },
    ],
    historyRecords: [],
    dayNotes: [],
    workspaceOrigin: 'builtin-demo',
  }

  const state: AppState = {
    ...stateWithoutSnapshots,
    snapshots: [],
  }
  return {
    ...state,
    snapshots: buildScenarioSnapshots(state, 48, LEISURE_SNAPSHOT_SCOPES),
  }
}
