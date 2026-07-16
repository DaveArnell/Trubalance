import type { AppState } from '../types'
import { emptyAppState } from './localStateStorage'
import { migrateDayNotes } from './dayNotes'

const REQUIRED_ARRAY_KEYS = [
  'groups',
  'businesses',
  'venues',
  'accounts',
  'commitments',
  'expectedReceipts',
  'reservePlanners',
  'snapshots',
] as const

export function parseImportedAppState(raw: unknown): { state: AppState } | { error: string } {
  if (!raw || typeof raw !== 'object') {
    return { error: 'That file does not look like a Trubalance export.' }
  }

  const record = raw as Record<string, unknown>

  for (const key of REQUIRED_ARRAY_KEYS) {
    if (!Array.isArray(record[key])) {
      return { error: `Missing or invalid "${key}" in the file.` }
    }
  }

  const base = emptyAppState()

  const groups = record.groups as AppState['groups']
  const businesses = record.businesses as AppState['businesses']
  const venues = record.venues as AppState['venues']
  const reservePlanners = record.reservePlanners as AppState['reservePlanners']

  const groupIds = new Set(groups.map((g) => g.id))
  const validBusinesses = businesses.filter((b) => groupIds.has(b.groupId))
  const businessIds = new Set(validBusinesses.map((b) => b.id))
  const venueIds = new Set(venues.map((v) => v.id))

  const validPlanners = reservePlanners.filter((p) => businessIds.has(p.businessId))
  const validVenues = venues.filter((v) => businessIds.has(v.businessId))

  const validVenueIds = new Set(validVenues.map((v) => v.id))
  for (const planner of validPlanners) {
    planner.bills = planner.bills.filter(
      (b) => !b.venueId || venueIds.has(b.venueId) || validVenueIds.has(b.venueId),
    )
  }

  return {
    state: {
      ...base,
      groups,
      businesses: validBusinesses,
      venues: validVenues,
      accounts: record.accounts as AppState['accounts'],
      commitments: record.commitments as AppState['commitments'],
      expectedReceipts: record.expectedReceipts as AppState['expectedReceipts'],
      reservePlanners: validPlanners,
      snapshots: record.snapshots as AppState['snapshots'],
      historyRecords: Array.isArray(record.historyRecords)
        ? (record.historyRecords as AppState['historyRecords'])
        : [],
      dayNotes: migrateDayNotes(
        Array.isArray(record.dayNotes) ? (record.dayNotes as AppState['dayNotes']) : [],
        groups[0]?.id,
      ),
      workspaceOrigin: 'user',
    },
  }
}
