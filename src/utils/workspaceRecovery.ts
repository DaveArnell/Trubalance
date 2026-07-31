import type { AppState, ExpectedReceipt, HistoryRecord, ReserveBill, ReservePlanner } from '../types'
import { roundCurrency, toAmount } from './amounts'
import { MONTHS } from './format'
import { plannerMonthlyDeposit } from './reserveCalculations'
import { todayDateKey } from './snapshots'

function newId(): string {
  return crypto.randomUUID()
}

const RESTORED_NOTE_V2 =
  'Restored from balance history — estimated target from daily build-up; please confirm amount'

type HistoryReceiptRow = HistoryRecord['expectedReceipts'][number]

type ReceiptHistorySeries = {
  id: string
  name: string
  scopeLevel: HistoryReceiptRow['scopeLevel']
  scopeId: string
  points: Array<{ date: string; accrued: number }>
  targetAmount?: number
  receiptTiming?: 'lump' | 'accrual'
  expectedDate?: string
  accrualStartDate?: string
}

function lastDayOfMonth(dateKey: string): string {
  const [y, m] = dateKey.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${dateKey.slice(0, 7)}-${String(last).padStart(2, '0')}`
}

function firstDayOfMonth(dateKey: string): string {
  return `${dateKey.slice(0, 7)}-01`
}

function daysBetweenKeys(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const start = Date.UTC(ay, am - 1, ad)
  const end = Date.UTC(by, bm - 1, bd)
  return Math.round((end - start) / (1000 * 60 * 60 * 24))
}

/** Infer full target from an accrued-on-day amount and a Start→Expected window. */
function estimateTargetFromAccrued(
  accrued: number,
  asOfDate: string,
  startDate: string,
  endDate: string,
): number {
  if (accrued <= 0) return 0
  const totalDays = daysBetweenKeys(startDate, endDate)
  const elapsed = daysBetweenKeys(startDate, asOfDate)
  if (totalDays <= 0 || elapsed <= 0) return roundCurrency(accrued)
  if (elapsed >= totalDays) return roundCurrency(accrued)
  return roundCurrency(accrued * (totalDays / elapsed))
}

function amountsLookFlat(points: Array<{ accrued: number }>): boolean {
  if (points.length <= 1) return true
  const amounts = points.map((p) => p.accrued).filter((n) => n > 0)
  if (amounts.length <= 1) return true
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  if (min <= 0) return max === min
  // Flat if variation is under ~5% (lump or already fully accrued).
  return max - min <= Math.max(1, max * 0.05)
}

function collectReceiptHistorySeries(state: AppState): Map<string, ReceiptHistorySeries> {
  const byId = new Map<string, ReceiptHistorySeries>()
  const sortedHistory = [...(state.historyRecords ?? [])].sort((a, b) => a.date.localeCompare(b.date))

  for (const record of sortedHistory) {
    for (const receipt of record.expectedReceipts ?? []) {
      if (receipt.received) continue
      const existing = byId.get(receipt.id)
      if (!existing) {
        byId.set(receipt.id, {
          id: receipt.id,
          name: receipt.name,
          scopeLevel: receipt.scopeLevel,
          scopeId: receipt.scopeId,
          points: [{ date: record.date, accrued: receipt.amount }],
          targetAmount: receipt.targetAmount,
          receiptTiming: receipt.receiptTiming,
          expectedDate: receipt.expectedDate,
          accrualStartDate: receipt.accrualStartDate,
        })
        continue
      }

      existing.points.push({ date: record.date, accrued: receipt.amount })
      if (receipt.name) existing.name = receipt.name
      if (receipt.targetAmount != null) {
        existing.targetAmount = Math.max(existing.targetAmount ?? 0, receipt.targetAmount)
      }
      if (receipt.receiptTiming) existing.receiptTiming = receipt.receiptTiming
      if (receipt.expectedDate) existing.expectedDate = receipt.expectedDate
      if (receipt.accrualStartDate) existing.accrualStartDate = receipt.accrualStartDate
    }
  }

  return byId
}

function rebuildReceiptFromHistorySeries(series: ReceiptHistorySeries): Omit<
  ExpectedReceipt,
  'sortOrder' | 'notes' | 'received' | 'createdAt'
> {
  const points = [...series.points].sort((a, b) => a.date.localeCompare(b.date))
  const latest = points[points.length - 1]!
  const peak = points.reduce((best, p) => (p.accrued >= best.accrued ? p : best), points[0]!)

  const knownTiming = series.receiptTiming
  const flat = amountsLookFlat(points)
  const timing: 'lump' | 'accrual' =
    knownTiming ?? (flat && points.length > 1 ? 'lump' : 'accrual')

  const expectedDate =
    series.expectedDate ?? (timing === 'accrual' ? lastDayOfMonth(latest.date) : latest.date)
  const accrualStartDate =
    timing === 'accrual'
      ? series.accrualStartDate ?? firstDayOfMonth(expectedDate)
      : series.accrualStartDate

  let amount = series.targetAmount != null ? toAmount(series.targetAmount) : 0
  if (amount <= 0) {
    if (timing === 'lump' || flat) {
      amount = roundCurrency(peak.accrued)
    } else {
      amount = estimateTargetFromAccrued(
        peak.accrued,
        peak.date,
        accrualStartDate ?? firstDayOfMonth(peak.date),
        expectedDate,
      )
    }
  }

  return {
    id: series.id,
    name: series.name,
    amount,
    expectedDate,
    accrualStartDate,
    receiptTiming: timing,
    scopeLevel: series.scopeLevel,
    scopeId: series.scopeId,
  }
}

function isRestoredReceiptNotes(notes: string | undefined): boolean {
  return (notes ?? '').toLowerCase().includes('restored from balance history')
}

function needsEstimatedTargetRepair(notes: string | undefined): boolean {
  if (!isRestoredReceiptNotes(notes)) return false
  // One-shot upgrade from the first recovery (effective-as-target + early expected date).
  return !(notes ?? '').toLowerCase().includes('estimated target')
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
 * Older history only stores the *effective* amount that day — we estimate the target
 * from the build-up series and restore Start/Expected so mid-month rows aren't "full".
 */
export function recoverExpectedReceiptsFromHistory(state: AppState): {
  state: AppState
  restoredCount: number
} {
  const existingIds = new Set(state.expectedReceipts.map((receipt) => receipt.id))
  const seriesById = collectReceiptHistorySeries(state)
  const toRestore = [...seriesById.values()].filter((series) => !existingIds.has(series.id))

  if (toRestore.length === 0) return { state, restoredCount: 0 }

  const restored: ExpectedReceipt[] = toRestore.map((series, index) => {
    const rebuilt = rebuildReceiptFromHistorySeries(series)
    const earliest = [...series.points].sort((a, b) => a.date.localeCompare(b.date))[0]!.date
    return {
      ...rebuilt,
      createdAt: earliest,
      received: false,
      notes: RESTORED_NOTE_V2,
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
 * Fix receipts restored earlier with effective-as-target / expectedDate too early
 * (which made build-ups look fully accrued at the wrong amount).
 */
export function repairHistoryRecoveredReceipts(state: AppState): {
  state: AppState
  repairedCount: number
  removedCount: number
} {
  const today = todayDateKey()
  const seriesById = collectReceiptHistorySeries(state)

  let repairedCount = 0
  let removedCount = 0
  const nextReceipts: ExpectedReceipt[] = []

  for (const receipt of state.expectedReceipts) {
    const series = seriesById.get(receipt.id)
    const markedRestored = isRestoredReceiptNotes(receipt.notes)

    if (!series) {
      if (markedRestored && /transfer|move .* from|less money/i.test(receipt.name)) {
        removedCount += 1
        continue
      }
      nextReceipts.push(receipt)
      continue
    }

    const shouldRepair =
      needsEstimatedTargetRepair(receipt.notes) ||
      receipt.expectedDate === today ||
      (markedRestored && receipt.receiptTiming !== 'accrual')

    if (!shouldRepair) {
      nextReceipts.push(receipt)
      continue
    }

    const rebuilt = rebuildReceiptFromHistorySeries(series)
    repairedCount += 1
    nextReceipts.push({
      ...receipt,
      ...rebuilt,
      createdAt: receipt.createdAt ?? series.points[0]?.date,
      notes: RESTORED_NOTE_V2,
    })
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
