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
import { MethodReservePlannerVisual } from '../components/marketing/MethodReservePlannerVisual'
import { MarketingFaqSection } from '../components/marketing/MarketingFaqSection'
import { MarketingJsonLd, sectorLandingPageJsonLd } from '../components/marketing/MarketingJsonLd'
import { isSupabaseConfigured } from '../lib/supabase'
import { usePageMeta } from '../hooks/usePageMeta'
import {
  SECTOR_LANDINGS,
  type SectorId,
} from '../content/sectorLandingPages'

/**
 * Homepage-style sector landing — financial management software for a hospitality/leisure niche.
 */
export function SectorLandingPage({ sectorId }: { sectorId: SectorId }) {
  const content = SECTOR_LANDINGS[sectorId]
  usePageMeta(content.seo)
  const jsonLd = useMemo(
    () => sectorLandingPageJsonLd(content.seo, content.faqs, content.breadcrumbName),
    [content],
  )

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const timer = window.setTimeout(() => scrollToMarketingSection(hash), 80)
    return () => window.clearTimeout(timer)
  }, [sectorId])

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
                  <p className="home-hero-eyebrow">{content.hero.eyebrow}</p>
                  <h1>
                    {content.hero.headlineStart}{' '}
                    <span className="marketing-hero-highlight marketing-hero-highlight--line">
                      {content.hero.headlineHighlight}
                    </span>
                  </h1>
                  <p className="marketing-lead">{content.hero.lead}</p>
                  <div className="home-hero-compare-actions">
                    <div className="home-hero-early-primary">
                      <CanonicalLink
                        to="/early-access"
                        className="btn-primary btn-large home-hero-cta-btn marketing-cta-primary marketing-cta-primary--rank"
                      >
                        {content.hero.primaryCta}
                      </CanonicalLink>
                      <p className="home-hero-cta-support">{content.hero.primaryCtaSupport}</p>
                    </div>
                    <p className="home-hero-snapshot-link">
                      <CanonicalLink to="/try-it">{content.hero.tryItCta} →</CanonicalLink>
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

        <section
          className="home-band home-band--mist"
          id="sector-problem"
          aria-labelledby="sector-problem-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="home-band-head">
              <h2 id="sector-problem-heading">{content.problem.heading}</h2>
              <p className="home-picture-lead">{content.problem.lead}</p>
            </div>
            <ul className="marketing-clarity-questions who-for-questions" aria-label="Familiar search problems">
              {content.problem.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="who-for-familiar-close">{content.problem.close}</p>
          </div>
        </section>

        <HomeFinancialPicture content={content.picture} />

        <section
          className="home-band home-band--paper"
          id="reserve-planner"
          aria-labelledby="sector-reserve-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="home-band-head">
              <h2 id="sector-reserve-heading">{content.reserve.heading}</h2>
              {content.reserve.lead.map((paragraph) => (
                <p key={paragraph} className="home-picture-lead">
                  {paragraph}
                </p>
              ))}
            </div>
            <MethodReservePlannerVisual />
            <ul className="how-it-works-compact-points" aria-label="How the Reserve Planner helps">
              {content.reserve.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <HomeFitsSection content={content.fits} />
        <HomeCheckInSection content={content.checkin} />

        <MarketingFaqSection
          heading="Common questions"
          lead="Short answers about Cash Prophet for this kind of business."
          items={content.faqs}
        />

        <HomeEarlyAccessCta
          content={content.earlyAccess}
          headingId={`sector-${sectorId}-early-access-heading`}
        />

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
