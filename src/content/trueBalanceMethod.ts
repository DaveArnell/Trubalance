/** Shared copy for the Cash Prophet system. */

export const METHOD_PAGE_PATH = '/cash-prophet' as const

/** Legacy path — keep for redirects and old links. */
export const METHOD_PAGE_PATH_LEGACY = '/true-balance-method' as const

export const METHOD_BLOG_CATEGORY = 'Cash Prophet' as const

export const METHOD_PAGE_TITLE = 'Cash Prophet'

export const METHOD_PAGE_SUBTITLE =
  "The bank balance isn't lying. It's just answering the wrong question."

export const METHOD_MANTRA = "That's exactly what Cash Prophet fixes."

export const METHOD_OUTCOME =
  'Less stress, more confidence. Always knowing what’s already committed, and what you can actually afford today.'

/** Questions owners wake up with — used before introducing the Method. */
export const METHOD_CLARITY_QUESTIONS = [
  'Can I actually afford to spend this money?',
  'Why do I keep getting caught out by VAT or annual bills?',
  'How much of my bank balance is actually already spoken for?',
  'Do I really know where my business stands today?',
] as const

export const METHOD_WHY_COMPARE = {
  traditional: {
    title: 'Managing from the bank balance',
    points: [
      'Look at the bank balance and hope it’s enough.',
      'Wait until bills arrive.',
      'React when money leaves.',
      'Get caught out by VAT and annual costs.',
    ],
  },
  method: {
    title: 'Cash Prophet',
    points: [
      'Known commitments build continuously before payday.',
      'Large irregular bills become planned monthly transfers.',
      'You see what’s already spoken for — every day.',
      'One clearer number for day-to-day decisions.',
    ],
  },
} as const

export const METHOD_WHO_FOR = [
  'run an owner-managed business without a finance team',
  'rely on an accountant or bookkeeper, but still need a clearer daily picture',
  'look at the bank balance and wonder how much is already spoken for',
  'get caught out by VAT, tax or annual bills',
  'want confidence in day-to-day decisions without complicated forecasts',
  'have regular commitments and larger irregular costs to plan for',
] as const

export const METHOD_WHO_NOT_FOR = [
  'You already have a finance department producing daily management information.',
  'Your business has very few financial commitments.',
  'You only need bookkeeping or accounting software — and nothing more.',
] as const

/** Primary marketing spine — two simple habits. */
export const METHOD_TWO_HABITS = [
  {
    id: 'daily',
    title: 'Daily',
    time: 'Light logging',
    lead: 'Keep the picture honest — then see where you stand.',
    body: 'A short update is enough. The software does the calculations. You see what’s already committed and what’s left.',
    tasks: [
      'Refresh your bank balances when they have changed',
      'Mark payments as paid when they leave the account',
      'Add or change obligations when something in the business changes',
      'Add planned new payments when you know they are coming',
      'Check what’s available before day-to-day decisions',
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
      'Confirm the transfer in Cash Prophet',
      'Stay on track for every annual obligation',
    ],
  },
] as const

/** Live demo of continuous accrual — homepage + Method page (no video yet). */
export const METHOD_ACCRUING_DEMO = {
  heading: 'See known costs building',
  lead: 'Rent and wages grow a little every day. When due day hits, they move across until you mark them paid.',
} as const

/** How the maths works — short supporting cards (not the primary spine). */
export const METHOD_THREE_PRINCIPLES = [
  {
    id: 'continuous-accrual',
    title: 'Daily financial clarity',
    lead: 'Known commitments build every day — not only on payday.',
    body: 'Payroll, rent, utilities and similar obligations accrue continuously so today’s position already reflects money spoken for.',
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
    lead: 'Large irregular costs become manageable monthly commitments.',
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
    title: 'One number you can trust',
    lead: 'What’s available is the clearer read of today’s position.',
    body: 'The bank balance becomes a reference. Cash Prophet shows what is left after commitments that have already built up — so you understand the figure, not just the total in the app.',
    examples: ['Purchases', 'Hires', 'Quiet months', 'Owner drawings'],
  },
] as const

export const METHOD_RESERVE_PLANNER = {
  title: 'How the Reserve Planner works',
  notSavings:
    'The Reserve Planner is not “saving for bills.” It is a core pillar of the Method — turning unpredictable large costs into predictable monthly commitments.',
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
    body: 'Add your business, venues and bank accounts so you have a starting position.',
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
    title: 'Commitments build continuously',
    body: 'Monthly costs and reserve requirements accrue automatically between updates — so you always see what’s spoken for.',
  },
  {
    step: '05',
    title: 'Keep it current each day',
    body: 'Update bank balances, mark payments paid, and adjust obligations when something changes — then decide from what’s available.',
  },
  {
    step: '06',
    title: 'Follow the monthly Reserve Planner recommendation',
    body: 'About five minutes. Confirm the transfer in or out so large bills stop catching you out.',
  },
  {
    step: '07',
    title: 'Repeat',
    body: 'Light daily logging. Monthly Reserve Planner. Ongoing financial clarity.',
  },
] as const

export const METHOD_WHY_IT_WORKS = [
  'Always know what’s already committed',
  'Stop being surprised by large bills',
  'Less stress around VAT and tax',
  'A clearer picture of where the business stands today',
  'Better day-to-day spending decisions',
  'Confidence without complicated forecasts',
] as const

export const METHOD_SOFTWARE_HELPS = [
  'Tracks daily accruals',
  'Runs the Reserve Planner and transfer recommendations',
  'Monitors expected receipts',
  'Calculates what is genuinely available as commitments change',
  'Keeps everything in one place',
] as const

/** @deprecated Prefer METHOD_TWO_HABITS / METHOD_THREE_PRINCIPLES. */
export const METHOD_ROUTINE_HABITS = [
  'Update your bank balances',
  'Mark payments as paid',
  'Add or change obligations and planned payments when needed',
  'Check what’s available before spending decisions',
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
  'Produce one calm number that can be used for day-to-day financial decisions.',
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
  'Check what’s available before spending decisions.',
  'Once a month, follow the Reserve Planner transfer recommendation.',
] as const

export const METHOD_FOR_ACCOUNTANTS = [
  'It complements accounting software rather than replacing it.',
  'It helps clients understand their current position between formal reports.',
  'It builds better day-to-day financial routines.',
  'It may reduce clients being surprised by VAT, tax and irregular bills.',
  'It does not replace professional accounting or tax advice.',
] as const
