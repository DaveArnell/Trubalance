/**
 * Marketing Reserve Planner graph — equal monthly transfers, bill drops only.
 * Inspired by the in-app chart (Cornerstone Coffee Co. shape).
 */

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
  const totalDues = DUES.reduce((sum, due) => sum + due, 0)
  // Opening so the year ends near the buffer after equal monthly funding.
  // Walk the year; nudge opening until the lowest month stays at/above buffer.
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
  return { afterDeposit, afterBills, peak, totalDues, opening }
}

const PLAN = buildYearPlan()

const W = 720
const H = 220
const PAD_L = 48
const PAD_R = 16
const PAD_T = 28
const PAD_B = 36
const Y_MAX = Math.ceil((PLAN.peak * 1.08) / 500) * 500

function xAt(i: number) {
  const plotW = W - PAD_L - PAD_R
  return PAD_L + (plotW / 12) * i + plotW / 24
}

function yAt(v: number) {
  const plotH = H - PAD_T - PAD_B
  return PAD_T + (1 - v / Y_MAX) * plotH
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

export function MethodReservePlannerVisual() {
  const { afterDeposit, afterBills } = PLAN
  const plotBottom = H - PAD_B
  const bufferY = yAt(BUFFER)
  const ticks = axisTicks(Y_MAX)

  const stepped: { x: number; y: number }[] = []
  afterBills.forEach((_, i) => {
    if (DUES[i]! > 0) {
      stepped.push({ x: xAt(i), y: yAt(afterDeposit[i]!) })
      stepped.push({ x: xAt(i), y: yAt(afterBills[i]!) })
    } else {
      stepped.push({ x: xAt(i), y: yAt(afterBills[i]!) })
    }
  })

  const areaPoints = [
    ...stepped.map((p) => `${p.x},${p.y}`),
    `${xAt(11)},${plotBottom}`,
    `${xAt(0)},${plotBottom}`,
  ].join(' ')

  return (
    <figure className="method-reserve-viz" aria-label="Example reserve plan chart">
      <div className="method-reserve-viz-frame">
        <div className="method-reserve-viz-meta">
          <p className="method-reserve-viz-kicker">Example · Cornerstone Coffee Co.</p>
          <p className="method-reserve-viz-title">
            £{MONTHLY_DEPOSIT.toLocaleString('en-GB')} into the reserve every month
          </p>
        </div>

        <svg className="method-reserve-viz-svg" viewBox={`0 0 ${W} ${H}`} role="img">
          <title>
            Planned reserve balance rises by the same monthly transfer each month, then drops when
            corporation tax, VAT or insurance is due
          </title>

          <rect
            x={PAD_L}
            y={PAD_T}
            width={W - PAD_L - PAD_R}
            height={H - PAD_T - PAD_B}
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

          <polygon points={areaPoints} className="method-reserve-viz-area" />

          {/* Equal green rises: always end-of-month balance → next month after deposit */}
          {afterBills.slice(0, -1).map((_, i) => {
            const nextDue = DUES[i + 1]! > 0
            const y2 = nextDue ? yAt(afterDeposit[i + 1]!) : yAt(afterBills[i + 1]!)
            return (
              <line
                key={`seg-${i}`}
                x1={xAt(i)}
                y1={yAt(afterBills[i]!)}
                x2={xAt(i + 1)}
                y2={y2}
                className="method-reserve-viz-line"
              />
            )
          })}

          {afterBills.map((bal, i) => {
            if (DUES[i]! <= 0) return null
            return (
              <g key={`due-${i}`}>
                <line
                  x1={xAt(i)}
                  y1={yAt(afterDeposit[i]!)}
                  x2={xAt(i)}
                  y2={yAt(bal)}
                  className="method-reserve-viz-drop"
                />
                <text
                  x={xAt(i)}
                  y={yAt(afterDeposit[i]!) - 8}
                  textAnchor="middle"
                  className="method-reserve-viz-due-label"
                >
                  {DUE_LABELS[i]}
                </text>
              </g>
            )
          })}

          {afterBills.map((bal, i) => (
            <circle key={`dot-${i}`} cx={xAt(i)} cy={yAt(bal)} r={3.2} className="method-reserve-viz-dot" />
          ))}

          {MONTHS.map((month, i) => (
            <text key={month} x={xAt(i)} y={H - 10} textAnchor="middle" className="method-reserve-viz-month">
              {month}
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

      <figcaption className="method-reserve-viz-caption">
        The same amount goes into the reserve every month, so the green line climbs at a steady rate.
        When corporation tax, VAT or insurance is due, the red drop shows that money leaving — already
        set aside, not a surprise from the current account.
      </figcaption>
    </figure>
  )
}
