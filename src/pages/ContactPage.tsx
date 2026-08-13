import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { MarketingFaqSection } from '../components/marketing/MarketingFaqSection'
import { MarketingJsonLd, contactPageJsonLd } from '../components/marketing/MarketingJsonLd'
import { COMPANY_INFO } from '../content/companyInfo'
import { CONTACT_FAQS, CONTACT_PAGE, type InquiryTopic } from '../content/contactPage'
import { CONTACT_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { submitInquiry } from '../services/inquiryApi'
import { trackMetaInquirySubmitted } from '../services/metaConversions'

const VALID_TOPICS: InquiryTopic[] = ['general', 'onboarding', 'partnership']

function resolveTopic(raw: string | null): InquiryTopic {
  if (raw && VALID_TOPICS.includes(raw as InquiryTopic)) return raw as InquiryTopic
  return 'general'
}

export function ContactPage() {
  usePageMeta(CONTACT_SEO)
  const [searchParams] = useSearchParams()
  const jsonLd = useMemo(() => contactPageJsonLd([...CONTACT_FAQS]), [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')
  const [topic, setTopic] = useState<InquiryTopic>(() =>
    resolveTopic(searchParams.get('topic')),
  )
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setTopic(resolveTopic(searchParams.get('topic')))
  }, [searchParams])

  useEffect(() => {
    if (window.location.hash !== '#contact-form') return
    const timer = window.setTimeout(() => {
      document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [])

  const isPartnership = topic === 'partnership'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await submitInquiry({
      name,
      email,
      businessName,
      website: isPartnership ? website : '',
      phone,
      topic,
      message,
      companyWebsite: honeypot,
    })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    trackMetaInquirySubmitted(topic)
    setDone(true)
  }

  return (
    <MarketingShell>
      <MarketingJsonLd data={jsonLd} />
      <MarketingHeader />
      <main className="marketing-main marketing-main--contact">
        <header className="method-edu-hero method-edu-hero--compact marketing-surface--hero">
          <div className="method-edu-inner">
            <h1>{CONTACT_PAGE.title}</h1>
            {CONTACT_PAGE.lead ? (
              <p className="method-edu-hero-lead">{CONTACT_PAGE.lead}</p>
            ) : null}
          </div>
        </header>

        <section className="contact-page-section marketing-surface--mist">
          <div className="marketing-section-inner contact-page-grid">
            <div className="contact-page-aside">
              <article className="contact-onboarding-card">
                <h2>{CONTACT_PAGE.onboardingHighlight.heading}</h2>
                <p>{CONTACT_PAGE.onboardingHighlight.body}</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setTopic('onboarding')
                    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Request free onboarding
                </button>
              </article>
              <article className="contact-onboarding-card contact-partnership-card">
                <h2>{CONTACT_PAGE.partnershipHighlight.heading}</h2>
                <p>{CONTACT_PAGE.partnershipHighlight.body}</p>
                <div className="contact-partnership-actions">
                  <CanonicalLink to="/partners" className="btn-secondary">
                    {CONTACT_PAGE.partnershipHighlight.cta}
                  </CanonicalLink>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setTopic('partnership')
                      document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Select partnership enquiry
                  </button>
                </div>
              </article>
              <p className="contact-direct-email">
                {CONTACT_PAGE.emailLabel}:{' '}
                <a href={`mailto:${CONTACT_PAGE.email}`}>{CONTACT_PAGE.email}</a>
              </p>
              <p className="muted contact-trial-note">
                Prefer to explore first?{' '}
                <CanonicalLink to="/signup">Start free</CanonicalLink>
                {' · '}
                <CanonicalLink to="/try-it">Free cash check</CanonicalLink>
                {' · '}
                <CanonicalLink to="/see-how-it-works">See how it works</CanonicalLink>
              </p>
            </div>

            <div className="contact-form-card">
              {done ? (
                <div className="contact-form-success" role="status">
                  <h2>{CONTACT_PAGE.form.successTitle}</h2>
                  <p>{CONTACT_PAGE.form.successBody}</p>
                  <p className="muted">
                    We will write to you from {COMPANY_INFO.contactEmail}.
                  </p>
                </div>
              ) : (
                <form id="contact-form" className="contact-form" onSubmit={onSubmit} noValidate>
                  <div className="contact-honeypot" aria-hidden="true">
                    <label htmlFor="companyWebsite">Company website</label>
                    <input
                      id="companyWebsite"
                      name="companyWebsite"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  <label className="contact-field">
                    <span>{CONTACT_PAGE.form.nameLabel}</span>
                    <input
                      required
                      name="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>

                  <label className="contact-field">
                    <span>{CONTACT_PAGE.form.emailLabel}</span>
                    <input
                      required
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>

                  <label className="contact-field">
                    <span>
                      {isPartnership
                        ? CONTACT_PAGE.form.organisationLabel
                        : CONTACT_PAGE.form.businessLabel}
                    </span>
                    <input
                      name="business"
                      autoComplete="organization"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </label>

                  {isPartnership ? (
                    <label className="contact-field">
                      <span>{CONTACT_PAGE.form.websiteLabel}</span>
                      <input
                        type="url"
                        name="website"
                        autoComplete="url"
                        placeholder="https://"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </label>
                  ) : null}

                  <label className="contact-field">
                    <span>{CONTACT_PAGE.form.phoneLabel}</span>
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>

                  <fieldset className="contact-topic">
                    <legend>{CONTACT_PAGE.form.topicLabel}</legend>
                    {CONTACT_PAGE.topics.map((item) => (
                      <label key={item.id} className="contact-topic-option">
                        <input
                          type="radio"
                          name="topic"
                          value={item.id}
                          checked={topic === item.id}
                          onChange={() => setTopic(item.id)}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </fieldset>

                  <label className="contact-field">
                    <span>{CONTACT_PAGE.form.messageLabel}</span>
                    <textarea
                      required
                      name="message"
                      rows={5}
                      placeholder={
                        isPartnership
                          ? CONTACT_PAGE.form.partnershipMessagePlaceholder
                          : CONTACT_PAGE.form.messagePlaceholder
                      }
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </label>

                  {error && (
                    <p className="contact-form-error" role="alert">
                      {error}
                    </p>
                  )}

                  <button type="submit" className="btn-primary btn-large" disabled={loading}>
                    {loading ? CONTACT_PAGE.form.submitting : CONTACT_PAGE.form.submit}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <MarketingFaqSection
          heading="Before you enquire"
          lead="Straight answers about free onboarding, partnerships and how we reply."
          items={[...CONTACT_FAQS]}
        />
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
