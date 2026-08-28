import { useEffect, useMemo } from 'react'
import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
  scrollToMarketingSection,
} from '../components/marketing/MarketingLayout'
import { HomeHeroCompare } from '../components/marketing/HomeHeroCompare'
import { CashProphetLogo } from '../components/marketing/CashProphetLogo'
import { HomeHeroVideo } from '../components/marketing/HomeHeroVideo'
import {
  HomeAvailablePanel,
  HomeCompareStrip,
  HomeOutcomeBeats,
} from '../components/marketing/HomeMarketingVisuals'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import {
  HOME_CTA,
  HOME_BANK_TO_PROPHET,
  HOME_HERO,
  HOME_ONBOARDING,
  HOME_OUTCOME,
  HOME_WHY_IT_WORKS,
} from '../content/homePage'
import { isSupabaseConfigured } from '../lib/supabase'
import { HOME_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { homePageJsonLd, MarketingJsonLd } from '../components/marketing/MarketingJsonLd'

/**
 * Homepage — Brand & Product Foundation; Cash Prophet Balance as the trusted number.
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

      <main className="marketing-main marketing-main--home marketing-main--home-vivid">
        <section className="marketing-hero marketing-hero--rank marketing-hero--compare marketing-surface--hero">
          <div className="home-hero-split-layout">
            <div className="home-hero-split">
              <div className="home-hero-split-copy">
                <div className="home-hero-column-logo">
                  <CashProphetLogo variant="hero" onDark />
                </div>
                <div className="home-hero-split-copy-body">
                  <h1>
                    {HOME_HERO.headlineStart}{' '}
                    <span className="marketing-hero-highlight marketing-hero-highlight--line">
                      {HOME_HERO.headlineHighlight}
                    </span>
                  </h1>
                  <p className="marketing-lead">{HOME_HERO.lead}</p>
                  <div className="home-hero-compare-actions">
                    <div className="home-hero-compare-cta-pair">
                      <CanonicalLink
                        to="/signup"
                        className="btn-primary btn-large home-hero-cta-btn marketing-cta-primary marketing-cta-primary--rank"
                      >
                        {HOME_HERO.primaryCta}
                      </CanonicalLink>
                      <CanonicalLink
                        to="/try-it"
                        className="btn-secondary btn-large home-hero-cta-btn marketing-cta-secondary--rank"
                      >
                        {HOME_HERO.tryItCta}
                      </CanonicalLink>
                    </div>
                    <p className="home-hero-early-access-note">
                      Early access · {HOME_HERO.earlyAccessLine}
                    </p>
                    {!isSupabaseConfigured && (
                      <p className="marketing-config-hint">
                        Cloud signup needs Supabase in <code>.env.local</code>, or{' '}
                        <CanonicalLink to="/app">try the app locally</CanonicalLink> without an account.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <HomeHeroCompare />
            </div>
          </div>
        </section>

        <HomeHeroVideo />

        {/* Bank balance problem + Cash Prophet solution — one band */}
        <section
          className="home-band home-band--paper"
          id="why-bank-balance"
          aria-labelledby="bank-to-prophet-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home home-split">
            <div className="home-split-copy">
              <h2 id="bank-to-prophet-heading">{HOME_BANK_TO_PROPHET.heading}</h2>
              <p className="home-split-lead">{HOME_BANK_TO_PROPHET.lead}</p>
              {HOME_BANK_TO_PROPHET.body.map((paragraph) => (
                <p key={paragraph} className="home-split-prose">
                  {paragraph}
                </p>
              ))}
            </div>
            <HomeAvailablePanel />
          </div>
        </section>

        <section
          className="home-band home-band--paper"
          id="what-changes"
          aria-labelledby="outcome-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home home-band-stack">
            <div className="home-band-head home-band-head--center">
              <h2 id="outcome-heading">{HOME_OUTCOME.heading}</h2>
            </div>
            <HomeOutcomeBeats beats={HOME_OUTCOME.beats} closing={HOME_OUTCOME.closing} />
          </div>
        </section>

        <section
          className="home-band home-band--mist"
          id="why-it-works"
          aria-labelledby="why-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home home-band-stack">
            <div className="home-band-head home-band-head--center">
              <h2 id="why-heading">{HOME_WHY_IT_WORKS.heading}</h2>
            </div>
            <HomeCompareStrip />
            <p className="home-split-prose home-why-close">{HOME_WHY_IT_WORKS.close}</p>
          </div>
        </section>

        <section className="marketing-company-band home-band--legal" aria-label="Company information">
          <div className="marketing-section-inner marketing-section-inner--home">
            <CompanyLegalNotice variant="inline" />
          </div>
        </section>

        <section className="home-band home-band--paper" aria-labelledby="onboarding-heading">
          <div className="marketing-section-inner marketing-section-inner--home home-onboarding-band">
            <h2 id="onboarding-heading">{HOME_ONBOARDING.heading}</h2>
            <p className="home-split-lead">{HOME_ONBOARDING.body}</p>
            <CanonicalLink to="/contact?topic=onboarding" className="btn-secondary">
              {HOME_ONBOARDING.cta}
            </CanonicalLink>
          </div>
        </section>

        <section className="marketing-cta-band marketing-cta-band--pop home-cta-band">
          <div className="marketing-cta-band-inner">
            <h2>{HOME_CTA.heading}</h2>
            <p>{HOME_CTA.body}</p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <CanonicalLink to="/signup" className="btn-primary btn-large marketing-cta-btn-on-dark">
                {HOME_HERO.primaryCta}
              </CanonicalLink>
              <CanonicalLink to="/try-it" className="btn-ghost btn-large marketing-cta-ghost">
                {HOME_HERO.tryItCta}
              </CanonicalLink>
              <CanonicalLink
                to="/contact?topic=onboarding"
                className="btn-ghost btn-large marketing-cta-ghost"
              >
                Free onboarding
              </CanonicalLink>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
