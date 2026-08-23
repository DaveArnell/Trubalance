import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { MarketingFaqSection } from '../components/marketing/MarketingFaqSection'
import { MarketingJsonLd, whoItsForPageJsonLd } from '../components/marketing/MarketingJsonLd'
import {
  METHOD_CLARITY_QUESTIONS,
  METHOD_WHO_FOR,
  METHOD_WHO_NOT_FOR,
  METHOD_WHO_QUESTIONS_INTRO,
  WHO_FOR_RELATED_GUIDES,
} from '../content/trueBalanceMethod'
import { WHO_FOR_FAQS } from '../content/marketingFaqs'
import { WHO_FOR_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function WhoItsForPage() {
  usePageMeta(WHO_FOR_SEO)
  return (
    <MarketingShell>
      <MarketingJsonLd data={whoItsForPageJsonLd(WHO_FOR_FAQS)} />
      <MarketingHeader />
      <main className="marketing-main who-for-page">
        <header className="method-edu-hero marketing-surface--hero">
          <div className="method-edu-inner">
            <h1>Who Cash Prophet is for</h1>
            <p className="method-edu-hero-lead">
              If you check the bank and still do the maths in your head before you spend, this is for
              you. Cash Prophet keeps growing bills in view automatically, so you get a clear daily
              answer to what the business can actually afford.
            </p>
          </div>
        </header>
        <section className="demo-scenarios-section demo-scenarios-section--landing marketing-surface--mist">
          <div className="marketing-section-inner">
            <p className="who-for-questions-intro">{METHOD_WHO_QUESTIONS_INTRO}</p>
            <ul className="marketing-clarity-questions" aria-label="Familiar questions">
              {METHOD_CLARITY_QUESTIONS.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>

            <div className="marketing-method-audience marketing-method-audience--page">
              <article className="marketing-method-audience-card">
                <h2>Designed for business owners who</h2>
                <ul>
                  {METHOD_WHO_FOR.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="marketing-method-audience-card marketing-method-audience-card--quiet">
                <h2>Probably not for you if…</h2>
                <ul>
                  {METHOD_WHO_NOT_FOR.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>

            <p className="marketing-method-more">
              Still exploring? <CanonicalLink to="/how-it-works">See how it works</CanonicalLink>
              {' · '}
              <CanonicalLink to="/see-how-it-works">Try a demo</CanonicalLink>
            </p>

            <div className="demo-scenarios-footer">
              <CanonicalLink to="/signup" className="btn-primary btn-large">
                Start free trial
              </CanonicalLink>
              <CanonicalLink to="/see-how-it-works" className="btn-secondary btn-large">
                See the Platform
              </CanonicalLink>
            </div>
          </div>
        </section>

        <section className="who-for-guides marketing-surface--mist" aria-labelledby="who-for-cafes-heading">
          <div className="marketing-section-inner who-for-guides-inner">
            <h2 id="who-for-cafes-heading">If you run a café or coffee shop</h2>
            <p className="who-for-guides-lead">
              There is a page written specifically for café owners: daily takings, uneven bills, and
              a clearer figure for what the café can actually afford.
            </p>
            <p className="who-for-guides-more">
              <CanonicalLink to="/cafes">Automated budgeting for cafés</CanonicalLink>
            </p>
          </div>
        </section>

        <section className="who-for-guides marketing-surface--mist" aria-labelledby="who-for-guides-heading">
          <div className="marketing-section-inner who-for-guides-inner">
            <h2 id="who-for-guides-heading">Guides for your kind of business</h2>
            <p className="who-for-guides-lead">
              Practical reading if you want to see the problem in your world before you try the
              product.
            </p>
            <ul className="who-for-guides-list">
              {WHO_FOR_RELATED_GUIDES.map((guide) => (
                <li key={guide.to}>
                  <CanonicalLink to={guide.to}>
                    <span className="who-for-guides-label">{guide.label}</span>
                    <span className="who-for-guides-blurb">{guide.blurb}</span>
                  </CanonicalLink>
                </li>
              ))}
            </ul>
            <p className="who-for-guides-more">
              <CanonicalLink to="/blog">Browse all guides</CanonicalLink>
            </p>
          </div>
        </section>

        <MarketingFaqSection
          heading="Common questions"
          lead="Quick answers if you are not sure Cash Prophet is for you."
          items={WHO_FOR_FAQS}
        />
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
