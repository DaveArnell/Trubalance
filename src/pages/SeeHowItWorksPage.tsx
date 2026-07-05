import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { DEMO_SCENARIOS } from '../data/demoScenarios'

export function SeeHowItWorksPage() {
  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="marketing-main">
        <section className="demo-scenarios-section demo-scenarios-section--landing">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center demo-scenarios-head">
              <p className="marketing-eyebrow">Try demo</p>
              <h1>Pick an example business</h1>
              <p className="marketing-section-lead">
                Explore a fully set-up workspace with realistic figures — navigate every page and
                switch between business types.
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
                Start your free 3-month trial
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
