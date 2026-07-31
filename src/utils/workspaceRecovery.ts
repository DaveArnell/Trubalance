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
 * History stores the *effective* amount on that day (not always the full receipt),
 * so we keep the history date as expectedDate — never force "today" (that spikes Trends).
 */
export function recoverExpectedReceiptsFromHistory(state: AppState): {
  state: AppState
  restoredCount: number
} {
  const existingIds = new Set(state.expectedReceipts.map((receipt) => receipt.id))
  const byId = new Map<
    string,
    HistoryRecord['expectedReceipts'][number] & { historyDate: string }
  >()

  const sortedHistory = [...(state.historyRecords ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  for (const record of sortedHistory) {
    for (const receipt of record.expectedReceipts ?? []) {
      if (existingIds.has(receipt.id)) continue
      if (receipt.received) continue
      const prev = byId.get(receipt.id)
      if (!prev) {
        byId.set(receipt.id, { ...receipt, historyDate: record.date })
        continue
      }
      // Keep the earliest date and the largest amount seen for that id.
      byId.set(receipt.id, {
        ...prev,
        amount: Math.max(prev.amount, receipt.amount),
        historyDate: prev.historyDate <= record.date ? prev.historyDate : record.date,
      })
    }
  }

  if (byId.size === 0) return { state, restoredCount: 0 }

  const restored: ExpectedReceipt[] = [...byId.values()].map((receipt, index) => {
    const expectedDate = receipt.historyDate
    const accrualStartDate = `${expectedDate.slice(0, 7)}-01`
    return {
      id: receipt.id,
      name: receipt.name,
      amount: receipt.amount,
      expectedDate,
      accrualStartDate,
      createdAt: expectedDate,
      receiptTiming: 'accrual' as const,
      scopeLevel: receipt.scopeLevel,
      scopeId: receipt.scopeId,
      received: false,
      notes: 'Restored from balance history — check date and amount',
      sortOrder: state.expectedReceipts.length + index,
    }
  })

  return {
    state: {
      ...state,
      workspaceOrigin: 'user',
      expectedReceipts: [...state.expectedReceipts, ...restored],
    },
    restoredCount: restored.length,
  }
}

/**
 * Fix receipts restored earlier with expectedDate=today (which inflated today's Trends).
 * Aligns dates/amounts back to history and drops empty transfer-like noise rows.
 */
export function repairHistoryRecoveredReceipts(state: AppState): {
  state: AppState
  repairedCount: number
  removedCount: number
} {
  const today = todayDateKey()
  const historyById = new Map<string, { date: string; amount: number; name: string }>()

  for (const record of state.historyRecords ?? []) {
    for (const receipt of record.expectedReceipts ?? []) {
      if (receipt.received) continue
      const prev = historyById.get(receipt.id)
      if (!prev) {
        historyById.set(receipt.id, {
          date: record.date,
          amount: receipt.amount,
          name: receipt.name,
        })
        continue
      }
      historyById.set(receipt.id, {
        date: prev.date <= record.date ? prev.date : record.date,
        amount: Math.max(prev.amount, receipt.amount),
        name: prev.name || receipt.name,
      })
    }
  }

  let repairedCount = 0
  let removedCount = 0
  const nextReceipts: ExpectedReceipt[] = []

  for (const receipt of state.expectedReceipts) {
    const hist = historyById.get(receipt.id)
    const markedRestored = (receipt.notes ?? '').toLowerCase().includes('restored from balance history')

    if (!hist) {
      // Transfer-like names that only appeared after recovery and have no history — drop.
      if (markedRestored && /transfer|move .* from|less money/i.test(receipt.name)) {
        removedCount += 1
        continue
      }
      nextReceipts.push(receipt)
      continue
    }

    // Only rewrite rows we restored (or that still look like the recovery bug).
    const likelyRecovered =
      markedRestored ||
      receipt.expectedDate === today ||
      (!receipt.receiptTiming && !receipt.accrualStartDate)

    if (!likelyRecovered) {
      nextReceipts.push(receipt)
      continue
    }

    if (
      markedRestored ||
      receipt.expectedDate === today ||
      receipt.receiptTiming !== 'accrual' ||
      !receipt.accrualStartDate
    ) {
      repairedCount += 1
      const expectedDate = hist.date
      nextReceipts.push({
        ...receipt,
        expectedDate,
        amount: hist.amount,
        createdAt: receipt.createdAt ?? expectedDate,
        accrualStartDate: receipt.accrualStartDate ?? `${expectedDate.slice(0, 7)}-01`,
        receiptTiming: 'accrual',
        notes: markedRestored
          ? receipt.notes
          : 'Restored from balance history — check date and amount',
      })
      continue
    }

    nextReceipts.push(receipt)
  }

  if (repairedCount === 0 && removedCount === 0) {
    return { state, repairedCount: 0, removedCount: 0 }
  }

  return {
    state: { ...state, workspaceOrigin: 'user', expectedReceipts: nextReceipts },
    repairedCount,
    removedCount,
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
      const prev = reserveBudgets.get(key)
      if (!prev || item.budgetAmount > prev.budgetAmount) {
        reserveBudgets.set(key, {
          name: item.name,
          budgetAmount: item.budgetAmount,
          scopeId: item.scopeId,
        })
      }
    }
    // Do not use Due transfer amounts — those are net cash moves, not the monthly provision.
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
  const repaired = repairHistoryRecoveredReceipts(state)
  const receipts = recoverExpectedReceiptsFromHistory(repaired.state)
  const bills = recoverReserveBillsFromHistory(receipts.state)
  return {
    state: bills.state,
    receiptsRestored: receipts.restoredCount + repaired.repairedCount,
    plannersRepaired: bills.restoredPlannerIds,
    diagnosis: diagnoseReservePlanners(bills.state),
  }
}

export function reservePlannersMissingDeposit(state: AppState): string[] {
  return diagnoseReservePlanners(state)
    .filter((row) => row.monthlyDeposit <= 0)
    .map((row) => row.name || row.plannerId)
}
