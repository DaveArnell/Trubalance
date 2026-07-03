import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
  scrollToMarketingSection,
} from '../components/marketing/MarketingLayout'
import { HeroBalanceVisual } from '../components/marketing/HeroBalanceVisual'
import { PricingSection } from '../components/marketing/PricingSection'
import { isSupabaseConfigured } from '../lib/supabase'

const HERO_BENEFITS = [
  'Know what you can actually afford.',
  'Stay ahead of VAT, tax and large bills.',
  'Build better financial habits.',
  'Understand where your business is really heading.',
] as const

const FEATURES = [
  {
    icon: '◈',
    title: 'True Balance overview',
    body: 'See real available cash across every account — minus what is already committed, plus expected receipts.',
  },
  {
    icon: '▤',
    title: 'Committed Funds',
    body: 'Monthly costs, due items, and receipts in one spreadsheet-style view — scoped to group, business, or venue.',
  },
  {
    icon: '◷',
    title: 'Reserve Planner',
    body: 'Model irregular bills month by month and track whether reserves are building on target.',
  },
  {
    icon: '↗',
    title: 'Trends & forecast',
    body: 'Balance history with forward projection so you spot problems before they become crises.',
  },
  {
    icon: '◎',
    title: 'Multi-venue structure',
    body: 'Groups, businesses, and venues with roll-up totals — one picture for the whole operation.',
  },
  {
    icon: '?',
    title: 'Guided setup',
    body: 'Interactive tours walk new users through structure, balances, and commitments in minutes.',
  },
] as const

const STEPS = [
  {
    step: '01',
    title: 'Set up your business',
    body: 'Add your business and accounts. Keep it simple — you can add sites and detail later.',
  },
  {
    step: '02',
    title: 'Enter your balances',
    body: 'Tell True Balance what is in the bank today. That is the starting point for everything else.',
  },
  {
    step: '03',
    title: 'See your True Balance',
    body: 'Add regular costs and big bills. The dashboard shows what is genuinely available — not just the bank balance.',
  },
] as const

export function LandingPage() {
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const timer = window.setTimeout(() => scrollToMarketingSection(hash), 80)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="marketing-main">
        <section className="marketing-hero">
          <div className="marketing-hero-glow" aria-hidden />
          <div className="marketing-hero-inner">
            <div className="marketing-hero-copy">
              <h1>Stop managing your business from your bank balance.</h1>
              <p className="marketing-lead">
                True Balance is the simple cash flow management system that helps business owners
                understand what money is actually available, build better financial habits, and avoid
                getting caught out by the bills that matter most.
              </p>
              <ul className="marketing-hero-benefits">
                {HERO_BENEFITS.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <div className="marketing-cta-row">
                <Link to="/signup" className="btn-primary btn-large marketing-cta-primary">
                  Start your free 3-month trial
                </Link>
                <a href="#product-video" className="btn-secondary btn-large">
                  See how it works
                </a>
              </div>
              <p className="marketing-hero-note muted">
                Full access · No payment details required · No charge until day 91
              </p>
              {!isSupabaseConfigured && (
                <p className="marketing-config-hint">
                  Cloud signup needs Supabase in <code>.env.local</code> — or{' '}
                  <Link to="/app">try the app locally</Link> without an account.
                </p>
              )}
            </div>

            <div className="marketing-hero-visual">
              <HeroBalanceVisual />
            </div>
          </div>
        </section>

        <section className="marketing-position-band" aria-label="What True Balance is">
          <div className="marketing-position-band-inner">
            <p className="marketing-position-statement">
              True Balance doesn&apos;t try to replace your accounting software.
            </p>
            <p className="marketing-position-detail">
              It gives business owners a simple financial management system that helps them understand
              where they really stand.
            </p>
          </div>
        </section>

        <section id="product-video" className="marketing-video-section">
          <div className="marketing-section-inner">
            <div className="marketing-section-head">
              <p className="marketing-eyebrow">What it does</p>
              <h2>See True Balance in action</h2>
              <p className="marketing-section-lead">
                A short walkthrough of how operators use True Balance day to day. Setup guide coming soon.
              </p>
            </div>
            <div className="marketing-video-frame">
              <div className="marketing-video-placeholder">
                <button type="button" className="marketing-video-play" aria-label="Play product video">
                  <span aria-hidden>▶</span>
                </button>
                <p>Product video coming soon</p>
                <span className="muted">Replace with your embed URL when ready</span>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="marketing-features-section">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow">Features</p>
              <h2>Everything you need to stay ahead of cash</h2>
              <p className="marketing-section-lead">
                Built for small and medium businesses who need one honest number — what is really yours,
                not a bank balance that still belongs to suppliers, tax, or the next payment in the cycle.
              </p>
            </div>
            <div className="marketing-feature-grid">
              {FEATURES.map((feature) => (
                <article key={feature.title} className="marketing-feature-card">
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

        <section id="how-it-works" className="marketing-how-section">
          <div className="marketing-section-inner">
            <div className="marketing-section-head">
              <p className="marketing-eyebrow">How it works</p>
              <h2>Up and running in three steps</h2>
            </div>
            <ol className="marketing-steps-grid">
              {STEPS.map((step) => (
                <li key={step.step} className="marketing-step-card">
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

        <PricingSection />

        <section className="marketing-cta-band">
          <div className="marketing-cta-band-inner">
            <h2>Ready to see what is actually yours?</h2>
            <p>Start your free 3-month trial. No payment details required.</p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <Link to="/signup" className="btn-primary btn-large">
                Start your free 3-month trial
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
