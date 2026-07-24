/** Public company details — aligned with vocatio.io legal pages. */
export const COMPANY_INFO = {
  legalName: 'Vocatio Ltd',
  productName: 'Cash Prophet',
  companyNumber: '17089857',
  vatNumber: 'GB 516647086',
  registeredAddressLines: ['15 Springhill Close', 'Swindon', 'SN5 7BG'],
  contactEmail: 'admin@vocatio.io',
  /**
   * Live canonical origin today.
   * Planned cutover: https://cashprophet.co.uk (confirm spelling before switching DNS + this value).
   */
  website: 'https://truebalanceapp.io',
  /** Future production domain — keep in sync when DNS/Vercel/Supabase redirect URLs change. */
  plannedWebsite: 'https://cashprophet.co.uk',
  parentWebsite: 'https://vocatio.io',
  jurisdiction: 'England and Wales',
} as const

export function companyRegistrationLine(): string {
  return `${COMPANY_INFO.legalName} · Company No. ${COMPANY_INFO.companyNumber} · VAT ${COMPANY_INFO.vatNumber}`
}

export function registeredAddressBlock(): string {
  return COMPANY_INFO.registeredAddressLines.join(', ')
}
