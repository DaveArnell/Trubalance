import { roundCurrency } from '../utils/amounts'
import type { ParsedBankTransaction } from './types'

/** UK statement type codes at the start of a description. */
export function inferDirectionFromDescription(description: string): 'in' | 'out' | null {
  const upper = description.toUpperCase().trim()
  if (/^(DD|DDR|SO|STO|FPO|DEB|DIV|TEL|CHQ|PAY|DCP|POS|VIS)\b/.test(upper)) return 'out'
  if (/^(FPI|BGC|CR|DEP|BAC|CHAPS\s+CR)\b/.test(upper)) return 'in'
  if (/\bINTERNAL\s+TRANSFER\b/.test(upper) || /\bSWEEP\b/.test(upper)) return 'out'
  return null
}

export function countParsedOutflows(transactions: ParsedBankTransaction[]): number {
  return transactions.filter((transaction) => transaction.amount < 0).length
}

function movementMatchesBalanceDelta(parsedAbs: number, balanceDelta: number): boolean {
  if (parsedAbs === 0 || balanceDelta === 0) return false
  const deltaAbs = Math.abs(balanceDelta)
  const tolerance = Math.max(0.02, deltaAbs * 0.02)
  return Math.abs(parsedAbs - deltaAbs) <= tolerance
}

/**
 * Use running balances to fix mis-signed or mis-columned amounts from PDF/CSV imports.
 * Lloyds and similar UK statements always include a balance column — this is the most reliable signal.
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

    if (parsedAbs === 0) {
      return {
        ...transaction,
        moneyIn: balanceDelta > 0 ? deltaAbs : 0,
        moneyOut: balanceDelta < 0 ? deltaAbs : 0,
        amount: balanceDelta,
      }
    }

    if (!movementMatchesBalanceDelta(parsedAbs, balanceDelta)) {
      return {
        ...transaction,
        moneyIn: balanceDelta > 0 ? deltaAbs : 0,
        moneyOut: balanceDelta < 0 ? deltaAbs : 0,
        amount: balanceDelta,
      }
    }

    if (transaction.amount > 0 && balanceDelta < 0) {
      return {
        ...transaction,
        moneyIn: 0,
        moneyOut: deltaAbs,
        amount: -deltaAbs,
      }
    }

    if (transaction.amount < 0 && balanceDelta > 0) {
      return {
        ...transaction,
        moneyIn: deltaAbs,
        moneyOut: 0,
        amount: deltaAbs,
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
