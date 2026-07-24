/**
 * Marketing Reserve Planner graph — equal monthly transfers, bill drops only.
 * Drag rotates a continuous year window; the line extends past both edges so
 * wrap-around (e.g. Dec → Jan) never looks cut off.
 */

import { useId, useRef, useState } from 'react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** Same transfer every month — the green climb is always this step. */
const MONTHLY_DEPOSIT = 2200
const BUFFER = 800

/** Bills due in each month (index 0 = Jan). */
const DUES = [
  6000, // Jan — corporation tax
  0,
  4200, // Mar — VAT
  0,
  0,
  4800, // Jun — VAT
  0,
  0,
  5100, // Sep — VAT
  1800, // Oct — business insurance
  0,
  4600, // Dec — VAT
] as const

const DUE_LABELS: Record<number, string> = {
  0: 'Corp tax',
  2: 'VAT',
  5: 'VAT',
  8: 'VAT',
  9: 'Insurance',
  11: 'VAT',
}

function buildYearPlan() {
  let opening = BUFFER
  for (let attempt = 0; attempt < 40; attempt++) {
    let balance = opening
    let lowest = Infinity
    for (let i = 0; i < 12; i++) {
      balance += MONTHLY_DEPOSIT
      balance -= DUES[i]!
      if (balance < lowest) lowest = balance
    }
    if (lowest >= BUFFER) break
    opening += BUFFER - lowest
  }

  const afterDeposit: number[] = []
  const afterBills: number[] = []
  let balance = opening
  for (let i = 0; i < 12; i++) {
    balance += MONTHLY_DEPOSIT
    afterDeposit.push(balance)
    balance -= DUES[i]!
    afterBills.push(balance)
  }

  const peak = Math.max(...afterDeposit, BUFFER)
  return { afterDeposit, afterBills, peak, opening }
}

const PLAN = buildYearPlan()

const W = 720
const H = 220
const PAD_L = 48
const PAD_R = 16
const PAD_T = 28
const PAD_B = 36
const Y_MAX = Math.ceil((PLAN.peak * 1.08) / 500) * 500
const PLOT_W = W - PAD_L - PAD_R
const PLOT_H = H - PAD_T - PAD_B

/** Start at Nov so Dec→Jan climb is on-screen by default. */
const DEFAULT_START = 10

function xAt(i: number) {
  return PAD_L + (PLOT_W / 12) * i + PLOT_W / 24
}

function yAt(v: number) {
  return PAD_T + (1 - v / Y_MAX) * PLOT_H
}

function axisTicks(max: number): number[] {
  const step = max <= 6000 ? 2000 : max <= 10000 ? 2500 : 3000
  const ticks: number[] = [0]
  for (let v = step; v <= max; v += step) ticks.push(v)
  return ticks
}

function formatAxis(v: number): string {
  if (v === 0) return '£0'
  if (v >= 1000) return `£${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
  return `£${v}`
}

function monthAt(windowStart: number, offset: number) {
  return (((windowStart + offset) % 12) + 12) % 12
}

/** Stepped path through one month: peak then drop when a bill is due. */
function pointsForMonth(
  monthIdx: number,
  slot: number,
  afterDeposit: number[],
  afterBills: number[],
): { x: number; y: number }[] {
  if (DUES[monthIdx]! > 0) {
    return [
      { x: xAt(slot), y: yAt(afterDeposit[monthIdx]!) },
      { x: xAt(slot), y: yAt(afterBills[monthIdx]!) },
    ]
  }
  return [{ x: xAt(slot), y: yAt(afterBills[monthIdx]!) }]
}

export function MethodReservePlannerVisual() {
  const clipId = useId().replace(/:/g, '')
  const { afterDeposit, afterBills } = PLAN
  const [windowStart, setWindowStart] = useState(DEFAULT_START)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startWindow: number } | null>(null)

  /** Visible months 0–11, plus one neighbour either side for continuous edges. */
  const extendedSlots = Array.from({ length: 14 }, (_, i) => i - 1)
  const visibleOrder = Array.from({ length: 12 }, (_, i) => monthAt(windowStart, i))

  const stepped: { x: number; y: number }[] = []
  for (const slot of extendedSlots) {
    const monthIdx = monthAt(windowStart, slot)
    stepped.push(...pointsForMonth(monthIdx, slot, afterDeposit, afterBills))
  }

  // Climb segments between consecutive months (including into edge ghosts)
  const climbSegments: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
  for (let slot = -1; slot < 12; slot++) {
    const monthIdx = monthAt(windowStart, slot)
    const nextIdx = monthAt(windowStart, slot + 1)
    const nextDue = DUES[nextIdx]! > 0
    climbSegments.push({
      key: `climb-${slot}-${monthIdx}-${nextIdx}`,
      x1: xAt(slot),
      y1: yAt(afterBills[monthIdx]!),
      x2: xAt(slot + 1),
      y2: nextDue ? yAt(afterDeposit[nextIdx]!) : yAt(afterBills[nextIdx]!),
    })
  }

  const plotBottom = H - PAD_B
  const bufferY = yAt(BUFFER)
  const ticks = axisTicks(Y_MAX)

  const linePath = stepped
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  const areaPath = `${linePath} L${xAt(12).toFixed(2)} ${plotBottom} L${xAt(-1).toFixed(2)} ${plotBottom} Z`

  const beginDrag = (clientX: number) => {
    dragRef.current = { startX: clientX, startWindow: windowStart }
    setDragging(true)
  }

  const moveDrag = (clientX: number) => {
    if (!dragRef.current) return
    const dx = clientX - dragRef.current.startX
    const monthShift = Math.round(-dx / (PLOT_W / 12))
    const next = (((dragRef.current.startWindow + monthShift) % 12) + 12) % 12
    setWindowStart(next)
  }

  const endDrag = () => {
    dragRef.current = null
    setDragging(false)
  }

  return (
    <figure
      className="method-reserve-viz"
      aria-label="Cash Prophet Reserve Planner chart — planned set-asides for large UK business bills across the year"
    >
      <div
        className={`method-reserve-viz-frame${dragging ? ' method-reserve-viz-frame--dragging' : ''}`}
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
        title="Drag to rotate the year"
      >
        <div className="method-reserve-viz-meta">
          <p className="method-reserve-viz-kicker">Example · Cornerstone Coffee Co.</p>
          <p className="method-reserve-viz-title">
            £{MONTHLY_DEPOSIT.toLocaleString('en-GB')} into the reserve every month
          </p>
          <p className="method-reserve-viz-drag-hint">
            Cash Prophet turns large bills into manageable monthly amounts, so they don&apos;t land as
            sudden hits on your everyday balance.
          </p>
        </div>

        <svg
          className="method-reserve-viz-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Cash Prophet reserve balance rises with equal monthly transfers, then drops when bills are due"
        >
          <title>
            Planned reserve balance rises with equal monthly transfers, then drops when bills are due.
            Drag to rotate the continuous year.
          </title>

          <defs>
            <clipPath id={`${clipId}-plot`}>
              <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} rx="8" />
            </clipPath>
            <linearGradient id={`${clipId}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d8f5b" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#0d8f5b" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            className="method-reserve-viz-plot"
            rx="8"
          />

          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD_L}
                y1={yAt(tick)}
                x2={W - PAD_R}
                y2={yAt(tick)}
                className="method-reserve-viz-grid"
              />
              <text x={PAD_L - 8} y={yAt(tick) + 4} textAnchor="end" className="method-reserve-viz-axis">
                {formatAxis(tick)}
              </text>
            </g>
          ))}

          <line
            x1={PAD_L}
            y1={bufferY}
            x2={W - PAD_R}
            y2={bufferY}
            className="method-reserve-viz-buffer"
          />
          <text
            x={W - PAD_R - 4}
            y={bufferY - 6}
            textAnchor="end"
            className="method-reserve-viz-buffer-label"
          >
            Buffer
          </text>

          <g clipPath={`url(#${clipId}-plot)`}>
            <path d={areaPath} fill={`url(#${clipId}-area)`} className="method-reserve-viz-area" />

            {climbSegments.map((seg) => (
              <line
                key={seg.key}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                className="method-reserve-viz-line"
              />
            ))}

            {extendedSlots.map((slot) => {
              const monthIdx = monthAt(windowStart, slot)
              if (DUES[monthIdx]! <= 0) return null
              return (
                <line
                  key={`due-line-${slot}-${monthIdx}`}
                  x1={xAt(slot)}
                  y1={yAt(afterDeposit[monthIdx]!)}
                  x2={xAt(slot)}
                  y2={yAt(afterBills[monthIdx]!)}
                  className="method-reserve-viz-drop"
                />
              )
            })}

            {extendedSlots.map((slot) => {
              const monthIdx = monthAt(windowStart, slot)
              return (
                <circle
                  key={`dot-${slot}-${monthIdx}`}
                  cx={xAt(slot)}
                  cy={yAt(afterBills[monthIdx]!)}
                  r={slot >= 0 && slot < 12 ? 3.2 : 2.4}
                  className="method-reserve-viz-dot"
                  opacity={slot >= 0 && slot < 12 ? 1 : 0.55}
                />
              )
            })}
          </g>

          {visibleOrder.map((monthIdx, i) => {
            if (DUES[monthIdx]! <= 0) return null
            return (
              <text
                key={`due-label-${monthIdx}-${i}`}
                x={xAt(i)}
                y={yAt(afterDeposit[monthIdx]!) - 8}
                textAnchor="middle"
                className="method-reserve-viz-due-label"
              >
                {DUE_LABELS[monthIdx]}
              </text>
            )
          })}

          {visibleOrder.map((monthIdx, i) => (
            <text
              key={`label-${monthIdx}-${i}`}
              x={xAt(i)}
              y={H - 10}
              textAnchor="middle"
              className="method-reserve-viz-month"
            >
              {MONTHS[monthIdx]}
            </text>
          ))}
        </svg>

        <div className="method-reserve-viz-legend" aria-hidden>
          <span>
            <i className="method-reserve-viz-swatch method-reserve-viz-swatch--plan" /> Planned balance
          </span>
          <span>
            <i className="method-reserve-viz-swatch method-reserve-viz-swatch--due" /> Bills due
          </span>
          <span>
            <i className="method-reserve-viz-swatch method-reserve-viz-swatch--buffer" /> Minimum buffer
          </span>
        </div>
      </div>
    </figure>
  )
}
