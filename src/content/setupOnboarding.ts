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
    title: 'Welcome to Cash Prophet',
    videoLabel: 'Welcome to Cash Prophet',
    explain:
      'In this introduction we will help you set up your company structure, talk you through how Cash Prophet works, and then take you onto the screens to get you started.',
  },
  {
    id: 'business',
    title: 'Businesses, sites and accounts',
    videoLabel: 'Businesses, sites and accounts',
    explain:
      'Start with the business you want to track. Add sites if you have more than one. Add every current and savings account the business holds, so Cash Prophet can see all the money you have in the bank. Do not add a reserve account here. That is linked later when you set up the Reserve Planner.',
  },
  {
    id: 'committed-explain',
    title: 'Monthly costs that build',
    videoLabel: 'How monthly costs build',
    explain:
      'Costs that come round every month, such as rent, wages and similar, build a little each day toward the month’s total. That way your Cash Prophet Balance already reflects them before payday.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'month-view',
    title: 'The month at a glance',
    videoLabel: 'Reading the month chart',
    explain:
      'This chart shows committed money rising through the month, then falling when you mark bills paid. It gives you insight into cash flow through the month, and how much money needs to be assigned at different points.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'due-explain',
    title: 'Ready to pay',
    videoLabel: 'Paying what is due',
    explain:
      'When a monthly cost reaches its due date, or you add a one-off you have set aside, it appears here. These amounts count as deductions from your bank balance when Cash Prophet calculates your Cash Prophet Balance.\n\nMark them paid once the money has left the account. If what you paid differs from the estimate, enter the real amount when you mark it paid so that period’s history matches what actually went out.',
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
      'VAT, insurance and other large bills that do not come every month are listed here. This method means you are always provisioning for them, month by month and day by day, so your Cash Prophet Balance stays a true reflection once those bills are accounted for.\n\nEach month, Cash Prophet tells you exactly how much to move into the reserve account, or how much you can transfer back out, depending on what is due. Follow that figure and the reserve stays on track.',
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
      'Optional. Download a transaction history for this business, paste our prompt into ChatGPT, and get a draft list of monthly costs and Reserve bills to type in.',
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
  why: 'Welcome',
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
