import type { PageId } from '../navigation'

export interface SetupOnboardingStep {
  id: string
  title: string
  explain: string
  /** Navigate here while this step is active */
  page?: PageId
  /** CSS selector to highlight on the dashboard while this step is active */
  spotlight?: string
  skippable?: boolean
}

/**
 * Flow: intro → structure → balances → teach the product → then set up one business
 * (monthly costs, planned costs, receipts, reserve) → wrap up.
 */
export const SETUP_ONBOARDING_STEPS: SetupOnboardingStep[] = [
  {
    id: 'why',
    title: 'What True Balance is.',
    explain:
      'Your bank balance isn’t all spendable — some of it already belongs to bills. True Balance shows what’s left after money that’s spoken for.\n\nWatch the short intro below when it’s ready, then we’ll set up your structure.',
  },
  {
    id: 'business',
    title: 'Your businesses and accounts.',
    explain:
      'Add the businesses and venues you want to track, plus their bank accounts. Keep it simple — you can add more later.',
  },
  {
    id: 'cash',
    title: 'Today’s bank balances.',
    explain:
      'Enter what’s in each account right now. That’s the starting point for True Balance.',
  },
  {
    id: 'committed-explain',
    title: 'How accruing costs work.',
    explain:
      'Regular bills (rent, wages) build up a little every day. When the due date hits, they move to Due until you mark them Paid. Watch the demo.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'month-view',
    title: 'Month view.',
    explain:
      'Month view shows how committed money builds through the month and drops when bills are paid — handy for spotting tight weeks.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'due-explain',
    title: 'Due — ready to pay.',
    explain:
      'Monthly bills land here when they’re due, and stay until you mark Paid.\n\nYou can also add one-off costs with a future date:\n\nEarmark now — take the full amount out of True Balance today.\n\nBuild up — set a little aside each day until that date.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="due"]',
  },
  {
    id: 'receipts-explain',
    title: 'Expected receipts — money in.',
    explain:
      'Add money you know is coming. It stays until you mark it Received.\n\nFor a future date: count it all now, or build up a little each day.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="expected-receipts"]',
  },
  {
    id: 'reserve',
    title: 'Reserve — big bills.',
    explain:
      'VAT and similar bills need saving for. The Reserve Planner says how much to move into savings each month.\n\nBuffer is optional spare cash if a bill comes in higher than planned.\n\nThe example is a new month — see the transfer, then set up your own when ready.',
    page: 'reserve-planner',
    spotlight: '[data-tour="reserve-planner-month"]',
    skippable: true,
  },
  {
    id: 'trends-explain',
    title: 'Trends.',
    explain:
      'Trends charts your balance, committed costs, and True Balance over time — so you can see if things are going up or down.',
    page: 'trends',
    spotlight: '[data-widget-id="trends-chart"]',
  },
  {
    id: 'forecast-explain',
    title: 'Forecast.',
    explain:
      'Forecast looks ahead at money out and money in. Use it to spot tight weeks early.',
    page: 'forecast',
    spotlight: '[data-widget-id="forecast-cash-outlook"]',
  },
  {
    id: 'committed',
    title: 'Add monthly bills for this business.',
    explain:
      'Pick the business you’re setting up. Tick the regular bills that apply — or type your own. You can add more later in the app.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'setup-planned',
    title: 'Any one-off costs?',
    explain:
      'Optional — tax, equipment, deposits. Skip if nothing applies yet.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="due"]',
  },
  {
    id: 'setup-receipts',
    title: 'Any money coming in?',
    explain:
      'Optional — invoices, grants, refunds you already know about.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="expected-receipts"]',
  },
  {
    id: 'setup-reserve',
    title: 'Set up your reserve plan.',
    explain:
      'Optional — add a buffer and big bills for this business. Skip and do it later if you prefer.',
    page: 'reserve-planner',
    spotlight: '[data-tour="reserve-planner-month"]',
    skippable: true,
  },
  {
    id: 'reveal',
    title: 'Here’s your True Balance.',
    explain:
      'Bank balance minus what’s spoken for. That’s the number to trust.',
    page: 'committed-funds',
    spotlight: '[data-tour="overview-hero"]',
  },
  {
    id: 'accuracy',
    title: 'Your simple routine.',
    explain:
      'Update balances. Mark bills Paid when you pay them. Check the Reserve Planner once a month. That’s it.',
    page: 'committed-funds',
    spotlight: '[data-tour="overview-balances"]',
  },
]

export const INCOME_PATTERN_HINTS: Record<'steady' | 'lumpy', string> = {
  steady:
    'Steady income: Trends will show whether you’re heading up or down. Keep balances fresh.',
  lumpy:
    'Irregular income: add Expected Receipts when you know money is coming, so Forecast can show the gaps.',
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
  cash: 'Balances',
  'committed-explain': 'Accruing',
  'month-view': 'Month view',
  'due-explain': 'Due costs',
  'receipts-explain': 'Receipts',
  reserve: 'Reserve',
  'trends-explain': 'Trends',
  'forecast-explain': 'Forecast',
  committed: 'Monthly bills',
  'setup-planned': 'One-offs',
  'setup-receipts': 'Money in',
  'setup-reserve': 'Your reserve',
  reveal: 'True Balance',
  accuracy: 'Your routine',
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
