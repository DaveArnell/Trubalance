import type { CompanyReferencePreset, DiaryReminderTemplate } from '../types'

export const COMPANY_REFERENCE_PRESETS: CompanyReferencePreset[] = [
  { id: 'company-number', label: 'Company number', placeholder: 'e.g. 12345678' },
  { id: 'vat-number', label: 'VAT registration number', placeholder: 'e.g. GB123456789' },
  { id: 'paye-reference', label: 'PAYE reference', placeholder: 'e.g. 123/AB45678' },
  { id: 'accounts-office', label: 'Accounts Office reference', placeholder: 'e.g. 123PA00012345' },
  { id: 'utr', label: 'UTR (Unique Taxpayer Reference)', placeholder: '10-digit number' },
  { id: 'corporation-tax', label: 'Corporation Tax reference', placeholder: 'e.g. 1234567890' },
  { id: 'pension-scheme', label: 'Pension scheme reference', placeholder: 'Provider reference' },
  { id: 'companies-house-auth', label: 'Companies House authentication code', placeholder: '6 characters' },
  { id: 'hmrc-gateway', label: 'HMRC Government Gateway ID', placeholder: 'User ID (not password)' },
  { id: 'accountant', label: 'Accountant contact', placeholder: 'Name, firm, phone' },
  { id: 'bank-operating', label: 'Main operating account', placeholder: 'Sort code & account number' },
]

export const DIARY_REMINDER_TEMPLATES: DiaryReminderTemplate[] = [
  {
    id: 'vat-quarterly',
    title: 'VAT return & payment',
    category: 'tax',
    notes: 'Quarterly VAT return and payment to HMRC.',
    recurring: 'yearly',
    monthOffset: 0,
    dayOfMonth: 7,
  },
  {
    id: 'paye-monthly',
    title: 'PAYE / NIC payment to HMRC',
    category: 'tax',
    notes: 'Monthly PAYE and National Insurance payment.',
    recurring: 'yearly',
    monthOffset: 0,
    dayOfMonth: 22,
  },
  {
    id: 'corporation-tax',
    title: 'Corporation Tax payment',
    category: 'tax',
    notes: 'Corporation Tax due — check your CT600 filing period.',
    recurring: 'yearly',
    monthOffset: 8,
    dayOfMonth: 1,
  },
  {
    id: 'annual-accounts',
    title: 'Annual accounts filing deadline',
    category: 'companies-house',
    notes: 'File annual accounts with Companies House.',
    recurring: 'yearly',
    monthOffset: 8,
    dayOfMonth: 30,
  },
  {
    id: 'confirmation-statement',
    title: 'Confirmation statement (CS01)',
    category: 'companies-house',
    notes: 'Annual confirmation statement due at Companies House.',
    recurring: 'yearly',
    monthOffset: 10,
    dayOfMonth: 15,
  },
  {
    id: 'pension-re-enrolment',
    title: 'Pension auto-enrolment re-enrolment',
    category: 'hr-pensions',
    notes: 'Re-assess eligible staff and re-enrol — typically every 3 years.',
    recurring: 'yearly',
    monthOffset: 2,
    dayOfMonth: 1,
  },
  {
    id: 'insurance-renewal',
    title: 'Business insurance renewal',
    category: 'insurance',
    notes: 'Employers liability, public liability, or combined policy renewal.',
    recurring: 'yearly',
    monthOffset: 0,
    dayOfMonth: 1,
  },
  {
    id: 'self-assessment',
    title: 'Self Assessment registration / payment',
    category: 'tax',
    notes: 'Self Assessment deadline — 31 January for prior tax year.',
    recurring: 'yearly',
    monthOffset: 0,
    dayOfMonth: 31,
  },
  {
    id: 'riddor-review',
    title: 'Health & safety review',
    category: 'general',
    notes: 'Annual risk assessment and RIDDOR reporting check.',
    recurring: 'yearly',
    monthOffset: 5,
    dayOfMonth: 1,
  },
  {
    id: 'year-end-prep',
    title: 'Year-end accounts preparation',
    category: 'general',
    notes: 'Gather records for your accountant before year-end.',
    recurring: 'yearly',
    monthOffset: 2,
    dayOfMonth: 15,
  },
]

export const DIARY_CATEGORY_LABELS: Record<string, string> = {
  tax: 'Tax & HMRC',
  'companies-house': 'Companies House',
  'hr-pensions': 'HR & pensions',
  insurance: 'Insurance',
  general: 'General',
}

export const BUSINESS_HUB_HELP = {
  vault:
    'Store company numbers, VAT and PAYE references, and other IDs you look up often. Scoped to each business — switch scope in the sidebar.',
  diary:
    'Deadlines and renewals stay in the list until you clear them. Overdue items show in red; upcoming dates sort closest first. Change a date inline — past dates move to Overdue. Clear with Remove or roll forward to the same date next year.',
}
