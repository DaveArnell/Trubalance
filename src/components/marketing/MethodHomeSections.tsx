import { Link } from 'react-router-dom'
import {
  METHOD_MANTRA,
  METHOD_PAGE_PATH,
  METHOD_THREE_PRINCIPLES,
  METHOD_TWO_HABITS,
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
            <h2 id="method-home-heading">The True Balance Method</h2>
            <p className="marketing-section-lead">
              Recognise commitments as they build, fund annual bills through the Reserve Planner, and
              decide from one stable True Balance — not the bank balance alone.
            </p>
          </div>

          <div className="marketing-method-equation-wrap">
            <MethodEquation variant="home" />
            <p className="marketing-method-equation-note">{METHOD_MANTRA}</p>
          </div>

          <div className="marketing-method-principles marketing-method-principles--compact">
            {METHOD_THREE_PRINCIPLES.map((principle) => (
              <article key={principle.id} className="marketing-method-principle">
                <h3>{principle.title}</h3>
                <p className="marketing-method-principle-lead">{principle.lead}</p>
              </article>
            ))}
          </div>

          <p className="marketing-method-more">
            <Link to={METHOD_PAGE_PATH}>Read the full Method →</Link>
          </p>
        </div>
      </section>

      <section
        id="two-habits"
        className="marketing-features-section marketing-features-section--pop marketing-method-section"
        aria-labelledby="method-habits-heading"
      >
        <div className="marketing-section-inner">
          <div className="marketing-section-head marketing-section-head--center">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">Two simple habits</p>
            <h2 id="method-habits-heading">This is how you follow the Method</h2>
            <p className="marketing-section-lead">
              Intentionally light. Not constant maintenance — a 30-second daily check and a five-minute
              monthly Reserve Planner review.
            </p>
          </div>
          <div className="marketing-method-habits">
            {METHOD_TWO_HABITS.map((habit) => (
              <article key={habit.id} className="marketing-method-habit-card">
                <p className="marketing-method-habit-meta">
                  <span className="marketing-method-habit-title">{habit.title}</span>
                  <span className="marketing-method-habit-time">{habit.time}</span>
                </p>
                <h3>{habit.lead}</h3>
                <p>{habit.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-method-app-callout" aria-label="True Balance software">
        <div className="marketing-method-app-callout-inner">
          <p>
            <strong>The True Balance app is the easiest way to follow the Method.</strong> It accrues
            commitments every day, runs the Reserve Planner, and keeps one continuously updated True
            Balance.
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
