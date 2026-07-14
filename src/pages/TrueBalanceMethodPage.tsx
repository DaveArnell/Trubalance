import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { MethodWorkedExample } from '../components/marketing/MethodWorkedExample'
import {
  METHOD_FOR_ACCOUNTANTS,
  METHOD_MANTRA,
  METHOD_PAGE_SUBTITLE,
  METHOD_PAGE_TITLE,
  METHOD_ROUTINE_HABITS,
  METHOD_SOFTWARE_HELPS,
  METHOD_THREE_PRINCIPLES,
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
        {/* Hero */}
        <header className="method-edu-hero">
          <div className="method-edu-inner">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">Financial management</p>
            <h1>{METHOD_PAGE_TITLE}</h1>
            <p className="method-edu-hero-lead">{METHOD_PAGE_SUBTITLE}</p>
            <p className="method-edu-mantra">{METHOD_MANTRA}</p>
          </div>
        </header>

        {/* Opening — the problem */}
        <section className="method-edu-section" aria-labelledby="method-problem-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-problem-heading">The problem with the bank balance</h2>
            <p className="method-edu-prose">
              Almost every business owner knows their bank balance. Far fewer know how much of that
              money is genuinely available.
            </p>
            <div className="method-edu-callout">
              <p>
                A bank balance includes money already committed to payroll, VAT, tax, rent,
                subscriptions, finance payments and future obligations. It can look healthy one day
                and dangerously low the next.
              </p>
              <p>
                <strong>Nothing actually changed. The timing of payments changed.</strong>
              </p>
            </div>
            <p className="method-edu-prose">
              The True Balance Method removes those swings by recognising financial commitments as
              they build up — rather than waiting until they leave the bank account.
            </p>
          </div>
        </section>

        {/* Goal */}
        <section className="method-edu-section method-edu-section--tint" aria-labelledby="method-goal-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-goal-heading">The goal</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Give business owners one realistic financial position they can trust every day.
            </p>
            <div className="method-edu-compare">
              <div className="method-edu-compare-card method-edu-compare-card--muted">
                <p className="method-edu-compare-label">Without the method</p>
                <p className="method-edu-compare-quote">“Can I afford this?”</p>
                <p className="method-edu-compare-note">A guessing game every time something comes up.</p>
              </div>
              <div className="method-edu-compare-card method-edu-compare-card--accent">
                <p className="method-edu-compare-label">With the method</p>
                <p className="method-edu-compare-quote">You already know.</p>
                <p className="method-edu-compare-note">
                  Decisions use your True Balance — the position that is genuinely available.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Three principles */}
        <section className="method-edu-section" aria-labelledby="method-principles-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="method-principles-heading">The three principles</h2>
              <p className="method-edu-section-lead">
                A practical system for available business cash — whether you keep it on a spreadsheet
                or in software.
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

        {/* Worked example */}
        <section className="method-edu-section method-edu-section--tint" aria-labelledby="method-example-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <div className="method-edu-section-head">
              <h2 id="method-example-heading">A worked example</h2>
              <p className="method-edu-section-lead">
                How bank balance vs available cash becomes one clearer figure.
              </p>
            </div>
            <MethodWorkedExample />
            <p className="method-edu-prose method-edu-example-note">
              Each adjustment is explicit: monthly costs already building, irregular bills being
              reserved, and only receipts you can realistically rely on. The result —{' '}
              <strong>True Balance</strong> — is the number for day-to-day spending decisions.
            </p>
          </div>
        </section>

        {/* Why this works */}
        <section className="method-edu-section" aria-labelledby="method-why-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="method-why-heading">Why this works</h2>
              <p className="method-edu-section-lead">
                Continuous financial clarity instead of an unpredictable bank balance.
              </p>
            </div>
            <ul className="method-edu-benefit-grid">
              {METHOD_WHY_IT_WORKS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Keeping it up to date */}
        <section className="method-edu-section method-edu-section--tint" aria-labelledby="method-routine-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-routine-heading">Keeping it up to date</h2>
            <p className="method-edu-prose">
              After initial setup, the routine is deliberately simple. This is not software that
              demands constant maintenance.
            </p>
            <ol className="method-edu-timeline">
              {METHOD_ROUTINE_HABITS.map((habit, index) => (
                <li key={habit}>
                  <span className="method-edu-timeline-step" aria-hidden>
                    {index + 1}
                  </span>
                  <span>{habit}</span>
                </li>
              ))}
            </ol>
            <div className="method-edu-callout method-edu-callout--quiet">
              <p>
                <strong>Small daily awareness. Small monthly housekeeping. Continuous financial
                clarity.</strong>
              </p>
              <p>
                Everything else — daily accruals, reserve build-up, and your True Balance — updates
                in the background when you use the software to follow the method.
              </p>
            </div>
          </div>
        </section>

        {/* How software helps — AFTER the method */}
        <section className="method-edu-section" aria-labelledby="method-software-heading">
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="method-software-heading">How True Balance helps</h2>
              <p className="method-edu-section-lead">
                The method stands on its own. The software is the easiest way to put it into practice.
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
                  True Balance is not another bookkeeping package. It sits alongside accounting
                  software and turns financial information into practical day-to-day decisions.
                </p>
                <p className="muted method-edu-disclaimer">
                  It does not provide regulated financial, tax or accounting advice. Always take
                  professional advice for tax and statutory obligations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Accountants */}
        <section className="method-edu-section method-edu-section--tint" aria-labelledby="method-accountants-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-accountants-heading">For accountants</h2>
            <p className="method-edu-prose">
              The True Balance Method is something an accountant can recommend to a client — clearer
              day-to-day visibility between formal reports.
            </p>
            <ul className="method-edu-plain-list">
              {METHOD_FOR_ACCOUNTANTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="method-edu-cta" aria-labelledby="method-cta-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-cta-heading">Ready to try the True Balance Method?</h2>
            <p>
              Instead of maintaining spreadsheets and manual calculations, let True Balance keep
              everything up to date for you.
            </p>
            <div className="marketing-cta-row">
              <Link to="/signup" className="btn-primary btn-large">
                Start your free trial
              </Link>
              <Link to="/see-how-it-works" className="btn-secondary btn-large">
                See how True Balance works →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
