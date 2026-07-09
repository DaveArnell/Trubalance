const MIN_MONTHLY_KEY = 'trubalance.bankImport.minMonthlyAmount'

export const BANK_IMPORT_MIN_MONTHLY_HELP =
  'Optional — only suggest recurring costs averaging at least this per month. Leave at 0 when first checking a statement import; raise it later to hide small subscriptions.'

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
