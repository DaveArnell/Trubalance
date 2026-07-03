import type { AppState } from '../types'
import { buildDemoSnapshots } from './demoSnapshots'

const daysAgoIso = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const daysAheadIso = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const groupId = 'group-1'
const bizLaser = 'biz-laser'
const bizSwindon = 'biz-swindon'
const bizBlackpool = 'biz-blackpool'
const venueBournemouth = 'venue-bournemouth'
const venueBristol = 'venue-bristol'
const venueBristolPub = 'venue-bristol-pub'
const venueSwindon = 'venue-swindon'
const venueBlackpool = 'venue-blackpool'

export const initialState: AppState = {
  groups: [{ id: groupId, name: 'Laser Tag Leisure Group' }],
  businesses: [
    { id: bizLaser, groupId, name: 'Laser Tag Leisure Ltd' },
    { id: bizSwindon, groupId, name: 'Swindon Ltd' },
    { id: bizBlackpool, groupId, name: 'Blackpool Ltd' },
  ],
  venues: [
    { id: venueBournemouth, businessId: bizLaser, name: 'Bournemouth' },
    { id: venueBristol, businessId: bizLaser, name: 'Bristol' },
    { id: venueBristolPub, businessId: bizLaser, name: 'Bristol Pub' },
    { id: venueSwindon, businessId: bizSwindon, name: 'Swindon' },
    { id: venueBlackpool, businessId: bizBlackpool, name: 'Blackpool' },
  ],
  accounts: [
    { id: 'acc-1', venueId: venueBournemouth, name: 'Current Account', type: 'current', balance: 42000, active: true, updatedAt: daysAgoIso(1) },
    { id: 'acc-2', venueId: venueBournemouth, name: 'Savings Account', type: 'savings', balance: 8000, active: true, updatedAt: daysAgoIso(1) },
    { id: 'acc-11', businessId: bizLaser, name: 'Business Savings', type: 'savings', balance: 15000, active: true, updatedAt: daysAgoIso(1) },
    { id: 'acc-3', venueId: venueBristol, name: 'Current Account', type: 'current', balance: 38000, active: true, updatedAt: daysAgoIso(2) },
    { id: 'acc-4', venueId: venueBristol, name: 'Savings Account', type: 'savings', balance: 6000, active: true, updatedAt: daysAgoIso(2) },
    { id: 'acc-5', venueId: venueBristolPub, name: 'Current Account', type: 'current', balance: 22000, active: true, updatedAt: daysAgoIso(2) },
    { id: 'acc-6', venueId: venueSwindon, name: 'Current Account', type: 'current', balance: 36000, active: true, updatedAt: daysAgoIso(2) },
    { id: 'acc-7', venueId: venueSwindon, name: 'Savings Account', type: 'savings', balance: 12000, active: true, updatedAt: daysAgoIso(2) },
    { id: 'acc-8', venueId: venueBlackpool, name: 'Current Account', type: 'current', balance: 25000, active: true, updatedAt: daysAgoIso(3) },
    { id: 'acc-9', venueId: venueBlackpool, name: 'Savings Account', type: 'savings', balance: 7000, active: true, updatedAt: daysAgoIso(3) },
    { id: 'acc-10', venueId: venueBournemouth, name: 'Reserve Account', type: 'reserve', balance: 6000, active: true, updatedAt: daysAgoIso(1) },
  ],
  commitments: [
    { id: 'c-1', name: 'Payroll', schedule: 'monthly', amount: 22000, dueDayOfMonth: 28, scopeLevel: 'business', scopeId: bizLaser, status: 'healthy' },
    { id: 'c-2', name: 'Rent', schedule: 'monthly', amount: 12000, dueDayOfMonth: 1, scopeLevel: 'business', scopeId: bizLaser, status: 'healthy' },
    { id: 'c-3', name: 'PAYE / HMRC', schedule: 'monthly', amount: 8200, dueDayOfMonth: 22, scopeLevel: 'business', scopeId: bizLaser, status: 'warning' },
    { id: 'c-4', name: 'Pension', schedule: 'monthly', amount: 2800, dueDayOfMonth: 20, scopeLevel: 'business', scopeId: bizLaser, status: 'healthy' },
    { id: 'c-5', name: 'Credit Card', schedule: 'monthly', amount: 3200, dueDayOfMonth: 12, scopeLevel: 'venue', scopeId: venueBristol, status: 'warning' },
    { id: 'c-6', name: 'VAT', schedule: 'monthly', amount: 4200, dueDayOfMonth: 25, scopeLevel: 'business', scopeId: bizLaser, status: 'critical' },
    { id: 'c-7', name: 'Payroll', schedule: 'monthly', amount: 1800, dueDayOfMonth: 29, scopeLevel: 'venue', scopeId: venueSwindon, status: 'risk' },
    { id: 'c-8', name: 'Insurance', schedule: 'monthly', amount: 1318, dueDayOfMonth: 15, scopeLevel: 'business', scopeId: bizBlackpool, status: 'warning' },
    {
      id: 'c-9',
      name: 'New vehicle',
      schedule: 'planned',
      amount: 15000,
      plannedLabel: 'In 30 days',
      plannedDueDate: daysAheadIso(30),
      fundingMethod: 'accrue_until_due',
      fundingStartDate: todayIso(),
      scopeLevel: 'business',
      scopeId: bizSwindon,
      status: 'warning',
    },
    {
      id: 'c-10',
      name: 'Potential service charge',
      schedule: 'planned',
      amount: 5000,
      plannedLabel: 'Reserved now',
      plannedDueDate: daysAheadIso(45),
      fundingMethod: 'immediate',
      fundingStartDate: todayIso(),
      scopeLevel: 'business',
      scopeId: bizBlackpool,
      status: 'warning',
    },
    {
      id: 'c-11',
      name: 'Equipment upgrade',
      schedule: 'planned',
      amount: 8000,
      plannedLabel: 'Part reserved',
      plannedDueDate: daysAheadIso(60),
      fundingMethod: 'hybrid',
      amountToReserveNow: 3000,
      fundingStartDate: todayIso(),
      scopeLevel: 'business',
      scopeId: bizLaser,
      status: 'healthy',
    },
  ],
  expectedReceipts: [
    { id: 'r-1', name: 'Corporate booking', amount: 1800, expectedDate: '28 Jun', scopeLevel: 'venue', scopeId: venueBristol, received: false },
    { id: 'r-2', name: 'Party deposit', amount: 700, expectedDate: '02 Jul', scopeLevel: 'venue', scopeId: venueBournemouth, received: false },
    { id: 'r-3', name: 'Grant repayment', amount: 500, scopeLevel: 'business', scopeId: bizSwindon, received: false },
  ],
  reservePlanners: [
    {
      id: 'rp-1',
      name: 'Laser Tag Reserve Plan',
      businessId: bizLaser,
      reserveAccountId: 'acc-10',
      bufferAmount: 2000,
      actualBalance: 6000,
      bills: [
        {
          id: 'rb-1',
          plannerId: 'rp-1',
          name: 'VAT',
          monthAmounts: { Mar: 26000, Jun: 27000, Sep: 20000, Dec: 25000 },
          monthDueDays: { Mar: 7, Jun: 7, Sep: 7, Dec: 7 },
          notes: 'Quarterly VAT',
        },
        {
          id: 'rb-3',
          plannerId: 'rp-1',
          name: 'Rent',
          monthAmounts: { Mar: 19500, Jun: 19500, Sep: 19500, Dec: 19500 },
          monthDueDays: { Mar: 1, Jun: 1, Sep: 1, Dec: 1 },
        },
        { id: 'rb-4', plannerId: 'rp-1', name: 'Corporation Tax', monthAmounts: { Dec: 40000 }, monthDueDays: { Dec: 15 } },
        { id: 'rb-5', plannerId: 'rp-1', name: 'Insurance', monthAmounts: { Oct: 3000 }, monthDueDays: { Oct: 20 } },
      ],
    },
    {
      id: 'rp-2',
      name: 'Swindon Reserve Plan',
      businessId: bizSwindon,
      bufferAmount: 1000,
      actualBalance: 5200,
      bills: [
        { id: 'rb-6', plannerId: 'rp-2', name: 'VAT', monthAmounts: { Mar: 12000, Jun: 12000 }, monthDueDays: { Mar: 7, Jun: 7 } },
        { id: 'rb-7', plannerId: 'rp-2', name: 'Rates', monthAmounts: { Apr: 8000 }, monthDueDays: { Apr: 28 } },
        { id: 'rb-8', plannerId: 'rp-2', name: 'Insurance', monthAmounts: { Nov: 2400 }, monthDueDays: { Nov: 15 } },
      ],
    },
    {
      id: 'rp-3',
      name: 'Blackpool Reserve Plan',
      businessId: bizBlackpool,
      bufferAmount: 500,
      actualBalance: 3000,
      bills: [
        {
          id: 'rb-9',
          plannerId: 'rp-3',
          name: 'Service Charge',
          monthAmounts: { Mar: 934, Jun: 934, Sep: 934, Dec: 934 },
          monthDueDays: { Mar: 25, Jun: 25, Sep: 25, Dec: 25 },
        },
        { id: 'rb-10', plannerId: 'rp-3', name: 'Licences', monthAmounts: { Jan: 1200 }, monthDueDays: { Jan: 31 } },
      ],
    },
  ],
  snapshots: buildDemoSnapshots(),
  historyRecords: [],
  dayNotes: [],
  businessReferenceProfiles: [],
  diaryReminders: [],
}

export const defaultViewScope = { type: 'group' as const, id: groupId }
