/**
 * Bank balance vs Cash Prophet Balance — timing noise vs clearer underlying trend.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** Erratic bank cash (k) — income spikes and large bill drops. */
const BANK_K = [42, 51, 33, 48, 39, 55, 31, 47, 36, 52, 34, 49] as const

/** Cash Prophet Balance (k) — still moves, with a clearer underlying path. */
const PROPHET_K = [24, 26, 23, 27, 28, 26, 29, 31, 28, 32, 30, 33] as const

const W = 640
const H = 260
const PAD_L = 44
const PAD_R = 18
const PAD_T = 36
const PAD_B = 40
const PLOT_W = W - PAD_L - PAD_R
const PLOT_H = H - PAD_T - PAD_B
const Y_MAX = 60

function xAt(i: number, n: number) {
  return PAD_L + (i / (n - 1)) * PLOT_W
}

function yAt(valueK: number) {
  return PAD_T + (1 - valueK / Y_MAX) * PLOT_H
}

function linePath(values: readonly number[]) {
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i, values.length).toFixed(1)} ${yAt(v).toFixed(1)}`)
    .join(' ')
}

export function BalanceCompareTrendVisual() {
  const bankPath = linePath(BANK_K)
  const prophetPath = linePath(PROPHET_K)
  const n = MONTHS.length

  return (
    <figure
      className="balance-compare-trend"
      aria-label="Comparison chart: bank balance jumps with the timing of income and large payments, while Cash Prophet Balance still rises and falls but shows a clearer underlying direction"
    >
      <figcaption className="balance-compare-trend-caption">Bank balance vs Cash Prophet Balance</figcaption>
      <svg className="balance-compare-trend-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden>
        {[0, 20, 40, 60].map((tick) => (
          <g key={tick}>
            <line
              x1={PAD_L}
              y1={yAt(tick)}
              x2={W - PAD_R}
              y2={yAt(tick)}
              className="balance-compare-trend-grid"
            />
            <text x={PAD_L - 8} y={yAt(tick) + 4} textAnchor="end" className="balance-compare-trend-axis">
              £{tick}k
            </text>
          </g>
        ))}

        <path d={bankPath} className="balance-compare-trend-line balance-compare-trend-line--bank" />
        <path d={prophetPath} className="balance-compare-trend-line balance-compare-trend-line--prophet" />

        {BANK_K.map((v, i) => (
          <circle
            key={`b-${MONTHS[i]}`}
            cx={xAt(i, n)}
            cy={yAt(v)}
            r="3.2"
            className="balance-compare-trend-dot balance-compare-trend-dot--bank"
          />
        ))}
        {PROPHET_K.map((v, i) => (
          <circle
            key={`p-${MONTHS[i]}`}
            cx={xAt(i, n)}
            cy={yAt(v)}
            r="3.2"
            className="balance-compare-trend-dot balance-compare-trend-dot--prophet"
          />
        ))}

        {/* Direct line labels */}
        <text
          x={xAt(2, n) + 6}
          y={yAt(BANK_K[2]!) - 10}
          className="balance-compare-trend-inline balance-compare-trend-inline--bank"
        >
          Bank balance
        </text>
        <text
          x={xAt(8, n) + 4}
          y={yAt(PROPHET_K[8]!) - 10}
          className="balance-compare-trend-inline balance-compare-trend-inline--prophet"
        >
          Cash Prophet Balance
        </text>

        {MONTHS.map((month, i) => (
          <text
            key={month}
            x={xAt(i, n)}
            y={H - 14}
            textAnchor="middle"
            className="balance-compare-trend-month"
          >
            {month}
          </text>
        ))}
      </svg>
      <div className="balance-compare-trend-legend" aria-hidden>
        <span>
          <i className="balance-compare-trend-swatch balance-compare-trend-swatch--bank" /> Bank balance
        </span>
        <span>
          <i className="balance-compare-trend-swatch balance-compare-trend-swatch--prophet" /> Cash Prophet
          Balance
        </span>
      </div>
    </figure>
  )
}
