import { COMPANY_INFO } from './companyInfo'
import { PRIMARY_NAV, SECONDARY_NAV } from './marketingNav'
import type { FaqItem } from './marketingFaqs'
import {
  SITE_OG_IMAGE,
  HOME_SEO,
  HOW_IT_WORKS_SEO,
  PRICING_SEO,
  WHO_FOR_SEO,
  SEE_HOW_SEO,
  BLOG_INDEX_SEO,
} from './marketingSeo'
import {
  SUBSCRIPTION_TIERS,
  TIER_ORDER,
  TRIAL_DAYS,
  type SubscriptionTierId,
} from '../config/subscriptionTiers'
import type { BlogPost } from './blogTypes'

const site = COMPANY_INFO.website
const ogImage = `${site}${SITE_OG_IMAGE}`
const logoUrl = `${site}/logo-mark.webp`

export type JsonLd = Record<string, unknown>

function absolutePath(path: string): string {
  if (path.startsWith('http')) return path
  return `${site}${path.startsWith('/') ? path : `/${path}`}`
}

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site}/#organization`,
    name: COMPANY_INFO.productName,
    legalName: COMPANY_INFO.legalName,
    url: site,
    email: COMPANY_INFO.contactEmail,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
    },
    image: ogImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY_INFO.registeredAddressLines[0],
      addressLocality: COMPANY_INFO.registeredAddressLines[1],
      postalCode: COMPANY_INFO.registeredAddressLines[2],
      addressCountry: 'GB',
    },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
  }
}

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site}/#website`,
    name: COMPANY_INFO.productName,
    url: site,
    description: HOME_SEO.description,
    inLanguage: 'en-GB',
    publisher: { '@id': `${site}/#organization` },
    about: {
      '@type': 'Thing',
      name: 'Available Balance for UK businesses',
    },
  }
}

export function siteNavigationJsonLd(): JsonLd {
  const seen = new Set<string>()
  const links = [...PRIMARY_NAV, ...SECONDARY_NAV].filter((item) => {
    if (seen.has(item.to)) return false
    seen.add(item.to)
    return true
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${site}/#site-navigation`,
    name: 'Main navigation',
    itemListElement: links.map((item, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: item.label,
      url: absolutePath(item.to),
    })),
  }
}

export function softwareApplicationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': ['SoftwareApplication', 'Product'],
    '@id': `${site}/#product`,
    name: COMPANY_INFO.productName,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    url: site,
    image: ogImage,
    description: HOME_SEO.description,
    brand: {
      '@type': 'Brand',
      name: COMPANY_INFO.productName,
    },
    provider: { '@id': `${site}/#organization` },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'GBP',
      lowPrice: String(SUBSCRIPTION_TIERS.solo.priceMonthlyGbp),
      highPrice: String(SUBSCRIPTION_TIERS.group.priceMonthlyGbp),
      offerCount: TIER_ORDER.length,
      availability: 'https://schema.org/InStock',
      url: absolutePath('/pricing'),
      description: `${TRIAL_DAYS}-day free trial, then from £${SUBSCRIPTION_TIERS.solo.priceMonthlyGbp}/month`,
    },
  }
}

export function homePageJsonLd(): JsonLd[] {
  return [organizationJsonLd(), websiteJsonLd(), siteNavigationJsonLd(), softwareApplicationJsonLd()]
}

export function faqPageJsonLd(faqs: FaqItem[], pageUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    url: pageUrl,
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

function tierProductJsonLd(tierId: SubscriptionTierId): JsonLd {
  const tier = SUBSCRIPTION_TIERS[tierId]
  const url = absolutePath('/pricing')
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#${tier.id}`,
    name: `Cash Prophet ${tier.name}`,
    description: tier.perfectFor,
    image: ogImage,
    brand: {
      '@type': 'Brand',
      name: COMPANY_INFO.productName,
    },
    category: 'Business finance software',
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'UK small business owners',
    },
    offers: [
      {
        '@type': 'Offer',
        url,
        price: String(tier.priceMonthlyGbp),
        priceCurrency: 'GBP',
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2027-12-31',
        description: `Rolling monthly · ${tier.name}`,
      },
      {
        '@type': 'Offer',
        url,
        price: String(tier.priceAnnualGbp),
        priceCurrency: 'GBP',
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2027-12-31',
        description: `Annual · ${tier.name} (2 months free)`,
      },
    ],
  }
}

export function pricingPageJsonLd(faqs: FaqItem[]): JsonLd[] {
  const pageUrl = absolutePath(PRICING_SEO.path)
  return [
    organizationJsonLd(),
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${pageUrl}#cash-prophet`,
      name: COMPANY_INFO.productName,
      description: PRICING_SEO.description,
      image: ogImage,
      brand: { '@type': 'Brand', name: COMPANY_INFO.productName },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'GBP',
        lowPrice: String(SUBSCRIPTION_TIERS.solo.priceMonthlyGbp),
        highPrice: String(SUBSCRIPTION_TIERS.group.priceMonthlyGbp),
        offerCount: TIER_ORDER.length * 2,
        availability: 'https://schema.org/InStock',
        url: pageUrl,
      },
    },
    ...TIER_ORDER.map(tierProductJsonLd),
    faqPageJsonLd(faqs, pageUrl),
  ]
}

export function howItWorksPageJsonLd(faqs: FaqItem[]): JsonLd[] {
  const pageUrl = absolutePath(HOW_IT_WORKS_SEO.path)
  return [
    organizationJsonLd(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': pageUrl,
      url: pageUrl,
      name: HOW_IT_WORKS_SEO.title,
      description: HOW_IT_WORKS_SEO.description,
      isPartOf: { '@id': `${site}/#website` },
      about: { '@id': `${site}/#product` },
    },
    faqPageJsonLd(faqs, pageUrl),
  ]
}

export function whoItsForPageJsonLd(faqs: FaqItem[]): JsonLd[] {
  const pageUrl = absolutePath(WHO_FOR_SEO.path)
  return [
    organizationJsonLd(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': pageUrl,
      url: pageUrl,
      name: WHO_FOR_SEO.title,
      description: WHO_FOR_SEO.description,
      isPartOf: { '@id': `${site}/#website` },
    },
    faqPageJsonLd(faqs, pageUrl),
  ]
}

export function seeHowPageJsonLd(): JsonLd[] {
  const pageUrl = absolutePath(SEE_HOW_SEO.path)
  return [
    organizationJsonLd(),
    {
      '@context': 'https://schema.org',
      '@type': ['SoftwareApplication', 'Product'],
      name: 'Cash Prophet interactive demos',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      url: pageUrl,
      description: SEE_HOW_SEO.description,
      image: ogImage,
      brand: { '@type': 'Brand', name: COMPANY_INFO.productName },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
        availability: 'https://schema.org/InStock',
        description: 'Free interactive demos — café, trades and leisure sample businesses',
      },
    },
  ]
}

export function blogIndexJsonLd(): JsonLd[] {
  const pageUrl = absolutePath(BLOG_INDEX_SEO.path)
  return [
    organizationJsonLd(),
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${pageUrl}#blog`,
      url: pageUrl,
      name: BLOG_INDEX_SEO.title,
      description: BLOG_INDEX_SEO.description,
      publisher: { '@id': `${site}/#organization` },
      inLanguage: 'en-GB',
    },
  ]
}

function estimateWordCount(post: BlogPost): number {
  let words = 0
  for (const section of post.sections) {
    if (section.type === 'p' || section.type === 'h2' || section.type === 'h3') {
      words += section.text.split(/\s+/).filter(Boolean).length
    } else if (section.type === 'ul') {
      words += section.items.join(' ').split(/\s+/).filter(Boolean).length
    } else if (section.type === 'faq') {
      for (const item of section.items) {
        words += `${item.q} ${item.a}`.split(/\s+/).filter(Boolean).length
      }
    }
  }
  return words
}

export function articleJsonLd(post: BlogPost): JsonLd {
  const articleUrl = absolutePath(`/blog/${post.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': ['Article', 'BlogPosting'],
    '@id': `${articleUrl}#article`,
    headline: post.title,
    description: post.metaDescription,
    image: [ogImage],
    datePublished: `${post.publishedAt}T09:00:00Z`,
    dateModified: `${post.updatedAt}T09:00:00Z`,
    inLanguage: 'en-GB',
    articleSection: post.category,
    keywords: post.keywords.join(', '),
    wordCount: estimateWordCount(post),
    author: {
      '@type': 'Organization',
      name: COMPANY_INFO.legalName,
      url: site,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${site}/#organization`,
      name: COMPANY_INFO.productName,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    isPartOf: {
      '@type': 'Blog',
      '@id': `${absolutePath('/blog')}#blog`,
    },
  }
}

export function blogPostJsonLd(post: BlogPost): JsonLd[] {
  const graphs: JsonLd[] = [organizationJsonLd(), articleJsonLd(post)]
  const faqSection = post.sections.find((section) => section.type === 'faq')
  if (faqSection && faqSection.type === 'faq') {
    graphs.push(faqPageJsonLd(faqSection.items, absolutePath(`/blog/${post.slug}`)))
  }
  return graphs
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolutePath(item.path),
    })),
  }
}
