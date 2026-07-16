/**
 * Homepage marketing copy — Problem → Person → Solution → Method → App.
 * Outcome (financial clarity) is the product; Method delivers it; app makes it easy.
 */

import { METHOD_PAGE_PATH } from './trueBalanceMethod'

export const HOME_HERO = {
  headline: 'A better way to manage your business finances.',
  subheading:
    'The True Balance Method helps business owners understand where their business really stands financially by continuously accounting for known commitments and planning ahead for future obligations.',
} as const

export const HOME_IS_THIS_YOU = {
  title: 'Is this you?',
  points: [
    'You regularly look at your bank balance to judge how healthy the business is.',
    'You know some of that money is already spoken for, but can’t easily see how much.',
    'VAT, tax or annual bills still manage to catch you out.',
    'You don’t enjoy bookkeeping or keeping complicated cash flow forecasts up to date.',
    'You just want one number you can trust every day.',
  ],
  close: 'If that sounds familiar, the True Balance Method was built for you.',
} as const

export const HOME_BANK_GAP = {
  heading: 'Why your bank balance isn’t enough',
  points: [
    {
      title: 'Accounting software',
      body: 'Tells you what has happened.',
    },
    {
      title: 'Your bank balance',
      body: 'Tells you where money sits today.',
    },
    {
      title: 'What’s missing',
      body: 'Neither tells you how much of today’s balance is already committed.',
    },
  ],
  close: 'This is where many business owners lose clarity — and why day-to-day decisions feel like guesswork.',
} as const

export const HOME_METHOD_PILLARS = {
  eyebrow: 'The solution',
  heading: 'The True Balance Method',
  lead: 'Two simple pillars. One clearer picture of where your business stands today.',
  pillars: [
    {
      id: 'daily-clarity',
      title: 'Daily financial clarity',
      lead: 'Known commitments continuously build up before they’re actually paid.',
      body: 'Payroll, rent, subscriptions and similar costs chip away at the picture every day — not only on payday. That creates a much more realistic view of today’s financial position.',
    },
    {
      id: 'reserve-planning',
      title: 'Reserve planning',
      lead: 'Large irregular costs aren’t treated as surprises.',
      body: 'VAT, insurance, tax and other annual bills are broken into manageable monthly amounts. Each month the platform tells you exactly how much should move into or out of your reserve account to stay on plan.',
      note: 'This is not “saving for bills.” It’s turning unpredictable large costs into predictable monthly commitments — as part of a simple monthly routine.',
    },
  ],
} as const

export const HOME_WHO_FOR = {
  heading: 'Who True Balance is designed for',
  lead: 'Owner-managed businesses that want confidence without complexity.',
  points: [
    'Owner-managed businesses',
    'Businesses without finance teams',
    'People who rely on accountants or bookkeepers',
    'Business owners who don’t enjoy bookkeeping',
    'Owners who want confidence without complexity',
    'Businesses with regular commitments and larger irregular costs',
  ],
} as const

export const HOME_HOW_IT_WORKS = {
  eyebrow: 'How it works',
  heading: 'From commitments to one number you can trust',
  lead: 'Regular costs build daily. The Reserve Planner turns annual bills into monthly transfers. Together they keep your True Balance honest.',
  steps: [
    {
      title: 'Regular commitments build daily',
      body: 'Known monthly costs accrue continuously so today’s position already reflects money spoken for.',
    },
    {
      title: 'Reserve Planner funds annual costs',
      body: 'Irregular bills become manageable monthly transfers — into or out of reserve — so you’re not caught out.',
    },
    {
      title: 'True Balance, every day',
      body: 'Cash minus what’s already committed, plus realistic expected receipts — one number for day-to-day decisions.',
    },
    {
      title: 'A light daily + monthly routine',
      body: 'Update balances when they change. Once a month, follow the Reserve Planner recommendation.',
    },
  ],
} as const

export const HOME_DIFFERENT_QUESTIONS = {
  heading: 'Different tools answer different questions',
  lead: 'Bookkeeping, accounting software and the True Balance Method are not competing for the same job.',
  items: [
    {
      title: 'Bookkeeping & accounting',
      body: 'Record the past — what happened, what was owed, what was paid.',
    },
    {
      title: 'True Balance Method',
      body: 'Help you understand today — what’s already committed, and what’s left in the business.',
    },
  ],
} as const

export const HOME_EXPLORE = [
  {
    title: 'Learn the Method',
    body: 'Why bank balances mislead, how continuous accrual works, and how the Reserve Planner stops large bills surprising you.',
    to: METHOD_PAGE_PATH,
    cta: 'Read the Method',
  },
  {
    title: 'See the platform',
    body: 'Open a live demo business and see daily accruals, the Reserve Planner and True Balance in action.',
    to: '/see-how-it-works',
    cta: 'Try demo',
  },
  {
    title: 'Daily & monthly habits',
    body: 'Light logging each day and a short monthly reserve review — enough to keep the picture honest.',
    to: '/habits',
    cta: 'See the habits',
  },
  {
    title: 'Pricing',
    body: 'Start free, set up however you like, then choose the plan that matches your business structure.',
    to: '/pricing',
    cta: 'View pricing',
  },
] as const

export const HOME_CTA = {
  heading: 'Ready for clearer day-to-day decisions?',
  body: 'Start with the Method, or open the platform and see how it feels with a live business.',
} as const
