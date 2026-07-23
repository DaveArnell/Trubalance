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
              Payroll next week. Rent. That VAT bill you keep meaning to check. Insurance. The one
              thing you hope you haven&apos;t forgotten.
            </p>
            <p className="method-edu-prose">
              So you open the bank — and before you&apos;ve put the phone down, you&apos;re
              subtracting again. Can I actually afford this? Or am I going to regret it on Friday?
              The balance looks fine. You still don&apos;t feel sure. You&apos;re sick of doing that
              every time. And it doesn&apos;t really stop.
            </p>
          </div>
        </section>

        <section
          className="method-edu-section method-edu-section--tint"
          aria-labelledby="method-outcome-heading"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-outcome-heading">What if that stopped?</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Imagine opening the bank and not running through everything again in your head. The
              bills you already know about are being kept track of. You look once — and you can tell
              whether you can afford it.
            </p>
            <div className="method-edu-compare">
              <div className="method-edu-compare-card method-edu-compare-card--muted">
                <p className="method-edu-compare-label">Without Cash Prophet</p>
                <p className="method-edu-compare-quote">“Can I afford this?”</p>
                <p className="method-edu-compare-note">
                  Same question. Same subtracting in your head. Every time.
                </p>
              </div>
              <div className="method-edu-compare-card method-edu-compare-card--accent">
                <p className="method-edu-compare-label">With Cash Prophet</p>
                <p className="method-edu-compare-quote">You already know.</p>
                <p className="method-edu-compare-note">
                  Not left guessing from the bank balance alone. You can see what&apos;s actually
                  left.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="method-edu-cta" aria-labelledby="method-cta-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-cta-heading">Ready to stop doing this every time you check the bank?</h2>
            <p>
              If that sounds like you, you&apos;re not imagining it. Have a look at how it works —
              or try it free and see for yourself.
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
