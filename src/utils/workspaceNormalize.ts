import type { AppState } from '../types'
import { applyDemoOperatingSnapshot } from '../data/demoScenarios/operatingSnapshot'
import { ensureGroupStructure } from './groupStructure'
import { reconstructHistoryRecordsFromSnapshots, stripInventedTrendPoints, repairEmptySnapshotChangedAccounts } from './historyRebuild'
import { stripEntitiesOutsideWorkspace } from './localStateStorage'
import { getReferenceDate } from './referenceDate'
import { backfillScopeSnapshots } from './snapshotRollup'
import { refreshAllSnapshotMetrics, restorePastSnapshotMetricsFromHistory } from './snapshotRebuild'
import { dedupeSnapshotsByScopeDate } from './snapshots'
import { repairHistoryRecoveredReceipts, recoverLivingCostsFromHistory } from './workspaceRecovery'

function withDedupedSnapshots(state: AppState): AppState {
  const snapshots = dedupeSnapshotsByScopeDate(state.snapshots)
  if (snapshots.length === state.snapshots.length) return state
  return { ...state, snapshots }
}

/** Align stored metrics for display without inventing past Trends from live balances. */
export function normalizeWorkspaceStateForDisplay(state: AppState, now = new Date().toISOString()): AppState {
  const scoped = stripEntitiesOutsideWorkspace(state)
  const grouped = ensureGroupStructure(scoped)
  const withHistoryLogs = stripInventedTrendPoints(reconstructHistoryRecordsFromSnapshots(grouped))
  const repairedReceipts = recoverLivingCostsFromHistory(repairHistoryRecoveredReceipts(withHistoryLogs).state)
  const repaired = withDedupedSnapshots(repairEmptySnapshotChangedAccounts(repairedReceipts))
  const restored = restorePastSnapshotMetricsFromHistory(repaired, now)
  const refreshed = refreshAllSnapshotMetrics(restored, now)
  if (refreshed.workspaceOrigin === 'builtin-demo') {
    return applyDemoOperatingSnapshot(refreshed, getReferenceDate())
  }
  return stripEntitiesOutsideWorkspace(refreshed)
}

/** Backfill missing scope snapshots and align stored metrics after load or import. */
export function normalizeWorkspaceState(state: AppState, now = new Date().toISOString()): AppState {
  const scoped = stripEntitiesOutsideWorkspace(state)
  const grouped = ensureGroupStructure(scoped)
  const withHistoryLogs = stripInventedTrendPoints(reconstructHistoryRecordsFromSnapshots(grouped))
  const repairedReceipts = recoverLivingCostsFromHistory(repairHistoryRecoveredReceipts(withHistoryLogs).state)
  const repaired = withDedupedSnapshots(repairEmptySnapshotChangedAccounts(repairedReceipts))
  // Restore frozen History captures before backfill so we do not push poisoned past rows.
  const restored = restorePastSnapshotMetricsFromHistory(repaired, now)
  const withBackfill = backfillScopeSnapshots(restored, now)
  const refreshed = refreshAllSnapshotMetrics(withBackfill, now)
  if (refreshed.workspaceOrigin === 'builtin-demo') {
    return applyDemoOperatingSnapshot(refreshed, getReferenceDate())
  }
  return stripEntitiesOutsideWorkspace(refreshed)
}
