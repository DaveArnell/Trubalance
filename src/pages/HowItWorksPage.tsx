import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
  scrollToMarketingSection,
} from '../components/marketing/MarketingLayout'
import { MethodWorkedExample } from '../components/marketing/MethodWorkedExample'
import { MethodReservePlannerVisual } from '../components/marketing/MethodReservePlannerVisual'
import { MarketingAccruingDemo } from '../components/marketing/MarketingAccruingDemo'
import { HabitsTrendVisual } from '../components/marketing/HomeMarketingVisuals'
import {
  METHOD_FIRST_SETUP,
  METHOD_RESERVE_PLANNER,
  METHOD_SOFTWARE_HELPS,
  METHOD_THREE_PRINCIPLES,
  METHOD_TWO_HABITS,
} from '../content/trueBalanceMethod'
import { HOW_IT_WORKS_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

/**
 * How it works — enough to understand the system, not a feature manual.
 */
export function HowItWorksPage() {
  usePageMeta(HOW_IT_WORKS_SEO)

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const timer = window.setTimeout(() => scrollToMarketingSection(hash), 80)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="marketing-main marketing-method-page">
        <header className="method-edu-hero marketing-surface--hero">
          <div className="method-edu-inner">
            <p className="marketing-how-eyebrow">How it works</p>
            <h1>From commitments to one number you can trust</h1>
            <p className="method-edu-hero-lead">
              Cash Prophet isn&apos;t complicated. It follows a simple rhythm that keeps your
              business position accurate every day.
            </p>
          </div>
        </header>

        <section
          className="method-edu-section marketing-surface--paper"
          aria-labelledby="principles-heading"
          id="how-cash-prophet-works"
        >
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="principles-heading">How Cash Prophet works</h2>
              <p className="method-edu-section-lead">
                Cash Prophet does the daily calculations for you. Keep your bank balance up to date
                and it keeps your Available Balance current around your normal payment cycle.
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

        <section
          className="method-edu-section marketing-surface--mist"
          aria-labelledby="reserve-heading"
          id="reserve-planner"
        >
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="reserve-heading">{METHOD_RESERVE_PLANNER.title}</h2>
              <p className="method-edu-section-lead">{METHOD_RESERVE_PLANNER.lead}</p>
            </div>
            <MethodReservePlannerVisual />
            <ol className="method-edu-timeline method-edu-timeline--compact">
              {METHOD_RESERVE_PLANNER.steps.map((step, index) => (
                <li key={step}>
                  <span className="method-edu-timeline-step" aria-hidden>
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="method-edu-prose method-edu-prose--center">{METHOD_RESERVE_PLANNER.notSavings}</p>
            <p className="method-edu-prose method-edu-prose--center method-edu-prose--tip">
              {METHOD_RESERVE_PLANNER.tip}
            </p>
          </div>
        </section>

        <section
          className="method-edu-section method-edu-section--tint marketing-surface--panel"
          aria-labelledby="example-heading"
          id="worked-example"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <div className="method-edu-section-head">
              <h2 id="example-heading">A worked example</h2>
              <p className="method-edu-section-lead">
                How the bank figure becomes your Available Balance.
              </p>
            </div>
            <MethodWorkedExample />
          </div>
        </section>

        <section
          className="method-edu-section marketing-surface--paper"
          aria-labelledby="first-setup-heading"
          id="first-setup"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <div className="method-edu-section-head">
              <h2 id="first-setup-heading">{METHOD_FIRST_SETUP.heading}</h2>
              {METHOD_FIRST_SETUP.lead.map((paragraph) => (
                <p key={paragraph} className="method-edu-section-lead">
                  {paragraph}
                </p>
              ))}
            </div>
            {METHOD_FIRST_SETUP.body.map((paragraph) => (
              <p key={paragraph} className="method-edu-prose">
                {paragraph}
              </p>
            ))}
            <ol className="method-setup-timeline" aria-label="Setup path">
              {METHOD_FIRST_SETUP.timeline.map((step) => (
                <li key={step}>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="method-edu-section method-edu-section--tint marketing-surface--mist"
          aria-labelledby="habits-heading"
          id="habits"
        >
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="habits-heading">Two light habits</h2>
              <p className="method-edu-section-lead">
                A light check when something changes, and a short monthly reserve review.
              </p>
            </div>
            <div className="method-edu-habits method-edu-habits--with-trend">
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
              <HabitsTrendVisual />
            </div>
          </div>
        </section>

        <section
          className="method-edu-section marketing-surface--mist"
          aria-labelledby="platform-heading"
          id="platform"
        >
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="platform-heading">How the platform makes Cash Prophet effortless</h2>
              <p className="method-edu-section-lead">
                The app keeps the system up to date without turning it into another job.
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
                <p>Not another bookkeeping package. It sits alongside the tools you already use.</p>
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
