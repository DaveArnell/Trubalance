import type { BalanceSnapshot, GraphRange } from '../types'
import { getCurrencyLocale, getCurrencySymbol } from './format'

export type SnapshotMetric = keyof Pick<
  BalanceSnapshot,
  'trueBalance' | 'cash' | 'committedFunds' | 'expectedReceipts'
>

export type ProjectionMethod = 'linear' | 'seasonal'

export interface TrendProjectionInput {
  snapshots: BalanceSnapshot[]
  metric?: SnapshotMetric
  targetValue: number
}

export interface TrendProjectionResult {
  slopePerDay: number
  latestValue: number
  latestDate: string
  sampleCount: number
  direction: 'rising' | 'falling' | 'flat'
  daysToTarget: number | null
  targetReachDate: string | null
  daysToZero: number | null
  zeroReachDate: string | null
  targetReachable: boolean
  zeroReachable: boolean
}

export interface ChartProjectionPoint {
  date: string
  value: number
}

export interface ChartProjectionLine {
  /** Points from the last snapshot forward (includes anchor at latest actual). */
  points: ChartProjectionPoint[]
  slopePerDay: number
  method: ProjectionMethod
  /** When seasonal was requested but unavailable, we fall back to linear. */
  effectiveMethod: ProjectionMethod
  horizonDays: number
}

function dayIndex(dateKey: string, originMs: number): number {
  return (new Date(`${dateKey}T12:00:00`).getTime() - originMs) / 86_400_000
}

export function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`)
  d.setDate(d.getDate() + Math.round(days))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthIndex(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00`).getMonth()
}

function formatProjectionDate(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatProjectionDateLabel(dateKey: string | null): string {
  if (!dateKey) return '—'
  return formatProjectionDate(dateKey)
}

export interface LinearFit {
  slopePerDay: number
  intercept: number
  originDate: string
  sampleCount: number
  /** Typical deviation of saved entries from the fitted trend. */
  residualStdError: number
  meanX: number
  sumSqDevX: number
}

export function fitLinearTrend(
  snapshots: BalanceSnapshot[],
  metric: SnapshotMetric = 'trueBalance',
): LinearFit | null {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2) return null

  const originDate = sorted[0]!.date
  const originMs = new Date(`${originDate}T12:00:00`).getTime()
  const points = sorted.map((snap) => ({
    x: dayIndex(snap.date, originMs),
    y: snap[metric] as number,
  }))

  const n = points.length
  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)
  const denom = n * sumXX - sumX * sumX
  if (Math.abs(denom) < 1e-9) return null

  const slopePerDay = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slopePerDay * sumX) / n
  const meanX = sumX / n
  const sumSqDevX = points.reduce((sum, p) => {
    const dev = p.x - meanX
    return sum + dev * dev
  }, 0)

  let ssRes = 0
  for (const point of points) {
    const fitted = intercept + slopePerDay * point.x
    const err = point.y - fitted
    ssRes += err * err
  }
  const dof = Math.max(1, n - 2)
  const residualStdError = Math.sqrt(ssRes / dof)

  return { slopePerDay, intercept, originDate, sampleCount: n, residualStdError, meanX, sumSqDevX }
}

function buildSeasonalOffsets(
  snapshots: BalanceSnapshot[],
  metric: SnapshotMetric,
  fit: LinearFit,
): number[] | null {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  const originMs = new Date(`${fit.originDate}T12:00:00`).getTime()
  const sums = new Array(12).fill(0)
  const counts = new Array(12).fill(0)

  for (const snap of sorted) {
    const x = dayIndex(snap.date, originMs)
    const trend = fit.intercept + fit.slopePerDay * x
    const residual = (snap[metric] as number) - trend
    const month = monthIndex(snap.date)
    sums[month] += residual
    counts[month] += 1
  }

  const populatedMonths = counts.filter((c) => c > 0).length
  if (populatedMonths < 4) return null

  const offsets = sums.map((sum, i) => (counts[i] > 0 ? sum / counts[i]! : 0))
  const avg = offsets.reduce((sum, value) => sum + value, 0) / 12
  return offsets.map((value) => value - avg)
}

export function canUseSeasonalProjection(snapshots: BalanceSnapshot[]): boolean {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 6) return false
  const spanDays =
    dayIndex(sorted[sorted.length - 1]!.date, new Date(`${sorted[0]!.date}T12:00:00`).getTime())
  if (spanDays < 120) return false
  const fit = fitLinearTrend(sorted)
  if (!fit) return false
  return buildSeasonalOffsets(sorted, 'trueBalance', fit) !== null
}

export function projectionHorizonDays(graphRange: GraphRange, snapshotSpanDays: number): number {
  if (graphRange === '30d') return 45
  if (graphRange === '90d') return 90
  if (graphRange === '12m') return 150
  // Give the forecast zone meaningful width on long histories (was ~25% of span).
  return Math.min(365, Math.max(120, Math.round(snapshotSpanDays * 0.4)))
}

function projectValueAt(
  dateKey: string,
  latestDate: string,
  latestValue: number,
  slopePerDay: number,
  seasonalOffsets: number[] | null,
): number {
  const latestMs = new Date(`${latestDate}T12:00:00`).getTime()
  const days = dayIndex(dateKey, latestMs)
  let value = latestValue + slopePerDay * days
  if (seasonalOffsets) {
    value += seasonalOffsets[monthIndex(dateKey)]! - seasonalOffsets[monthIndex(latestDate)]!
  }
  return value
}

export interface SmoothedTrendSeries {
  /** Fitted trend across the recorded period — not tied to individual entry values. */
  historical: ChartProjectionPoint[]
  /** Continuation of the same fitted trend into the forecast window. */
  forecast: ChartProjectionPoint[]
  /** Upper estimate — widens further into the forecast. */
  forecastHigh: ChartProjectionPoint[]
  /** Lower estimate — widens further into the forecast. */
  forecastLow: ChartProjectionPoint[]
  slopePerDay: number
  method: ProjectionMethod
  effectiveMethod: ProjectionMethod
  horizonDays: number
  lastActualDate: string
  residualStdError: number
}

/** ~80% range — high / low bands around the central trend. */
const FORECAST_BAND_Z = 1.28

function computeResidualStdError(
  snapshots: BalanceSnapshot[],
  metric: SnapshotMetric,
  fit: LinearFit,
  seasonalOffsets: number[] | null,
): number {
  if (snapshots.length < 3) return fit.residualStdError

  let ssRes = 0
  for (const snap of snapshots) {
    const fitted = fittedTrendValue(snap.date, fit, seasonalOffsets)
    const err = (snap[metric] as number) - fitted
    ssRes += err * err
  }
  const dof = Math.max(1, snapshots.length - (seasonalOffsets ? 3 : 2))
  return Math.sqrt(ssRes / dof)
}

function forecastUncertaintyHalfWidth(
  fit: LinearFit,
  residualStdError: number,
  x: number,
  daysAheadFromLast: number,
  horizonDays: number,
  z: number,
): number {
  const base =
    residualStdError > 0
      ? residualStdError
      : Math.max(500, Math.abs(fit.intercept + fit.slopePerDay * x) * 0.04)

  let regressionFactor = 1
  if (fit.sampleCount >= 3 && fit.sumSqDevX > 1e-9) {
    const xDev = x - fit.meanX
    regressionFactor = Math.sqrt(1 + 1 / fit.sampleCount + (xDev * xDev) / fit.sumSqDevX)
  }

  const funnelGrowth =
    daysAheadFromLast <= 0
      ? 0
      : 1 + Math.sqrt(daysAheadFromLast / Math.max(14, horizonDays * 0.45))

  return base * regressionFactor * funnelGrowth * z
}

function fittedTrendValue(
  dateKey: string,
  fit: LinearFit,
  seasonalOffsets: number[] | null,
): number {
  const originMs = new Date(`${fit.originDate}T12:00:00`).getTime()
  const trend = fit.intercept + fit.slopePerDay * dayIndex(dateKey, originMs)
  if (seasonalOffsets) {
    return trend + seasonalOffsets[monthIndex(dateKey)]!
  }
  return trend
}

function sampleDates(fromDate: string, toDate: string, stepDays: number): string[] {
  if (fromDate > toDate) return []
  const dates = [fromDate]
  let cursor = fromDate
  while (cursor < toDate) {
    const next = addDays(cursor, stepDays)
    cursor = next > toDate ? toDate : next
    if (dates[dates.length - 1] !== cursor) dates.push(cursor)
    if (cursor === toDate) break
  }
  return dates
}

/** Smoothed trend line sampled independently from saved entries. */
export function buildSmoothedTrendSeries({
  snapshots,
  metric = 'trueBalance',
  method = 'linear',
  horizonDays,
}: {
  snapshots: BalanceSnapshot[]
  metric?: SnapshotMetric
  method?: ProjectionMethod
  horizonDays: number
}): SmoothedTrendSeries | null {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2 || horizonDays <= 0) return null

  const fit = fitLinearTrend(sorted, metric)
  if (!fit) return null

  const seasonalOffsets =
    method === 'seasonal' ? buildSeasonalOffsets(sorted, metric, fit) : null
  const effectiveMethod: ProjectionMethod =
    method === 'seasonal' && seasonalOffsets ? 'seasonal' : 'linear'

  const firstDate = sorted[0]!.date
  const lastActualDate = sorted[sorted.length - 1]!.date
  const forecastEnd = addDays(lastActualDate, horizonDays)
  const stepDays = horizonDays <= 45 ? 7 : horizonDays <= 120 ? 14 : 30

  const historical = sampleDates(firstDate, lastActualDate, stepDays).map((date) => ({
    date,
    value: fittedTrendValue(
      date,
      fit,
      effectiveMethod === 'seasonal' ? seasonalOffsets : null,
    ),
  }))

  const originMs = new Date(`${fit.originDate}T12:00:00`).getTime()
  const lastActualMs = new Date(`${lastActualDate}T12:00:00`).getTime()
  const residualStdError = computeResidualStdError(
    sorted,
    metric,
    fit,
    effectiveMethod === 'seasonal' ? seasonalOffsets : null,
  )

  const forecastDates = sampleDates(lastActualDate, forecastEnd, stepDays)
  const forecast: ChartProjectionPoint[] = []
  const forecastHigh: ChartProjectionPoint[] = []
  const forecastLow: ChartProjectionPoint[] = []

  for (const date of forecastDates) {
    const center = fittedTrendValue(
      date,
      fit,
      effectiveMethod === 'seasonal' ? seasonalOffsets : null,
    )
    const x = dayIndex(date, originMs)
    const daysAhead = Math.max(0, (dateMs(date) - lastActualMs) / 86_400_000)
    const halfWidth = forecastUncertaintyHalfWidth(
      fit,
      residualStdError,
      x,
      daysAhead,
      horizonDays,
      FORECAST_BAND_Z,
    )

    forecast.push({ date, value: center })
    forecastHigh.push({ date, value: center + halfWidth })
    forecastLow.push({ date, value: center - halfWidth })
  }

  return {
    historical,
    forecast,
    forecastHigh,
    forecastLow,
    slopePerDay: fit.slopePerDay,
    method,
    effectiveMethod,
    horizonDays,
    lastActualDate,
    residualStdError,
  }
}

function dateMs(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00`).getTime()
}

export function buildChartProjectionLine({
  snapshots,
  metric = 'trueBalance',
  method = 'linear',
  horizonDays,
}: {
  snapshots: BalanceSnapshot[]
  metric?: SnapshotMetric
  method?: ProjectionMethod
  horizonDays: number
}): ChartProjectionLine | null {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2 || horizonDays <= 0) return null

  const fit = fitLinearTrend(sorted, metric)
  if (!fit) return null

  const latest = sorted[sorted.length - 1]!
  const latestValue = latest[metric] as number
  const seasonalOffsets =
    method === 'seasonal' ? buildSeasonalOffsets(sorted, metric, fit) : null
  const effectiveMethod: ProjectionMethod =
    method === 'seasonal' && seasonalOffsets ? 'seasonal' : 'linear'

  const stepDays = horizonDays <= 45 ? 7 : horizonDays <= 120 ? 14 : 30
  const points: ChartProjectionPoint[] = [{ date: latest.date, value: latestValue }]

  for (let d = stepDays; d <= horizonDays; d += stepDays) {
    const date = addDays(latest.date, d)
    points.push({
      date,
      value: projectValueAt(
        date,
        latest.date,
        latestValue,
        fit.slopePerDay,
        effectiveMethod === 'seasonal' ? seasonalOffsets : null,
      ),
    })
  }

  if (points[points.length - 1]!.date !== addDays(latest.date, horizonDays)) {
    const endDate = addDays(latest.date, horizonDays)
    points.push({
      date: endDate,
      value: projectValueAt(
        endDate,
        latest.date,
        latestValue,
        fit.slopePerDay,
        effectiveMethod === 'seasonal' ? seasonalOffsets : null,
      ),
    })
  }

  return {
    points,
    slopePerDay: fit.slopePerDay,
    method,
    effectiveMethod,
    horizonDays,
  }
}

/** Smoothed historical trend line (weekly samples) for overlay on the chart. */
export function buildHistoricalTrendLine({
  snapshots,
  metric = 'trueBalance',
  method = 'linear',
}: {
  snapshots: BalanceSnapshot[]
  metric?: SnapshotMetric
  method?: ProjectionMethod
}): ChartProjectionPoint[] {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2) return []

  const fit = fitLinearTrend(sorted, metric)
  if (!fit) return []

  const seasonalOffsets =
    method === 'seasonal' ? buildSeasonalOffsets(sorted, metric, fit) : null
  const effectiveMethod: ProjectionMethod =
    method === 'seasonal' && seasonalOffsets ? 'seasonal' : 'linear'
  const originMs = new Date(`${fit.originDate}T12:00:00`).getTime()

  return sorted.map((snap) => {
    const trend = fit.intercept + fit.slopePerDay * dayIndex(snap.date, originMs)
    if (effectiveMethod === 'seasonal' && seasonalOffsets) {
      return { date: snap.date, value: trend + seasonalOffsets[monthIndex(snap.date)]! }
    }
    return { date: snap.date, value: trend }
  })
}

export function computeTrendProjection({
  snapshots,
  metric = 'trueBalance',
  targetValue,
}: TrendProjectionInput): TrendProjectionResult | null {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2) return null

  const fit = fitLinearTrend(sorted, metric)
  if (!fit) return null

  const slopePerDay = fit.slopePerDay
  const latest = sorted[sorted.length - 1]!
  const latestValue = latest[metric] as number
  const latestDate = latest.date

  const direction =
    Math.abs(slopePerDay) < 0.01 ? 'flat' : slopePerDay > 0 ? 'rising' : 'falling'

  let daysToTarget: number | null = null
  let targetReachDate: string | null = null
  let targetReachable = false

  if (Math.abs(slopePerDay) >= 0.01) {
    const delta = targetValue - latestValue
    const needsRise = delta > 0
    const needsFall = delta < 0
    const slopeOk = (needsRise && slopePerDay > 0) || (needsFall && slopePerDay < 0) || Math.abs(delta) < 0.5
    if (slopeOk && Math.abs(delta) >= 0.5) {
      const days = delta / slopePerDay
      if (days >= 0 && days < 365 * 25) {
        daysToTarget = days
        targetReachDate = addDays(latestDate, days)
        targetReachable = true
      }
    } else if (Math.abs(delta) < 0.5) {
      targetReachable = true
      daysToTarget = 0
      targetReachDate = latestDate
    }
  }

  let daysToZero: number | null = null
  let zeroReachDate: string | null = null
  let zeroReachable = false

  if (slopePerDay < -0.01 && latestValue > 0) {
    const days = (0 - latestValue) / slopePerDay
    if (days >= 0 && days < 365 * 25) {
      daysToZero = days
      zeroReachDate = addDays(latestDate, days)
      zeroReachable = true
    }
  }

  return {
    slopePerDay,
    latestValue,
    latestDate,
    sampleCount: fit.sampleCount,
    direction,
    daysToTarget,
    targetReachDate,
    daysToZero,
    zeroReachDate,
    targetReachable,
    zeroReachable,
  }
}

export function formatTrendRate(slopePerDay: number): string {
  const weekly = slopePerDay * 7
  const abs = Math.abs(weekly)
  const symbol = getCurrencySymbol()
  const locale = getCurrencyLocale()
  const formatted =
    abs >= 1000 ? `${symbol}${Math.round(abs).toLocaleString(locale)}` : `${symbol}${Math.round(abs)}`
  return `${slopePerDay >= 0 ? '+' : '−'}${formatted} / week`
}

export function formatDaysUntil(days: number | null): string {
  if (days == null) return '—'
  if (days < 1) return 'now'
  const rounded = Math.round(days)
  if (rounded < 60) return `~${rounded} day${rounded === 1 ? '' : 's'}`
  const months = Math.round(rounded / 30)
  if (months < 24) return `~${months} month${months === 1 ? '' : 's'}`
  const years = (rounded / 365).toFixed(1)
  return `~${years} years`
}
