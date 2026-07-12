import { Link } from 'react-router-dom'
import { METHOD_ONGOING_ROUTINE, METHOD_PAGE_PATH } from '../../content/trueBalanceMethod'
import { MethodEquation } from './MethodEquation'

export function MethodHomeSections() {
  return (
    <>
      <section
        id="true-balance-method"
        className="marketing-pillars-section marketing-pillars-section--pop marketing-method-section"
        aria-labelledby="method-home-heading"
      >
        <div className="marketing-section-inner">
          <div className="marketing-section-head marketing-section-head--center">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">The framework</p>
            <h2 id="method-home-heading">What is the True Balance Method?</h2>
            <p className="marketing-section-lead">
              A simple way to manage money using the position that is genuinely available to you —
              not the bank balance alone. True Balance is the software that keeps the method current.
            </p>
          </div>
          <div className="marketing-method-equation-wrap">
            <MethodEquation variant="home" />
            <p className="marketing-method-equation-note">
              One clearer number for day-to-day financial decisions — after committed money and
              realistic receipts are part of the picture.
            </p>
          </div>
        </div>
      </section>

      <section
        id="simple-to-keep-updated"
        className="marketing-features-section marketing-features-section--pop marketing-method-section"
        aria-labelledby="method-routine-heading"
      >
        <div className="marketing-section-inner">
          <div className="marketing-section-head marketing-section-head--center">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">Day to day</p>
            <h2 id="method-routine-heading">Simple to keep up to date</h2>
            <p className="marketing-section-lead">
              Set it up once, then keep it accurate with a few small updates. True Balance continues
              working out what is building up in the background.
            </p>
          </div>
          <div className="marketing-method-routine">
            <ul className="marketing-method-routine-list">
              {METHOD_ONGOING_ROUTINE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="marketing-method-routine-note muted">
              Bank balances and paid items should be refreshed regularly. Reserve transfers are
              normally reviewed monthly — but the accrual calculations run automatically between
              updates.
            </p>
          </div>
        </div>
      </section>

      <section className="marketing-method-app-callout" aria-label="True Balance software">
        <div className="marketing-method-app-callout-inner">
          <p>
            <strong>The app is the easiest way to follow the True Balance Method.</strong>
          </p>
          <div className="marketing-cta-row marketing-cta-row--center">
            <Link to={METHOD_PAGE_PATH} className="btn-secondary">
              Read about the method
            </Link>
            <Link to="/signup" className="btn-primary">
              Start free trial
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
