import { METHOD_WORKED_EXAMPLE } from '../../content/trueBalanceMethod'

interface MethodEquationProps {
  /** Compact layout for homepage; full labels on the method page. */
  variant?: 'home' | 'page'
}

/**
 * The True Balance Method calculation — reuses hero equation styles.
 * Does not modify the hero illustration component.
 */
export function MethodEquation({ variant = 'home' }: MethodEquationProps) {
  const { availableCash, committed, expectedReceipts, trueBalance } = METHOD_WORKED_EXAMPLE
  const cashLabel = variant === 'page' ? 'Available cash' : 'Available cash'
  const committedLabel =
    variant === 'page' ? 'Committed and accrued money' : 'Committed and accrued money'
  const receiptsLabel =
    variant === 'page' ? 'Realistic expected receipts' : 'Realistic expected receipts'

  const ariaLabel = `Available cash ${availableCash}, minus committed and accrued money ${committed}, plus expected receipts ${expectedReceipts}, equals True Balance ${trueBalance}`

  return (
    <div className="hero-balance-equation method-equation" role="img" aria-label={ariaLabel}>
      <div className="hero-balance-equation-row hero-balance-equation-row--bank">
        <div className="hero-balance-equation-term">
          <span className="hero-balance-equation-icon hero-balance-equation-icon--bank" aria-hidden>
            £
          </span>
          <div>
            <p className="hero-balance-equation-label">{cashLabel}</p>
            <p className="hero-balance-equation-hint">What is in the bank today</p>
          </div>
        </div>
        <p className="hero-balance-equation-value">{availableCash}</p>
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
            <p className="hero-balance-equation-label">{committedLabel}</p>
            <p className="hero-balance-equation-hint">Already spoken for — building before payday</p>
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
            <p className="hero-balance-equation-label">{receiptsLabel}</p>
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
            <p className="hero-balance-equation-label">True Balance</p>
            <p className="hero-balance-equation-hint">What is left after commitments</p>
          </div>
        </div>
        <p className="hero-balance-equation-value hero-balance-equation-value--true">{trueBalance}</p>
      </div>
    </div>
  )
}
