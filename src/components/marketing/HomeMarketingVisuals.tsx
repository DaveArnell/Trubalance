/**
 * Homepage visuals — light dashboard snapshots that match the real product language.
 */

const BUILDING = [
  { name: 'Rent', monthly: '£2,500 / mo', accrued: '£2,150', progress: 0.86, accent: '#0d8f5b' },
  { name: 'Utilities', monthly: '£420 / mo', accrued: '£230', progress: 0.55, accent: '#0f766e' },
  { name: 'Wages', monthly: '£8,400 / mo', accrued: '£1,680', progress: 0.2, accent: '#086644' },
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
    <aside className="home-snap home-snap--wide" aria-label="Dashboard snapshot of Available and building costs">
      <div className="home-dash">
        <div className="home-dash-hero">
          <p className="home-snap-label home-snap-label--teal">Available</p>
          <p className="home-dash-available">£19,450</p>
          <p className="home-snap-sub">After commitments already building</p>
        </div>

        <div className="home-dash-building">
          <p className="home-dash-building-label">Known costs building</p>
          <ul className="home-dash-rows">
            {BUILDING.map((item) => (
              <li key={item.name}>
                <div className="home-dash-row-top">
                  <span className="home-dash-name">{item.name}</span>
                  <span className="home-dash-accrued">{item.accrued}</span>
                </div>
                <div className="home-dash-bar" aria-hidden>
                  <span
                    className="home-dash-bar-fill"
                    style={{
                      width: `${Math.round(item.progress * 100)}%`,
                      background: item.accent,
                    }}
                  />
                </div>
                <p className="home-dash-meta">{item.monthly}</p>
              </li>
            ))}
          </ul>
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
