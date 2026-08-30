import { CanonicalLink } from '../components/CanonicalLink'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { MarketingFaqSection } from '../components/marketing/MarketingFaqSection'
import { MarketingJsonLd, whoItsForPageJsonLd } from '../components/marketing/MarketingJsonLd'
import { HomeEarlyAccessCta } from '../components/marketing/HomePositioningSections'
import {
  WHO_FOR_EARLY_ACCESS,
  WHO_FOR_FAMILIAR,
  WHO_FOR_GUIDES,
  WHO_FOR_HERO,
  WHO_FOR_OWNER_MANAGED,
  WHO_FOR_SECTOR,
} from '../content/whoItsForPage'
import { WHO_FOR_FAQS } from '../content/marketingFaqs'
import { WHO_FOR_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

/**
 * Who it's for — recognition page for owner-managed hospitality & leisure businesses.
 */
export function WhoItsForPage() {
  usePageMeta(WHO_FOR_SEO)

  return (
    <MarketingShell>
      <MarketingJsonLd data={whoItsForPageJsonLd(WHO_FOR_FAQS)} />
      <MarketingHeader />

      <main className="marketing-main marketing-method-page who-for-page">
        <header className="method-edu-hero method-edu-hero--compact marketing-surface--hero">
          <div className="method-edu-inner method-edu-inner--narrow">
            <h1>{WHO_FOR_HERO.heading}</h1>
            <p className="method-edu-hero-lead">{WHO_FOR_HERO.lead}</p>
            <p className="method-edu-hero-lead method-edu-hero-lead--secondary">
              {WHO_FOR_HERO.support}
            </p>
          </div>
        </header>

        <section
          className="method-edu-section marketing-surface--paper"
          aria-labelledby="who-familiar-heading"
          id="familiar"
        >
          <div className="method-edu-inner method-edu-inner--narrow">
            <div className="method-edu-section-head">
              <h2 id="who-familiar-heading">{WHO_FOR_FAMILIAR.heading}</h2>
              <p className="method-edu-section-lead">{WHO_FOR_FAMILIAR.lead}</p>
            </div>
            <ul className="marketing-clarity-questions who-for-questions" aria-label="Familiar questions">
              {WHO_FOR_FAMILIAR.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
            <p className="who-for-familiar-close">{WHO_FOR_FAMILIAR.close}</p>
          </div>
        </section>

        <section
          className="method-edu-section marketing-surface--mist"
          aria-labelledby="who-owner-heading"
          id="owner-managed"
        >
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="who-owner-heading">{WHO_FOR_OWNER_MANAGED.heading}</h2>
              <p className="method-edu-section-lead">{WHO_FOR_OWNER_MANAGED.lead}</p>
            </div>
            <ul className="who-for-traits" aria-label="Business characteristics that fit well">
              {WHO_FOR_OWNER_MANAGED.traits.map((trait) => (
                <li key={trait} className="who-for-trait">
                  {trait}
                </li>
              ))}
            </ul>
            <p className="who-for-qualification">{WHO_FOR_OWNER_MANAGED.qualification}</p>
          </div>
        </section>

        <section
          className="method-edu-section marketing-surface--paper"
          aria-labelledby="who-sector-heading"
          id="hospitality-leisure"
        >
          <div className="method-edu-inner">
            <div className="method-edu-section-head">
              <h2 id="who-sector-heading">{WHO_FOR_SECTOR.heading}</h2>
              {WHO_FOR_SECTOR.lead.map((paragraph) => (
                <p key={paragraph} className="method-edu-section-lead">
                  {paragraph}
                </p>
              ))}
            </div>
            <ul className="who-for-examples" aria-label="Example hospitality and leisure businesses">
              {WHO_FOR_SECTOR.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
            <p className="who-for-sector-note">{WHO_FOR_SECTOR.note}</p>
          </div>
        </section>

        <section
          className="who-for-guides marketing-surface--mist"
          aria-labelledby="who-for-guides-heading"
        >
          <div className="marketing-section-inner who-for-guides-inner">
            <h2 id="who-for-guides-heading">{WHO_FOR_GUIDES.heading}</h2>
            <p className="who-for-guides-lead">{WHO_FOR_GUIDES.lead}</p>
            <ul className="who-for-guides-list">
              {WHO_FOR_GUIDES.items.map((guide) => (
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

        <HomeEarlyAccessCta content={WHO_FOR_EARLY_ACCESS} headingId="who-early-access-heading" />
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
