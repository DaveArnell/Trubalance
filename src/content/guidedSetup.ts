import type { SuggestionCategory, SuggestionDestination } from '../bankImport/types'

export type GuidedSetupPath = 'choose' | 'auto' | 'ai' | 'manual'

export const GUIDED_SETUP_EDITABLE_NOTE =
  'Nothing is locked. Everything can be changed later. You can always review and edit in Settings.'

export const GUIDED_SETUP_PATH_OPTIONS = [
  {
    id: 'manual' as const,
    title: 'Manual setup',
    badge: 'Recommended',
    subtitle: 'Enter your numbers yourself',
    lead: 'Add your business, bank balances, and regular monthly costs step by step. Best if you already know your bills or want full control from the start.',
    timeEstimate: '15–20 minutes',
    highlights: [
      'Same end result as assisted setup',
      'No bank statement guessing',
      'You can import statements later in Settings when ready',
    ],
  },
  {
    id: 'auto' as const,
    title: 'Set it up for me',
    badge: 'Preview',
    subtitle: 'Bank import — still being improved',
    lead: 'Upload a statement and we suggest regular monthly outgoings from your history. Only confident monthly patterns are added — not due bills or one-offs.',
    timeEstimate: 'About 2 minutes',
    highlights: [
      'PDF or CSV bank statements',
      'Adds regular monthly costs only',
      'Review and edit everything in Settings afterwards',
    ],
  },
  {
    id: 'ai' as const,
    title: 'Review before adding',
    subtitle: 'Check each suggestion first',
    lead: 'Upload your transaction history and approve each regular monthly outgoing before it is added.',
    timeEstimate: '5–10 minutes',
    highlights: [
      'Upload a PDF or CSV for each bank account',
      'Accept, edit, or ignore each suggestion',
      'Monthly outgoings only — no due bills from history',
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
  outflowCount?: number
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
    if ((input.transactionCount ?? 0) > 0 && input.outflowCount === 0) {
      return `We read ${input.transactionCount} line${input.transactionCount === 1 ? '' : 's'} from your statement but none were recognised as payments out — amounts may have been misread from the PDF. Try exporting CSV from your bank, or re-upload the PDF after this update.`
    }
    const txn =
      input.transactionCount != null
        ? ` We read ${input.transactionCount} transaction${input.transactionCount === 1 ? '' : 's'} (${input.outflowCount ?? 0} outgoing) but`
        : ' We'
    return `${txn.trim()} did not spot repeating outgoing payments (need at least 2 similar payments to the same payee). Try minimum monthly 0 to include smaller costs, or add items manually.`
  }

  if (input.statementsAnalysed > 0 && (input.skippedLowConfidence ?? 0) > 0 && (input.autoAddCount ?? 0) === 0) {
    return `We found ${input.suggestionsFound} repeating payment${input.suggestionsFound === 1 ? '' : 's'} but none were clear enough monthly costs to add automatically. Review them in Settings → Bank import, or add monthly costs manually in Committed Funds.`
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

/** Shown in bank import review — historic statements only feed monthly accruing costs. */
export const SUGGESTION_DESTINATION_OPTIONS: {
  value: SuggestionDestination
  label: string
}[] = [
  { value: 'building_commitment', label: 'Regular monthly outgoing' },
  { value: 'ignore', label: 'Ignore' },
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
