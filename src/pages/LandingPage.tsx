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

const STATS = [
  { value: '1', label: 'True Balance', accent: 'indigo' },
  { value: '3 mo', label: 'Free trial', accent: 'teal' },
  { value: '5 min', label: 'Setup', accent: 'violet' },
] as const

const PILLARS = [
  {
    accent: 'indigo',
    title: 'Know what\u2019s spoken for',
    body: 'Monthly costs accrue daily. See what\u2019s committed — and what\u2019s genuinely yours.',
  },
  {
    accent: 'violet',
    title: 'Plan irregular bills',
    body: 'VAT, tax, renewals — Reserve Planner works out how much to put aside each month, kept separate so those bills are covered when they\u2019re due.',
  },
] as const

const FEATURES = [
  { icon: '◈', title: 'True Balance', body: 'Cash − committed + expected in.', accent: 'indigo' },
  { icon: '▤', title: 'Accruing costs', body: 'Rent, payroll, subs — tracked daily.', accent: 'orange' },
  { icon: '◷', title: 'Reserve Planner', body: 'How much to set aside monthly for irregular bills.', accent: 'violet' },
  { icon: '↗', title: 'Trends', body: 'History every time you update.', accent: 'teal' },
  { icon: '◎', title: 'Multi-site', body: 'Venues roll up to group totals.', accent: 'pink' },
  { icon: '⇢', title: 'Cash outlook', body: '30–90 day forward view.', accent: 'blue' },
] as const

const STEPS = [
  { step: '01', title: 'Set up', body: 'Business, accounts, sites — guided in minutes.' },
  { step: '02', title: 'Add costs', body: 'Monthly and irregular bills. We calculate.' },
  { step: '03', title: 'Stay current', body: 'Update balances. Mark paid. Done.' },
] as const

const TESTIMONIALS = [
  { quote: '£18k was already spoken for. I had no idea until True Balance showed me.', name: 'James', role: 'Café owner' },
  { quote: 'VAT and corp tax finally feel predictable. I just follow the monthly transfer.', name: 'Sarah', role: 'Trades' },
  { quote: 'Three sites, one dashboard. Exactly what we needed.', name: 'Priya', role: 'Leisure group' },
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
              <p className="marketing-eyebrow marketing-eyebrow--vivid">For SME owners</p>
              <h1>
                Know what&apos;s <span className="marketing-gradient-text">really</span> yours.
              </h1>
              <p className="marketing-lead marketing-lead--pop">
                The web dashboard that sits alongside your bank — one honest number, not bookkeeping software.
              </p>
              <div className="marketing-cta-row">
                <Link to="/signup" className="btn-primary btn-large marketing-cta-primary marketing-cta-primary--pop">
                  Start free — 3 months
                </Link>
                <Link to="/see-how-it-works" className="btn-secondary btn-large marketing-cta-secondary--pop">
                  Live demo
                </Link>
              </div>
              <p className="marketing-hero-note muted">No card required · Full access from day one</p>
              {!isSupabaseConfigured && (
                <p className="marketing-config-hint">
                  <Link to="/app">Try locally</Link> or add Supabase to <code>.env.local</code> for cloud signup.
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
              <h2>Two shifts that change cash management</h2>
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
              <h2>Stay ahead of cash</h2>
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
              <h2>Three steps. That&apos;s it.</h2>
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
          </div>
        </section>

        <section id="product-video" className="marketing-demo-band">
          <div className="marketing-demo-band-inner">
            <h2>Try a live demo workspace</h2>
            <p>Leisure group, café, or trades — months of history, no signup.</p>
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
            <h2>Start free for 3 months</h2>
            <p>No payment details. Full access.</p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <Link to="/signup" className="btn-primary btn-large marketing-cta-btn-on-dark">
                Get started
              </Link>
              <Link to="/login" className="btn-ghost btn-large marketing-cta-ghost">
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
