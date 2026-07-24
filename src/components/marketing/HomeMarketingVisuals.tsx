/**
 * Homepage visuals — dashboard-faithful snapshots.
 */

/** Sorted most-full first, like the live accruing list. */
const DUE_CARDS = [
  { scope: 'High Street', dueIn: 'Due in 2 days', name: 'Rent', accrued: '£2,150', total: '£2,500', fill: 0.86 },
  { scope: 'Reserve', dueIn: 'Due in 4 days', name: 'Reserve transfer', accrued: '£1,840', total: '£2,200', fill: 0.84 },
  { scope: 'Market stall', dueIn: 'Due in 15 days', name: 'Utilities', accrued: '£230', total: '£420', fill: 0.55 },
  { scope: 'High Street', dueIn: 'Due in 22 days', name: 'Wages', accrued: '£1,680', total: '£8,400', fill: 0.2 },
] as const

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
          {DUE_CARDS.map((card) => (
            <li key={card.name} className="home-dash-card">
              <div
                className="home-dash-card-progress"
                aria-hidden
                style={{ ['--home-dash-fill' as string]: `${card.fill * 100}%` }}
              />
              <div className="home-dash-card-meta">
                <span className="home-dash-card-scope">{card.scope}</span>
                <span className="home-dash-card-due">{card.dueIn}</span>
              </div>
              <div className="home-dash-card-row">
                <p className="home-dash-card-name">{card.name}</p>
                <p className="home-dash-card-amount">
                  <strong>{card.accrued}</strong>
                  <span> / {card.total}</span>
                </p>
              </div>
            </li>
          ))}
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
