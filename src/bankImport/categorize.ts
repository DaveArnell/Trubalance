import type { SuggestionCategory, SuggestionDestination, SuggestionFrequency } from './types'

interface CategoryMatch {
  category: SuggestionCategory
  label: string
  score: number
}

const RULES: { category: SuggestionCategory; label: string; patterns: RegExp[] }[] = [
  {
    category: 'hmrc',
    label: 'HMRC / tax',
    patterns: [/HMRC/, /TAX/, /\bVAT\b/, /PAYE/, /CORPORATION TAX/],
  },
  {
    category: 'payroll',
    label: 'Payroll / wages',
    patterns: [/PAYROLL/, /WAGES/, /SALARY/, /SALARIES/, /PAYE REFUND/],
  },
  {
    category: 'rent',
    label: 'Rent',
    patterns: [/RENT/, /LANDLORD/, /LEASE/, /PROPERTY MAN/],
  },
  {
    category: 'utilities',
    label: 'Utilities',
    patterns: [/ELECTRIC/, /GAS/, /WATER/, /UTIL/, /BROADBAND/, /BT GROUP/, /VIRGIN MEDIA/, /SCOTTISH POWER/],
  },
  {
    category: 'insurance',
    label: 'Insurance',
    patterns: [/INSURANCE/, /INSURE/, /AXA/, /AVIVA/, /ZURICH/],
  },
  {
    category: 'loan',
    label: 'Loan / finance',
    patterns: [/LOAN/, /MORTGAGE/, /FINANCE/, /HP /, /HIRE PURCHASE/],
  },
  {
    category: 'subscription',
    label: 'Subscription',
    patterns: [
      /NETFLIX/,
      /SPOTIFY/,
      /ADOBE/,
      /MICROSOFT/,
      /AMAZON PRIME/,
      /SUBSCRIPTION/,
      /GITHUB/,
      /GOOGLE STORAGE/,
    ],
  },
  {
    category: 'transfer',
    label: 'Transfer',
    patterns: [
      /INTERNAL\s+TRANSFER/,
      /\bSWEEP\b/,
      /\bTFR\b.*\b(?:SAV|SAVINGS|RESERVE)\b/,
      /\bTO\s+(?:SAV|SAVINGS)\b/,
      /\bFROM\s+(?:SAV|SAVINGS)\b/,
    ],
  },
  {
    category: 'customer_receipt',
    label: 'Customer receipt',
    patterns: [/STRIPE/, /SQUARE/, /PAYPAL/, /WORLD PAY/, /CUSTOMER/, /INVOICE PAID/, /SALES/],
  },
]

export function categorizeDescription(description: string, isInflow: boolean): CategoryMatch {
  const upper = description.toUpperCase()

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(upper))) {
      return { category: rule.category, label: rule.label, score: 20 }
    }
  }

  if (isInflow) {
    return { category: 'customer_receipt', label: 'Income', score: 5 }
  }

  return { category: 'supplier', label: 'Supplier / cost', score: 0 }
}

/**
 * Bank statements show payments that already happened.
 * We only suggest regular monthly outgoings for the accruing costs table — never due bills or reserve items.
 */
export function suggestDestination(
  category: SuggestionCategory,
  frequency: SuggestionFrequency,
  isInflow: boolean,
): SuggestionDestination {
  if (category === 'transfer') return 'ignore'
  if (category === 'customer_receipt') return 'ignore'
  if (isInflow) return 'ignore'
  if (frequency !== 'monthly') return 'ignore'
  return 'building_commitment'
}

/** Normalise legacy destination values to monthly accruing costs. */
export function normalizeDestination(destination: SuggestionDestination): SuggestionDestination {
  if (
    destination === 'commitment' ||
    destination === 'building_commitment' ||
    destination === 'due_commitment' ||
    destination === 'planned_commitment'
  ) {
    return 'building_commitment'
  }
  return destination
}

export function categoryDisplayName(category: SuggestionCategory): string {
  const found = RULES.find((rule) => rule.category === category)
  if (found) return found.label
  if (category === 'supplier') return 'Supplier / cost'
  if (category === 'other') return 'Other'
  return category
}

export function destinationDisplayName(destination: SuggestionDestination): string {
  switch (normalizeDestination(destination)) {
    case 'building_commitment':
      return 'Regular monthly outgoing'
    case 'reserve_bill':
      return 'Reserve planner bill'
    case 'expected_receipt':
      return 'Expected receipt'
    case 'ignore':
      return 'Ignore / not relevant'
    default:
      return 'Regular monthly outgoing'
  }
}

export const BANK_IMPORT_DESTINATION_OPTIONS: {
  value: SuggestionDestination
  label: string
}[] = [
  { value: 'building_commitment', label: 'Regular monthly outgoing' },
  { value: 'ignore', label: 'Ignore' },
]

/** @deprecated Use BANK_IMPORT_DESTINATION_OPTIONS in bank import UI. */
export const ALL_SUGGESTION_DESTINATIONS: SuggestionDestination[] = [
  'building_commitment',
  'ignore',
]

export function frequencyDisplayName(frequency: SuggestionFrequency): string {
  switch (frequency) {
    case 'weekly':
      return 'Weekly'
    case 'monthly':
      return 'Monthly'
    case 'quarterly':
      return 'Quarterly'
    case 'annual':
      return 'Annual'
    case 'irregular':
      return 'Irregular'
    case 'one_off':
      return 'One-off'
  }
}
