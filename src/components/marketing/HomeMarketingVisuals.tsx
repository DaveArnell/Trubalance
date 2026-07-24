/**
 * Homepage visuals — dashboard-faithful snapshots.
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

const CARD_ACCENT = '#0d8f5b'

function dueInLabel(days: number) {
  if (days <= 0) return 'Due today'
  if (days === 1) return 'Due in 1 day'
  return `Due in ${days} days`
}

export function HomeSpokenForPanel() {
  return (
    <aside className="home-snap" aria-label="Bank balance does not show what is free to spend">
      <div className="home-snap-card">
        <p className="home-snap-label">Bank balance</p>
        <p className="home-snap-big">£48,200</p>
        <p className="home-snap-sub">In the account today</p>
        <div className="home-snap-divider" />
        <p className="home-snap-question">How much of that can you actually spend?</p>
        <p className="home-snap-hint">
          The bank can’t say. Payroll, VAT, rent and the rest are still only in your head.
        </p>
      </div>
    </aside>
  )
}

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

export function HomeCompareStrip() {
  return (
    <div className="home-compare" aria-label="How Cash Prophet sits beside accounting and banking">
      <div className="home-compare-col home-compare-col--muted">
        <p className="home-compare-tag">Accounting</p>
        <p className="home-compare-body">Records the past</p>
      </div>
      <div className="home-compare-col home-compare-col--muted">
        <p className="home-compare-tag">Your bank</p>
        <p className="home-compare-body">Shows today’s cash</p>
      </div>
      <div className="home-compare-col home-compare-col--accent">
        <p className="home-compare-tag">Cash Prophet</p>
        <p className="home-compare-body">Helps you make today’s decisions</p>
        <p className="home-compare-highlight">Available Balance you can rely on</p>
      </div>
    </div>
  )
}
