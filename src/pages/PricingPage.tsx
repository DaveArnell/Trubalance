import { Link } from 'react-router-dom'
import { MarketingFooter, MarketingHeader, MarketingShell } from '../components/marketing/MarketingLayout'
import { PricingSection } from '../components/marketing/PricingSection'
import { PRICING_HEADLINE, PRICING_SUBHEADLINE } from '../config/subscriptionTiers'
import { PRICING_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function PricingPage() {
  usePageMeta(PRICING_SEO)
  return (
    <MarketingShell>
      <MarketingHeader />
      <main className="marketing-main">
        <header className="method-edu-hero marketing-surface--hero">
          <div className="method-edu-inner">
            <p className="marketing-how-eyebrow">Pricing</p>
            <h1>{PRICING_HEADLINE}</h1>
            <p className="method-edu-hero-lead">{PRICING_SUBHEADLINE}</p>
          </div>
        </header>
        <PricingSection hideIntro />
        <section id="billing" className="marketing-billing-section marketing-surface--mist">
          <div className="marketing-section-inner">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">Billing</p>
              <h2>How billing will work</h2>
              <p className="marketing-section-lead marketing-section-lead--home">
                Payments are not switched on yet. When they are, you will choose monthly (rolling
                contract, cancel anytime) or annual (one payment upfront for the year).
              </p>
            </div>
            <p className="muted marketing-billing-note">
              Signed-in customers will manage their subscription from Settings → Your plan. Invoices
              will be available there once billing goes live.
            </p>
            <p className="marketing-billing-cta">
              <Link to="/signup" className="btn-primary">
                Start free trial
              </Link>
              <Link to="/app" className="btn-ghost">
                Back to app
              </Link>
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
