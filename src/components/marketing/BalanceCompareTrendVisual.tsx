/**
 * Bank balance vs Cash Prophet Balance — timing noise vs clearer underlying trend.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/**
 * Erratic bank cash (k) — sharp income spikes and large bill/VAT/payroll drops.
 * Values chosen so month-to-month swings are obviously larger than the prophet series.
 */
const BANK_K = [36, 61, 24, 58, 29, 72, 18, 54, 27, 69, 21, 57] as const

/**
 * Cash Prophet Balance (k) — still rises and falls, with a clearer underlying path
 * as known obligations are accounted for progressively.
 */
const PROPHET_K = [23, 26, 22, 27, 29, 25, 28, 31, 27, 32, 29, 33] as const

const W = 680
const H = 280
const PAD_L = 44
const PAD_R = 16
const PAD_T = 22
const PAD_B = 38
const PLOT_W = W - PAD_L - PAD_R
const PLOT_H = H - PAD_T - PAD_B
const Y_MAX = 80

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
        {[0, 20, 40, 60, 80].map((tick) => (
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
            r="3"
            className="balance-compare-trend-dot balance-compare-trend-dot--bank"
          />
        ))}
        {PROPHET_K.map((v, i) => (
          <circle
            key={`p-${MONTHS[i]}`}
            cx={xAt(i, n)}
            cy={yAt(v)}
            r="3"
            className="balance-compare-trend-dot balance-compare-trend-dot--prophet"
          />
        ))}

        {MONTHS.map((month, i) => (
          <text
            key={month}
            x={xAt(i, n)}
            y={H - 12}
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
