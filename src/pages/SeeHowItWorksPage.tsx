import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { DEMO_SCENARIOS, DEMO_FROZEN_DATE_KEY } from '../data/demoScenarios'
import { SEE_HOW_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { formatSnapshotDateLong } from '../utils/snapshots'
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
            <p className="marketing-how-eyebrow">Try a demo</p>
            <h1>See it with a live business</h1>
            <p className="method-edu-hero-lead">
              Pick an example workspace and explore Cash Prophet — no signup needed. Each demo is a
              frozen snapshot as of {formatSnapshotDateLong(DEMO_FROZEN_DATE_KEY)}, so figures stay
              stable while you look around.
            </p>
            <p className="method-edu-hero-lead method-edu-hero-lead--secondary">
              Prefer to understand the system first? <CanonicalLink to="/how-it-works">See how it works</CanonicalLink>.
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
                    Explore this demo
                  </CanonicalLink>
                </article>
              ))}
            </div>

            <div className="demo-scenarios-footer">
              <CanonicalLink to="/" className="btn-ghost">
                ← Back to home
              </CanonicalLink>
              <CanonicalLink to="/signup" className="btn-secondary btn-large">
                Follow the Method in your business
              </CanonicalLink>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
