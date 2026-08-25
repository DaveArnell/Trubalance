import type { AppState, Commitment, ExpectedReceipt, HistoryRecord, ReserveBill, ReservePlanner, StatusColor } from '../types'
import { roundCurrency, toAmount } from './amounts'
import { MONTHS } from './format'
import { plannerMonthlyDeposit } from './reserveCalculations'
import { todayDateKey } from './snapshots'
import { rememberDeletedReceiptIds, readDeletedReceiptIds, forgetDeletedReceiptIds } from './localStateStorage'

const RESTORED_NOTE_V2 =
  'Restored from balance history — estimated target from daily build-up; please confirm amount'

const RESTORED_COST_NOTE =
  'Restored from balance history — confirm due day and amount'

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

/** Real calendar day — today's History may already contain the exploded Due list. */
function calendarDateKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * Prefer the last History date before today. Same-day snapshots are overwritten on
 * check-in, so today's row can be the post-wipe Due list rather than the real one.
 */
function trustedHistoryDate(state: AppState): string | null {
  const records = state.historyRecords ?? []
  if (records.length === 0) return null
  const dates = [...new Set(records.map((record) => record.date))].sort()
  const today = calendarDateKey()
  const beforeToday = dates.filter((date) => date < today)
  if (beforeToday.length > 0) return beforeToday[beforeToday.length - 1]!
  return dates[dates.length - 1] ?? null
}

function previousPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number)
  if (!year || !month) return period
  if (month === 1) return `${year - 1}-12`
  return `${year}-${String(month - 1).padStart(2, '0')}`
}

/**
 * Drop expected receipts that were rebuilt from History. Those rows were often
 * already deleted; they must not return on the next sync.
 */
export function pruneStaleHistoryRestoredReceipts(state: AppState): AppState {
  const keep = currentHistoryOpenReceiptIds(state)
  const removed: string[] = []
  const expectedReceipts = state.expectedReceipts.filter((receipt) => {
    if (!isRestoredReceiptNotes(receipt.notes)) return true
    if (keep.has(receipt.id)) return true
    removed.push(receipt.id)
    return false
  })
  if (removed.length === 0) return state
  rememberDeletedReceiptIds(removed)
  return { ...state, workspaceOrigin: state.workspaceOrigin ?? 'user', expectedReceipts }
}

function needsEstimatedTargetRepair(notes: string | undefined): boolean {
  if (!isRestoredReceiptNotes(notes)) return false
  // One-shot upgrade from the first recovery (effective-as-target + early expected date).
  return !(notes ?? '').toLowerCase().includes('estimated target')
}

/** Open receipt ids on the last trusted History date (before today's wipe if possible). */
export function currentHistoryOpenReceiptIds(state: AppState): Set<string> {
  const trusted = trustedHistoryDate(state)
  const ids = new Set<string>()
  if (!trusted) return ids
  for (const record of state.historyRecords ?? []) {
    if (record.date !== trusted) continue
    for (const receipt of record.expectedReceipts ?? []) {
      if (!receipt.received) ids.add(receipt.id)
    }
  }
  return ids
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
  const deleted = readDeletedReceiptIds()
  const currentIds = currentHistoryOpenReceiptIds(state)
  const seriesById = collectReceiptHistorySeries(state)
  const toRestore = [...seriesById.values()].filter(
    (series) => !existingIds.has(series.id) && currentIds.has(series.id) && !deleted.has(series.id),
  )

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

function isRestoredCostNotes(notes: string | undefined): boolean {
  return (notes ?? '').toLowerCase().includes('restored from balance history')
}

function isReserveTransferHistoryName(name: string): boolean {
  return /reserve\s*(plan|provision|transfer)/i.test(name)
}

function isPoisonedReserveBill(bill: ReserveBill): boolean {
  if (/reserve provision/i.test(bill.name)) return true
  const amounts = MONTHS.map((month) => toAmount(bill.monthAmounts[month] ?? 0))
  const nonzero = amounts.filter((amount) => amount > 0)
  return nonzero.length === 12 && nonzero.every((amount) => amount === nonzero[0])
}

function parseReserveBillDueRowId(
  rowId: string,
): { plannerId: string; billId: string; period: string } | null {
  const match = rowId.match(
    /^reserve-due-(?:shared-)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(\d{4}-\d{2})$/i,
  )
  if (!match) return null
  return { plannerId: match[1]!, billId: match[2]!, period: match[3]! }
}

function plannerIdForReserveHistoryItem(
  state: AppState,
  item: { scopeLevel: HistoryRecord['dueItems'][number]['scopeLevel']; scopeId: string; rowId: string },
): string | null {
  const parsed = parseReserveBillDueRowId(item.rowId)
  if (parsed && state.reservePlanners.some((planner) => planner.id === parsed.plannerId)) {
    return parsed.plannerId
  }
  if (item.scopeLevel === 'business') {
    return state.reservePlanners.find((planner) => planner.businessId === item.scopeId)?.id ?? null
  }
  if (item.scopeLevel === 'venue') {
    const venue = state.venues.find((row) => row.id === item.scopeId)
    if (!venue) return null
    return state.reservePlanners.find((planner) => planner.businessId === venue.businessId)?.id ?? null
  }
  if (item.scopeLevel === 'group') {
    const inGroup = state.reservePlanners.filter((planner) =>
      state.businesses.some((business) => business.id === planner.businessId && business.groupId === item.scopeId),
    )
    if (inGroup.length === 1) return inGroup[0]!.id
  }
  return null
}

function historyBillKey(plannerId: string, name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `history-bill:${plannerId}:${slug || 'bill'}`
}

const HISTORY_RESERVE_TARGET_BILL = 'Recovered from History (split into real bills)'

function isHistoryReserveTargetBill(bill: Pick<ReserveBill, 'name'>): boolean {
  return bill.name.trim().toLowerCase() === HISTORY_RESERVE_TARGET_BILL.toLowerCase()
}

function isRecoveredCostNotes(notes: string | undefined): boolean {
  const value = (notes ?? '').toLowerCase()
  return value.includes('restored from balance history') || value.includes('due list synced v2')
}

function hasExplicitMarkPaid(commitment: Pick<Commitment, 'paidPeriodDates' | 'paidPeriodAmounts'>, period: string): boolean {
  const dates = commitment.paidPeriodDates ?? {}
  const amounts = commitment.paidPeriodAmounts ?? {}
  return Object.keys(dates).some((key) => key >= period) || Object.keys(amounts).some((key) => key >= period)
}

function isReconstructedSnapshotNote(note: string | undefined): boolean {
  return (note ?? '').includes('Restored from saved daily snapshot')
}

function parseReserveAccruingRowId(rowId: string): string | null {
  const match = rowId.match(
    /^reserve-(?:shared-)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
  )
  return match?.[1] ?? null
}

function parseReserveTransferDueRowId(rowId: string): string | null {
  const match = rowId.match(
    /^reserve-transfer-(?:shared-)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-\d{4}-\d{2}$/i,
  )
  return match?.[1] ?? null
}

function plannerIdFromReserveHistoryRow(
  state: AppState,
  item: {
    scopeLevel: HistoryRecord['dueItems'][number]['scopeLevel']
    scopeId: string
    rowId: string
  },
): string | null {
  const accruingId = parseReserveAccruingRowId(item.rowId)
  if (accruingId && state.reservePlanners.some((planner) => planner.id === accruingId)) {
    return accruingId
  }
  const transferId = parseReserveTransferDueRowId(item.rowId)
  if (transferId && state.reservePlanners.some((planner) => planner.id === transferId)) {
    return transferId
  }
  return plannerIdForReserveHistoryItem(state, item)
}

/** Monthly reserve deposit History was actually accruing — not a fake 12-month grid. */
function historyReserveMonthlyDeposits(state: AppState): Map<string, number> {
  const records = [...(state.historyRecords ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const today = calendarDateKey()
  const dates = [...new Set(records.map((record) => record.date))]
    .filter((date) => date < today)
    .sort()
    .reverse()
  const searchDates = dates.length > 0 ? dates : [...new Set(records.map((record) => record.date))].sort().reverse()

  let best = new Map<string, number>()
  let bestTotal = 0

  const collectForDate = (date: string, allowTransferFallback: boolean) => {
    const dayDeposits = new Map<string, number>()
    for (const record of records) {
      if (record.date !== date) continue
      if (isReconstructedSnapshotNote(record.note)) continue
      for (const item of record.buildingUpItems ?? []) {
        if (item.source !== 'reserve' || item.budgetAmount <= 0) continue
        const plannerId = plannerIdFromReserveHistoryRow(state, item)
        if (!plannerId) continue
        dayDeposits.set(plannerId, Math.max(dayDeposits.get(plannerId) ?? 0, item.budgetAmount))
      }
    }
    if (dayDeposits.size === 0 && allowTransferFallback) {
      for (const record of records) {
        if (record.date !== date) continue
        if (isReconstructedSnapshotNote(record.note)) continue
        for (const item of record.dueItems ?? []) {
          if (item.source !== 'reserve' || item.amount <= 0) continue
          if (!parseReserveTransferDueRowId(item.rowId)) continue
          const plannerId = plannerIdFromReserveHistoryRow(state, item)
          if (!plannerId) continue
          dayDeposits.set(plannerId, Math.max(dayDeposits.get(plannerId) ?? 0, item.amount))
        }
      }
    }
    const total = [...dayDeposits.values()].reduce((sum, amount) => sum + amount, 0)
    if (total > bestTotal) {
      best = dayDeposits
      bestTotal = total
    }
  }

  for (const date of searchDates) collectForDate(date, false)
  if (bestTotal === 0) {
    for (const date of searchDates) collectForDate(date, true)
  }

  return best
}

function applyHistoryReserveMonthlyTargets(
  planners: ReservePlanner[],
  deposits: Map<string, number>,
  trusted: string | null,
): { planners: ReservePlanner[]; changedIds: string[] } {
  const changedIds: string[] = []
  const nextPlanners = planners.map((planner) => {
    const historyMonthly = deposits.get(planner.id) ?? 0
    const namedBills = planner.bills.filter((bill) => !isHistoryReserveTargetBill(bill))
    const namedMonthly = plannerMonthlyDeposit(namedBills)
    const remainderAnnual = roundCurrency((historyMonthly - namedMonthly) * 12)
    const existingTarget = planner.bills.find((bill) => isHistoryReserveTargetBill(bill))

    if (remainderAnnual <= 50) {
      if (!existingTarget) return planner
      changedIds.push(planner.id)
      return { ...planner, bills: namedBills }
    }

    const lastMonth = MONTHS[MONTHS.length - 1]!
    const bill: ReserveBill = {
      id: existingTarget?.id ?? historyBillKey(planner.id, HISTORY_RESERVE_TARGET_BILL),
      plannerId: planner.id,
      name: HISTORY_RESERVE_TARGET_BILL,
      monthAmounts: { [lastMonth]: remainderAnnual },
      createdAt: existingTarget?.createdAt ?? trusted ?? undefined,
      lastPaidPeriod: trusted ? previousPeriod(trusted.slice(0, 7)) : existingTarget?.lastPaidPeriod,
      notes: RESTORED_COST_NOTE,
      sortOrder: existingTarget?.sortOrder ?? 999,
    }
    const before = existingTarget ? toAmount(existingTarget.monthAmounts[lastMonth]) : 0
    if (Math.abs(before - remainderAnnual) < 1 && existingTarget) return planner
    changedIds.push(planner.id)
    console.info(
      `[Workspace] Restored £${Math.round(historyMonthly)}/month reserve earmark for ${planner.name || planner.id}`,
    )
    return { ...planner, bills: [...namedBills, bill] }
  })
  return { planners: nextPlanners, changedIds }
}

function monthKeyFromPeriod(period: string): string | null {
  if (!/^\d{4}-\d{2}$/.test(period) || period.startsWith('2099')) return null
  const index = Number(period.slice(5, 7)) - 1
  return MONTHS[index] ?? null
}

function dayOfMonth(dateKey: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null
  const day = Number(dateKey.slice(8, 10))
  return day >= 1 && day <= 31 ? day : null
}

function modeNumber(values: number[]): number | undefined {
  if (values.length === 0) return undefined
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]![0]
}

function historyCommitmentIdFromDueRow(rowId: string): string | null {
  if (rowId.startsWith('reserve-')) return null
  return parseDueRowCommitmentId(rowId)
}

type HistoryCostHint = {
  dueDays: number[]
  plannedPeriods: string[]
  lastBuildingDate?: string
  lastDueDate?: string
  lastPaidPeriod?: string
  schedule?: Commitment['schedule']
  accrued?: number
  budget?: number
}

function collectHistoryCostHints(state: AppState): Map<string, HistoryCostHint> {
  const hints = new Map<string, HistoryCostHint>()
  const sorted = [...(state.historyRecords ?? [])].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    if (byDate !== 0) return byDate
    return String(a.savedAt).localeCompare(String(b.savedAt))
  })

  const hintFor = (id: string): HistoryCostHint => {
    const existing = hints.get(id)
    if (existing) return existing
    const created: HistoryCostHint = { dueDays: [], plannedPeriods: [] }
    hints.set(id, created)
    return created
  }

  for (const record of sorted) {
    const dueIds = new Set<string>()
    for (const item of record.dueItems ?? []) {
      if (item.source !== 'commitment') continue
      const id = historyCommitmentIdFromDueRow(item.rowId)
      if (!id) continue
      dueIds.add(id)
      const hint = hintFor(id)
      hint.lastDueDate = record.date
      const day = dayOfMonth(record.date)
      if (day != null) hint.dueDays.push(day)
      if (item.schedule === 'planned' || item.rowId.startsWith('planned-')) {
        hint.schedule = 'planned'
        if (item.period && !item.period.startsWith('2099')) hint.plannedPeriods.push(item.period)
      } else if (item.schedule === 'monthly') {
        hint.schedule = 'monthly'
      }
    }
    for (const item of record.buildingUpItems ?? []) {
      if (item.source !== 'commitment') continue
      if (item.rowId.startsWith('reserve-')) continue
      const hint = hintFor(item.rowId)
      hint.lastBuildingDate = record.date
      hint.accrued = item.accruedAmount
      hint.budget = item.budgetAmount
      if (item.schedule === 'planned') hint.schedule = 'planned'
      else if (item.schedule === 'monthly') hint.schedule = 'monthly'
    }
    for (const row of record.commitments ?? []) {
      if (row.id.startsWith('reserve-')) continue
      const hint = hintFor(row.id)
      if (row.schedule === 'planned' || row.schedule === 'monthly') hint.schedule = row.schedule
    }
    for (const [id, hint] of hints) {
      if (dueIds.has(id)) continue
      const day = dayOfMonth(record.date)
      const inferred = modeNumber(hint.dueDays)
      if (inferred != null && day != null && day >= inferred) {
        hint.lastPaidPeriod = record.date.slice(0, 7)
      }
    }
  }

  return hints
}

export function workspaceCostsRepairKey(state: AppState): string {
  const costs = state.commitments
    .map(
      (commitment) =>
        `${commitment.id}:${commitment.schedule}:${commitment.dueDayOfMonth ?? ''}:${commitment.plannedDueDate ?? ''}:${commitment.lastPaidPeriod ?? ''}`,
    )
    .sort()
    .join('|')
  const bills = state.reservePlanners
    .map(
      (planner) =>
        `${planner.id}:${planner.bufferAmount}:${planner.bills
          .map((bill) => `${bill.name}:${MONTHS.map((month) => bill.monthAmounts[month] ?? 0).join(',')}`)
          .join(';')}`,
    )
    .sort()
    .join('|')
  return `${costs}#${bills}`
}

function mergeReserveBills(existing: ReserveBill[], incoming: ReserveBill[]): ReserveBill[] {
  const byId = new Map(
    existing.map((bill) => [bill.id, { ...bill, monthAmounts: { ...bill.monthAmounts } }]),
  )
  const byName = new Map(
    existing
      .filter((bill) => bill.name.trim())
      .map((bill) => [bill.name.trim().toLowerCase(), bill.id]),
  )

  for (const bill of incoming) {
    const nameKey = bill.name.trim().toLowerCase()
    const targetId = byId.has(bill.id) ? bill.id : nameKey ? byName.get(nameKey) : undefined
    if (targetId && byId.has(targetId)) {
      const current = byId.get(targetId)!
      byId.set(targetId, {
        ...current,
        monthAmounts: { ...bill.monthAmounts, ...current.monthAmounts },
        name: current.name.trim() ? current.name : bill.name,
      })
      continue
    }
    byId.set(bill.id, bill)
    if (nameKey) byName.set(nameKey, bill.id)
  }

  return [...byId.values()]
}

function reconstructReserveBillsFromHistory(state: AppState): Map<string, ReserveBill[]> {
  const byPlanner = new Map<string, Map<string, ReserveBill>>()

  const upsert = (
    plannerId: string,
    billId: string,
    name: string,
    month: string,
    amount: number,
    createdAt: string,
  ) => {
    const plannerBills = byPlanner.get(plannerId) ?? new Map<string, ReserveBill>()
    const existing = plannerBills.get(billId)
    const monthAmounts = { ...(existing?.monthAmounts ?? {}) }
    monthAmounts[month] = amount
    plannerBills.set(billId, {
      id: billId,
      plannerId,
      name: name.replace(/\s+reserve provision$/i, '').trim() || name,
      monthAmounts,
      createdAt: existing?.createdAt ?? createdAt,
      sortOrder: existing?.sortOrder ?? plannerBills.size,
    })
    byPlanner.set(plannerId, plannerBills)
  }

  for (const record of state.historyRecords ?? []) {
    for (const item of record.dueItems ?? []) {
      if (item.source !== 'reserve') continue
      if (isReserveTransferHistoryName(item.name)) continue
      const month =
        monthKeyFromPeriod(item.period) ?? monthKeyFromPeriod(record.date.slice(0, 7))
      if (!month || item.amount <= 0) continue
      const parsed = parseReserveBillDueRowId(item.rowId)
      const plannerId = parsed?.plannerId ?? plannerIdForReserveHistoryItem(state, item)
      if (!plannerId) continue
      const billId = parsed?.billId ?? historyBillKey(plannerId, item.name)
      upsert(plannerId, billId, item.name, month, item.amount, record.date)
    }
  }

  const result = new Map<string, ReserveBill[]>()
  for (const [plannerId, bills] of byPlanner) {
    result.set(plannerId, [...bills.values()])
  }
  return result
}

/**
 * Rebuild named reserve bills from History. Clears the fake “£X every month”
 * provision that recovery previously invented.
 */
export function recoverReserveBillsFromHistory(state: AppState): {
  state: AppState
  restoredPlannerIds: string[]
} {
  const reconstructed = reconstructReserveBillsFromHistory(state)
  const restoredPlannerIds: string[] = []
  const trusted = trustedHistoryDate(state)
  const reserveDue = new Map<string, string>()
  if (trusted) {
    for (const record of state.historyRecords ?? []) {
      if (record.date !== trusted) continue
      for (const item of record.dueItems ?? []) {
        if (item.source !== 'reserve') continue
        const parsed = parseReserveBillDueRowId(item.rowId)
        if (!parsed) continue
        reserveDue.set(`${parsed.plannerId}:${parsed.billId}`, parsed.period)
      }
    }
  }

  const poisonedMonthlyByPlanner = new Map<string, number>()
  const reservePlanners: ReservePlanner[] = state.reservePlanners.map((planner) => {
    const incoming = reconstructed.get(planner.id) ?? []
    const poisoned = planner.bills.length === 0 || planner.bills.every(isPoisonedReserveBill)
    if (poisoned) {
      const monthly = plannerMonthlyDeposit(planner.bills)
      if (monthly > 0) poisonedMonthlyByPlanner.set(planner.id, monthly)
    }
    const currentBills = poisoned ? [] : planner.bills
    const bills = mergeReserveBills(currentBills, incoming).map((bill) => {
      const duePeriod = reserveDue.get(`${planner.id}:${bill.id}`)
      if (!poisoned && currentBills.some((existing) => existing.id === bill.id)) {
        return bill
      }
      return {
        ...bill,
        lastPaidPeriod: duePeriod
          ? previousPeriod(duePeriod)
          : trusted
            ? previousPeriod(trusted.slice(0, 7))
            : undefined,
      }
    })
    const before = currentBills
      .map((bill) => `${bill.id}:${MONTHS.map((month) => bill.monthAmounts[month] ?? 0).join(',')}`)
      .join('|')
    const after = bills
      .map((bill) => `${bill.id}:${MONTHS.map((month) => bill.monthAmounts[month] ?? 0).join(',')}`)
      .join('|')
    if (before === after) return planner
    restoredPlannerIds.push(planner.id)
    return { ...planner, bills }
  })

  const deposits = historyReserveMonthlyDeposits({ ...state, reservePlanners })
  for (const [plannerId, monthly] of poisonedMonthlyByPlanner) {
    if ((deposits.get(plannerId) ?? 0) < monthly) deposits.set(plannerId, monthly)
  }
  const withTargets = applyHistoryReserveMonthlyTargets(reservePlanners, deposits, trusted)
  for (const plannerId of withTargets.changedIds) {
    if (!restoredPlannerIds.includes(plannerId)) restoredPlannerIds.push(plannerId)
  }

  if (restoredPlannerIds.length === 0) return { state, restoredPlannerIds }

  return {
    state: { ...state, workspaceOrigin: 'user', reservePlanners: withTargets.planners },
    restoredPlannerIds,
  }
}

/** What History last recorded as actually Due — used so paid items do not come back rolled up. */
function latestHistoryDueByCommitment(
  state: AppState,
): Map<string, { period: string; planned: boolean }> {
  const trusted = trustedHistoryDate(state)
  const due = new Map<string, { period: string; planned: boolean }>()
  if (!trusted) return due
  for (const record of state.historyRecords ?? []) {
    if (record.date !== trusted) continue
    for (const item of record.dueItems ?? []) {
      if (item.source !== 'commitment') continue
      const id = historyCommitmentIdFromDueRow(item.rowId)
      if (!id) continue
      due.set(id, {
        period: item.period && !item.period.startsWith('2099') ? item.period : record.date.slice(0, 7),
        planned: item.schedule === 'planned' || item.rowId.startsWith('planned-'),
      })
    }
  }
  return due
}

function lastPaidPeriodFromDueList(
  commitment: Pick<Commitment, 'schedule' | 'dueDayOfMonth' | 'plannedDueDate'>,
  dueNow: { period: string } | undefined,
  trustedDate: string,
): string | undefined {
  const trustedPeriod = trustedDate.slice(0, 7)
  if (dueNow) return previousPeriod(dueNow.period)
  if (commitment.schedule === 'planned') {
    // Missing from a possibly incomplete Due list must not mark the cost paid.
    return undefined
  }
  // Never infer "paid this month" from absence on History. That dropped the
  // deduction from Cash Prophet Balance. previous period keeps this month accruing
  // (or Due if the due day has passed) without rolling unpaid months back to January.
  return previousPeriod(trustedPeriod)
}

function parseDueRowCommitmentId(rowId: string): string {
  const planned = rowId.match(/^planned-(.+)$/)
  if (planned?.[1]) return planned[1]
  const monthly = rowId.match(/^(.*)-\d{4}-\d{2}$/)
  if (monthly?.[1]) return monthly[1]
  return rowId
}

function periodEndDate(period: string): string {
  if (!/^\d{4}-\d{2}$/.test(period)) return `${todayDateKey().slice(0, 7)}-28`
  return lastDayOfMonth(`${period}-01`)
}

function scopeExists(
  state: AppState,
  scopeLevel: Commitment['scopeLevel'],
  scopeId: string,
): boolean {
  if (scopeLevel === 'group') return state.groups.some((group) => group.id === scopeId)
  if (scopeLevel === 'business') return state.businesses.some((business) => business.id === scopeId)
  if (scopeLevel === 'venue') return state.venues.some((venue) => venue.id === scopeId)
  return false
}

/**
 * Rebuild monthly / planned costs when the live list was wiped but History still
 * has Building up and Due rows.
 */
export function recoverCommitmentsFromHistory(state: AppState): {
  state: AppState
  restoredCount: number
} {
  const preexisting = new Set(state.commitments.map((commitment) => commitment.id))
  const byId = new Map(state.commitments.map((commitment) => [commitment.id, commitment]))
  const sorted = [...(state.historyRecords ?? [])].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    if (byDate !== 0) return byDate
    return String(a.savedAt).localeCompare(String(b.savedAt))
  })

  const upsert = (next: Commitment) => {
    if (!next.id || next.id.startsWith('reserve-') || !scopeExists(state, next.scopeLevel, next.scopeId)) return
    if (preexisting.has(next.id)) return
    const existing = byId.get(next.id)
    byId.set(next.id, existing ? { ...existing, ...next, name: next.name || existing.name } : next)
  }

  for (const record of sorted) {
    for (const row of record.commitments ?? []) {
      const planned = row.schedule === 'planned'
      upsert({
        id: row.id,
        name: row.name,
        schedule: planned ? 'planned' : 'monthly',
        amount: row.amount,
        dueDayOfMonth: planned ? undefined : 28,
        scopeLevel: row.scopeLevel,
        scopeId: row.scopeId,
        status: (row.status as StatusColor) || 'healthy',
        notes: RESTORED_COST_NOTE,
        createdAt: record.date,
      })
    }
    for (const item of record.buildingUpItems ?? []) {
      if (item.source !== 'commitment') continue
      const planned = item.schedule === 'planned'
      upsert({
        id: item.rowId,
        name: item.name,
        schedule: planned ? 'planned' : 'monthly',
        amount: item.budgetAmount,
        dueDayOfMonth: planned ? undefined : 28,
        scopeLevel: item.scopeLevel,
        scopeId: item.scopeId,
        status: 'healthy',
        notes: RESTORED_COST_NOTE,
        createdAt: record.date,
      })
    }
    for (const item of record.dueItems ?? []) {
      if (item.source !== 'commitment') continue
      const id = parseDueRowCommitmentId(item.rowId)
      const planned = item.schedule === 'planned' || item.rowId.startsWith('planned-')
      upsert({
        id,
        name: item.name,
        schedule: planned ? 'planned' : 'monthly',
        amount: item.amount,
        dueDayOfMonth: planned ? undefined : 28,
        plannedDueDate: planned ? periodEndDate(item.period) : undefined,
        scopeLevel: item.scopeLevel,
        scopeId: item.scopeId,
        status: (item.status as StatusColor) || 'healthy',
        notes: RESTORED_COST_NOTE,
        createdAt: record.date,
      })
    }
  }

  const restored = [...byId.values()]
  const restoredCount = restored.length - state.commitments.length
  if (restoredCount === 0) return { state, restoredCount: 0 }

  console.info(`[Workspace] Restored ${restoredCount} missing costs from balance history`)
  return {
    state: { ...state, workspaceOrigin: 'user', commitments: restored },
    restoredCount,
  }
}

export function recoverReservePlannerShellsFromHistory(state: AppState): AppState {
  if (state.reservePlanners.length > 0) return state
  const byId = new Map<string, ReservePlanner>()
  const businessIds = new Set(state.businesses.map((business) => business.id))

  for (const record of state.historyRecords ?? []) {
    for (const planner of record.reservePlanners ?? []) {
      if (!businessIds.has(planner.businessId)) continue
      byId.set(planner.id, {
        id: planner.id,
        name: planner.name,
        businessId: planner.businessId,
        bufferAmount: 0,
        actualBalance: planner.actualBalance,
        bills: [],
      })
    }
  }

  if (byId.size === 0) return state
  return { ...state, workspaceOrigin: 'user', reservePlanners: [...byId.values()] }
}

/** Empty planners must not keep a leftover buffer line after the bill grid was wiped. */
export function restoreReservePlannerBuffersFromHistory(state: AppState): AppState {
  const trusted = trustedHistoryDate(state)
  const buffers = new Map<string, number>()
  if (trusted) {
    for (const record of state.historyRecords ?? []) {
      if (record.date !== trusted) continue
      if ((record.note ?? '').includes('Restored from saved daily snapshot')) continue
      for (const planner of record.reservePlanners ?? []) {
        buffers.set(planner.id, planner.bufferAmount)
      }
    }
  }

  let changed = false
  const reservePlanners = state.reservePlanners.map((planner) => {
    if (planner.bills.length === 0) {
      if (planner.bufferAmount === 0) return planner
      changed = true
      return { ...planner, bufferAmount: 0 }
    }
    if (!buffers.has(planner.id)) return planner
    const bufferAmount = buffers.get(planner.id)!
    if (planner.bufferAmount === bufferAmount) return planner
    changed = true
    return { ...planner, bufferAmount }
  })

  if (!changed) return state
  return { ...state, workspaceOrigin: 'user', reservePlanners }
}

function inferDueDayFromAccrual(hint: HistoryCostHint | undefined): number | undefined {
  if (!hint?.budget || hint.budget <= 0 || hint.accrued == null || !hint.lastBuildingDate) return undefined
  const todayDay = dayOfMonth(hint.lastBuildingDate)
  if (todayDay == null) return undefined
  const progress = Math.min(1, Math.max(0, hint.accrued / hint.budget))
  const elapsed = Math.round(progress * 30)
  let inferred = todayDay - elapsed
  if (inferred < 1) inferred += 30
  if (inferred > 28) inferred = 28
  return inferred
}

/** Replace the 28th/2099 guesses with due days and dates taken from History. */
export function refineRestoredCommitmentsFromHistory(state: AppState): AppState {
  const hints = collectHistoryCostHints(state)
  const latestDue = latestHistoryDueByCommitment(state)
  let changed = false
  const commitments: Commitment[] = []

  for (const commitment of state.commitments) {
    if (commitment.id.startsWith('reserve-')) {
      changed = true
      continue
    }
    const hint = hints.get(commitment.id)
    const dueSynced = /due list synced v2/i.test(commitment.notes ?? '')
    const needsRepair =
      isRestoredCostNotes(commitment.notes) ||
      (commitment.schedule === 'planned' &&
        (!commitment.plannedDueDate || commitment.plannedDueDate.startsWith('2099')))
    if (!needsRepair || dueSynced) {
      commitments.push(commitment)
      continue
    }

    const schedule = hint?.schedule ?? commitment.schedule
    const dueDay = modeNumber(hint?.dueDays ?? []) ?? inferDueDayFromAccrual(hint)
    const plannedPeriod = [...(hint?.plannedPeriods ?? [])].sort().at(-1)
    const plannedDueDate =
      schedule === 'planned'
        ? plannedPeriod
          ? lastDayOfMonth(`${plannedPeriod}-01`)
          : undefined
        : undefined

    const trusted = trustedHistoryDate(state) ?? todayDateKey()
    const dueNow = latestDue.get(commitment.id)
    const lastPaidPeriod = lastPaidPeriodFromDueList(
      { schedule, dueDayOfMonth: dueDay ?? commitment.dueDayOfMonth, plannedDueDate },
      dueNow,
      trusted,
    )

    const next: Commitment = {
      ...commitment,
      schedule,
      dueDayOfMonth: schedule === 'monthly' ? dueDay ?? commitment.dueDayOfMonth : undefined,
      plannedDueDate,
      lastPaidPeriod,
      notes: `${RESTORED_COST_NOTE} · due list synced v2`,
    }
    changed = true
    commitments.push(next)
  }

  if (!changed) return state
  console.info('[Workspace] Refined restored costs from History due dates')
  return { ...state, workspaceOrigin: 'user', commitments }
}

/**
 * Recovered costs were often marked paid through the History day just because they
 * were missing from an incomplete Due list. That removed them from committed funds
 * and inflated Cash Prophet Balance. Reopen this month unless History still lists them as Due.
 */
export function reopenCommittedFundsFromHistory(state: AppState): AppState {
  const trusted = trustedHistoryDate(state)
  if (!trusted) return state
  const trustedPeriod = trusted.slice(0, 7)
  const buildingIds = new Set<string>()
  const duePeriods = new Map<string, string>()
  let historyHasCostLines = false

  for (const record of state.historyRecords ?? []) {
    if (record.date !== trusted) continue
    if (isReconstructedSnapshotNote(record.note)) continue
    for (const item of record.dueItems ?? []) {
      if (item.source !== 'commitment') continue
      const id = historyCommitmentIdFromDueRow(item.rowId)
      if (!id) continue
      historyHasCostLines = true
      duePeriods.set(
        id,
        item.period && !item.period.startsWith('2099') ? item.period : trustedPeriod,
      )
    }
    for (const item of record.buildingUpItems ?? []) {
      if (item.source !== 'commitment' || item.rowId.startsWith('reserve-')) continue
      historyHasCostLines = true
      buildingIds.add(item.rowId)
    }
  }

  if (!historyHasCostLines) return state

  let changed = false
  const commitments = state.commitments.map((commitment) => {
    if (commitment.schedule !== 'monthly') return commitment
    if (!isRecoveredCostNotes(commitment.notes)) return commitment
    if (hasExplicitMarkPaid(commitment, trustedPeriod)) return commitment
    const duePeriod = duePeriods.get(commitment.id)
    if (duePeriod) {
      const next = previousPeriod(duePeriod)
      if (commitment.lastPaidPeriod === next) return commitment
      changed = true
      return { ...commitment, lastPaidPeriod: next }
    }
    const inferredPaidThisMonth =
      (commitment.lastPaidPeriod ?? '') >= trustedPeriod &&
      !hasExplicitMarkPaid(commitment, trustedPeriod)
    if (!buildingIds.has(commitment.id) && !inferredPaidThisMonth) return commitment
    const next = previousPeriod(trustedPeriod)
    if (commitment.lastPaidPeriod === next) return commitment
    changed = true
    return { ...commitment, lastPaidPeriod: next }
  })

  if (!changed) return state
  console.info('[Workspace] Reopened restored costs that were wrongly marked paid this month')
  return { ...state, workspaceOrigin: 'user', commitments }
}

/** Rebuild costs, due items, and reserve plans from History when the live lists were emptied. */
export function recoverLivingCostsFromHistory(state: AppState): AppState {
  const trusted = trustedHistoryDate(state)
  if (trusted) {
    console.info('[Workspace] Repairing Due and receipts from History date', trusted)
  }
  forgetDeletedReceiptIds([...currentHistoryOpenReceiptIds(state)])
  const pruned = pruneStaleHistoryRestoredReceipts(state)
  const receipts = recoverExpectedReceiptsFromHistory(pruned)
  const withCosts = recoverCommitmentsFromHistory(receipts.state)
  const refined = refineRestoredCommitmentsFromHistory(withCosts.state)
  const reopened = reopenCommittedFundsFromHistory(refined)
  const withShells = recoverReservePlannerShellsFromHistory(reopened)
  const withBills = recoverReserveBillsFromHistory(withShells)
  return restoreReservePlannerBuffersFromHistory(withBills.state)
}

export function recoverWorkspaceFromHistory(state: AppState): {
  state: AppState
  receiptsRestored: number
  plannersRepaired: string[]
  costsRestored: number
  diagnosis: ReturnType<typeof diagnoseReservePlanners>
} {
  forgetDeletedReceiptIds([...currentHistoryOpenReceiptIds(state)])
  const pruned = pruneStaleHistoryRestoredReceipts(state)
  const receipts = recoverExpectedReceiptsFromHistory(pruned)
  const withCosts = recoverCommitmentsFromHistory(receipts.state)
  const refined = refineRestoredCommitmentsFromHistory(withCosts.state)
  const reopened = reopenCommittedFundsFromHistory(refined)
  const withShells = recoverReservePlannerShellsFromHistory(reopened)
  const bills = recoverReserveBillsFromHistory(withShells)
  const withBuffers = restoreReservePlannerBuffersFromHistory(bills.state)
  return {
    state: withBuffers,
    receiptsRestored: receipts.restoredCount,
    costsRestored: withCosts.restoredCount,
    plannersRepaired: bills.restoredPlannerIds,
    diagnosis: diagnoseReservePlanners(withBuffers),
  }
}

export function reservePlannersMissingDeposit(state: AppState): string[] {
  return diagnoseReservePlanners(state)
    .filter((row) => row.monthlyDeposit <= 0)
    .map((row) => row.name || row.plannerId)
}
