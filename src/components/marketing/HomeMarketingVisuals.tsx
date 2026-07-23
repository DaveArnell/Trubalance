/**
 * Homepage product visuals — bank vs Available, told clearly.
 */

export function HomeSpokenForPanel() {
  return (
    <aside className="home-stage" aria-label="Why the bank balance is not enough">
      <div className="home-stage-scene home-stage-scene--problem">
        <p className="home-stage-kicker">What the bank shows</p>
        <p className="home-stage-figure">£48,200</p>
        <p className="home-stage-caption">Cash in the account today</p>
        <div className="home-stage-fog" aria-hidden>
          <span>Payroll?</span>
          <span>VAT?</span>
          <span>Rent?</span>
          <span>Tax?</span>
          <span>Insurance?</span>
        </div>
        <p className="home-stage-punch">You still have to work the rest out yourself.</p>
      </div>
    </aside>
  )
}

export function HomeAvailablePanel() {
  return (
    <aside className="home-stage" aria-label="Available Balance after commitments">
      <div className="home-stage-scene home-stage-scene--answer">
        <div className="home-stage-chrome" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <p className="home-stage-kicker home-stage-kicker--teal">Available Balance</p>
        <p className="home-stage-figure home-stage-figure--teal">£19,450</p>
        <p className="home-stage-caption">What you can rely on today</p>
        <ul className="home-stage-ledger">
          <li>
            <span>Bank &amp; cash</span>
            <strong>£48,200</strong>
          </li>
          <li>
            <span>Known commitments</span>
            <strong>−£22,100</strong>
          </li>
          <li>
            <span>Reserves building</span>
            <strong>−£6,650</strong>
          </li>
          <li className="home-stage-ledger-final">
            <span>Available</span>
            <strong>£19,450</strong>
          </li>
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
