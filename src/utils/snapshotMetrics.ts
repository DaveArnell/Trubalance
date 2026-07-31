import type { AppState, BalanceSnapshot } from '../types'
import { computeScopeMetricsAtDate, getExactHistorySummaryForScopeDate } from './historyRebuild'
import { isSnapshotMetricCorrected } from './snapshotCorrections'
import { isPersistedSnapshot } from './scopeSnapshotSeries'
import type { HistoryMetricKey } from './historyTable'
import { todayDateKey } from './snapshots'

const METRIC_KEYS: HistoryMetricKey[] = ['cash', 'committedFunds', 'expectedReceipts', 'trueBalance']

/** Demo snapshots are authored trend data — keep stored metrics instead of live recompute. */
function useStoredDemoSnapshotMetrics(state: AppState, snapshot: BalanceSnapshot): boolean {
  return state.workspaceOrigin === 'builtin-demo' && isPersistedSnapshot(snapshot)
}

/** Metric value for display — recomputed from current data unless manually set or a past saved point. */
export function getEffectiveSnapshotMetric(
  state: AppState,
  snapshot: BalanceSnapshot,
  metric: HistoryMetricKey,
): number {
  if (isSnapshotMetricCorrected(snapshot, metric) || snapshot.manualEntry) {
    return snapshot[metric]
  }
  // Demo Trends are authored for a calm Available story — never recompute from accruals.
  if (useStoredDemoSnapshotMetrics(state, snapshot)) {
    return snapshot[metric]
  }
  // Past saved Trends points stay as recorded that day. Paying a bill or updating today's
  // bank must not rewrite yesterday's chart (live recompute still applies to today).
  if (isPersistedSnapshot(snapshot) && snapshot.date < todayDateKey()) {
    return snapshot[metric]
  }
  const scope = { type: snapshot.scopeType, id: snapshot.scopeId } as const
  const computed = computeScopeMetricsAtDate(state, scope, snapshot.date)[metric]

  const saved = getExactHistorySummaryForScopeDate(state, scope, snapshot.date)
  if (saved && computed === 0 && saved[metric] !== 0) {
    return saved[metric]
  }

  return computed
}

/** Snapshot with metrics aligned to History page calculations (preserves manual corrections). */
export function withEffectiveSnapshotMetrics(
  state: AppState,
  snapshot: BalanceSnapshot,
): BalanceSnapshot {
  if (snapshot.manualEntry) return { ...snapshot }

  const next = { ...snapshot }
  for (const metric of METRIC_KEYS) {
    if (!isSnapshotMetricCorrected(snapshot, metric)) {
      next[metric] = getEffectiveSnapshotMetric(state, snapshot, metric)
    }
  }
  return next
}
