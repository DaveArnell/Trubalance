import { Link } from 'react-router-dom'
import {
  METHOD_CLARITY_QUESTIONS,
  METHOD_MANTRA,
  METHOD_PAGE_PATH,
  METHOD_TWO_HABITS,
  METHOD_WHY_COMPARE,
  METHOD_WHO_FOR,
  METHOD_WHO_NOT_FOR,
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
              A simple financial management system for understanding what your bank balance is made up
              of — committed money, future obligations, expected receipts, and what is left in the
              business after that.
            </p>
          </div>

          <div className="marketing-method-questions">
            <p className="marketing-method-questions-intro">It continuously answers questions such as:</p>
            <ul>
              {METHOD_CLARITY_QUESTIONS.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
            <p className="marketing-method-questions-note muted">
              This is clarity — not accounting. Bookkeeping records what happened. The Method shows
              what your money is doing today.
            </p>
          </div>

          <div className="marketing-method-equation-wrap">
            <MethodEquation variant="home" />
            <p className="marketing-method-equation-note">{METHOD_MANTRA}</p>
          </div>

          <p className="marketing-method-more">
            <Link to={METHOD_PAGE_PATH}>Read the full Method →</Link>
          </p>
        </div>
      </section>

      <section
        id="why-method-works"
        className="marketing-pillars-section marketing-pillars-section--pop marketing-method-section"
        aria-labelledby="why-method-heading"
      >
        <div className="marketing-section-inner">
          <div className="marketing-section-head marketing-section-head--center">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">Why it works</p>
            <h2 id="why-method-heading">Why the True Balance Method works</h2>
            <p className="marketing-section-lead">
              Same money. A clearer way of seeing what it is made up of.
            </p>
          </div>
          <div className="marketing-method-compare">
            <article className="marketing-method-compare-card marketing-method-compare-card--muted">
              <h3>{METHOD_WHY_COMPARE.traditional.title}</h3>
              <ul>
                {METHOD_WHY_COMPARE.traditional.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
            <article className="marketing-method-compare-card marketing-method-compare-card--accent">
              <h3>{METHOD_WHY_COMPARE.method.title}</h3>
              <ul>
                {METHOD_WHY_COMPARE.method.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section
        id="who-for"
        className="marketing-features-section marketing-features-section--pop marketing-method-section"
        aria-labelledby="who-for-heading"
      >
        <div className="marketing-section-inner">
          <div className="marketing-section-head marketing-section-head--center">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">Fit</p>
            <h2 id="who-for-heading">Who is the True Balance Method for?</h2>
            <p className="marketing-section-lead">
              Built for owners who already run a business — and still want a clearer read of the money
              in the bank.
            </p>
          </div>
          <div className="marketing-method-audience">
            <article className="marketing-method-audience-card">
              <h3>Designed for business owners who</h3>
              <ul>
                {METHOD_WHO_FOR.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="marketing-method-audience-card marketing-method-audience-card--quiet">
              <h3>Probably not for you if…</h3>
              <ul>
                {METHOD_WHO_NOT_FOR.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section
        id="two-habits"
        className="marketing-features-section marketing-features-section--pop marketing-method-section"
        aria-labelledby="method-habits-heading"
      >
        <div className="marketing-section-inner">
          <div className="marketing-section-head marketing-section-head--center">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">The routine</p>
            <h2 id="method-habits-heading">A simple daily and monthly routine</h2>
            <p className="marketing-section-lead">
              The software handles the calculations. You follow a light routine to keep the Method
              honest.
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
                <ul className="marketing-method-habit-tasks">
                  {habit.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-method-app-callout" aria-label="True Balance software">
        <div className="marketing-method-app-callout-inner">
          <p>
            <strong>The True Balance app is the easiest way to follow the Method.</strong> It accrues
            commitments, runs the Reserve Planner, and keeps a continuously updated picture of what
            your bank balance is made up of.
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
