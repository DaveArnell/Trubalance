/**
 * Marketing Reserve Planner graph — inspired by the in-app chart
 * (Cornerstone Coffee Co. style: monthly deposits, bill drops, buffer).
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** Stylised planned reserve balance after each month’s bills (Cornerstone-shaped). */
const AFTER_BILLS = [2100, 3400, 1400, 800, 2200, 900, 2300, 3700, 1100, 1600, 3000, 900] as const
/** Balance after the monthly deposit, before bills in that month (for drop tops). */
const AFTER_DEPOSIT = [2100, 3400, 5600, 7000, 2200, 5700, 2300, 3700, 6200, 3400, 3000, 5500] as const
const DUES = [0, 0, 4200, 6200, 0, 4800, 0, 0, 5100, 1800, 0, 4600] as const
const DUE_LABELS: Record<number, string> = {
  2: 'VAT',
  3: 'Rates',
  5: 'VAT',
  8: 'VAT',
  9: 'Insurance',
  11: 'VAT',
}

const W = 720
const H = 220
const PAD_L = 44
const PAD_R = 16
const PAD_T = 28
const PAD_B = 36
const Y_MAX = 7500
const BUFFER = 800
const CURRENT = 6 // Jul highlighted

function xAt(i: number) {
  const plotW = W - PAD_L - PAD_R
  return PAD_L + (plotW / 12) * i + plotW / 24
}

function yAt(v: number) {
  const plotH = H - PAD_T - PAD_B
  return PAD_T + (1 - v / Y_MAX) * plotH
}

export function MethodReservePlannerVisual() {
  const plotBottom = H - PAD_B
  const bufferY = yAt(BUFFER)

  const stepped: { x: number; y: number }[] = []
  AFTER_BILLS.forEach((_, i) => {
    if (DUES[i]! > 0) {
      stepped.push({ x: xAt(i), y: yAt(AFTER_DEPOSIT[i]!) })
      stepped.push({ x: xAt(i), y: yAt(AFTER_BILLS[i]!) })
    } else {
      stepped.push({ x: xAt(i), y: yAt(AFTER_BILLS[i]!) })
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
          <p className="method-reserve-viz-title">Reserve balance through the year</p>
        </div>

        <svg className="method-reserve-viz-svg" viewBox={`0 0 ${W} ${H}`} role="img">
          <title>
            Planned reserve balance rises with monthly transfers, then drops when VAT, rates and
            insurance are due
          </title>

          <rect
            x={PAD_L}
            y={PAD_T}
            width={W - PAD_L - PAD_R}
            height={H - PAD_T - PAD_B}
            className="method-reserve-viz-plot"
            rx="8"
          />

          {/* Current month band */}
          <rect
            x={xAt(CURRENT) - (W - PAD_L - PAD_R) / 24}
            y={PAD_T}
            width={(W - PAD_L - PAD_R) / 12}
            height={H - PAD_T - PAD_B}
            className="method-reserve-viz-current"
          />

          {[0, 2500, 5000, 7500].map((tick) => (
            <g key={tick}>
              <line
                x1={PAD_L}
                y1={yAt(tick)}
                x2={W - PAD_R}
                y2={yAt(tick)}
                className="method-reserve-viz-grid"
              />
              <text x={PAD_L - 8} y={yAt(tick) + 4} textAnchor="end" className="method-reserve-viz-axis">
                {tick === 0 ? '£0' : `£${(tick / 1000).toFixed(tick % 1000 ? 1 : 0)}k`}
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
          <text x={W - PAD_R - 4} y={bufferY - 6} textAnchor="end" className="method-reserve-viz-buffer-label">
            Buffer
          </text>

          <polygon points={areaPoints} className="method-reserve-viz-area" />

          {AFTER_BILLS.slice(0, -1).map((_, i) => {
            const nextDue = DUES[i + 1]! > 0
            const y2 = nextDue ? yAt(AFTER_DEPOSIT[i + 1]!) : yAt(AFTER_BILLS[i + 1]!)
            return (
              <line
                key={`seg-${i}`}
                x1={xAt(i)}
                y1={yAt(AFTER_BILLS[i]!)}
                x2={xAt(i + 1)}
                y2={y2}
                className="method-reserve-viz-line"
              />
            )
          })}

          {AFTER_BILLS.map((bal, i) => {
            if (DUES[i]! <= 0) return null
            return (
              <g key={`due-${i}`}>
                <line
                  x1={xAt(i)}
                  y1={yAt(AFTER_DEPOSIT[i]!)}
                  x2={xAt(i)}
                  y2={yAt(bal)}
                  className="method-reserve-viz-drop"
                />
                <text
                  x={xAt(i)}
                  y={yAt(AFTER_DEPOSIT[i]!) - 8}
                  textAnchor="middle"
                  className="method-reserve-viz-due-label"
                >
                  {DUE_LABELS[i]}
                </text>
              </g>
            )
          })}

          {AFTER_BILLS.map((bal, i) => (
            <circle
              key={`dot-${i}`}
              cx={xAt(i)}
              cy={yAt(bal)}
              r={i === CURRENT ? 4.5 : 3.2}
              className={`method-reserve-viz-dot${i === CURRENT ? ' method-reserve-viz-dot--now' : ''}`}
            />
          ))}

          {MONTHS.map((month, i) => (
            <text
              key={month}
              x={xAt(i)}
              y={H - 10}
              textAnchor="middle"
              className={`method-reserve-viz-month${i === CURRENT ? ' method-reserve-viz-month--now' : ''}`}
            >
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
        Each month you move a set amount into the reserve. The green line climbs as that money builds,
        then drops when VAT, rates or insurance leave the account — so those bills are already covered
        instead of arriving as a surprise.
      </figcaption>
    </figure>
  )
}
