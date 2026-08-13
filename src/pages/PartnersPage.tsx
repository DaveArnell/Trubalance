import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { MarketingFaqSection } from '../components/marketing/MarketingFaqSection'
import { MarketingJsonLd, partnersPageJsonLd } from '../components/marketing/MarketingJsonLd'
import { PARTNERS_FAQS, PARTNERS_PAGE } from '../content/partnersPage'
import { PARTNERS_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import {
  trackMetaPartnerEnquireClick,
  trackMetaPartnerSnapshotClick,
} from '../services/metaConversions'

const PARTNER_CONTACT = '/contact?topic=partnership#contact-form'

export function PartnersPage() {
  usePageMeta(PARTNERS_SEO)

  return (
    <MarketingShell>
      <MarketingJsonLd data={partnersPageJsonLd([...PARTNERS_FAQS])} />
      <MarketingHeader />
      <main className="marketing-main partners-page">
        <header className="method-edu-hero marketing-surface--hero partners-hero">
          <div className="method-edu-inner partners-hero-inner">
            <h1>{PARTNERS_PAGE.hero.title}</h1>
            <p className="method-edu-hero-lead">{PARTNERS_PAGE.hero.lead}</p>
            <div className="marketing-cta-row marketing-cta-row--center partners-hero-cta">
              <CanonicalLink
                to={PARTNER_CONTACT}
                className="btn-primary btn-large"
                onClick={() => trackMetaPartnerEnquireClick('hero')}
              >
                {PARTNERS_PAGE.hero.primaryCta}
              </CanonicalLink>
              <CanonicalLink to="/how-it-works" className="btn-secondary btn-large">
                {PARTNERS_PAGE.hero.secondaryCta}
              </CanonicalLink>
            </div>
          </div>
        </header>

        <section className="partners-section marketing-surface--mist" aria-labelledby="partners-who">
          <div className="marketing-section-inner partners-section-inner">
            <h2 id="partners-who">{PARTNERS_PAGE.who.heading}</h2>
            <p className="partners-lead">{PARTNERS_PAGE.who.lead}</p>
            <ul className="partners-audience-grid">
              {PARTNERS_PAGE.who.audiences.map((item) => (
                <li key={item.title} className="partners-audience-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="partners-section home-band home-band--paper" aria-labelledby="partners-alongside">
          <div className="marketing-section-inner partners-section-inner">
            <h2 id="partners-alongside">{PARTNERS_PAGE.alongside.heading}</h2>
            <p className="partners-lead">{PARTNERS_PAGE.alongside.lead}</p>
            {PARTNERS_PAGE.alongside.body.map((paragraph) => (
              <p key={paragraph} className="partners-prose">
                {paragraph}
              </p>
            ))}
            <div className="partners-compare" aria-label="How Cash Prophet sits alongside accounting">
              <article className="partners-compare-col partners-compare-col--muted">
                <h3>{PARTNERS_PAGE.alongside.accounting.label}</h3>
                <ul>
                  {PARTNERS_PAGE.alongside.accounting.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
              <article className="partners-compare-col partners-compare-col--accent">
                <h3>{PARTNERS_PAGE.alongside.cashProphet.label}</h3>
                <ul>
                  {PARTNERS_PAGE.alongside.cashProphet.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="partners-section marketing-surface--mist" aria-labelledby="partners-client">
          <div className="marketing-section-inner partners-section-inner">
            <h2 id="partners-client">{PARTNERS_PAGE.clientBenefit.heading}</h2>
            <p className="partners-lead">{PARTNERS_PAGE.clientBenefit.lead}</p>
            <ul className="partners-benefit-list">
              {PARTNERS_PAGE.clientBenefit.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="partners-section home-band home-band--paper" aria-labelledby="partners-offer">
          <div className="marketing-section-inner partners-section-inner">
            <h2 id="partners-offer">{PARTNERS_PAGE.partnerBenefit.heading}</h2>
            <p className="partners-lead">{PARTNERS_PAGE.partnerBenefit.lead}</p>
            <ul className="partners-benefit-list partners-benefit-list--offer">
              {PARTNERS_PAGE.partnerBenefit.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="partners-section marketing-surface--mist" aria-labelledby="partners-snapshot">
          <div className="marketing-section-inner partners-section-inner partners-snapshot">
            <h2 id="partners-snapshot">{PARTNERS_PAGE.snapshot.heading}</h2>
            <p className="partners-lead">{PARTNERS_PAGE.snapshot.lead}</p>
            <CanonicalLink
              to="/try-it"
              className="btn-secondary btn-large"
              onClick={() => trackMetaPartnerSnapshotClick()}
            >
              {PARTNERS_PAGE.snapshot.cta}
            </CanonicalLink>
          </div>
        </section>

        <section className="partners-section home-band home-band--paper" aria-labelledby="partners-how">
          <div className="marketing-section-inner partners-section-inner">
            <h2 id="partners-how">{PARTNERS_PAGE.how.heading}</h2>
            <ol className="partners-steps">
              {PARTNERS_PAGE.how.steps.map((step, index) => (
                <li key={step.title} className="partners-step">
                  <span className="partners-step-num" aria-hidden>
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

        <section className="marketing-cta-band marketing-cta-band--pop home-cta-band">
          <div className="marketing-cta-band-inner">
            <h2>{PARTNERS_PAGE.cta.heading}</h2>
            <p>{PARTNERS_PAGE.cta.body}</p>
            <div className="marketing-cta-row marketing-cta-row--center">
              <CanonicalLink
                to={PARTNER_CONTACT}
                className="btn-primary btn-large marketing-cta-btn-on-dark"
                onClick={() => trackMetaPartnerEnquireClick('footer')}
              >
                {PARTNERS_PAGE.cta.button}
              </CanonicalLink>
            </div>
          </div>
        </section>

        <MarketingFaqSection
          heading="Partnership questions"
          lead="Straight answers for accountants, advisers and member organisations."
          items={[...PARTNERS_FAQS]}
        />
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
