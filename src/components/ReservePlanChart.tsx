import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReserveMonthEndBalance } from '../utils/reserveCalculations'
import { computeNiceTicks, computeTrendYDomain, formatAxisCurrency, isChartZeroTick } from '../utils/chartFormat'
import { formatCurrency } from '../utils/format'

interface ReservePlanChartProps {
  months: ReserveMonthEndBalance[]
  bufferAmount: number
  currentMonthIdx: number
  currentActualBalance?: number
  /** Re-measure when column widths change */
  columnWidths?: number[]
  /** Equal-width chart when not embedded in the sheet table */
  standalone?: boolean
}

interface PlotLayout {
  plotLeft: number
  plotWidth: number
  centers: number[]
  monthWidths: number[]
}

const CHART_HEIGHT = 148
const PAD_TOP = 14
const PAD_BOTTOM = 28

function actualBalanceForMonth(
  month: ReserveMonthEndBalance,
  currentMonthIdx: number,
  currentActualBalance?: number,
): number | null {
  if (month.confirmation) return month.confirmation.balance
  if (month.monthIndex === currentMonthIdx && currentActualBalance != null) {
    return currentActualBalance
  }
  return null
}

function usePlotLayout(columnWidths: number[] | undefined, standalone: boolean) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<PlotLayout | null>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    if (standalone) {
      const measureStandalone = () => {
        const monthCount = 12
        const width = Math.max(anchor.clientWidth, 280)
        const slot = width / monthCount
        const centers = Array.from({ length: monthCount }, (_, index) => slot * index + slot / 2)
        const monthWidths = Array.from({ length: monthCount }, () => slot)
        setLayout({ plotLeft: 0, plotWidth: width, centers, monthWidths })
      }

      measureStandalone()
      if (typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(measureStandalone)
      observer.observe(anchor)
      return () => observer.disconnect()
    }

    const table = anchor.closest('table')
    if (!table) return

    const measure = () => {
      const monthCells = table.querySelectorAll<HTMLElement>('thead th.reserve-month-col')
      if (monthCells.length === 0) return

      const anchorRect = anchor.getBoundingClientRect()
      const firstRect = monthCells[0]!.getBoundingClientRect()
      const lastRect = monthCells[monthCells.length - 1]!.getBoundingClientRect()
      const plotLeft = firstRect.left - anchorRect.left
      const plotWidth = lastRect.right - firstRect.left

      const centers = Array.from(monthCells).map((cell) => {
        const rect = cell.getBoundingClientRect()
        return rect.left - anchorRect.left + rect.width / 2
      })

      const monthWidths = Array.from(monthCells).map((cell) => cell.getBoundingClientRect().width)

      setLayout({ plotLeft, plotWidth, centers, monthWidths })
    }

    measure()

    const wrap = table.closest('.reserve-sheet-wrap')
    if (!wrap || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(measure)
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [columnWidths, standalone])

  return { anchorRef, layout }
}

export function ReservePlanChart({
  months,
  bufferAmount,
  currentMonthIdx,
  currentActualBalance,
  columnWidths,
  standalone = false,
}: ReservePlanChartProps) {
  const { anchorRef, layout } = usePlotLayout(standalone ? undefined : columnWidths, standalone)

  const chart = useMemo(() => {
    if (months.length === 0) return null

    const balanceValues = months.flatMap((m) => [m.balanceAfterBills, m.balanceAfterDeposit])
    const actualValues = months
      .map((month) => actualBalanceForMonth(month, currentMonthIdx, currentActualBalance))
      .filter((value): value is number => value != null)
    const allY = [...balanceValues, ...actualValues, bufferAmount, 0]
    const minVal = Math.min(...allY)
    const maxVal = Math.max(...allY)
    const { yMin, yMax } = computeTrendYDomain(minVal, maxVal, 0.1)
    const yTicks = computeNiceTicks(yMin, yMax, 4)

    return { yMin, yMax, yTicks }
  }, [bufferAmount, currentActualBalance, currentMonthIdx, months])

  if (!chart || months.length === 0) return null

  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM
  const plotWidth = layout?.plotWidth ?? 1
  const plotLeft = layout?.plotLeft ?? 0
  const canDraw = Boolean(layout && layout.plotWidth > 1)

  const yForValue = (value: number) => {
    const range = chart.yMax - chart.yMin || 1
    return PAD_TOP + (1 - (value - chart.yMin) / range) * plotHeight
  }

  const xForIndex = (index: number) => {
    if (layout?.centers[index] != null) {
      return layout.centers[index]! - layout.plotLeft
    }
    const slot = plotWidth / months.length
    return slot * index + slot / 2
  }

  const balancePoints = months.map((month, index) => ({
    month,
    x: xForIndex(index),
    y: yForValue(month.balanceAfterBills),
    beforeBillsY: yForValue(month.balanceAfterDeposit),
    due: month.totalDue,
  }))

  // Horizontal planned balance segments only — bill drops are separate red verticals.
  const horizontalSegments = balancePoints.slice(0, -1).map((point, index) => {
    const next = balancePoints[index + 1]!
    const endY = next.due > 0 ? next.beforeBillsY : next.y
    return {
      key: `${point.month.month}-${next.month.month}`,
      x1: point.x,
      y1: point.y,
      x2: next.x,
      y2: endY,
    }
  })

  // Stepped path for the filled area under the plan line.
  const steppedPoints = balancePoints.flatMap((point) =>
    point.due > 0
      ? [
          { x: point.x, y: point.beforeBillsY },
          { x: point.x, y: point.y },
        ]
      : [{ x: point.x, y: point.y }],
  )

  const bufferY = yForValue(bufferAmount)
  const zeroY = chart.yMin <= 0 && chart.yMax >= 0 ? yForValue(0) : null
  const monthSlotWidth = (index: number) =>
    layout?.monthWidths[index] ?? plotWidth / Math.max(months.length, 1)

  return (
    <div
      ref={anchorRef}
      className={`reserve-plan-chart${standalone ? ' reserve-plan-chart--standalone' : ''}`}
      role="img"
      aria-label="Reserve balance plan chart"
    >
      {canDraw ? (
        <svg
          viewBox={`0 0 ${plotWidth} ${CHART_HEIGHT}`}
          className="reserve-plan-chart-svg"
          preserveAspectRatio="xMinYMid meet"
          style={
            layout
              ? { marginLeft: plotLeft, width: plotWidth }
              : { width: '100%', maxWidth: '100%' }
          }
        >
          <rect
            x={0}
            y={PAD_TOP}
            width={plotWidth}
            height={plotHeight}
            className="reserve-plan-chart-plot-bg"
            rx="6"
          />

          {chart.yTicks.map((tick) => {
            if (isChartZeroTick(tick)) return null
            const y = yForValue(tick)
            return (
              <g key={tick}>
                <line x1={0} y1={y} x2={plotWidth} y2={y} className="reserve-plan-chart-grid" />
                <text x={4} y={y + 3} textAnchor="start" className="reserve-plan-chart-axis">
                  {formatAxisCurrency(tick)}
                </text>
              </g>
            )
          })}

          {zeroY !== null && (
            <g className="chart-zero-line-group" aria-hidden>
              <line x1={0} y1={zeroY} x2={plotWidth} y2={zeroY} className="chart-zero-line" />
              <text x={4} y={zeroY + 3} textAnchor="start" className="reserve-plan-chart-axis chart-axis-tick-zero">
                {formatAxisCurrency(0)}
              </text>
            </g>
          )}

          {months.map((month, index) => {
            if (index !== currentMonthIdx) return null
            const x = xForIndex(index)
            const half = monthSlotWidth(index) / 2
            return (
              <rect
                key={`current-${month.month}`}
                x={x - half}
                y={PAD_TOP}
                width={half * 2}
                height={plotHeight}
                className="reserve-plan-chart-current-month"
              />
            )
          })}

          <line
            x1={0}
            y1={bufferY}
            x2={plotWidth}
            y2={bufferY}
            className="reserve-plan-chart-buffer"
          />

          <polygon
            className="reserve-plan-chart-area"
            points={[
              ...steppedPoints.map((p) => `${p.x},${p.y}`),
              `${steppedPoints[steppedPoints.length - 1]!.x},${PAD_TOP + plotHeight}`,
              `${steppedPoints[0]!.x},${PAD_TOP + plotHeight}`,
            ].join(' ')}
          />

          {horizontalSegments.map((segment) => (
            <line
              key={segment.key}
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              className="reserve-plan-chart-balance-line"
            />
          ))}

          {balancePoints.map((point) => {
            if (point.due <= 0) return null
            return (
              <line
                key={`due-${point.month.month}`}
                x1={point.x}
                y1={point.beforeBillsY}
                x2={point.x}
                y2={point.y}
                className="reserve-plan-chart-outgoing"
              />
            )
          })}

          {balancePoints.map((point) => (
            <g key={point.month.month}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.month.monthIndex === currentMonthIdx ? 4.5 : 3}
                className={`reserve-plan-chart-dot${point.month.isLowestMonth ? ' reserve-plan-chart-dot--low' : ''}`}
              />
              {point.due > 0 && (
                <title>
                  {point.month.month}: {formatCurrency(point.due)} due — planned{' '}
                  {formatCurrency(point.month.balanceAfterBills)}
                </title>
              )}
            </g>
          ))}

          {months.map((month, index) => {
            const x = xForIndex(index)
            return (
              <text
                key={`label-${month.month}`}
                x={x}
                y={CHART_HEIGHT - 8}
                textAnchor="middle"
                className={`reserve-plan-chart-month${index === currentMonthIdx ? ' reserve-plan-chart-month--current' : ''}`}
              >
                {month.month.slice(0, 3)}
              </text>
            )
          })}
        </svg>
      ) : null}

      <div className="reserve-plan-chart-legend">
        <span className="reserve-plan-chart-legend-item">
          <span className="reserve-plan-chart-legend-swatch reserve-plan-chart-legend-swatch--balance" />
          Planned balance
        </span>
        <span className="reserve-plan-chart-legend-item">
          <span className="reserve-plan-chart-legend-swatch reserve-plan-chart-legend-swatch--outgoing" />
          Bills due
        </span>
        <span className="reserve-plan-chart-legend-item">
          <span className="reserve-plan-chart-legend-swatch reserve-plan-chart-legend-swatch--buffer" />
          Minimum buffer
        </span>
      </div>
    </div>
  )
}
