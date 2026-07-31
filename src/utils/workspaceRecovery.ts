import type { AppState, ExpectedReceipt, HistoryRecord, ReserveBill, ReservePlanner } from '../types'
import { MONTHS } from './format'
import { plannerMonthlyDeposit } from './reserveCalculations'
import { todayDateKey } from './snapshots'

function newId(): string {
  return crypto.randomUUID()
}

/** Latest history row per view scope, newest date first overall. */
export function latestHistoryRecords(state: AppState): HistoryRecord[] {
  const records = [...(state.historyRecords ?? [])].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.savedAt.localeCompare(a.savedAt)
  })
  const seen = new Set<string>()
  const latest: HistoryRecord[] = []
  for (const record of records) {
    const key = `${record.viewScope.type}:${record.viewScope.id}`
    if (seen.has(key)) continue
    seen.add(key)
    latest.push(record)
  }
  return latest
}

export function diagnoseReservePlanners(state: AppState): Array<{
  plannerId: string
  name: string
  businessId: string
  billCount: number
  monthlyDeposit: number
}> {
  return state.reservePlanners.map((planner) => ({
    plannerId: planner.id,
    name: planner.name,
    businessId: planner.businessId,
    billCount: planner.bills.length,
    monthlyDeposit: plannerMonthlyDeposit(planner.bills),
  }))
}

/**
 * Rebuild missing expected receipts from daily history snapshots.
 * History stores id/name/amount/scope — enough to restore the list (dates default to today).
 */
export function recoverExpectedReceiptsFromHistory(state: AppState): {
  state: AppState
  restoredCount: number
} {
  const existingIds = new Set(state.expectedReceipts.map((receipt) => receipt.id))
  const byId = new Map<string, HistoryRecord['expectedReceipts'][number]>()

  for (const record of latestHistoryRecords(state)) {
    for (const receipt of record.expectedReceipts ?? []) {
      if (existingIds.has(receipt.id) || byId.has(receipt.id)) continue
      if (receipt.received) continue
      byId.set(receipt.id, receipt)
    }
  }

  if (byId.size === 0) return { state, restoredCount: 0 }

  const restored: ExpectedReceipt[] = [...byId.values()].map((receipt, index) => ({
    id: receipt.id,
    name: receipt.name,
    amount: receipt.amount,
    expectedDate: todayDateKey(),
    scopeLevel: receipt.scopeLevel,
    scopeId: receipt.scopeId,
    received: false,
    sortOrder: state.expectedReceipts.length + index,
  }))

  return {
    state: {
      ...state,
      workspaceOrigin: 'user',
      expectedReceipts: [...state.expectedReceipts, ...restored],
    },
    restoredCount: restored.length,
  }
}

function monthAmountsForMonthlyDeposit(monthly: number): Record<string, number> {
  const amounts: Record<string, number> = {}
  if (monthly <= 0) return amounts
  for (const month of MONTHS) amounts[month] = monthly
  return amounts
}

/**
 * When a reserve planner still exists but its bills were wiped, rebuild a single
 * annual bill from the last history "budgetAmount" for that reserve row.
 */
export function recoverReserveBillsFromHistory(state: AppState): {
  state: AppState
  restoredPlannerIds: string[]
} {
  const restoredPlannerIds: string[] = []
  const history = latestHistoryRecords(state)

  const reserveBudgets = new Map<string, { name: string; budgetAmount: number; scopeId: string }>()
  for (const record of history) {
    for (const item of record.buildingUpItems ?? []) {
      if (item.source !== 'reserve' || item.budgetAmount <= 0) continue
      const key = `${item.scopeId}::${item.name}`
      if (!reserveBudgets.has(key)) {
        reserveBudgets.set(key, {
          name: item.name,
          budgetAmount: item.budgetAmount,
          scopeId: item.scopeId,
        })
      }
    }
    for (const item of record.dueItems ?? []) {
      if (item.source !== 'reserve' || item.amount <= 0) continue
      // Skip transfer-style rows without a matching planner budget already found.
      const key = `${item.scopeId}::${item.name}`
      if (!reserveBudgets.has(key)) {
        reserveBudgets.set(key, {
          name: item.name,
          budgetAmount: item.amount,
          scopeId: item.scopeId,
        })
      }
    }
  }

  const reservePlanners: ReservePlanner[] = state.reservePlanners.map((planner) => {
    if (plannerMonthlyDeposit(planner.bills) > 0) return planner

    const business = state.businesses.find((b) => b.id === planner.businessId)
    const candidates = [...reserveBudgets.values()].filter((entry) => {
      if (entry.scopeId === planner.businessId) return true
      const venue = state.venues.find((v) => v.id === entry.scopeId)
      if (venue?.businessId === planner.businessId) return true
      const name = entry.name.toLowerCase()
      const plannerName = planner.name.toLowerCase()
      const businessName = (business?.name ?? '').toLowerCase()
      return (
        name.includes(plannerName) ||
        plannerName.includes(name) ||
        (businessName && (name.includes(businessName) || businessName.includes(name)))
      )
    })

    const best = candidates.sort((a, b) => b.budgetAmount - a.budgetAmount)[0]
    if (!best || best.budgetAmount <= 0) return planner

    const monthly = best.budgetAmount
    const bill: ReserveBill = {
      id: newId(),
      plannerId: planner.id,
      name: `${best.name.replace(/\s+reserve.*$/i, '').trim() || planner.name} reserve provision`,
      monthAmounts: monthAmountsForMonthlyDeposit(monthly),
      createdAt: todayDateKey(),
      sortOrder: 0,
    }

    restoredPlannerIds.push(planner.id)
    return { ...planner, bills: [bill] }
  })

  if (restoredPlannerIds.length === 0) return { state, restoredPlannerIds }

  return {
    state: { ...state, workspaceOrigin: 'user', reservePlanners },
    restoredPlannerIds,
  }
}

export function recoverWorkspaceFromHistory(state: AppState): {
  state: AppState
  receiptsRestored: number
  plannersRepaired: string[]
  diagnosis: ReturnType<typeof diagnoseReservePlanners>
} {
  const receipts = recoverExpectedReceiptsFromHistory(state)
  const bills = recoverReserveBillsFromHistory(receipts.state)
  return {
    state: bills.state,
    receiptsRestored: receipts.restoredCount,
    plannersRepaired: bills.restoredPlannerIds,
    diagnosis: diagnoseReservePlanners(bills.state),
  }
}

export function reservePlannersMissingDeposit(state: AppState): string[] {
  return diagnoseReservePlanners(state)
    .filter((row) => row.monthlyDeposit <= 0)
    .map((row) => row.name || row.plannerId)
}
