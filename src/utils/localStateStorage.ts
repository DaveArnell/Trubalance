import type { AppState } from '../types'
import { initialState } from '../data/initialState'

export const LOCAL_STORAGE_KEY = 'trubalance-app-state-v4'
const LEGACY_KEYS = ['trubalance-app-state-v3', 'trubalance-app-state-v2']

export const emptyAppState = (): AppState => ({
  groups: [],
  businesses: [],
  venues: [],
  accounts: [],
  commitments: [],
  expectedReceipts: [],
  reservePlanners: [],
  snapshots: [],
  historyRecords: [],
  dayNotes: [],
  businessReferenceProfiles: [],
  diaryReminders: [],
})

/** True when the workspace is still the untouched built-in demo seed. */
export function isBuiltinDemoWorkspace(state: AppState): boolean {
  if (state.workspaceOrigin === 'user') return false
  if (state.workspaceOrigin === 'builtin-demo') return true
  return statesMatchRoughly(state, initialState)
}

/** True when the user has their own workspace (import, edits, or explicit restore). */
export function isUserOwnedWorkspace(state: AppState): boolean {
  if (state.workspaceOrigin === 'user') return true
  if (state.workspaceOrigin === 'builtin-demo') return false
  return !statesMatchRoughly(state, initialState)
}

/** Show the orange demo banner at the top of the app. */
export function showsDemoDataBanner(state: AppState): boolean {
  return isBuiltinDemoWorkspace(state)
}

/** @deprecated Use isBuiltinDemoWorkspace — kept for older call sites during migration. */
export function isDemoAppState(state: AppState): boolean {
  return isBuiltinDemoWorkspace(state)
}

export function isAppStateEmpty(state: AppState): boolean {
  return (
    state.groups.length === 0 &&
    state.businesses.length === 0 &&
    state.commitments.length === 0 &&
    state.expectedReceipts.length === 0 &&
    state.reservePlanners.length === 0 &&
    state.snapshots.length === 0
  )
}

export function summarizeAppState(state: AppState) {
  const refs = state.businessReferenceProfiles?.reduce(
    (n, p) => n + p.fields.filter((f) => f.value.trim()).length,
    0,
  ) ?? 0
  const diary = state.diaryReminders?.filter((r) => !r.completed).length ?? 0
  return {
    groups: state.groups.length,
    businesses: state.businesses.length,
    venues: state.venues.length,
    accounts: state.accounts.length,
    commitments: state.commitments.length,
    receipts: state.expectedReceipts.length,
    planners: state.reservePlanners.length,
    snapshots: state.snapshots.length,
    references: refs,
    diaryReminders: diary,
    label: state.groups[0]?.name ?? 'Empty',
  }
}

/** Read raw JSON from browser storage without migration (for inspection). */
export function readRawBrowserStateJson(): string | null {
  return (
    localStorage.getItem(LOCAL_STORAGE_KEY) ??
    LEGACY_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) ??
    null
  )
}

export function statesMatchRoughly(a: AppState, b: AppState): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function backupBrowserStateToSession(): boolean {
  const raw = readRawBrowserStateJson()
  if (!raw) return false
  sessionStorage.setItem('trubalance-app-state-backup', raw)
  sessionStorage.setItem('trubalance-app-state-backup-at', new Date().toISOString())
  return true
}

export function readSessionBackup(): AppState | null {
  try {
    const raw = sessionStorage.getItem('trubalance-app-state-backup')
    if (!raw) return null
    return JSON.parse(raw) as AppState
  } catch {
    return null
  }
}

export function isInitialDemoState(state: AppState): boolean {
  return isBuiltinDemoWorkspace(state)
}
