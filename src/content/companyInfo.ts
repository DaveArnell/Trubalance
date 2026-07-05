/** Public company details — aligned with vocatio.io legal pages. */
export const COMPANY_INFO = {
  legalName: 'Vocatio Ltd',
  productName: 'True Balance',
  companyNumber: '17089857',
  vatNumber: 'GB 516647086',
  registeredAddressLines: ['15 Springhill Close', 'Swindon', 'SN5 7BG'],
  contactEmail: 'admin@vocatio.io',
  website: 'https://truebalanceapp.io',
  parentWebsite: 'https://vocatio.io',
  jurisdiction: 'England and Wales',
} as const

export function companyRegistrationLine(): string {
  return `${COMPANY_INFO.legalName} · Company No. ${COMPANY_INFO.companyNumber} · VAT ${COMPANY_INFO.vatNumber}`
}

export function registeredAddressBlock(): string {
  return COMPANY_INFO.registeredAddressLines.join(', ')
}
