import type { SuggestionCategory, SuggestionDestination } from '../bankImport/types'

export type GuidedSetupPath = 'choose' | 'ai' | 'manual'

export const GUIDED_SETUP_EDITABLE_NOTE =
  'Nothing is locked. Everything can be changed later. Suggestions only become real data after you approve them.'

export const GUIDED_SETUP_PATH_OPTIONS = [
  {
    id: 'ai' as const,
    title: 'Let True Balance build it for me',
    badge: 'Recommended',
    subtitle: 'Good if you do not want to work everything out manually',
    lead: 'Upload your transaction history and True Balance will look for recurring payments — monthly direct debits, subscriptions, and regular outgoings. It may also spot quarterly or annual bills based on patterns.',
    timeEstimate: '2–5 minutes',
    highlights: [
      'Upload a CSV for each bank account',
      'Review every suggestion before anything is added',
      'Rename, edit or ignore anything we detect',
    ],
  },
  {
    id: 'manual' as const,
    title: 'Manual setup',
    subtitle: 'Good if you already know your numbers',
    lead: 'Prefer to enter everything yourself? Add accounts, committed funds, and reserve planner items step by step.',
    timeEstimate: '20–30 minutes',
    highlights: [
      'Same end result as assisted setup',
      'Full control from the start',
      'You can still import statements later in Settings',
    ],
  },
] as const

export const AI_SETUP_STEPS = [
  { id: 'structure', label: 'Business & accounts' },
  { id: 'import', label: 'Upload statements' },
  { id: 'review', label: 'Review suggestions' },
  { id: 'complete', label: 'Your True Balance' },
] as const

export type AiSetupStepId = (typeof AI_SETUP_STEPS)[number]['id']

export const STATEMENT_HISTORY_TIPS = [
  {
    months: 12,
    text: '12 months of history helps identify most monthly and quarterly costs.',
  },
  {
    months: 24,
    text: '24 months of history can improve detection of annual bills.',
  },
] as const

/** All destinations shown in review — user must confirm. */
export const SUGGESTION_DESTINATION_OPTIONS: {
  value: SuggestionDestination
  label: string
}[] = [
  { value: 'building_commitment', label: 'Building commitment' },
  { value: 'due_commitment', label: 'Due commitment' },
  { value: 'planned_commitment', label: 'Planned commitment' },
  { value: 'reserve_bill', label: 'Reserve planner bill' },
  { value: 'expected_receipt', label: 'Expected receipt' },
  { value: 'ignore', label: 'Ignore / not relevant' },
]

/** Shown on low-confidence suggestions during review. */
export const LOW_CONFIDENCE_CATEGORY_OPTIONS: {
  value: SuggestionCategory
  label: string
}[] = [
  { value: 'subscription', label: 'Software / subscription' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'loan', label: 'Loan / finance' },
  { value: 'rent', label: 'Rent' },
  { value: 'payroll', label: 'Payroll / wages' },
  { value: 'hmrc', label: 'HMRC / tax' },
  { value: 'supplier', label: 'Supplier / cost' },
  { value: 'other', label: 'Other' },
]

export const MANUAL_SETUP_REASSURANCE =
  'Manual setup is a first-class path — nothing is restricted because you skipped assisted import.'
