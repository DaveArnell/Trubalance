import type { AppState, ViewScope } from '../types'
import { getReferenceDate, getReferenceDateKey } from './referenceDate'
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

/** Snapshot on or before target date (latest). */
function snapshotOnOrBefore(
  snapshots: { date: string; trueBalance: number }[],
  targetDate: string,
): number | null {
  let best: number | null = null
  for (const snap of snapshots) {
    if (snap.date <= targetDate) best = snap.trueBalance
  }
  return best
}

export interface BalancePositionDeltas {
  weekChange: number | null
  monthChange: number | null
}

/**
 * Cash Prophet Balance change vs ~7 days ago and vs start of this month,
 * using the scoped snapshot series (stored + derived).
 */
export function getBalancePositionDeltas(
  state: AppState,
  viewScope: ViewScope,
  currentTrueBalance: number,
): BalancePositionDeltas {
  const series = getEffectiveSnapshotsForScope(state, viewScope, viewScope).map((snap) => ({
    date: snap.date,
    trueBalance: getEffectiveSnapshotMetric(state, snap, 'trueBalance'),
  }))

  if (series.length === 0) {
    return { weekChange: null, monthChange: null }
  }

  const weekBaseline = snapshotOnOrBefore(series, dateKeyOffset(-7))
  const monthBaseline = snapshotOnOrBefore(series, startOfMonthKey())

  // If the only point is today, week/month deltas aren't meaningful yet.
  const today = getReferenceDateKey()
  const hasHistoryBeforeToday = series.some((s) => s.date < today)

  return {
    weekChange:
      hasHistoryBeforeToday && weekBaseline != null ? currentTrueBalance - weekBaseline : null,
    monthChange:
      hasHistoryBeforeToday && monthBaseline != null ? currentTrueBalance - monthBaseline : null,
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
