import { roundCurrency } from '../utils/amounts'
import type { ParsedBankTransaction } from './types'

export interface DailyTradingEstimate {
  averageDailyIncome: number
  averageDailyOtherOutgoings: number
  averageDailyNetTrading: number
  totalInflow: number
  totalOtherOutflow: number
  daySpan: number
  startDate: string | null
  endDate: string | null
}

export interface AverageDailyIncomeResult {
  averageDailyIncome: number
  totalInflow: number
  daySpan: number
  startDate: string | null
  endDate: string | null
}

function daySpanFromTransactions(transactions: ParsedBankTransaction[]): number {
  const dates = [...transactions.map((transaction) => transaction.date)].sort()
  if (dates.length === 0) return 0
  const start = new Date(`${dates[0]!}T12:00:00`)
  const end = new Date(`${dates[dates.length - 1]!}T12:00:00`)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1)
}

export function calculateDailyTradingEstimate(
  transactions: ParsedBankTransaction[],
  excludeTransactionIds?: Set<string>,
): DailyTradingEstimate {
  const dated = transactions.filter((transaction) => transaction.date)
  if (dated.length === 0) {
    return {
      averageDailyIncome: 0,
      averageDailyOtherOutgoings: 0,
      averageDailyNetTrading: 0,
      totalInflow: 0,
      totalOtherOutflow: 0,
      daySpan: 0,
      startDate: null,
      endDate: null,
    }
  }

  let totalInflow = 0
  let totalOtherOutflow = 0

  for (const transaction of dated) {
    if (excludeTransactionIds?.has(transaction.id)) continue
    if (transaction.moneyIn > 0) {
      totalInflow += transaction.moneyIn
    } else if (transaction.amount > 0) {
      totalInflow += transaction.amount
    }
    if (transaction.moneyOut > 0) {
      totalOtherOutflow += transaction.moneyOut
    } else if (transaction.amount < 0) {
      totalOtherOutflow += Math.abs(transaction.amount)
    }
  }

  totalInflow = roundCurrency(totalInflow)
  totalOtherOutflow = roundCurrency(totalOtherOutflow)

  const daySpan = daySpanFromTransactions(dated)
  const dates = [...dated.map((transaction) => transaction.date)].sort()

  return {
    averageDailyIncome: roundCurrency(totalInflow / daySpan),
    averageDailyOtherOutgoings: roundCurrency(totalOtherOutflow / daySpan),
    averageDailyNetTrading: roundCurrency((totalInflow - totalOtherOutflow) / daySpan),
    totalInflow,
    totalOtherOutflow,
    daySpan,
    startDate: dates[0] ?? null,
    endDate: dates[dates.length - 1] ?? null,
  }
}

export function calculateAverageDailyIncome(
  transactions: ParsedBankTransaction[],
): AverageDailyIncomeResult {
  const estimate = calculateDailyTradingEstimate(transactions)
  return {
    averageDailyIncome: estimate.averageDailyIncome,
    totalInflow: estimate.totalInflow,
    daySpan: estimate.daySpan,
    startDate: estimate.startDate,
    endDate: estimate.endDate,
  }
}
