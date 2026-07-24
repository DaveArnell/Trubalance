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

export function PricingSection({ hideIntro = false }: { hideIntro?: boolean }) {
  return (
    <section id="pricing" className="marketing-pricing-section marketing-pricing-section--pop marketing-surface--mist">
      <div className="marketing-section-inner">
        {!hideIntro && (
          <div className="marketing-section-head">
            <p className="marketing-how-eyebrow">Pricing</p>
            <h2>{PRICING_HEADLINE}</h2>
            <p className="marketing-section-lead marketing-section-lead--home">{PRICING_SUBHEADLINE}</p>
          </div>
        )}

        <p className="marketing-annual-note">{ANNUAL_SAVINGS_COPY}</p>

        <div className="marketing-pricing-grid">
          {TIER_ORDER.map((tierId) => {
            const plan = SUBSCRIPTION_TIERS[tierId]
            const PlanHeading = hideIntro ? 'h2' : 'h3'
            return (
              <article key={tierId} className="marketing-price-card">
                <PlanHeading>{plan.name}</PlanHeading>
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

        <p className="marketing-pricing-footnote">{PRICING_FOOTNOTE}</p>
      </div>
    </section>
  )
}
