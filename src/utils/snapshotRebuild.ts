import type { AppState, BalanceSnapshot, Commitment, ViewScope } from '../types'
import { getActiveAccrualPeriod } from './commitmentCalculations'
import { computeScopeMetricsAtDate, getExactHistorySummaryForScopeDate } from './historyRebuild'
import type { HistoryMetricKey } from './historyTable'
import { getReferenceDate, dateToKey } from './referenceDate'
import { isSnapshotMetricCorrected } from './snapshotCorrections'
import { todayDateKey } from './snapshots'

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
  options?: { allowPastRewrite?: boolean },
): BalanceSnapshot {
  // Hand-entered points keep the typed values — never overwrite with live recompute.
  if (snapshot.manualEntry) {
    return { ...snapshot, updatedAt: now }
  }

  // Past Trends stay as saved unless this is an intentional historic correction
  // (e.g. received/paid amount changed from when the item was first added).
  if (snapshot.date < todayDateKey() && !options?.allowPastRewrite) {
    return snapshot
  }

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
  // Builtin demos ship an authored Available Balance series for sales — do not overwrite
  // it with live accrual math (that makes Trends look violently spiky).
  if (state.workspaceOrigin === 'builtin-demo') return state
  if (state.snapshots.length === 0) return state
  return {
    ...state,
    snapshots: state.snapshots.map((snapshot) => refreshSnapshotMetricsAt(snapshot, state, now)),
  }
}

/**
 * Recover past Trends totals that were rewritten by load/backfill using today's cash.
 * History capture summaries are the authoritative frozen day totals.
 */
export function restorePastSnapshotMetricsFromHistory(state: AppState, now: string): AppState {
  if (state.workspaceOrigin === 'builtin-demo') return state
  if (state.snapshots.length === 0) return state

  const today = todayDateKey()
  let changed = false
  const snapshots = state.snapshots.map((snapshot) => {
    if (snapshot.date >= today || snapshot.manualEntry) return snapshot

    const scope: ViewScope = { type: snapshot.scopeType, id: snapshot.scopeId }
    const summary = getExactHistorySummaryForScopeDate(state, scope, snapshot.date)
    if (!summary) return snapshot

    const next = { ...snapshot }
    let touched = false
    for (const metric of SNAPSHOT_METRICS) {
      if (isSnapshotMetricCorrected(snapshot, metric)) continue
      if (next[metric] === summary[metric]) continue
      next[metric] = summary[metric]
      touched = true
    }
    if (!touched) return snapshot
    changed = true
    next.updatedAt = now
    return next
  })

  return changed ? { ...state, snapshots } : state
}

/** Rebuild history when commitments change — never rewrite builtin demo sales trends. */
export function rebuildSnapshotsFromDate(
  state: AppState,
  fromDateKey: string,
  scopes: ViewScope[],
  now: string,
): AppState {
  if (state.workspaceOrigin === 'builtin-demo') return state
  if (scopes.length === 0) return state

  const scopeKeys = new Set(scopes.map(scopeKey))
  // Intentional corrections pass a fromDate in the past (install/created day).
  // Mark-paid/received with no amount change uses today — past points stay frozen.
  const allowPastRewrite = fromDateKey < todayDateKey()

  const snapshots = state.snapshots.map((snapshot) => {
    if (snapshot.date < fromDateKey) return snapshot
    if (!scopeKeys.has(scopeKey({ type: snapshot.scopeType, id: snapshot.scopeId }))) {
      return snapshot
    }
    return refreshSnapshotMetricsAt(snapshot, state, now, { allowPastRewrite })
  })

  return { ...state, snapshots }
}
