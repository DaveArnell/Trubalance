import type { AppState, BalanceSnapshot, ViewScope } from '../types'
import { getScopeLabel } from './scope'
import { getHistoryDatesForViewScope } from './historyRebuild'
import { computeScopeMetricsAtDate } from './historyRebuild'
import { getFreshness } from './snapshots'
import { withEffectiveSnapshotMetrics } from './snapshotMetrics'

function isDerivedSnapshotId(id: string): boolean {
  return id.startsWith('derived:')
}

export function isPersistedSnapshot(snapshot: BalanceSnapshot): boolean {
  return !isDerivedSnapshotId(snapshot.id)
}

function buildDerivedSnapshot(
  state: AppState,
  scope: ViewScope,
  date: string,
): BalanceSnapshot {
  const metrics = computeScopeMetricsAtDate(state, scope, date)
  return {
    id: `derived:${scope.type}:${scope.id}:${date}`,
    date,
    scopeType: scope.type,
    scopeId: scope.id,
    viewName: getScopeLabel(state, scope),
    cash: metrics.cash,
    committedFunds: metrics.committedFunds,
    expectedReceipts: metrics.expectedReceipts,
    trueBalance: metrics.trueBalance,
    freshness: getFreshness(0),
    changedAccounts: [],
    updatedAt: new Date(`${date}T12:00:00`).toISOString(),
  }
}

/**
 * Balance history for any scope in the sidebar tree — uses stored snapshots when present,
 * otherwise derives the same metrics as the History page for that day.
 */
export function getEffectiveSnapshotsForScope(
  state: AppState,
  scope: ViewScope,
  viewScope: ViewScope,
): BalanceSnapshot[] {
  const dates = getHistoryDatesForViewScope(state, viewScope)
  if (dates.length === 0) return []

  const storedByDate = new Map(
    state.snapshots
      .filter((snap) => snap.scopeType === scope.type && snap.scopeId === scope.id)
      .map((snap) => [snap.date, snap]),
  )

  return dates
    .map((date) => {
      const stored = storedByDate.get(date)
      if (state.workspaceOrigin === 'builtin-demo') {
        // Only authored demo points — never invent derived days from live accruals.
        return stored && isPersistedSnapshot(stored) ? stored : null
      }

      const derived = buildDerivedSnapshot(state, scope, date)
      if (!stored) return derived

      const display = withEffectiveSnapshotMetrics(state, stored)
      if (display.trueBalance === 0 && derived.trueBalance !== 0) {
        return derived
      }
      return display
    })
    .filter((snap): snap is BalanceSnapshot => snap != null)
    .sort((a, b) => a.date.localeCompare(b.date))
}
