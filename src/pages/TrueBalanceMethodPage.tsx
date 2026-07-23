import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { METHOD_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function TrueBalanceMethodPage() {
  usePageMeta(METHOD_SEO)

  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="marketing-main marketing-method-page marketing-method-page--why">
        <header className="method-edu-hero marketing-surface--hero">
          <div className="method-edu-inner method-edu-inner--narrow">
            <p className="marketing-how-eyebrow">Why Cash Prophet</p>
            <h1>Cash Prophet</h1>
            <p className="method-edu-hero-lead">
              The bank balance isn&apos;t lying. It&apos;s just answering the wrong question.
            </p>
            <p className="method-edu-prose method-edu-prose--lead">
              You open your banking app and the number looks fine — but before you&apos;ve put your
              phone down, you&apos;ve already started doing the maths. Payroll, rent, VAT, that
              supplier invoice due next week, the insurance renewal. Nothing has changed in the
              account, yet somehow the money already feels spoken for.
            </p>
            <p className="method-edu-mantra">That&apos;s exactly what Cash Prophet fixes.</p>
          </div>
        </header>

        <section
          className="method-edu-section marketing-surface--mist"
          aria-labelledby="method-problem-heading"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-problem-heading">You already know what&apos;s coming</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Every business owner does the same thing. You look at the bank balance, then start
              subtracting everything you know is coming: can I afford this, will there still be
              enough for payroll, have I remembered the VAT, what about that annual bill next month?
            </p>
            <p className="method-edu-prose">
              The bank balance can&apos;t answer those questions, so your brain tries to — every time
              you check it.
            </p>
          </div>
        </section>

        <section
          className="method-edu-section method-edu-section--tint marketing-surface--panel"
          aria-labelledby="method-outcome-heading"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-outcome-heading">What changes?</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Cash Prophet keeps track of those commitments for you. Instead of looking at the bank
              balance and wondering what you&apos;ve forgotten, you look once and know what&apos;s
              actually available — not because the bills have disappeared, but because they&apos;ve
              already been taken into account.
            </p>
            <div className="method-edu-compare method-edu-compare--after-list">
              <div className="method-edu-compare-card method-edu-compare-card--muted">
                <p className="method-edu-compare-label">Without Cash Prophet</p>
                <p className="method-edu-compare-quote">“Can I actually afford this?”</p>
                <p className="method-edu-compare-note">
                  Every decision starts with another round of mental arithmetic.
                </p>
              </div>
              <div className="method-edu-compare-card method-edu-compare-card--accent">
                <p className="method-edu-compare-label">With Cash Prophet</p>
                <p className="method-edu-compare-quote">“I&apos;ve already allowed for that.”</p>
                <p className="method-edu-compare-note">
                  The number already reflects the commitments you know about, so there&apos;s nothing
                  left to work out.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="method-edu-section marketing-surface--ink-soft"
          aria-label="What Cash Prophet does"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <p className="method-edu-prose method-edu-prose--lead">
              Cash Prophet doesn&apos;t make your business richer, make bills disappear, or predict
              the future. It simply keeps track of the commitments you&apos;re already carrying
              around in your head — so checking your bank balance becomes quick again. You look, you
              understand it, and you move on.
            </p>
          </div>
        </section>

        <section className="method-edu-cta" aria-labelledby="method-cta-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-cta-heading">Ready to stop second-guessing your bank balance?</h2>
            <p>See how Cash Prophet works, or start using it today.</p>
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
