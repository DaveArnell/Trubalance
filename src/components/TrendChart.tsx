import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppState, BalanceSnapshot, GraphRange, ViewScope } from '../types'
import { chartDashArrayForLevel, chartDotRadiusForLevel, chartStrokeWidthForLevel, getChartScopeOptions, scopeKey } from '../utils/chartScopes'
import { chartColorForScope } from '../utils/businessTheme'
import type { ChartScopeLevel } from '../utils/chartScopes'
import { computeNiceTicks, computeTrendYDomain, formatAxisCurrency, isChartZeroTick } from '../utils/chartFormat'
import { formatCurrency, getCurrencySymbol } from '../utils/format'
import {
  filterSnapshotsByRange,
  formatSnapshotDate,
  formatSnapshotDateLong,
} from '../utils/snapshots'
import { getEffectiveSnapshotsForScope } from '../utils/scopeSnapshotSeries'
import { alignSnapshotsWithBalanceLogRollup } from '../utils/historyTable'
import {
  addDays,
  buildSmoothedTrendSeries,
  canUseSeasonalProjection,
  formatTrendRate,
  projectionHorizonDays,
  type ProjectionMethod,
} from '../utils/trendProjection'
import { HelpButton } from './HelpButton'
import { DayNoteEditor } from './DayNoteEditor'
import { getDayNoteText } from '../utils/dayNotes'
import { getScopeItemLabel } from '../utils/scope'
import { getEffectiveSnapshotMetric, withEffectiveSnapshotMetrics } from '../utils/snapshotMetrics'

type MetricKey = 'trueBalance' | 'cash' | 'committedFunds' | 'expectedReceipts'

const metricConfig: Record<MetricKey, { label: string; shortLabel: string }> = {
  trueBalance: { label: 'True Balance', shortLabel: 'True balance' },
  cash: { label: 'Cash', shortLabel: 'Cash' },
  committedFunds: { label: 'Committed Funds', shortLabel: 'Committed' },
  expectedReceipts: { label: 'Expected Receipts', shortLabel: 'Receipts' },
}

const METRIC_KEYS: MetricKey[] = ['trueBalance', 'cash', 'committedFunds', 'expectedReceipts']

const METRIC_COLORS: Record<MetricKey, string> = {
  trueBalance: '#2563eb',
  cash: '#16a34a',
  committedFunds: '#dc2626',
  expectedReceipts: '#9333ea',
}

const ranges: { key: GraphRange; label: string }[] = [
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '12m', label: '12 months' },
  { key: 'all', label: 'All' },
]

const CHART_WIDTH = 720
const CHART_HEIGHT = 260
const PAD_LEFT = 64
const PAD_RIGHT = 20
const PAD_TOP = 16
const PAD_BOTTOM = 30

interface TrendChartProps {
  state: AppState
  viewScope: ViewScope
  graphRange: GraphRange
  onRangeChange: (range: GraphRange) => void
  focusScope?: ViewScope | null
  onFocusScopeApplied?: () => void
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
  embedded?: boolean
  onSetDayNote?: (date: string, text: string | null, scope: ViewScope) => void
}

interface ChartSeries {
  key: string
  scopeKey: string
  scopeLevel: ChartScopeLevel
  metric: MetricKey
  label: string
  color: string
  strokeWidth: number
  dashArray?: string
  points: Array<{ date: string; x: number; y: number; snapshot: BalanceSnapshot }>
  snapshots: BalanceSnapshot[]
}

interface SeriesProjection {
  key: string
  scopeLevel: ChartScopeLevel
  color: string
  label: string
  smoothedHistorical: Array<{ date: string; x: number; y: number }>
  future: Array<{ date: string; x: number; y: number }>
  futureHigh: Array<{ date: string; x: number; y: number }>
  futureLow: Array<{ date: string; x: number; y: number }>
  effectiveMethod: ProjectionMethod
  slopePerDay: number
}

type ProjectionMode = 'off' | ProjectionMethod

function dateMs(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00`).getTime()
}

function evenlySpacedDateKeys(minDate: string, maxDate: string, count: number): string[] {
  const min = dateMs(minDate)
  const max = dateMs(maxDate)
  if (count <= 1 || max <= min) return [minDate]
  const keys: string[] = []
  for (let i = 0; i < count; i++) {
    const t = min + (i / (count - 1)) * (max - min)
    const d = new Date(t)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    keys.push(`${y}-${m}-${day}`)
  }
  return keys
}

function getMetricValue(snapshot: BalanceSnapshot, metric: MetricKey): number {
  // After withEffectiveSnapshotMetrics + alignSnapshotsWithBalanceLogRollup, use baked-in values.
  // Re-calling getEffectiveSnapshotMetric would ignore History child rollups and wipe corrections.
  return snapshot[metric]
}

export function TrendChart({
  state,
  viewScope,
  graphRange,
  onRangeChange,
  focusScope,
  onFocusScopeApplied,
  openHelp,
  setOpenHelp,
  embedded = false,
  onSetDayNote,
}: TrendChartProps) {
  const scopeOptions = useMemo(() => getChartScopeOptions(state, viewScope), [state, viewScope])
  const currentScopeKey = scopeKey(viewScope)

  const plotWidth = CHART_WIDTH - PAD_LEFT - PAD_RIGHT
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM

  const [enabledMetrics, setEnabledMetrics] = useState<Record<MetricKey, boolean>>(() => ({
    trueBalance: true,
    cash: false,
    committedFunds: false,
    expectedReceipts: false,
  }))
  const [enabledScopes, setEnabledScopes] = useState<Record<string, boolean>>(() => ({
    [currentScopeKey]: true,
  }))
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('off')
  const [pinnedSnapshot, setPinnedSnapshot] = useState<{
    scopeKey: string
    snapshot: BalanceSnapshot
  } | null>(null)
  const [noteEditorDate, setNoteEditorDate] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const scopeOptionKeys = scopeOptions.map((opt) => opt.key).join('|')

  useEffect(() => {
    if (!focusScope) return
    const focusKey = scopeKey(focusScope)
    const next: Record<string, boolean> = {}
    const hasFocus = scopeOptions.some((opt) => opt.key === focusKey)
    for (const opt of scopeOptions) {
      next[opt.key] = hasFocus ? opt.key === focusKey : true
    }
    setEnabledScopes(next)
    setHoverDate(null)
    setPinnedSnapshot(null)
    onFocusScopeApplied?.()
  }, [focusScope, onFocusScopeApplied, scopeOptions])

  useEffect(() => {
    const next: Record<string, boolean> = {}
    const hasCurrentScope = scopeOptions.some((opt) => opt.key === currentScopeKey)
    for (const opt of scopeOptions) {
      next[opt.key] = hasCurrentScope ? opt.key === currentScopeKey : true
    }
    setEnabledScopes(next)
    setHoverDate(null)
    setPinnedSnapshot(null)
  }, [currentScopeKey, scopeOptionKeys])

  const activeScopeKeys = scopeOptions.filter((o) => enabledScopes[o.key]).map((o) => o.key)
  const activeMetricKeys = METRIC_KEYS.filter((key) => enabledMetrics[key])

  const { series, sortedDates, xTickMarks, yTicks, yMin, yMax, zeroY, projections, projectionBoundaryX, seasonalAvailable } =
    useMemo(() => {
    const scopeSeries: ChartSeries[] = []
    const dateSet = new Set<string>()
    const allValues: number[] = []
    const multiMetric = activeMetricKeys.length > 1
    const multiScope = activeScopeKeys.length > 1

    scopeOptions.forEach((opt, scopeIdx) => {
      if (!enabledScopes[opt.key]) return

      const snaps = filterSnapshotsByRange(
        getEffectiveSnapshotsForScope(state, opt.scope, viewScope),
        graphRange,
      )
      let effectiveSnaps = snaps.map((snap) => withEffectiveSnapshotMetrics(state, snap))

      for (const metric of activeMetricKeys) {
        effectiveSnaps = alignSnapshotsWithBalanceLogRollup(
          state,
          viewScope,
          graphRange,
          opt.scope,
          effectiveSnaps,
          metric,
        )
        effectiveSnaps.forEach((s) => {
          dateSet.add(s.date)
          allValues.push(getMetricValue(s, metric))
        })

        const label =
          multiMetric && multiScope
            ? `${opt.label} · ${metricConfig[metric].shortLabel}`
            : multiMetric
              ? metricConfig[metric].label
              : opt.label

        scopeSeries.push({
          key: `${opt.key}:${metric}`,
          scopeKey: opt.key,
          scopeLevel: opt.level,
          metric,
          label,
          color: multiMetric ? METRIC_COLORS[metric] : chartColorForScope(state, opt.scope, scopeIdx),
          strokeWidth: chartStrokeWidthForLevel(opt.level),
          dashArray: chartDashArrayForLevel(opt.level, multiMetric, multiScope, scopeIdx),
          points: [],
          snapshots: effectiveSnaps,
        })

        const seriesEntry = scopeSeries[scopeSeries.length - 1]!
        effectiveSnaps.forEach((s) => {
          seriesEntry.points.push({
            date: s.date,
            x: 0,
            y: 0,
            snapshot: s,
          })
        })
      }
    })

    const sortedDates = [...dateSet].sort()
    const firstDate = sortedDates[0]
    const lastDate = sortedDates[sortedDates.length - 1]
    const snapshotSpanDays =
      firstDate && lastDate
        ? (dateMs(lastDate) - dateMs(firstDate)) / 86_400_000
        : 0
    const horizonDays =
      projectionMode !== 'off' && lastDate
        ? projectionHorizonDays(graphRange, snapshotSpanDays)
        : 0
    const chartMaxDate =
      projectionMode !== 'off' && lastDate ? addDays(lastDate, horizonDays) : lastDate ?? ''
    const minDateMs = firstDate ? dateMs(firstDate) : 0
    const maxDateMs = chartMaxDate ? dateMs(chartMaxDate) : minDateMs

    const xForDate = (date: string) => {
      if (!date || maxDateMs <= minDateMs) return PAD_LEFT + plotWidth / 2
      return PAD_LEFT + ((dateMs(date) - minDateMs) / (maxDateMs - minDateMs)) * plotWidth
    }

    const seriesProjections: Array<{
      key: string
      scopeLevel: ChartScopeLevel
      color: string
      label: string
      slopePerDay: number
      effectiveMethod: ProjectionMethod
      line: NonNullable<ReturnType<typeof buildSmoothedTrendSeries>>
    }> = []
    let seasonalOk = false

    if (projectionMode !== 'off' && horizonDays > 0) {
      for (const entry of scopeSeries) {
        if (entry.snapshots.length < 2) continue
        if (canUseSeasonalProjection(entry.snapshots)) seasonalOk = true
        const line = buildSmoothedTrendSeries({
          snapshots: entry.snapshots,
          metric: entry.metric,
          method: projectionMode,
          horizonDays,
        })
        if (!line) continue
        if (line.effectiveMethod === 'seasonal') seasonalOk = true
        seriesProjections.push({
          key: entry.key,
          scopeLevel: entry.scopeLevel,
          color: entry.color,
          label: entry.label,
          slopePerDay: line.slopePerDay,
          effectiveMethod: line.effectiveMethod,
          line,
        })
        for (const point of line.historical) allValues.push(point.value)
        for (const point of line.forecast) allValues.push(point.value)
        for (const point of line.forecastHigh) allValues.push(point.value)
        for (const point of line.forecastLow) allValues.push(point.value)
      }
    }

    const minVal = allValues.length ? Math.min(...allValues) : 0
    const maxVal = allValues.length ? Math.max(...allValues) : 1
    const { yMin, yMax } = computeTrendYDomain(minVal, maxVal)
    const yTicks = computeNiceTicks(yMin, yMax, 5)

    const yForValue = (v: number) => {
      const range = yMax - yMin || 1
      const norm = (v - yMin) / range
      return PAD_TOP + (1 - norm) * plotHeight
    }

    const zeroY = yMin <= 0 && yMax >= 0 ? yForValue(0) : null

    const projections: SeriesProjection[] = seriesProjections.map((entry) => ({
      key: entry.key,
      scopeLevel: entry.scopeLevel,
      color: entry.color,
      label: entry.label,
      slopePerDay: entry.slopePerDay,
      effectiveMethod: entry.effectiveMethod,
      smoothedHistorical: entry.line.historical.map((p) => ({
        date: p.date,
        x: xForDate(p.date),
        y: yForValue(p.value),
      })),
      future: entry.line.forecast.map((p) => ({
        date: p.date,
        x: xForDate(p.date),
        y: yForValue(p.value),
      })),
      futureHigh: entry.line.forecastHigh.map((p) => ({
        date: p.date,
        x: xForDate(p.date),
        y: yForValue(p.value),
      })),
      futureLow: entry.line.forecastLow.map((p) => ({
        date: p.date,
        x: xForDate(p.date),
        y: yForValue(p.value),
      })),
    }))

    for (const entry of scopeSeries) {
      entry.points = entry.points
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((p) => ({
          ...p,
          x: xForDate(p.date),
          y: yForValue(getMetricValue(p.snapshot, entry.metric)),
        }))
    }

    const tickDates =
      firstDate && chartMaxDate ? evenlySpacedDateKeys(firstDate, chartMaxDate, 5) : sortedDates
    const xTickMarks = tickDates.map((date) => ({ date, x: xForDate(date) }))
    const projectionBoundaryX = lastDate ? xForDate(lastDate) : null

    return {
      series: scopeSeries,
      sortedDates,
      chartMaxDate,
      xTickMarks,
      yTicks,
      yMin,
      yMax,
      zeroY,
      projections,
      projectionBoundaryX,
      seasonalAvailable: seasonalOk,
    }
  }, [activeMetricKeys, enabledScopes, graphRange, plotHeight, plotWidth, projectionMode, scopeOptions, state, viewScope])

  const hasData = series.some((s) => s.points.length > 0)
  const showProjection = projectionMode !== 'off' && projections.length > 0
  const primaryProjection = projections[0] ?? null

  const xForHoverDate = (date: string) => {
    for (const entry of series) {
      const point = entry.points.find((p) => p.date === date)
      if (point) return point.x
    }
    return PAD_LEFT + plotWidth / 2
  }

  const toggleMetric = (key: MetricKey) => {
    setEnabledMetrics((current) => {
      const enabledCount = METRIC_KEYS.filter((metric) => current[metric]).length
      if (current[key] && enabledCount <= 1) return current
      return { ...current, [key]: !current[key] }
    })
  }

  const toggleScope = (key: string) => {
    setEnabledScopes((current) => {
      const enabledCount = Object.values(current).filter(Boolean).length
      if (current[key] && enabledCount <= 1) return current
      return { ...current, [key]: !current[key] }
    })
  }

  const handleSvgMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || sortedDates.length === 0) return

    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = CHART_WIDTH / rect.width
    const mouseX = (event.clientX - rect.left) * scaleX

    let nearestDate = sortedDates[0]!
    let nearestDist = Infinity
    for (const entry of series) {
      for (const point of entry.points) {
        const dist = Math.abs(mouseX - point.x)
        if (dist < nearestDist) {
          nearestDist = dist
          nearestDate = point.date
        }
      }
    }
    setHoverDate(nearestDist < 40 ? nearestDate : null)
  }

  const hoverX = hoverDate ? xForHoverDate(hoverDate) : null

  const hoverRows = hoverDate
    ? series
        .map((entry) => {
          const point = entry.points.find((p) => p.date === hoverDate)
          return point ? { ...entry, point } : null
        })
        .filter((row): row is ChartSeries & { point: ChartSeries['points'][number] } => row !== null)
    : []

  const hoverDayNote = hoverDate ? getDayNoteText(state, hoverDate, viewScope) : null
  const pinnedDayNote = pinnedSnapshot ? getDayNoteText(state, pinnedSnapshot.snapshot.date, viewScope) : null

  const pinned = pinnedSnapshot
  const detailSnapshot = pinned?.snapshot ?? hoverRows[0]?.point.snapshot ?? null
  const detailScopeLabel =
    pinned != null
      ? scopeOptions.find((o) => o.key === pinned.scopeKey)?.label
      : hoverRows.length === 1
        ? hoverRows[0].label
        : null

  const trendHelpText =
    'Solid lines connect your saved balance entries. Each scope level (group, business, venue) has its own true balance history. Use Forecast to add a separate smoothed trend line based on those entries.'

  const showLegend = series.length > 1 || activeMetricKeys.length > 1 || showProjection

  const legendBlock = showLegend ? (
    <div className={`chart-legend${embedded ? ' chart-legend--overlay' : ''}`}>
      {series.map((entry) => (
        <span key={entry.key} className="chart-legend-item">
          <span
            className={`chart-legend-line chart-legend-line--${entry.scopeLevel}`}
            style={{
              background: entry.color,
              ...(entry.dashArray ? { opacity: 0.85 } : {}),
            }}
          />
          {entry.label}
        </span>
      ))}
      {showProjection && (
        <>
          <span className="chart-legend-item">
            <span className="chart-legend-dash chart-legend-dash--fit" />
            Medium trend
          </span>
          <span className="chart-legend-item">
            <span className="chart-legend-band chart-legend-band--high" />
            High / low range
          </span>
          <span className="chart-legend-item">
            <span className="chart-legend-dash chart-legend-dash--forecast" />
            Forecast
            {primaryProjection
              ? ` (${formatTrendRate(primaryProjection.slopePerDay)}${
                  primaryProjection.effectiveMethod === 'seasonal' ? ', seasonal' : ''
                })`
              : ''}
          </span>
        </>
      )}
    </div>
  ) : null

  const chartPlot =
    activeScopeKeys.length === 0 ? (
        <div className={`chart-empty${embedded ? ' chart-empty--embedded' : ''}`}>
          <p>Select at least one group, business, or venue to plot.</p>
        </div>
      ) : activeMetricKeys.length === 0 ? (
        <div className={`chart-empty${embedded ? ' chart-empty--embedded' : ''}`}>
          <p>Select at least one metric to plot.</p>
        </div>
      ) : !hasData ? (
        <div className={`chart-empty${embedded ? ' chart-empty--embedded' : ''}`}>
          <p>Update balances to start building history for the selected scope.</p>
        </div>
      ) : (
        <div className={`trends-chart-plot${embedded ? ' trends-chart-plot--embedded' : ''}`}>
          <div className="chart-wrap">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className={`trend-svg${embedded ? ' trend-svg--embedded' : ''}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Balance trend chart"
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setHoverDate(null)}
            >
              <defs>
                <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={series[0]?.color ?? '#2563eb'} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={series[0]?.color ?? '#2563eb'} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <rect
                x={PAD_LEFT}
                y={PAD_TOP}
                width={plotWidth}
                height={plotHeight}
                className="chart-plot-bg"
                rx="8"
              />

              {yTicks.map((tick) => {
                if (isChartZeroTick(tick)) return null
                const y = PAD_TOP + (1 - (tick - yMin) / (yMax - yMin || 1)) * plotHeight
                return (
                  <g key={tick}>
                    <line x1={PAD_LEFT} y1={y} x2={PAD_LEFT + plotWidth} y2={y} className="chart-grid-line" />
                    <text x={PAD_LEFT - 10} y={y + 4} textAnchor="end" className="chart-axis-tick">
                      {formatAxisCurrency(tick)}
                    </text>
                  </g>
                )
              })}

              {zeroY !== null && (
                <g className="chart-zero-line-group" aria-hidden>
                  <line
                    x1={PAD_LEFT}
                    y1={zeroY}
                    x2={PAD_LEFT + plotWidth}
                    y2={zeroY}
                    className="chart-zero-line"
                  />
                  <text
                    x={PAD_LEFT - 10}
                    y={zeroY + 4}
                    textAnchor="end"
                    className="chart-axis-tick chart-axis-tick-zero"
                  >
                    {formatAxisCurrency(0)}
                  </text>
                </g>
              )}

              <line
                x1={PAD_LEFT}
                y1={PAD_TOP}
                x2={PAD_LEFT}
                y2={PAD_TOP + plotHeight}
                className="chart-axis-line"
              />
              <line
                x1={PAD_LEFT}
                y1={PAD_TOP + plotHeight}
                x2={PAD_LEFT + plotWidth}
                y2={PAD_TOP + plotHeight}
                className="chart-axis-line"
              />

              {xTickMarks.map(({ date, x }) => (
                <text
                  key={date}
                  x={x}
                  y={PAD_TOP + plotHeight + 22}
                  textAnchor="middle"
                  className="chart-axis-tick chart-axis-tick-x"
                >
                  {formatSnapshotDate(date)}
                </text>
              ))}

              {showProjection && projectionBoundaryX !== null && (
                <>
                  <rect
                    x={projectionBoundaryX}
                    y={PAD_TOP}
                    width={PAD_LEFT + plotWidth - projectionBoundaryX}
                    height={plotHeight}
                    className="chart-projection-zone"
                    rx="0"
                  />
                  <line
                    x1={projectionBoundaryX}
                    y1={PAD_TOP}
                    x2={projectionBoundaryX}
                    y2={PAD_TOP + plotHeight}
                    className="chart-projection-divider"
                  />
                  <text
                    x={projectionBoundaryX + 6}
                    y={PAD_TOP + 12}
                    className="chart-projection-label"
                  >
                    Forecast
                  </text>
                </>
              )}

              <text
                x={16}
                y={PAD_TOP + plotHeight / 2}
                textAnchor="middle"
                className="chart-axis-title chart-axis-title-y"
                transform={`rotate(-90 16 ${PAD_TOP + plotHeight / 2})`}
              >
                {activeMetricKeys.length === 1
                  ? `${metricConfig[activeMetricKeys[0]!].shortLabel} (${getCurrencySymbol()})`
                  : `Amount (${getCurrencySymbol()})`}
              </text>

              {series.length === 1 && series[0].points.length > 1 && (
                <polygon
                  className="chart-area"
                  fill="url(#chartAreaGradient)"
                  points={[
                    ...series[0].points.map((p) => `${p.x},${p.y}`),
                    `${series[0].points[series[0].points.length - 1].x},${PAD_TOP + plotHeight}`,
                    `${series[0].points[0].x},${PAD_TOP + plotHeight}`,
                  ].join(' ')}
                />
              )}

              {showProjection &&
                projections.map((projection) => {
                  if (projection.futureHigh.length < 2 || projection.futureLow.length < 2) return null
                  const bandPoints = [
                    ...projection.futureHigh.map((p) => `${p.x},${p.y}`),
                    ...[...projection.futureLow].reverse().map((p) => `${p.x},${p.y}`),
                  ].join(' ')
                  return (
                    <polygon
                      key={`band-${projection.key}`}
                      className="chart-projection-band"
                      fill={projection.color}
                      points={bandPoints}
                    />
                  )
                })}

              {showProjection &&
                projections.map((projection) =>
                  projection.smoothedHistorical.length > 1 ? (
                    <polyline
                      key={`trend-${projection.key}`}
                      className={`chart-trend-fit chart-trend-fit--${projection.scopeLevel}`}
                      fill="none"
                      stroke={projection.color}
                      strokeWidth={Math.max(1.25, chartStrokeWidthForLevel(projection.scopeLevel) - 0.5)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="8 5"
                      opacity={0.75}
                      points={projection.smoothedHistorical.map((p) => `${p.x},${p.y}`).join(' ')}
                    />
                  ) : null,
                )}

              {series.map((entry) => {
                if (entry.points.length < 2) return null
                return (
                  <polyline
                    key={entry.key}
                    className={`chart-line chart-line--${entry.scopeLevel}`}
                    fill="none"
                    stroke={entry.color}
                    strokeWidth={entry.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={entry.dashArray || undefined}
                    points={entry.points.map((p) => `${p.x},${p.y}`).join(' ')}
                  />
                )
              })}

              {showProjection &&
                projections.map((projection) =>
                  projection.futureHigh.length > 1 ? (
                    <polyline
                      key={`high-${projection.key}`}
                      className="chart-projection-bound chart-projection-bound--high"
                      fill="none"
                      stroke={projection.color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={projection.futureHigh.map((p) => `${p.x},${p.y}`).join(' ')}
                    />
                  ) : null,
                )}

              {showProjection &&
                projections.map((projection) =>
                  projection.futureLow.length > 1 ? (
                    <polyline
                      key={`low-${projection.key}`}
                      className="chart-projection-bound chart-projection-bound--low"
                      fill="none"
                      stroke={projection.color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={projection.futureLow.map((p) => `${p.x},${p.y}`).join(' ')}
                    />
                  ) : null,
                )}

              {showProjection &&
                projections.map((projection) =>
                  projection.future.length > 1 ? (
                    <polyline
                      key={`forecast-${projection.key}`}
                      className="chart-projection-line"
                      fill="none"
                      stroke={projection.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="4 6"
                      opacity={0.55}
                      points={projection.future.map((p) => `${p.x},${p.y}`).join(' ')}
                    />
                  ) : null,
                )}

              {hoverX !== null && (
                <line
                  x1={hoverX}
                  y1={PAD_TOP}
                  x2={hoverX}
                  y2={PAD_TOP + plotHeight}
                  className="chart-crosshair"
                />
              )}

              {series.map((entry) =>
                entry.points.map((point) => {
                  const isHover = hoverDate === point.date
                  const isPinned =
                    pinned?.scopeKey === entry.scopeKey && pinned.snapshot.id === point.snapshot.id
                  const highlighted = isHover || isPinned
                  const dotRadius = chartDotRadiusForLevel(entry.scopeLevel, highlighted)
                  return (
                    <circle
                      key={`${entry.key}-${point.date}`}
                      cx={point.x}
                      cy={point.y}
                      r={dotRadius}
                      fill={entry.color}
                      stroke="#fff"
                      strokeWidth={highlighted ? 2 : 1.25}
                      className={`chart-dot chart-dot--${entry.scopeLevel}`}
                      onMouseEnter={() => setHoverDate(point.date)}
                      onClick={() =>
                        setPinnedSnapshot(
                          isPinned ? null : { scopeKey: entry.scopeKey, snapshot: point.snapshot },
                        )
                      }
                    />
                  )
                }),
              )}

            </svg>

            {hoverDate && hoverRows.length > 0 && !pinned && (
              <div
                className="chart-hover-card"
                style={{ left: `${((hoverX ?? PAD_LEFT) / CHART_WIDTH) * 100}%` }}
              >
                <strong>{formatSnapshotDateLong(hoverDate)}</strong>
                {hoverRows.map((row) => (
                  <p key={row.key}>
                    <span className="chart-hover-swatch" style={{ background: row.color }} />
                    {row.label}: {formatCurrency(getMetricValue(row.point.snapshot, row.metric))}
                  </p>
                ))}
                {hoverDayNote && <p className="chart-hover-note">{hoverDayNote}</p>}
                {onSetDayNote && (
                  <button
                    type="button"
                    className="btn-ghost btn-tiny chart-hover-note-btn"
                    onClick={() => setNoteEditorDate(hoverDate)}
                  >
                    {hoverDayNote ? 'Edit day note' : 'Add day note'}
                  </button>
                )}
              </div>
            )}
            {embedded ? legendBlock : null}
          </div>

          {!embedded ? legendBlock : null}

          {showProjection && primaryProjection && !embedded && (
            <p className="chart-projection-footnote muted">
              Solid lines are your saved entries. The medium dashed line is a smoothed trend; high and
              low bounds widen into the forecast based on how much your history has varied — not a
              guarantee of future performance.
            </p>
          )}

          {detailSnapshot && pinned && (
            <div className="chart-tooltip">
              <strong>
                {formatSnapshotDateLong(detailSnapshot.date)}
                {detailScopeLabel ? ` · ${detailScopeLabel}` : ''}
              </strong>
              {activeMetricKeys.length === 1 ? (
                <p>
                  {metricConfig[activeMetricKeys[0]!].label}:{' '}
                  {formatCurrency(getMetricValue(detailSnapshot, activeMetricKeys[0]!))}
                </p>
              ) : null}
              <p>True Balance: {formatCurrency(getEffectiveSnapshotMetric(state, detailSnapshot, 'trueBalance'))}</p>
              <p>Cash: {formatCurrency(getEffectiveSnapshotMetric(state, detailSnapshot, 'cash'))}</p>
              <p>Committed Funds: {formatCurrency(getEffectiveSnapshotMetric(state, detailSnapshot, 'committedFunds'))}</p>
              <p>Expected Receipts: {formatCurrency(getEffectiveSnapshotMetric(state, detailSnapshot, 'expectedReceipts'))}</p>
              {detailSnapshot.note && (
                <p className="tooltip-note">
                  {detailSnapshot.noteSource && detailSnapshot.scopeType !== 'venue'
                    ? `Note from ${detailSnapshot.noteSource}: ${detailSnapshot.note}`
                    : `Note: ${detailSnapshot.note}`}
                </p>
              )}
              {pinnedDayNote && !detailSnapshot.note && (
                <p className="tooltip-note">{pinnedDayNote}</p>
              )}
              {pinnedDayNote && detailSnapshot.note && pinnedDayNote !== detailSnapshot.note && (
                <p className="tooltip-note">Day note: {pinnedDayNote}</p>
              )}
              {onSetDayNote && (
                <button
                  type="button"
                  className="btn-ghost btn-tiny"
                  onClick={() => setNoteEditorDate(detailSnapshot.date)}
                >
                  {pinnedDayNote ? 'Edit day note' : 'Add day note'}
                </button>
              )}
              {detailSnapshot.changedAccounts.length > 0 && (
                <div>
                  <p className="tooltip-sub">Accounts updated:</p>
                  <ul>
                    {detailSnapshot.changedAccounts.map((a) => (
                      <li key={a.accountId}>
                        {detailSnapshot.scopeType !== 'venue' && a.venueName ? `${a.venueName} › ` : ''}
                        {a.accountName}: {formatCurrency(a.balance)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button type="button" className="btn-ghost small" onClick={() => setPinnedSnapshot(null)}>
                Close
              </button>
            </div>
          )}
        </div>
      )

  const desktopControls = (
    <div className="chart-controls chart-controls-compact chart-controls--trends">
      <div className="chart-control-row chart-control-row--toolbar">
        <div className="chart-control-block chart-control-inline chart-control-scopes">
          <p className="chart-control-label">Show</p>
          <div className="chart-scope-toggles chart-scope-toggles--inline chart-scope-toggles--trends">
            {scopeOptions.map((opt, idx) => (
              <label
                key={opt.key}
                className={`chart-scope-toggle chart-scope-toggle--compact chart-scope-${opt.level}${enabledScopes[opt.key] ? ' active' : ''}`}
                style={{ marginLeft: opt.indent * 14 }}
                title={opt.label}
              >
                <input
                  type="checkbox"
                  checked={!!enabledScopes[opt.key]}
                  onChange={() => toggleScope(opt.key)}
                />
                <span
                  className="chart-scope-swatch"
                  style={{ background: chartColorForScope(state, opt.scope, idx) }}
                />
                <span className="chart-scope-name">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="chart-control-block chart-control-inline">
          <p className="chart-control-label">Metrics</p>
          <div className="chart-scope-toggles chart-scope-toggles--inline chart-scope-toggles--trends chart-metric-toggles">
            {METRIC_KEYS.map((key) => (
              <label
                key={key}
                className={`chart-scope-toggle chart-scope-toggle--compact chart-metric-toggle${enabledMetrics[key] ? ' active' : ''}`}
                title={metricConfig[key].label}
              >
                <input
                  type="checkbox"
                  checked={!!enabledMetrics[key]}
                  onChange={() => toggleMetric(key)}
                />
                <span className="chart-scope-swatch" style={{ background: METRIC_COLORS[key] }} />
                <span className="chart-scope-name">{metricConfig[key].label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="chart-control-block chart-control-inline chart-control-range">
          <p className="chart-control-label">Range</p>
          <div className="range-toggles range-toggles--compact">
            {ranges.map((r) => (
              <button
                key={r.key}
                type="button"
                className={graphRange === r.key ? 'active' : ''}
                onClick={() => onRangeChange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-control-block chart-control-inline chart-control-projection">
          <p className="chart-control-label">Forecast</p>
          <div className="range-toggles range-toggles--compact">
            <button
              type="button"
              className={projectionMode === 'off' ? 'active' : ''}
              onClick={() => setProjectionMode('off')}
            >
              Off
            </button>
            <button
              type="button"
              className={projectionMode === 'linear' ? 'active' : ''}
              onClick={() => setProjectionMode('linear')}
              title="Extend the average recent rate as a straight line"
            >
              Straight
            </button>
            <button
              type="button"
              className={projectionMode === 'seasonal' ? 'active' : ''}
              onClick={() => setProjectionMode('seasonal')}
              disabled={!seasonalAvailable}
              title={
                seasonalAvailable
                  ? 'Follow the average rate with month-to-month seasonal variation'
                  : 'Needs at least 6 snapshots across 4+ months'
              }
            >
              Seasonal
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const embeddedChartFrame = (
    <div className="trends-chart-frame">
      <aside className="trends-chart-rail trends-chart-rail--scopes" aria-label="Locations to show">
        <p className="trends-chart-rail-heading">Show</p>
        <div className="trends-chart-scope-list">
          {scopeOptions.map((opt, idx) => (
            <label
              key={opt.key}
              className={`trends-chart-scope-item trends-chart-scope-item--${opt.level}${enabledScopes[opt.key] ? ' is-active' : ''}`}
              style={{ paddingLeft: opt.indent ? `${opt.indent * 6 + 3}px` : undefined }}
              title={opt.label}
            >
              <input
                type="checkbox"
                checked={!!enabledScopes[opt.key]}
                onChange={() => toggleScope(opt.key)}
              />
              <span
                className="trends-chart-scope-swatch"
                style={{ background: chartColorForScope(state, opt.scope, idx) }}
                aria-hidden
              />
              <span className="trends-chart-scope-name">{opt.label}</span>
            </label>
          ))}
        </div>
      </aside>

      <div className="trends-chart-core">
        <div className="trends-chart-rail trends-chart-rail--top">
          <div className="trends-chart-rail-cluster">
            <span className="trends-chart-rail-tag">Range</span>
            <div className="trends-mini-toggles" role="group" aria-label="Chart range">
              {ranges.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={graphRange === r.key ? 'is-active' : ''}
                  onClick={() => onRangeChange(r.key)}
                >
                  {r.key === '30d' ? '30d' : r.key === '90d' ? '90d' : r.key === '12m' ? '12m' : 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="trends-chart-rail-cluster">
            <span className="trends-chart-rail-tag">Forecast</span>
            <div className="trends-mini-toggles" role="group" aria-label="Forecast mode">
              <button
                type="button"
                className={projectionMode === 'off' ? 'is-active' : ''}
                onClick={() => setProjectionMode('off')}
              >
                Off
              </button>
              <button
                type="button"
                className={projectionMode === 'linear' ? 'is-active' : ''}
                onClick={() => setProjectionMode('linear')}
                title="Extend the average recent rate as a straight line"
              >
                Straight
              </button>
              <button
                type="button"
                className={projectionMode === 'seasonal' ? 'is-active' : ''}
                onClick={() => setProjectionMode('seasonal')}
                disabled={!seasonalAvailable}
                title={
                  seasonalAvailable
                    ? 'Follow the average rate with month-to-month seasonal variation'
                    : 'Needs at least 6 snapshots across 4+ months'
                }
              >
                Seasonal
              </button>
            </div>
          </div>
          <HelpButton
            id="trend"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            text={trendHelpText}
          />
        </div>

        <div className="trends-chart-main">{chartPlot}</div>

        <div className="trends-chart-rail trends-chart-rail--bottom">
          <span className="trends-chart-rail-tag">Metrics</span>
          <div className="trends-mini-metrics">
            {METRIC_KEYS.map((key) => (
              <label
                key={key}
                className={`trends-mini-metric${enabledMetrics[key] ? ' is-active' : ''}`}
                title={metricConfig[key].label}
              >
                <input
                  type="checkbox"
                  checked={!!enabledMetrics[key]}
                  onChange={() => toggleMetric(key)}
                />
                <span className="trends-chart-scope-swatch" style={{ background: METRIC_COLORS[key] }} aria-hidden />
                <span>{metricConfig[key].shortLabel}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const chartBody = embedded ? (
    embeddedChartFrame
  ) : (
    <>
      {desktopControls}
      {chartPlot}
    </>
  )

  if (embedded) {
    return (
      <>
        <div id="trends-chart" className="trends-chart-panel trends-chart-panel--embedded">
          {chartBody}
        </div>
        {noteEditorDate && onSetDayNote && (
          <DayNoteEditor
            date={noteEditorDate}
            scopeLabel={getScopeItemLabel(state, viewScope.type, viewScope.id)}
            initialText={getDayNoteText(state, noteEditorDate, viewScope) ?? ''}
            onSave={(text) => onSetDayNote(noteEditorDate, text, viewScope)}
            onClose={() => setNoteEditorDate(null)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <section id="trends-chart" className="card chart-card widget-span-2">
      <div className="card-head card-head-compact">
        <h2>True Balance Trend</h2>
        <HelpButton
          id="trend"
          openHelp={openHelp}
          setOpenHelp={setOpenHelp}
          text="Each point is recorded when you save account balances in the overview. Solid lines are your actual entries at each level. Forecast adds a separate smoothed trend line — not drawn through the same points."
        />
      </div>
      {chartBody}
    </section>
    {noteEditorDate && onSetDayNote && (
      <DayNoteEditor
        date={noteEditorDate}
        scopeLabel={getScopeItemLabel(state, viewScope.type, viewScope.id)}
        initialText={getDayNoteText(state, noteEditorDate, viewScope) ?? ''}
        onSave={(text) => onSetDayNote(noteEditorDate, text, viewScope)}
        onClose={() => setNoteEditorDate(null)}
      />
    )}
    </>
  )
}
