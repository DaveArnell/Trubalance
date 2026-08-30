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
import { HomeFinancialPicture } from '../components/marketing/HomeFinancialPicture'
import {
  HomeCheckInSection,
  HomeEarlyAccessCta,
  HomeFitsSection,
} from '../components/marketing/HomePositioningSections'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import { HOME_HERO } from '../content/homePage'
import { isSupabaseConfigured } from '../lib/supabase'
import { HOME_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { homePageJsonLd, MarketingJsonLd } from '../components/marketing/MarketingJsonLd'

/**
 * Homepage — Early Access financial organiser for hospitality & leisure.
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
                  <p className="home-hero-eyebrow">{HOME_HERO.eyebrow}</p>
                  <h1>
                    {HOME_HERO.headlineStart}{' '}
                    <span className="marketing-hero-highlight marketing-hero-highlight--line">
                      {HOME_HERO.headlineHighlight}
                    </span>
                  </h1>
                  <p className="marketing-lead">{HOME_HERO.lead}</p>
                  <div className="home-hero-compare-actions">
                    <div className="home-hero-early-primary">
                      <CanonicalLink
                        to="/early-access"
                        className="btn-primary btn-large home-hero-cta-btn marketing-cta-primary marketing-cta-primary--rank"
                      >
                        {HOME_HERO.primaryCta}
                      </CanonicalLink>
                      <p className="home-hero-cta-support">{HOME_HERO.primaryCtaSupport}</p>
                    </div>
                    <p className="home-hero-snapshot-link">
                      <CanonicalLink to="/try-it">{HOME_HERO.tryItCta} →</CanonicalLink>
                    </p>
                    {!isSupabaseConfigured && (
                      <p className="marketing-config-hint">
                        Cloud signup needs Supabase in <code>.env.local</code>, or{' '}
                        <CanonicalLink to="/app">try the app locally</CanonicalLink> without an
                        account.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <HomeHeroCompare />
            </div>
          </div>
        </section>

        <HomeFinancialPicture />
        <HomeFitsSection />
        <HomeCheckInSection />
        <HomeEarlyAccessCta />

        <section className="marketing-company-band home-band--legal" aria-label="Company information">
          <div className="marketing-section-inner marketing-section-inner--home">
            <CompanyLegalNotice variant="inline" />
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
