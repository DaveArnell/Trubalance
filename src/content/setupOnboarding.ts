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
    title: 'Why Cash Prophet exists',
    explain:
      'Your bank balance only shows what’s in the account. It doesn’t show rent, wages, VAT or tax already spoken for.\n\nCash Prophet keeps those commitments in the picture, so Available is a number you can actually decide from.',
  },
  {
    id: 'business',
    title: 'Your businesses and accounts',
    explain:
      'Add the businesses and venues you want to track, plus their bank accounts.\n\nInclude a separate savings account for reserves — ideally one that pays a decent interest rate. That’s where monthly VAT and tax transfers will go. Keep it simple; you can add more later.',
  },
  {
    id: 'committed-explain',
    title: 'How known costs build',
    explain:
      'Regular bills like rent and wages build a little every day. When the due date arrives, they move to Due until you mark them Paid.\n\nWatch the short demo below.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'month-view',
    title: 'Month view',
    explain:
      'Month view shows how committed money builds through the month and drops when bills are paid. Drag the chart to shift the period — useful for spotting tight weeks.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'due-explain',
    title: 'Due — ready to pay',
    explain:
      'Monthly bills land here when they’re due, and stay until you mark Paid.\n\nYou can also add one-off costs with a future date: earmark the full amount now, or build up a little each day until that date.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="due"]',
  },
  {
    id: 'receipts-explain',
    title: 'Expected receipts',
    explain:
      'Add money you know is coming in. It stays in the picture until you mark it Received.\n\nFor a future date you can count it all now, or build it up day by day.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="expected-receipts"]',
  },
  {
    id: 'reserve',
    title: 'Reserve — separate savings account',
    explain:
      'VAT, insurance and tax arrive in lumps. Keep that money in a separate savings account — not your current account. A higher-interest savings account is ideal so it earns while it waits.\n\nThe Reserve Planner turns those bills into one monthly transfer amount. Each month you move that amount into the reserve account.\n\nDrag the outlook chart to rotate the year. Try the check-in below when you’re ready.',
    page: 'reserve-planner',
    spotlight: '[data-tour="reserve-planner-month"]',
    skippable: true,
  },
  {
    id: 'trends-explain',
    title: 'Trends',
    explain:
      'Trends charts your balance, committed costs and Available over time — so you can see whether things are heading up or down.',
    page: 'trends',
    spotlight: '[data-widget-id="trends-chart"]',
  },
  {
    id: 'forecast-explain',
    title: 'Forecast',
    explain:
      'Because your income arrives in lumps, Forecast looks ahead at money out and money in — useful for spotting quiet weeks early.',
    page: 'forecast',
    spotlight: '[data-widget-id="forecast-cash-outlook"]',
    lumpyOnly: true,
  },
  {
    id: 'handoff',
    title: 'Set it up on your dashboard',
    explain:
      'You’ve seen how it works. Next we’ll open your live dashboard and walk you through balances, monthly costs, due items and receipts — then your reserve plan.',
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
