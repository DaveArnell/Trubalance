import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
  scrollToMarketingSection,
} from '../components/marketing/MarketingLayout'
import { HeroBalanceEquation } from '../components/marketing/HeroBalanceEquation'
import { HeroBalanceVisual } from '../components/marketing/HeroBalanceVisual'
import { MarketingBrowserFrame } from '../components/marketing/MarketingBrowserFrame'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import { HomeTopicSections } from '../components/marketing/HomeTopicSections'
import { METHOD_PAGE_PATH } from '../content/trueBalanceMethod'
import { isSupabaseConfigured } from '../lib/supabase'
import { FOUNDER_PROGRAM_HEADLINE } from '../config/founderProgram'
import { HOME_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { homePageJsonLd, MarketingJsonLd } from '../components/marketing/MarketingJsonLd'

const HERO_BENEFITS = [
  'See how much of the bank balance is already committed.',
  'See money building for VAT, payroll, suppliers and future bills.',
  'See what is left in the business after that — every day.',
] as const

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

      <main className="marketing-main marketing-main--pop">
        <section className="marketing-hero marketing-hero--pop">
          <div className="marketing-hero-blob marketing-hero-blob--1" aria-hidden />
          <div className="marketing-hero-blob marketing-hero-blob--2" aria-hidden />
          <div className="marketing-hero-blob marketing-hero-blob--3" aria-hidden />
          <div className="marketing-hero-inner marketing-hero-inner--pop">
            <div className="marketing-hero-copy">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">The True Balance Method</p>
              <Link to={METHOD_PAGE_PATH} className="marketing-method-badge">
                Full Method guide →
              </Link>
              <h1>A better way to manage your business finances.</h1>
              <p className="marketing-lead">
                The True Balance Method helps business owners understand what their bank balance is
                actually made up of. Instead of only showing how much is in the bank, it continuously
                separates committed money, future obligations and expected receipts — so you have a
                clearer picture of the business’s real financial position every day.
              </p>
              <ul className="marketing-hero-benefits">
                {HERO_BENEFITS.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <div className="marketing-cta-row">
                <Link to="/signup" className="btn-primary btn-large marketing-cta-primary marketing-cta-primary--pop">
                  Get started
                </Link>
                <Link to="/see-how-it-works" className="btn-secondary btn-large marketing-cta-secondary--pop">
                  Try demo
                </Link>
              </div>
              <p className="marketing-hero-note muted">No payment details required to start.</p>
              {!isSupabaseConfigured && (
                <p className="marketing-config-hint">
                  Cloud signup needs Supabase in <code>.env.local</code>, or{' '}
                  <Link to="/app">try the app locally</Link> without an account.
                </p>
              )}
            </div>

            <div className="marketing-hero-visual marketing-hero-visual--pop">
              <MarketingBrowserFrame>
                <HeroBalanceEquation />
                <HeroBalanceVisual />
              </MarketingBrowserFrame>
            </div>
          </div>
        </section>

        <section className="marketing-position-band marketing-position-band--v2" aria-label="What True Balance is">
          <div className="marketing-position-band-inner">
            <p className="marketing-position-statement">
              Not accounting software. Not bookkeeping. Not forecasting.
            </p>
            <p className="marketing-position-detail">
              A financial management method first — for clarity on what your bank balance means. The
              True Balance app is simply the easiest way to follow that Method every day.
            </p>
          </div>
        </section>

        <HomeTopicSections />

        <section className="marketing-company-band" aria-label="Why True Balance exists">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Why this exists</p>
              <h2>Built from real business experience</h2>
              <p className="marketing-section-lead">
                For over 17 years I have run businesses and, despite accounting software, still needed
                a clearer answer: what is already committed, what belongs to future bills, and what is
                left in the business. The True Balance Method is that clarity. The app keeps it
                current without the spreadsheet.
              </p>
            </div>
          </div>
        </section>

        <section className="marketing-company-band" aria-label="Company information">
          <div className="marketing-section-inner">
            <CompanyLegalNotice variant="inline" />
          </div>
        </section>

        <section className="marketing-cta-band marketing-cta-band--pop">
          <div className="marketing-cta-band-inner">
            <h2>Ready to follow the True Balance Method?</h2>
            <p>
              Start in the True Balance app — the easiest way to keep the Method current every day.
              {` ${FOUNDER_PROGRAM_HEADLINE} details are on signup.`}
            </p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <Link to="/signup" className="btn-primary btn-large marketing-cta-btn-on-dark">
                Get started
              </Link>
              <Link to="/pricing" className="btn-ghost btn-large marketing-cta-ghost">
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
