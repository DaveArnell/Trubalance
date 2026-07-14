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
  'Continuous accrual — monthly costs build every day, not only on payday.',
  'Reserve planning — VAT, tax and irregular bills stop becoming surprises.',
  'One decision number — spend from your True Balance, not the bank app alone.',
] as const

const HERO_CALLOUT = {
  emphasis: 'Do not manage your business from your bank balance.',
  rest: 'Manage it from your True Balance.',
} as const

const PILLARS = [
  {
    accent: 'indigo',
    title: 'Continuous accrual',
    body: 'Payroll, rent, utilities and subscriptions build every day. The Method keeps tomorrow’s obligations in today’s position — so the bank balance stops swinging wildly through the month.',
  },
  {
    accent: 'violet',
    title: 'Reserve planning',
    body: 'VAT, corporation tax, insurance and other irregular bills are spread ahead of time. Small amounts reserved steadily — instead of one large scramble on payment day.',
  },
] as const

const FEATURES = [
  {
    icon: '◈',
    title: 'One Decision Number',
    body: 'Your True Balance is the continuously updated figure for spending decisions — after accruals, reserves and realistic receipts.',
    accent: 'indigo',
  },
  {
    icon: '▤',
    title: 'Continuous Accrual in practice',
    body: 'Monthly costs accrue every day automatically. You stop pretending payday is the first time those costs exist.',
    accent: 'orange',
  },
  {
    icon: '◷',
    title: 'Reserve Planning in practice',
    body: 'Irregular bills become manageable set-asides. VAT and tax stop catching the business out every quarter.',
    accent: 'violet',
  },
] as const

const STEPS = [
  {
    step: '01',
    title: 'Set up the Method once',
    body: 'Add accounts, monthly commitments and reserves for irregular bills. Start simple — detail can grow with you.',
  },
  {
    step: '02',
    title: 'Keep a light routine',
    body: 'Refresh balances, mark payments paid, adjust when something changes. Everything else updates in the background.',
  },
  {
    step: '03',
    title: 'Decide from your True Balance',
    body: 'Use one stable number for purchases, hires and quiet months — not a bank balance that hides money already spoken for.',
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
              <p className="marketing-eyebrow marketing-eyebrow--vivid">The True Balance Method</p>
              <Link to={METHOD_PAGE_PATH} className="marketing-method-badge">
                Learn the Method →
              </Link>
              <h1>Your bank balance is not your available cash.</h1>
              <p className="marketing-lead">
                The True Balance Method is a simple financial management system: recognise commitments
                as they build, reserve for irregular bills, and decide from one number you can trust.
                True Balance software is the easiest way to follow it every day.
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
              A financial management method first — continuous accrual, reserve planning, and one
              decision number. The software automates the calculations so the Method stays current
              without a spreadsheet.
            </p>
          </div>
        </section>

        <LandingAppPreview />

        <MethodHomeSections />

        <section id="what-it-does" className="marketing-pillars-section marketing-pillars-section--pop">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Core idea</p>
              <h2>How the Method removes the swings</h2>
              <p className="marketing-section-lead">
                Accounting software records what happened. The True Balance Method shows what you can
                safely do next — because money already spoken for is part of today’s picture.
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
              <p className="marketing-eyebrow marketing-eyebrow--vivid">How the software follows the Method</p>
              <h2>The Method in practice</h2>
              <p className="marketing-section-lead">
                True Balance automates the three principles — so you get continuous financial clarity
                without rebuilding the maths yourself.
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
              <h2>Follow the Method in three steps</h2>
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
            <h2>See the Method in a live business</h2>
            <p>
              Explore Summit Leisure, Cornerstone Coffee, or Riverside Building — fully set up so you
              can see accruals, reserves and True Balance in action. No signup.
            </p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <Link to="/see-how-it-works" className="btn-primary btn-large">
                Open demo
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
                genuinely available. The True Balance Method is that system. The software keeps it
                current without the spreadsheet.
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
            <h2>Ready to try the True Balance Method?</h2>
            <p>
              {FOUNDER_PROGRAM_HEADLINE}. Start following the Method in software — help shape it
              before public launch.
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
