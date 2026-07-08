import type { SuggestionCategory, SuggestionDestination } from '../bankImport/types'

export type GuidedSetupPath = 'choose' | 'auto' | 'ai' | 'manual'

export const GUIDED_SETUP_EDITABLE_NOTE =
  'Nothing is locked. Everything can be changed later. You can always review and edit in Settings.'

export const GUIDED_SETUP_PATH_OPTIONS = [
  {
    id: 'auto' as const,
    title: 'Set it up for me',
    badge: 'Fastest',
    subtitle: 'Structure + bank data — we fill in the rest',
    lead: 'Name your businesses, add bank data, and True Balance builds monthly costs, reserve planner bills, and your forecast. Tweak anything later.',
    timeEstimate: 'About 2 minutes',
    highlights: [
      'PDF or CSV bank statements work today',
      'No item-by-item review required',
      'Reserve planner and forecast filled automatically',
    ],
  },
  {
    id: 'ai' as const,
    title: 'Review before adding',
    badge: 'More control',
    subtitle: 'Check each suggestion before it is added',
    lead: 'Upload your transaction history and review every recurring payment before it becomes a commitment or reserve bill.',
    timeEstimate: '5–10 minutes',
    highlights: [
      'Upload a PDF or CSV for each bank account',
      'Accept, edit, or ignore each suggestion',
      'Good if you want to verify everything first',
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
  { id: 'why', label: 'Why True Balance' },
  { id: 'structure', label: 'Group structure' },
  { id: 'import', label: 'Upload statements' },
  { id: 'review', label: 'Review suggestions' },
  { id: 'complete', label: 'Your True Balance' },
] as const

export const AUTO_SETUP_STEPS = [
  { id: 'structure', label: 'Your structure' },
  { id: 'preferences', label: 'Income pattern' },
  { id: 'import', label: 'Bank data' },
  { id: 'complete', label: 'Ready' },
] as const

export type AiSetupStepId = (typeof AI_SETUP_STEPS)[number]['id']
export type AutoSetupStepId = (typeof AUTO_SETUP_STEPS)[number]['id']
export type SetupWizardStepId = AiSetupStepId | AutoSetupStepId

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
