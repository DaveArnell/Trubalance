/** Shared copy for the Cash Prophet system. */

/** Former Why Cash Prophet URL — redirects home. Kept for old links. */
export const METHOD_PAGE_PATH = '/' as const

/** Legacy path — redirects home. */
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
  'Am I accounting for all the bills that might be coming up?',
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
    id: 'routine',
    title: 'Daily to weekly',
    time: 'Light logging',
    lead: 'Keep the picture honest',
    body: 'When you update your bank balance, Cash Prophet logs that day. That history paints a picture of the direction of travel for the business and its outlook.',
    tasks: [
      'Update balances when needed',
      'Mark payments paid',
      'Add new commitments when they appear',
    ],
  },
  {
    id: 'monthly',
    title: 'Monthly',
    time: 'About 5 minutes',
    lead: 'Review the Reserve Planner',
    body: 'Confirm the recommended transfer so large bills stay funded through the year.',
    tasks: [
      'Review the Reserve Planner',
      'Confirm the recommended transfer',
    ],
  },
] as const

/** Live demo of continuous accrual. */
export const METHOD_ACCRUING_DEMO = {
  heading: 'See known costs building',
  lead: 'Meaningful costs such as rent and wages grow a little every day until paid.',
} as const

/** How Cash Prophet works — three short pillars. */
export const METHOD_THREE_PRINCIPLES = [
  {
    id: 'continuous-accrual',
    title: 'Daily financial clarity',
    lead: 'Known costs build every day, not only on payday.',
    body: 'Payroll, rent and similar bills accrue continuously, so today’s position already shows money spoken for, instead of waiting until the payment date to feel the hit.',
    examples: ['Payroll', 'Rent', 'Utilities', 'Subscriptions'],
  },
  {
    id: 'reserve-planning',
    title: 'Reserve Planner',
    lead: 'Large irregular bills become steady monthly amounts.',
    body: 'VAT, insurance and similar costs are spread across the year, then included in your everyday position like any other commitment, so they stop arriving as a surprise.',
    examples: ['VAT', 'Corporation tax', 'Annual insurance'],
  },
  {
    id: 'one-decision-number',
    title: 'One number you can trust',
    lead: 'Available Balance is what’s left after commitments already building.',
    body: 'The bank balance stays as a reference. Cash Prophet shows what you can actually work with today, after the commitments you already know about.',
    examples: ['Purchases', 'Quiet months', 'Owner drawings'],
  },
] as const

export const METHOD_RESERVE_PLANNER = {
  title: 'How the Reserve Planner works',
  lead:
    'Irregular bills like VAT, insurance and tax become a steady monthly transfer into a separate reserve savings account.',
  steps: [
    'Open a separate savings account for reserves.',
    'List your annual and irregular bills.',
    'Cash Prophet spreads them into a monthly transfer amount.',
    'Each month you move that amount into the reserve account.',
  ],
} as const

/** First setup — valuable, not difficult. */
export const METHOD_FIRST_SETUP = {
  heading: 'The first setup matters',
  lead: [
    'The only part that takes a little thought is the beginning. Cash Prophet can only carry the mental load once it understands your business.',
  ],
  body: [
    "During setup you'll list your regular monthly commitments, your annual bills and any other predictable costs. Most business owners already know these things — they've just never written them down in one place, and that process often gives a clearer picture of the business than they've had before.",
    "Once it's done, Cash Prophet takes over. From then on you're updating the picture, not rebuilding it from scratch every week.",
  ],
  timeline: [
    'Know your bills',
    'Build your commitments',
    'Cash Prophet takes over',
    'Simple daily updates',
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
  'Does the daily calculations around your payment cycle',
  'Tracks accruals and Reserve Planner recommendations',
  'Keeps Available Balance current when you update the bank',
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
