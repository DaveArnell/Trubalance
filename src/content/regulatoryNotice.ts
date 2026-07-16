import { COMPANY_INFO } from './companyInfo'

/** Shared regulatory / disclaimer copy — Terms, Privacy, footer. Not legal advice. */
export const REGULATORY_POSITION = {
  shortFooter:
    'Planning tool only — not FCA-regulated advice, accounting, or tax services.',
  termsHeading: 'Regulatory position',
  termsBody: [
    `${COMPANY_INFO.productName} is a cash planning and visibility tool for business owners. It helps you model balances, commitments, reserves, and expected receipts based on information you enter.`,
    'It is not accounting software and does not prepare statutory accounts or tax returns. It does not provide regulated financial advice, investment advice, or credit broking.',
    `${COMPANY_INFO.productName} is operated by ${COMPANY_INFO.legalName}. We are not authorised or regulated by the Financial Conduct Authority (FCA) for the service as it stands today: we do not hold client money, move money on your behalf, or connect to your bank accounts automatically.`,
    'You remain responsible for how you use the figures shown and for decisions about spending, tax, and compliance. Where professional advice is needed, speak to your accountant or other qualified adviser.',
    'If we add regulated features in future (for example open banking or payment initiation), we will update this notice and our terms before they go live.',
  ],
  privacyDataNote:
    'Signing in with Google or email means we hold account details (such as your email address) and the workspace figures you choose to enter. That is personal data under UK GDPR — see “Your rights” below. We do not sell your data.',
} as const
