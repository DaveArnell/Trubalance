import { useSearchParams } from 'react-router-dom'
import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { FreeCashPositionCheck } from '../components/marketing/FreeCashPositionCheck'
import { MarketingJsonLd, tryItPageJsonLd } from '../components/marketing/MarketingJsonLd'
import { TRY_IT_CAFE, TRY_IT_PAGE } from '../content/tryItPage'
import { TRY_IT_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

function isCafeSector(value: string | null): boolean {
  return value === 'cafe' || value === 'cafes'
}

export function TryItPage() {
  const [params] = useSearchParams()
  const cafe = isCafeSector(params.get('sector'))
  usePageMeta(TRY_IT_SEO)

  const leadParagraphs = (cafe ? TRY_IT_CAFE.lead : TRY_IT_PAGE.lead).split('\n\n')
  const explainIntro = TRY_IT_PAGE.explain.intro.split('\n\n')

  return (
    <MarketingShell>
      <MarketingJsonLd data={tryItPageJsonLd()} />
      <MarketingHeader />
      <main className="marketing-main try-it-page">
        <header className="method-edu-hero method-edu-hero--compact marketing-surface--hero try-it-hero">
          <div className="method-edu-inner try-it-hero-inner">
            <p className="marketing-eyebrow">{TRY_IT_PAGE.freeBadge}</p>
            <h1>{cafe ? TRY_IT_CAFE.title : TRY_IT_PAGE.title}</h1>
            {leadParagraphs.map((paragraph) => (
              <p key={paragraph} className="method-edu-hero-lead">
                {paragraph}
              </p>
            ))}
          </div>
        </header>

        <section className="try-it-body marketing-surface--mist">
          <div className="marketing-section-inner try-it-layout">
            <FreeCashPositionCheck variant={cafe ? 'cafe' : 'default'} />
          </div>
        </section>

        <section className="try-it-explain home-band home-band--paper" aria-labelledby="try-it-explain">
          <div className="marketing-section-inner try-it-explain-inner">
            <h2 id="try-it-explain">{TRY_IT_PAGE.explain.heading}</h2>
            {explainIntro.map((paragraph) => (
              <p key={paragraph} className="try-it-explain-intro">
                {paragraph}
              </p>
            ))}
            <ul className="try-it-explain-points">
              {TRY_IT_PAGE.explain.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="try-it-explain-close">{TRY_IT_PAGE.explain.closing}</p>
            <div className="try-it-explain-actions">
              <CanonicalLink to={TRY_IT_PAGE.cta.primaryHref} className="btn-primary btn-large">
                {TRY_IT_PAGE.cta.primary}
              </CanonicalLink>
              <CanonicalLink to={TRY_IT_PAGE.cta.secondaryHref} className="btn-secondary btn-large">
                {TRY_IT_PAGE.cta.secondary}
              </CanonicalLink>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
