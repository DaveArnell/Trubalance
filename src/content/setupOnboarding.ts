export interface SetupOnboardingStep {
  id: string
  title: string
  explain: string
  /** CSS selector to highlight on the dashboard while this step is active */
  spotlight?: string
  skippable?: boolean
}

export const SETUP_ONBOARDING_STEPS: SetupOnboardingStep[] = [
  {
    id: 'business',
    title: "Let's set up what you want to track.",
    explain:
      'Start with your business. You can keep this simple or add more detail later — sites, extra accounts, and other businesses can wait.',
    spotlight: '[data-tour="sidebar-scope"]',
  },
  {
    id: 'cash',
    title: 'Now add the money you can see.',
    explain:
      'Enter the current balances for your current and savings accounts. This gives True Balance its starting point.',
    spotlight: '[data-tour="overview-balances"]',
  },
  {
    id: 'committed',
    title: "Now let's account for money that's already committed.",
    explain:
      'These are the regular costs that build up over time, like payroll, rent, HMRC, pension or credit card payments.',
    spotlight: '[data-widget-id="committed-funds"]',
  },
  {
    id: 'reserve',
    title: "Now let's protect you from the big bills.",
    explain:
      'VAT, corporation tax, insurance and annual bills are the things that often catch businesses out. The Reserve Planner helps you put money aside before they arrive.',
    spotlight: '[data-tour="nav-reserve-planner"]',
    skippable: true,
  },
  {
    id: 'reveal',
    title: "Here's your True Balance.",
    explain:
      'Cash minus committed funds plus expected receipts equals True Balance — how much is genuinely available, not just what the bank shows.',
    spotlight: '[data-tour="overview-hero"]',
  },
  {
    id: 'accuracy',
    title: 'Keep your True Balance alive.',
    explain:
      'True Balance is a living dashboard — update balances as money moves, mark things paid or received as they happen, and do a quick reserve check-in each month.',
    spotlight: '[data-tour="overview-balances"]',
  },
]

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
