import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { DEMO_SCENARIOS } from '../data/demoScenarios'
import { SEE_HOW_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { MarketingJsonLd, seeHowPageJsonLd } from '../components/marketing/MarketingJsonLd'

export function SeeHowItWorksPage() {
  usePageMeta(SEE_HOW_SEO)
  return (
    <MarketingShell>
      <MarketingJsonLd data={seeHowPageJsonLd()} />
      <MarketingHeader />

      <main className="marketing-main">
        <header className="method-edu-hero marketing-surface--hero">
          <div className="method-edu-inner">
            <h1>See Cash Prophet in a real business</h1>
            <p className="method-edu-hero-lead">
              Explore Cash Prophet through one of our example businesses. No signup needed.
            </p>
            <p className="method-edu-hero-lead">
              See how regular bills, costs building up, bigger expenses and the underlying financial
              position come together in one place.
            </p>
            <p className="method-edu-hero-lead">
              Each demo is a fixed example, so you can look around without changing anything.
            </p>
            <p className="method-edu-hero-lead method-edu-hero-lead--secondary">
              Prefer to understand how it works first?{' '}
              <CanonicalLink to="/how-it-works">See how it works</CanonicalLink>.
            </p>
          </div>
        </header>
        <section className="demo-scenarios-section demo-scenarios-section--landing marketing-surface--mist">
          <div className="marketing-section-inner">
            <div className="marketing-section-head demo-scenarios-head sr-only">
              <h2>Demo workspaces</h2>
            </div>

            <div className="demo-scenarios-grid">
              {DEMO_SCENARIOS.map((scenario) => (
                <article key={scenario.id} className="demo-scenario-card demo-scenario-card--compact">
                  <span className="demo-scenario-badge">Demo</span>
                  <p className="demo-scenario-type">{scenario.businessType}</p>
                  <h3>{scenario.title}</h3>
                  <p className="demo-scenario-subtitle">{scenario.subtitle}</p>
                  <CanonicalLink
                    to={`/demo/${scenario.id}`}
                    className="btn-primary btn-large demo-scenario-cta"
                  >
                    Take the guided tour
                  </CanonicalLink>
                </article>
              ))}
            </div>

            <div className="demo-scenarios-footer">
              <CanonicalLink to="/" className="btn-ghost">
                Back to home
              </CanonicalLink>
              <CanonicalLink to="/early-access" className="btn-secondary btn-large">
                Start with Cash Prophet
              </CanonicalLink>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
