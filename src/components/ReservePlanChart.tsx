import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReserveMonthEndBalance } from '../utils/reserveCalculations'
import { computeNiceTicks, computeZeroAnchoredDomain, formatAxisCurrency, isChartZeroTick } from '../utils/chartFormat'
import { formatCurrency } from '../utils/format'

interface ReservePlanChartProps {
  months: ReserveMonthEndBalance[]
  bufferAmount: number
  currentMonthIdx: number
  currentActualBalance?: number
  /** Re-measure when column widths change */
  columnWidths?: number[]
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

function usePlotLayout(columnWidths: number[] | undefined) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<PlotLayout | null>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const table = anchor?.closest('table')
    if (!anchor || !table) return

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
  }, [columnWidths])

  return { anchorRef, layout }
}

export function ReservePlanChart({
  months,
  bufferAmount,
  currentMonthIdx,
  currentActualBalance,
  columnWidths,
}: ReservePlanChartProps) {
  const { anchorRef, layout } = usePlotLayout(columnWidths)

  const chart = useMemo(() => {
    if (months.length === 0) return null

    const balanceValues = months.map((m) => m.balanceAfterBills)
    const actualValues = months
      .map((month) => actualBalanceForMonth(month, currentMonthIdx, currentActualBalance))
      .filter((value): value is number => value != null)
    const allY = [...balanceValues, ...actualValues, bufferAmount, 0]
    const minVal = Math.min(...allY)
    const maxVal = Math.max(...allY)
    const { yMin, yMax } = computeZeroAnchoredDomain(minVal, maxVal, 0.1)
    const yTicks = computeNiceTicks(yMin, yMax, 4)

    return { yMin, yMax, yTicks }
  }, [bufferAmount, currentActualBalance, currentMonthIdx, months])

  if (!chart || months.length === 0) return null

  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM
  const plotWidth = layout?.plotWidth ?? 1

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

  const actualPoints = months
    .map((month, index) => {
      const actual = actualBalanceForMonth(month, currentMonthIdx, currentActualBalance)
      if (actual == null) return null
      return {
        month,
        x: xForIndex(index),
        y: yForValue(actual),
        actual,
        planned: month.balanceAfterBills,
      }
    })
    .filter((point): point is NonNullable<typeof point> => point != null)

  const bufferY = yForValue(bufferAmount)
  const zeroY = chart.yMin <= 0 && chart.yMax >= 0 ? yForValue(0) : null

  return (
    <div ref={anchorRef} className="reserve-plan-chart" role="img" aria-label="Reserve balance plan chart">
      {layout && layout.plotWidth > 0 ? (
        <svg
          viewBox={`0 0 ${layout.plotWidth} ${CHART_HEIGHT}`}
          className="reserve-plan-chart-svg"
          preserveAspectRatio="none"
          style={{ marginLeft: layout.plotLeft, width: layout.plotWidth }}
        >
          <rect
            x={0}
            y={PAD_TOP}
            width={layout.plotWidth}
            height={plotHeight}
            className="reserve-plan-chart-plot-bg"
            rx="6"
          />

          {chart.yTicks.map((tick) => {
            if (isChartZeroTick(tick)) return null
            const y = yForValue(tick)
            return (
              <g key={tick}>
                <line x1={0} y1={y} x2={layout.plotWidth} y2={y} className="reserve-plan-chart-grid" />
                <text x={4} y={y + 3} textAnchor="start" className="reserve-plan-chart-axis">
                  {formatAxisCurrency(tick)}
                </text>
              </g>
            )
          })}

          {zeroY !== null && (
            <g className="chart-zero-line-group" aria-hidden>
              <line x1={0} y1={zeroY} x2={layout.plotWidth} y2={zeroY} className="chart-zero-line" />
              <text x={4} y={zeroY + 3} textAnchor="start" className="reserve-plan-chart-axis chart-axis-tick-zero">
                {formatAxisCurrency(0)}
              </text>
            </g>
          )}

          {months.map((month, index) => {
            if (index !== currentMonthIdx) return null
            const x = xForIndex(index)
            const half = (layout.monthWidths[index] ?? layout.plotWidth / 12) / 2
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
            x2={layout.plotWidth}
            y2={bufferY}
            className="reserve-plan-chart-buffer"
          />

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

          <polygon
            className="reserve-plan-chart-area"
            points={[
              ...balancePoints.map((p) => `${p.x},${p.y}`),
              `${balancePoints[balancePoints.length - 1]!.x},${PAD_TOP + plotHeight}`,
              `${balancePoints[0]!.x},${PAD_TOP + plotHeight}`,
            ].join(' ')}
          />

          <polyline
            className="reserve-plan-chart-balance-line"
            fill="none"
            points={balancePoints.map((p) => `${p.x},${p.y}`).join(' ')}
          />

          {actualPoints.length > 0 && (
            <polyline
              className="reserve-plan-chart-actual-line"
              fill="none"
              points={actualPoints.map((p) => `${p.x},${p.y}`).join(' ')}
            />
          )}

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

          {actualPoints.map((point) => (
            <g key={`actual-${point.month.month}`}>
              <circle cx={point.x} cy={point.y} r={4} className="reserve-plan-chart-actual-dot" />
              <title>
                {point.month.month}: actual {formatCurrency(point.actual)} · planned{' '}
                {formatCurrency(point.planned)}
              </title>
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
          <span className="reserve-plan-chart-legend-swatch reserve-plan-chart-legend-swatch--actual" />
          Actual / confirmed
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
