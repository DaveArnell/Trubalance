import { useEffect } from 'react'
import { COMPANY_INFO } from '../../content/companyInfo'

interface MarketingJsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>
}

/** Injects JSON-LD structured data for marketing pages (client-side). */
export function MarketingJsonLd({ data }: MarketingJsonLdProps) {
  const serialized = JSON.stringify(data)
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-marketing-jsonld', 'true')
    script.textContent = serialized
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [serialized])

  return null
}

export function homePageJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: COMPANY_INFO.productName,
      legalName: COMPANY_INFO.legalName,
      url: COMPANY_INFO.website,
      email: COMPANY_INFO.contactEmail,
      address: {
        '@type': 'PostalAddress',
        streetAddress: COMPANY_INFO.registeredAddressLines[0],
        addressLocality: COMPANY_INFO.registeredAddressLines[1],
        postalCode: COMPANY_INFO.registeredAddressLines[2],
        addressCountry: 'GB',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: COMPANY_INFO.productName,
      url: COMPANY_INFO.website,
      description:
        'Cash clarity for UK small business owners — know what is genuinely yours after commitments and tax reserves.',
      publisher: { '@type': 'Organization', name: COMPANY_INFO.legalName },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: COMPANY_INFO.productName,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
        description: 'Founder lifetime access during early access',
      },
      description:
        'Shows UK business owners what cash is genuinely available after committed funds, VAT, tax reserves, and expected receipts.',
    },
  ]
}
