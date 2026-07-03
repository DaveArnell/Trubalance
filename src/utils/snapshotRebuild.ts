import type { AppState, BalanceSnapshot, Commitment, ViewScope } from '../types'
import { roundCurrency } from './amounts'
import { getActiveAccrualPeriod } from './commitmentCalculations'
import { computeScopeMetricsAtDate } from './historyRebuild'
import type { HistoryMetricKey } from './historyTable'
import { getParentScopesForSnapshot } from './historyTable'
import { getReferenceDate, dateToKey } from './referenceDate'
import { isSnapshotMetricCorrected } from './snapshotCorrections'

function scopeKey(scope: ViewScope): string {
  return `${scope.type}:${scope.id}`
}

function maxDateKey(a: string, b: string): string {
  return a >= b ? a : b
}

/**
 * First calendar date from which a commitment change should rebuild saved snapshots.
 * Monthly costs use the start of the active accrual month; planned costs use funding start / created date.
 */
export function getCommitmentRebuildFromDateKey(
  commitment: Commitment,
  asOf: Date = getReferenceDate(),
): string {
  if (commitment.schedule === 'monthly') {
    const period = getActiveAccrualPeriod(commitment, asOf)
    const periodStart = period
      ? `${period}-01`
      : `${asOf.getFullYear()}-${String(asOf.getMonth() + 1).padStart(2, '0')}-01`
    const created = commitment.createdAt?.slice(0, 10)
    return created ? maxDateKey(periodStart, created) : periodStart
  }

  if (commitment.schedule === 'planned') {
    return (
      commitment.fundingStartDate ??
      commitment.createdAt?.slice(0, 10) ??
      commitment.plannedDueDate?.slice(0, 10) ??
      dateToKey(asOf)
    )
  }

  return commitment.createdAt?.slice(0, 10) ?? dateToKey(asOf)
}

/** Rebuild history when a paid amount differs from what was due (from when the cost was added). */
export function getCommitmentHistoricCorrectionFromDateKey(commitment: Commitment): string {
  const created = commitment.createdAt?.slice(0, 10)
  if (created) return created
  return getCommitmentRebuildFromDateKey(commitment)
}

/** Rebuild from the earliest period corrected in a per-month amount override patch. */
export function getCommitmentRebuildFromPeriodOverridePatch(
  commitment: Commitment,
  patch: Partial<Commitment>,
): string | null {
  if (!patch.periodAmountOverrides) return null
  const periods = Object.keys(patch.periodAmountOverrides).sort()
  if (periods.length === 0) return null
  const periodStart = `${periods[0]!}-01`
  const created = commitment.createdAt?.slice(0, 10)
  return created ? maxDateKey(periodStart, created) : periodStart
}

const SNAPSHOT_METRICS: HistoryMetricKey[] = ['cash', 'committedFunds', 'expectedReceipts', 'trueBalance']

export function refreshSnapshotMetricsAt(
  snapshot: BalanceSnapshot,
  state: AppState,
  now: string,
): BalanceSnapshot {
  const scope: ViewScope = { type: snapshot.scopeType, id: snapshot.scopeId }
  const computed = computeScopeMetricsAtDate(state, scope, snapshot.date)
  const next: BalanceSnapshot = { ...snapshot, updatedAt: now }

  for (const metric of SNAPSHOT_METRICS) {
    if (!isSnapshotMetricCorrected(snapshot, metric)) {
      next[metric] = computed[metric]
    }
  }

  return next
}

/** Recompute every saved snapshot so Trends matches History after load or bulk fixes. */
export function refreshAllSnapshotMetrics(state: AppState, now: string): AppState {
  if (state.snapshots.length === 0) return state
  return {
    ...state,
    snapshots: state.snapshots.map((snapshot) => refreshSnapshotMetricsAt(snapshot, state, now)),
  }
}

/** Recompute committed funds and true balance on every saved snapshot from a date forward. */
export function rebuildSnapshotsFromDate(
  state: AppState,
  fromDateKey: string,
  scopes: ViewScope[],
  now: string,
): AppState {
  if (scopes.length === 0) return state

  const scopeKeys = new Set(scopes.map(scopeKey))

  const snapshots = state.snapshots.map((snapshot) => {
    if (snapshot.date < fromDateKey) return snapshot
    if (!scopeKeys.has(scopeKey({ type: snapshot.scopeType, id: snapshot.scopeId }))) {
      return snapshot
    }
    return refreshSnapshotMetricsAt(snapshot, state, now)
  })

  return { ...state, snapshots }
}

function pairedMetric(metric: HistoryMetricKey): HistoryMetricKey | null {
  if (metric === 'trueBalance') return 'committedFunds'
  if (metric === 'committedFunds') return 'trueBalance'
  return null
}

/** Carry a manual correction forward so later balance-log rows stay consistent. */
export function propagateSnapshotMetricDelta(
  snapshots: BalanceSnapshot[],
  target: BalanceSnapshot,
  metric: HistoryMetricKey,
  delta: number,
  state: AppState,
  now: string,
): BalanceSnapshot[] {
  if (delta === 0) return snapshots

  const affectedScopes: ViewScope[] = [
    { type: target.scopeType, id: target.scopeId },
    ...getParentScopesForSnapshot(state, target),
  ]
  const scopeKeys = new Set(affectedScopes.map(scopeKey))
  const paired = pairedMetric(metric)

  return snapshots.map((snapshot) => {
    if (snapshot.date < target.date) return snapshot
    if (snapshot.id === target.id) return snapshot
    if (!scopeKeys.has(scopeKey({ type: snapshot.scopeType, id: snapshot.scopeId }))) {
      return snapshot
    }

    const next: BalanceSnapshot = {
      ...snapshot,
      [metric]: roundCurrency(snapshot[metric] + delta),
      updatedAt: now,
    }

    if (paired) {
      next[paired] = roundCurrency(snapshot[paired] - delta)
    }

    return next
  })
}
