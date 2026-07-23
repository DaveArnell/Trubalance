import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
  scrollToMarketingSection,
} from '../components/marketing/MarketingLayout'
import { HeroBalanceGraphs } from '../components/marketing/HeroBalanceGraphs'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import {
  HOME_CTA,
  HOME_FOUNDER,
  HOME_HERO,
  HOME_RELIEF,
  HOME_STRESS,
  HOME_WHO_FOR,
  HOME_WHY_IT_WORKS,
} from '../content/homePage'
import { isSupabaseConfigured } from '../lib/supabase'
import { HOME_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { homePageJsonLd, MarketingJsonLd } from '../components/marketing/MarketingJsonLd'

/**
 * Homepage — recognition and invitation.
 * Deep methodology lives on How it works; persuasion depth on Why Cash Prophet.
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

      <main className="marketing-main marketing-main--home">
        <section className="marketing-hero marketing-hero--rank marketing-surface--hero">
          <div className="marketing-hero-rank-inner">
            <div className="marketing-hero-rank-copy">
              <p className="marketing-hero-rank-eyebrow">{HOME_HERO.eyebrow}</p>
              <h1>
                {HOME_HERO.headlineStart}{' '}
                <span className="marketing-hero-highlight">{HOME_HERO.headlineHighlight}</span>
              </h1>
              <p className="marketing-lead">{HOME_HERO.subheading}</p>
              <div className="marketing-cta-row">
                <Link
                  to="/signup"
                  className="btn-primary btn-large marketing-cta-primary marketing-cta-primary--rank"
                >
                  Get started
                </Link>
                <Link
                  to="/see-how-it-works"
                  className="btn-secondary btn-large marketing-cta-secondary--rank"
                >
                  See how it feels
                </Link>
              </div>
              <p className="marketing-hero-rank-note">
                Less stress · More confidence · One number you can trust
              </p>
              {!isSupabaseConfigured && (
                <p className="marketing-config-hint">
                  Cloud signup needs Supabase in <code>.env.local</code>, or{' '}
                  <Link to="/app">try the app locally</Link> without an account.
                </p>
              )}
            </div>
            <div className="marketing-hero-rank-visual">
              <HeroBalanceGraphs />
            </div>
          </div>
        </section>

        <section
          className="marketing-who-home marketing-surface--paper"
          id="who"
          aria-labelledby="who-home-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <h2 id="who-home-heading">{HOME_WHO_FOR.heading}</h2>
              <div className="marketing-section-lead marketing-section-lead--home marketing-section-lead--stack">
                {HOME_WHO_FOR.lead.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            <ul className="marketing-who-home-grid">
              {HOME_WHO_FOR.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="marketing-bank-gap marketing-surface--panel"
          id="why-it-stresses"
          aria-labelledby="stress-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">{HOME_STRESS.eyebrow}</p>
              <h2 id="stress-heading">{HOME_STRESS.heading}</h2>
              <p className="marketing-section-lead marketing-section-lead--home">{HOME_STRESS.lead}</p>
            </div>
            <div className="marketing-bank-gap-rows">
              {HOME_STRESS.points.map((item) => (
                <div key={item.title} className="marketing-bank-gap-row">
                  <h3>{item.title}</h3>
                  <div className="marketing-bank-gap-row-body">
                    {item.body.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="marketing-bank-gap marketing-surface--mist"
          id="the-relief"
          aria-labelledby="relief-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">{HOME_RELIEF.eyebrow}</p>
              <h2 id="relief-heading">{HOME_RELIEF.heading}</h2>
            </div>
            <div className="marketing-bank-gap-rows">
              {HOME_RELIEF.points.map((item) => (
                <div key={item.title} className="marketing-bank-gap-row">
                  <h3>{item.title}</h3>
                  <div className="marketing-bank-gap-row-body">
                    {item.body.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="marketing-different-questions marketing-surface--paper"
          id="why-it-works"
          aria-labelledby="why-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <h2 id="why-heading">{HOME_WHY_IT_WORKS.heading}</h2>
              <div className="marketing-section-lead marketing-section-lead--home marketing-section-lead--stack">
                {HOME_WHY_IT_WORKS.lead.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="marketing-different-grid">
              {HOME_WHY_IT_WORKS.items.map((item) => (
                <article key={item.title} className="marketing-different-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="marketing-company-band marketing-surface--ink-soft"
          aria-label="Why Cash Prophet exists"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">{HOME_FOUNDER.eyebrow}</p>
              <h2>{HOME_FOUNDER.heading}</h2>
              <div className="marketing-section-lead marketing-section-lead--home marketing-section-lead--stack">
                {HOME_FOUNDER.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-company-band marketing-surface--paper" aria-label="Company information">
          <div className="marketing-section-inner">
            <CompanyLegalNotice variant="inline" />
          </div>
        </section>

        <section className="marketing-cta-band marketing-cta-band--pop">
          <div className="marketing-cta-band-inner">
            <h2>{HOME_CTA.heading}</h2>
            <p>{HOME_CTA.body}</p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <Link to="/signup" className="btn-primary btn-large marketing-cta-btn-on-dark">
                Get started
              </Link>
              <Link to="/see-how-it-works" className="btn-ghost btn-large marketing-cta-ghost">
                See how it feels
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
