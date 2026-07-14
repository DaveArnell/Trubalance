import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { DEMO_SCENARIOS } from '../data/demoScenarios'
import { METHOD_CUSTOMER_JOURNEY, METHOD_PAGE_PATH } from '../content/trueBalanceMethod'
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
              <p className="marketing-eyebrow">How it works</p>
              <h1>Learn a simple financial routine</h1>
              <p className="marketing-section-lead">
                The True Balance Method is not a long software course. Connect the business, keep two
                habits, and let the app run the maths.
              </p>
              <p className="marketing-section-lead muted">
                Want the full explanation first?{' '}
                <Link to={METHOD_PAGE_PATH}>Read the True Balance Method</Link>.
              </p>
            </div>

            <ol className="marketing-journey-list">
              {METHOD_CUSTOMER_JOURNEY.map((item) => (
                <li key={item.step} className="marketing-journey-item">
                  <span className="marketing-journey-step">{item.step}</span>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="demo-scenarios-footer demo-scenarios-footer--mid">
              <Link to="/signup" className="btn-primary btn-large">
                Follow the Method in your business
              </Link>
            </div>
          </div>
        </section>

        <section className="demo-scenarios-section">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center demo-scenarios-head">
              <p className="marketing-eyebrow">Try it live</p>
              <h2>See the Method in a sample business</h2>
              <p className="marketing-section-lead">
                Explore a fully set-up workspace — continuous accrual, Reserve Planner and one True
                Balance — without signing up.
              </p>
            </div>

            <div className="demo-scenarios-grid">
              {DEMO_SCENARIOS.map((scenario) => (
                <article key={scenario.id} className="demo-scenario-card">
                  <p className="demo-scenario-type">{scenario.businessType}</p>
                  <h3>{scenario.title}</h3>
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
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
