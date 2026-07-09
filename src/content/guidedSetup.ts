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
  { id: 'reserve', label: 'Reserve planner' },
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

export const RESERVE_PLANNER_SETUP_CONTENT = {
  title: 'Reserve planner',
  lead: 'Big bills like VAT, insurance, and corporation tax do not land every month — but you still need the money ready. The reserve planner helps you save a little each month so those bills never surprise you.',
  bullets: [
    'We add a reserve plan for each business in your group',
    'Annual and quarterly costs from your bank data can go straight into the plan',
    'A short monthly check-in keeps transfers on track (about 5 minutes)',
  ],
  optInLabel: 'Set up reserve planners for my businesses',
  optInHint:
    'Recommended if you have irregular or annual bills. You can turn this off and add reserve plans later in Settings.',
  skipHint: 'You can add reserve planners anytime from the Reserve Planner page.',
} as const

export function formatSetupApplySummary(input: {
  commitmentsCreated: number
  reserveBillsCreated: number
  receiptsCreated: number
  statementsAnalysed: number
  suggestionsFound: number
  transactionCount?: number
  autoAddCount?: number
  skippedLowConfidence?: number
  balancesUpdated: number
  reservePlannersEnabled: boolean
}): string {
  const parts = [
    input.commitmentsCreated > 0 ? `${input.commitmentsCreated} monthly costs` : null,
    input.reserveBillsCreated > 0 ? `${input.reserveBillsCreated} reserve bills` : null,
  ].filter(Boolean)

  if (parts.length > 0) {
    const balanceNote =
      input.balancesUpdated > 0
        ? ` Closing balance applied to ${input.balancesUpdated} account${input.balancesUpdated === 1 ? '' : 's'}.`
        : ''
    return `Added ${parts.join(', ')} from your bank data.${balanceNote} Adjust anything in Settings.`
  }

  if (input.statementsAnalysed > 0 && input.transactionCount === 0) {
    return 'We opened your statement but could not read any transactions. CSV exports usually work best; some PDF layouts are not supported yet.'
  }

  if (input.statementsAnalysed > 0 && input.suggestionsFound === 0) {
    const txn =
      input.transactionCount != null
        ? ` We read ${input.transactionCount} transaction${input.transactionCount === 1 ? '' : 's'} but`
        : ' We'
    return `${txn.trim()} did not spot repeating outgoing payments (need at least 2 similar payments to the same payee). Try lowering the minimum monthly filter to 0, or add costs manually.`
  }

  if (input.statementsAnalysed > 0 && (input.skippedLowConfidence ?? 0) > 0 && (input.autoAddCount ?? 0) === 0) {
    return `We found ${input.suggestionsFound} recurring pattern${input.suggestionsFound === 1 ? '' : 's'} but none were confident enough to add automatically. Use “Review before adding” next time, or add items manually.`
  }

  if (input.statementsAnalysed > 0) {
    return 'We analysed your statements but nothing was added automatically. Use Review setup or add items manually in Settings.'
  }

  if (input.reservePlannersEnabled) {
    return 'Your structure and reserve planners are ready. Add bank statements in Settings to auto-fill costs, or enter them manually.'
  }

  return 'Your structure is ready. Add bank statements (PDF or CSV) in Settings to auto-fill costs, or enter them manually.'
}

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
