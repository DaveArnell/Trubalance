import { HOME_CHECKIN, HOME_EARLY_ACCESS, HOME_FITS } from '../../content/homePage'
import { PERSONAL_SETUP_CONTACT_PATH } from '../../content/earlyAccessPage'
import { CanonicalLink } from '../CanonicalLink'

type FitsContent = {
  heading: string
  intro: string
  columns: ReadonlyArray<{ tag: string; body: string; accent?: boolean }>
  payoffHeading: string
  payoffBody: string
  payoffClose: string
}

type CheckinContent = {
  heading: string
  lead: string
  steps: readonly string[]
  support: string
}

type EarlyAccessCtaContent = {
  heading: string
  body: string
  primaryCta: string
  primarySupport: string
  secondaryPrompt: string
  secondaryCta: string
}

/** Complementary roles: accounting, accountant, Cash Prophet — plus emotional payoff. */
export function HomeFitsSection({ content = HOME_FITS }: { content?: FitsContent } = {}) {
  return (
    <section
      className="home-band home-band--mist"
      id="where-it-fits"
      aria-labelledby="where-it-fits-heading"
    >
      <div className="marketing-section-inner marketing-section-inner--home home-fits">
        <div className="home-band-head">
          <h2 id="where-it-fits-heading">{content.heading}</h2>
          {content.intro.split('\n\n').map((paragraph) => (
            <p key={paragraph} className="home-fits-intro">
              {paragraph}
            </p>
          ))}
        </div>

        <div
          className="home-fits-columns"
          aria-label="How Cash Prophet sits beside accounting and your accountant"
        >
          {content.columns.map((column) => (
            <div
              key={column.tag}
              className={`home-fits-col${column.accent ? ' home-fits-col--accent' : ''}`}
            >
              <p className="home-fits-tag">{column.tag}</p>
              <p className="home-fits-body">{column.body}</p>
            </div>
          ))}
        </div>

        <div className="home-fits-payoff">
          <h3>{content.payoffHeading}</h3>
          <p>{content.payoffBody}</p>
          <p className="home-fits-close">{content.payoffClose}</p>
        </div>
      </div>
    </section>
  )
}

/** Compact check-in flow — answers the maintenance objection. */
export function HomeCheckInSection({ content = HOME_CHECKIN }: { content?: CheckinContent } = {}) {
  return (
    <section
      className="home-band home-band--paper"
      id="quick-check-in"
      aria-labelledby="quick-check-in-heading"
    >
      <div className="marketing-section-inner marketing-section-inner--home home-checkin">
        <div className="home-band-head">
          <h2 id="quick-check-in-heading">{content.heading}</h2>
          <p className="home-checkin-lead">{content.lead}</p>
        </div>

        <ol className="home-checkin-steps">
          {content.steps.map((step, index) => (
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

        <p className="home-checkin-support">{content.support}</p>
      </div>
    </section>
  )
}

/** Closing Early Access CTA — personal setup dominant. */
export function HomeEarlyAccessCta({
  content = HOME_EARLY_ACCESS,
  headingId = 'home-early-access-heading',
}: {
  content?: EarlyAccessCtaContent
  headingId?: string
} = {}) {
  return (
    <section
      className="marketing-cta-band marketing-cta-band--pop home-cta-band"
      id="early-access"
      aria-labelledby={headingId}
    >
      <div className="marketing-cta-band-inner home-early-cta">
        <h2 id={headingId}>{content.heading}</h2>
        {content.body.split('\n\n').map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <div className="home-early-cta-actions">
          <CanonicalLink
            to={PERSONAL_SETUP_CONTACT_PATH}
            className="btn-primary btn-large marketing-cta-btn-on-dark"
          >
            {content.primaryCta}
          </CanonicalLink>
          <p className="home-early-cta-support">{content.primarySupport}</p>
          <p className="home-early-cta-secondary">
            {content.secondaryPrompt}{' '}
            <CanonicalLink to="/signup" className="home-early-cta-link">
              {content.secondaryCta} →
            </CanonicalLink>
          </p>
        </div>
      </div>
    </section>
  )
}
