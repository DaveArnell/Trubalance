import type { PageId } from '../navigation'
import type { IncomePattern } from '../types'

export interface SetupOnboardingStep {
  id: string
  title: string
  explain: string
  /** Navigate here while this step is active */
  page?: PageId
  /** CSS selector to highlight on the dashboard while this step is active */
  spotlight?: string
  skippable?: boolean
  /** Only include when income pattern is lumpy */
  lumpyOnly?: boolean
}

/**
 * Teach-first flow: intro → structure → concept demos → hand off to the live dashboard.
 * Data entry (balances, costs, receipts, reserve) continues via the setup tour on the app.
 */
export const SETUP_ONBOARDING_STEPS: SetupOnboardingStep[] = [
  {
    id: 'why',
    title: 'What Available is.',
    explain:
      'Your bank balance isn’t all spendable — some of it already belongs to bills. Available shows what’s left after money that’s spoken for.\n\nWatch the short intro below when it’s ready, then we’ll set up your structure.',
  },
  {
    id: 'business',
    title: 'Your businesses and accounts.',
    explain:
      'Add the businesses and venues you want to track, plus their bank accounts.\n\nInclude a separate savings account for reserves — Cash Prophet needs somewhere real for the monthly VAT/tax transfers to go. Keep it simple; you can add more accounts later.',
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
      'Monthly bills land here when they’re due, and stay until you mark Paid.\n\nYou can also add one-off costs with a future date:\n\nEarmark now — take the full amount out of Available today.\n\nBuild up — set a little aside each day until that date.',
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
    title: 'Reserve — a separate savings account.',
    explain:
      'Some costs land in lumps — VAT, insurance, tax. Keep those in a separate savings account (not your current account).\n\nThe Reserve Planner turns them into a monthly transfer amount. Each month you move that amount into the reserve account so the money is ready when the bill arrives.\n\nTry the check-in below: tick Transfer done, confirm, and you’ll see the new reserve balance.',
    page: 'reserve-planner',
    spotlight: '[data-tour="reserve-planner-month"]',
    skippable: true,
  },
  {
    id: 'trends-explain',
    title: 'Trends.',
    explain:
      'Trends charts your balance, committed costs, and Available over time — so you can see if things are going up or down.',
    page: 'trends',
    spotlight: '[data-widget-id="trends-chart"]',
  },
  {
    id: 'forecast-explain',
    title: 'Forecast.',
    explain:
      'Because income arrives in lumps for you, Forecast looks ahead at money out and money in — useful for spotting quiet weeks early.',
    page: 'forecast',
    spotlight: '[data-widget-id="forecast-cash-outlook"]',
    lumpyOnly: true,
  },
  {
    id: 'handoff',
    title: 'Now set it up on your dashboard.',
    explain:
      'You’ve seen how it works. Next we’ll open your live dashboard and walk you through adding balances, monthly costs, due items, and receipts — then your reserve plan.',
    page: 'committed-funds',
  },
]

export function getSetupOnboardingSteps(incomePattern: IncomePattern): SetupOnboardingStep[] {
  return SETUP_ONBOARDING_STEPS.filter(
    (step) => !step.lumpyOnly || incomePattern === 'lumpy',
  )
}

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
  'committed-explain': 'Accruing',
  'month-view': 'Month view',
  'due-explain': 'Due costs',
  'receipts-explain': 'Receipts',
  reserve: 'Reserve',
  'trends-explain': 'Trends',
  'forecast-explain': 'Forecast',
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
