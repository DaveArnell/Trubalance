import { CompactKpiStrip } from '../CompactKpiStrip'
import { CAFES_EXAMPLE, CAFES_PAGE } from '../../content/cafesPage'
import { formatCurrency } from '../../utils/format'

const ACCRUE_ACCENT = '#0d8f5b'

const MONTHLY_TOTAL = CAFES_EXAMPLE.bills.reduce((sum, bill) => sum + bill.total, 0)
const ACCRUED_NOW = CAFES_EXAMPLE.bills.reduce((sum, bill) => sum + bill.accrued, 0)
const PER_DAY = Math.round(MONTHLY_TOTAL / 30)

function dueInLabel(days: number) {
  if (days <= 0) return 'Due today'
  if (days === 1) return 'Due in 1 day'
  return `Due in ${days} days`
}

/** Same monthly accruing-bills card as the homepage, with café figures. */
export function CafeAccruingBills() {
  return (
    <aside
      className="home-snap home-snap--wide"
      aria-label="Café example: monthly accruing bills building toward today’s position"
    >
      <div className="home-dash home-dash--cards home-dash--accruing">
        <div className="home-dash-hero home-dash-hero--accruing">
          <p className="home-snap-label home-snap-label--teal">Monthly accruing bills</p>
          <div className="home-dash-kpis">
            <CompactKpiStrip
              items={[
                { label: 'Monthly total', value: formatCurrency(MONTHLY_TOTAL) },
                { label: 'Accrued now', value: formatCurrency(ACCRUED_NOW), emphasis: true },
                { label: 'Per day', value: formatCurrency(PER_DAY) },
              ]}
            />
          </div>
        </div>

        <ul className="home-dash-cards home-dash-cards--bars">
          {CAFES_EXAMPLE.bills.map((bill) => {
            const progress = bill.accrued / bill.total
            return (
              <li key={bill.name} className="home-accrue-row">
                <div
                  className="home-accrue-row-fill"
                  style={{ width: `${Math.round(progress * 100)}%`, background: ACCRUE_ACCENT }}
                  aria-hidden
                />
                <span className="home-accrue-row-due">{dueInLabel(bill.dueInDays)}</span>
                <span className="home-accrue-row-name">{bill.name}</span>
                <span className="home-accrue-row-amount">
                  <strong>{formatCurrency(bill.accrued)}</strong>
                  <span> / {formatCurrency(bill.total)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

export function CafePayrollBuild() {
  return (
    <div
      className="how-diagram cafe-budget-diagram"
      aria-label="Example: café payroll of £9,000 building day by day before payday"
    >
      <p className="how-diagram-kicker">Example: payroll of £9,000 a month</p>
      <div className="how-diagram-days" role="img" aria-hidden>
        {[
          { day: '1', h: 16, amount: '£300' },
          { day: '8', h: 36, amount: '£2,400' },
          { day: '15', h: 56, amount: '£4,500' },
          { day: '22', h: 76, amount: '£6,600' },
          { day: '30', h: 94, amount: '£9,000' },
        ].map((bar) => (
          <div key={bar.day} className="how-diagram-day">
            <div className="how-diagram-day-bar" style={{ height: `${bar.h}%` }} />
            <span className="how-diagram-day-label">Day {bar.day}</span>
            <span className="cafe-budget-day-amount">{bar.amount}</span>
          </div>
        ))}
      </div>
      <p className="how-diagram-caption">
        A proportion builds every day. You do not wait until payday to treat it as a cost.
      </p>
    </div>
  )
}

export function CafeReserveVisual() {
  return (
    <div
      className="how-diagram"
      aria-label="Cash Prophet Reserve Planner: a larger café bill broken into a monthly set-aside"
    >
      <p className="how-diagram-kicker">Example: VAT, if it applies</p>
      <div className="how-diagram-flow">
        <div className="how-diagram-flow-block">
          <span className="how-diagram-flow-label">When the bill lands</span>
          <strong>£9,600</strong>
          <span className="how-diagram-flow-sub">one larger payment</span>
        </div>
        <span className="how-diagram-flow-arrow" aria-hidden>
          →
        </span>
        <div className="how-diagram-flow-block how-diagram-flow-block--result">
          <span className="how-diagram-flow-label">Every month</span>
          <strong>£800</strong>
          <span className="how-diagram-flow-sub">set aside toward it</span>
        </div>
      </div>
      <p className="how-diagram-caption">
        Larger known costs can be planned for steadily, rather than arriving as a sudden shock.
      </p>
    </div>
  )
}

export function CafeEquation() {
  const steps = CAFES_PAGE.oneNumber.equation
  return (
    <ol className="cafe-equation" aria-label="How the Cash Prophet Balance is formed">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={`cafe-equation-step${index === steps.length - 1 ? ' cafe-equation-step--result' : ''}`}
        >
          {index === 1 ? <span className="cafe-equation-op">minus</span> : null}
          {index === 2 ? <span className="cafe-equation-op">with</span> : null}
          {index === 3 ? <span className="cafe-equation-op">equals</span> : null}
          <strong>{step.label}</strong>
          <span>{step.detail}</span>
        </li>
      ))}
    </ol>
  )
}
