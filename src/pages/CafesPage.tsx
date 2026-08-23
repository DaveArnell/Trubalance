import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { CashProphetLogo } from '../components/marketing/CashProphetLogo'
import { CompanyLegalNotice } from '../components/marketing/CompanyLegalNotice'
import { MarketingFaqSection } from '../components/marketing/MarketingFaqSection'
import { MarketingJsonLd, cafesPageJsonLd } from '../components/marketing/MarketingJsonLd'
import { HeroBalanceGraphs } from '../components/marketing/HeroBalanceGraphs'
import {
  CafeAccruingBills,
  CafeEquation,
  CafePayrollBuild,
  CafeReserveVisual,
} from '../components/marketing/CafesLandingVisuals'
import { CAFES_FAQS } from '../content/marketingFaqs'
import {
  CAFES_ONBOARDING_PATH,
  CAFES_PAGE,
  CAFES_SIGNUP_PATH,
  CAFES_TRY_IT_PATH,
} from '../content/cafesPage'
import { CAFES_SEO, PRODUCT_MONITOR_IMAGE, PRODUCT_MONITOR_IMAGE_ALT } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  trackMetaCafeSignupClick,
  trackMetaCafeTryItClick,
} from '../services/metaConversions'

type CafePlacement = 'hero' | 'snapshot' | 'footer'

function SignupCta({
  placement,
  className,
  children,
}: {
  placement: CafePlacement
  className: string
  children: string
}) {
  return (
    <CanonicalLink
      to={CAFES_SIGNUP_PATH}
      className={className}
      onClick={() => trackMetaCafeSignupClick(placement)}
    >
      {children}
    </CanonicalLink>
  )
}

function TryItCta({
  placement,
  className,
  children,
}: {
  placement: CafePlacement
  className: string
  children: string
}) {
  return (
    <CanonicalLink
      to={CAFES_TRY_IT_PATH}
      className={className}
      onClick={() => trackMetaCafeTryItClick(placement)}
    >
      {children}
    </CanonicalLink>
  )
}

export function CafesPage() {
  usePageMeta(CAFES_SEO)

  return (
    <MarketingShell>
      <MarketingJsonLd data={cafesPageJsonLd(CAFES_FAQS)} />
      <MarketingHeader />

      <main className="marketing-main marketing-main--home marketing-main--home-vivid cafes-page">
        <section className="marketing-hero marketing-hero--rank marketing-surface--hero">
          <div className="marketing-hero-rank-inner">
            <div className="marketing-hero-rank-copy">
              <div className="marketing-hero-brand">
                <CashProphetLogo variant="hero" onDark />
              </div>
              <p className="marketing-hero-category cafes-hero-category">{CAFES_PAGE.hero.category}</p>
              <h1>{CAFES_PAGE.hero.headline}</h1>
              <p className="marketing-lead">{CAFES_PAGE.hero.lead}</p>
              <div className="marketing-cta-row marketing-cta-row--hero">
                <SignupCta
                  placement="hero"
                  className="btn-primary btn-large marketing-cta-primary marketing-cta-primary--rank"
                >
                  {CAFES_PAGE.hero.primaryCta}
                </SignupCta>
                <TryItCta
                  placement="hero"
                  className="btn-secondary btn-large marketing-cta-secondary--rank"
                >
                  {CAFES_PAGE.hero.secondaryCta}
                </TryItCta>
              </div>
              <p className="marketing-hero-onboard-link">
                <CanonicalLink to={CAFES_ONBOARDING_PATH}>{CAFES_PAGE.hero.onboarding}</CanonicalLink>
              </p>
              {!isSupabaseConfigured && (
                <p className="marketing-config-hint">
                  Cloud signup needs Supabase in <code>.env.local</code>, or{' '}
                  <CanonicalLink to="/app">try the app locally</CanonicalLink> without an account.
                </p>
              )}
            </div>
            <div className="marketing-hero-rank-visual cafes-hero-visual">
              <CafeAccruingBills />
            </div>
          </div>
        </section>

        <section className="home-band home-band--mist" aria-labelledby="cafe-noisy-heading">
          <div className="marketing-section-inner marketing-section-inner--home">
            <div className="home-band-head">
              <h2 id="cafe-noisy-heading">{CAFES_PAGE.noisy.heading}</h2>
              <p className="home-split-lead">{CAFES_PAGE.noisy.lead}</p>
              <p className="home-split-prose">{CAFES_PAGE.noisy.body}</p>
            </div>
            <div className="cafe-graphs">
              <HeroBalanceGraphs />
            </div>
            <p className="cafe-section-close">{CAFES_PAGE.noisy.close}</p>
          </div>
        </section>

        <section className="home-band home-band--paper" aria-labelledby="cafe-budget-heading">
          <div className="marketing-section-inner marketing-section-inner--home home-split">
            <div className="home-split-copy">
              <h2 id="cafe-budget-heading">{CAFES_PAGE.budgeting.heading}</h2>
              <p className="home-split-lead">{CAFES_PAGE.budgeting.lead}</p>
              <p className="home-split-prose">{CAFES_PAGE.budgeting.example}</p>
              <p className="home-split-prose">{CAFES_PAGE.budgeting.close}</p>
            </div>
            <CafePayrollBuild />
          </div>
        </section>

        <section className="home-band home-band--mist" aria-labelledby="cafe-bills-heading">
          <div className="marketing-section-inner marketing-section-inner--home cafe-section cafe-section--narrow">
            <h2 id="cafe-bills-heading">{CAFES_PAGE.bills.heading}</h2>
            <p className="home-split-lead">{CAFES_PAGE.bills.lead}</p>
            <p className="home-split-prose">{CAFES_PAGE.bills.body}</p>
          </div>
        </section>

        <section className="home-band home-band--paper" aria-labelledby="cafe-reserve-heading">
          <div className="marketing-section-inner marketing-section-inner--home home-split home-split--flip">
            <div className="home-split-copy">
              <h2 id="cafe-reserve-heading">{CAFES_PAGE.reserve.heading}</h2>
              <p className="home-split-lead">{CAFES_PAGE.reserve.lead}</p>
              <p className="home-split-prose">{CAFES_PAGE.reserve.body}</p>
            </div>
            <CafeReserveVisual />
          </div>
        </section>

        <section className="home-band home-band--mist" aria-labelledby="cafe-number-heading">
          <div className="marketing-section-inner marketing-section-inner--home cafe-section">
            <div className="home-band-head">
              <h2 id="cafe-number-heading">{CAFES_PAGE.oneNumber.heading}</h2>
              <p className="home-split-lead">{CAFES_PAGE.oneNumber.lead}</p>
            </div>
            <CafeEquation />
            <p className="cafe-section-close">{CAFES_PAGE.oneNumber.close}</p>
          </div>
        </section>

        <section className="home-band home-band--paper" aria-labelledby="cafe-snapshot-heading">
          <div className="marketing-section-inner marketing-section-inner--home cafe-snapshot">
            <h2 id="cafe-snapshot-heading">{CAFES_PAGE.snapshot.heading}</h2>
            <p className="home-split-lead">{CAFES_PAGE.snapshot.lead}</p>
            <ul className="cafe-snapshot-points">
              {CAFES_PAGE.snapshot.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <TryItCta placement="snapshot" className="btn-secondary btn-large">
              {CAFES_PAGE.snapshot.cta}
            </TryItCta>
          </div>
        </section>

        <section className="home-band home-band--mist" aria-labelledby="cafe-light-heading">
          <div className="marketing-section-inner marketing-section-inner--home cafe-section">
            <div className="home-band-head">
              <h2 id="cafe-light-heading">{CAFES_PAGE.lightweight.heading}</h2>
              <p className="home-split-lead">{CAFES_PAGE.lightweight.lead}</p>
            </div>
            <ul className="cafe-light-points">
              {CAFES_PAGE.lightweight.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <figure className="cafe-product-shot">
              <img
                src={PRODUCT_MONITOR_IMAGE}
                alt={PRODUCT_MONITOR_IMAGE_ALT}
                width={1536}
                height={1024}
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
        </section>

        <section className="home-band home-band--paper" aria-labelledby="cafe-benefits-heading">
          <div className="marketing-section-inner marketing-section-inner--home cafe-section">
            <div className="home-band-head">
              <h2 id="cafe-benefits-heading">{CAFES_PAGE.benefits.heading}</h2>
            </div>
            <ul className="cafe-benefits">
              {CAFES_PAGE.benefits.items.map((item) => (
                <li key={item.title} className="cafe-benefit">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="home-band home-band--founder" aria-labelledby="cafe-founder-heading">
          <div className="marketing-section-inner marketing-section-inner--home cafe-section cafe-section--narrow">
            <h2 id="cafe-founder-heading">{CAFES_PAGE.founder.heading}</h2>
            <p className="home-split-prose">{CAFES_PAGE.founder.body}</p>
          </div>
        </section>

        <section className="marketing-company-band home-band--legal" aria-label="Company information">
          <div className="marketing-section-inner marketing-section-inner--home">
            <CompanyLegalNotice variant="inline" />
          </div>
        </section>

        <section className="marketing-cta-band marketing-cta-band--pop home-cta-band">
          <div className="marketing-cta-band-inner">
            <h2>{CAFES_PAGE.cta.heading}</h2>
            <p>{CAFES_PAGE.cta.body}</p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <SignupCta
                placement="footer"
                className="btn-primary btn-large marketing-cta-btn-on-dark"
              >
                {CAFES_PAGE.cta.primary}
              </SignupCta>
              <TryItCta placement="footer" className="btn-ghost btn-large marketing-cta-ghost">
                {CAFES_PAGE.cta.secondary}
              </TryItCta>
              <CanonicalLink
                to={CAFES_ONBOARDING_PATH}
                className="btn-ghost btn-large marketing-cta-ghost"
              >
                {CAFES_PAGE.cta.onboarding}
              </CanonicalLink>
            </div>
          </div>
        </section>

        <MarketingFaqSection
          heading="Common questions from café owners"
          lead="Straight answers before you try it."
          items={CAFES_FAQS}
        />
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
