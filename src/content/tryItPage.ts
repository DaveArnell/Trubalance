export const TRY_IT_PAGE = {
  navLabel: 'Try It',
  path: '/try-it',
  title: "See how much of today's bank balance is already spoken for",
  lead:
    "Regular bills can be building up long before the money actually leaves your account.\n\nEnter a few of yours below and see how Cash Prophet accounts for them as part of your day-to-day financial picture.",
  freeBadge: 'Free check · no signup',
  bank: {
    heading: "What's in your business bank account today?",
    hint: "Enter the balance you'd normally trust at a glance.",
  },
  regular: {
    heading: 'Monthly accruing bills',
    lead:
      'Add the bills that hit every month. Each one builds through its payment cycle, so only the amount accrued so far is treated as spoken for today.',
    examplesHint: 'Examples: payroll, rent, loan, utilities, software.',
    addLabel: 'Add monthly bill',
    nameLabel: 'Bill name',
    namePlaceholder: 'e.g. Rent',
    amountLabel: 'Monthly amount',
    dueDayLabel: 'Due day',
    dueDayPlaceholder: '28',
    empty: "Add your bills to see how much of today's balance is already spoken for.",
    kpiMonthly: 'Monthly total',
    kpiAccrued: 'Accrued now',
  },
  other: {
    heading: 'Other bills owed',
    lead:
      'Add any other amounts that should come out of today\'s position in full, such as invoices due, tax already owed or one-off bills waiting to be paid.',
    examplesHint: 'Examples: supplier invoice, VAT already owed, equipment invoice.',
    addLabel: 'Add other bill',
    nameLabel: 'Bill name',
    namePlaceholder: 'e.g. Supplier invoice',
    amountLabel: 'Amount owed',
    empty: 'Optional. Add bills that should be deducted in full today.',
    kpiTotal: 'To deduct',
  },
  result: {
    bankLabel: 'Your bank balance',
    accruedLabel: 'Less monthly bills accrued',
    otherLabel: 'Less other bills owed',
    availableLabel: "After what's already spoken for",
    emptyBank: 'Enter your bank balance to get started.',
    spokenPrefix: "Based on the costs you've entered,",
    spokenSuffix: "of today's bank balance is already spoken for.",
  },
  explain: {
    heading: "That's one part of the picture Cash Prophet keeps organised",
    intro:
      "You've just accounted for some of the costs already sitting behind today's bank balance.\n\nCash Prophet keeps the wider day-to-day financial picture organised too.",
    points: [
      'What bills are coming up',
      'What is already building towards them',
      'What to put aside for bigger future costs',
      'Where the business stands',
      'Whether that position is getting better or worse',
    ],
    closing: 'Instead of working all of that out yourself, Cash Prophet keeps it together in one place.',
  },
  cta: {
    primary: 'See it with a live business',
    primaryHref: '/see-how-it-works',
    secondary: 'Join Early Access',
    secondaryHref: '/early-access',
  },
} as const

/** Optional café flavour for /try-it?sector=cafe. Does not change the calculator. */
export const TRY_IT_CAFE = {
  title: "See how much of today's café bank balance is already spoken for",
  lead:
    "Regular café costs can be building up long before payday.\n\nEnter a few of yours below and see how Cash Prophet accounts for them as part of your day-to-day financial picture.",
  bankHint: 'Enter the café current-account balance you would normally trust at a glance.',
  regularExamples: 'Examples: wages, rent, coffee wholesale, utilities, card fees.',
  regularPlaceholder: 'e.g. Wages',
  otherExamples: 'Examples: supplier invoice, VAT already owed, equipment invoice.',
} as const
