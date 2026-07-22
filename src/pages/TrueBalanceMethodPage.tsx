import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import {
  METHOD_MANTRA,
  METHOD_PAGE_SUBTITLE,
  METHOD_PAGE_TITLE,
} from '../content/trueBalanceMethod'
import { METHOD_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function TrueBalanceMethodPage() {
  usePageMeta(METHOD_SEO)

  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="marketing-main marketing-method-page marketing-method-page--why">
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
            <h2 id="method-problem-heading">The bank balance can&apos;t answer you</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Can I afford this? How much is spoken for? Will VAT catch me out again?
            </p>
            <p className="method-edu-prose">
              The bank only shows where money sits today — not how much of it is already claimed. So
              you do the maths in your head. Every time. That low-level calculation never quite
              switches off. Even when the balance looks healthy, you&apos;re still not sure.
            </p>
          </div>
        </section>

        <section
          className="method-edu-section method-edu-section--tint"
          aria-labelledby="method-outcome-heading"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-outcome-heading">What changes</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Cash Prophet takes that loop off you. One number. You know where you stand.
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
                  Decisions use what&apos;s genuinely available — not a figure you still have to
                  decode.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="method-edu-cta" aria-labelledby="method-cta-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-cta-heading">Ready to put that bank-check worry down?</h2>
            <p>
              You understand why you need it. Next: see how it works — or start free and feel the
              difference.
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
