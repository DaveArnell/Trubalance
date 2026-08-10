import type { AppState } from '../types'
import { applyDemoOperatingSnapshot } from '../data/demoScenarios/operatingSnapshot'
import { ensureGroupStructure } from './groupStructure'
import { repairEmptySnapshotChangedAccounts } from './historyRebuild'
import { getReferenceDate } from './referenceDate'
import { backfillScopeSnapshots } from './snapshotRollup'
import { refreshAllSnapshotMetrics, restorePastSnapshotMetricsFromHistory } from './snapshotRebuild'
import { repairHistoryRecoveredReceipts } from './workspaceRecovery'

/** Align stored metrics for display without inventing past Trends from live balances. */
export function normalizeWorkspaceStateForDisplay(state: AppState, now = new Date().toISOString()): AppState {
  const grouped = ensureGroupStructure(state)
  const repairedReceipts = repairHistoryRecoveredReceipts(grouped).state
  const repaired = repairEmptySnapshotChangedAccounts(repairedReceipts)
  const restored = restorePastSnapshotMetricsFromHistory(repaired, now)
  const refreshed = refreshAllSnapshotMetrics(restored, now)
  if (refreshed.workspaceOrigin === 'builtin-demo') {
    return applyDemoOperatingSnapshot(refreshed, getReferenceDate())
  }
  return refreshed
}

/** Backfill missing scope snapshots and align stored metrics after load or import. */
export function normalizeWorkspaceState(state: AppState, now = new Date().toISOString()): AppState {
  const grouped = ensureGroupStructure(state)
  const repairedReceipts = repairHistoryRecoveredReceipts(grouped).state
  const repaired = repairEmptySnapshotChangedAccounts(repairedReceipts)
  // Restore frozen History captures before backfill so we do not push poisoned past rows.
  const restored = restorePastSnapshotMetricsFromHistory(repaired, now)
  const withBackfill = backfillScopeSnapshots(restored, now)
  const refreshed = refreshAllSnapshotMetrics(withBackfill, now)
  if (refreshed.workspaceOrigin === 'builtin-demo') {
    return applyDemoOperatingSnapshot(refreshed, getReferenceDate())
  }
  return refreshed
}
