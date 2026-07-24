import type { JsonLd } from '../../content/jsonLd'

interface MarketingJsonLdProps {
  data: JsonLd | JsonLd[]
}

/**
 * Injects JSON-LD into document head. Renders nothing visible.
 * Prefer one MarketingJsonLd per page with an array of graph objects.
 */
export function MarketingJsonLd({ data }: MarketingJsonLdProps) {
  const items = Array.isArray(data) ? data : [data]
  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  )
}

export {
  homePageJsonLd,
  pricingPageJsonLd,
  howItWorksPageJsonLd,
  whoItsForPageJsonLd,
  seeHowPageJsonLd,
  blogIndexJsonLd,
  blogPostJsonLd,
  breadcrumbJsonLd,
  articleJsonLd,
  faqPageJsonLd,
} from '../../content/jsonLd'
