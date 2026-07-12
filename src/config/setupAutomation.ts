/**
 * Setup automation — bank statement import uses server-side AI (OpenAI via Supabase).
 */

/** When false, Settings hides bank statement import. */
export const BANK_IMPORT_ENABLED = true

export type SetupAutomationMode = 'manual' | 'statement_review'

export type DataSourceId = 'csv' | 'open_banking' | 'xero' | 'quickbooks'

export interface DataSourceOption {
  id: DataSourceId
  title: string
  description: string
  status: 'available' | 'coming_soon'
  etaLabel?: string
}

export const SETUP_DATA_SOURCES: DataSourceOption[] = [
  {
    id: 'csv',
    title: 'Bank statement (CSV or PDF)',
    description:
      'Upload your export. AI suggests monthly costs, reserve bills and receipts — you review everything before it is added.',
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
    description: 'Import bills and bank feeds from Xero for the same assisted setup.',
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

export const BANK_IMPORT_NOTE =
  'Upload a statement, review what the AI suggests, then accept only what you want. Nothing is added automatically. CSV exports usually work best.'

export const STATEMENT_SETUP_VALUE_PROPS = [
  'Upload CSV or PDF from your bank',
  'AI suggests monthly costs, reserves and receipts',
  'You accept, edit or ignore each suggestion',
  'Adjust anything later in Settings',
] as const

export const FUTURE_AUTO_FEATURES = {
  bankBalanceSync: 'One-tap refresh from linked accounts',
  duePaymentMatching: 'Suggest when a bank payment matches an expected due item',
  ongoingAutoTune: 'Improve detection from what you edit or dismiss',
} as const
