import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
  scrollToMarketingSection,
} from '../components/marketing/MarketingLayout'
import { HeroBalanceGraphs } from '../components/marketing/HeroBalanceGraphs'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import {
  HOME_CTA,
  HOME_DOES,
  HOME_FOUNDER,
  HOME_HERO,
  HOME_NEED,
  HOME_OUTCOME,
  HOME_WHY_IT_WORKS,
} from '../content/homePage'
import { isSupabaseConfigured } from '../lib/supabase'
import { HOME_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { homePageJsonLd, MarketingJsonLd } from '../components/marketing/MarketingJsonLd'

/**
 * Homepage — Available Balance you can trust; mechanics support the promise.
 */
export function LandingPage() {
  usePageMeta(HOME_SEO)
  const jsonLd = useMemo(() => homePageJsonLd(), [])
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const timer = window.setTimeout(() => scrollToMarketingSection(hash), 80)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <MarketingShell>
      <MarketingJsonLd data={jsonLd} />
      <MarketingHeader />

      <main className="marketing-main marketing-main--home">
        <section className="marketing-hero marketing-hero--rank marketing-surface--hero">
          <div className="marketing-hero-rank-inner">
            <div className="marketing-hero-rank-copy">
              <p className="marketing-hero-rank-eyebrow">{HOME_HERO.eyebrow}</p>
              <h1>
                {HOME_HERO.headlineStart}{' '}
                <span className="marketing-hero-highlight">{HOME_HERO.headlineHighlight}</span>
              </h1>
              <div className="marketing-lead marketing-lead--stack">
                {HOME_HERO.subheading.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="marketing-cta-row">
                <Link
                  to="/signup"
                  className="btn-primary btn-large marketing-cta-primary marketing-cta-primary--rank"
                >
                  {HOME_HERO.primaryCta}
                </Link>
                <Link
                  to="/how-it-works"
                  className="btn-secondary btn-large marketing-cta-secondary--rank"
                >
                  {HOME_HERO.secondaryCta}
                </Link>
              </div>
              {!isSupabaseConfigured && (
                <p className="marketing-config-hint">
                  Cloud signup needs Supabase in <code>.env.local</code>, or{' '}
                  <Link to="/app">try the app locally</Link> without an account.
                </p>
              )}
            </div>
            <div className="marketing-hero-rank-visual">
              <HeroBalanceGraphs />
            </div>
          </div>
        </section>

        <section
          className="marketing-bank-gap marketing-surface--panel"
          id="why-bank-balance"
          aria-labelledby="need-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <h2 id="need-heading">{HOME_NEED.heading}</h2>
              <p className="marketing-section-lead marketing-section-lead--home">{HOME_NEED.lead}</p>
              <div className="marketing-section-lead marketing-section-lead--home marketing-section-lead--prose">
                {HOME_NEED.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="marketing-bank-gap marketing-surface--mist"
          id="what-it-does"
          aria-labelledby="does-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <h2 id="does-heading">{HOME_DOES.heading}</h2>
              <div className="marketing-section-lead marketing-section-lead--home marketing-section-lead--prose">
                {HOME_DOES.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="marketing-bank-gap marketing-surface--paper"
          id="what-changes"
          aria-labelledby="outcome-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <h2 id="outcome-heading">{HOME_OUTCOME.heading}</h2>
              <p className="marketing-section-lead marketing-section-lead--home">{HOME_OUTCOME.lead}</p>
              <div className="marketing-section-lead marketing-section-lead--home marketing-section-lead--prose">
                {HOME_OUTCOME.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="marketing-different-questions marketing-surface--panel"
          id="why-it-works"
          aria-labelledby="why-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <h2 id="why-heading">{HOME_WHY_IT_WORKS.heading}</h2>
              <div className="marketing-section-lead marketing-section-lead--home marketing-section-lead--prose">
                {HOME_WHY_IT_WORKS.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="marketing-company-band marketing-surface--ink-soft"
          aria-label="Why Cash Prophet exists"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">{HOME_FOUNDER.eyebrow}</p>
              <h2>{HOME_FOUNDER.heading}</h2>
              <div className="marketing-section-lead marketing-section-lead--home marketing-section-lead--prose">
                {HOME_FOUNDER.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-company-band marketing-surface--paper" aria-label="Company information">
          <div className="marketing-section-inner">
            <CompanyLegalNotice variant="inline" />
          </div>
        </section>

        <section className="marketing-cta-band marketing-cta-band--pop">
          <div className="marketing-cta-band-inner">
            <h2>{HOME_CTA.heading}</h2>
            <p>{HOME_CTA.body}</p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <Link to="/signup" className="btn-primary btn-large marketing-cta-btn-on-dark">
                {HOME_HERO.primaryCta}
              </Link>
              <Link to="/how-it-works" className="btn-ghost btn-large marketing-cta-ghost">
                {HOME_HERO.secondaryCta}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
