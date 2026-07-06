import { useEffect } from 'react'
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
import { MarketingProductShowcase } from '../components/marketing/MarketingProductShowcase'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import { PricingSection } from '../components/marketing/PricingSection'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  FOUNDER_PROGRAM_BODY,
  FOUNDER_PROGRAM_FOOTNOTE,
  FOUNDER_PROGRAM_HEADLINE,
} from '../config/founderProgram'

const HERO_BENEFITS = [
  'One honest number for what you can spend.',
  'Stay ahead of VAT, tax and large bills.',
  'Built for owners who run the numbers themselves.',
] as const

const STATS = [
  { value: '1', label: 'True Balance', accent: 'indigo' },
  { value: '50', label: 'Lifetime free spots', accent: 'teal' },
  { value: '5 min', label: 'Setup', accent: 'violet' },
] as const

const PILLARS = [
  {
    accent: 'indigo',
    title: 'Know what\u2019s spoken for',
    body: 'Monthly costs accrue every day. True Balance shows what\u2019s committed and what\u2019s genuinely yours to use.',
  },
  {
    accent: 'violet',
    title: 'Plan irregular bills',
    body: 'VAT, tax and renewals go in Reserve Planner. It tells you how much to set aside each month before the bill lands.',
  },
] as const

const FEATURES = [
  {
    icon: '◈',
    title: 'True Balance overview',
    body: 'Real available cash across every account, minus commitments, plus expected receipts.',
    accent: 'indigo',
  },
  {
    icon: '▤',
    title: 'Committed Funds',
    body: 'Monthly costs, due items and receipts in one view, scoped to group, business or venue.',
    accent: 'orange',
  },
  {
    icon: '◷',
    title: 'Reserve Planner',
    body: 'Model irregular bills month by month and track whether reserves are building on target.',
    accent: 'violet',
  },
  {
    icon: '↗',
    title: 'Trends & forecast',
    body: 'Balance history with forward projection so you spot problems before they become crises.',
    accent: 'teal',
  },
  {
    icon: '◎',
    title: 'Multi-venue structure',
    body: 'Groups, businesses and venues with roll-up totals in one picture.',
    accent: 'pink',
  },
  {
    icon: '?',
    title: 'Guided setup',
    body: 'Interactive tours walk new users through structure, balances, and commitments in minutes.',
    accent: 'blue',
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

const TESTIMONIALS = [
  {
    quote: '£18k was already spoken for. I had no idea until True Balance showed me.',
    name: 'James',
    role: 'Café owner',
  },
  {
    quote: 'VAT and corp tax finally feel predictable. I just follow the monthly transfer.',
    name: 'Sarah',
    role: 'Trades',
  },
  {
    quote: 'Three sites, one dashboard. Exactly what we needed.',
    name: 'Priya',
    role: 'Leisure group',
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

      <main className="marketing-main marketing-main--pop">
        <section className="marketing-hero marketing-hero--pop">
          <div className="marketing-hero-blob marketing-hero-blob--1" aria-hidden />
          <div className="marketing-hero-blob marketing-hero-blob--2" aria-hidden />
          <div className="marketing-hero-blob marketing-hero-blob--3" aria-hidden />
          <div className="marketing-hero-inner marketing-hero-inner--pop">
            <div className="marketing-hero-copy">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">For small and medium business owners</p>
              <h1>One finance platform for business owners.</h1>
              <p className="marketing-lead">
                See what cash is really yours. Plan for tax and big bills. Stop managing from the bank balance alone.
              </p>
              <ul className="marketing-hero-benefits">
                {HERO_BENEFITS.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <p className="marketing-founder-callout" role="note">
                <strong>{FOUNDER_PROGRAM_HEADLINE}</strong> — {FOUNDER_PROGRAM_BODY}
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
              Not accounting software. A cash clarity tool for owners.
            </p>
            <p className="marketing-position-detail">
              One place to see what is spoken for, what is due, and what you can actually spend.
            </p>
          </div>
        </section>

        <section className="marketing-stats-band marketing-stats-band--pop" aria-label="Key facts">
          <div className="marketing-stats-band-inner">
            {STATS.map((stat) => (
              <div key={stat.label} className={`marketing-stat-card marketing-stat-card--${stat.accent}`}>
                <p className="marketing-stat-value">{stat.value}</p>
                <p className="marketing-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <MarketingProductShowcase />

        <section id="what-it-does" className="marketing-pillars-section marketing-pillars-section--pop">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Core idea</p>
              <h2>Two shifts that change how you manage cash</h2>
              <p className="marketing-section-lead">
                Most owners look at the bank and guess. True Balance separates what is spoken for
                from what you can use, and helps you plan for bills that do not land every month.
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
              <h2>Everything you need to stay ahead of cash</h2>
              <p className="marketing-section-lead">
                Built for small and medium businesses who need one honest number: what is really yours,
                not a bank balance that still belongs to suppliers, tax or the next payment.
              </p>
            </div>
            <div className="marketing-feature-grid marketing-feature-grid--pop">
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

        <section className="marketing-testimonials marketing-testimonials--pop" aria-label="What owners say">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center marketing-section-head--on-dark">
              <p className="marketing-eyebrow marketing-eyebrow--light-on-dark">Real businesses</p>
              <h2>Owners who stopped guessing</h2>
            </div>
            <div className="marketing-testimonials-grid">
              {TESTIMONIALS.map((item) => (
                <blockquote key={item.name} className="marketing-testimonial-card marketing-testimonial-card--pop">
                  <p>&ldquo;{item.quote}&rdquo;</p>
                  <footer>
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                  </footer>
                </blockquote>
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
              Explore a fully set-up example (leisure group, café or trades) with months of history. Navigate
              every page with no signup required.
            </p>
            <Link to="/see-how-it-works" className="btn-primary btn-large">
              Open demo
            </Link>
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
            <p>{FOUNDER_PROGRAM_HEADLINE}. Help us improve True Balance — no payment details required.</p>
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
