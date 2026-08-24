/**
 * Compact Cash Prophet dashboard for the homepage hero.
 * Same layout and figures as the product, drawn flat so it fills the card.
 */
const BUILDING = [
  { due: 'Due 1st', name: 'Business Rates', accrued: '£1,850', total: '£2,000', pct: 92.5 },
  { due: 'Due 15th', name: 'Loan', accrued: '£1,100', total: '£1,300', pct: 84.6 },
  { due: 'Due 10th', name: 'Insurance', accrued: '£180', total: '£400', pct: 45 },
  { due: 'Due 1st', name: 'Rent', accrued: '£2,200', total: '£5,800', pct: 37.9 },
] as const

const TREND =
  'M8 52 C 28 46, 48 48, 68 38 C 88 28, 108 34, 128 26 C 148 18, 168 22, 188 14 C 200 10, 212 12, 224 8'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
const CURRENT_MONTH = 6

/** Planned month-end (k) and peak before a due bill, matching the real reserve sawtooth. */
const RESERVE_MONTHS = [
  { after: 1.2, before: 8.0, due: true },
  { after: 3.0, before: 3.0, due: false },
  { after: 1.5, before: 5.0, due: true },
  { after: 3.2, before: 3.2, due: false },
  { after: 5.0, before: 5.0, due: false },
  { after: 2.0, before: 7.5, due: true },
  { after: 4.0, before: 4.0, due: false },
  { after: 6.2, before: 6.2, due: false },
  { after: 2.2, before: 10.0, due: true },
  { after: 4.5, before: 4.5, due: false },
  { after: 7.0, before: 7.0, due: false },
  { after: 2.5, before: 10.0, due: true },
] as const

function HomeHeroReserveChart() {
  const w = 420
  const h = 132
  const pad = { l: 34, r: 8, t: 10, b: 22 }
  const plotW = w - pad.l - pad.r
  const plotH = h - pad.t - pad.b
  const yMax = 12
  const buffer = 0.8
  const slot = plotW / 12
  const xAt = (i: number) => pad.l + slot * i + slot / 2
  const yAt = (v: number) => pad.t + (1 - v / yMax) * plotH
  const ticks = [0, 5, 10]

  const points = RESERVE_MONTHS.map((month, i) => ({
    ...month,
    x: xAt(i),
    y: yAt(month.after),
    peakY: yAt(month.before),
  }))

  const line = points
    .slice(0, -1)
    .map((point, i) => {
      const next = points[i + 1]!
      const endY = next.due ? next.peakY : next.y
      return `M ${point.x} ${point.y} L ${next.x} ${endY}`
    })
    .join(' ')

  const areaPts = points.flatMap((point) =>
    point.due ? [`${point.x},${point.peakY}`, `${point.x},${point.y}`] : [`${point.x},${point.y}`],
  )
  const area = `${areaPts.join(' ')} ${points[11]!.x},${pad.t + plotH} ${points[0]!.x},${pad.t + plotH}`

  return (
    <div className="home-hero-dash-reserve" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} className="reserve-plan-chart-svg">
        {ticks.map((tick) => {
          const y = yAt(tick)
          return (
            <g key={tick}>
              <line
                x1={pad.l}
                y1={y}
                x2={w - pad.r}
                y2={y}
                className={tick === 0 ? 'chart-zero-line' : 'reserve-plan-chart-grid'}
              />
              <text x={2} y={y + 3} className="reserve-plan-chart-axis">
                {tick === 0 ? '£0' : tick === 5 ? '£5.0k' : '£10k'}
              </text>
            </g>
          )
        })}
        <rect
          x={xAt(CURRENT_MONTH) - slot / 2}
          y={pad.t}
          width={slot}
          height={plotH}
          className="reserve-plan-chart-current-month"
        />
        <line
          x1={pad.l}
          y1={yAt(buffer)}
          x2={w - pad.r}
          y2={yAt(buffer)}
          className="reserve-plan-chart-buffer"
        />
        <polygon className="reserve-plan-chart-area" points={area} />
        <path d={line} fill="none" className="reserve-plan-chart-balance-line" />
        {points.map((point, i) =>
          point.due ? (
            <line
              key={`due-${MONTHS[i]}`}
              x1={point.x}
              y1={point.peakY}
              x2={point.x}
              y2={point.y}
              className="reserve-plan-chart-outgoing"
            />
          ) : null,
        )}
        {points.map((point, i) => (
          <circle
            key={MONTHS[i]}
            cx={point.x}
            cy={point.y}
            r={i === CURRENT_MONTH ? 4.5 : 3}
            className="reserve-plan-chart-dot"
          />
        ))}
        {MONTHS.map((label, i) => (
          <text
            key={label}
            x={xAt(i)}
            y={h - 6}
            textAnchor="middle"
            className={`reserve-plan-chart-month${i === CURRENT_MONTH ? ' reserve-plan-chart-month--current' : ''}`}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}

export function HomeHeroDashboard() {
  return (
    <div
      className="home-hero-dash"
      aria-label="Cash Prophet dashboard: Cash Prophet Balance, accruing costs, due bills, balance trend and Reserve Planner"
    >
      <div className="home-hero-dash-hero">
        <p className="home-hero-dash-kicker">Cash Prophet Balance</p>
        <p className="home-hero-dash-amount">£21,880</p>
        <p className="home-hero-dash-delta">↑ Up £410 this week · Up £1,860 this month</p>
      </div>

      <div className="home-hero-dash-side">
        <div className="home-hero-dash-card">
          <h3>Business</h3>
          <div className="home-hero-dash-kv">
            <span>Bank balance</span>
            <strong>£33,350</strong>
          </div>
          <div className="home-hero-dash-kv">
            <span>Cash Prophet Balance</span>
            <strong className="home-hero-dash-kv--teal">£21,880</strong>
          </div>
        </div>
        <div className="home-hero-dash-card">
          <h3>Due bills</h3>
          <div className="home-hero-dash-kv">
            <span>VAT</span>
            <strong className="home-hero-dash-kv--due">£5,400</strong>
          </div>
          <div className="home-hero-dash-kv">
            <span>Corporation tax</span>
            <strong className="home-hero-dash-kv--due">£3,600</strong>
          </div>
          <div className="home-hero-dash-kv">
            <span>Public liability</span>
            <strong className="home-hero-dash-kv--due">£1,200</strong>
          </div>
        </div>
        <div className="home-hero-dash-card">
          <h3>Expected receipts</h3>
          <div className="home-hero-dash-kv">
            <span>Client payment</span>
            <strong className="home-hero-dash-kv--in">£4,800</strong>
          </div>
        </div>
      </div>

      <div className="home-hero-dash-card home-hero-dash-building">
        <h3>Building up</h3>
        <ul>
          {BUILDING.map((row) => (
            <li key={row.name} className="home-hero-dash-row">
              <span className="home-hero-dash-row-fill" style={{ width: `${row.pct}%` }} />
              <span className="home-hero-dash-row-due">{row.due}</span>
              <span className="home-hero-dash-row-name">{row.name}</span>
              <span className="home-hero-dash-row-amt">
                <strong>{row.accrued}</strong> / {row.total}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="home-hero-dash-charts">
        <div className="home-hero-dash-card home-hero-dash-chart">
          <h3>Cash Prophet Balance trend</h3>
          <svg viewBox="0 0 232 60" aria-hidden>
            <path d={`${TREND} L 224 58 L 8 58 Z`} fill="#0d8f5b" opacity="0.14" />
            <path d={TREND} fill="none" stroke="#0d8f5b" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="home-hero-dash-card home-hero-dash-chart home-hero-dash-chart--reserve">
          <h3>Reserve planner</h3>
          <HomeHeroReserveChart />
        </div>
      </div>
    </div>
  )
}
