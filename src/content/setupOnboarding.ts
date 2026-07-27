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
    title: 'One number you can trust',
    videoLabel: 'What Cash Prophet is for',
    explain:
      'Your bank balance only shows what is sitting in the account. Cash Prophet accounts for commitments already spoken for — and gives you a Cash Prophet Balance you can trust.',
  },
  {
    id: 'business',
    title: 'Your company structure',
    videoLabel: 'Businesses, venues and accounts',
    explain:
      'Add each business you want to track, then venues and accounts. Keep a separate savings account for reserves such as VAT, tax and insurance.',
  },
  {
    id: 'committed-explain',
    title: 'Monthly costs that build',
    videoLabel: 'How accruing costs work',
    explain:
      'Regular costs like rent and wages build a little every day toward the month’s total. On the due date they move into Due until you mark them paid.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'month-view',
    title: 'Month view',
    videoLabel: 'Reading the month chart',
    explain:
      'See how committed money builds through the month and drops when bills are paid — so tight weeks show up early.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'due-explain',
    title: 'Due',
    videoLabel: 'Paying what is ready',
    explain:
      'Anything ready to pay lands here — monthly costs on their due date, plus one-offs you have earmarked. Mark paid once the money has left the account.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="due"]',
  },
  {
    id: 'receipts-explain',
    title: 'Expected receipts',
    videoLabel: 'Money you know is coming',
    explain:
      'Add income you are confident will arrive. Mark Received when it lands so your Cash Prophet Balance stays honest.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="expected-receipts"]',
  },
  {
    id: 'reserve',
    title: 'Reserve Planner',
    videoLabel: 'Funding VAT and big bills',
    explain:
      'VAT, insurance and similar bills arrive in lumps. List them here and Cash Prophet turns that into a steady monthly transfer into savings.',
    page: 'reserve-planner',
    spotlight: '[data-tour="reserve-planner-month"]',
    skippable: true,
  },
  {
    id: 'trends-explain',
    title: 'Trends',
    videoLabel: 'Your balance over time',
    explain:
      'Each time you save balances, that day is logged. Trends shows whether your Cash Prophet Balance is heading up or down.',
    page: 'trends',
    spotlight: '[data-widget-id="trends-chart"]',
  },
  {
    id: 'statement-helper',
    title: 'Speed up with a transaction log',
    explain:
      'Optional but powerful: download a transaction export for this business, copy our prompt into your own ChatGPT, and get a draft list of monthly costs and Reserve Planner bills to type in.',
    hideVideo: true,
    skippable: true,
  },
  {
    id: 'handoff',
    title: 'Add your numbers',
    videoLabel: 'What to do on the dashboard',
    explain:
      'Open the dashboard next. Enter today’s balances, then your monthly costs and reserve bills — from the ChatGPT draft if you used it, or by hand.',
    page: 'committed-funds',
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
  handoff: 'Your dashboard',
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
