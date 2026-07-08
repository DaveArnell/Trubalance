/**
 * Setup automation roadmap and policies.
 * CSV auto-apply ships today; bank / accounting links are staged behind feature flags.
 */

export type SetupAutomationMode = 'auto' | 'guided' | 'manual'

export type DataSourceId = 'csv' | 'open_banking' | 'xero' | 'quickbooks'

export interface DataSourceOption {
  id: DataSourceId
  title: string
  description: string
  status: 'available' | 'coming_soon'
  etaLabel?: string
}

/** Minimum confidence before auto-apply accepts a detected item (0–100). */
export const AUTO_APPLY_MIN_CONFIDENCE = 55

/** Suggestions below this confidence are never auto-applied even in auto mode. */
export const AUTO_APPLY_HIGH_CONFIDENCE = 70

export const SETUP_DATA_SOURCES: DataSourceOption[] = [
  {
    id: 'csv',
    title: 'Bank statement (PDF or CSV)',
    description: 'Upload a PDF export or CSV from your bank. Works today.',
    status: 'available',
  },
  {
    id: 'open_banking',
    title: 'Link bank account',
    description: 'Connect current and savings accounts. We pull transactions and keep balances updated.',
    status: 'coming_soon',
    etaLabel: 'Coming soon',
  },
  {
    id: 'xero',
    title: 'Connect Xero',
    description: 'Import bills, invoices, and bank feeds from Xero for the same auto-setup.',
    status: 'coming_soon',
    etaLabel: 'Coming soon',
  },
  {
    id: 'quickbooks',
    title: 'Connect QuickBooks',
    description: 'Import recurring costs and receipts from QuickBooks Online.',
    status: 'coming_soon',
    etaLabel: 'Coming soon',
  },
]

export const AUTO_SETUP_VALUE_PROPS = [
  'Name your group structure',
  'Add bank data (PDF or CSV today, bank link soon)',
  'We create monthly costs, reserve bills, and your forecast',
  'Adjust anything later in Settings',
] as const

/** Post-MVP: match linked transactions to due payments and suggest marking paid. */
export const FUTURE_AUTO_FEATURES = {
  bankBalanceSync: 'One-tap refresh from linked accounts',
  duePaymentMatching: 'Suggest when a bank payment matches an expected due item',
  ongoingAutoTune: 'Improve detection from what you edit or dismiss',
} as const
