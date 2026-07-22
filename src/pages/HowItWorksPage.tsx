import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { MethodWorkedExample } from '../components/marketing/MethodWorkedExample'
import { MarketingAccruingDemo } from '../components/marketing/MarketingAccruingDemo'
import {
  METHOD_CUSTOMER_JOURNEY,
  METHOD_PAGE_PATH,
  METHOD_RESERVE_PLANNER,
  METHOD_SOFTWARE_HELPS,
  METHOD_THREE_PRINCIPLES,
  METHOD_TWO_HABITS,
} from '../content/trueBalanceMethod'
import { HOW_IT_WORKS_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function HowItWorksPage() {
  usePageMeta(HOW_IT_WORKS_SEO)
  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="marketing-main marketing-method-page">
        <header className="method-edu-hero">
          <div className="method-edu-inner">
            <p className="marketing-how-eyebrow">How it works</p>
            <h1>From commitments to one number you can trust</h1>
            <p className="method-edu-hero-lead">
              Once you know why you want Cash Prophet, here&apos;s how it works in practice. Connect
              the business, keep a light routine, and let the commitments you already know about stay
              organised.
            </p>
            <p className="method-edu-mantra">
              Still weighing it up?{' '}
              <Link to={METHOD_PAGE_PATH}>Why Cash Prophet</Link> covers the problem and the outcome.
            </p>
          </div>
        </header>

        <section className="method-edu-section" aria-labelledby="journey-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="journey-heading">Your path through it</h2>
              <p className="method-edu-section-lead">
                Start with the problem you already know. Then follow a simple routine.
              </p>
            </div>
            <ol className="marketing-journey-list">
              {METHOD_CUSTOMER_JOURNEY.map((item) => (
                <li key={item.step} className="marketing-journey-item">
                  <span className="marketing-journey-step">{item.step}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="method-edu-section method-edu-section--tint" aria-labelledby="principles-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="principles-heading">What Cash Prophet is doing</h2>
              <p className="method-edu-section-lead">
                Known costs build every day. Bigger irregular bills become monthly. One number stays
                clear for decisions.
              </p>
            </div>
            <div className="method-edu-principles">
              {METHOD_THREE_PRINCIPLES.map((principle, index) => (
                <article key={principle.id} className="method-edu-principle-card" id={principle.id}>
                  <p className="method-edu-principle-num" aria-hidden>
                    {index + 1}
                  </p>
                  <h3>{principle.title}</h3>
                  <p className="method-edu-principle-lead">{principle.lead}</p>
                  <p className="method-edu-prose">{principle.body}</p>
                  <ul className="method-edu-chip-list">
                    {principle.examples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <MarketingAccruingDemo variant="method" />

        <section className="method-edu-section" aria-labelledby="reserve-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="reserve-heading">{METHOD_RESERVE_PLANNER.title}</h2>
            <div className="method-edu-callout">
              <p>
                <strong>{METHOD_RESERVE_PLANNER.notSavings}</strong>
              </p>
            </div>
            <ol className="method-edu-timeline">
              {METHOD_RESERVE_PLANNER.steps.map((step, index) => (
                <li key={step}>
                  <span className="method-edu-timeline-step" aria-hidden>
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="method-edu-prose">
              This isn&apos;t just saving the same amount every month. It&apos;s a living plan that can
              move money into the reserve, or back out, so the position stays correct as obligations
              change through the year.
            </p>
          </div>
        </section>

        <section className="method-edu-section method-edu-section--tint" aria-labelledby="example-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <div className="method-edu-section-head">
              <h2 id="example-heading">A worked example</h2>
              <p className="method-edu-section-lead">
                How the bank figure becomes one clearer number you can trust.
              </p>
            </div>
            <MethodWorkedExample />
            <p className="method-edu-prose method-edu-example-note">
              Monthly costs already building, irregular bills funded through reserves, and only
              receipts you can realistically rely on. The result is what&apos;s available for day-to-day
              decisions.
            </p>
          </div>
        </section>

        <section className="method-edu-section" aria-labelledby="habits-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="habits-heading">Two light habits</h2>
              <p className="method-edu-section-lead">
                A light daily check and a short monthly reserve review. That&apos;s enough to keep the
                picture honest.
              </p>
            </div>
            <div className="method-edu-habits">
              {METHOD_TWO_HABITS.map((habit) => (
                <article key={habit.id} className="method-edu-habit-card">
                  <p className="method-edu-habit-meta">
                    <span>{habit.title}</span>
                    <span className="method-edu-habit-time">{habit.time}</span>
                  </p>
                  <h3>{habit.lead}</h3>
                  <p>{habit.body}</p>
                  <ul className="method-edu-habit-tasks">
                    {habit.tasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="method-edu-section method-edu-section--tint" aria-labelledby="platform-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="platform-heading">What the app does for you</h2>
              <p className="method-edu-section-lead">
                Cash Prophet is the system. The app keeps it up to date without turning it into another
                job.
              </p>
            </div>
            <div className="method-edu-software-grid">
              <div className="method-edu-software-card">
                <h3>What it automates</h3>
                <ul>
                  {METHOD_SOFTWARE_HELPS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="method-edu-software-card method-edu-software-card--aside">
                <h3>What it is not</h3>
                <p>
                  Not another bookkeeping package. It sits alongside the tools you already use with
                  your accountant.
                </p>
                <p className="muted method-edu-disclaimer">
                  It does not provide regulated financial, tax or accounting advice.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="method-edu-cta" aria-labelledby="how-cta-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="how-cta-heading">See it with a live business</h2>
            <p>Open a demo, or start free and set up your own picture.</p>
            <div className="marketing-cta-row">
              <Link to="/see-how-it-works" className="btn-primary btn-large">
                See it
              </Link>
              <Link to="/signup" className="btn-secondary btn-large">
                Get started
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
