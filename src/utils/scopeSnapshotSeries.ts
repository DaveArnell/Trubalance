import type { AppState, BalanceSnapshot, ViewScope } from '../types'
import { getScopeLabel } from './scope'
import { getExactHistorySummaryForScopeDate, getHistoryDatesForViewScope } from './historyRebuild'
import { computeScopeMetricsAtDate } from './historyRebuild'
import { getFreshness, todayDateKey } from './snapshots'
import { withEffectiveSnapshotMetrics } from './snapshotMetrics'

function isDerivedSnapshotId(id: string): boolean {
  return id.startsWith('derived:') || id.startsWith('history:')
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

/** Frozen point from a History-page summary captured that day — never live-recomputed. */
function buildSnapshotFromHistorySummary(
  state: AppState,
  scope: ViewScope,
  date: string,
  summary: { cash: number; committedFunds: number; expectedReceipts: number; trueBalance: number },
): BalanceSnapshot {
  return {
    id: `history:${scope.type}:${scope.id}:${date}`,
    date,
    scopeType: scope.type,
    scopeId: scope.id,
    viewName: getScopeLabel(state, scope),
    cash: summary.cash,
    committedFunds: summary.committedFunds,
    expectedReceipts: summary.expectedReceipts,
    trueBalance: summary.trueBalance,
    freshness: getFreshness(0),
    changedAccounts: [],
    updatedAt: new Date(`${date}T12:00:00`).toISOString(),
  }
}

/**
 * Balance history for any scope in the sidebar tree — uses stored snapshots when present.
 *
 * Past days never use live accrual/due rules (that rewrites history when product math changes).
 * Only today may be recomputed from current data.
 */
export function getEffectiveSnapshotsForScope(
  state: AppState,
  scope: ViewScope,
  viewScope: ViewScope,
): BalanceSnapshot[] {
  const dates = getHistoryDatesForViewScope(state, viewScope)
  if (dates.length === 0) return []
  const today = todayDateKey()

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

      // Historic days: freeze to what was saved that day — never invent with today's rules.
      // Prefer History-page summary when present (snapshots may have been live-refreshed earlier).
      if (date < today) {
        const hist = getExactHistorySummaryForScopeDate(state, scope, date)
        if (hist) return buildSnapshotFromHistorySummary(state, scope, date, hist)
        if (stored && isPersistedSnapshot(stored)) {
          return { ...stored }
        }
        return null
      }

      // Today: live recompute is intentional.
      const derived = buildDerivedSnapshot(state, scope, date)
      if (!stored) return derived

      if (stored.manualEntry || stored.recordedValues?.trueBalance !== undefined) {
        return withEffectiveSnapshotMetrics(state, stored)
      }

      const display = withEffectiveSnapshotMetrics(state, stored)
      if (display.trueBalance === 0 && derived.trueBalance !== 0) {
        return derived
      }
      return display
    })
    .filter((snap): snap is BalanceSnapshot => snap != null)
    .sort((a, b) => a.date.localeCompare(b.date))
}
