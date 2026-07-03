import type { AppState, BalanceSnapshot, Commitment, ExpectedReceipt, ReservePlanner, ScopeLevel, SnapshotAccountChange, ViewScope } from '../types'
import { getAccountLocationLabel } from './accounts'
import { newId } from './id'
import { getChartScopeOptions } from './chartScopes'
import { computeScopeMetricsAtDate, getHistoryDatesForViewScope, rebuildHistoryRecordsFromDate } from './historyRebuild'
import {
  getBusinessIdsForScope,
  getBusinessesInGroup,
  getScopeLabel,
  getVenueIdsForScope,
  getVenuesInBusiness,
} from './scope'
import { getFreshness, getSnapshotIdsForDateInScope } from './snapshots'
import { rebuildSnapshotsFromDate } from './snapshotRebuild'

export function getScopesForChangedAccounts(state: AppState, accountIds: string[]): ViewScope[] {
  const seen = new Set<string>()
  const scopes: ViewScope[] = []

  const add = (type: ScopeLevel, id: string) => {
    const key = `${type}:${id}`
    if (seen.has(key)) return
    seen.add(key)
    scopes.push({ type, id })
  }

  for (const accountId of accountIds) {
    const account = state.accounts.find((a) => a.id === accountId)
    if (!account) continue

    if (account.venueId) {
      const venue = state.venues.find((v) => v.id === account.venueId)
      if (!venue) continue
      const business = state.businesses.find((b) => b.id === venue.businessId)
      if (!business) continue
      add('venue', venue.id)
      add('business', business.id)
      add('group', business.groupId)
    } else if (account.businessId) {
      const business = state.businesses.find((b) => b.id === account.businessId)
      if (!business) continue
      add('business', business.id)
      add('group', business.groupId)
    }
  }

  return scopes
}

export function getChangedAccountsForScope(
  state: AppState,
  scope: ViewScope,
  changes: SnapshotAccountChange[],
): SnapshotAccountChange[] {
  const venueIds = getVenueIdsForScope(state, scope)
  const businessIds = getBusinessIdsForScope(state, scope)

  return changes.filter((c) => {
    const account = state.accounts.find((a) => a.id === c.accountId)
    if (!account) return false
    if (account.venueId && venueIds.includes(account.venueId)) return true
    if (account.businessId && !account.venueId && businessIds.includes(account.businessId)) return true
    return false
  })
}

function collectAccountChangesFromTreeSnapshots(
  state: AppState,
  scope: ViewScope,
  date: string,
): SnapshotAccountChange[] {
  const snapshotIds = new Set(getSnapshotIdsForDateInScope(state, date, scope))
  const byAccount = new Map<string, SnapshotAccountChange>()

  for (const snap of state.snapshots) {
    if (!snapshotIds.has(snap.id)) continue
    for (const change of snap.changedAccounts) {
      if (getChangedAccountsForScope(state, scope, [change]).length > 0) {
        byAccount.set(change.accountId, change)
      }
    }
  }

  return [...byAccount.values()]
}

export function expandScopesForRollup(state: AppState, seed: ViewScope[]): ViewScope[] {
  const seen = new Map<string, ViewScope>()
  const add = (scope: ViewScope) => {
    const key = `${scope.type}:${scope.id}`
    if (!seen.has(key)) seen.set(key, scope)
  }

  for (const scope of seed) {
    add(scope)
    if (scope.type === 'group') {
      for (const business of getBusinessesInGroup(state, scope.id)) {
        add({ type: 'business', id: business.id })
        for (const venue of getVenuesInBusiness(state, business.id)) {
          add({ type: 'venue', id: venue.id })
        }
      }
    } else if (scope.type === 'business') {
      const business = state.businesses.find((b) => b.id === scope.id)
      if (business) add({ type: 'group', id: business.groupId })
      for (const venue of getVenuesInBusiness(state, scope.id)) {
        add({ type: 'venue', id: venue.id })
      }
    } else if (scope.type === 'venue') {
      const venue = state.venues.find((v) => v.id === scope.id)
      if (venue) {
        add({ type: 'business', id: venue.businessId })
        const business = state.businesses.find((b) => b.id === venue.businessId)
        if (business) add({ type: 'group', id: business.groupId })
      }
    }
  }

  return [...seen.values()]
}

function mergeAccountChanges(
  existing: SnapshotAccountChange[],
  incoming: SnapshotAccountChange[],
): SnapshotAccountChange[] {
  const merged = [...existing]
  for (const change of incoming) {
    const idx = merged.findIndex((c) => c.accountId === change.accountId)
    if (idx >= 0) merged[idx] = change
    else merged.push(change)
  }
  return merged
}

function noteForScope(
  scope: ViewScope,
  scopeChanges: SnapshotAccountChange[],
  noteText: string | undefined,
  existing?: BalanceSnapshot,
): { note?: string; noteSource?: string } {
  if (!noteText) {
    return { note: existing?.note, noteSource: existing?.noteSource }
  }

  const sources = [...new Set(scopeChanges.map((c) => c.venueName))]

  if (scope.type === 'venue') {
    return { note: noteText, noteSource: sources[0] }
  }

  return { note: noteText, noteSource: sources.join(', ') }
}

export function ensureDailySnapshotAtDate(
  snapshots: BalanceSnapshot[],
  params: {
    date: string
    scope: ViewScope
    state: AppState
    changedAccounts: SnapshotAccountChange[]
    noteText?: string
    now: string
    requireScopeChanges?: boolean
  },
): BalanceSnapshot[] {
  const { date, scope, state, changedAccounts, noteText, now, requireScopeChanges = false } = params
  const scopeChanges = getChangedAccountsForScope(state, scope, changedAccounts)
  const existingIdx = snapshots.findIndex(
    (s) => s.date === date && s.scopeType === scope.type && s.scopeId === scope.id,
  )
  const existing = existingIdx >= 0 ? snapshots[existingIdx] : undefined
  const treeChanges = collectAccountChangesFromTreeSnapshots(state, scope, date)
  const mergedChanges =
    scopeChanges.length > 0
      ? mergeAccountChanges(existing?.changedAccounts ?? [], scopeChanges)
      : (existing?.changedAccounts ?? treeChanges)

  if (requireScopeChanges && scopeChanges.length === 0) return snapshots
  if (!existing && mergedChanges.length === 0 && treeChanges.length === 0) return snapshots

  const metrics = computeScopeMetricsAtDate(state, scope, date)
  const noteChanges = scopeChanges.length > 0 ? scopeChanges : mergedChanges
  const { note, noteSource } = noteForScope(scope, noteChanges, noteText, existing)

  const snapshot: BalanceSnapshot = {
    id: existing?.id ?? newId(),
    date,
    scopeType: scope.type,
    scopeId: scope.id,
    viewName: getScopeLabel(state, scope),
    cash: metrics.cash,
    committedFunds: metrics.committedFunds,
    expectedReceipts: metrics.expectedReceipts,
    trueBalance: metrics.trueBalance,
    note,
    noteSource,
    freshness: getFreshness(0),
    changedAccounts: mergedChanges,
    updatedAt: now,
    recordedValues: scopeChanges.length > 0 ? undefined : existing?.recordedValues,
    correctedAt: scopeChanges.length > 0 ? undefined : existing?.correctedAt,
  }

  if (existingIdx >= 0) {
    return snapshots.map((s, i) => (i === existingIdx ? snapshot : s))
  }
  return [...snapshots, snapshot]
}

export function upsertDailySnapshot(
  snapshots: BalanceSnapshot[],
  params: {
    date: string
    scope: ViewScope
    state: AppState
    changedAccounts: SnapshotAccountChange[]
    noteText?: string
    now: string
  },
): BalanceSnapshot[] {
  return ensureDailySnapshotAtDate(snapshots, { ...params, requireScopeChanges: true })
}

/** Create missing group / business / venue snapshots for every saved day in the tree. */
export function backfillScopeSnapshots(state: AppState, now: string): AppState {
  let snapshots = [...state.snapshots]
  const touched = new Set<string>()

  for (const group of state.groups) {
    const viewScope: ViewScope = { type: 'group', id: group.id }
    for (const date of getHistoryDatesForViewScope(state, viewScope)) {
      for (const option of getChartScopeOptions(state, viewScope)) {
        const key = `${option.scope.type}:${option.scope.id}:${date}`
        if (touched.has(key)) continue
        touched.add(key)
        snapshots = ensureDailySnapshotAtDate(snapshots, {
          date,
          scope: option.scope,
          state,
          changedAccounts: [],
          now,
        })
      }
    }
  }

  return { ...state, snapshots }
}

export function getScopesForCommitment(state: AppState, commitment: Commitment): ViewScope[] {
  const scopes: ViewScope[] = []
  const seen = new Set<string>()
  const add = (type: ViewScope['type'], id: string) => {
    const key = `${type}:${id}`
    if (seen.has(key)) return
    seen.add(key)
    scopes.push({ type, id })
  }

  if (commitment.scopeLevel === 'venue') {
    const venue = state.venues.find((v) => v.id === commitment.scopeId)
    if (!venue) return scopes
    const business = state.businesses.find((b) => b.id === venue.businessId)
    add('venue', venue.id)
    if (business) {
      add('business', business.id)
      add('group', business.groupId)
    }
    return scopes
  }

  if (commitment.scopeLevel === 'business') {
    const business = state.businesses.find((b) => b.id === commitment.scopeId)
    if (!business) return scopes
    add('business', business.id)
    add('group', business.groupId)
    return scopes
  }

  add('group', commitment.scopeId)
  return scopes
}

export function getScopesForReceipt(state: AppState, receipt: ExpectedReceipt): ViewScope[] {
  return getScopesForCommitment(state, {
    id: receipt.id,
    name: receipt.name,
    schedule: 'monthly',
    amount: receipt.amount,
    scopeLevel: receipt.scopeLevel,
    scopeId: receipt.scopeId,
    status: 'healthy',
  })
}

export function getScopesForReservePlanner(state: AppState, planner: ReservePlanner): ViewScope[] {
  const scopes: ViewScope[] = []
  const seen = new Set<string>()
  const add = (type: ViewScope['type'], id: string) => {
    const key = `${type}:${id}`
    if (seen.has(key)) return
    seen.add(key)
    scopes.push({ type, id })
  }

  const business = state.businesses.find((b) => b.id === planner.businessId)
  if (!business) return scopes

  add('business', business.id)
  add('group', business.groupId)
  for (const venue of state.venues.filter((v) => v.businessId === business.id)) {
    add('venue', venue.id)
  }

  return scopes
}

/** Recompute saved snapshots and History records from a date forward after financial data changes. */
export function refreshSnapshotsForScopes(
  state: AppState,
  scopes: ViewScope[],
  fromDate: string,
  now: string,
): AppState {
  let next = rebuildSnapshotsFromDate(state, fromDate, scopes, now)
  next = rebuildHistoryRecordsFromDate(next, fromDate, scopes, now)
  return next
}

export function applySnapshotRollup(
  state: AppState,
  changedAccounts: SnapshotAccountChange[],
  noteText: string | undefined,
  now: string,
  date: string,
): AppState {
  const accountIds = changedAccounts.map((c) => c.accountId)
  const scopes = expandScopesForRollup(state, getScopesForChangedAccounts(state, accountIds))

  let snapshots = state.snapshots
  for (const scope of scopes) {
    snapshots = ensureDailySnapshotAtDate(snapshots, {
      date,
      scope,
      state,
      changedAccounts,
      noteText,
      now,
    })
  }

  return { ...state, snapshots }
}

export function buildSnapshotAccountChange(
  state: AppState,
  account: { id: string; name: string; venueId?: string; businessId?: string },
  balance: number,
): SnapshotAccountChange {
  const full = state.accounts.find((a) => a.id === account.id)
  return {
    accountId: account.id,
    accountName: account.name,
    venueId: account.venueId,
    venueName: full ? getAccountLocationLabel(state, full) : 'Unknown',
    balance,
  }
}
