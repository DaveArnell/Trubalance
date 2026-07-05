import type { AppState } from '../types'
import { applyDemoOperatingSnapshot } from '../data/demoScenarios/operatingSnapshot'
import { repairEmptySnapshotChangedAccounts } from './historyRebuild'
import { getReferenceDate } from './referenceDate'
import { backfillScopeSnapshots } from './snapshotRollup'
import { refreshAllSnapshotMetrics } from './snapshotRebuild'

/** Backfill missing scope snapshots and align stored metrics after load or import. */
export function normalizeWorkspaceState(state: AppState, now = new Date().toISOString()): AppState {
  const repaired = repairEmptySnapshotChangedAccounts(state)
  const withBackfill = backfillScopeSnapshots(repaired, now)
  const refreshed = refreshAllSnapshotMetrics(withBackfill, now)
  if (refreshed.workspaceOrigin === 'builtin-demo') {
    return applyDemoOperatingSnapshot(refreshed, getReferenceDate())
  }
  return refreshed
}
