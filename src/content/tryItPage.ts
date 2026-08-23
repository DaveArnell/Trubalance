import { TRIAL_DAYS } from '../config/subscriptionTiers'
import { CASH_PROPHET_BALANCE } from './brandFoundation'

export const TRY_IT_PAGE = {
  navLabel: 'Try It',
  path: '/try-it',
  title: 'How much of your bank balance is actually yours?',
  lead:
    'The number in your bank account does not show costs and commitments already building up. This free check applies the Cash Prophet approach. No account needed.',
  freeBadge: 'Free check · no signup',
  bank: {
    heading: 'What’s in your business bank account today?',
    hint: 'Enter the balance you’d normally trust at a glance.',
  },
  regular: {
    heading: 'Monthly accruing bills',
    lead:
      'Add the bills that hit every month. Each one builds through its payment cycle, so only the amount accrued so far is treated as spoken for today.',
    examplesHint: 'Examples: payroll, rent, loan, utilities, software. Add whatever fits your business.',
    addLabel: 'Add monthly bill',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Rent',
    amountLabel: 'Monthly',
    dueDayLabel: 'Due day',
    empty: 'Add a monthly bill below to see how much of this is already spoken for.',
    kpiMonthly: 'Monthly total',
    kpiAccrued: 'Accrued now',
  },
  other: {
    heading: 'Other bills owed',
    lead:
      'Add any other amounts that should come out of today’s balance in full: invoices due, tax you already owe, one-off bills waiting to be paid.',
    examplesHint: 'Examples: supplier invoice due, VAT already owed, equipment invoice, other known amounts to deduct.',
    addLabel: 'Add other bill',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Supplier invoice',
    amountLabel: 'Amount owed',
    empty: 'Optional. Add bills that should be deducted in full today.',
    kpiTotal: 'To deduct',
  },
  result: {
    bankLabel: 'Your bank balance',
    accruedLabel: 'Less monthly bills accrued',
    otherLabel: 'Less other bills owed',
    availableLabel: 'Actually yours today',
    emptyBank: 'Enter your bank balance to see what is actually yours.',
  },
  explain: {
    heading: 'This is the number Cash Prophet keeps clear for you every day',
    intro:
      'You have just done by hand what Cash Prophet does quietly in the background: separate what is already spoken for from what is actually yours.',
    points: [
      'Keeps monthly bills accruing correctly as the days pass',
      'Shows other amounts owed when they need to come out of today’s position',
      `Gives you a reliable ${CASH_PROPHET_BALANCE}`,
      'Records that balance over time so you can see the real direction of the business',
      'Cuts through the noise of large bills hitting the bank on different days',
    ],
    closing:
      'This free check is a snapshot for today. Cash Prophet is the ongoing system and history, with free personal onboarding if you want a guided start.',
  },
  cta: {
    heading: 'Keep track of this every day with Cash Prophet',
    body: `Start ${TRIAL_DAYS} days free. Free personal onboarding is available if you want a guided setup.`,
    primary: `Start ${TRIAL_DAYS} days free`,
    secondary: 'Enquire / free onboarding',
    tertiary: 'See how it works',
  },
} as const

/** Optional café flavour for /try-it?sector=cafe. Does not change the calculator. */
export const TRY_IT_CAFE = {
  title: 'How much of your café bank balance is actually yours?',
  lead:
    'Enter the café current-account balance, wages, rent and regular bills. This free check shows how much is already spoken for today. No account needed.',
  bankHint: 'Enter the café current-account balance you would normally trust at a glance.',
  regularExamples:
    'Examples: wages, rent, coffee wholesale standing order, utilities, card fees. Add whatever fits your café.',
  regularPlaceholder: 'e.g. Wages',
  otherExamples: 'Examples: supplier invoice due, VAT already owed, equipment invoice, other known amounts to deduct.',
} as const
