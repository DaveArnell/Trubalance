/**
 * How It Works page — mechanism explanation (not a homepage sales repeat).
 */

import { PERSONAL_SETUP_CONTACT_PATH } from './earlyAccessPage'

export const HOW_IT_WORKS_HERO = {
  heading: 'How Cash Prophet keeps your financial picture current',
  lead:
    'Cash Prophet accounts for regular costs as they build, helps you prepare for larger future expenses, and brings those together into a consistent financial position you can check whenever you need it.',
  support: 'Set it up around your business, then keep it current with a simple check-in.',
} as const

export const HOW_IT_WORKS_ACCRUING = {
  heading: 'Regular costs build before payday',
  lead:
    'Rent, wages, utilities and other regular costs do not suddenly become relevant on the day they are paid. Cash Prophet progressively accounts for them through their payment cycle, so the amount already built up is reflected in your financial picture.',
} as const

export const HOW_IT_WORKS_RESERVE = {
  heading: 'Prepare for the bigger costs ahead',
  lead: [
    'VAT, corporation tax, insurance and other larger or irregular costs can be planned for gradually instead of landing as a sudden hit.',
    'Add the costs you know are coming and the Reserve Planner works out an approximate amount to put aside each month.',
  ],
  points: [
    'List the larger costs you expect.',
    'Cash Prophet spreads those costs into a manageable monthly reserve amount.',
    'Each month you can see how much should move into or out of the reserve account.',
    'The purpose is to make the larger costs predictable and funded.',
  ],
} as const

export const HOW_IT_WORKS_BALANCE = {
  heading: 'Bring it together into one underlying position',
  lead: [
    'Cash Prophet combines your current bank balance with the regular costs already building, the reserves you have planned and any realistic expected receipts.',
    'The result is your Cash Prophet Balance, a more consistent benchmark for the underlying financial position of the business.',
  ],
  afterExample:
    'Because known costs are accounted for progressively, the Cash Prophet Balance is less distorted by the timing of large payments than the bank balance alone.',
} as const

export const HOW_IT_WORKS_CHECKIN = {
  heading: 'Keep it current with a quick check-in',
  lead:
    'Once Cash Prophet is set up around your business, keeping the picture current is simple. Check in daily, every few days or weekly depending on how closely you want to follow the business.',
  steps: [
    'Update your balances',
    "Tick off what's been paid",
    'Add anything new',
    'See your current position',
  ],
  support: 'For a straightforward business, it can take just a few minutes.',
  reserveNote: 'Review the Reserve Planner periodically and confirm any recommended transfer.',
} as const

export const HOW_IT_WORKS_SETUP = {
  heading: 'Getting set up is straightforward',
  primaryLead: "During Early Access, we'll help you get Cash Prophet set up around your business.",
  includesIntro: 'Personal setup can include:',
  includes: [
    'understanding the existing regular costs',
    'setting up the Reserve Planner',
    'confirming the opening balances',
    'showing you the simple ongoing check-in',
  ],
  selfServe:
    'Prefer to do it yourself? You can still create an account and use the guided setup.',
  importNote:
    'You can also upload a CSV or PDF transaction history to help identify recurring costs for you to review and confirm.',
  primaryCta: 'Get personally set up',
  primaryHref: PERSONAL_SETUP_CONTACT_PATH,
  secondaryCta: 'Set up myself',
  secondaryHref: '/signup',
} as const

export const HOW_IT_WORKS_EARLY_ACCESS = {
  heading: 'Join Cash Prophet Early Access',
  body:
    'Cash Prophet is now open to independent hospitality and leisure businesses. The best way to get started is with a personal setup so we can help you get the financial picture right from the beginning.',
  primaryCta: 'Get personally set up',
  primarySupport: 'Free personal setup during Early Access',
  secondaryPrompt: 'Prefer to get started yourself?',
  secondaryCta: 'Set up my account',
} as const
