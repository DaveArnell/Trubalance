import { useEffect } from 'react'
import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
  scrollToMarketingSection,
} from '../components/marketing/MarketingLayout'
import { MethodWorkedExample } from '../components/marketing/MethodWorkedExample'
import { MethodReservePlannerVisual } from '../components/marketing/MethodReservePlannerVisual'
import { MarketingAccruingDemo } from '../components/marketing/MarketingAccruingDemo'
import { BalanceLineMorphVisual } from '../components/marketing/HeroBalanceGraphs'
import { HomeEarlyAccessCta } from '../components/marketing/HomePositioningSections'
import {
  HOW_IT_WORKS_ACCRUING,
  HOW_IT_WORKS_BALANCE,
  HOW_IT_WORKS_CHECKIN,
  HOW_IT_WORKS_EARLY_ACCESS,
  HOW_IT_WORKS_HERO,
  HOW_IT_WORKS_OVER_TIME,
  HOW_IT_WORKS_RESERVE,
  HOW_IT_WORKS_SETUP,
} from '../content/howItWorksPage'
import { HOW_IT_WORKS_SEO } from '../content/marketingSeo'
import { HOW_IT_WORKS_FAQS } from '../content/marketingFaqs'
import { usePageMeta } from '../hooks/usePageMeta'
import { MarketingFaqSection } from '../components/marketing/MarketingFaqSection'
import { MarketingJsonLd, howItWorksPageJsonLd } from '../components/marketing/MarketingJsonLd'

/**
 * How it works — short mechanism explanation of the Cash Prophet system.
 */
export function HowItWorksPage() {
  usePageMeta(HOW_IT_WORKS_SEO)

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const timer = window.setTimeout(() => scrollToMarketingSection(hash), 80)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <MarketingShell>
      <MarketingJsonLd data={howItWorksPageJsonLd(HOW_IT_WORKS_FAQS)} />
      <MarketingHeader />

      <main className="marketing-main marketing-method-page how-it-works-page">
        <header className="method-edu-hero method-edu-hero--compact marketing-surface--hero">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h1>{HOW_IT_WORKS_HERO.heading}</h1>
            <p className="method-edu-hero-lead">{HOW_IT_WORKS_HERO.lead}</p>
            <p className="method-edu-hero-lead method-edu-hero-lead--secondary">
              {HOW_IT_WORKS_HERO.support}
            </p>
          </div>
        </header>

        <MarketingAccruingDemo
          variant="method"
          heading={HOW_IT_WORKS_ACCRUING.heading}
          lead={HOW_IT_WORKS_ACCRUING.lead}
        />

        <section
          className="method-edu-section marketing-surface--mist"
          aria-labelledby="reserve-heading"
          id="reserve-planner"
        >
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="reserve-heading">{HOW_IT_WORKS_RESERVE.heading}</h2>
              {HOW_IT_WORKS_RESERVE.lead.map((paragraph) => (
                <p key={paragraph} className="method-edu-section-lead">
                  {paragraph}
                </p>
              ))}
            </div>
            <MethodReservePlannerVisual />
            <ul className="how-it-works-compact-points" aria-label="How the Reserve Planner works">
              {HOW_IT_WORKS_RESERVE.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="method-edu-section method-edu-section--tint marketing-surface--panel"
          aria-labelledby="example-heading"
          id="worked-example"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <div className="method-edu-section-head">
              <h2 id="example-heading">{HOW_IT_WORKS_BALANCE.heading}</h2>
              {HOW_IT_WORKS_BALANCE.lead.map((paragraph) => (
                <p key={paragraph} className="method-edu-section-lead">
                  {paragraph}
                </p>
              ))}
            </div>
            <MethodWorkedExample />
            <p className="how-it-works-after-example">{HOW_IT_WORKS_BALANCE.afterExample}</p>
          </div>
        </section>

        <section
          className="method-edu-section marketing-surface--mist"
          aria-labelledby="over-time-heading"
          id="over-time"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <div className="method-edu-section-head">
              <h2 id="over-time-heading">{HOW_IT_WORKS_OVER_TIME.heading}</h2>
              {HOW_IT_WORKS_OVER_TIME.lead.map((paragraph) => (
                <p key={paragraph} className="method-edu-section-lead">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="how-it-works-over-time-visual">
              <BalanceLineMorphVisual />
            </div>
            <p className="how-it-works-after-example">{HOW_IT_WORKS_OVER_TIME.afterVisual}</p>
          </div>
        </section>

        <section
          className="method-edu-section marketing-surface--paper"
          aria-labelledby="checkin-heading"
          id="habits"
        >
          <div className="method-edu-inner method-edu-inner--narrow home-checkin how-it-works-checkin">
            <div className="method-edu-section-head home-band-head">
              <h2 id="checkin-heading">{HOW_IT_WORKS_CHECKIN.heading}</h2>
              <p className="home-checkin-lead method-edu-section-lead">{HOW_IT_WORKS_CHECKIN.lead}</p>
            </div>

            <ol className="home-checkin-steps">
              {HOW_IT_WORKS_CHECKIN.steps.map((step, index) => (
                <li key={step} className="home-checkin-step">
                  {index > 0 && (
                    <span className="home-checkin-arrow" aria-hidden>
                      →
                    </span>
                  )}
                  <span className="home-checkin-step-label">{step}</span>
                </li>
              ))}
            </ol>

            <p className="home-checkin-support">{HOW_IT_WORKS_CHECKIN.support}</p>
            <p className="how-it-works-reserve-note">{HOW_IT_WORKS_CHECKIN.reserveNote}</p>
          </div>
        </section>

        <section
          className="method-edu-section marketing-surface--mist"
          aria-labelledby="first-setup-heading"
          id="first-setup"
        >
          <div className="method-edu-inner method-edu-inner--narrow how-it-works-setup">
            <div className="method-edu-section-head">
              <h2 id="first-setup-heading">{HOW_IT_WORKS_SETUP.heading}</h2>
              <p className="method-edu-section-lead">{HOW_IT_WORKS_SETUP.primaryLead}</p>
            </div>

            <h3 className="how-it-works-setup-subhead">{HOW_IT_WORKS_SETUP.includesIntro}</h3>
            <ul className="how-it-works-setup-grid" aria-label="What personal setup can include">
              {HOW_IT_WORKS_SETUP.includes.map((item) => (
                <li key={`${item.line1} ${item.line2}`} className="how-it-works-setup-item">
                  <span className="how-it-works-setup-item-line">{item.line1}</span>
                  <span className="how-it-works-setup-item-line">{item.line2}</span>
                </li>
              ))}
            </ul>

            <div className="how-it-works-setup-selfserve">
              <h3 className="how-it-works-setup-selfserve-heading">{HOW_IT_WORKS_SETUP.selfServeHeading}</h3>
              <p className="how-it-works-setup-selfserve-body">{HOW_IT_WORKS_SETUP.selfServeBody}</p>
            </div>

            <div className="how-it-works-setup-actions">
              <CanonicalLink to={HOW_IT_WORKS_SETUP.primaryHref} className="btn-primary btn-large">
                {HOW_IT_WORKS_SETUP.primaryCta}
              </CanonicalLink>
              <CanonicalLink to={HOW_IT_WORKS_SETUP.secondaryHref} className="btn-secondary btn-large">
                {HOW_IT_WORKS_SETUP.secondaryCta}
              </CanonicalLink>
            </div>
          </div>
        </section>

        <MarketingFaqSection
          heading="Common questions"
          lead="Short answers about how Cash Prophet works day to day."
          items={HOW_IT_WORKS_FAQS}
        />

        <HomeEarlyAccessCta
          content={HOW_IT_WORKS_EARLY_ACCESS}
          headingId="how-early-access-heading"
        />
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
