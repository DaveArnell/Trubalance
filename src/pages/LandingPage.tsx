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
import { LandingAppPreview } from '../components/marketing/LandingAppPreview'
import { MarketingBrowserFrame } from '../components/marketing/MarketingBrowserFrame'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import { PricingSection } from '../components/marketing/PricingSection'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  FOUNDER_PROGRAM_BODY,
  FOUNDER_PROGRAM_FOOTNOTE,
  FOUNDER_PROGRAM_HEADLINE,
} from '../config/founderProgram'
import { HOME_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { homePageJsonLd, MarketingJsonLd } from '../components/marketing/MarketingJsonLd'

const HERO_BENEFITS = [
  'Know exactly what your business can safely spend.',
  'Stay ahead of VAT, corporation tax and larger bills.',
  'Stop getting caught out by irregular costs.',
] as const

const PILLARS = [
  {
    accent: 'indigo',
    title: 'Know what is already committed',
    body: 'Payroll, tax and recurring costs build up before payment day. See committed money clearly so your available cash is always grounded in reality.',
  },
  {
    accent: 'violet',
    title: 'Stay ahead of irregular bills',
    body: 'VAT, corporation tax, annual and quarterly bills are planned in advance so you can set money aside steadily, not scramble at the deadline.',
  },
] as const

const FEATURES = [
  {
    icon: '◈',
    title: 'Know what is actually yours',
    body: 'True Balance shows what is genuinely available once committed funds and expected receipts are accounted for.',
    accent: 'indigo',
  },
  {
    icon: '▤',
    title: 'Build financial discipline',
    body: 'Track regular and one off costs as they build so cash decisions are based on what is real, not what the bank balance suggests.',
    accent: 'orange',
  },
  {
    icon: '◷',
    title: 'Manage cash with confidence',
    body: 'Set monthly reserves for tax and larger bills, then look 30 to 90 days ahead with a clearer view of risk.',
    accent: 'violet',
  },
] as const

const STEPS = [
  {
    step: '01',
    title: 'Set up your business',
    body: 'Add your business and accounts. Start simple and add detail later.',
  },
  {
    step: '02',
    title: 'Enter your balances',
    body: 'Tell True Balance what is in the bank today. That is the starting point for everything else.',
  },
  {
    step: '03',
    title: 'See your True Balance',
    body: 'Add regular costs and big bills. The dashboard shows what is genuinely available.',
  },
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
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Business cash management</p>
              <h1>Your bank balance is not your available cash.</h1>
              <p className="marketing-lead">
                True Balance works alongside your accounting software to show what money is genuinely
                available after committed costs, tax and expected receipts are taken into account.
              </p>
              <ul className="marketing-hero-benefits">
                {HERO_BENEFITS.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <p className="marketing-founder-callout" role="note">
                <strong>{FOUNDER_PROGRAM_HEADLINE}</strong>. {FOUNDER_PROGRAM_BODY}
              </p>
              <div className="marketing-cta-row">
                <Link to="/signup" className="btn-primary btn-large marketing-cta-primary marketing-cta-primary--pop">
                  Claim your spot
                </Link>
                <Link to="/see-how-it-works" className="btn-secondary btn-large marketing-cta-secondary--pop">
                  See how it works
                </Link>
              </div>
              <p className="marketing-hero-note muted">
                Full access · No payment details required · {FOUNDER_PROGRAM_FOOTNOTE}
              </p>
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
              Not bookkeeping. Not accounting software.
            </p>
            <p className="marketing-position-detail">
              A cash management system for owners who need to know what the business can really afford.
            </p>
          </div>
        </section>

        <LandingAppPreview />

        <section id="what-it-does" className="marketing-pillars-section marketing-pillars-section--pop">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Core idea</p>
              <h2>Know what your business can really afford</h2>
              <p className="marketing-section-lead">
                Most owners still keep a spreadsheet alongside accounting software for this exact
                reason. True Balance turns that discipline into a clear daily system.
              </p>
            </div>
            <div className="marketing-pillars-grid marketing-pillars-grid--pop">
              {PILLARS.map((pillar) => (
                <article
                  key={pillar.title}
                  className={`marketing-pillar-card marketing-pillar-card--pop marketing-pillar-card--${pillar.accent}`}
                >
                  <h3>{pillar.title}</h3>
                  <p>{pillar.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="marketing-features-section marketing-features-section--pop">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Features</p>
              <h2>Three ways to stay in control of cash</h2>
              <p className="marketing-section-lead">
                Focus on outcomes first: safer spending decisions, fewer surprises, and better
                discipline around the bills that catch businesses out.
              </p>
            </div>
            <div className="marketing-feature-grid marketing-feature-grid--pop marketing-feature-grid--compact">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className={`marketing-feature-card marketing-feature-card--pop marketing-feature-card--${feature.accent}`}
                >
                  <span className="marketing-feature-icon" aria-hidden>
                    {feature.icon}
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="marketing-how-section marketing-how-section--pop">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">How it works</p>
              <h2>Up and running in three steps</h2>
            </div>
            <ol className="marketing-steps-grid marketing-steps-grid--pop">
              {STEPS.map((step) => (
                <li key={step.step} className="marketing-step-card marketing-step-card--pop">
                  <span className="marketing-step-num">{step.step}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="marketing-tour-note">
              When you first log in, a guided setup walks you through your business, balances, and commitments
              right on the dashboard. Replay page tours anytime from the <strong>?</strong> icons.
            </p>
          </div>
        </section>

        <section id="product-video" className="marketing-demo-band">
          <div className="marketing-demo-band-inner">
            <h2>Try a live demo workspace</h2>
            <p>
              Summit Leisure, Cornerstone Coffee, or Riverside Building, fully set up with months
              of history. No signup.
            </p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <Link to="/see-how-it-works" className="btn-primary btn-large">
                Open demo
              </Link>
              <Link to="/blog" className="btn-secondary btn-large">
                Business finance articles
              </Link>
            </div>
          </div>
        </section>

        <section className="marketing-company-band" aria-label="Why True Balance exists">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Why this exists</p>
              <h2>Built from real business experience</h2>
              <p className="marketing-section-lead">
                For over 17 years I have run businesses and, despite using accounting software, I still
                relied on a spreadsheet I built myself to make day to day decisions. It answered the
                questions I actually needed: what is committed, what is genuinely available, and what we
                can safely afford next. True Balance is that system rebuilt as modern software.
              </p>
            </div>
          </div>
        </section>

        <PricingSection />

        <section className="marketing-company-band" aria-label="Company information">
          <div className="marketing-section-inner">
            <CompanyLegalNotice variant="inline" />
          </div>
        </section>

        <section className="marketing-cta-band marketing-cta-band--pop">
          <div className="marketing-cta-band-inner">
            <h2>Ready to see what is actually yours?</h2>
            <p>{FOUNDER_PROGRAM_HEADLINE}. Help shape True Balance before public launch.</p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <Link to="/signup" className="btn-primary btn-large marketing-cta-btn-on-dark">
                Claim your spot
              </Link>
              <Link to="/login" className="btn-ghost btn-large marketing-cta-ghost">
                I already have an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
