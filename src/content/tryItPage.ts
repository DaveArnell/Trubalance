import { TRIAL_DAYS } from '../config/subscriptionTiers'
import { CASH_PROPHET_BALANCE } from './brandFoundation'

export const TRY_IT_PAGE = {
  navLabel: 'Try It',
  path: '/try-it',
  title: 'How much of your bank balance is actually available to use?',
  lead:
    'The number in your bank account doesn’t show costs and commitments already building up. This free check applies the Cash Prophet approach — no account needed.',
  freeBadge: 'Free check · no signup',
  bank: {
    heading: 'What’s in your business bank account today?',
    hint: 'Enter the balance you’d normally trust at a glance.',
  },
  regular: {
    heading: 'Regular monthly costs',
    lead:
      'Add the bills that hit every month. Cash Prophet treats each one as building through the payment cycle — not as if the whole amount is gone on day one.',
    examplesHint: 'Examples: payroll, rent, loan, utilities, software — add whatever fits your business.',
    addLabel: 'Add a regular cost',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Rent',
    amountLabel: 'Monthly amount',
    dueDayLabel: 'Due day of month',
    empty: 'Add at least one regular cost to see how much has already accrued.',
  },
  irregular: {
    heading: 'Larger or irregular future costs',
    lead:
      'Many businesses also know about bigger bills across the year — tax, insurance, licences, equipment, servicing, annual subscriptions. You don’t need a perfect list here.',
    question: 'Roughly how much do you expect to spend over the year on larger or irregular bills?',
    hint: 'Optional. Leave blank if you’re not sure — this is only a simplified estimate for the free check.',
    examplesHint:
      'e.g. VAT/tax, annual insurance, licences, equipment, servicing, annual subscriptions',
  },
  result: {
    bankLabel: 'Your bank balance',
    accruedLabel: 'Less regular costs accrued',
    availableLabel: 'Your available position today',
    provisionHeading: 'Also plan for irregular costs',
    provisionBody:
      'Based on your annual estimate, a simple monthly provision would be about {monthly} (around {daily} a day). Cash Prophet’s Reserve Planner structures this properly over real due months.',
    emptyBank: 'Enter your bank balance to see your available position.',
  },
  explain: {
    heading: 'You’ve just done manually what Cash Prophet does every day',
    body: [
      `This free check is a snapshot for today. ${CASH_PROPHET_BALANCE} in the full product stays updated as commitments build, due items appear, and reserves accrue — so you’re not redoing the maths in your head.`,
      'Cash Prophet keeps regular commitments visible, helps provision for larger future costs, records your balance over time, and shows the underlying direction of the business without the noise of large payments hitting the bank on different days.',
      'It sits alongside your accounting software — not instead of it — and runs quietly with a light daily habit.',
    ],
  },
  cta: {
    heading: 'Keep track of this every day with Cash Prophet',
    body: `Start ${TRIAL_DAYS} days free. Free personal onboarding is available if you want a guided setup.`,
    primary: `Start ${TRIAL_DAYS} days free`,
    secondary: 'Enquire / free onboarding',
    tertiary: 'See how it works',
  },
} as const
