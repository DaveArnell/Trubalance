import type { AppState, ViewScope } from '../types'
import { getBusinessIdsForScope, getVenueIdsForScope } from './scope'
import { getReferenceDate, getReferenceDateKey } from './referenceDate'
import { alignSnapshotsWithBalanceLogRollup } from './historyTable'
import { getEffectiveSnapshotsForScope } from './scopeSnapshotSeries'
import { getEffectiveSnapshotMetric } from './snapshotMetrics'

function dateKeyOffset(days: number, from: Date = getReferenceDate()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfMonthKey(from: Date = getReferenceDate()): string {
  const y = from.getFullYear()
  const m = String(from.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function daysBetweenKeys(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const aDate = Date.UTC(ay!, am! - 1, ad!)
  const bDate = Date.UTC(by!, bm! - 1, bd!)
  return Math.round((bDate - aDate) / (1000 * 60 * 60 * 24))
}

/**
 * Latest snapshot on or before targetDate — but only if it is close enough to
 * that target. After a Trends wipe, stale group points weeks/months earlier must
 * not invent a huge “Up this week/month” vs today’s live balance.
 */
function snapshotNearTarget(
  snapshots: { date: string; trueBalance: number }[],
  targetDate: string,
  maxGapDays: number,
): number | null {
  let best: { date: string; trueBalance: number } | null = null
  for (const snap of snapshots) {
    if (snap.date <= targetDate) best = snap
  }
  if (!best) return null
  if (daysBetweenKeys(best.date, targetDate) > maxGapDays) return null
  return best.trueBalance
}

/** Dates that have real living coverage under this view (not orphan parent-only history). */
function datesWithLivingCoverage(state: AppState, viewScope: ViewScope): Set<string> | null {
  if (viewScope.type === 'venue') return null

  const dates = new Set<string>()
  if (viewScope.type === 'group') {
    const businessIds = new Set(getBusinessIdsForScope(state, viewScope))
    for (const snap of state.snapshots) {
      if (snap.scopeType === 'business' && businessIds.has(snap.scopeId)) dates.add(snap.date)
    }
    for (const record of state.historyRecords ?? []) {
      if (record.viewScope.type === 'business' && businessIds.has(record.viewScope.id)) {
        dates.add(record.date)
      }
    }
  } else if (viewScope.type === 'business') {
    const venueIds = new Set(getVenueIdsForScope(state, viewScope))
    for (const snap of state.snapshots) {
      if (snap.scopeType === 'business' && snap.scopeId === viewScope.id) dates.add(snap.date)
      if (snap.scopeType === 'venue' && venueIds.has(snap.scopeId)) dates.add(snap.date)
    }
    for (const record of state.historyRecords ?? []) {
      if (record.viewScope.type === 'business' && record.viewScope.id === viewScope.id) {
        dates.add(record.date)
      }
      if (record.viewScope.type === 'venue' && venueIds.has(record.viewScope.id)) {
        dates.add(record.date)
      }
    }
  }

  return dates.size > 0 ? dates : null
}

export interface BalancePositionDeltas {
  weekChange: number | null
  monthChange: number | null
}

/**
 * Cash Prophet Balance change vs ~7 days ago and vs start of this month.
 * Uses the same child rollup as the Trends balance log Total, so a group
 * cannot show “down this week” while every business underneath is up.
 */
export function getBalancePositionDeltas(
  state: AppState,
  viewScope: ViewScope,
  currentTrueBalance: number,
): BalancePositionDeltas {
  const raw = getEffectiveSnapshotsForScope(state, viewScope, viewScope)
  const withEffective = raw.map((snap) => ({
    ...snap,
    trueBalance: getEffectiveSnapshotMetric(state, snap, 'trueBalance'),
  }))
  const aligned = alignSnapshotsWithBalanceLogRollup(
    state,
    viewScope,
    'all',
    viewScope,
    withEffective,
    'trueBalance',
    'daily',
  )

  const livingDates = datesWithLivingCoverage(state, viewScope)
  const series = aligned
    .filter((snap) => (livingDates ? livingDates.has(snap.date) : true))
    .map((snap) => ({
      date: snap.date,
      trueBalance: snap.trueBalance,
    }))

  if (series.length === 0) {
    return { weekChange: null, monthChange: null }
  }

  // Builtin demos: compare authored points only — never mix a live CPB with snapshot history.
  const current =
    state.workspaceOrigin === 'builtin-demo'
      ? (snapshotNearTarget(series, getReferenceDateKey(), 0) ?? currentTrueBalance)
      : currentTrueBalance

  const today = getReferenceDateKey()
  const hasHistoryBeforeToday = series.some((s) => s.date < today)

  // Allow a few days of slack (weekends / missed saves) but not a multi-week gap
  // back to wiped or orphan group history.
  const weekBaseline = snapshotNearTarget(series, dateKeyOffset(-7), 3)
  const monthBaseline = snapshotNearTarget(series, startOfMonthKey(), 3)

  return {
    weekChange:
      hasHistoryBeforeToday && weekBaseline != null ? current - weekBaseline : null,
    monthChange:
      hasHistoryBeforeToday && monthBaseline != null ? current - monthBaseline : null,
  }
}

export function formatPositionChange(change: number): string {
  const abs = Math.abs(change)
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(abs)
  if (change > 0) return `Up ${formatted}`
  if (change < 0) return `Down ${formatted}`
  return 'Unchanged'
}
