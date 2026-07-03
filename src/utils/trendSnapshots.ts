import type { AppState, GraphRange, ViewScope } from '../types'
import type { BreakdownColumn } from './breakdownTable'
import { computeTrendStats, filterSnapshotsByRange } from './snapshots'
import { getEffectiveSnapshotsForScope } from './scopeSnapshotSeries'

export function getTrendSnapshotsForScope(
  state: AppState,
  scope: ViewScope,
  viewScope: ViewScope,
  range: GraphRange,
) {
  return filterSnapshotsByRange(getEffectiveSnapshotsForScope(state, scope, viewScope), range)
}

export function buildColumnTrends(
  state: AppState,
  viewScope: ViewScope,
  columns: BreakdownColumn[],
  range: GraphRange,
): Record<string, ReturnType<typeof computeTrendStats>> {
  const trends: Record<string, ReturnType<typeof computeTrendStats>> = {}
  for (const col of columns) {
    const snapshots = getTrendSnapshotsForScope(state, col.scope, viewScope, range)
    trends[col.key] = computeTrendStats(snapshots, range)
  }
  return trends
}
