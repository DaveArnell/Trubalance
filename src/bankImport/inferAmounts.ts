import { roundCurrency } from '../utils/amounts'
import type { ParsedBankTransaction } from './types'

/** UK statement type codes at the start of a description. */
export function inferDirectionFromDescription(description: string): 'in' | 'out' | null {
  const upper = description.toUpperCase().trim()
  if (
    /^(BILL PAYMENT|DIRECT DEBIT|STANDING ORDER|DEBIT\b|FASTER PAYMENT|CARD PAYMENT)\b/.test(
      upper,
    )
  ) {
    return 'out'
  }
  if (/^(COUNTER\s+CREDIT|BANK GIRO CREDIT|CREDIT\b|BGC\b)/.test(upper)) return 'in'
  if (/^(DD|DDR|SO|STO|FPO|DEB|DIV|TEL|CHQ|PAY|DCP|POS|VIS)\b/.test(upper)) return 'out'
  if (/^(FPI|BGC|CR|DEP|BAC|CHAPS\s+CR)\b/.test(upper)) return 'in'
  if (/\bINTERNAL\s+TRANSFER\b/.test(upper) || /\bSWEEP\b/.test(upper) || /\bTRNS\s+FT\b/.test(upper)) {
    return 'out'
  }
  return null
}

export function countParsedOutflows(transactions: ParsedBankTransaction[]): number {
  return transactions.filter((transaction) => transaction.amount < 0).length
}

/**
 * Fill a missing amount from the running balance when the file had no money in/out.
 * Do not overwrite an amount the statement already gave.
 */
export function inferAmountsFromRunningBalance(
  transactions: ParsedBankTransaction[],
): ParsedBankTransaction[] {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
  let previousBalance: number | undefined

  const corrected = sorted.map((transaction) => {
    const balance = transaction.balance
    if (balance == null || !Number.isFinite(balance)) {
      return transaction
    }

    const balanceDelta =
      previousBalance != null ? roundCurrency(balance - previousBalance) : null
    previousBalance = balance

    if (balanceDelta == null || balanceDelta === 0) {
      return transaction
    }

    const deltaAbs = Math.abs(balanceDelta)
    const parsedAbs = Math.abs(transaction.amount) || Math.max(transaction.moneyIn, transaction.moneyOut)

    // Only fill a missing amount from the running balance. Never replace a
    // parsed payment with a balance-to-balance jump — same-day rows get
    // shuffled and those jumps look like £40k “bills”.
    if (parsedAbs === 0) {
      return {
        ...transaction,
        moneyIn: balanceDelta > 0 ? deltaAbs : 0,
        moneyOut: balanceDelta < 0 ? deltaAbs : 0,
        amount: balanceDelta,
      }
    }

    return transaction
  })

  const byId = new Map(corrected.map((transaction) => [transaction.id, transaction]))
  return transactions.map((transaction) => byId.get(transaction.id) ?? transaction)
}

export function resolveSignedAmount(
  description: string,
  moneyIn: number,
  moneyOut: number,
): number {
  const inflow = Math.abs(moneyIn)
  const outflow = Math.abs(moneyOut)

  if (inflow > 0 && outflow === 0) return inflow
  if (outflow > 0 && inflow === 0) return -outflow

  if (inflow > 0 && outflow > 0) {
    const direction = inferDirectionFromDescription(description)
    if (direction === 'out') return -outflow
    if (direction === 'in') return inflow
    return inflow >= outflow ? inflow : -outflow
  }

  return 0
}
