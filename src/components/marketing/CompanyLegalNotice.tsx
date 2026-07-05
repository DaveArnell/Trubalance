import { COMPANY_INFO, companyRegistrationLine, registeredAddressBlock } from '../../content/companyInfo'

interface CompanyLegalNoticeProps {
  variant?: 'footer' | 'inline' | 'legal'
}

export function CompanyLegalNotice({ variant = 'footer' }: CompanyLegalNoticeProps) {
  const registration = companyRegistrationLine()
  const address = registeredAddressBlock()

  if (variant === 'inline') {
    return (
      <p className="company-legal-notice company-legal-notice--inline muted">
        {COMPANY_INFO.productName} is owned and operated by {COMPANY_INFO.legalName}. {registration}.
      </p>
    )
  }

  if (variant === 'legal') {
    return (
      <aside className="company-legal-notice company-legal-notice--legal">
        <p>
          <strong>{COMPANY_INFO.legalName}</strong> ({COMPANY_INFO.productName})
        </p>
        <p>Company number: {COMPANY_INFO.companyNumber}</p>
        <p>VAT: {COMPANY_INFO.vatNumber}</p>
        <p>Registered office: {address}</p>
        <p>
          Email:{' '}
          <a href={`mailto:${COMPANY_INFO.contactEmail}`}>{COMPANY_INFO.contactEmail}</a>
        </p>
      </aside>
    )
  }

  return (
    <div className="company-legal-notice company-legal-notice--footer">
      <p className="company-legal-notice-operator">
        {COMPANY_INFO.productName} is owned and operated by {COMPANY_INFO.legalName}.
      </p>
      <p className="company-legal-notice-registration muted">{registration}</p>
      <p className="company-legal-notice-address muted">Registered office: {address}</p>
      <p className="company-legal-notice-contact muted">
        <a href={`mailto:${COMPANY_INFO.contactEmail}`}>{COMPANY_INFO.contactEmail}</a>
      </p>
    </div>
  )
}
