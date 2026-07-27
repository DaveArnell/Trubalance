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
}

/**
 * Teach-first flow: short lessons → structure → concept demos → hand off to the live dashboard.
 * Data entry continues via the setup tour on the app.
 */
export const SETUP_ONBOARDING_STEPS: SetupOnboardingStep[] = [
  {
    id: 'why',
    title: 'One number you can trust',
    videoLabel: 'What Cash Prophet is for',
    explain:
      'Your bank balance only shows what is in the account. It does not show rent, wages, VAT or tax already spoken for.\n\nCash Prophet continuously accounts for those commitments and gives you a Cash Prophet Balance — so you can see where the business really stands.',
  },
  {
    id: 'business',
    title: 'Your company structure',
    videoLabel: 'Businesses, venues and accounts',
    explain:
      'Add the businesses and venues you want to track, then their current and savings accounts.\n\nUse a separate savings account for reserves — VAT, tax and insurance. You can change names and colours later in Settings.',
  },
  {
    id: 'committed-explain',
    title: 'Monthly costs that build',
    videoLabel: 'How accruing costs work',
    explain:
      'Regular bills like rent and wages build a little every day toward the month’s total.\n\nOn the due date they move into Due until you mark them paid.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'month-view',
    title: 'Month view',
    videoLabel: 'Reading the month chart',
    explain:
      'Month view shows how committed money builds through the month and drops when bills are paid.\n\nUse it to spot tight weeks before they arrive.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'due-explain',
    title: 'Due',
    videoLabel: 'Paying what is ready',
    explain:
      'Anything ready to pay lands here — monthly costs at their due date, plus one-offs you have earmarked.\n\nMark items paid once the money has left the account.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="due"]',
  },
  {
    id: 'receipts-explain',
    title: 'Expected receipts',
    videoLabel: 'Money you know is coming',
    explain:
      'Add income you are confident will arrive — invoices, grants, refunds.\n\nMark Received when the cash lands so your Cash Prophet Balance stays accurate.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="expected-receipts"]',
  },
  {
    id: 'reserve',
    title: 'Reserve Planner',
    videoLabel: 'Funding VAT and big bills',
    explain:
      'Irregular bills like VAT and insurance arrive in lumps. Keep that money in a savings account, not your everyday current account.\n\nList each bill and when it is due. Cash Prophet turns that into one monthly transfer target.',
    page: 'reserve-planner',
    spotlight: '[data-tour="reserve-planner-month"]',
    skippable: true,
  },
  {
    id: 'trends-explain',
    title: 'Trends',
    videoLabel: 'Your balance over time',
    explain:
      'Every time you save balances, that day is logged. Trends shows whether your Cash Prophet Balance is heading up or down.\n\nWrong day? Correct it in the balance log under the chart.',
    page: 'trends',
    spotlight: '[data-widget-id="trends-chart"]',
  },
  {
    id: 'handoff',
    title: 'Add your real numbers',
    videoLabel: 'What to do on the dashboard',
    explain:
      'You have seen how the pieces fit. Next we open your dashboard and walk you through entering balances, costs, due items and receipts — then your reserve plan if you want one.',
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
