import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { METHOD_CUSTOMER_JOURNEY, METHOD_PAGE_PATH } from '../content/trueBalanceMethod'
import { HOW_IT_WORKS_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function HowItWorksPage() {
  usePageMeta(HOW_IT_WORKS_SEO)
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
                The True Balance Method is not a long software course. Connect the business, keep light
                daily logging, follow the monthly Reserve Planner — and let the app run the maths.
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

            <div className="demo-scenarios-footer">
              <Link to="/signup" className="btn-primary btn-large">
                Follow the Method in your business
              </Link>
              <Link to="/see-how-it-works" className="btn-secondary btn-large">
                Try a live demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
