import type { AppState, BalanceSnapshot } from '../types'
import { computeScopeMetricsAtDate, getExactHistorySummaryForScopeDate } from './historyRebuild'
import { isSnapshotMetricCorrected } from './snapshotCorrections'
import { isPersistedSnapshot } from './scopeSnapshotSeries'
import type { HistoryMetricKey } from './historyTable'

const METRIC_KEYS: HistoryMetricKey[] = ['cash', 'committedFunds', 'expectedReceipts', 'trueBalance']

/** Demo snapshots are authored trend data — keep stored metrics instead of live recompute. */
function useStoredDemoSnapshotMetrics(state: AppState, snapshot: BalanceSnapshot): boolean {
  return state.workspaceOrigin === 'builtin-demo' && isPersistedSnapshot(snapshot)
}

/** Metric value for display — recomputed from current data unless manually corrected. */
export function getEffectiveSnapshotMetric(
  state: AppState,
  snapshot: BalanceSnapshot,
  metric: HistoryMetricKey,
): number {
  if (isSnapshotMetricCorrected(snapshot, metric)) {
    return snapshot[metric]
  }
  if (useStoredDemoSnapshotMetrics(state, snapshot) && snapshot[metric] !== 0) {
    return snapshot[metric]
  }
  const scope = { type: snapshot.scopeType, id: snapshot.scopeId } as const
  const computed = computeScopeMetricsAtDate(state, scope, snapshot.date)[metric]

  const saved = getExactHistorySummaryForScopeDate(state, scope, snapshot.date)
  if (saved && computed === 0 && saved[metric] !== 0) {
    return saved[metric]
  }

  if (
    isPersistedSnapshot(snapshot) &&
    computed === 0 &&
    snapshot[metric] !== 0
  ) {
    return snapshot[metric]
  }
  return computed
}

/** Snapshot with metrics aligned to History page calculations (preserves manual corrections). */
export function withEffectiveSnapshotMetrics(
  state: AppState,
  snapshot: BalanceSnapshot,
): BalanceSnapshot {
  const next = { ...snapshot }
  for (const metric of METRIC_KEYS) {
    if (!isSnapshotMetricCorrected(snapshot, metric)) {
      next[metric] = getEffectiveSnapshotMetric(state, snapshot, metric)
    }
  }
  return next
}
