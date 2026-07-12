import type { SuggestionCategory, SuggestionDestination } from '../bankImport/types'

export type GuidedSetupPath = 'manual' | 'statement'

export const GUIDED_SETUP_EDITABLE_NOTE =
  'Nothing is locked. Everything can be changed later. You can always review and edit in Settings.'

export const GUIDED_SETUP_PATH_OPTIONS = [
  {
    id: 'manual' as const,
    title: 'Manual setup',
    badge: 'Recommended if you know your bills',
    subtitle: 'Enter your numbers yourself',
    lead: 'Add your business, bank balances, and regular monthly costs step by step.',
    timeEstimate: '15–20 minutes',
    highlights: [
      'Full control from the start',
      'No bank file needed',
      'You can upload statements later in Settings',
    ],
  },
  {
    id: 'statement' as const,
    title: 'Upload bank statements',
    badge: 'Assisted',
    subtitle: 'AI suggests — you approve everything',
    lead: 'Upload CSV or PDF exports. AI reads your history and suggests monthly costs, reserve bills and receipts. Nothing is added until you say yes.',
    timeEstimate: '10–15 minutes',
    highlights: [
      'CSV works best',
      'Review every suggestion',
      'Then finish setup manually for anything missed',
    ],
  },
] as const

export const STATEMENT_SETUP_STEPS = [
  { id: 'why', label: 'Why True Balance' },
  { id: 'structure', label: 'Your structure' },
  { id: 'import', label: 'Upload statements' },
  { id: 'review', label: 'Review suggestions' },
  { id: 'manual', label: 'Finish setup' },
  { id: 'complete', label: 'Your True Balance' },
] as const

export const WHY_TRUE_BALANCE_CONTENT = {
  title: 'One honest number',
  lead: 'Your bank balance hides money already spoken for and bigger bills building in the background.',
  bullets: [
    'See what is committed vs genuinely available',
    'Plan monthly savings for irregular bills like VAT and insurance',
  ],
} as const

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
