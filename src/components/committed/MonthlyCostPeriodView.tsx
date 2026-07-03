import { useMemo, useRef, useState } from 'react'
import type { CommitmentAccruingRow } from '../../types'
import {
  buildMonthAccruingWindowSimulation,
  windowEndDay,
} from '../../utils/monthCostSimulation'
import { computeNiceTicks, formatAxisCurrency } from '../../utils/chartFormat'
import { formatCurrency } from '../../utils/format'

interface MonthlyCostPeriodViewProps {
  rows: CommitmentAccruingRow[]
  compact?: boolean
}

const CHART = { left: 56, right: 520, top: 22, bottom: 108 }
const VIEW_WIDTH = 540
const VIEW_HEIGHT = 140

function ordinalDay(day: number) {
  if (day >= 11 && day <= 13) return `${day}th`
  const mod = day % 10
  if (mod === 1) return `${day}st`
  if (mod === 2) return `${day}nd`
  if (mod === 3) return `${day}rd`
  return `${day}th`
}

function offsetToX(offset: number, windowDays: number) {
  return CHART.left + (offset / Math.max(1, windowDays - 1)) * (CHART.right - CHART.left)
}

function valueToY(value: number, yMin: number, yMax: number) {
  const span = Math.max(1, yMax - yMin)
  const t = (value - yMin) / span
  return CHART.bottom - t * (CHART.bottom - CHART.top)
}

export function MonthlyCostPeriodView({ rows, compact = false }: MonthlyCostPeriodViewProps) {
  const [windowStartDay, setWindowStartDay] = useState(1)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startDay: number } | null>(null)

  const simulation = useMemo(
    () => buildMonthAccruingWindowSimulation(rows, windowStartDay),
    [rows, windowStartDay],
  )

  const chart = useMemo(() => {
    const values = simulation.series.map((point) => point.accruing)
    const maxVal = Math.max(...values, 1)
    const padding = maxVal * 0.1 || 100
    const yMin = 0
    const yMax = maxVal + padding
    const yTicks = computeNiceTicks(yMin, yMax, compact ? 4 : 5)

    const accruedPath = simulation.series
      .map(
        (point) =>
          `${offsetToX(point.offset, simulation.windowDays).toFixed(1)},${valueToY(point.accruing, yMin, yMax).toFixed(1)}`,
      )
      .join(' ')

    const tickCount = 6
    const axisMarks = Array.from({ length: tickCount }, (_, index) => {
      const offset = Math.round((index / (tickCount - 1)) * (simulation.windowDays - 1))
      const point = simulation.series[offset]!
      return {
        offset,
        dayInMonth: point.dayInMonth,
        isMonthStart: offset === simulation.monthStartOffset,
        isToday: offset === simulation.todayOffset,
      }
    })

    return {
      yMin,
      yMax,
      yTicks,
      accruedPath,
      axisMarks,
      monthStartX: offsetToX(simulation.monthStartOffset, simulation.windowDays),
      todayX: offsetToX(simulation.todayOffset, simulation.windowDays),
    }
  }, [simulation, compact])

  const windowLabel = `${ordinalDay(simulation.windowStartDay)} – ${ordinalDay(
    windowEndDay(simulation.windowStartDay, simulation.daysInMonth),
  )}`

  const beginDrag = (clientX: number) => {
    dragRef.current = { startX: clientX, startDay: simulation.windowStartDay }
    setDragging(true)
  }

  const moveDrag = (clientX: number) => {
    if (!dragRef.current) return
    const chartWidth = CHART.right - CHART.left
    const dx = clientX - dragRef.current.startX
    const dayShift = Math.round(-dx / (chartWidth / simulation.windowDays))
    if (dayShift === 0) return
    const next =
      ((((dragRef.current.startDay - 1 + dayShift) % simulation.daysInMonth) + simulation.daysInMonth) %
        simulation.daysInMonth) +
      1
    setWindowStartDay(next)
  }

  const endDrag = () => {
    dragRef.current = null
    setDragging(false)
  }

  if (rows.length === 0) {
    return <p className="muted">Add monthly costs to see the period view.</p>
  }

  return (
    <div className={`month-sim-embedded${compact ? ' month-sim-embedded--compact' : ''}`}>
      <p className="muted month-sim-embedded-note">
        How costs build through the month. Drag the chart to shift the period — for example 15th to 14th.
      </p>

      <div className="month-sim-kpis month-sim-kpis--compact">
        <div className="month-sim-kpi">
          <span className="month-sim-kpi-label">Viewing period</span>
          <strong>{windowLabel}</strong>
          <span className="muted">drag chart to shift</span>
        </div>
        <div className="month-sim-kpi">
          <span className="month-sim-kpi-label">Peak accruing</span>
          <strong>{formatCurrency(simulation.peakAccruing)}</strong>
          <span className="muted">
            {ordinalDay(simulation.series[simulation.peakOffset]?.dayInMonth ?? 1)}
          </span>
        </div>
      </div>

      <div
        className={`month-sim-chart-wrap${dragging ? ' month-sim-chart-wrap--dragging' : ''}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          beginDrag(event.clientX)
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return
          moveDrag(event.clientX)
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
          endDrag()
        }}
        onPointerCancel={endDrag}
        title="Drag to shift the period"
      >
        <svg
          className="month-sim-chart"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect
            x={CHART.left}
            y={CHART.top}
            width={CHART.right - CHART.left}
            height={CHART.bottom - CHART.top}
            className="month-sim-plot-bg"
            rx="6"
          />

          {chart.yTicks.map((tick) => {
            const y = valueToY(tick, chart.yMin, chart.yMax)
            return (
              <g key={tick}>
                <line
                  x1={CHART.left}
                  x2={CHART.right}
                  y1={y}
                  y2={y}
                  className="month-sim-grid month-sim-grid--y"
                />
                <text x={CHART.left - 8} y={y + 3} className="month-sim-axis-y" textAnchor="end">
                  {formatAxisCurrency(tick)}
                </text>
              </g>
            )
          })}

          <line
            x1={chart.monthStartX}
            x2={chart.monthStartX}
            y1={CHART.top}
            y2={CHART.bottom}
            className="month-sim-month-start"
          />
          {simulation.todayOffset === simulation.monthStartOffset ? (
            <text
              x={chart.monthStartX}
              y={CHART.top - 5}
              className="month-sim-month-start-label"
              textAnchor="middle"
            >
              Month start · Today
            </text>
          ) : (
            <>
              <text
                x={chart.monthStartX}
                y={CHART.top - 5}
                className="month-sim-month-start-label"
                textAnchor="middle"
              >
                Month start
              </text>
              <line
                x1={chart.todayX}
                x2={chart.todayX}
                y1={CHART.top}
                y2={CHART.bottom}
                className="month-sim-today"
              />
              <text
                x={chart.todayX}
                y={CHART.top - 5}
                className="month-sim-today-label"
                textAnchor="middle"
              >
                Today
              </text>
            </>
          )}

          {chart.axisMarks.map((mark) => (
            <g key={mark.offset}>
              <line
                x1={offsetToX(mark.offset, simulation.windowDays)}
                x2={offsetToX(mark.offset, simulation.windowDays)}
                y1={CHART.top}
                y2={CHART.bottom}
                className="month-sim-grid"
              />
              <text
                x={offsetToX(mark.offset, simulation.windowDays)}
                y={CHART.bottom + 16}
                className={`month-sim-axis${mark.isMonthStart ? ' month-sim-axis--month-start' : ''}${
                  mark.isToday ? ' month-sim-axis--today' : ''
                }`}
                textAnchor="middle"
              >
                {mark.dayInMonth}
              </text>
            </g>
          ))}

          <polyline className="month-sim-line month-sim-line--accruing" points={chart.accruedPath} />
        </svg>
      </div>

      {simulation.dueMarkers.length > 0 && (
        <div className="month-sim-bills">
          <h4 className="month-sim-bills-title">Due in this period</h4>
          <table className="month-sim-bills-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Amount</th>
                <th>Costs</th>
              </tr>
            </thead>
            <tbody>
              {simulation.dueMarkers.map((marker) => (
                <tr key={`${marker.offset}-${marker.dayInMonth}`}>
                  <td>{ordinalDay(marker.dayInMonth)}</td>
                  <td>{formatCurrency(marker.amount)}</td>
                  <td className="month-sim-bills-names">{marker.labels.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
