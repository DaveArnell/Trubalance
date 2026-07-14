import { Link } from 'react-router-dom'
import {
  METHOD_MANTRA,
  METHOD_ONGOING_ROUTINE,
  METHOD_PAGE_PATH,
  METHOD_THREE_PRINCIPLES,
} from '../../content/trueBalanceMethod'
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
            <p className="marketing-eyebrow marketing-eyebrow--vivid">The method</p>
            <h2 id="method-home-heading">What is the True Balance Method?</h2>
            <p className="marketing-section-lead">
              A practical system for managing money from what is genuinely available — not the bank
              balance alone. Continuous accrual, reserve planning, and one decision number.
            </p>
          </div>

          <div className="marketing-method-principles">
            {METHOD_THREE_PRINCIPLES.map((principle) => (
              <article key={principle.id} className="marketing-method-principle">
                <h3>{principle.title}</h3>
                <p className="marketing-method-principle-lead">{principle.lead}</p>
                <p>{principle.body}</p>
              </article>
            ))}
          </div>

          <div className="marketing-method-equation-wrap">
            <MethodEquation variant="home" />
            <p className="marketing-method-equation-note">
              {METHOD_MANTRA}
            </p>
          </div>
          <p className="marketing-method-more">
            <Link to={METHOD_PAGE_PATH}>Read the full Method →</Link>
          </p>
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
            <h2 id="method-routine-heading">Small awareness. Continuous clarity.</h2>
            <p className="marketing-section-lead">
              This is not software that needs constant maintenance. Set it up once, then keep a
              light routine: small daily awareness, small monthly housekeeping, continuous
              financial clarity.
            </p>
          </div>
          <div className="marketing-method-routine">
            <ul className="marketing-method-routine-list">
              {METHOD_ONGOING_ROUTINE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="marketing-method-routine-note muted">
              Between those updates, accruals and reserves keep working in the background.
            </p>
          </div>
        </div>
      </section>

      <section className="marketing-method-app-callout" aria-label="True Balance software">
        <div className="marketing-method-app-callout-inner">
          <p>
            <strong>The software is the easiest way to follow the True Balance Method.</strong>{' '}
            It tracks daily accruals, maintains reserve plans, monitors expected receipts, and keeps
            one continuously updated True Balance.
          </p>
          <div className="marketing-cta-row marketing-cta-row--center">
            <Link to={METHOD_PAGE_PATH} className="btn-secondary">
              Read about the Method
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
