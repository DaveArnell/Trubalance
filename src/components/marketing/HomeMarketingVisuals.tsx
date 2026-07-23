/**
 * Homepage product visuals — echo the in-app Available / spoken-for language.
 */

const SPOKEN_FOR = [
  'Payroll',
  'VAT',
  'Tax',
  'Rent',
  'Insurance',
  'Suppliers',
] as const

export function HomeSpokenForPanel() {
  return (
    <aside className="home-viz home-viz--spoken" aria-label="Bank balance versus money already spoken for">
      <div className="home-viz-card home-viz-card--bank">
        <p className="home-viz-label">Bank balance</p>
        <p className="home-viz-amount">£48,200</p>
        <p className="home-viz-note">Looks fine on the screen</p>
      </div>
      <div className="home-viz-card home-viz-card--spoken">
        <p className="home-viz-label home-viz-label--warn">Already spoken for</p>
        <ul className="home-viz-chips">
          {SPOKEN_FOR.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="home-viz-note">The bank doesn’t know until it leaves</p>
      </div>
    </aside>
  )
}

export function HomeAvailablePanel() {
  return (
    <aside className="home-viz home-viz--available" aria-label="Available Balance after commitments">
      <div className="home-viz-app">
        <div className="home-viz-app-bar">
          <span className="home-viz-app-dot" aria-hidden />
          <span className="home-viz-app-dot" aria-hidden />
          <span className="home-viz-app-dot" aria-hidden />
          <span className="home-viz-app-title">Cash Prophet</span>
        </div>
        <div className="home-viz-app-body">
          <p className="home-viz-label">Available Balance</p>
          <p className="home-viz-amount home-viz-amount--available">£19,450</p>
          <p className="home-viz-note">After commitments already building</p>
          <div className="home-viz-rows" aria-hidden>
            <div className="home-viz-row">
              <span>Bank &amp; cash</span>
              <span>£48,200</span>
            </div>
            <div className="home-viz-row home-viz-row--muted">
              <span>Known commitments</span>
              <span>−£22,100</span>
            </div>
            <div className="home-viz-row home-viz-row--muted">
              <span>Reserve building</span>
              <span>−£6,650</span>
            </div>
            <div className="home-viz-row home-viz-row--final">
              <span>Available</span>
              <span>£19,450</span>
            </div>
          </div>
        </div>
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
      <div className="home-outcome-beats">
        {beats.map((beat, index) => (
          <article key={beat} className="home-outcome-beat">
            <p className="home-outcome-num" aria-hidden>
              {String(index + 1).padStart(2, '0')}
            </p>
            <p>{beat}</p>
          </article>
        ))}
      </div>
      <p className="home-outcome-close">{closing}</p>
    </div>
  )
}

export function HomeCompareStrip() {
  return (
    <div className="home-compare" role="table" aria-label="How Cash Prophet sits beside accounting and banking">
      <div className="home-compare-col home-compare-col--muted" role="row">
        <p className="home-compare-tag" role="rowheader">
          Accounting
        </p>
        <p className="home-compare-body" role="cell">
          Records the past
        </p>
      </div>
      <div className="home-compare-col home-compare-col--muted" role="row">
        <p className="home-compare-tag" role="rowheader">
          Your bank
        </p>
        <p className="home-compare-body" role="cell">
          Shows today’s cash
        </p>
      </div>
      <div className="home-compare-col home-compare-col--accent" role="row">
        <p className="home-compare-tag" role="rowheader">
          Cash Prophet
        </p>
        <p className="home-compare-body" role="cell">
          Helps you make today’s decisions
        </p>
        <p className="home-compare-highlight">Available Balance you can rely on</p>
      </div>
    </div>
  )
}
