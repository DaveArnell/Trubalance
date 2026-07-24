/**
 * Homepage visuals — Available Balance made visible.
 * Motif panels for the settled homepage copy (no messaging rewrites).
 */

import { MobileRecordCard } from '../mobile/MobileRecordList'
import { formatCurrency } from '../../utils/format'

/** Sorted fullest-first, matching the live accruing timeline. */
const BUILDING_CARDS = [
  {
    scope: 'High Street',
    dueInDays: 2,
    name: 'Rent',
    accrued: 2150,
    total: 2500,
  },
  {
    scope: 'Reserve',
    dueInDays: 4,
    name: 'Reserve transfer',
    accrued: 1840,
    total: 2200,
  },
  {
    scope: 'Market stall',
    dueInDays: 15,
    name: 'Utilities',
    accrued: 230,
    total: 420,
  },
  {
    scope: 'High Street',
    dueInDays: 24,
    name: 'Wages',
    accrued: 1680,
    total: 8400,
  },
] as const

const SPOKEN_FOR = ['Payroll', 'VAT', 'Rent', 'Insurance', 'Tax'] as const

const CARD_ACCENT = '#0d8f5b'

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

/** DOES section — Available Balance product snapshot. */
export function HomeAvailablePanel() {
  return (
    <aside className="home-snap home-snap--wide" aria-label="Dashboard snapshot of Available Balance">
      <div className="home-dash home-dash--cards">
        <div className="home-dash-hero">
          <p className="home-snap-label home-snap-label--teal">Available Balance</p>
          <p className="home-dash-available">£19,450</p>
          <p className="home-snap-sub">After commitments already building</p>
        </div>

        <ul className="home-dash-cards">
          {BUILDING_CARDS.map((card) => {
            const progress = card.accrued / card.total
            return (
              <li key={card.name} className="home-dash-card-row">
                <MobileRecordCard
                  title={card.name}
                  scopeLabel={card.scope}
                  meta={dueInLabel(card.dueInDays)}
                  amount={formatCurrency(card.accrued)}
                  amountSecondary={`/ ${formatCurrency(card.total)}`}
                  progress={progress}
                  accentColor={CARD_ACCENT}
                />
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
