import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { DEMO_SCENARIOS } from '../data/demoScenarios'
import { METHOD_PAGE_PATH } from '../content/trueBalanceMethod'
import { SEE_HOW_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function SeeHowItWorksPage() {
  usePageMeta(SEE_HOW_SEO)
  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="marketing-main">
        <section className="demo-scenarios-section demo-scenarios-section--landing">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center demo-scenarios-head">
              <p className="marketing-eyebrow">Try the Method live</p>
              <h1>See the Method in a live business</h1>
              <p className="marketing-section-lead">
                Explore a fully set-up workspace and watch continuous accrual, reserve planning and
                one True Balance in action — without signing up.
              </p>
              <p className="marketing-section-lead muted">
                Prefer the explanation first?{' '}
                <Link to={METHOD_PAGE_PATH}>Read the True Balance Method</Link>.
              </p>
            </div>

            <div className="demo-scenarios-grid">
              {DEMO_SCENARIOS.map((scenario) => (
                <article key={scenario.id} className="demo-scenario-card">
                  <p className="demo-scenario-type">{scenario.businessType}</p>
                  <h2>{scenario.title}</h2>
                  <p className="demo-scenario-subtitle">{scenario.subtitle}</p>
                  <p className="demo-scenario-history muted">{scenario.historyLabel}</p>
                  <p>{scenario.description}</p>
                  <ul className="demo-scenario-highlights">
                    {scenario.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <Link
                    to={`/demo/${scenario.id}`}
                    className="btn-primary btn-large demo-scenario-cta"
                  >
                    Explore this demo
                  </Link>
                </article>
              ))}
            </div>

            <div className="demo-scenarios-footer">
              <Link to="/signup" className="btn-secondary btn-large">
                Follow the Method in your business
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
