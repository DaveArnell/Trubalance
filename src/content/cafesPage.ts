/**
 * Café / coffee shop campaign landing — automated budgeting for that audience.
 * Same product as the homepage. Different recognition problem.
 */

import { TRIAL_DAYS } from '../config/subscriptionTiers'
import { CASH_PROPHET_BALANCE } from './brandFoundation'

export const CAFES_PATH = '/cafes' as const
export const CAFES_TRY_IT_PATH = '/try-it?sector=cafe' as const
export const CAFES_SIGNUP_PATH = '/signup' as const
export const CAFES_ONBOARDING_PATH = '/contact?topic=onboarding' as const

export const CAFES_EXAMPLE = {
  bank: 18400,
  commitments: [
    { name: 'Payroll accrued', accrued: 5200, monthly: 9000, hint: 'Wages building toward payday' },
    { name: 'Rent accrued', accrued: 1600, monthly: 2400, hint: 'Part of this month already spoken for' },
    { name: 'Utilities accrued', accrued: 650, monthly: 800, hint: 'Energy and water through the cycle' },
    { name: 'Finance / equipment', accrued: 450, monthly: 600, hint: 'A regular finance payment building' },
    { name: 'Other regular commitments', accrued: 700, monthly: 1050, hint: 'Subscriptions and standing costs' },
  ],
  prophet: 9800,
} as const

export const CAFES_PAGE = {
  hero: {
    category: 'Automated budgeting for cafés and coffee shops',
    headline: 'Your takings come in every day. Your bills don\'t.',
    lead:
      'Cash Prophet accounts for wages, rent and other regular costs as they build up, so you have a clearer idea of what the café can actually afford today.',
    primaryCta: `Start ${TRIAL_DAYS} days free`,
    secondaryCta: 'Try the free snapshot',
    secondaryHint: 'No account needed',
    onboarding: 'Free personal onboarding available',
  },
  example: {
    heading: 'What that looks like in a café',
    lead:
      'A typical mid-month picture. The full bills have not necessarily left the bank yet. Part of each regular obligation has already built up as of today.',
    bankLabel: 'Bank balance',
    bankNote: 'In the café account today',
    spokenLabel: 'Already building',
    prophetLabel: CASH_PROPHET_BALANCE,
    prophetNote: 'What the café can actually work with today, after regular costs already accrued',
    footnote: 'Illustrative figures only. The point is the principle, not these exact amounts.',
  },
  noisy: {
    heading: 'Why the bank balance can look better than it is',
    lead:
      'Cafés take money regularly, often every day. The large costs do not leave the bank evenly. Wages, rent, utilities, finance and other recurring costs hit at different points in the month.',
    body:
      'That means the bank balance can look healthy simply because some of those payments have not happened yet. Money that is already spoken for can look like money available to spend.',
    bankTitle: 'Bank balance through a café month',
    bankCaption: 'Jumps around depending on where you are in the payment cycle.',
    prophetTitle: CASH_PROPHET_BALANCE,
    prophetCaption: 'Regular obligations are accounted for gradually, so the direction is easier to read.',
    close:
      'Cash Prophet does not remove the ups and downs of trade. It removes some of the timing distortion from the way the bank balance is interpreted.',
  },
  budgeting: {
    heading: 'A business budget that updates itself every day',
    lead:
      'Rather than writing a monthly budget and then trying to remember how much of it has effectively been used, Cash Prophet accounts for regular costs as their payment cycles progress.',
    example:
      'If payroll is £9,000 a month, Cash Prophet does not wait until payday before treating it as a cost. A proportion of that commitment builds into the calculation every day. The same principle applies to rent and other recurring commitments.',
    close: `That is why the ${CASH_PROPHET_BALANCE} is different from simply looking at the bank.`,
  },
  bills: {
    heading: 'Stay on top of recurring bills without another job',
    lead:
      'Café owners already have enough to manage operationally. Cash Prophet keeps wages, rent, utilities, finance and other regular costs organised and visible.',
    body:
      'The benefit is not simply receiving reminders. Those recurring costs actively influence the Cash Prophet Balance as they build up, so staying aware of the bills and knowing what you can afford are the same habit.',
  },
  reserve: {
    heading: 'Set money aside for the costs that do not fit the monthly cycle',
    lead:
      'Some café costs do not land neatly every month. Depending on the business, that may include VAT, tax, annual insurance, equipment replacement, servicing, licences, refurbishment or other known larger bills.',
    body:
      'Cash Prophet helps you plan for those separately, so they are provided for rather than arriving as a sudden shock. Not every café has every one of these costs. You only set aside for the ones that apply to you.',
  },
  oneNumber: {
    heading: 'Know what your café can actually afford',
    lead: `Everything feeds into one figure: the ${CASH_PROPHET_BALANCE}.`,
    equation: [
      { label: 'Bank balance', detail: 'What is in the account today' },
      { label: 'Regular commitments already accrued', detail: 'Wages, rent and other costs that have built up so far' },
      { label: 'Planned provisions kept in mind', detail: 'Larger future costs you are setting aside for' },
      { label: CASH_PROPHET_BALANCE, detail: 'The number to follow day to day' },
    ],
    close:
      'Because Cash Prophet records that balance over time, you can see whether the underlying financial position is improving or deteriorating without being distracted by the normal payment-cycle spikes in the bank account.',
  },
  snapshot: {
    heading: 'Try it with your café',
    lead:
      'Enter your current bank balance, wages, rent and regular bills and see how much of that balance is already effectively spoken for today.',
    points: ['No account required', 'Takes a couple of minutes', 'Uses your own figures'],
    cta: 'Try the free Cash Prophet Snapshot',
  },
  lightweight: {
    heading: 'Lightweight, not another finance system',
    lead: 'Designed for the person who runs the café, not for a finance team.',
    points: [
      'Minimal ongoing input once the regular costs are in',
      'No accounting knowledge required',
      'Not another bookkeeping system',
      'Not a heavy finance suite',
      'Works quietly in the background',
      'Sits alongside your accountant or bookkeeper',
    ],
  },
  benefits: {
    heading: 'What changes for the owner',
    items: [
      {
        title: 'Know what is genuinely available',
        body: 'Before taking money out, ordering equipment or agreeing a spend, you can see what is left after regular costs already accrued.',
      },
      {
        title: 'Fewer surprises when bills land',
        body: 'Payday and rent day still happen. They should feel less like the ground has shifted, because those costs have been building in view.',
      },
      {
        title: 'Recurring commitments stay visible',
        body: 'Wages, rent, utilities, finance and subscriptions stay organised, and they keep feeding the daily figure.',
      },
      {
        title: 'Larger future costs are planned for',
        body: 'VAT, insurance, equipment and other known bills can be provided for steadily instead of arriving as a shock.',
      },
      {
        title: 'See the direction more clearly',
        body: 'Follow one consistent number over time, rather than reading too much into a good or bad day at the till, or a quiet week before payroll.',
      },
      {
        title: 'Less mental subtracting',
        body: 'Stop carrying the bills in your head every time you glance at the bank.',
      },
    ],
  },
  founder: {
    heading: 'Built from a real hospitality business',
    body:
      'The Cash Prophet approach comes from many years of using this discipline in a leisure and hospitality business with regular customer income and significant recurring costs. The page is about your café, not our story. The same timing problem shows up wherever takings are steady and bills are not.',
  },
  cta: {
    heading: 'See what your café can actually afford',
    body: `Start ${TRIAL_DAYS} days free, or try the free snapshot with your own figures. Free personal onboarding is available if you want a guided start.`,
    primary: `Start ${TRIAL_DAYS} days free`,
    secondary: 'Try the free snapshot',
    onboarding: 'Free personal onboarding',
  },
} as const
