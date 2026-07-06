import { Link } from 'react-router-dom'
import {
  ANNUAL_SAVINGS_COPY,
  PRICING_FOOTNOTE,
  PRICING_HEADLINE,
  PRICING_SUBHEADLINE,
  SUBSCRIPTION_TIERS,
  TIER_ORDER,
  formatPriceGbp,
} from '../../config/subscriptionTiers'
import { FOUNDER_PROGRAM_FOOTNOTE, FOUNDER_PROGRAM_HEADLINE } from '../../config/founderProgram'

export function PricingSection() {
  return (
        <section id="pricing" className="marketing-pricing-section marketing-pricing-section--pop">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Pricing</p>
          <h2>{PRICING_HEADLINE}</h2>
          <p className="marketing-section-lead">{PRICING_SUBHEADLINE}</p>
        </div>

        <div className="marketing-trial-banner">
          <strong>{FOUNDER_PROGRAM_HEADLINE}</strong>
          <span>
            Full access to every feature · No payment details required · {FOUNDER_PROGRAM_FOOTNOTE}
          </span>
        </div>

        <p className="marketing-annual-note">{ANNUAL_SAVINGS_COPY}</p>

        <div className="marketing-pricing-grid">
          {TIER_ORDER.map((tierId) => {
            const plan = SUBSCRIPTION_TIERS[tierId]
            return (
              <article key={tierId} className="marketing-price-card">
                <h3>{plan.name}</h3>
                <p className="marketing-price">
                  <span className="marketing-price-amount">
                    {formatPriceGbp(plan.priceMonthlyGbp)}
                  </span>
                  <span className="marketing-price-period">/ month</span>
                </p>
                <p className="marketing-price-contract muted">Rolling monthly · cancel anytime</p>
                <p className="marketing-price-annual">
                  {formatPriceGbp(plan.priceAnnualGbp)}/year
                  <span className="muted"> · paid upfront</span>
                </p>
                <p className="marketing-price-desc">{plan.perfectFor}</p>
                <ul className="marketing-price-features">
                  {plan.marketingFeatures.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link to="/signup" className="btn-primary">
                  Start free trial
                </Link>
              </article>
            )
          })}
        </div>

        <p className="marketing-pricing-footnote muted">{PRICING_FOOTNOTE}</p>
      </div>
    </section>
  )
}
