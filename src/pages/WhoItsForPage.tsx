import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import {
  METHOD_CLARITY_QUESTIONS,
  METHOD_WHO_FOR,
  METHOD_WHO_NOT_FOR,
} from '../content/trueBalanceMethod'
import { WHO_FOR_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function WhoItsForPage() {
  usePageMeta(WHO_FOR_SEO)
  return (
    <MarketingShell>
      <MarketingHeader />
      <main className="marketing-main who-for-page">
        <header className="method-edu-hero marketing-surface--hero">
          <div className="method-edu-inner">
            <p className="marketing-how-eyebrow">Fit</p>
            <h1>Who Cash Prophet is for</h1>
            <p className="method-edu-hero-lead">
              Owners who want confidence without complexity — especially if these questions sound
              familiar.
            </p>
          </div>
        </header>
        <section className="demo-scenarios-section demo-scenarios-section--landing marketing-surface--mist">
          <div className="marketing-section-inner">
            <div className="marketing-section-head demo-scenarios-head sr-only">
              <h2>Who it suits</h2>
            </div>

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
              Still exploring? <Link to="/how-it-works">See how it works</Link>
              {' · '}
              <Link to="/see-how-it-works">Try a demo</Link>
            </p>

            <div className="demo-scenarios-footer">
              <Link to="/signup" className="btn-primary btn-large">
                Start free trial
              </Link>
              <Link to="/see-how-it-works" className="btn-secondary btn-large">
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
