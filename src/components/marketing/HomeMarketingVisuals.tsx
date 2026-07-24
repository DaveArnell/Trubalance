/**
 * Homepage visuals — Available Balance made visible.
 * Motif panels for the settled homepage copy (no messaging rewrites).
 */

import { CompactKpiStrip } from '../CompactKpiStrip'
import { formatCurrency } from '../../utils/format'

/** Sorted fullest-first; progress tracks “due in X days”. */
const BUILDING_CARDS = [
  { dueInDays: 2, name: 'Rent', accrued: 2300, total: 2500 },
  { dueInDays: 8, name: 'Reserve transfer', accrued: 1580, total: 2200 },
  { dueInDays: 15, name: 'Utilities', accrued: 210, total: 420 },
  { dueInDays: 24, name: 'Wages', accrued: 1680, total: 8400 },
] as const

const CARD_ACCENT = '#0d8f5b'

const MONTHLY_TOTAL = BUILDING_CARDS.reduce((sum, card) => sum + card.total, 0)
const ACCRUED_NOW = BUILDING_CARDS.reduce((sum, card) => sum + card.accrued, 0)
const PER_DAY = Math.round(MONTHLY_TOTAL / 30)

function dueInLabel(days: number) {
  if (days <= 0) return 'Due today'
  if (days === 1) return 'Due in 1 day'
  return `Due in ${days} days`
}

/** NEED section — bank figure plus what’s already spoken for. */
export function HomeSpokenForPanel() {
  return (
    <aside className="home-viz home-viz--spoken" aria-label="Bank balance versus money already spoken for">
      <div className="home-viz-card home-viz-card--bank">
        <p className="home-viz-label">Bank balance</p>
        <p className="home-viz-amount">£48,200</p>
        <p className="home-viz-note">In the account today</p>
      </div>
      <div className="home-viz-card home-viz-card--spoken">
        <p className="home-viz-label home-viz-label--warn">Already spoken for</p>
        <div className="home-viz-unknown" aria-hidden>
          <span className="home-viz-q home-viz-q--lg">?</span>
          <span className="home-viz-q home-viz-q--md">?</span>
          <span className="home-viz-q home-viz-q--sm">?</span>
          <span className="home-viz-q home-viz-q--md">?</span>
        </div>
        <p className="home-viz-note">
          Payroll, VAT, rent and the rest are still only in your head.
        </p>
      </div>
    </aside>
  )
}

/** DOES section — monthly accruing bills snapshot. */
export function HomeAvailablePanel() {
  return (
    <aside className="home-snap home-snap--wide" aria-label="Monthly accruing bills">
      <div className="home-dash home-dash--cards home-dash--accruing">
        <div className="home-dash-hero home-dash-hero--accruing">
          <p className="home-snap-label home-snap-label--teal">Monthly accruing bills</p>
          <div className="home-dash-kpis">
            <CompactKpiStrip
              items={[
                { label: 'Monthly total', value: formatCurrency(MONTHLY_TOTAL) },
                { label: 'Accrued now', value: formatCurrency(ACCRUED_NOW), emphasis: true },
                { label: 'Per day', value: formatCurrency(PER_DAY) },
              ]}
            />
          </div>
        </div>

        <ul className="home-dash-cards home-dash-cards--bars">
          {BUILDING_CARDS.map((card) => {
            const progress = card.accrued / card.total
            return (
              <li key={card.name} className="home-accrue-row">
                <div
                  className="home-accrue-row-fill"
                  style={{ width: `${Math.round(progress * 100)}%`, background: CARD_ACCENT }}
                  aria-hidden
                />
                <span className="home-accrue-row-due">{dueInLabel(card.dueInDays)}</span>
                <span className="home-accrue-row-name">{card.name}</span>
                <span className="home-accrue-row-amount">
                  <strong>{formatCurrency(card.accrued)}</strong>
                  <span> / {formatCurrency(card.total)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

/** OUTCOME — three chunked beats, not one text slab. */
export function HomeOutcomeBeats({
  beats,
  closing,
}: {
  beats: readonly string[]
  closing: string
}) {
  return (
    <div className="home-outcome">
      <ol className="home-outcome-beats">
        {beats.map((beat, index) => (
          <li key={beat} className="home-outcome-beat">
            <span className="home-outcome-num" aria-hidden>
              {String(index + 1).padStart(2, '0')}
            </span>
            <p>{beat}</p>
          </li>
        ))}
      </ol>
      <p className="home-outcome-close">{closing}</p>
    </div>
  )
}

/** WHY — accounting, bank, and Available Balance. */
export function HomeCompareStrip() {
  return (
    <div className="home-compare" aria-label="How Cash Prophet sits beside accounting and banking">
      <div className="home-compare-col home-compare-col--muted">
        <p className="home-compare-tag">Accounting</p>
        <p className="home-compare-body">Records the past</p>
        <p className="home-compare-detail">Bookkeeping and reports after the fact.</p>
      </div>
      <div className="home-compare-col home-compare-col--muted">
        <p className="home-compare-tag">Your bank</p>
        <p className="home-compare-body">Shows today’s cash</p>
        <p className="home-compare-detail">Silent about what’s already spoken for.</p>
      </div>
      <div className="home-compare-col home-compare-col--accent">
        <p className="home-compare-tag">Cash Prophet</p>
        <p className="home-compare-body">Helps you decide today</p>
        <p className="home-compare-highlight">Available Balance you can rely on</p>
      </div>
    </div>
  )
}

/** Soft Catmull–Rom curve through logged points (green history line). */
function smoothThrough(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0]!.x} ${points[0]!.y}`
  if (points.length === 2) {
    return `M${points[0]!.x} ${points[0]!.y} L${points[1]!.x} ${points[1]!.y}`
  }

  let d = `M${points[0]!.x} ${points[0]!.y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

/**
 * Compact trends sketch — logged history with a blue trend line painted forward.
 */
export function HabitsTrendVisual() {
  const logged = [
    { x: 36, y: 74 },
    { x: 88, y: 66 },
    { x: 140, y: 48 },
    { x: 178, y: 52 },
    { x: 220, y: 58 },
    { x: 258, y: 46 },
  ] as const

  const pastPath = smoothThrough(logged)

  // Straight trend through first → last, extended ahead
  const first = logged[0]!
  const last = logged[logged.length - 1]!
  const dx = last.x - first.x
  const dy = last.y - first.y
  const endX = 348
  const tExtend = (endX - first.x) / dx
  const endY = first.y + dy * tExtend
  const trendPath = `M${first.x} ${first.y} L${endX} ${endY}`

  return (
    <figure className="habits-trend" aria-label="Balance history from daily logs with a forward trend line">
      <figcaption className="habits-trend-caption">Daily logs build your trend</figcaption>
      <svg className="habits-trend-svg" viewBox="0 0 360 100" aria-hidden>
        <line x1="12" y1="88" x2="348" y2="88" className="habits-trend-axis" />
        <line x1="12" y1="50" x2="348" y2="50" className="habits-trend-grid" />
        <path className="habits-trend-line habits-trend-line--trend" d={trendPath} />
        <path className="habits-trend-line" d={pastPath} />
        {logged.map((dot) => (
          <circle key={dot.x} cx={dot.x} cy={dot.y} r="3.5" className="habits-trend-dot" />
        ))}
        <text x="310" y="22" className="habits-trend-label habits-trend-label--forecast" textAnchor="middle">
          Ahead
        </text>
      </svg>
    </figure>
  )
}
