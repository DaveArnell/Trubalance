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

/**
 * Café example: soonest due first, and fuller the closer the due date.
 * Accrued amounts follow the remaining cycle so the bars match the labels.
 */
export const CAFES_EXAMPLE = {
  bank: 18400,
  bills: [
    { dueInDays: 2, name: 'Rent', accrued: 2200, total: 2400 },
    { dueInDays: 8, name: 'Utilities', accrued: 600, total: 800 },
    { dueInDays: 12, name: 'Equipment finance', accrued: 360, total: 600 },
    { dueInDays: 18, name: 'Subscriptions', accrued: 440, total: 1050 },
    { dueInDays: 24, name: 'Wages', accrued: 1800, total: 9000 },
  ],
} as const

export const CAFES_EXAMPLE_ACCRUED = CAFES_EXAMPLE.bills.reduce((sum, bill) => sum + bill.accrued, 0)
export const CAFES_EXAMPLE_PROPHET = CAFES_EXAMPLE.bank - CAFES_EXAMPLE_ACCRUED

export const CAFES_PAGE = {
  hero: {
    category: 'Automated budgeting for cafés and coffee shops',
    headline: 'Your takings come in every day. Your bills don\'t.',
    lead:
      'Cash Prophet accounts for wages, rent and other regular costs as they build up, so you have a clearer idea of what the café can actually afford today.',
    primaryCta: `Start ${TRIAL_DAYS} days free`,
    secondaryCta: 'Try the free snapshot',
    onboarding: 'Free personal onboarding available',
  },
  example: {
    bankLabel: 'Bank balance',
    bankNote: 'In the café account today',
    prophetNote: 'After regular costs already accrued',
  },
  noisy: {
    heading: 'Why the bank balance can look better than it is',
    lead:
      'Takings come in most days. Wages, rent, utilities and finance leave at different points, so the bank can look healthy simply because a bill has not hit yet.',
  },
  budgeting: {
    heading: 'A business budget that updates itself every day',
    lead:
      'If payroll is £9,000 a month, Cash Prophet does not wait until payday. A proportion builds into the figure every day. The same applies to rent and other regular costs.',
  },
  bills: {
    heading: 'Stay on top of recurring bills without another job',
    lead:
      'The bills stay organised and visible, and they feed the Cash Prophet Balance as they build up. That is more than a reminder.',
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
  cta: {
    heading: 'See what your café can actually afford',
    body: `Start ${TRIAL_DAYS} days free, or try the free snapshot with your own figures. Free personal onboarding is available if you want a guided start.`,
    primary: `Start ${TRIAL_DAYS} days free`,
    secondary: 'Try the free snapshot',
    onboarding: 'Free personal onboarding',
  },
} as const
