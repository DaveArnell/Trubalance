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
      'Your bank balance lies. Part of it already belongs to rent, payroll, and bills that haven\'t landed yet — and the bigger bills like VAT and insurance are quietly building up in the background. True Balance does two things: it tracks what\'s already spoken for so you always know what\'s genuinely yours, and it plans your savings for irregular bills so you\'re never caught out. The result is one honest number you can trust every single day.',
  },
  {
    id: 'business',
    title: "Let's set up what you want to track.",
    explain:
      'This is the foundation — everything else hangs off your business structure. Add businesses, venues, and accounts here. You can always change this later in Settings.',
  },
  {
    id: 'cash',
    title: 'Now add the money you can see.',
    explain:
      'Enter the current balances for your accounts below. This is your starting point — True Balance compares this number against what\'s committed to tell you what\'s genuinely yours.',
  },
  {
    id: 'committed',
    title: "Now let's account for money that's already spoken for.",
    explain:
      'Your bank balance includes money that\'s already committed — rent building up, payroll accruing, subscriptions ticking over. Tick the regular bills you recognise below, or add them later in the app.',
  },
  {
    id: 'committed-explain',
    title: 'How accruing costs work.',
    explain:
      'Each bill you added accrues a little every day. On the 1st of the month, rent hasn\'t cost you anything yet — but by the 28th, nearly the full amount has built up. True Balance subtracts that growing amount from your balance every single day.\n\nWhen the due date arrives, the cost moves from "accruing" into the "Due" column on the right. It stays there until you click "Paid" to confirm it left your account. This way you always know: what\'s building up, what\'s due right now, and what\'s genuinely yours.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'month-view',
    title: 'See the pattern — Month View.',
    explain:
      'Click "Month view" on the Monthly Accruing section to see a visual timeline of how your committed balance builds up through the month and drops when bills are paid.\n\nThis shows you the rhythm of your business — you can see exactly when money is tightest (just before big bills land) and when you have the most breathing room (just after). It updates automatically as you add or change bills.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'due-explain',
    title: 'One-off and irregular costs.',
    explain:
      'Not everything is a regular monthly bill. For one-off costs or irregular payments — a tax bill, an equipment purchase, a deposit — use "Add planned" in the Due section.\n\nYou set the name, amount, and due date. Then choose how it affects your True Balance:\n• Deduct immediately — the full amount is subtracted from day one\n• Build up to the date — accrues daily like a monthly bill, reaching the full amount on the due date\n• Part now, part building — reserve a lump sum immediately, then accrue the rest\n\nThis means True Balance always accounts for what\'s coming, not just what\'s already landed.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="due"]',
  },
  {
    id: 'receipts-explain',
    title: 'Money you\'re expecting in.',
    explain:
      'If you know money is coming — an invoice you\'ve sent, a refund, a grant payment — add it as an Expected Receipt. This adds to your True Balance so you can see the fuller picture.\n\nJust like outgoings, you can choose timing: count it immediately (you\'re confident it\'s coming) or let it accrue toward the expected date. Once the money arrives, mark it received and it drops off.\n\nThis is especially useful if your income is irregular — it shows you when cash will arrive and helps you plan around gaps.',
    page: 'committed-funds',
    spotlight: '[data-widget-id="expected-receipts"]',
  },
  {
    id: 'reserve',
    title: "Now let's protect you from the big bills.",
    explain:
      'VAT, corporation tax, insurance, annual renewals — the bills that catch businesses out because they\'re too big to pay from one month\'s income. The Reserve Planner calculates exactly how much to transfer into a savings account each month.\n\nAdd your buffer and bills below — it starts blank and saves straight to your account. Use Set up now in the footer to jump to the planner, or Continue when you\'re ready to move on.',
    page: 'reserve-planner',
    spotlight: '[data-tour="reserve-planner-month"]',
    skippable: true,
  },
  {
    id: 'trends-explain',
    title: 'Track your progress over time.',
    explain:
      'The Trends page shows your real balance, committed costs, and True Balance plotted over time. You can see whether your business is heading up or down at a glance.\n\nOne important detail: when you change a payment amount (say rent goes up), True Balance recalculates historically from when the accrual started. This means your graphs stay accurate — no sudden spikes or corrections, just a smooth updated picture of reality.\n\nKeep your bank balance fresh (every day or two) and Trends becomes your most powerful tool for spotting problems early.',
    page: 'trends',
    spotlight: '[data-widget-id="trends-chart"]',
  },
  {
    id: 'forecast-explain',
    title: 'See what\'s coming up.',
    explain:
      'The Forecast page projects your current account forward from scheduled outgoings and expected receipts. For steady-income businesses, day-to-day trading margin is included too.\n\nUse it to spot tight weeks before they arrive — especially helpful when you know big payments or invoices are on the horizon.',
    page: 'forecast',
    spotlight: '[data-widget-id="forecast-cash-outlook"]',
  },
  {
    id: 'reveal',
    title: "Here's your True Balance.",
    explain:
      'This is what it\'s all about. Your bank might say one number, but part of that is already spoken for. True Balance shows you what\'s genuinely available — the honest number. From now on, you never have to guess whether you can afford something or whether that money belongs to a bill.',
    page: 'committed-funds',
    spotlight: '[data-tour="overview-hero"]',
  },
  {
    id: 'accuracy',
    title: 'Keep it alive — here\'s your routine.',
    explain:
      'True Balance works best when it\'s fresh. Update your bank balance every day or two (takes 30 seconds). Mark things paid as they go out. Once a month, do the reserve check-in — it takes about 5 minutes and keeps your big bills on track. That\'s it. The system handles the rest.',
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
