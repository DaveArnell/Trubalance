/** Shared copy for the True Balance Method framework. */

export const METHOD_PAGE_PATH = '/true-balance-method' as const

export const METHOD_BLOG_CATEGORY = 'The True Balance Method' as const

export const METHOD_FOUR_PRINCIPLES = [
  'Do not manage the business from the bank balance alone.',
  'Account for commitments as they build up, rather than waiting until they are paid.',
  'Build virtual reserves for irregular bills before they become due.',
  'Keep the position current through small, regular updates.',
] as const

export const METHOD_STEPS = [
  'Start with current available cash.',
  'Account for money already committed or building up for future obligations.',
  'Add only realistic expected receipts where appropriate.',
  'Produce a True Balance that can be used for day-to-day financial decisions.',
  'Regularly update the few things that have changed.',
] as const

export const METHOD_WORKED_EXAMPLE = {
  availableCash: '£42,500',
  committed: '£18,200',
  expectedReceipts: '£3,000',
  trueBalance: '£27,300',
} as const

export const METHOD_ONGOING_ROUTINE = [
  'Update bank account balances regularly.',
  'Mark payments as paid when they leave the account.',
  'Add or change commitments when something in the business changes.',
  'Review the reserve planner and suggested amounts.',
  'Transfer the suggested reserve into savings — normally as part of a monthly routine.',
] as const

export const METHOD_FOR_ACCOUNTANTS = [
  'It complements accounting software rather than replacing it.',
  'It helps clients understand their current position between formal reports.',
  'It builds better day-to-day financial routines.',
  'It may reduce clients being surprised by VAT, tax and irregular bills.',
  'It does not replace professional accounting or tax advice.',
] as const
