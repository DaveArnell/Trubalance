import type { CommitmentAccruingRow } from '../types'
import { toAmount } from './amounts'
import { getReferenceDate } from './referenceDate'

export interface MonthSimItem {
  id: string
  label: string
  amount: number
  dueDay: number
}

export interface MonthSimWindowPoint {
  offset: number
  dayInMonth: number
  accruing: number
}

export interface MonthSimDueMarker {
  offset: number
  dayInMonth: number
  amount: number
  labels: string[]
}

export interface MonthAccruingWindowSimulation {
  daysInMonth: number
  windowStartDay: number
  windowDays: number
  today: number
  monthStartOffset: number
  todayOffset: number
  series: MonthSimWindowPoint[]
  dueMarkers: MonthSimDueMarker[]
  peakOffset: number
  peakAccruing: number
  lowOffset: number
  lowAccruing: number
}

const AUTO_PAY_DAYS = 1

function daysInMonth(reference: Date): number {
  return new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate()
}

function clampDueDay(dueDay: number, maxDay: number): number {
  return Math.min(Math.max(1, dueDay), maxDay)
}

/** Accruing portion only — linear build to due day, then zero after payment until month rolls. */
function accruingAtDayInMonth(item: MonthSimItem, day: number, daysInMonthCount: number): number {
  const dueDay = clampDueDay(item.dueDay, daysInMonthCount)
  const payDay = Math.min(daysInMonthCount, dueDay + AUTO_PAY_DAYS)

  if (day < dueDay) {
    return item.amount * (dueDay <= 1 ? 1 : day / dueDay)
  }

  if (day <= payDay) {
    return 0
  }

  return 0
}

export function monthSimItemsFromRows(rows: CommitmentAccruingRow[]): MonthSimItem[] {
  return rows.map((row) => ({
    id: row.commitment.id,
    label: row.commitment.name.trim() || 'Untitled',
    amount: toAmount(row.commitment.amount),
    dueDay: row.commitment.dueDayOfMonth ?? 28,
  }))
}

/** One entry per cost name on a due date; repeats become "Wages ×3". */
export function groupDueLabelsOnDate(items: MonthSimItem[]): string[] {
  const counts = new Map<string, number>()
  const order: string[] = []
  for (const item of items) {
    if (!counts.has(item.label)) order.push(item.label)
    counts.set(item.label, (counts.get(item.label) ?? 0) + 1)
  }
  return order.map((label) => {
    const count = counts.get(label) ?? 1
    return count > 1 ? `${label} ×${count}` : label
  })
}

export function todayOffsetInWindow(startDay: number, today: number, daysInMonthCount: number): number {
  if (today >= startDay) return today - startDay
  return daysInMonthCount - startDay + today
}

export function windowEndDay(startDay: number, daysInMonthCount: number): number {
  return startDay === 1 ? daysInMonthCount : startDay - 1
}

export function monthStartOffsetInWindow(startDay: number, daysInMonthCount: number): number {
  if (startDay === 1) return 0
  return daysInMonthCount - startDay + 1
}

export function buildMonthAccruingWindowSimulation(
  rows: CommitmentAccruingRow[],
  windowStartDay: number,
  referenceDate: Date = getReferenceDate(),
): MonthAccruingWindowSimulation {
  const items = monthSimItemsFromRows(rows)
  const daysInMonthCount = daysInMonth(referenceDate)
  const today = referenceDate.getDate()
  const startDay =
    ((Math.round(windowStartDay) - 1) % daysInMonthCount + daysInMonthCount) % daysInMonthCount + 1
  const windowDays = daysInMonthCount
  const series: MonthSimWindowPoint[] = []

  for (let offset = 0; offset < windowDays; offset += 1) {
    const dayInMonth = ((startDay - 1 + offset) % daysInMonthCount) + 1
    let accruing = 0
    for (const item of items) {
      accruing += accruingAtDayInMonth(item, dayInMonth, daysInMonthCount)
    }
    series.push({ offset, dayInMonth, accruing })
  }

  const dueByOffset = new Map<number, MonthSimDueMarker>()
  for (let offset = 0; offset < windowDays; offset += 1) {
    const dayInMonth = series[offset]!.dayInMonth
    const dueItems = items.filter((item) => clampDueDay(item.dueDay, daysInMonthCount) === dayInMonth)
    if (dueItems.length === 0) continue
    dueByOffset.set(offset, {
      offset,
      dayInMonth,
      amount: dueItems.reduce((sum, item) => sum + item.amount, 0),
      labels: groupDueLabelsOnDate(dueItems),
    })
  }

  let peakOffset = 0
  let peakAccruing = 0
  let lowOffset = 0
  let lowAccruing = Infinity
  for (const point of series) {
    if (point.accruing > peakAccruing) {
      peakAccruing = point.accruing
      peakOffset = point.offset
    }
    if (point.accruing < lowAccruing) {
      lowAccruing = point.accruing
      lowOffset = point.offset
    }
  }

  return {
    daysInMonth: daysInMonthCount,
    windowStartDay: startDay,
    windowDays,
    today,
    todayOffset: todayOffsetInWindow(startDay, today, daysInMonthCount),
    monthStartOffset: monthStartOffsetInWindow(startDay, daysInMonthCount),
    series,
    dueMarkers: [...dueByOffset.values()].sort((a, b) => a.offset - b.offset),
    peakOffset,
    peakAccruing,
    lowOffset,
    lowAccruing: lowAccruing === Infinity ? 0 : lowAccruing,
  }
}

/** @deprecated Use buildMonthAccruingWindowSimulation */
export function buildMonthCostSimulation(
  rows: CommitmentAccruingRow[],
  referenceDate: Date = getReferenceDate(),
) {
  const sim = buildMonthAccruingWindowSimulation(rows, 1, referenceDate)
  return {
    daysInMonth: sim.daysInMonth,
    today: sim.today,
    series: sim.series.map((point) => ({
      day: point.dayInMonth,
      accruing: point.accruing,
      due: 0,
      total: point.accruing,
    })),
    dueMarkers: sim.dueMarkers.map((marker) => ({
      day: marker.dayInMonth,
      amount: marker.amount,
      labels: marker.labels,
    })),
    peakDay: sim.series[sim.peakOffset]?.dayInMonth ?? 1,
    peakTotal: sim.peakAccruing,
    lowDay: sim.series[sim.lowOffset]?.dayInMonth ?? 1,
    lowTotal: sim.lowAccruing,
  }
}
