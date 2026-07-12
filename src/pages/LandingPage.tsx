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
import { MethodHomeSections } from '../components/marketing/MethodHomeSections'
import { PricingSection } from '../components/marketing/PricingSection'
import { METHOD_PAGE_PATH } from '../content/trueBalanceMethod'
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
  'Know exactly what your business can safely afford to spend.',
  'Automatically build virtual reserves for VAT, tax and irregular bills.',
  'Make financial decisions with confidence — not from your bank balance alone.',
] as const

const HERO_CALLOUT = {
  emphasis: 'Just keep your bank balance up to date.',
  rest: 'True Balance does the hard work.',
} as const

const PILLARS = [
  {
    accent: 'indigo',
    title: 'Committed money, accounted for automatically',
    body: 'Payroll, VAT, corporation tax and recurring costs build up before payment day. True Balance keeps them in the picture so your available cash always reflects reality.',
  },
  {
    accent: 'violet',
    title: 'Reserves for the bills that catch people out',
    body: 'Irregular and quarterly costs are planned ahead and set aside steadily — so you are not scrambling when a deadline arrives.',
  },
] as const

const FEATURES = [
  {
    icon: '◈',
    title: 'See what is genuinely yours',
    body: 'A live view of your real financial position — after committed money and expected receipts are taken into account.',
    accent: 'indigo',
  },
  {
    icon: '▤',
    title: 'Spend with confidence',
    body: 'Know what the business can afford before you commit — instead of guessing from a bank balance that hides what is already spoken for.',
    accent: 'orange',
  },
  {
    icon: '◷',
    title: 'Stay ahead of tax and larger bills',
    body: 'Virtual reserves build quietly in the background for VAT, tax and irregular costs — so you always know the money is there when you need it.',
    accent: 'violet',
  },
] as const

const STEPS = [
  {
    step: '01',
    title: 'Set up your business',
    body: 'Add your business and accounts. Start simple — you can add more detail whenever you are ready.',
  },
  {
    step: '02',
    title: 'Keep your bank balance current',
    body: 'That is the main thing you need to do day to day. True Balance handles the rest.',
  },
  {
    step: '03',
    title: 'Make decisions with confidence',
    body: 'See your True Balance — what is genuinely available once committed money and reserves are accounted for.',
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
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Financial management for business owners</p>
              <Link to={METHOD_PAGE_PATH} className="marketing-method-badge">
                Built around the True Balance Method
              </Link>
              <h1>Your bank balance is not your available cash.</h1>
              <p className="marketing-lead">
                True Balance gives you a clearer picture of your business&apos;s real financial position
                — accounting for money that is already committed, building up or expected. The
                simplest way to follow the True Balance Method.
              </p>
              <p className="marketing-hero-callout" role="note">
                <strong>{HERO_CALLOUT.emphasis}</strong> {HERO_CALLOUT.rest}
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
              Not accounting software. Not bookkeeping. Not forecasting.
            </p>
            <p className="marketing-position-detail">
              The True Balance Method — a financial management approach that helps you make better
              decisions with confidence, because money you have already committed is automatically
              accounted for.
            </p>
          </div>
        </section>

        <LandingAppPreview />

        <MethodHomeSections />

        <section id="what-it-does" className="marketing-pillars-section marketing-pillars-section--pop">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Core idea</p>
              <h2>Confidence in every financial decision</h2>
              <p className="marketing-section-lead">
                Your accounting software records what happened. True Balance shows what you can safely
                do next — because committed money is already part of the picture.
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
              <h2>Understand your finances. Decide with confidence.</h2>
              <p className="marketing-section-lead">
                Everything is designed around one outcome: knowing what your business can safely
                afford — and feeling sure you are making the right call.
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
              When you first log in, a guided setup walks you through your business, balances and
              commitments on the dashboard. Replay page tours anytime from the <strong>?</strong> icons.
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
                relied on a spreadsheet to answer the questions that mattered: what is committed, what
                is genuinely available, and what we can safely afford. True Balance is that clarity —
                rebuilt as simple, reassuring software.
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
            <h2>Ready to understand your finances with confidence?</h2>
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
