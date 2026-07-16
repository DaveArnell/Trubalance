import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
  scrollToMarketingSection,
} from '../components/marketing/MarketingLayout'
import { MethodEquation } from '../components/marketing/MethodEquation'
import { HeroBalanceGraphs } from '../components/marketing/HeroBalanceGraphs'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import {
  HOME_BANK_GAP,
  HOME_CTA,
  HOME_DIFFERENT_QUESTIONS,
  HOME_EXPLORE,
  HOME_HERO,
  HOME_HOW_IT_WORKS,
  HOME_IS_THIS_YOU,
  HOME_METHOD_PILLARS,
  HOME_WHO_FOR,
} from '../content/homePage'
import { METHOD_PAGE_PATH } from '../content/trueBalanceMethod'
import { isSupabaseConfigured } from '../lib/supabase'
import { FOUNDER_PROGRAM_HEADLINE } from '../config/founderProgram'
import { HOME_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { homePageJsonLd, MarketingJsonLd } from '../components/marketing/MarketingJsonLd'

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
        {/* 1. Hero — bold headline + the bank-balance-vs-True-Balance visual */}
        <section className="marketing-hero marketing-hero--rank">
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
                  to={METHOD_PAGE_PATH}
                  className="btn-primary btn-large marketing-cta-primary marketing-cta-primary--rank"
                >
                  Learn the Method
                </Link>
                <Link
                  to="/see-how-it-works"
                  className="btn-secondary btn-large marketing-cta-secondary--rank"
                >
                  See the Platform
                </Link>
              </div>
              <p className="marketing-hero-rank-note">
                One number you can trust · Built for owner-managed UK businesses
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

        {/* 1b. Is this you? — identify the visitor before anything else */}
        <section className="marketing-is-you-section" id="is-this-you" aria-labelledby="is-you-heading">
          <div className="marketing-section-inner">
            <div className="marketing-is-you marketing-is-you--band">
              <h2 className="marketing-is-you-title" id="is-you-heading">
                {HOME_IS_THIS_YOU.title}
              </h2>
              <ul className="marketing-is-you-list">
                {HOME_IS_THIS_YOU.points.map((point) => (
                  <li key={point}>
                    <span className="marketing-is-you-tick" aria-hidden>
                      ✓
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <p className="marketing-is-you-close">{HOME_IS_THIS_YOU.close}</p>
            </div>
          </div>
        </section>

        {/* 2. Why bank balance isn't enough */}
        <section
          className="marketing-bank-gap"
          id="why-bank-balance"
          aria-labelledby="bank-gap-heading"
        >
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <h2 id="bank-gap-heading">{HOME_BANK_GAP.heading}</h2>
            </div>
            <div className="marketing-bank-gap-grid">
              {HOME_BANK_GAP.points.map((item) => (
                <article key={item.title} className="marketing-bank-gap-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <p className="marketing-bank-gap-close">{HOME_BANK_GAP.close}</p>
          </div>
        </section>

        {/* 3. Introduce the Method — two pillars */}
        <section
          className="marketing-pillars-section marketing-pillars-section--outcome"
          id="method"
          aria-labelledby="method-pillars-heading"
        >
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">
                {HOME_METHOD_PILLARS.eyebrow}
              </p>
              <h2 id="method-pillars-heading">{HOME_METHOD_PILLARS.heading}</h2>
              <p className="marketing-section-lead">{HOME_METHOD_PILLARS.lead}</p>
            </div>
            <div className="marketing-outcome-pillars">
              {HOME_METHOD_PILLARS.pillars.map((pillar, index) => (
                <article key={pillar.id} className="marketing-outcome-pillar">
                  <p className="marketing-outcome-pillar-num" aria-hidden>
                    {index + 1}
                  </p>
                  <h3>{pillar.title}</h3>
                  <p className="marketing-outcome-pillar-lead">{pillar.lead}</p>
                  <p>{pillar.body}</p>
                  {'note' in pillar && pillar.note ? (
                    <p className="marketing-outcome-pillar-note">{pillar.note}</p>
                  ) : null}
                </article>
              ))}
            </div>
            <p className="marketing-method-more">
              <Link to={METHOD_PAGE_PATH}>Full Method guide →</Link>
            </p>
          </div>
        </section>

        {/* 4. Who it's for */}
        <section
          className="marketing-who-home"
          id="who"
          aria-labelledby="who-home-heading"
        >
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <h2 id="who-home-heading">{HOME_WHO_FOR.heading}</h2>
              <p className="marketing-section-lead">{HOME_WHO_FOR.lead}</p>
            </div>
            <ul className="marketing-who-home-grid">
              {HOME_WHO_FOR.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="marketing-method-more">
              <Link to="/who-its-for">See who it’s for in more detail →</Link>
            </p>
          </div>
        </section>

        {/* 5. How it works — equation + steps */}
        <section
          className="marketing-how-home"
          id="how-it-works"
          aria-labelledby="how-home-heading"
        >
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">
                {HOME_HOW_IT_WORKS.eyebrow}
              </p>
              <h2 id="how-home-heading">{HOME_HOW_IT_WORKS.heading}</h2>
              <p className="marketing-section-lead">{HOME_HOW_IT_WORKS.lead}</p>
            </div>

            <div className="marketing-method-equation-wrap">
              <MethodEquation variant="home" />
            </div>

            <ol className="marketing-how-steps">
              {HOME_HOW_IT_WORKS.steps.map((step, index) => (
                <li key={step.title} className="marketing-how-step">
                  <span className="marketing-how-step-num" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Different questions */}
        <section
          className="marketing-different-questions"
          aria-labelledby="different-q-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--narrow">
            <div className="marketing-section-head marketing-section-head--center">
              <h2 id="different-q-heading">{HOME_DIFFERENT_QUESTIONS.heading}</h2>
              <p className="marketing-section-lead">{HOME_DIFFERENT_QUESTIONS.lead}</p>
            </div>
            <div className="marketing-different-grid">
              {HOME_DIFFERENT_QUESTIONS.items.map((item) => (
                <article key={item.title} className="marketing-different-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Explore */}
        <section className="marketing-home-overview" id="overview" aria-labelledby="explore-heading">
          <div className="marketing-section-inner">
            <div className="marketing-section-head marketing-section-head--center">
              <p className="marketing-eyebrow marketing-eyebrow--vivid">Next steps</p>
              <h2 id="explore-heading">Go deeper when you’re ready</h2>
            </div>
            <div className="marketing-home-topic-grid">
              {HOME_EXPLORE.map((topic) => (
                <article key={topic.to} className="marketing-home-topic-card">
                  <h3>{topic.title}</h3>
                  <p>{topic.body}</p>
                  <Link to={topic.to} className="marketing-home-topic-link">
                    {topic.cta} →
                  </Link>
                </article>
              ))}
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
                a clearer answer: can I afford this, how much is already spoken for, and will VAT
                catch me out again? The True Balance Method is that clarity. The app simply makes it
                easy to follow every day.
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
            <h2>{HOME_CTA.heading}</h2>
            <p>
              {HOME_CTA.body}
              {` ${FOUNDER_PROGRAM_HEADLINE} details are on signup.`}
            </p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <Link to={METHOD_PAGE_PATH} className="btn-primary btn-large marketing-cta-btn-on-dark">
                Learn the Method
              </Link>
              <Link to="/see-how-it-works" className="btn-ghost btn-large marketing-cta-ghost">
                See the Platform
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
