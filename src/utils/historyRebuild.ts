import type { Account, AppState, HistoryRecord, ViewScope } from '../types'
import { getAccountBusinessId } from './accounts'
import { roundCurrency, toAmount } from './amounts'
import {
  getAccountsForScope,
  getCommitmentsForScope,
  getReceiptsForScope,
  getReservePlannersForScope,
} from './calculations'
import {
  buildCommitmentViews,
  getAccruedAmount,
  getDerivedDueRowStatus,
} from './commitmentCalculations'
import { getEffectiveReceiptAmount } from './receiptCalculations'
import { buildReserveAccruingRows, buildReserveDueRows } from './reserveCalculations'
import { getBusinessIdsForScope, getGroupIdForScope, getVenueIdsForScope } from './scope'
import { computeCommittedFundsAt, computeExpectedReceiptsAt } from './metricsAtDate'
import { getSnapshotIdsForDateInScope } from './snapshots'

export interface ScopeMetricsAtDate {
  cash: number
  committedFunds: number
  expectedReceipts: number
  trueBalance: number
}

function parseRecordDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function scopeKey(scope: ViewScope): string {
  return `${scope.type}:${scope.id}`
}

function scopeSpecificity(scope: ViewScope): number {
  if (scope.type === 'venue') return 3
  if (scope.type === 'business') return 2
  return 1
}

/** Whether a saved record or snapshot belongs to the current sidebar view (group, business, or venue). */
export function scopeInViewTree(
  state: AppState,
  recordScope: ViewScope,
  viewScope: ViewScope,
): boolean {
  if (recordScope.type === viewScope.type && recordScope.id === viewScope.id) return true

  if (scopeIsAncestorOf(state, recordScope, viewScope)) return true
  if (scopeIsAncestorOf(state, viewScope, recordScope)) return true

  return false
}

function scopeIsAncestorOf(state: AppState, ancestor: ViewScope, descendant: ViewScope): boolean {
  if (ancestor.type === 'group' && descendant.type === 'business') {
    const business = state.businesses.find((b) => b.id === descendant.id)
    return business?.groupId === ancestor.id
  }
  if (ancestor.type === 'group' && descendant.type === 'venue') {
    return getGroupIdForScope(state, descendant) === ancestor.id
  }
  if (ancestor.type === 'business' && descendant.type === 'venue') {
    const venue = state.venues.find((v) => v.id === descendant.id)
    return venue?.businessId === ancestor.id
  }
  return false
}

export function historyRecordMatchesScope(record: HistoryRecord, scope: ViewScope): boolean {
  return record.viewScope.type === scope.type && record.viewScope.id === scope.id
}

function storedRecordsForViewOnDate(state: AppState, viewScope: ViewScope, date: string): HistoryRecord[] {
  return (state.historyRecords ?? [])
    .filter((record) => record.date === date && scopeInViewTree(state, record.viewScope, viewScope))
    .sort((a, b) => scopeSpecificity(b.viewScope) - scopeSpecificity(a.viewScope))
}

/** Calendar days with saved balances anywhere in the current view tree. */
export function getHistoryDatesForViewScope(state: AppState, viewScope: ViewScope): string[] {
  const dates = new Set<string>()

  for (const record of state.historyRecords ?? []) {
    if (scopeInViewTree(state, record.viewScope, viewScope)) {
      dates.add(record.date)
    }
  }

  const businessIds = new Set(getBusinessIdsForScope(state, viewScope))
  const venueIds = new Set(getVenueIdsForScope(state, viewScope))

  for (const snap of state.snapshots) {
    if (snap.scopeType === viewScope.type && snap.scopeId === viewScope.id) {
      dates.add(snap.date)
      continue
    }
    if (snap.scopeType === 'business' && businessIds.has(snap.scopeId)) {
      dates.add(snap.date)
      continue
    }
    if (snap.scopeType === 'venue' && venueIds.has(snap.scopeId)) {
      dates.add(snap.date)
    }
  }

  return [...dates].sort((a, b) => b.localeCompare(a))
}

function accountBalancesForDate(
  state: AppState,
  viewScope: ViewScope,
  date: string,
): Map<string, number> {
  const balances = new Map<string, number>()

  const records = [...storedRecordsForViewOnDate(state, viewScope, date)].sort(
    (a, b) => scopeSpecificity(a.viewScope) - scopeSpecificity(b.viewScope),
  )
  for (const record of records) {
    for (const account of record.accounts) {
      balances.set(account.id, account.balance)
    }
  }

  const snapshotIds = new Set(getSnapshotIdsForDateInScope(state, date, viewScope))
  for (const snap of state.snapshots) {
    if (!snapshotIds.has(snap.id)) continue
    for (const change of snap.changedAccounts) {
      balances.set(change.accountId, change.balance)
    }
  }

  return balances
}

/** Cash and derived balances for a scope on a calendar day — same logic as the History page. */
export function computeScopeMetricsAtDate(
  state: AppState,
  viewScope: ViewScope,
  date: string,
): ScopeMetricsAtDate {
  const referenceDate = parseRecordDate(date)
  const balances = accountBalancesForDate(state, viewScope, date)
  const accountsInScope = getAccountsForScope(state, viewScope).map((account) => ({
    ...account,
    balance: balances.has(account.id) ? balances.get(account.id)! : account.balance,
  }))

  const cash = roundCurrency(accountsInScope.reduce((sum, account) => sum + account.balance, 0))
  const committedFunds = roundCurrency(computeCommittedFundsAt(state, viewScope, referenceDate))
  const expectedReceipts = roundCurrency(computeExpectedReceiptsAt(state, viewScope, referenceDate))
  const trueBalance = roundCurrency(cash - committedFunds + expectedReceipts)

  return { cash, committedFunds, expectedReceipts, trueBalance }
}

function enrichHistoryAccounts(state: AppState, accounts: Account[]): HistoryRecord['accounts'] {
  return accounts.map((account) => {
    const businessId = getAccountBusinessId(state, account) ?? account.businessId
    const business = businessId ? state.businesses.find((b) => b.id === businessId) : undefined
    const venue = account.venueId ? state.venues.find((v) => v.id === account.venueId) : undefined

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      venueId: account.venueId,
      businessId: businessId ?? undefined,
      businessName: business?.name,
      venueName: venue?.name ?? null,
      active: account.active,
    }
  })
}

function receiptsForHistoryRecord(
  state: AppState,
  scope: ViewScope,
  recordDate: string,
  referenceDate: Date,
) {
  return getReceiptsForScope(state, scope)
    .filter((receipt) => {
      const created = receipt.createdAt?.slice(0, 10)
      if (created && created > recordDate) return false
      return true
    })
    .map((receipt) => ({
      id: receipt.id,
      name: receipt.name,
      amount: roundCurrency(getEffectiveReceiptAmount(receipt, referenceDate)),
      received: receipt.received,
      scopeLevel: receipt.scopeLevel,
      scopeId: receipt.scopeId,
    }))
}

function buildHistoryLineItems(
  state: AppState,
  scope: ViewScope,
  recordDate: string,
  referenceDate: Date,
) {
  const commitments = getCommitmentsForScope(state, scope)
  const reserveRows = buildReserveAccruingRows(state, scope, referenceDate)
  const reserveDueRows = buildReserveDueRows(state, scope, referenceDate)
  const views = buildCommitmentViews(commitments, reserveRows, reserveDueRows, referenceDate)
  const planners = getReservePlannersForScope(state, scope)

  return {
    dueItems: views.due.map((row) => ({
      rowId: row.id,
      name: row.commitment.name,
      amount: row.amount,
      period: row.period,
      status: getDerivedDueRowStatus(row),
      source: row.source,
      schedule: row.source === 'reserve' ? ('reserve' as const) : row.commitment.schedule,
      scopeLevel: row.commitment.scopeLevel,
      scopeId: row.commitment.scopeId,
    })),
    buildingUpItems: views.buildingUp
      .filter((row) => row.accruedAmount > 0)
      .map((row) => ({
        rowId:
          row.source === 'reserve' && row.reservePlannerId
            ? `reserve-${row.reservePlannerId}`
            : row.commitment.id,
        name: row.commitment.name,
        accruedAmount: row.accruedAmount,
        budgetAmount: toAmount(row.commitment.amount),
        source: row.source,
        schedule: row.source === 'reserve' ? ('reserve' as const) : row.commitment.schedule,
        scopeLevel: row.commitment.scopeLevel,
        scopeId: row.commitment.scopeId,
      })),
    expectedReceipts: receiptsForHistoryRecord(state, scope, recordDate, referenceDate),
    commitments: commitments.map((commitment) => ({
      id: commitment.id,
      name: commitment.name,
      amount: commitment.amount,
      accruedAmount:
        commitment.schedule === 'monthly'
          ? getAccruedAmount(commitment, referenceDate)
          : commitment.schedule === 'planned'
            ? toAmount(commitment.amount)
            : 0,
      schedule: commitment.schedule,
      scopeLevel: commitment.scopeLevel,
      scopeId: commitment.scopeId,
      status: commitment.status,
    })),
    reservePlanners: planners.map((planner) => ({
      id: planner.id,
      name: planner.name,
      actualBalance: planner.actualBalance,
      bufferAmount: planner.bufferAmount,
      businessId: planner.businessId,
    })),
  }
}

/** Build a history day for the current sidebar scope, including data saved at parent scopes. */
export function buildHistoryRecordForViewScope(
  state: AppState,
  viewScope: ViewScope,
  date: string,
  viewName: string,
): HistoryRecord | null {
  const stored = storedRecordsForViewOnDate(state, viewScope, date)
  const exact = stored.find((record) => historyRecordMatchesScope(record, viewScope))
  const source = exact ?? stored[0]
  if (!source && !getSnapshotIdsForDateInScope(state, date, viewScope).length) return null

  const referenceDate = parseRecordDate(date)
  const balances = accountBalancesForDate(state, viewScope, date)
  const accountsInScope = getAccountsForScope(state, viewScope).map((account) => ({
    ...account,
    balance: balances.has(account.id) ? balances.get(account.id)! : account.balance,
  }))

  const accounts = enrichHistoryAccounts(state, accountsInScope)
  const { cash, committedFunds, expectedReceipts, trueBalance } = computeScopeMetricsAtDate(
    state,
    viewScope,
    date,
  )
  const lineItems = buildHistoryLineItems(state, viewScope, date, referenceDate)

  return {
    id: source?.id ?? `derived:${scopeKey(viewScope)}:${date}`,
    date,
    savedAt: source?.savedAt ?? new Date(`${date}T12:00:00`).toISOString(),
    viewScope: { ...viewScope },
    viewName,
    note: source?.note,
    summary: { cash, committedFunds, expectedReceipts, trueBalance },
    accounts,
    ...lineItems,
  }
}

/** History for the current sidebar scope — includes days saved at group level when viewing a business or venue. */
export function getHistoryRecordsForScope(state: AppState, viewScope: ViewScope): HistoryRecord[] {
  const viewName =
    viewScope.type === 'group'
      ? state.groups.find((g) => g.id === viewScope.id)?.name ?? 'Group'
      : viewScope.type === 'business'
        ? state.businesses.find((b) => b.id === viewScope.id)?.name ?? 'Business'
        : state.venues.find((v) => v.id === viewScope.id)?.name ?? 'Venue'

  return getHistoryDatesForViewScope(state, viewScope)
    .map((date) => buildHistoryRecordForViewScope(state, viewScope, date, viewName))
    .filter((record): record is HistoryRecord => record != null)
    .sort((a, b) => b.date.localeCompare(a.date) || b.savedAt.localeCompare(a.savedAt))
}

/** Stored history record ids to remove when deleting a day from the current view. */
export function getStoredHistoryRecordIdsForDay(
  state: AppState,
  date: string,
  viewScope: ViewScope,
): string[] {
  return (state.historyRecords ?? [])
    .filter((record) => record.date === date && scopeInViewTree(state, record.viewScope, viewScope))
    .map((record) => record.id)
}

/** Snapshot ids to remove when deleting a day from the current view. */
export function getSnapshotIdsForDayInViewScope(
  state: AppState,
  date: string,
  viewScope: ViewScope,
): string[] {
  return getSnapshotIdsForDateInScope(state, date, viewScope)
}

/** Snapshot ids tied to a saved history day for the same scope. */
export function getSnapshotIdsForHistoryRecord(state: AppState, record: HistoryRecord): string[] {
  if (record.id.startsWith('derived:')) {
    return getSnapshotIdsForDateInScope(state, record.date, record.viewScope)
  }
  return state.snapshots
    .filter(
      (snap) =>
        snap.date === record.date &&
        snap.scopeType === record.viewScope.type &&
        snap.scopeId === record.viewScope.id,
    )
    .map((snap) => snap.id)
}

/** Recompute summary and line items for one saved day using current data as-of that date. */
export function refreshHistoryRecord(record: HistoryRecord, state: AppState): HistoryRecord {
  const referenceDate = parseRecordDate(record.date)
  const scope = record.viewScope
  const lineItems = buildHistoryLineItems(state, scope, record.date, referenceDate)
  const balances = accountBalancesForDate(state, scope, record.date)
  const accountsInScope = getAccountsForScope(state, scope).map((account) => ({
    ...account,
    balance: balances.has(account.id) ? balances.get(account.id)! : account.balance,
  }))
  const accounts = enrichHistoryAccounts(state, accountsInScope)
  const summary = computeScopeMetricsAtDate(state, scope, record.date)

  return {
    ...record,
    accounts,
    summary,
    ...lineItems,
  }
}

/** Recompute saved History page records from a date forward for affected scopes. */
export function rebuildHistoryRecordsFromDate(
  state: AppState,
  fromDateKey: string,
  scopes: ViewScope[],
  _now: string,
): AppState {
  if (scopes.length === 0) return state

  const scopeKeys = new Set(scopes.map(scopeKey))
  const records = (state.historyRecords ?? []).map((record) => {
    if (record.date < fromDateKey) return record
    if (!scopeKeys.has(scopeKey(record.viewScope))) return record
    return refreshHistoryRecord(record, state)
  })

  return { ...state, historyRecords: records }
}
