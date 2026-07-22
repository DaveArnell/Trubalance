/**
 * Homepage marketing copy — Cash Prophet positioning.
 * Flow: emotional problem → benefit → what it does → how → why → platform.
 */

import { METHOD_PAGE_PATH } from './trueBalanceMethod'

export const HOME_HERO = {
  eyebrow: 'Cash Prophet',
  headline: 'Stop carrying your business finances around in your head.',
  headlineStart: 'Stop carrying your business finances',
  headlineHighlight: 'around in your head.',
  subheading:
    'Cash Prophet quietly keeps track of known commitments — so you see what is genuinely available, and the mental maths can finally stop.',
} as const

/** Beat 1–2: recognition of the emotional problem */
export const HOME_PROBLEM = {
  heading: 'You already know what is coming',
  lead: 'Payroll. Rent. VAT. Corporation tax. Insurance. Subscriptions. Quarterly bills. Annual renewals.',
  body: 'Every time you check the bank, you subtract them in your head. That quiet calculation creates stress, mental load, and decisions that feel harder than they should.',
  close: 'Cash Prophet removes that burden.',
} as const

/** Beat 3: what Cash Prophet does — emotional benefit */
export const HOME_WHAT_IT_DOES = {
  eyebrow: 'What Cash Prophet does',
  heading: 'One calm number you can trust',
  lead: 'Cash Prophet organises your known commitments and shows what is genuinely available — so confidence replaces guesswork.',
  points: [
    {
      title: 'Know where you really stand',
      body: 'See today’s position with future commitments already accounted for — not just the balance in the bank.',
    },
    {
      title: 'Stop the mental juggling',
      body: 'Payroll, VAT, rent and the rest no longer live in your head every time you look at the account.',
    },
    {
      title: 'Feel prepared, not surprised',
      body: 'Larger irregular costs become a steady rhythm, so big bills stop arriving as shocks.',
    },
  ],
} as const

/** Beat 4: how it works — principles as supporting explanation */
export const HOME_HOW_IT_WORKS_SYSTEM = {
  eyebrow: 'How Cash Prophet works',
  heading: 'A quiet system for known commitments',
  lead: 'Two simple principles. Together they replace mental tracking with a clearer daily picture.',
  pillars: [
    {
      id: 'daily-clarity',
      title: 'Commitments build every day',
      lead: 'Known commitments build every day before they are paid.',
      body: 'Payroll, rent, subscriptions and similar costs do not wait for payday. They accumulate continuously, so what is already spoken for stays visible.',
    },
    {
      id: 'reserve-planning',
      title: 'Irregular costs become monthly reserves',
      lead: 'Larger irregular costs become predictable monthly reserves instead of financial surprises.',
      body: 'VAT, insurance, tax and other annual bills are treated as steady amounts set aside over time — part of an ordinary rhythm, not a shock.',
    },
  ],
} as const

/** Beat 5: who it is for — behaviours */
export const HOME_WHO_FOR = {
  heading: 'Who Cash Prophet is for',
  lead: 'Business owners whose day-to-day habits look like this.',
  points: [
    'Regularly check the bank balance to judge how the business is doing',
    'Don’t enjoy bookkeeping',
    'Rely on an accountant for year-end accounts',
    'Want confidence without complicated financial tools',
    'Have predictable ongoing commitments',
  ],
} as const

/** Beat 5b: why it works / alongside other tools */
export const HOME_WHY_IT_WORKS = {
  heading: 'Works alongside the tools you already use',
  lead: 'Cash Prophet is not another accounting package. It answers a different question.',
  items: [
    {
      title: 'Bookkeeping & accounting',
      body: 'Record the past — what happened, what was owed, what was paid.',
    },
    {
      title: 'Your bank balance',
      body: 'Shows where money sits today — not how much of it is already spoken for.',
    },
    {
      title: 'Cash Prophet',
      body: 'Keeps known commitments organised and shows what is genuinely available — every day.',
    },
  ],
} as const

/** Beat 6: platform that makes Cash Prophet effortless */
export const HOME_PLATFORM = {
  eyebrow: 'The platform',
  headingStart: 'Cash Prophet, ',
  headingHighlight: 'made effortless.',
  lead: 'The system is Cash Prophet. The app simply makes it easy to follow — a light daily check and a short monthly reserve review.',
  steps: [
    {
      title: 'Known commitments build every day',
      body: 'Payroll, rent and similar costs accrue continuously. By mid-month you already see how much is spoken for — not only when the payment leaves the account.',
    },
    {
      title: 'Big bills become a monthly rhythm',
      body: 'VAT, insurance and annual costs become a planned monthly move into reserve, so large bills stop catching you out.',
    },
    {
      title: 'One calm number for decisions',
      body: 'Cash minus what is already committed, plus realistic expected receipts. That single number is what you use day to day.',
    },
  ],
} as const

export const HOME_EXPLORE = [
  {
    title: 'Why Cash Prophet works',
    body: 'How known commitments are organised, why bank balances mislead, and how calm confidence replaces mental maths.',
    to: METHOD_PAGE_PATH,
    cta: 'Read more',
  },
  {
    title: 'See it with a live business',
    body: 'Open a demo and feel what it is like when commitments stay organised and one number stays clear.',
    to: '/see-how-it-works',
    cta: 'Try demo',
  },
  {
    title: 'Daily & monthly habits',
    body: 'A light daily check and a short monthly reserve review — enough to keep the picture honest.',
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
  heading: 'Let Cash Prophet take the worry off your shoulders',
  body: 'Start free, or open a demo and feel the calm of one number you can trust.',
} as const
