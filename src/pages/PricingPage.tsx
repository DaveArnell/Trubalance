import { CanonicalLink } from '../components/CanonicalLink'
import { MarketingFooter, MarketingHeader, MarketingShell } from '../components/marketing/MarketingLayout'
import { MarketingFaqSection } from '../components/marketing/MarketingFaqSection'
import { MarketingJsonLd, pricingPageJsonLd } from '../components/marketing/MarketingJsonLd'
import { PricingSection } from '../components/marketing/PricingSection'
import { PRICING_HEADLINE, PRICING_SUBHEADLINE } from '../config/subscriptionTiers'
import { PRICING_FAQS } from '../content/marketingFaqs'
import { PRICING_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function PricingPage() {
  usePageMeta(PRICING_SEO)
  return (
    <MarketingShell>
      <MarketingJsonLd data={pricingPageJsonLd(PRICING_FAQS)} />
      <MarketingHeader />
      <main className="marketing-main marketing-main--pricing">
        <header className="method-edu-hero method-edu-hero--compact marketing-surface--hero">
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
              <CanonicalLink to="/signup" className="btn-primary">
                Start free trial
              </CanonicalLink>
              <CanonicalLink to="/app" className="btn-ghost">
                Back to app
              </CanonicalLink>
            </p>
          </div>
        </section>
        <MarketingFaqSection
          heading="Pricing questions"
          lead="Straight answers before you start your free trial."
          items={PRICING_FAQS}
        />
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
