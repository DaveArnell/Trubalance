import { METHOD_WORKED_EXAMPLE } from '../../content/trueBalanceMethod'

/**
 * Static hero explainer — same numbers as the Method page, compact form.
 */
export function HeroBalanceEquation() {
  const { bankBalance, committed, expectedReceipts, trueBalance } = METHOD_WORKED_EXAMPLE

  return (
    <div
      className="hero-balance-equation"
      role="img"
      aria-label={`Bank balance ${bankBalance} minus committed money ${committed} plus expected receipts ${expectedReceipts} equals Available ${trueBalance}`}
    >
      <div className="hero-balance-equation-row hero-balance-equation-row--bank">
        <div className="hero-balance-equation-term">
          <span className="hero-balance-equation-icon hero-balance-equation-icon--bank" aria-hidden>
            £
          </span>
          <div>
            <p className="hero-balance-equation-label">Bank balance</p>
            <p className="hero-balance-equation-hint">What your bank shows</p>
          </div>
        </div>
        <p className="hero-balance-equation-value">{bankBalance}</p>
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
            <p className="hero-balance-equation-label">Committed money</p>
            <p className="hero-balance-equation-hint">Monthly accruals + reserves building</p>
          </div>
        </div>
        <p className="hero-balance-equation-value">{committed}</p>
      </div>

      <p className="hero-balance-equation-operator" aria-hidden>
        +
      </p>

      <div className="hero-balance-equation-row hero-balance-equation-row--receipts">
        <div className="hero-balance-equation-term">
          <span className="hero-balance-equation-icon hero-balance-equation-icon--receipts" aria-hidden>
            ↗
          </span>
          <div>
            <p className="hero-balance-equation-label">Expected receipts</p>
            <p className="hero-balance-equation-hint">Money you are realistically still owed</p>
          </div>
        </div>
        <p className="hero-balance-equation-value">{expectedReceipts}</p>
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
            <p className="hero-balance-equation-label">Available</p>
            <p className="hero-balance-equation-hint">What is left after commitments</p>
          </div>
        </div>
        <p className="hero-balance-equation-value hero-balance-equation-value--true">{trueBalance}</p>
      </div>
    </div>
  )
}
