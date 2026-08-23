import { CAFES_EXAMPLE, CAFES_PAGE } from '../../content/cafesPage'
import { formatCurrency } from '../../utils/format'

const ACCRUE_ACCENT = '#0d8f5b'

export function CafeAccrualExample({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={`cafe-example${compact ? ' cafe-example--compact' : ''}`}
      aria-label="Illustrative café example: bank balance, accrued regular costs, and Cash Prophet Balance"
    >
      <div className="cafe-example-bank">
        <p className="cafe-example-label">{CAFES_PAGE.example.bankLabel}</p>
        <p className="cafe-example-amount">{formatCurrency(CAFES_EXAMPLE.bank)}</p>
        <p className="cafe-example-note">{CAFES_PAGE.example.bankNote}</p>
      </div>

      <p className="cafe-example-spoken-label">{CAFES_PAGE.example.spokenLabel}</p>
      <ul className="cafe-example-rows">
        {CAFES_EXAMPLE.commitments.map((row) => {
          const progress = Math.round((row.accrued / row.monthly) * 100)
          return (
            <li key={row.name} className="cafe-example-row">
              <div
                className="cafe-example-row-fill"
                style={{ width: `${progress}%`, background: ACCRUE_ACCENT }}
                aria-hidden
              />
              <div className="cafe-example-row-copy">
                <span className="cafe-example-row-name">{row.name}</span>
                <span className="cafe-example-row-hint">{row.hint}</span>
              </div>
              <span className="cafe-example-row-amount">
                <strong>{formatCurrency(row.accrued)}</strong>
                <span> of {formatCurrency(row.monthly)}</span>
              </span>
            </li>
          )
        })}
      </ul>

      <div className="cafe-example-prophet">
        <p className="cafe-example-label cafe-example-label--prophet">{CAFES_PAGE.example.prophetLabel}</p>
        <p className="cafe-example-amount cafe-example-amount--prophet">
          {formatCurrency(CAFES_EXAMPLE.prophet)}
        </p>
        <p className="cafe-example-note">{CAFES_PAGE.example.prophetNote}</p>
      </div>
      <p className="cafe-example-footnote">{CAFES_PAGE.example.footnote}</p>
    </aside>
  )
}

const MONTH_EVENTS = [
  { x: 16, label: 'Utilities' },
  { x: 34, label: 'Finance' },
  { x: 48, label: 'Suppliers' },
  { x: 72, label: 'Payroll' },
  { x: 88, label: 'Rent' },
] as const

/** Bank path: climbs with daily takings, drops on bill days. SVG y: higher = lower balance. */
const BANK_PATH =
  'M8 78 C 18 70, 28 62, 38 58 C 44 56, 48 92, 50 94 C 56 88, 64 72, 70 66 C 76 60, 82 108, 86 110 C 92 96, 102 84, 112 70 C 122 58, 132 52, 142 48 C 150 46, 156 88, 160 90 C 168 78, 180 64, 196 54 C 208 48, 216 118, 220 122 C 230 104, 246 78, 262 62 C 270 56, 278 112, 284 116 C 292 98, 308 70, 328 58'

const PROPHET_PATH =
  'M8 92 C 40 90, 80 86, 120 82 C 160 78, 200 76, 240 72 C 280 68, 308 66, 328 64'

export function CafeMonthContrast() {
  return (
    <div className="cafe-month" aria-label="Typical café month: noisy bank balance versus a calmer Cash Prophet Balance">
      <div className="cafe-month-card">
        <div className="cafe-month-head">
          <p className="cafe-month-title">{CAFES_PAGE.noisy.bankTitle}</p>
          <p className="cafe-month-caption">{CAFES_PAGE.noisy.bankCaption}</p>
        </div>
        <svg className="cafe-month-chart" viewBox="0 0 340 150" role="img" aria-hidden>
          <line x1="8" y1="132" x2="328" y2="132" className="cafe-month-axis" />
          <path d={BANK_PATH} className="cafe-month-line cafe-month-line--bank" />
          {MONTH_EVENTS.map((event) => (
            <g key={event.label}>
              <line
                x1={(event.x / 100) * 320 + 8}
                y1="28"
                x2={(event.x / 100) * 320 + 8}
                y2="132"
                className="cafe-month-event"
              />
            </g>
          ))}
        </svg>
        <ul className="cafe-month-chips">
          {MONTH_EVENTS.map((event) => (
            <li key={event.label}>{event.label}</li>
          ))}
        </ul>
      </div>

      <div className="cafe-month-card cafe-month-card--prophet">
        <div className="cafe-month-head">
          <p className="cafe-month-title">{CAFES_PAGE.noisy.prophetTitle}</p>
          <p className="cafe-month-caption">{CAFES_PAGE.noisy.prophetCaption}</p>
        </div>
        <svg className="cafe-month-chart" viewBox="0 0 340 150" role="img" aria-hidden>
          <line x1="8" y1="132" x2="328" y2="132" className="cafe-month-axis" />
          <path d={PROPHET_PATH} className="cafe-month-line cafe-month-line--prophet" />
        </svg>
      </div>
    </div>
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
