import type { AppState, BalanceSnapshot, GraphRange, HistoryGranularity, ViewScope } from '../types'
import { CHART_COLORS, getChartScopeOptions, scopeKey, type ChartScopeOption } from './chartScopes'
import { hasSharedScopeCosts } from './breakdownTable'
import { roundCurrency } from './amounts'
import { filterSnapshotsByRange } from './snapshots'
import { getEffectiveSnapshotsForScope } from './scopeSnapshotSeries'
import { isSnapshotMetricCorrected, getSnapshotRecordedMetric } from './snapshotCorrections'
import { getEffectiveSnapshotMetric } from './snapshotMetrics'
import { isPersistedSnapshot } from './scopeSnapshotSeries'

export type HistoryMetricKey = 'trueBalance' | 'cash' | 'committedFunds' | 'expectedReceipts'

export interface HistoryColumn {
  key: string
  label: string
  level: ChartScopeOption['level']
  color: string
  isTotal: boolean
  isShared?: boolean
}

export interface HistoryRow {
  date: string
  values: Record<string, HistoryCellData>
}

export interface HistoryCellData {
  value: number | null
  snapshotId: string | null
  /** Value as originally recorded, when manually corrected. */
  recordedValue: number | null
}

function metricValue(
  state: AppState,
  snapshot: BalanceSnapshot,
  metric: HistoryMetricKey,
): number {
  return getEffectiveSnapshotMetric(state, snapshot, metric)
}

function sharedColumnKey(viewScope: ViewScope): string {
  return `${scopeKey(viewScope)}-shared`
}

export function getParentScopesForSnapshot(state: AppState, snap: BalanceSnapshot): ViewScope[] {
  const parents: ViewScope[] = []

  if (snap.scopeType === 'venue') {
    const venue = state.venues.find((v) => v.id === snap.scopeId)
    if (!venue) return parents
    parents.push({ type: 'business', id: venue.businessId })
    const business = state.businesses.find((b) => b.id === venue.businessId)
    if (business) parents.push({ type: 'group', id: business.groupId })
    return parents
  }

  if (snap.scopeType === 'business') {
    const business = state.businesses.find((b) => b.id === snap.scopeId)
    if (business) parents.push({ type: 'group', id: business.groupId })
  }

  return parents
}

export function getHistoryColumns(state: AppState, viewScope: ViewScope): HistoryColumn[] {
  const options = getChartScopeOptions(state, viewScope)
  const totalKey = scopeKey(viewScope)

  if (viewScope.type === 'venue') {
    const col = options.find((o) => o.key === totalKey) ?? options[options.length - 1]
    return [
      {
        key: col.key,
        label: col.label,
        level: col.level,
        color: CHART_COLORS[0],
        isTotal: true,
      },
    ]
  }

  const detailLevels: ChartScopeOption['level'][] =
    viewScope.type === 'group' ? ['business'] : ['venue']

  const details = options.filter((o) => o.key !== totalKey && detailLevels.includes(o.level))
  const total = options.find((o) => o.key === totalKey)

  const columns: HistoryColumn[] = details.map((col, idx) => ({
    key: col.key,
    label: col.label,
    level: col.level,
    color: CHART_COLORS[(idx + 1) % CHART_COLORS.length],
    isTotal: false,
  }))

  if (hasSharedScopeCosts(state, viewScope)) {
    columns.push({
      key: sharedColumnKey(viewScope),
      label: viewScope.type === 'group' ? 'GROUP' : 'SHARED',
      level: viewScope.type,
      color: CHART_COLORS[(details.length + 1) % CHART_COLORS.length],
      isTotal: false,
      isShared: true,
    })
  }

  if (total) {
    columns.push({
      key: total.key,
      label: viewScope.type === 'group' ? 'Total' : total.label,
      level: total.level,
      color: CHART_COLORS[0],
      isTotal: true,
    })
  }

  return columns
}

export function formatHistoryDate(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function mondayOfWeek(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dayNum = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dayNum}`
}

function monthPeriodKey(dateKey: string): string {
  return dateKey.slice(0, 7)
}

function periodKeyForDate(dateKey: string, granularity: HistoryGranularity): string {
  if (granularity === 'daily') return dateKey
  if (granularity === 'monthly') return monthPeriodKey(dateKey)
  return mondayOfWeek(dateKey)
}

export function formatHistoryPeriod(dateKey: string, granularity: HistoryGranularity): string {
  if (granularity === 'daily') return formatHistoryDate(dateKey)
  if (granularity === 'monthly') {
    const d = new Date(dateKey + '-01T12:00:00')
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }
  const start = new Date(dateKey + 'T12:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const startLabel = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endLabel = end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: start.getFullYear() === end.getFullYear() ? undefined : 'numeric',
  })
  return `${startLabel} – ${endLabel}`
}

function cellFromSnapshot(
  state: AppState,
  snap: BalanceSnapshot | undefined,
  metric: HistoryMetricKey,
  granularity: HistoryGranularity,
): HistoryCellData {
  if (!snap) return { value: null, snapshotId: null, recordedValue: null }
  const corrected = isSnapshotMetricCorrected(snap, metric)
  return {
    value: metricValue(state, snap, metric),
    snapshotId:
      granularity === 'daily' && isPersistedSnapshot(snap) ? snap.id : null,
    recordedValue: corrected ? getSnapshotRecordedMetric(snap, metric) : null,
  }
}

/** Use the latest snapshot date within a period so every column reflects the same day. */
function alignedSnapshotsForPeriod(
  snapshotsByKey: Map<string, BalanceSnapshot[]>,
  scopeColumnKeys: string[],
  period: string,
  granularity: HistoryGranularity,
): Map<string, BalanceSnapshot | undefined> {
  let anchorDate: string | null = null

  for (const key of scopeColumnKeys) {
    for (const snap of snapshotsByKey.get(key) ?? []) {
      if (periodKeyForDate(snap.date, granularity) !== period) continue
      if (!anchorDate || snap.date > anchorDate) anchorDate = snap.date
    }
  }

  const aligned = new Map<string, BalanceSnapshot | undefined>()
  if (!anchorDate) return aligned

  for (const key of scopeColumnKeys) {
    aligned.set(
      key,
      (snapshotsByKey.get(key) ?? []).find((snap) => snap.date === anchorDate),
    )
  }

  return aligned
}

function rollupTotalValue(
  values: Record<string, HistoryCellData>,
  columns: HistoryColumn[],
): number | null {
  const detailColumns = columns.filter((col) => !col.isTotal && !col.isShared)
  const sharedColumns = columns.filter((col) => col.isShared)
  const totalColumn = columns.find((col) => col.isTotal)

  const detailValues = detailColumns.map((col) => values[col.key]?.value ?? null)
  if (detailValues.every((value) => value != null)) {
    const sharedSum = sharedColumns.reduce((sum, col) => sum + (values[col.key]?.value ?? 0), 0)
    return roundCurrency(detailValues.reduce((sum, value) => sum + value!, 0) + sharedSum)
  }

  return totalColumn?.key ? values[totalColumn.key]?.value ?? null : null
}

export function buildHistoryTable(
  state: AppState,
  viewScope: ViewScope,
  range: GraphRange,
  metric: HistoryMetricKey = 'trueBalance',
  granularity: HistoryGranularity = 'daily',
): { columns: HistoryColumn[]; rows: HistoryRow[] } {
  const columns = getHistoryColumns(state, viewScope)
  if (columns.length === 0) return { columns, rows: [] }

  const totalKey = scopeKey(viewScope)
  const detailColumns = columns.filter((col) => !col.isTotal && !col.isShared)
  const sharedColumns = columns.filter((col) => col.isShared)
  const scopeColumnKeys = [
    ...detailColumns.map((col) => col.key),
    ...(columns.some((col) => col.isTotal) ? [totalKey] : []),
  ]

  const snapshotsByKey = new Map<string, BalanceSnapshot[]>()
  for (const key of scopeColumnKeys) {
    const opt = getChartScopeOptions(state, viewScope).find((o) => scopeKey(o.scope) === key)
    if (!opt) continue
    snapshotsByKey.set(
      key,
      filterSnapshotsByRange(getEffectiveSnapshotsForScope(state, opt.scope, viewScope), range),
    )
  }

  const periodSet = new Set<string>()
  for (const snaps of snapshotsByKey.values()) {
    for (const snap of snaps) {
      periodSet.add(periodKeyForDate(snap.date, granularity))
    }
  }

  const rows: HistoryRow[] = [...periodSet]
    .sort((a, b) => a.localeCompare(b))
    .map((period) => {
      const aligned = alignedSnapshotsForPeriod(snapshotsByKey, scopeColumnKeys, period, granularity)
      const values: Record<string, HistoryCellData> = {}

      for (const col of detailColumns) {
        values[col.key] = cellFromSnapshot(state, aligned.get(col.key), metric, granularity)
      }

      const parentSnap = aligned.get(totalKey)
      const detailSnaps = detailColumns
        .map((col) => aligned.get(col.key))
        .filter((snap): snap is BalanceSnapshot => snap !== undefined)

      for (const col of sharedColumns) {
        if (parentSnap && detailSnaps.length === detailColumns.length) {
          const childSum = detailSnaps.reduce(
            (sum, snap) => sum + metricValue(state, snap, metric),
            0,
          )
          values[col.key] = {
            value: roundCurrency(metricValue(state, parentSnap, metric) - childSum),
            snapshotId: null,
            recordedValue: null,
          }
        } else {
          values[col.key] = { value: null, snapshotId: null, recordedValue: null }
        }
      }

      if (columns.some((col) => col.isTotal)) {
        values[totalKey] = cellFromSnapshot(state, parentSnap, metric, granularity)
        const rolledUp = rollupTotalValue(values, columns)
        if (rolledUp != null) {
          values[totalKey] = {
            ...values[totalKey]!,
            value: rolledUp,
          }
        }
      }

      return { date: period, values }
    })

  return { columns, rows }
}
