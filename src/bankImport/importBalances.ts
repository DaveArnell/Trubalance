import type { AppActions } from '../hooks/useAppState'
import type { ParsedBankTransaction } from './types'
import type { AccountImportResult } from './importCentre'

export function latestClosingBalanceFromTransactions(
  transactions: ParsedBankTransaction[],
): number | null {
  const withBalance = transactions.filter(
    (transaction) => transaction.balance != null && Number.isFinite(transaction.balance),
  )
  if (withBalance.length === 0) return null
  const sorted = [...withBalance].sort((a, b) => a.date.localeCompare(b.date))
  return sorted[sorted.length - 1]!.balance!
}

export function applyImportBalancesToAccounts(
  results: AccountImportResult[],
  actions: Pick<AppActions, 'updateAccountBalance'>,
): number {
  let updated = 0
  for (const result of results) {
    if (result.skipped) continue
    const balance = latestClosingBalanceFromTransactions(result.session.transactions)
    if (balance == null) continue
    actions.updateAccountBalance(result.accountId, balance)
    updated++
  }
  return updated
}
