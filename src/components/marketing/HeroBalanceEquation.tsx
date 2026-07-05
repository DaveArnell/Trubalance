/**
 * Static hero explainer — the core idea at a glance before the animated demo.
 */
export function HeroBalanceEquation() {
  return (
    <div
      className="hero-balance-equation"
      role="img"
      aria-label="Bank account £42,500 minus accrued bills and obligations £18,200 equals True Balance £24,300"
    >
      <div className="hero-balance-equation-row hero-balance-equation-row--bank">
        <div className="hero-balance-equation-term">
          <span className="hero-balance-equation-icon hero-balance-equation-icon--bank" aria-hidden>
            £
          </span>
          <div>
            <p className="hero-balance-equation-label">Bank account</p>
            <p className="hero-balance-equation-hint">What your bank shows</p>
          </div>
        </div>
        <p className="hero-balance-equation-value">£42,500</p>
      </div>

      <p className="hero-balance-equation-operator" aria-hidden>
        −
      </p>

      <div className="hero-balance-equation-row hero-balance-equation-row--committed">
        <div className="hero-balance-equation-term">
          <span className="hero-balance-equation-icon hero-balance-equation-icon--committed" aria-hidden>
            ▤
          </span>
          <div>
            <p className="hero-balance-equation-label">Accrued bills &amp; obligations</p>
            <p className="hero-balance-equation-hint">Rent, payroll, tax, subscriptions…</p>
          </div>
        </div>
        <p className="hero-balance-equation-value">£18,200</p>
      </div>

      <p className="hero-balance-equation-operator hero-balance-equation-operator--equals" aria-hidden>
        =
      </p>

      <div className="hero-balance-equation-row hero-balance-equation-row--true">
        <div className="hero-balance-equation-term">
          <span className="hero-balance-equation-icon hero-balance-equation-icon--true" aria-hidden>
            ◈
          </span>
          <div>
            <p className="hero-balance-equation-label">True Balance</p>
            <p className="hero-balance-equation-hint">Genuinely yours to spend</p>
          </div>
        </div>
        <p className="hero-balance-equation-value hero-balance-equation-value--true">£24,300</p>
      </div>
    </div>
  )
}
