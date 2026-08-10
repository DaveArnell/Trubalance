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
  return {
    groups: state.groups.length,
    businesses: state.businesses.length,
    venues: state.venues.length,
    accounts: state.accounts.length,
    commitments: state.commitments.length,
    receipts: state.expectedReceipts.length,
    planners: state.reservePlanners.length,
    snapshots: state.snapshots.length,
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

/** Recover expected receipts present locally but missing from a cloud load. */
export function mergeMissingExpectedReceipts(cloud: AppState, local: AppState | null): AppState {
  if (!local?.expectedReceipts.length) return cloud
  const cloudIds = new Set(cloud.expectedReceipts.map((receipt) => receipt.id))
  const missing = local.expectedReceipts.filter((receipt) => !cloudIds.has(receipt.id))
  if (missing.length === 0) return cloud
  return {
    ...cloud,
    workspaceOrigin: cloud.workspaceOrigin ?? 'user',
    expectedReceipts: [...cloud.expectedReceipts, ...missing],
  }
}

/**
 * Union receipts from cloud + device. Prefer unreceived over received for the same id,
 * and prefer the device copy’s fields when both are still open — so phone edits reach the account.
 */
export function unionExpectedReceipts(
  cloud: AppState,
  ...sources: Array<AppState | null | undefined>
): AppState {
  const byId = new Map(cloud.expectedReceipts.map((receipt) => [receipt.id, receipt]))

  for (const source of sources) {
    if (!source?.expectedReceipts.length) continue
    for (const receipt of source.expectedReceipts) {
      const existing = byId.get(receipt.id)
      if (!existing) {
        byId.set(receipt.id, receipt)
        continue
      }
      if (existing.received && !receipt.received) {
        byId.set(receipt.id, receipt)
        continue
      }
      if (!existing.received && receipt.received) continue
      byId.set(receipt.id, { ...existing, ...receipt })
    }
  }

  return {
    ...cloud,
    workspaceOrigin: cloud.workspaceOrigin ?? 'user',
    expectedReceipts: [...byId.values()],
  }
}

export function expectedReceiptsSyncKey(state: AppState): string {
  return state.expectedReceipts
    .map(
      (receipt) =>
        `${receipt.id}:${receipt.name}:${receipt.scopeId}:${receipt.amount}:${receipt.received ? 1 : 0}:${receipt.receivedDate ?? ''}:${receipt.expectedDate ?? ''}:${receipt.receiptTiming ?? ''}`,
    )
    .sort()
    .join('|')
}

/** Content fingerprint for stored Trends / week-month delta baselines. */
export function snapshotsSyncKey(state: AppState): string {
  return state.snapshots
    .map(
      (snapshot) =>
        `${snapshot.id}:${snapshot.trueBalance}:${snapshot.cash}:${snapshot.committedFunds}:${snapshot.expectedReceipts}:${snapshot.updatedAt ?? ''}`,
    )
    .sort()
    .join('|')
}

export function historyRecordsSyncKey(state: AppState): string {
  return (state.historyRecords ?? [])
    .map(
      (record) =>
        `${record.id}:${record.summary?.trueBalance ?? ''}:${record.summary?.expectedReceipts ?? ''}:${record.savedAt ?? record.date}`,
    )
    .sort()
    .join('|')
}

/** Prefer newer rebuilt snapshot rows so Trends stay aligned after receipt edits. */
export function unionSnapshotsByUpdatedAt(
  cloud: AppState,
  ...sources: Array<AppState | null | undefined>
): AppState {
  const byId = new Map(cloud.snapshots.map((snapshot) => [snapshot.id, snapshot]))
  for (const source of sources) {
    if (!source?.snapshots.length) continue
    for (const snapshot of source.snapshots) {
      const existing = byId.get(snapshot.id)
      if (!existing) {
        byId.set(snapshot.id, snapshot)
        continue
      }
      const existingTs = existing.updatedAt ?? ''
      const nextTs = snapshot.updatedAt ?? ''
      if (nextTs > existingTs) {
        byId.set(snapshot.id, snapshot)
        continue
      }
      if (
        nextTs === existingTs &&
        (snapshot.trueBalance !== existing.trueBalance ||
          snapshot.expectedReceipts !== existing.expectedReceipts ||
          snapshot.committedFunds !== existing.committedFunds ||
          snapshot.cash !== existing.cash)
      ) {
        byId.set(snapshot.id, snapshot)
      }
    }
  }
  return {
    ...cloud,
    workspaceOrigin: cloud.workspaceOrigin ?? 'user',
    snapshots: [...byId.values()],
  }
}

export function unionHistoryRecordsBySavedAt(
  cloud: AppState,
  ...sources: Array<AppState | null | undefined>
): AppState {
  const byId = new Map((cloud.historyRecords ?? []).map((record) => [record.id, record]))
  for (const source of sources) {
    if (!source?.historyRecords?.length) continue
    for (const record of source.historyRecords) {
      const existing = byId.get(record.id)
      if (!existing) {
        byId.set(record.id, record)
        continue
      }
      const existingTs = existing.savedAt ?? existing.date ?? ''
      const nextTs = record.savedAt ?? record.date ?? ''
      if (nextTs > existingTs) {
        byId.set(record.id, record)
        continue
      }
      if (
        nextTs === existingTs &&
        (record.summary?.trueBalance !== existing.summary?.trueBalance ||
          record.summary?.expectedReceipts !== existing.summary?.expectedReceipts)
      ) {
        byId.set(record.id, record)
      }
    }
  }
  return {
    ...cloud,
    workspaceOrigin: cloud.workspaceOrigin ?? 'user',
    historyRecords: [...byId.values()],
  }
}

/** Recover reserve planners (and their bills) present locally but missing from a cloud load. */
export function mergeMissingReservePlanners(cloud: AppState, local: AppState | null): AppState {
  if (!local?.reservePlanners.length) return cloud
  const cloudIds = new Set(cloud.reservePlanners.map((planner) => planner.id))
  const missing = local.reservePlanners.filter((planner) => !cloudIds.has(planner.id))
  if (missing.length === 0) return cloud
  return {
    ...cloud,
    workspaceOrigin: cloud.workspaceOrigin ?? 'user',
    reservePlanners: [...cloud.reservePlanners, ...missing],
  }
}

/** Recover commitments present locally but missing from a cloud load. */
export function mergeMissingCommitments(cloud: AppState, local: AppState | null): AppState {
  if (!local?.commitments.length) return cloud
  const cloudIds = new Set(cloud.commitments.map((commitment) => commitment.id))
  const missing = local.commitments.filter((commitment) => !cloudIds.has(commitment.id))
  if (missing.length === 0) return cloud
  return {
    ...cloud,
    workspaceOrigin: cloud.workspaceOrigin ?? 'user',
    commitments: [...cloud.commitments, ...missing],
  }
}

/** Merge critical local entities that a partial/failed cloud load may have dropped. */
export function mergeMissingLocalWorkspaceData(cloud: AppState, local: AppState | null): AppState {
  let next = mergeMissingExpectedReceipts(cloud, local)
  next = mergeMissingReservePlanners(next, local)
  next = mergeMissingCommitments(next, local)
  return next
}

/** How many critical entities local added on top of a cloud (or other) snapshot. */
export function countCriticalEntitiesAdded(base: AppState, merged: AppState): {
  receipts: number
  commitments: number
  planners: number
  total: number
} {
  const receipts = Math.max(0, merged.expectedReceipts.length - base.expectedReceipts.length)
  const commitments = Math.max(0, merged.commitments.length - base.commitments.length)
  const planners = Math.max(0, merged.reservePlanners.length - base.reservePlanners.length)
  return { receipts, commitments, planners, total: receipts + commitments + planners }
}

/** True when a session backup has more of any critical entity than the live workspace. */
export function sessionBackupLooksRicher(
  backup: ReturnType<typeof summarizeAppState>,
  current: ReturnType<typeof summarizeAppState>,
): boolean {
  return (
    backup.receipts > current.receipts ||
    backup.planners > current.planners ||
    backup.commitments > current.commitments ||
    backup.accounts > current.accounts ||
    backup.businesses > current.businesses
  )
}

export function isInitialDemoState(state: AppState): boolean {
  return isBuiltinDemoWorkspace(state)
}

/** Clear all user-specific data from localStorage on sign out. */
export function clearLocalUserData() {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('trubalance-')) {
      keysToRemove.push(key)
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key)
  }
  sessionStorage.clear()
}
