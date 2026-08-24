import type { Account, AppState, BalanceSnapshot, HistoryRecord, SnapshotAccountChange, ViewScope } from '../types'
import { getAccountBusinessId, getAccountLocationLabel } from './accounts'
import { roundCurrency, toAmount } from './amounts'
import {
  getAccountsForScope,
  getCommitmentsForScope,
  getReceiptsContributingOnDate,
  getReservePlannersForScope,
} from './calculations'
import {
  buildCommitmentViews,
  getAccruedAmount,
  getDerivedDueRowStatus,
} from './commitmentCalculations'
import { getEffectiveReceiptAmount, getReceiptTiming } from './receiptCalculations'
import { buildReserveAccruingRows, buildReserveDueRows } from './reserveCalculations'
import { getBusinessesInGroup, getBusinessIdsForScope, getGroupIdForScope, getScopeLabel, getVenueIdsForScope, businessHasVenues, getVenuesInBusiness } from './scope'
import { getAncestorScopes, getFreshness, getSnapshotIdsForDateInScope, getSnapshotsForDateInScopeTree, snapshotScopeSpecificity, todayDateKey } from './snapshots'
import { computeCommittedFundsAt, computeExpectedReceiptsAt } from './metricsAtDate'
import { getEffectiveSnapshotMetric } from './snapshotMetrics'
import { isPersistedSnapshot } from './scopeSnapshotSeries'

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

  for (const ancestor of getAncestorScopes(state, viewScope)) {
    for (const snap of state.snapshots) {
      if (snap.date && snap.scopeType === ancestor.type && snap.scopeId === ancestor.id) {
        dates.add(snap.date)
      }
    }
  }

  return [...dates].sort((a, b) => b.localeCompare(a))
}

/**
 * The database could only store one History row per day, so business/venue captures
 * were deleted on save. Daily snapshots still keep per-scope totals — rebuild those logs.
 */
export function reconstructHistoryRecordsFromSnapshots(state: AppState): AppState {
  if (state.workspaceOrigin === 'builtin-demo') return state
  const existing = new Set(
    (state.historyRecords ?? []).map(
      (record) => `${record.date}:${record.viewScope.type}:${record.viewScope.id}`,
    ),
  )
  const added: HistoryRecord[] = []

  for (const snap of state.snapshots) {
    if (snap.id.startsWith('derived:') || snap.id.startsWith('history:')) continue
    const key = `${snap.date}:${snap.scopeType}:${snap.scopeId}`
    if (existing.has(key)) continue
    existing.add(key)
    added.push({
      id: `snapshot-history:${snap.id}`,
      date: snap.date,
      savedAt: snap.updatedAt,
      viewScope: { type: snap.scopeType, id: snap.scopeId },
      viewName: snap.viewName || '',
      note: 'Restored from saved daily snapshot',
      summary: {
        cash: snap.cash,
        committedFunds: snap.committedFunds,
        expectedReceipts: snap.expectedReceipts,
        trueBalance: snap.trueBalance,
      },
      accounts: (snap.changedAccounts ?? []).map((change) => ({
        id: change.accountId,
        name: change.accountName,
        type: 'current' as const,
        balance: change.balance,
        venueId: change.venueId,
        venueName: change.venueName ?? null,
        active: true,
      })),
      buildingUpItems: [],
      dueItems: [],
      expectedReceipts: [],
      commitments: [],
      reservePlanners: [],
    })
  }

  if (added.length === 0) return state
  console.info(`[Workspace] Restored ${added.length} missing History logs from daily snapshots`)
  return { ...state, workspaceOrigin: state.workspaceOrigin ?? 'user', historyRecords: [...(state.historyRecords ?? []), ...added] }
}

function historyAccountBusinessId(
  state: AppState,
  account: HistoryRecord['accounts'][number],
): string | null {
  if (account.businessId && state.businesses.some((business) => business.id === account.businessId)) {
    return account.businessId
  }
  if (account.venueId) {
    const venue = state.venues.find((row) => row.id === account.venueId)
    if (venue) return venue.businessId
  }
  const live = state.accounts.find((row) => row.id === account.id)
  if (live) return getAccountBusinessId(state, live)
  if (account.businessName) {
    const named = state.businesses.find((business) => business.name === account.businessName)
    if (named) return named.id
  }
  return null
}

function historyItemInBusiness(
  state: AppState,
  item: { scopeLevel: HistoryRecord['dueItems'][number]['scopeLevel']; scopeId: string },
  businessId: string,
): boolean {
  if (item.scopeLevel === 'business') return item.scopeId === businessId
  if (item.scopeLevel === 'venue') {
    return state.venues.find((venue) => venue.id === item.scopeId)?.businessId === businessId
  }
  return false
}

function accountsFromGroupSnapshot(
  state: AppState,
  groupId: string,
  date: string,
): HistoryRecord['accounts'] {
  const snap = state.snapshots.find(
    (row) => row.date === date && row.scopeType === 'group' && row.scopeId === groupId,
  )
  if (!snap?.changedAccounts?.length) return []
  return snap.changedAccounts.map((change) => {
    const live = state.accounts.find((account) => account.id === change.accountId)
    return {
      id: change.accountId,
      name: change.accountName,
      type: live?.type ?? ('current' as const),
      balance: change.balance,
      venueId: change.venueId ?? live?.venueId,
      businessId: live ? getAccountBusinessId(state, live) ?? undefined : undefined,
      venueName: change.venueName ?? null,
      active: live?.active ?? true,
    }
  })
}

function splitGroupHistoryForBusiness(
  state: AppState,
  record: HistoryRecord,
  businessId: string,
): HistoryRecord | null {
  const accountsSource =
    record.accounts.length > 0 ? record.accounts : accountsFromGroupSnapshot(state, record.viewScope.id, record.date)
  const accounts = accountsSource.filter((account) => historyAccountBusinessId(state, account) === businessId)
  const dueItems = (record.dueItems ?? []).filter((item) => historyItemInBusiness(state, item, businessId))
  const buildingUpItems = (record.buildingUpItems ?? []).filter((item) =>
    historyItemInBusiness(state, item, businessId),
  )
  const expectedReceipts = (record.expectedReceipts ?? []).filter((item) =>
    historyItemInBusiness(state, item, businessId),
  )
  const commitments = (record.commitments ?? []).filter((item) => historyItemInBusiness(state, item, businessId))
  const reservePlanners = (record.reservePlanners ?? []).filter((planner) => planner.businessId === businessId)

  const cash = roundCurrency(accounts.reduce((sum, account) => sum + account.balance, 0))
  const lineCommitted = roundCurrency(
    dueItems.reduce((sum, item) => sum + item.amount, 0) +
      buildingUpItems.reduce((sum, item) => sum + item.accruedAmount, 0),
  )
  const receipts = roundCurrency(
    expectedReceipts.filter((item) => !item.received).reduce((sum, item) => sum + item.amount, 0),
  )

  const groupCash = record.summary.cash
  const hasLines = dueItems.length + buildingUpItems.length + expectedReceipts.length > 0
  let committedFunds = lineCommitted
  let expectedReceiptsTotal = receipts
  let trueBalance = roundCurrency(cash - committedFunds + expectedReceiptsTotal)

  if (!hasLines && groupCash > 0 && cash > 0) {
    const share = cash / groupCash
    committedFunds = roundCurrency(record.summary.committedFunds * share)
    expectedReceiptsTotal = roundCurrency(record.summary.expectedReceipts * share)
    trueBalance = roundCurrency(record.summary.trueBalance * share)
  }

  if (cash === 0 && trueBalance === 0 && dueItems.length === 0 && accounts.length === 0) {
    return null
  }

  const business = state.businesses.find((row) => row.id === businessId)
  return {
    id: `split-history:${record.id}:${businessId}`,
    date: record.date,
    savedAt: record.savedAt,
    viewScope: { type: 'business', id: businessId },
    viewName: business?.name || getScopeLabel(state, { type: 'business', id: businessId }),
    note: 'Split from group History capture',
    summary: {
      cash,
      committedFunds,
      expectedReceipts: expectedReceiptsTotal,
      trueBalance,
    },
    accounts,
    buildingUpItems,
    dueItems,
    expectedReceipts,
    commitments,
    reservePlanners,
  }
}

function snapshotFromSplitHistory(record: HistoryRecord): BalanceSnapshot {
  return {
    id: `split-snap:${record.id}`,
    date: record.date,
    scopeType: record.viewScope.type,
    scopeId: record.viewScope.id,
    viewName: record.viewName,
    cash: record.summary.cash,
    committedFunds: record.summary.committedFunds,
    expectedReceipts: record.summary.expectedReceipts,
    trueBalance: record.summary.trueBalance,
    freshness: getFreshness(0),
    changedAccounts: record.accounts.map((account) => ({
      accountId: account.id,
      accountName: account.name,
      venueId: account.venueId,
      venueName: account.venueName ?? '',
      balance: account.balance,
    })),
    updatedAt: record.savedAt,
  }
}

/**
 * Group check-ins kept the Total for a day but the database deleted business logs.
 * Rebuild each business's Cash Prophet Balance from that day's group accounts and Due/receipt lines.
 */
export function explodeGroupHistoryIntoBusinessLogs(state: AppState): AppState {
  if (state.workspaceOrigin === 'builtin-demo') return state

  const existingHistory = new Set(
    (state.historyRecords ?? []).map(
      (record) => `${record.date}:${record.viewScope.type}:${record.viewScope.id}`,
    ),
  )
  const existingSnaps = new Set(
    state.snapshots
      .filter((snap) => !snap.id.startsWith('derived:') && !snap.id.startsWith('history:'))
      .map((snap) => `${snap.date}:${snap.scopeType}:${snap.scopeId}`),
  )

  const historyAdded: HistoryRecord[] = []
  const snapshotsAdded: BalanceSnapshot[] = []

  for (const record of state.historyRecords ?? []) {
    if (record.viewScope.type !== 'group') continue
    for (const business of getBusinessesInGroup(state, record.viewScope.id)) {
      const key = `${record.date}:business:${business.id}`
      if (existingHistory.has(key)) continue
      const split = splitGroupHistoryForBusiness(state, record, business.id)
      if (!split) continue
      existingHistory.add(key)
      historyAdded.push(split)
      if (!existingSnaps.has(key)) {
        existingSnaps.add(key)
        snapshotsAdded.push(snapshotFromSplitHistory(split))
      }
    }
  }

  if (historyAdded.length === 0 && snapshotsAdded.length === 0) return state
  console.info(
    `[Workspace] Split ${historyAdded.length} business History days from group captures, ${snapshotsAdded.length} snapshot points`,
  )
  return {
    ...state,
    workspaceOrigin: 'user',
    historyRecords: [...(state.historyRecords ?? []), ...historyAdded],
    snapshots: [...state.snapshots, ...snapshotsAdded],
  }
}

function snapshotAppliesToScope(state: AppState, snap: BalanceSnapshot, scope: ViewScope): boolean {
  const snapScope: ViewScope = { type: snap.scopeType, id: snap.scopeId }
  if (snapScope.type === scope.type && snapScope.id === scope.id) return true
  if (scopeIsAncestorOf(state, snapScope, scope)) return true
  if (scopeIsAncestorOf(state, scope, snapScope)) return true
  return false
}

function carryForwardAccountBalances(
  state: AppState,
  viewScope: ViewScope,
  date: string,
  balances: Map<string, number>,
): void {
  const accountsInScope = getAccountsForScope(state, viewScope)
  const missing = accountsInScope.filter((account) => !balances.has(account.id))
  if (missing.length === 0) return

  const neededIds = new Set(missing.map((account) => account.id))
  const priorSnapshots = state.snapshots
    .filter((snap) => snap.date < date && snap.changedAccounts.length > 0)
    .filter((snap) => snapshotAppliesToScope(state, snap, viewScope))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || snapshotScopeSpecificity(a) - snapshotScopeSpecificity(b),
    )

  for (const snap of priorSnapshots) {
    for (const change of snap.changedAccounts) {
      if (!neededIds.has(change.accountId) || balances.has(change.accountId)) continue
      balances.set(change.accountId, change.balance)
    }
    if (missing.every((account) => balances.has(account.id))) break
  }
}

function carryForwardHistoryAccountBalances(
  state: AppState,
  viewScope: ViewScope,
  date: string,
  balances: Map<string, number>,
): void {
  const accountsInScope = getAccountsForScope(state, viewScope)
  const missing = accountsInScope.filter((account) => !balances.has(account.id))
  if (missing.length === 0) return

  const neededIds = new Set(missing.map((account) => account.id))
  const priorRecords = (state.historyRecords ?? [])
    .filter((record) => record.date < date && scopeInViewTree(state, record.viewScope, viewScope))
    .sort((a, b) => b.date.localeCompare(a.date) || scopeSpecificity(b.viewScope) - scopeSpecificity(a.viewScope))

  for (const record of priorRecords) {
    for (const account of record.accounts) {
      if (!neededIds.has(account.id) || balances.has(account.id)) continue
      balances.set(account.id, account.balance)
    }
    if (missing.every((account) => balances.has(account.id))) break
  }
}

function applySnapshotChangesForScope(
  state: AppState,
  viewScope: ViewScope,
  snap: BalanceSnapshot,
  balances: Map<string, number>,
): void {
  if (snap.changedAccounts.length === 0) return

  const accountIds = new Set(getAccountsForScope(state, viewScope).map((account) => account.id))
  const snapMatchesScope = snap.scopeType === viewScope.type && snap.scopeId === viewScope.id

  for (const change of snap.changedAccounts) {
    if (!accountIds.has(change.accountId)) continue

    const existing = balances.get(change.accountId)
    if (
      !snapMatchesScope &&
      change.balance === 0 &&
      existing != null &&
      existing !== 0
    ) {
      continue
    }

    balances.set(change.accountId, change.balance)
  }
}

function venueMetricsFromAncestorHistory(
  state: AppState,
  venueId: string,
  date: string,
): ScopeMetricsAtDate | null {
  const venueScope: ViewScope = { type: 'venue', id: venueId }
  const referenceDate = parseRecordDate(date)
  const venueAccountIds = new Set(getAccountsForScope(state, venueScope).map((account) => account.id))
  if (venueAccountIds.size === 0) return null

  const balances = new Map<string, number>()
  const records = (state.historyRecords ?? [])
    .filter(
      (record) =>
        record.date === date && scopeInViewTree(state, record.viewScope, venueScope),
    )
    .sort((a, b) => scopeSpecificity(a.viewScope) - scopeSpecificity(b.viewScope))

  for (const record of records) {
    for (const account of record.accounts) {
      if (account.venueId !== venueId || !venueAccountIds.has(account.id)) continue
      balances.set(account.id, account.balance)
    }
  }

  if (balances.size === 0) return null

  const accountsInScope = getAccountsForScope(state, venueScope).map((account) => ({
    ...account,
    balance: balances.has(account.id) ? balances.get(account.id)! : account.balance,
  }))

  const cash = roundCurrency(accountsInScope.reduce((sum, account) => sum + account.balance, 0))
  if (cash === 0) return null

  const committedFunds = roundCurrency(computeCommittedFundsAt(state, venueScope, referenceDate))
  const expectedReceipts = roundCurrency(computeExpectedReceiptsAt(state, venueScope, referenceDate))

  return {
    cash,
    committedFunds,
    expectedReceipts,
    trueBalance: roundCurrency(cash - committedFunds + expectedReceipts),
  }
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
  const accountIds = new Set(getAccountsForScope(state, viewScope).map((account) => account.id))
  for (const record of records) {
    for (const account of record.accounts) {
      if (!accountIds.has(account.id)) continue
      balances.set(account.id, account.balance)
    }
  }

  for (const snap of getSnapshotsForDateInScopeTree(state, date, viewScope)) {
    applySnapshotChangesForScope(state, viewScope, snap, balances)
  }

  carryForwardAccountBalances(state, viewScope, date, balances)
  carryForwardHistoryAccountBalances(state, viewScope, date, balances)

  return balances
}

/** Saved History page summary for an exact scope and day (when balances were recorded). */
export function getExactHistorySummaryForScopeDate(
  state: AppState,
  scope: ViewScope,
  date: string,
): ScopeMetricsAtDate | null {
  const record = (state.historyRecords ?? []).find(
    (entry) =>
      entry.date === date &&
      entry.viewScope.type === scope.type &&
      entry.viewScope.id === scope.id,
  )
  return record?.summary ?? null
}

function rollupBusinessMetricsFromVenues(
  state: AppState,
  businessId: string,
  date: string,
): ScopeMetricsAtDate | null {
  const venues = getVenuesInBusiness(state, businessId)
  if (venues.length <= 1) return null

  let cash = 0
  let committedFunds = 0
  let expectedReceipts = 0

  for (const venue of venues) {
    const metrics = computeScopeMetricsAtDate(state, { type: 'venue', id: venue.id }, date)
    cash += metrics.cash
    committedFunds += metrics.committedFunds
    expectedReceipts += metrics.expectedReceipts
  }

  return {
    cash: roundCurrency(cash),
    committedFunds: roundCurrency(committedFunds),
    expectedReceipts: roundCurrency(expectedReceipts),
    trueBalance: roundCurrency(cash - committedFunds + expectedReceipts),
  }
}

function computeScopeMetricsFromAccounts(
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

/** Cash and derived balances for a scope on a calendar day — same logic as the History page. */
export function computeScopeMetricsAtDate(
  state: AppState,
  viewScope: ViewScope,
  date: string,
): ScopeMetricsAtDate {
  let metrics = computeScopeMetricsFromAccounts(state, viewScope, date)

  const saved = getExactHistorySummaryForScopeDate(state, viewScope, date)
  if (saved && metrics.trueBalance === 0 && saved.trueBalance !== 0) {
    metrics = saved
  }

  if (viewScope.type === 'business' && businessHasVenues(state, viewScope.id)) {
    const venueRollup = rollupBusinessMetricsFromVenues(state, viewScope.id, date)
    if (
      venueRollup &&
      venueRollup.trueBalance !== 0 &&
      (metrics.trueBalance === 0 || metrics.cash === 0)
    ) {
      metrics = venueRollup
    }
  }

  if (viewScope.type === 'venue') {
    if (metrics.trueBalance === 0 || metrics.cash === 0) {
      const venueSnap = state.snapshots.find(
        (snap) =>
          snap.date === date &&
          snap.scopeType === 'venue' &&
          snap.scopeId === viewScope.id,
      )
      if (venueSnap) {
        const snapMetrics = {
          cash: getEffectiveSnapshotMetric(state, venueSnap, 'cash'),
          committedFunds: getEffectiveSnapshotMetric(state, venueSnap, 'committedFunds'),
          expectedReceipts: getEffectiveSnapshotMetric(state, venueSnap, 'expectedReceipts'),
          trueBalance: getEffectiveSnapshotMetric(state, venueSnap, 'trueBalance'),
        }
        if (snapMetrics.trueBalance !== 0 || snapMetrics.cash !== 0) {
          metrics = snapMetrics
        }
      }
    }

    if (metrics.cash === 0 || metrics.trueBalance === 0) {
      const fromAncestor = venueMetricsFromAncestorHistory(state, viewScope.id, date)
      if (fromAncestor) metrics = fromAncestor
    }
  }

  return metrics
}

export function buildSnapshotAccountChangesForScopeDate(
  state: AppState,
  scope: ViewScope,
  date: string,
): SnapshotAccountChange[] {
  const balances = accountBalancesForDate(state, scope, date)
  return getAccountsForScope(state, scope).map((account) => ({
    accountId: account.id,
    accountName: account.name,
    venueId: account.venueId,
    venueName: getAccountLocationLabel(state, account),
    balance: roundCurrency(balances.has(account.id) ? balances.get(account.id)! : account.balance),
  }))
}

/** Fill snapshots that have metrics but no per-account history — fixes multi-business balance logs. */
export function repairEmptySnapshotChangedAccounts(state: AppState): AppState {
  const today = todayDateKey()
  const snapshots = state.snapshots.map((snap) => {
    const scope: ViewScope = { type: snap.scopeType, id: snap.scopeId }
    if (getAccountsForScope(state, scope).length === 0) return snap

    const rebuilt = buildSnapshotAccountChangesForScopeDate(state, scope, snap.date)
    if (rebuilt.length === 0) return snap

    const rebuiltCash = roundCurrency(rebuilt.reduce((sum, change) => sum + change.balance, 0))
    const existingCash = roundCurrency(
      snap.changedAccounts.reduce((sum, change) => sum + change.balance, 0),
    )

    const needsRepair =
      snap.changedAccounts.length === 0 || (rebuiltCash !== 0 && existingCash === 0)

    if (!needsRepair) return snap

    // Past days: never invent account rows from today's live balances. Only accept a
    // rebuild when it agrees with the frozen snapshot cash total.
    if (snap.date < today && Math.abs(rebuiltCash - roundCurrency(snap.cash)) > 0.02) {
      return snap
    }

    return { ...snap, changedAccounts: rebuilt }
  })
  return { ...state, snapshots }
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
  return getReceiptsContributingOnDate(state, scope, recordDate)
    .map((receipt) => ({
      id: receipt.id,
      name: receipt.name,
      amount: roundCurrency(getEffectiveReceiptAmount(receipt, referenceDate)),
      targetAmount: toAmount(receipt.amount),
      receiptTiming: getReceiptTiming(receipt),
      expectedDate: receipt.expectedDate,
      accrualStartDate: receipt.accrualStartDate,
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

  const matchingSnap = state.snapshots.find(
    (snap) =>
      snap.date === date &&
      snap.scopeType === viewScope.type &&
      snap.scopeId === viewScope.id &&
      isPersistedSnapshot(snap),
  )

  // Past days: never live-recompute summary (rule changes must not rewrite history).
  const summary =
    date < todayDateKey()
      ? exact?.summary ??
        (matchingSnap
          ? {
              cash: matchingSnap.cash,
              committedFunds: matchingSnap.committedFunds,
              expectedReceipts: matchingSnap.expectedReceipts,
              trueBalance: matchingSnap.trueBalance,
            }
          : source?.summary) ??
        computeScopeMetricsAtDate(state, viewScope, date)
      : matchingSnap
        ? {
            cash: getEffectiveSnapshotMetric(state, matchingSnap, 'cash'),
            committedFunds: getEffectiveSnapshotMetric(state, matchingSnap, 'committedFunds'),
            expectedReceipts: getEffectiveSnapshotMetric(state, matchingSnap, 'expectedReceipts'),
            trueBalance: getEffectiveSnapshotMetric(state, matchingSnap, 'trueBalance'),
          }
        : computeScopeMetricsAtDate(state, viewScope, date)

  const lineItems = buildHistoryLineItems(state, viewScope, date, referenceDate)

  return {
    id: source?.id ?? `derived:${scopeKey(viewScope)}:${date}`,
    date,
    savedAt: source?.savedAt ?? new Date(`${date}T12:00:00`).toISOString(),
    viewScope: { ...viewScope },
    viewName,
    note: source?.note,
    summary,
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
export function refreshHistoryRecord(
  record: HistoryRecord,
  state: AppState,
  options?: { allowPastRewrite?: boolean },
): HistoryRecord {
  // Past History days stay as captured unless this is an intentional historic correction
  // (received/paid amount changed from when the item was first added).
  if (record.date < todayDateKey() && !options?.allowPastRewrite) {
    return record
  }

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
  const allowPastRewrite = fromDateKey < todayDateKey()
  const records = (state.historyRecords ?? []).map((record) => {
    if (record.date < fromDateKey) return record
    if (!scopeKeys.has(scopeKey(record.viewScope))) return record
    return refreshHistoryRecord(record, state, { allowPastRewrite })
  })

  return { ...state, historyRecords: records }
}
