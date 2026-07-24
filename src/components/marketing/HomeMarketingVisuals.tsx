/**
 * Homepage visuals — Available Balance made visible.
 * Motif panels for the settled homepage copy (no messaging rewrites).
 */

import { CompactKpiStrip } from '../CompactKpiStrip'
import { formatCurrency } from '../../utils/format'

/** Sorted fullest-first; progress tracks “due in X days”. */
const BUILDING_CARDS = [
  { dueInDays: 2, name: 'Rent', accrued: 2300, total: 2500 },
  { dueInDays: 4, name: 'Reserve transfer', accrued: 1580, total: 2200 },
  { dueInDays: 15, name: 'Utilities', accrued: 210, total: 420 },
  { dueInDays: 24, name: 'Wages', accrued: 1680, total: 8400 },
] as const

const SPOKEN_FOR = ['Payroll', 'VAT', 'Rent', 'Insurance', 'Tax'] as const

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
        <ul className="home-viz-chips">
          {SPOKEN_FOR.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="home-viz-note">
          The bank doesn’t show any of this until the money leaves.
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

/** WHY — bank vs Available Balance (muted vs accent). */
export function HomeCompareStrip() {
  return (
    <div className="home-compare home-compare--bank-available" aria-label="Bank balance versus Available Balance">
      <div className="home-compare-col home-compare-col--muted">
        <p className="home-compare-tag">Bank balance</p>
        <p className="home-compare-body">Shows what’s in the account</p>
        <p className="home-compare-detail">Silent about payroll, VAT, rent and the rest until money leaves.</p>
      </div>
      <div className="home-compare-col home-compare-col--accent">
        <p className="home-compare-tag">Available Balance</p>
        <p className="home-compare-body">Shows what you can actually decide from</p>
        <p className="home-compare-highlight">Commitments already in the picture</p>
      </div>
    </div>
  )
}

/**
 * Compact trends sketch for Two light habits — logged history + light forward projection.
 */
export function HabitsTrendVisual() {
  // Past logs (solid), then dashed projection
  const past =
    'M12 78 C 40 72, 70 68, 100 58 S 160 42, 190 48 S 230 62, 260 52'
  const future = 'M260 52 C 290 44, 320 40, 348 36'
  const dots = [
    { x: 40, y: 70 },
    { x: 100, y: 58 },
    { x: 160, y: 44 },
    { x: 190, y: 48 },
    { x: 230, y: 60 },
    { x: 260, y: 52 },
  ]

  return (
    <figure className="habits-trend" aria-label="Balance history from daily logs with a light forward projection">
      <figcaption className="habits-trend-caption">Daily logs build your trend</figcaption>
      <svg className="habits-trend-svg" viewBox="0 0 360 100" aria-hidden>
        <line x1="12" y1="88" x2="348" y2="88" className="habits-trend-axis" />
        <line x1="12" y1="50" x2="348" y2="50" className="habits-trend-grid" />
        <path className="habits-trend-line" d={past} />
        <path className="habits-trend-line habits-trend-line--forecast" d={future} />
        {dots.map((dot) => (
          <circle key={dot.x} cx={dot.x} cy={dot.y} r="3.5" className="habits-trend-dot" />
        ))}
        <text x="190" y="96" className="habits-trend-label" textAnchor="middle">
          Logged
        </text>
        <text x="310" y="28" className="habits-trend-label habits-trend-label--forecast" textAnchor="middle">
          Ahead
        </text>
      </svg>
    </figure>
  )
}
