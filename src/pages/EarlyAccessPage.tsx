import { useMemo } from 'react'
import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { MarketingJsonLd } from '../components/marketing/MarketingJsonLd'
import {
  EARLY_ACCESS_PAGE,
  PERSONAL_SETUP_CONTACT_PATH,
} from '../content/earlyAccessPage'
import { EARLY_ACCESS_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

/**
 * Early Access gateway — personal setup recommended, self-serve secondary.
 */
export function EarlyAccessPage() {
  usePageMeta(EARLY_ACCESS_SEO)
  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: EARLY_ACCESS_SEO.title,
      description: EARLY_ACCESS_SEO.description,
      url: 'https://www.cashprophet.co.uk/early-access',
    }),
    [],
  )

  return (
    <MarketingShell>
      <MarketingJsonLd data={jsonLd} />
      <MarketingHeader />

      <main className="marketing-main marketing-main--home marketing-main--home-vivid">
        <section
          className="home-band home-band--paper early-access-page"
          aria-labelledby="early-access-heading"
        >
          <div className="early-access-shell">
            <div className="early-access-intro">
              <h1 id="early-access-heading">{EARLY_ACCESS_PAGE.heading}</h1>
              {EARLY_ACCESS_PAGE.intro.split('\n\n').map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <article className="early-access-card early-access-card--primary">
              <p className="early-access-badge">{EARLY_ACCESS_PAGE.recommended.label}</p>
              <h2>{EARLY_ACCESS_PAGE.recommended.heading}</h2>
              <p>{EARLY_ACCESS_PAGE.recommended.body}</p>
              <CanonicalLink
                to={PERSONAL_SETUP_CONTACT_PATH}
                className="btn-primary btn-large early-access-primary-btn"
              >
                {EARLY_ACCESS_PAGE.recommended.cta}
              </CanonicalLink>
              <p className="early-access-card-support">{EARLY_ACCESS_PAGE.recommended.support}</p>
            </article>

            <aside className="early-access-secondary">
              <h2>{EARLY_ACCESS_PAGE.selfServe.heading}</h2>
              <p>{EARLY_ACCESS_PAGE.selfServe.body}</p>
              <CanonicalLink to="/signup" className="early-access-secondary-link">
                {EARLY_ACCESS_PAGE.selfServe.cta} →
              </CanonicalLink>
            </aside>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
