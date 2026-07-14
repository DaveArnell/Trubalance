/** Shared copy for the True Balance Method framework. */

export const METHOD_PAGE_PATH = '/true-balance-method' as const

export const METHOD_BLOG_CATEGORY = 'The True Balance Method' as const

export const METHOD_PAGE_TITLE = 'The True Balance Method'

export const METHOD_PAGE_SUBTITLE =
  'Understand what money your business actually has available.'

/** Three principles — primary vocabulary for the Method. */
export const METHOD_THREE_PRINCIPLES = [
  {
    id: 'continuous-accrual',
    title: 'Continuous Accrual',
    lead: 'Regular monthly costs should not suddenly appear on payment day.',
    body: 'These costs build up every day. The method continuously accrues them so today’s financial position already reflects tomorrow’s obligations.',
    examples: [
      'Payroll',
      'Rent',
      'Utilities',
      'Finance',
      'Subscriptions',
      'Business rates',
    ],
  },
  {
    id: 'reserve-planning',
    title: 'Reserve Planning',
    lead: 'Large irregular bills should never become financial surprises.',
    body: 'Instead of one large payment day, these become manageable daily or monthly reserve amounts. You can gradually move money into savings if you wish — already confident the reserve has been calculated.',
    examples: [
      'VAT',
      'Corporation tax',
      'Annual insurance',
      'Quarterly rent',
      'Service charges',
      'Annual licences',
    ],
  },
  {
    id: 'one-decision-number',
    title: 'One Decision Number',
    lead: 'The bank balance becomes a reference.',
    body: 'True Balance becomes the number used when making spending decisions — not the raw figure in the bank app.',
    examples: ['Purchases', 'Hires', 'Quiet months', 'Owner drawings'],
  },
] as const

export const METHOD_WHY_IT_WORKS = [
  'No more wondering if the money is actually available',
  'No more forgetting annual bills',
  'Less stress around VAT and tax',
  'A more stable picture of the business',
  'Better spending decisions',
  'Greater confidence day to day',
] as const

export const METHOD_ROUTINE_HABITS = [
  'Refresh your bank balance',
  'Mark payments as paid',
  'Add or edit commitments when something changes',
  'Occasionally review your reserve planner',
] as const

export const METHOD_SOFTWARE_HELPS = [
  'Tracks daily accruals',
  'Maintains reserve plans',
  'Monitors expected receipts',
  'Calculates the continuously changing True Balance',
  'Keeps everything in one place',
] as const

/** @deprecated Prefer METHOD_THREE_PRINCIPLES — kept for older references. */
export const METHOD_FOUR_PRINCIPLES = [
  'Do not manage the business from the bank balance alone.',
  'Account for commitments as they build up, rather than waiting until they are paid.',
  'Build virtual reserves for irregular bills before they become due.',
  'Keep the position current through small, regular updates.',
] as const

/** @deprecated Prefer METHOD_THREE_PRINCIPLES narrative. */
export const METHOD_STEPS = [
  'Start with current available cash.',
  'Account for money already committed or building up for future obligations.',
  'Add only realistic expected receipts where appropriate.',
  'Produce a True Balance that can be used for day-to-day financial decisions.',
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

export const METHOD_ONGOING_ROUTINE = [
  'Refresh your bank balances.',
  'Mark payments as paid when they leave the account.',
  'Add or edit commitments when something in the business changes.',
  'Occasionally review the reserve planner.',
  'Move reserve money into savings if you wish — usually as a monthly habit.',
] as const

export const METHOD_FOR_ACCOUNTANTS = [
  'It complements accounting software rather than replacing it.',
  'It helps clients understand their current position between formal reports.',
  'It builds better day-to-day financial routines.',
  'It may reduce clients being surprised by VAT, tax and irregular bills.',
  'It does not replace professional accounting or tax advice.',
] as const

export const METHOD_MANTRA =
  'Do not manage your business from your bank balance. Manage it from your True Balance.'
