import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { FreeCashPositionCheck } from '../components/marketing/FreeCashPositionCheck'
import { MarketingJsonLd, tryItPageJsonLd } from '../components/marketing/MarketingJsonLd'
import { TRY_IT_PAGE } from '../content/tryItPage'
import { TRY_IT_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function TryItPage() {
  usePageMeta(TRY_IT_SEO)
  return (
    <MarketingShell>
      <MarketingJsonLd data={tryItPageJsonLd()} />
      <MarketingHeader />
      <main className="marketing-main try-it-page">
        <header className="method-edu-hero marketing-surface--hero try-it-hero">
          <div className="method-edu-inner try-it-hero-inner">
            <p className="marketing-eyebrow">{TRY_IT_PAGE.freeBadge}</p>
            <h1>{TRY_IT_PAGE.title}</h1>
            <p className="method-edu-hero-lead">{TRY_IT_PAGE.lead}</p>
          </div>
        </header>

        <section className="try-it-body marketing-surface--mist">
          <div className="marketing-section-inner try-it-layout">
            <FreeCashPositionCheck />
          </div>
        </section>

        <section className="try-it-explain home-band home-band--paper" aria-labelledby="try-it-explain">
          <div className="marketing-section-inner try-it-explain-inner">
            <h2 id="try-it-explain">{TRY_IT_PAGE.explain.heading}</h2>
            <p className="try-it-explain-intro">{TRY_IT_PAGE.explain.intro}</p>
            <ul className="try-it-explain-points">
              {TRY_IT_PAGE.explain.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="try-it-explain-close">{TRY_IT_PAGE.explain.closing}</p>
          </div>
        </section>

        <section className="marketing-cta-band marketing-cta-band--pop home-cta-band">
          <div className="marketing-cta-band-inner">
            <h2>{TRY_IT_PAGE.cta.heading}</h2>
            <p>{TRY_IT_PAGE.cta.body}</p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <CanonicalLink to="/signup" className="btn-primary btn-large marketing-cta-btn-on-dark">
                {TRY_IT_PAGE.cta.primary}
              </CanonicalLink>
              <CanonicalLink
                to="/contact?topic=onboarding"
                className="btn-ghost btn-large marketing-cta-ghost"
              >
                {TRY_IT_PAGE.cta.secondary}
              </CanonicalLink>
              <CanonicalLink to="/how-it-works" className="btn-ghost btn-large marketing-cta-ghost">
                {TRY_IT_PAGE.cta.tertiary}
              </CanonicalLink>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
