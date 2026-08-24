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
import {
  HomeHeroClutterVisual,
  HomeMessyPaper,
  HomeOrganisedBoard,
} from '../components/marketing/HomeStoryVisuals'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import {
  HOME_BANK,
  HOME_BENEFITS,
  HOME_CTA,
  HOME_EXPLAIN,
  HOME_HERO,
  HOME_MESSY,
  HOME_ORDER,
  HOME_SITS,
  HOME_SNAPSHOT,
  HOME_WHO,
} from '../content/homePage'
import { isSupabaseConfigured } from '../lib/supabase'
import { HOME_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { homePageJsonLd, MarketingJsonLd } from '../components/marketing/MarketingJsonLd'

/**
 * Homepage: messy business money, then one organised Cash Prophet Balance.
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
        <section className="marketing-hero marketing-hero--rank marketing-surface--hero">
          <div className="marketing-hero-rank-inner">
            <div className="marketing-hero-rank-copy">
              <div className="marketing-hero-brand">
                <CashProphetLogo variant="hero" onDark />
              </div>
              <p className="marketing-hero-tagline">{HOME_HERO.slogan}</p>
              <h1>
                {HOME_HERO.headlineStart}{' '}
                <span className="marketing-hero-highlight">{HOME_HERO.headlineHighlight}</span>
              </h1>
              <p className="marketing-lead">{HOME_HERO.lead}</p>
              <ul className="home-hero-beats">
                {HOME_HERO.beats.map((beat) => (
                  <li key={beat}>{beat}</li>
                ))}
              </ul>
              <div className="marketing-cta-row marketing-cta-row--hero">
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
            <div className="marketing-hero-rank-visual">
              <HomeHeroClutterVisual />
            </div>
          </div>
        </section>

        <section className="home-band home-band--paper" aria-labelledby="messy-heading">
          <div className="marketing-section-inner marketing-section-inner--home home-story-split">
            <div className="home-split-copy home-split-copy--center-copy">
              <h2 id="messy-heading">{HOME_MESSY.heading}</h2>
              <p className="home-split-lead">{HOME_MESSY.lead}</p>
            </div>
            <HomeMessyPaper />
          </div>
        </section>

        <section
          className="home-band home-band--mist"
          id="see-cash-prophet"
          aria-labelledby="order-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home home-band-stack">
            <div className="home-band-head home-band-head--center">
              <h2 id="order-heading">{HOME_ORDER.heading}</h2>
              <p className="home-split-lead">{HOME_ORDER.lead}</p>
            </div>
            <HomeOrganisedBoard />
            <HomeHeroVideo embedded />
          </div>
        </section>

        <section
          className="home-band home-band--paper"
          id="what-it-does"
          aria-labelledby="explain-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home home-band-stack">
            <div className="home-band-head home-band-head--center">
              <h2 id="explain-heading">{HOME_EXPLAIN.heading}</h2>
              <p className="home-split-lead">{HOME_EXPLAIN.lead}</p>
              <p className="home-split-prose">{HOME_EXPLAIN.body}</p>
            </div>
            <ul className="home-layers">
              {HOME_EXPLAIN.layers.map((layer) => (
                <li key={layer.title} className="home-layer">
                  <h3>{layer.title}</h3>
                  <p>{layer.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="home-band home-band--wash"
          id="why-bank-balance"
          aria-labelledby="bank-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home home-story-split home-story-split--graphs">
            <div className="home-split-copy">
              <h2 id="bank-heading">{HOME_BANK.heading}</h2>
              <p className="home-split-lead">{HOME_BANK.lead}</p>
            </div>
            <HeroBalanceGraphs />
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

        <section className="home-band home-band--paper" aria-labelledby="benefits-heading">
          <div className="marketing-section-inner marketing-section-inner--home home-band-stack">
            <div className="home-band-head home-band-head--center">
              <h2 id="benefits-heading">{HOME_BENEFITS.heading}</h2>
            </div>
            <ul className="home-benefit-grid">
              {HOME_BENEFITS.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="home-band home-band--mist" aria-labelledby="who-heading">
          <div className="marketing-section-inner marketing-section-inner--home home-band-stack">
            <div className="home-band-head home-band-head--center">
              <h2 id="who-heading">{HOME_WHO.heading}</h2>
              <p className="home-split-lead">{HOME_WHO.lead}</p>
            </div>
            <p className="home-who-label">{HOME_WHO.examplesLabel}</p>
            <ul className="home-who-examples">
              {HOME_WHO.examples.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="home-who-more">
              <CanonicalLink to="/cafes">{HOME_WHO.cafeNote}</CanonicalLink>
              {' · '}
              <CanonicalLink to="/who-its-for">{HOME_WHO.more}</CanonicalLink>
            </p>
          </div>
        </section>

        <section className="home-band home-band--paper" aria-labelledby="sits-heading">
          <div className="marketing-section-inner marketing-section-inner--home home-band-stack">
            <div className="home-band-head home-band-head--center">
              <h2 id="sits-heading">{HOME_SITS.heading}</h2>
              <p className="home-split-lead">{HOME_SITS.lead}</p>
              <p className="home-sits-slogan">{HOME_SITS.slogan}</p>
            </div>
            <ul className="home-sits-grid">
              {HOME_SITS.not.map((item) => (
                <li key={item.title} className="home-sits-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
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
