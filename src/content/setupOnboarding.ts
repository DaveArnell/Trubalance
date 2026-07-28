import type { PageId } from '../navigation'

export interface SetupOnboardingStep {
  id: string
  title: string
  explain: string
  /** Shown under the video placeholder */
  videoLabel?: string
  /** Navigate here while this step is active */
  page?: PageId
  /** CSS selector to highlight on the dashboard while this step is active */
  spotlight?: string
  skippable?: boolean
  /** Hide the teaching video slot on this step */
  hideVideo?: boolean
}

/**
 * Teach-first flow → optional statement helper → hand off to the live dashboard.
 */
export const SETUP_ONBOARDING_STEPS: SetupOnboardingStep[] = [
  {
    id: 'why',
    title: 'Your bank balance isn’t the whole story',
    videoLabel: 'What Cash Prophet is for',
    explain:
      'It shows what is in the account today. It does not show money already spoken for — rent, wages, VAT and the rest. Cash Prophet keeps those in view and gives you a Cash Prophet Balance you can check with more confidence.',
  },
  {
    id: 'business',
    title: 'Businesses, sites and accounts',
    videoLabel: 'Businesses, sites and accounts',
    explain:
      'Start with the business you want to track. Add sites if you have more than one. Add the bank accounts you use day to day — and a savings account if you want to keep money aside for bigger bills.',
  },
  {
    id: 'committed-explain',
    title: 'Monthly costs that build',
    videoLabel: 'How monthly costs build',
    explain:
      'Costs that come round every month — rent, wages and similar — build a little each day toward the month’s total. That way your Cash Prophet Balance already reflects them before payday.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'month-view',
    title: 'The month at a glance',
    videoLabel: 'Reading the month chart',
    explain:
      'This chart shows committed money rising through the month, then falling when you mark bills paid. Use it to spot tight weeks before they arrive.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'due-explain',
    title: 'Ready to pay',
    videoLabel: 'Paying what is due',
    explain:
      'When a monthly cost reaches its due date — or you add a one-off you have set aside — it appears here. Mark it paid once the money has left the account.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="due"]',
  },
  {
    id: 'receipts-explain',
    title: 'Money you expect in',
    videoLabel: 'Expected receipts',
    explain:
      'Add income you are confident will arrive. Mark it received when it lands so your Cash Prophet Balance stays up to date.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="expected-receipts"]',
  },
  {
    id: 'reserve',
    title: 'Saving for big bills',
    videoLabel: 'Funding VAT and big bills',
    explain:
      'VAT, insurance and other large non-monthly bills are listed here. Cash Prophet turns them into a regular monthly amount to move into savings.',
    page: 'reserve-planner',
    spotlight: '[data-tour="reserve-planner-month"]',
    skippable: true,
  },
  {
    id: 'trends-explain',
    title: 'How you are travelling',
    videoLabel: 'Your balance over time',
    explain:
      'Each time you save balances, that day is stored. Trends shows whether your Cash Prophet Balance is moving up or down over time.',
    page: 'trends',
    spotlight: '[data-widget-id="trends-chart"]',
  },
  {
    id: 'statement-helper',
    title: 'Speed things up with a bank export',
    explain:
      'Optional. Download a transaction history for this business, paste our prompt into ChatGPT, and get a draft list of monthly costs and Reserve bills to type into Cash Prophet.',
    hideVideo: true,
    skippable: true,
  },
]

export function getSetupOnboardingSteps(): SetupOnboardingStep[] {
  return SETUP_ONBOARDING_STEPS
}

export const QUICK_COMMITMENT_TEMPLATES = [
  { id: 'payroll', name: 'Payroll' },
  { id: 'rent', name: 'Rent' },
  { id: 'paye', name: 'PAYE / HMRC' },
  { id: 'pension', name: 'Pension' },
  { id: 'card', name: 'Credit Card' },
  { id: 'utilities', name: 'Utilities' },
  { id: 'loan', name: 'Loan' },
  { id: 'other', name: 'Other' },
] as const

/** Short labels for setup wizard nav and admin funnel reporting. */
export const SETUP_ONBOARDING_STEP_LABELS: Record<string, string> = {
  why: 'Introduction',
  business: 'Structure',
  'committed-explain': 'Monthly costs',
  'month-view': 'Month view',
  'due-explain': 'Due',
  'receipts-explain': 'Receipts',
  reserve: 'Reserve',
  'trends-explain': 'Trends',
  'statement-helper': 'Transaction log',
}

export const SETUP_ONBOARDING_DISMISSED_KEY = 'trubalance-setup-onboarding-dismissed-v1'

export function wasSetupOnboardingDismissed(): boolean {
  try {
    return localStorage.getItem(SETUP_ONBOARDING_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissSetupOnboardingLocally() {
  try {
    localStorage.setItem(SETUP_ONBOARDING_DISMISSED_KEY, '1')
  } catch {
    /* ignore */
  }
}
