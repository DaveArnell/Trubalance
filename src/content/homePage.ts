/**
 * Homepage marketing copy — Problem → Person → Solution → Method → App.
 * Outcome (financial clarity) is the product; Method delivers it; app makes it easy.
 */

import { METHOD_PAGE_PATH } from './trueBalanceMethod'

export const HOME_HERO = {
  eyebrow: 'Financial clarity, every day',
  headline: 'One calm number you can trust every day.',
  headlineStart: 'One calm number',
  headlineHighlight: 'you can trust every day.',
  subheading:
    'Known commitments stay accounted for, so future bills leave your head — less mental load, more calm confidence.',
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
      title: 'Today’s cash only',
      body: 'It shows what’s in the account right now — nothing about what is already spoken for.',
    },
    {
      title: 'The rest lives in your head',
      body: 'Future commitments stay mental: every glance at the balance becomes another quiet calculation.',
    },
    {
      title: 'Unnecessary mental load',
      body: 'That constant second-guessing creates uncertainty, even when the number looks fine.',
    },
  ],
  close:
    'The True Balance Method removes that mental maths by continuously accounting for known commitments — so clarity and confidence replace guesswork.',
} as const

export const HOME_VS_FORECAST = {
  eyebrow: 'What this actually is',
  heading: 'A daily picture of where you stand — with the future already built in',
  lead:
    'True Balance is not a projection of what might happen next month. It is a live number for today: cash in the bank, minus what is already committed, plus realistic money still owed to you. Known costs build a little every day before they are paid. Large bills are turned into monthly reserve transfers. So the figure you look at already accounts for what is coming — without needing a forecast you never keep up to date.',
  points: [
    {
      title: 'About today',
      body: 'One number that answers: can I afford this right now?',
    },
    {
      title: 'Commitments already in',
      body: 'Payroll, rent and similar costs accrue continuously — not only on the due date.',
    },
    {
      title: 'Future bills already funded',
      body: 'VAT, insurance and annual costs become a monthly reserve move, so they stop arriving as surprises.',
    },
  ],
  aside:
    'Cash flow forecasts still have a place when you want a detailed future plan. Most owner-managed businesses do not run one every day — and bills still hit in lumps on dates. True Balance is the everyday alternative: understand now, with commitments and obligations already accounted for.',
} as const

export const HOME_METHOD_PILLARS = {
  eyebrow: 'Two principles',
  heading: 'The True Balance Method',
  lead: 'A practical discipline for understanding where the business stands. It rests on two principles.',
  pillars: [
    {
      id: 'daily-clarity',
      title: 'Commitments build every day',
      lead: 'Known commitments build every day before they are paid.',
      body: 'Payroll, rent, subscriptions and similar costs do not wait for payday. They accumulate continuously, so what is already spoken for stays visible — not only when money leaves the account.',
    },
    {
      id: 'reserve-planning',
      title: 'Irregular costs become monthly reserves',
      lead: 'Larger irregular costs become predictable monthly reserves instead of financial surprises.',
      body: 'VAT, insurance, tax and other annual bills are treated as steady amounts set aside over time. Large obligations stop arriving as shocks; they become part of an ordinary rhythm.',
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
  headingStart: "It's just ",
  headingHighlight: '3 steps.',
  lead: 'Set up once. Then a light daily check and a short monthly reserve review keep the picture honest.',
  steps: [
    {
      title: 'Known commitments build every day',
      body: 'Payroll, rent and similar costs accrue continuously. By mid-month you already see how much is spoken for — not only when the payment leaves the account.',
    },
    {
      title: 'Reserve Planner turns big bills monthly',
      body: 'VAT, insurance and annual costs are divided into a monthly transfer into or out of reserve. The platform tells you the amount each month so large bills stop catching you out.',
    },
    {
      title: 'One True Balance you can trust',
      body: 'Cash minus what’s already committed, plus realistic expected receipts. That single number is what you use for day-to-day decisions.',
    },
  ],
} as const

export const HOME_DIFFERENT_QUESTIONS = {
  heading: 'Different tools answer different questions',
  lead: 'Bookkeeping, accounting software, cash flow forecasts and the True Balance Method are not competing for the same job.',
  items: [
    {
      title: 'Bookkeeping & accounting',
      body: 'Record the past — what happened, what was owed, what was paid.',
    },
    {
      title: 'Cash flow forecast',
      body: 'Project the future — useful when kept up to date, but most owners don’t run one every day.',
    },
    {
      title: 'True Balance Method',
      body: 'Understand today — what’s already committed, what’s building, and what’s left in the business.',
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
