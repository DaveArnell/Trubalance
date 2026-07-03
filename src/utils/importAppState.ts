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

  return {
    state: {
      ...base,
      groups,
      businesses: record.businesses as AppState['businesses'],
      venues: record.venues as AppState['venues'],
      accounts: record.accounts as AppState['accounts'],
      commitments: record.commitments as AppState['commitments'],
      expectedReceipts: record.expectedReceipts as AppState['expectedReceipts'],
      reservePlanners: record.reservePlanners as AppState['reservePlanners'],
      snapshots: record.snapshots as AppState['snapshots'],
      historyRecords: Array.isArray(record.historyRecords)
        ? (record.historyRecords as AppState['historyRecords'])
        : [],
      dayNotes: migrateDayNotes(
        Array.isArray(record.dayNotes) ? (record.dayNotes as AppState['dayNotes']) : [],
        groups[0]?.id,
      ),
      businessReferenceProfiles: Array.isArray(record.businessReferenceProfiles)
        ? (record.businessReferenceProfiles as AppState['businessReferenceProfiles'])
        : [],
      diaryReminders: Array.isArray(record.diaryReminders)
        ? (record.diaryReminders as AppState['diaryReminders'])
        : [],
      workspaceOrigin: 'user',
    },
  }
}
