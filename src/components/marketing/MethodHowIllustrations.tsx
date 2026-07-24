/**
 * How-it-works diagrams — clean, labelled, no overlapping annotations.
 * Matches homepage paper / ink / green theme.
 */

/** Step 01 — known costs build day by day before payday */
export function IllustCommitmentsBuild() {
  return (
    <div className="how-diagram" aria-label="Cash Prophet example: payroll accruing day by day before payday toward Available Balance">
      <p className="how-diagram-kicker">Example: payroll</p>
      <div className="how-diagram-days" role="img" aria-hidden>
        {[
          { day: '1', h: 18 },
          { day: '8', h: 36 },
          { day: '15', h: 54 },
          { day: '22', h: 72 },
          { day: '31', h: 92 },
        ].map((bar) => (
          <div key={bar.day} className="how-diagram-day">
            <div className="how-diagram-day-bar" style={{ height: `${bar.h}%` }} />
            <span className="how-diagram-day-label">Day {bar.day}</span>
          </div>
        ))}
      </div>
      <div className="how-diagram-footer">
        <div>
          <p className="how-diagram-footer-label">Spoken for by day 18</p>
          <p className="how-diagram-footer-value">£2,840</p>
        </div>
        <div className="how-diagram-footer-aside">
          <p className="how-diagram-footer-label">Full month</p>
          <p className="how-diagram-footer-muted">£4,900</p>
        </div>
      </div>
      <p className="how-diagram-caption">
        The cost is already building — you don’t wait until payday to see it.
      </p>
    </div>
  )
}

/** Step 02 — annual bill → monthly reserve transfer */
export function IllustReservePlanner() {
  return (
    <div className="how-diagram" aria-label="Cash Prophet Reserve Planner: annual VAT broken into a monthly set-aside for UK businesses">
      <p className="how-diagram-kicker">Example: VAT</p>
      <div className="how-diagram-flow">
        <div className="how-diagram-flow-block">
          <span className="how-diagram-flow-label">Once a year</span>
          <strong>£9,600</strong>
          <span className="how-diagram-flow-sub">lands as one hit</span>
        </div>
        <span className="how-diagram-flow-arrow" aria-hidden>
          →
        </span>
        <div className="how-diagram-flow-block how-diagram-flow-block--result">
          <span className="how-diagram-flow-label">Every month</span>
          <strong>£800</strong>
          <span className="how-diagram-flow-sub">into reserve</span>
        </div>
      </div>
      <p className="how-diagram-caption">
        Large bills become a predictable monthly move — not a surprise on the due date.
      </p>
    </div>
  )
}

/** Step 03 — one calm number for today */
export function IllustTrueBalanceNumber() {
  return (
    <div className="how-diagram" aria-label="Cash Prophet Available Balance equation for today after known commitments">
      <p className="how-diagram-kicker">Today’s number</p>
      <ul className="how-diagram-eq">
        <li>
          <span>Cash in the bank</span>
          <strong>£42,500</strong>
        </li>
        <li className="how-diagram-eq-minus">
          <span>Already committed</span>
          <strong>− £20,300</strong>
        </li>
        <li className="how-diagram-eq-plus">
          <span>Expected receipts</span>
          <strong>+ £4,700</strong>
        </li>
        <li className="how-diagram-eq-result">
          <span>What’s available</span>
          <strong>£26,900</strong>
        </li>
      </ul>
      <p className="how-diagram-caption">
        One figure for what you can actually afford today.
      </p>
    </div>
  )
}

export const METHOD_HOW_ILLUSTRATIONS = [
  IllustCommitmentsBuild,
  IllustReservePlanner,
  IllustTrueBalanceNumber,
] as const
