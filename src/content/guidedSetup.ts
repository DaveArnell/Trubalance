import type { SuggestionCategory, SuggestionDestination } from '../bankImport/types'

export type GuidedSetupPath = 'manual' | 'statement'

export const GUIDED_SETUP_EDITABLE_NOTE =
  'Nothing is locked. Everything can be changed later. You can always review and edit in Settings.'

export const GUIDED_SETUP_PATH_OPTIONS = [
  {
    id: 'statement' as const,
    title: 'Upload bank statements',
    badge: 'Faster start',
    subtitle: 'AI suggests — you approve everything',
    lead: 'Upload a CSV or PDF for this business. Cash Prophet suggests monthly costs and reserve bills. Nothing is added until you say yes.',
    timeEstimate: 'About 10–15 minutes',
    highlights: [
      'CSV or PDF from your bank',
      'Review and edit every suggestion',
      'One AI pass per business on the trial',
    ],
  },
  {
    id: 'manual' as const,
    title: 'Enter manually',
    badge: 'Full control',
    subtitle: 'Type your bills yourself',
    lead: 'Skip the upload and add monthly costs and reserve bills on the live screens after a short walkthrough.',
    timeEstimate: 'About 15–20 minutes',
    highlights: [
      'No bank file needed',
      'Full control from the start',
      'You can still edit everything later',
    ],
  },
] as const

export const STATEMENT_SETUP_STEPS = [
  { id: 'why', label: 'Why Cash Prophet' },
  { id: 'structure', label: 'Your structure' },
  { id: 'import', label: 'Upload statements' },
  { id: 'review', label: 'Review suggestions' },
  { id: 'manual', label: 'Finish setup' },
  { id: 'complete', label: 'Cash Prophet Balance' },
] as const

export const WHY_CASH_PROPHET_CONTENT = {
  title: 'Welcome to Cash Prophet',
  lead:
    'In this introduction we will help you set up your company structure, talk you through how Cash Prophet works, and then take you onto the screens to get you started.',
  bullets: [
    'Set up your business, sites and bank accounts',
    'Add bills from a statement upload or by hand',
    'Walk through how Cash Prophet keeps commitments in view',
    'Show you each main screen as we go',
  ],
} as const

/** @deprecated Use WHY_CASH_PROPHET_CONTENT */
export const WHY_TRUE_BALANCE_CONTENT = WHY_CASH_PROPHET_CONTENT

export const RESERVE_BUFFER_HINT =
  'Optional cushion in your reserve account if a bill comes in higher than expected. You can change this anytime.'

export const LOW_CONFIDENCE_CATEGORY_OPTIONS: { value: SuggestionCategory; label: string }[] = [
  { value: 'supplier', label: 'Supplier / cost' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'hmrc', label: 'HMRC / tax' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'loan', label: 'Loan / finance' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'other', label: 'Other' },
]

export const SUGGESTION_DESTINATION_OPTIONS: { value: SuggestionDestination; label: string }[] = [
  { value: 'building_commitment', label: 'Monthly accruing cost' },
  { value: 'reserve_bill', label: 'Reserve planner bill' },
  { value: 'expected_receipt', label: 'Expected receipt' },
  { value: 'ignore', label: 'Ignore' },
]
