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

export const SETUP_ONBOARDING_STEPS: SetupOnboardingStep[] = [
  {
    id: 'why',
    title: 'What True Balance does for you.',
    explain:
      'Your bank balance isn’t all yours. Some of it already belongs to rent, wages, and other bills. True Balance subtracts what’s spoken for, so you always see what’s genuinely left to spend.',
  },
  {
    id: 'business',
    title: "Let's set up what you want to track.",
    explain:
      'Add your businesses, venues, and accounts. You can change this later in Settings.',
  },
  {
    id: 'cash',
    title: 'Now add the money you can see.',
    explain:
      'Enter today’s balances for your accounts. True Balance uses these as the starting point.',
  },
  {
    id: 'committed',
    title: "Now let's account for money that's already spoken for.",
    explain:
      'Tick the regular bills you recognise — rent, payroll, and so on. You can add more later.',
  },
  {
    id: 'committed-explain',
    title: 'How accruing costs work.',
    explain:
      'Regular bills build up a little every day through the month. When the due date hits, they move to Due and stay there until you mark them Paid. Watch the demo below.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'month-view',
    title: 'See the pattern — Month View.',
    explain:
      'Month view shows how committed money builds through the month and drops when bills are paid. Use it to see when cash is tightest.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'due-explain',
    title: 'Due — when it’s time to pay.',
    explain:
      'Monthly bills land here when they’re due. They stay until you mark them Paid.\n\nYou can also add one-off costs with a future date. Choose either:\n\nEarmark now — take the full amount out of True Balance today.\n\nBuild up — set a little aside each day until that date.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="due"]',
  },
  {
    id: 'receipts-explain',
    title: 'Expected Receipts — money coming in.',
    explain:
      'Add money you know is coming (invoices, grants, refunds). It stays here until you mark it Received.\n\nFor a future date, choose either:\n\nCount it all now — if you’re sure it’s coming.\n\nBuild up — a little each day until it arrives.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="expected-receipts"]',
  },
  {
    id: 'reserve',
    title: "Now let's protect you from the big bills.",
    explain:
      'Big bills like VAT and corporation tax need saving for. The Reserve Planner tells you how much to move into savings each month.\n\nBuffer is spare cash for if a bill comes in higher than planned. Add one if you want a safety cushion.\n\nThe example below is a new month — see how much to transfer, then click Set up now to make your own plan.',
    page: 'reserve-planner',
    spotlight: '[data-tour="reserve-planner-month"]',
    skippable: true,
  },
  {
    id: 'trends-explain',
    title: 'Track your progress over time.',
    explain:
      'Trends shows your bank balance, committed costs, and True Balance on a chart — so you can see if things are going up or down.\n\nIt gets clearer the longer you use the app. Keep updating balances and marking bills paid, and the picture fills in.',
    page: 'trends',
    spotlight: '[data-widget-id="trends-chart"]',
  },
  {
    id: 'forecast-explain',
    title: 'See what’s coming up.',
    explain:
      'Forecast looks ahead at money going out and money coming in. Use it to spot tight weeks before they hit.',
    page: 'forecast',
    spotlight: '[data-widget-id="forecast-cash-outlook"]',
  },
  {
    id: 'reveal',
    title: "Here's your True Balance.",
    explain:
      'Your bank balance isn’t all yours — some of it is already spoken for. True Balance is what’s left. That’s the number to trust.',
    page: 'committed-funds',
    spotlight: '[data-tour="overview-hero"]',
  },
  {
    id: 'accuracy',
    title: 'Keep it alive — here’s your routine.',
    explain:
      'Update bank balances regularly. Mark bills Paid when you pay them. Once a month, check the Reserve Planner. That’s the habit — the app does the rest.',
    page: 'committed-funds',
    spotlight: '[data-tour="overview-balances"]',
  },
]

export const INCOME_PATTERN_HINTS: Record<'steady' | 'lumpy', string> = {
  steady:
    'Because your income comes in steadily, Trends will show you clearly whether you\'re heading up or down over time. Keep your balance fresh and you\'ll spot problems early. The Cash Outlook shows scheduled outgoings — your real balance will always be higher than it shows.',
  lumpy:
    'Because your income arrives in larger chunks, add Expected Receipts with dates when you know money is coming. This lets the Cash Outlook show you when money will be tight and when it arrives — so you can plan around gaps.',
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
  committed: 'Commitments',
  'committed-explain': 'Accruing',
  'month-view': 'Month view',
  'due-explain': 'Due costs',
  'receipts-explain': 'Receipts',
  reserve: 'Reserve',
  'trends-explain': 'Trends',
  'forecast-explain': 'Forecast',
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
