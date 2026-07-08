const MIN_MONTHLY_KEY = 'trubalance.bankImport.minMonthlyAmount'

export const BANK_IMPORT_MIN_MONTHLY_HELP =
  'When we scan your statement we look for payments that repeat. Items averaging less than this per month are skipped — useful to hide small subscriptions and surface meaningful bills like rent or payroll. Leave at 0 to show everything.'

export function readBankImportMinMonthlyAmount(): number {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(MIN_MONTHLY_KEY)
  if (!raw) return 0
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function writeBankImportMinMonthlyAmount(value: number): void {
  if (typeof window === 'undefined') return
  if (!Number.isFinite(value) || value <= 0) {
    window.localStorage.removeItem(MIN_MONTHLY_KEY)
    return
  }
  window.localStorage.setItem(MIN_MONTHLY_KEY, String(value))
}
