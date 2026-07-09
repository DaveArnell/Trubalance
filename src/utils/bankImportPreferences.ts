const MIN_MONTHLY_KEY = 'trubalance.bankImport.minMonthlyAmount'

export const BANK_IMPORT_MIN_MONTHLY_HELP =
  'When scanning your statement we only suggest recurring outgoing payments (rent, payroll, subscriptions, etc.). Items averaging less than this per month are skipped — useful to hide small noise. Leave at 0 to include everything; £200+ often hides most real bills.'

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
