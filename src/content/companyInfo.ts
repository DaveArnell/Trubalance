/** Public company details — aligned with vocatio.io legal pages. */
export const COMPANY_INFO = {
  legalName: 'Vocatio Ltd',
  productName: 'Cash Prophet',
  companyNumber: '17089857',
  vatNumber: 'GB 516647086',
  /** UK ICO data controller registration (organisation-level for Vocatio Ltd). */
  icoRegistrationNumber: 'CSN6799153',
  registeredAddressLines: ['15 Springhill Close', 'Swindon', 'SN5 7BG'],
  contactEmail: 'admin@vocatio.io',
  /** Canonical production origin (www — matches Vercel production domain). */
  website: 'https://www.cashprophet.co.uk',
  parentWebsite: 'https://vocatio.io',
  jurisdiction: 'England and Wales',
} as const

export function companyRegistrationLine(): string {
  return `${COMPANY_INFO.legalName} · Company No. ${COMPANY_INFO.companyNumber} · VAT ${COMPANY_INFO.vatNumber} · ICO ${COMPANY_INFO.icoRegistrationNumber}`
}

export function registeredAddressBlock(): string {
  return COMPANY_INFO.registeredAddressLines.join(', ')
}
