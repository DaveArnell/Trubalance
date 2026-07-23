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
        <header className="method-edu-hero">
          <div className="method-edu-inner method-edu-inner--narrow">
            <p className="marketing-how-eyebrow">Why Cash Prophet</p>
            <h1>Cash Prophet</h1>
            <p className="method-edu-hero-lead">
              The bank balance isn&apos;t lying. It&apos;s just answering the wrong question.
            </p>
            <p className="method-edu-prose">You open your banking app.</p>
            <p className="method-edu-prose">The number looks fine.</p>
            <p className="method-edu-prose">
              But before you&apos;ve even put your phone down, you&apos;ve already started doing the
              maths.
            </p>
            <p className="method-edu-prose">Payroll.</p>
            <p className="method-edu-prose">Rent.</p>
            <p className="method-edu-prose">VAT.</p>
            <p className="method-edu-prose">That supplier invoice due next week.</p>
            <p className="method-edu-prose">The insurance renewal.</p>
            <p className="method-edu-prose">Nothing has changed in the account.</p>
            <p className="method-edu-prose">Yet somehow the money already feels spoken for.</p>
            <p className="method-edu-mantra">That&apos;s exactly what Cash Prophet fixes.</p>
          </div>
        </header>

        <section className="method-edu-section" aria-labelledby="method-problem-heading">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-problem-heading">You already know what&apos;s coming</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Every business owner does the same thing.
            </p>
            <p className="method-edu-prose">You look at the bank balance.</p>
            <p className="method-edu-prose">
              Then you start subtracting everything you know is coming.
            </p>
            <p className="method-edu-prose">Can I afford this?</p>
            <p className="method-edu-prose">Will there still be enough for payroll?</p>
            <p className="method-edu-prose">Have I remembered the VAT?</p>
            <p className="method-edu-prose">What about that annual bill next month?</p>
            <p className="method-edu-prose">The bank balance can&apos;t answer those questions.</p>
            <p className="method-edu-prose">So your brain tries to.</p>
            <p className="method-edu-prose">Every single time you check it.</p>
          </div>
        </section>

        <section
          className="method-edu-section method-edu-section--tint"
          aria-labelledby="method-outcome-heading"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <h2 id="method-outcome-heading">What changes?</h2>
            <p className="method-edu-prose method-edu-prose--lead">
              Cash Prophet keeps track of those commitments for you.
            </p>
            <p className="method-edu-prose">
              Instead of looking at the bank balance and wondering what you&apos;ve forgotten, you
              look once and know what&apos;s actually available.
            </p>
            <p className="method-edu-prose">Not because the bills have disappeared.</p>
            <p className="method-edu-prose">Because they&apos;ve already been taken into account.</p>
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

        <section className="method-edu-section" aria-label="What Cash Prophet does">
          <div className="method-edu-inner method-edu-inner--narrow">
            <p className="method-edu-prose method-edu-prose--lead">
              Cash Prophet doesn&apos;t make your business richer.
            </p>
            <p className="method-edu-prose">It doesn&apos;t make bills disappear.</p>
            <p className="method-edu-prose">It doesn&apos;t predict the future.</p>
            <p className="method-edu-prose">
              It simply keeps track of the commitments you&apos;re already carrying around in your
              head.
            </p>
            <p className="method-edu-prose">So checking your bank balance becomes quick again.</p>
            <p className="method-edu-prose">You look.</p>
            <p className="method-edu-prose">You understand it.</p>
            <p className="method-edu-prose">You move on.</p>
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
