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
  if (snapshot.id.startsWith('derived:') || snapshot.id.startsWith('history:')) return false
  if (snapshot.id.startsWith('split-snap:')) return false
  return true
}

/** Parse `derived:type:id:YYYY-MM-DD` or `history:type:id:YYYY-MM-DD` virtual snapshot ids. */
export function parseVirtualSnapshotId(
  id: string,
): { scope: ViewScope; date: string } | null {
  if (!isDerivedSnapshotId(id)) return null
  const prefix = id.startsWith('derived:') ? 'derived:' : 'history:'
  const rest = id.slice(prefix.length)
  if (rest.length < 12) return null
  const date = rest.slice(-10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const scopeKeyStr = rest.slice(0, -11)
  const colon = scopeKeyStr.indexOf(':')
  if (colon < 0) return null
  return {
    scope: {
      type: scopeKeyStr.slice(0, colon) as ViewScope['type'],
      id: scopeKeyStr.slice(colon + 1),
    },
    date,
  }
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

      // Historic days: prefer a saved snapshot (incl. corrections). Otherwise use the
      // History-page summary for that day. Never invent past days with today's rules.
      if (date < today) {
        if (stored && isPersistedSnapshot(stored)) {
          return withEffectiveSnapshotMetrics(state, stored)
        }
        const hist = getExactHistorySummaryForScopeDate(state, scope, date)
        if (hist) return buildSnapshotFromHistorySummary(state, scope, date, hist)
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
