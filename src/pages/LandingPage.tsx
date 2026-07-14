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
import {
  METHOD_CUSTOMER_JOURNEY,
  METHOD_PAGE_PATH,
} from '../content/trueBalanceMethod'
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
  'Check one number each day — your True Balance.',
  'Fund VAT, tax and irregular bills through the Reserve Planner.',
  'Decide with confidence — not from the bank app alone.',
] as const

const HERO_CALLOUT = {
  emphasis: 'Do not manage your business from your bank balance.',
  rest: 'Manage it from your True Balance.',
} as const

const SOFTWARE_FEATURES = [
  {
    icon: '◈',
    title: 'One True Balance',
    body: 'A continuously updated figure for spending decisions — after accruals, the Reserve Planner and realistic receipts.',
    accent: 'indigo',
  },
  {
    icon: '▤',
    title: 'Continuous accrual',
    body: 'Monthly commitments build every day automatically. Payday stops being a surprise.',
    accent: 'orange',
  },
  {
    icon: '◷',
    title: 'Reserve Planner',
    body: 'Annual and irregular bills become a month-by-month funding plan — with an exact transfer to confirm.',
    accent: 'violet',
  },
] as const

const JOURNEY_TEASER = METHOD_CUSTOMER_JOURNEY.slice(0, 3)

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
              <p className="marketing-eyebrow marketing-eyebrow--vivid">
                A financial management system for business owners
              </p>
              <Link to={METHOD_PAGE_PATH} className="marketing-method-badge">
                Full Method guide →
              </Link>
              <h1>Follow the True Balance Method with the True Balance app</h1>
              <p className="marketing-lead">
                Your bank balance only shows where money sits. The True Balance Method shows what is
                genuinely available — then the app keeps that Method current every day.
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
              A financial management system first. Bookkeeping tells you what happened. The True
              Balance Method helps you decide what to do next — and the software automates it.
            </p>
          </div>
        </section>

        <MethodHomeSections />

        <section id="features" className="marketing-features-section marketing-features-section--pop">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">How the software automates the Method</p>
              <h2>The app does the heavy lifting</h2>
              <p className="marketing-section-lead">
                You follow two simple habits. True Balance keeps accruals, the Reserve Planner and your
                decision number current in the background.
              </p>
            </div>
            <div className="marketing-feature-grid marketing-feature-grid--pop marketing-feature-grid--compact">
              {SOFTWARE_FEATURES.map((feature) => (
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

        <LandingAppPreview />

        <section id="how-it-works" className="marketing-how-section marketing-how-section--pop">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">The routine</p>
              <h2>A simple financial routine — not a software course</h2>
              <p className="marketing-section-lead">
                Set up once, then live the Method: daily True Balance checks and a monthly Reserve
                Planner review.
              </p>
            </div>
            <ol className="marketing-steps-grid marketing-steps-grid--pop">
              {JOURNEY_TEASER.map((step) => (
                <li key={step.step} className="marketing-step-card marketing-step-card--pop">
                  <span className="marketing-step-num">{step.step}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="marketing-tour-note">
              Full seven-step journey, then try it in a live demo business.{' '}
              <Link to="/see-how-it-works">See how it works →</Link>
            </p>
          </div>
        </section>

        <section id="product-video" className="marketing-demo-band">
          <div className="marketing-demo-band-inner">
            <h2>See the Method in a live business</h2>
            <p>
              Explore Summit Leisure, Cornerstone Coffee, or Riverside Building — fully set up so you
              can see accruals, the Reserve Planner and True Balance in action. No signup.
            </p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <Link to="/see-how-it-works" className="btn-primary btn-large">
                See how it works
              </Link>
              <Link to={METHOD_PAGE_PATH} className="btn-secondary btn-large">
                Read the Method
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
                For over 17 years I have run businesses and, despite accounting software, still needed
                a clearer answer: what is already committed, what should be reserved, and what is
                genuinely available. The True Balance Method is that system. The app keeps it current
                without the spreadsheet.
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
            <h2>Ready to follow the True Balance Method?</h2>
            <p>
              {FOUNDER_PROGRAM_HEADLINE}. Start in the True Balance app — help shape it before public
              launch.
            </p>
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
