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
            <h2 id="method-problem-heading">You already know what&apos;s coming</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Payroll next week. Rent. That VAT bill sitting somewhere in the back of your mind.
              Insurance. The thing you hope you haven&apos;t forgotten.
            </p>
            <p className="method-edu-prose">
              So you open the bank — and before you&apos;ve put the phone down, you&apos;re
              subtracting. Can I actually afford this? Or am I about to regret it on Friday? The
              balance looks healthy. Your gut still won&apos;t settle. That gap between the screen
              and what you know is coming is exhausting. And it never really switches off.
            </p>
          </div>
        </section>

        <section
          className="method-edu-section method-edu-section--tint"
          aria-labelledby="method-outcome-heading"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-outcome-heading">What if you didn&apos;t have to carry that?</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Imagine checking the bank and not running the whole checklist again. The commitments
              you already know about are held for you. You look once. You know where you stand.
            </p>
            <div className="method-edu-compare">
              <div className="method-edu-compare-card method-edu-compare-card--muted">
                <p className="method-edu-compare-label">Without Cash Prophet</p>
                <p className="method-edu-compare-quote">“Can I afford this?”</p>
                <p className="method-edu-compare-note">
                  Same question. Same mental subtraction. Every single time.
                </p>
              </div>
              <div className="method-edu-compare-card method-edu-compare-card--accent">
                <p className="method-edu-compare-label">With Cash Prophet</p>
                <p className="method-edu-compare-quote">You already know.</p>
                <p className="method-edu-compare-note">
                  Not a figure you still have to decode. Just what&apos;s actually left to work
                  with.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="method-edu-cta" aria-labelledby="method-cta-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-cta-heading">Put the phone down without that knot in your stomach</h2>
            <p>
              If this sounds painfully familiar, you&apos;re not imagining it — and you don&apos;t
              have to keep living in it. See how it works, or start free and feel the difference
              yourself.
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
