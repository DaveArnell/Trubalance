/** Shared copy for the True Balance Method framework. */

export const METHOD_PAGE_PATH = '/true-balance-method' as const

export const METHOD_BLOG_CATEGORY = 'The True Balance Method' as const

export const METHOD_PAGE_TITLE = 'The True Balance Method'

export const METHOD_PAGE_SUBTITLE =
  'A simple financial management system for understanding what your bank balance is actually made up of.'

export const METHOD_MANTRA =
  'Do not manage your business from your bank balance. Manage it from your True Balance.'

/** Questions the Method keeps answering — homepage clarity section. */
export const METHOD_CLARITY_QUESTIONS = [
  'How much of my bank balance is already committed?',
  'How much belongs to VAT, payroll, suppliers or future bills?',
  'How much is left in the business after that?',
  'What financial position is my business actually in today?',
] as const

export const METHOD_WHY_COMPARE = {
  traditional: {
    title: 'Traditional approach',
    points: [
      'Look at the bank balance.',
      'Wait until bills arrive.',
      'React when money leaves.',
      'Hope enough has been left.',
    ],
  },
  method: {
    title: 'True Balance Method',
    points: [
      'Commitments build continuously.',
      'Annual bills are planned throughout the year.',
      'Your financial position is updated every day.',
      'You understand exactly what your money is made up of.',
    ],
  },
} as const

export const METHOD_WHO_FOR = [
  'run a business and need a clearer read of the money in the bank — whether or not they use bookkeeping software',
  'sometimes wonder how much of the bank balance is already spoken for',
  'deal with VAT, payroll, annual bills and future commitments',
  'want clearer finances without becoming an accountant',
  'prefer a simple financial routine over complicated reports',
] as const

export const METHOD_WHO_NOT_FOR = [
  'You already have a finance department.',
  'Your accountant already produces daily management information.',
  'Your business has very few financial commitments.',
  'You are only looking for bookkeeping or accounting software.',
] as const

/** Primary marketing spine — two simple habits. */
export const METHOD_TWO_HABITS = [
  {
    id: 'daily',
    title: 'Daily',
    time: 'Light logging',
    lead: 'Keep the picture honest — then understand your position.',
    body: 'A short update is enough. The software does the calculations. You see what your bank balance is made up of.',
    tasks: [
      'Refresh your bank balances when they have changed',
      'Mark payments as paid when they leave the account',
      'Add or change obligations when something in the business changes',
      'Add planned new payments when you know they are coming',
      'Check your True Balance and understand today’s position',
    ],
  },
  {
    id: 'monthly',
    title: 'Monthly',
    time: 'About 5 minutes',
    lead: 'Open the Reserve Planner and follow the recommended transfer.',
    body: 'The app already knows every annual and irregular bill, which month it is due, and what your reserve account should contain. Confirm the transfer — in or out — and stay on track for the year.',
    tasks: [
      'Open the Reserve Planner',
      'Review this month’s recommendation',
      'Transfer the suggested amount between current and reserve',
      'Confirm the transfer in True Balance',
      'Stay on track for every annual obligation',
    ],
  },
] as const

/** How the maths works — short supporting cards (not the primary spine). */
export const METHOD_THREE_PRINCIPLES = [
  {
    id: 'continuous-accrual',
    title: 'Continuous Accrual',
    lead: 'Monthly costs build every day — not only on payday.',
    body: 'Payroll, rent, utilities and similar obligations accrue continuously so today’s position already reflects tomorrow’s bills.',
    examples: [
      'Payroll',
      'Rent',
      'Utilities',
      'Finance',
      'Subscriptions',
      'Business rates',
    ],
  },
  {
    id: 'reserve-planning',
    title: 'Reserve Planner',
    lead: 'Annual and irregular bills become a managed funding plan.',
    body: 'Not a simple “save £500 a month” habit. The Reserve Planner sets monthly targets, recommends transfers into or out of the reserve account, then those amounts accrue daily like any other commitment.',
    examples: [
      'VAT',
      'Corporation tax',
      'Annual insurance',
      'Quarterly rent',
      'Service charges',
      'Licences',
      'Large repairs',
    ],
  },
  {
    id: 'one-decision-number',
    title: 'One Decision Number',
    lead: 'Your True Balance is the clearer read of the position.',
    body: 'The bank balance becomes a reference. True Balance shows what is left after commitments that have already built up — so you understand the figure, not just the total in the app.',
    examples: ['Purchases', 'Hires', 'Quiet months', 'Owner drawings'],
  },
] as const

export const METHOD_RESERVE_PLANNER = {
  title: 'How the Reserve Planner works',
  notSavings:
    'The Reserve Planner is not a savings feature. It is a core pillar of the True Balance Method — a continuously managed annual funding plan.',
  steps: [
    'Identify every annual and irregular obligation (VAT, corporation tax, insurance, quarterly rent, service charges, licences, large repairs).',
    'Convert each into monthly funding targets for the year.',
    'Show what the reserve account should contain at the end of every month.',
    'Recommend whether money should move into the reserve account, or back out — and exactly how much.',
    'Once calculated, those monthly reserve amounts become part of the normal commitments that accrue every day.',
  ],
} as const

export const METHOD_CUSTOMER_JOURNEY = [
  {
    step: '01',
    title: 'Connect your business',
    body: 'Add your business, venues and bank accounts so the Method has a starting position.',
  },
  {
    step: '02',
    title: 'Add your monthly commitments',
    body: 'Payroll, rent, utilities, subscriptions and other regular costs that should accrue every day.',
  },
  {
    step: '03',
    title: 'Build your Reserve Planner',
    body: 'Enter annual and irregular bills. The planner turns them into a month-by-month funding plan.',
  },
  {
    step: '04',
    title: 'Continuous accrual',
    body: 'The app accrues monthly commitments and reserve requirements automatically between updates.',
  },
  {
    step: '05',
    title: 'Keep it current each day',
    body: 'Update bank balances, mark payments paid, and adjust obligations or planned payments when something changes — then decide from your True Balance.',
  },
  {
    step: '06',
    title: 'Follow the monthly Reserve Planner recommendation',
    body: 'About five minutes. Confirm the transfer in or out so the reserve plan stays on track.',
  },
  {
    step: '07',
    title: 'Repeat',
    body: 'Light daily logging. Monthly Reserve Planner. Continuous financial clarity.',
  },
] as const

export const METHOD_WHY_IT_WORKS = [
  'No more wondering if the money is actually available',
  'No more forgetting annual bills',
  'Less stress around VAT and tax',
  'A more stable picture of the business',
  'Better spending decisions',
  'Greater confidence day to day',
] as const

export const METHOD_SOFTWARE_HELPS = [
  'Tracks daily accruals',
  'Runs the Reserve Planner and transfer recommendations',
  'Monitors expected receipts',
  'Calculates the continuously changing True Balance',
  'Keeps everything in one place',
] as const

/** @deprecated Prefer METHOD_TWO_HABITS / METHOD_THREE_PRINCIPLES. */
export const METHOD_ROUTINE_HABITS = [
  'Update your bank balances',
  'Mark payments as paid',
  'Add or change obligations and planned payments when needed',
  'Check your True Balance before spending decisions',
  'Follow the monthly Reserve Planner recommendation',
] as const

/** @deprecated Prefer METHOD_THREE_PRINCIPLES — kept for older references. */
export const METHOD_FOUR_PRINCIPLES = [
  'Do not manage the business from the bank balance alone.',
  'Account for commitments as they build up, rather than waiting until they are paid.',
  'Build virtual reserves for irregular bills before they become due.',
  'Keep the position current through small, regular updates.',
] as const

/** @deprecated Prefer METHOD_CUSTOMER_JOURNEY. */
export const METHOD_STEPS = [
  'Start with current available cash.',
  'Account for money already committed or building up for future obligations.',
  'Add only realistic expected receipts where appropriate.',
  'Produce a True Balance that can be used for day-to-day financial decisions.',
  'Regularly update the few things that have changed.',
] as const

/**
 * Worked example for the Method page.
 * £42,500 − £11,400 − £8,900 + £4,700 = £26,900
 */
export const METHOD_WORKED_EXAMPLE = {
  bankBalance: '£42,500',
  availableCash: '£42,500',
  monthlyAccrued: '£11,400',
  reservesBuilding: '£8,900',
  /** Combined commitments for the compact equation (home). */
  committed: '£20,300',
  expectedReceipts: '£4,700',
  trueBalance: '£26,900',
} as const

/** @deprecated Prefer METHOD_TWO_HABITS. */
export const METHOD_ONGOING_ROUTINE = [
  'Update your bank balances regularly.',
  'Mark payments as paid when they leave the account.',
  'Add or change obligations and planned payments when something changes.',
  'Check your True Balance before spending decisions.',
  'Once a month, follow the Reserve Planner transfer recommendation.',
] as const

export const METHOD_FOR_ACCOUNTANTS = [
  'It complements accounting software rather than replacing it.',
  'It helps clients understand their current position between formal reports.',
  'It builds better day-to-day financial routines.',
  'It may reduce clients being surprised by VAT, tax and irregular bills.',
  'It does not replace professional accounting or tax advice.',
] as const
