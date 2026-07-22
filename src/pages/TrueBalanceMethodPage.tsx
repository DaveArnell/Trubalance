import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { HeroBalanceVisual } from '../components/marketing/HeroBalanceVisual'
import {
  METHOD_MANTRA,
  METHOD_PAGE_SUBTITLE,
  METHOD_PAGE_TITLE,
  WHY_PAGE_OUTCOMES,
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
            <p className="marketing-how-eyebrow">Why Cash Prophet</p>
            <h1>{METHOD_PAGE_TITLE}</h1>
            <p className="method-edu-hero-lead">{METHOD_PAGE_SUBTITLE}</p>
            <p className="method-edu-mantra">{METHOD_MANTRA}</p>
          </div>
        </header>

        <section className="method-edu-section" aria-labelledby="method-problem-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-problem-heading">The worry behind the bank app</h2>
            <p className="method-edu-prose">
              Most owners wake up with the same questions. Can I afford this? How much is already
              spoken for? Will VAT catch me out again?
            </p>
            <p className="method-edu-prose">
              The bank balance can&apos;t answer them. It only tells you where money sits today. Not
              how much of it is already spoken for.
            </p>
            <div className="method-edu-callout">
              <p>
                Payroll. Rent. Utilities. Subscriptions. VAT. Corporation tax. Insurance. Quarterly
                bills. Annual renewals. They&apos;re already in that figure, waiting to leave.
              </p>
              <p>
                <strong>That&apos;s why looking at the bank creates stress.</strong> You&apos;re doing
                the maths in your head. Every time.
              </p>
            </div>
          </div>
          <div className="method-edu-inner method-balance-visual-wrap">
            <HeroBalanceVisual />
          </div>
        </section>

        <section className="method-edu-section method-edu-section--tint" aria-labelledby="method-feeling-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-feeling-heading">What that does to you</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              It isn&apos;t one dramatic moment. It&apos;s the constant low-level calculation that never
              quite switches off.
            </p>
            <p className="method-edu-prose">
              You open the bank hoping for clarity. You leave with more questions than you started
              with. Even when the balance looks healthy, you&apos;re still not sure. That gap between
              the screen and your gut is exhausting. And it&apos;s hard to make good decisions from
              that place.
            </p>
          </div>
        </section>

        <section className="method-edu-section" aria-labelledby="method-outcome-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-outcome-heading">What changes</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Cash Prophet takes that loop off you. The commitments you already know about stay
              organised. You look at one number. You know where you stand.
            </p>
            <ul className="method-edu-benefit-grid">
              {WHY_PAGE_OUTCOMES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="method-edu-compare method-edu-compare--after-list">
              <div className="method-edu-compare-card method-edu-compare-card--muted">
                <p className="method-edu-compare-label">Without Cash Prophet</p>
                <p className="method-edu-compare-quote">“Can I afford this?”</p>
                <p className="method-edu-compare-note">Guessing from the bank app every time.</p>
              </div>
              <div className="method-edu-compare-card method-edu-compare-card--accent">
                <p className="method-edu-compare-label">With Cash Prophet</p>
                <p className="method-edu-compare-quote">You already know.</p>
                <p className="method-edu-compare-note">
                  Decisions use what&apos;s genuinely available. Not a figure you still have to decode.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="method-edu-section method-edu-section--tint" aria-labelledby="method-alongside-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-alongside-heading">It fits alongside what you already use</h2>
            <p className="method-edu-prose">
              Cash Prophet isn&apos;t another bookkeeping package. It isn&apos;t trying to replace your
              accountant or your bank.
            </p>
            <p className="method-edu-prose">
              Bookkeeping looks after the past. Your bank shows where money sits today. Cash Prophet
              answers a different question: what&apos;s genuinely available, once the commitments you
              already know about are accounted for.
            </p>
            <p className="method-edu-prose muted method-edu-disclaimer">
              It does not provide regulated financial, tax or accounting advice. Always take
              professional advice for tax and statutory obligations.
            </p>
          </div>
        </section>

        <section className="method-edu-cta" aria-labelledby="method-cta-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-cta-heading">Ready to put that bank-check worry down?</h2>
            <p>
              If this sounds like you, the next step is seeing how it works in practice. Or start
              free and feel the difference yourself.
            </p>
            <div className="marketing-cta-row">
              <Link to="/how-it-works" className="btn-primary btn-large">
                How it works
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
