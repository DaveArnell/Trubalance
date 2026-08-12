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

function resolveTopic(raw: string | null): InquiryTopic {
  return raw === 'onboarding' ? 'onboarding' : 'general'
}

export function ContactPage() {
  usePageMeta(CONTACT_SEO)
  const [searchParams] = useSearchParams()
  const jsonLd = useMemo(() => contactPageJsonLd([...CONTACT_FAQS]), [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await submitInquiry({
      name,
      email,
      businessName,
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
            <p className="method-edu-hero-lead">{CONTACT_PAGE.lead}</p>
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
              <p className="contact-direct-email">
                {CONTACT_PAGE.emailLabel}:{' '}
                <a href={`mailto:${CONTACT_PAGE.email}`}>{CONTACT_PAGE.email}</a>
              </p>
              <p className="muted contact-trial-note">
                Prefer to explore first?{' '}
                <CanonicalLink to="/signup">Start free</CanonicalLink>
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
                    <span>{CONTACT_PAGE.form.businessLabel}</span>
                    <input
                      name="business"
                      autoComplete="organization"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </label>

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
                      placeholder={CONTACT_PAGE.form.messagePlaceholder}
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
          lead="Straight answers about free onboarding and how we reply."
          items={[...CONTACT_FAQS]}
        />
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
