import type { Account } from '../types'

export function toAmount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Whole pounds — matches formatCurrency display elsewhere in the app. */
export function roundCurrency(value: number): number {
  return Math.round(toAmount(value))
}

export function sumAccountBalances(accounts: Account[]): number {
  return accounts.reduce((sum, account) => sum + toAmount(account.balance), 0)
}
