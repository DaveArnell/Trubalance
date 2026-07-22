import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { HeroBalanceVisual } from '../components/marketing/HeroBalanceVisual'
import { MethodWorkedExample } from '../components/marketing/MethodWorkedExample'
import { MarketingAccruingDemo } from '../components/marketing/MarketingAccruingDemo'
import {
  METHOD_FOR_ACCOUNTANTS,
  METHOD_MANTRA,
  METHOD_PAGE_SUBTITLE,
  METHOD_PAGE_TITLE,
  METHOD_RESERVE_PLANNER,
  METHOD_SOFTWARE_HELPS,
  METHOD_THREE_PRINCIPLES,
  METHOD_TWO_HABITS,
  METHOD_WHY_IT_WORKS,
} from '../content/trueBalanceMethod'
import { METHOD_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function TrueBalanceMethodPage() {
  usePageMeta(METHOD_SEO)

  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="marketing-main marketing-method-page">
        <header className="method-edu-hero">
          <div className="method-edu-inner">
            <p className="marketing-how-eyebrow">Why it works</p>
            <h1>{METHOD_PAGE_TITLE}</h1>
            <p className="method-edu-hero-lead">{METHOD_PAGE_SUBTITLE}</p>
            <p className="method-edu-mantra">{METHOD_MANTRA}</p>
          </div>
        </header>

        <section className="method-edu-section" aria-labelledby="method-problem-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-problem-heading">The worry behind the bank app</h2>
            <p className="method-edu-prose">
              Most owners wake up with the same questions: can I afford this, how much is already
              spoken for, will VAT catch me out again? The bank balance can’t answer them — it only
              tells you where money sits, not how much of it is genuinely available.
            </p>
            <div className="method-edu-callout">
              <p>
                It already includes money committed to payroll, rent, utilities, subscriptions,
                finance, VAT, corporation tax, insurance, quarterly bills and other obligations.
              </p>
              <p>
                <strong>That is why looking at the bank creates stress.</strong> You are doing the
                maths in your head — every time.
              </p>
            </div>
            <p className="method-edu-prose">
              Cash Prophet removes that burden. It quietly keeps track of known commitments, builds
              towards them continuously, and shows what is genuinely available — so you can stop
              worrying.
            </p>
          </div>
          <div className="method-edu-inner method-balance-visual-wrap">
            <HeroBalanceVisual />
          </div>
        </section>

        <section className="method-edu-section method-edu-section--tint" aria-labelledby="method-goal-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-goal-heading">The feeling it creates</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Less stress. More confidence. One calm number you can trust every day.
            </p>
            <div className="method-edu-compare">
              <div className="method-edu-compare-card method-edu-compare-card--muted">
                <p className="method-edu-compare-label">Without Cash Prophet</p>
                <p className="method-edu-compare-quote">“Can I afford this?”</p>
                <p className="method-edu-compare-note">Guessing from the bank app every time.</p>
              </div>
              <div className="method-edu-compare-card method-edu-compare-card--accent">
                <p className="method-edu-compare-label">With Cash Prophet</p>
                <p className="method-edu-compare-quote">You already know.</p>
                <p className="method-edu-compare-note">
                  Decisions use what’s genuinely available — not a figure you still have to decode.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="method-edu-section" aria-labelledby="method-habits-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="method-habits-heading">Two light habits</h2>
              <p className="method-edu-section-lead">
                Cash Prophet stays simple on purpose. A light daily check and a short monthly reserve
                review — the system does the heavy lifting.
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

        <section className="method-edu-section method-edu-section--tint" aria-labelledby="method-maths-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="method-maths-heading">How Cash Prophet works</h2>
              <p className="method-edu-section-lead">
                Supporting detail — continuous organisation of commitments, predictable reserves, and
                one calm number.
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

        <section className="method-edu-section" aria-labelledby="method-reserve-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-reserve-heading">{METHOD_RESERVE_PLANNER.title}</h2>
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
              This is not simply “save the same amount every month.” It is a living annual funding
              plan that can move money into the reserve — or back out — so the position stays correct
              as obligations change through the year.
            </p>
          </div>
        </section>

        <section className="method-edu-section method-edu-section--tint" aria-labelledby="method-example-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <div className="method-edu-section-head">
              <h2 id="method-example-heading">A worked example</h2>
              <p className="method-edu-section-lead">
                How the bank figure becomes one clearer number you can trust.
              </p>
            </div>
            <MethodWorkedExample />
            <p className="method-edu-prose method-edu-example-note">
              Monthly costs already building, irregular bills funded through reserves, and only
              receipts you can realistically rely on. The result — <strong>what’s available</strong>{' '}
              — is the number for day-to-day decisions.
            </p>
          </div>
        </section>

        <section className="method-edu-section" aria-labelledby="method-why-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="method-why-heading">Why this works</h2>
              <p className="method-edu-section-lead">
                Calm financial clarity instead of an unpredictable bank balance.
              </p>
            </div>
            <ul className="method-edu-benefit-grid">
              {METHOD_WHY_IT_WORKS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="method-edu-section method-edu-section--tint" aria-labelledby="method-software-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="method-software-heading">How the platform makes Cash Prophet effortless</h2>
              <p className="method-edu-section-lead">
                Cash Prophet is the system. The app simply makes it easy to follow every day.
              </p>
            </div>
            <div className="method-edu-software-grid">
              <div className="method-edu-software-card">
                <h3>What the app automates</h3>
                <ul>
                  {METHOD_SOFTWARE_HELPS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="method-edu-software-card method-edu-software-card--aside">
                <h3>What it is not</h3>
                <p>
                  Not another bookkeeping package. Bookkeeping records the past. Cash Prophet helps
                  you understand today — alongside the software you already use with your accountant.
                </p>
                <p className="muted method-edu-disclaimer">
                  It does not provide regulated financial, tax or accounting advice. Always take
                  professional advice for tax and statutory obligations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="method-edu-section" aria-labelledby="method-accountants-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-accountants-heading">For accountants</h2>
            <p className="method-edu-prose">
              Cash Prophet is something an accountant can recommend — clearer day-to-day visibility
              between formal reports.
            </p>
            <ul className="method-edu-plain-list">
              {METHOD_FOR_ACCOUNTANTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="method-edu-cta" aria-labelledby="method-cta-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-cta-heading">Ready to let Cash Prophet carry the load?</h2>
            <p>
              Start free and feel what it’s like when known commitments stay organised — and one calm
              number stays clear.
            </p>
            <div className="marketing-cta-row">
              <Link to="/signup" className="btn-primary btn-large">
                Get started
              </Link>
              <Link to="/see-how-it-works" className="btn-secondary btn-large">
                See how it feels →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
