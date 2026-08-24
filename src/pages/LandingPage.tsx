import { useEffect, useMemo } from 'react'
import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
  scrollToMarketingSection,
} from '../components/marketing/MarketingLayout'
import { CashProphetLogo } from '../components/marketing/CashProphetLogo'
import { HeroBalanceGraphs } from '../components/marketing/HeroBalanceGraphs'
import { HomeHeroVideo } from '../components/marketing/HomeHeroVideo'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import { HOME_BANK, HOME_CTA, HOME_HERO, HOME_SNAPSHOT } from '../content/homePage'
import { isSupabaseConfigured } from '../lib/supabase'
import { HOME_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { homePageJsonLd, MarketingJsonLd } from '../components/marketing/MarketingJsonLd'

/**
 * Homepage: recognisable problem, the dashboard, then why the bank misleads.
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
        <section className="marketing-hero marketing-hero--rank marketing-hero--home-story marketing-surface--hero">
          <div className="home-hero-story">
            <div className="home-hero-story-copy">
              <div className="marketing-hero-brand">
                <CashProphetLogo variant="hero" onDark />
              </div>
              <h1>
                {HOME_HERO.headlineStart}{' '}
                <span className="marketing-hero-highlight">{HOME_HERO.headlineHighlight}</span>
              </h1>
              <p className="marketing-hero-category">{HOME_HERO.category}</p>
              <div className="marketing-lead marketing-lead--stack">
                {HOME_HERO.subheading.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="marketing-cta-row marketing-cta-row--hero marketing-cta-row--center">
                <CanonicalLink
                  to="/try-it"
                  className="btn-primary btn-large marketing-cta-primary marketing-cta-primary--rank"
                >
                  {HOME_HERO.primaryCta}
                </CanonicalLink>
                <CanonicalLink
                  to="/signup"
                  className="btn-secondary btn-large marketing-cta-secondary--rank"
                >
                  {HOME_HERO.secondaryCta}
                </CanonicalLink>
              </div>
              <p className="home-hero-meta">
                {HOME_HERO.noCard}{' '}
                <CanonicalLink to="/contact?topic=onboarding">{HOME_HERO.onboarding}</CanonicalLink>
              </p>
              {!isSupabaseConfigured && (
                <p className="marketing-config-hint">
                  Cloud signup needs Supabase in <code>.env.local</code>, or{' '}
                  <CanonicalLink to="/app">try the app locally</CanonicalLink> without an account.
                </p>
              )}
            </div>
            <div className="home-hero-story-dash" id="see-cash-prophet">
              <HomeHeroVideo embedded />
            </div>
          </div>
        </section>

        <section
          className="home-band home-band--paper"
          id="why-bank-balance"
          aria-labelledby="bank-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home home-band-stack">
            <div className="home-band-head home-band-head--center">
              <h2 id="bank-heading">{HOME_BANK.heading}</h2>
              <p className="home-split-lead">{HOME_BANK.lead}</p>
            </div>
            <div className="home-bank-graphs">
              <HeroBalanceGraphs />
            </div>
          </div>
        </section>

        <section
          className="home-band home-band--snapshot"
          id="try-snapshot"
          aria-labelledby="snapshot-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home cafe-section--center home-snapshot-panel">
            <h2 id="snapshot-heading">{HOME_SNAPSHOT.heading}</h2>
            <p className="home-split-lead">{HOME_SNAPSHOT.lead}</p>
            <ul className="home-snapshot-points">
              {HOME_SNAPSHOT.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <CanonicalLink to="/try-it" className="btn-primary btn-large">
              {HOME_SNAPSHOT.cta}
            </CanonicalLink>
          </div>
        </section>

        <section className="marketing-company-band home-band--legal" aria-label="Company information">
          <div className="marketing-section-inner marketing-section-inner--home">
            <CompanyLegalNotice variant="inline" />
          </div>
        </section>

        <section className="marketing-cta-band marketing-cta-band--pop home-cta-band">
          <div className="marketing-cta-band-inner">
            <h2>{HOME_CTA.heading}</h2>
            <p>{HOME_CTA.body}</p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <CanonicalLink to="/try-it" className="btn-primary btn-large marketing-cta-btn-on-dark">
                {HOME_CTA.primary}
              </CanonicalLink>
              <CanonicalLink to="/signup" className="btn-ghost btn-large marketing-cta-ghost">
                {HOME_CTA.secondary}
              </CanonicalLink>
              <CanonicalLink
                to="/contact?topic=onboarding"
                className="btn-ghost btn-large marketing-cta-ghost"
              >
                {HOME_CTA.onboarding}
              </CanonicalLink>
            </div>
            <p className="home-cta-footnote">{HOME_CTA.footnote}</p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
