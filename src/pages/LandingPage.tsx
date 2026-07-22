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
import { METHOD_HOW_ILLUSTRATIONS } from '../components/marketing/MethodHowIllustrations'
import { MarketingAccruingDemo } from '../components/marketing/MarketingAccruingDemo'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import {
  HOME_CTA,
  HOME_EXPLORE,
  HOME_FOUNDER,
  HOME_HERO,
  HOME_HOW_IT_WORKS_SYSTEM,
  HOME_PLATFORM,
  HOME_PROBLEM,
  HOME_RELIEF,
  HOME_STRESS,
  HOME_WHO_FOR,
  HOME_WHY_IT_WORKS,
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

      <main className="marketing-main marketing-main--home">
        {/* Hero — recognition + invitation */}
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

        {/* The hidden problem */}
        <section className="marketing-is-you-section" id="the-problem" aria-labelledby="problem-heading">
          <div className="marketing-section-inner marketing-section-inner--home">
            <h2 className="marketing-is-you-title" id="problem-heading">
              {HOME_PROBLEM.heading}
            </h2>
            <p className="marketing-section-lead marketing-section-lead--home">{HOME_PROBLEM.lead}</p>
            <p className="marketing-is-you-close marketing-problem-body">{HOME_PROBLEM.body}</p>
            <p className="marketing-is-you-close">{HOME_PROBLEM.close}</p>
          </div>
        </section>

        {/* You're not alone */}
        <section className="marketing-who-home" id="who" aria-labelledby="who-home-heading">
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <h2 id="who-home-heading">{HOME_WHO_FOR.heading}</h2>
              <p className="marketing-section-lead marketing-section-lead--home">{HOME_WHO_FOR.lead}</p>
            </div>
            <ul className="marketing-who-home-grid">
              {HOME_WHO_FOR.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Why this creates stress */}
        <section className="marketing-bank-gap" id="why-it-stresses" aria-labelledby="stress-heading">
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
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How Cash Prophet removes that stress */}
        <section className="marketing-bank-gap" id="the-relief" aria-labelledby="relief-heading">
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">{HOME_RELIEF.eyebrow}</p>
              <h2 id="relief-heading">{HOME_RELIEF.heading}</h2>
              <p className="marketing-section-lead marketing-section-lead--home">{HOME_RELIEF.lead}</p>
            </div>
            <div className="marketing-bank-gap-rows">
              {HOME_RELIEF.points.map((item) => (
                <div key={item.title} className="marketing-bank-gap-row">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          className="marketing-pillars-section marketing-pillars-section--outcome"
          id="how-it-works"
          aria-labelledby="how-system-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">{HOME_HOW_IT_WORKS_SYSTEM.eyebrow}</p>
              <h2 id="how-system-heading">{HOME_HOW_IT_WORKS_SYSTEM.heading}</h2>
              <p className="marketing-section-lead marketing-section-lead--home">
                {HOME_HOW_IT_WORKS_SYSTEM.lead}
              </p>
            </div>
            <div className="marketing-outcome-pillars">
              {HOME_HOW_IT_WORKS_SYSTEM.pillars.map((pillar, index) => (
                <article key={pillar.id} className="marketing-outcome-pillar">
                  <p className="marketing-outcome-pillar-num" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3>{pillar.title}</h3>
                  <p className="marketing-outcome-pillar-lead">{pillar.lead}</p>
                  <p>{pillar.body}</p>
                </article>
              ))}
            </div>
            <p className="marketing-method-more">
              <Link to={METHOD_PAGE_PATH}>Go deeper on why it works →</Link>
            </p>
          </div>
        </section>

        <MarketingAccruingDemo variant="home" />

        {/* Why it works */}
        <section
          className="marketing-different-questions"
          id="why-it-works"
          aria-labelledby="why-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <h2 id="why-heading">{HOME_WHY_IT_WORKS.heading}</h2>
              <p className="marketing-section-lead marketing-section-lead--home">
                {HOME_WHY_IT_WORKS.lead}
              </p>
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

        {/* Platform */}
        <section
          className="marketing-how-home marketing-how-home--illustrated"
          id="platform"
          aria-labelledby="platform-heading"
        >
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">{HOME_PLATFORM.eyebrow}</p>
              <h2 id="platform-heading">
                {HOME_PLATFORM.headingStart}
                <span className="marketing-how-heading-accent">{HOME_PLATFORM.headingHighlight}</span>
              </h2>
              <p className="marketing-section-lead marketing-section-lead--home">{HOME_PLATFORM.lead}</p>
            </div>

            <ol className="marketing-how-illust-grid">
              {HOME_PLATFORM.steps.map((step, index) => {
                const Illust = METHOD_HOW_ILLUSTRATIONS[index]
                return (
                  <li key={step.title} className="marketing-how-illust-step">
                    <div className="marketing-how-illust-card">
                      {Illust ? <Illust /> : null}
                    </div>
                    <p className="marketing-how-illust-num" aria-hidden>
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </li>
                )
              })}
            </ol>

            <div className="marketing-method-equation-wrap marketing-method-equation-wrap--after">
              <MethodEquation variant="home" />
            </div>
          </div>
        </section>

        <section className="marketing-home-overview" id="overview" aria-labelledby="explore-heading">
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">If you want more</p>
              <h2 id="explore-heading">Keep going when you’re ready</h2>
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

        <section className="marketing-company-band" aria-label="Why Cash Prophet exists">
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">{HOME_FOUNDER.eyebrow}</p>
              <h2>{HOME_FOUNDER.heading}</h2>
              <p className="marketing-section-lead marketing-section-lead--home">{HOME_FOUNDER.body}</p>
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
