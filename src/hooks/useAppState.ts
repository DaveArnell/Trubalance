import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultViewScope, initialState } from '../data/initialState'
import type {
  AccountType,
  AppState,
  BalanceSnapshot,
  BusinessReferenceProfile,
  Commitment,
  CompanyReferenceField,
  DiaryReminder,
  ExpectedReceipt,
  IncomePattern,
  ReserveBill,
  ReservePlanner,
  ReserveMonthConfirmInput,
  SnapshotAccountChange,
  ViewScope,
} from '../types'
import { isCommitmentScopeAllowed, isValidScopeReference, getScopeLabel, resolveDefaultViewScope, isViewScopeValid, scopesMatch } from '../utils/scope'
import { applySnapshotRollup, backfillScopeSnapshots, buildSnapshotAccountChange, getScopesForCommitment, getScopesForReceipt, getScopesForReservePlanner, refreshSnapshotsForScopes } from '../utils/snapshotRollup'
import {
  getCommitmentHistoricCorrectionFromDateKey,
  getCommitmentRebuildFromDateKey,
  getCommitmentRebuildFromPeriodOverridePatch,
  propagateSnapshotMetricDelta,
  refreshAllSnapshotMetrics,
} from '../utils/snapshotRebuild'
import { getReceiptRebuildFromDateKey, getReceiptDeleteFromDateKey, getReceiptActiveFromDateKey } from '../utils/receiptCalculations'
import { captureHistoryRecord, upsertDailyHistoryRecord } from '../utils/historyCapture'
import { getStoredHistoryRecordIdsForDay, getSnapshotIdsForDayInViewScope, repairEmptySnapshotChangedAccounts, scopeInViewTree } from '../utils/historyRebuild'
import { calculateDashboard, getCommitmentsForScope } from '../utils/calculations'
import {
  buildAmountChangePatch,
  buildMarkPaidPatch,
  currentPeriod,
  getActiveAccrualPeriod,
  getCommitmentDueOccurrences,
  getCommitmentPayoffExpectedTotal,
  mergeCommitmentDuePeriodOverride,
  migrateCommitment,
  buildCommitmentViews,
  countDueRowsNeedingAttention,
  getDerivedDueRowStatus,
} from '../utils/commitmentCalculations'
import { DEFAULT_RESERVE_BILL_DUE_DAY, getUnpaidReserveBillDueOccurrences, buildReserveAccruingRows, buildReserveDueRows, clearReserveDueAmountOverridesForPeriods } from '../utils/reserveCalculations'
import { nextSortOrder, sortByOrder } from '../utils/sortOrder'
import { toAmount, roundCurrency } from '../utils/amounts'
import { newId } from '../utils/id'
import { applySnapshotMetricCorrection } from '../utils/snapshotCorrections'
import type { HistoryMetricKey } from '../utils/historyTable'
import { todayDateKey, getFreshness } from '../utils/snapshots'
import { MONTHS, currentMonthIndex } from '../utils/format'
import { syncGuidedStructureInState, type GuidedBusinessPayload } from '../utils/structureDraftSync'
import { backupBrowserStateToSession, isUserOwnedWorkspace, readRawBrowserStateJson, statesMatchRoughly } from '../utils/localStateStorage'
import { normalizeWorkspaceState } from '../utils/workspaceNormalize'
import { DIARY_REMINDER_TEMPLATES } from '../content/businessHub'
import { filterRemindersForScope, getDiaryAttentionBuckets, templateToNextDate } from '../utils/businessHub'
import { getReferenceDate, getReferenceDateKey } from '../utils/referenceDate'
import { migrateDayNotes } from '../utils/dayNotes'

const STORAGE_KEY = 'trubalance-app-state-v4'
const MAX_UNDO = 30

function cloneState(state: AppState): AppState {
  return JSON.parse(JSON.stringify(state)) as AppState
}

function shouldConfirmRedoDueRemoval(current: AppState, next: AppState): boolean {
  for (const nextCommitment of next.commitments) {
    if (nextCommitment.schedule !== 'monthly') continue
    const currentCommitment = current.commitments.find((c) => c.id === nextCommitment.id)
    if (!currentCommitment || currentCommitment.schedule !== 'monthly') continue
    const currentDueDay = currentCommitment.dueDayOfMonth ?? 28
    const nextDueDay = nextCommitment.dueDayOfMonth ?? 28
    if (currentDueDay === nextDueDay) continue

    const before = getCommitmentDueOccurrences(currentCommitment)
    const after = getCommitmentDueOccurrences(nextCommitment)
    const removed = before.filter((occurrence) => !after.some((entry) => entry.period === occurrence.period))
    if (removed.length === 0) continue

    const months = removed.map((entry) => entry.month).join(', ')
    const entryLabel = removed.length === 1 ? 'entry' : 'entries'
    return window.confirm(
      `Redo will remove ${removed.length} due ${entryLabel} from Due (${months}). Continue?`,
    )
  }
  return true
}

function migrateBill(raw: Record<string, unknown>): ReserveBill {
  const bill = raw as unknown as ReserveBill & {
    category?: string
    amount?: number
    monthsDue?: string[]
    monthAmounts?: Record<string, number>
  }

  let monthAmounts = bill.monthAmounts ?? {}
  if (Object.keys(monthAmounts).length === 0 && Array.isArray(bill.monthsDue) && bill.amount != null) {
    monthAmounts = Object.fromEntries(bill.monthsDue.map((month) => [month, bill.amount!]))
  }

  const normalizedAmounts = Object.fromEntries(
    Object.entries(monthAmounts).map(([month, amount]) => [month, toAmount(amount)]),
  )

  const monthDueDays = bill.monthDueDays ?? {}
  const normalizedDueDays = Object.fromEntries(
    Object.keys(normalizedAmounts).map((month) => [month, monthDueDays[month] ?? DEFAULT_RESERVE_BILL_DUE_DAY]),
  )

  const duePeriodAmountOverrides =
    bill.duePeriodAmountOverrides && typeof bill.duePeriodAmountOverrides === 'object'
      ? Object.fromEntries(
          Object.entries(bill.duePeriodAmountOverrides).map(([period, amount]) => [
            period,
            toAmount(amount),
          ]),
        )
      : undefined

  return {
    id: bill.id,
    plannerId: bill.plannerId,
    name: bill.name || bill.category || 'Other',
    monthAmounts: normalizedAmounts,
    monthDueDays: normalizedDueDays,
    duePeriodAmountOverrides,
    venueId: bill.venueId,
    notes: bill.notes,
    lastPaidPeriod: bill.lastPaidPeriod,
    dismissedDuePeriods: bill.dismissedDuePeriods,
  }
}

function migrateReservePlanner(raw: Record<string, unknown>): ReservePlanner {
  if (Array.isArray(raw.bills)) {
    const planner = raw as unknown as ReservePlanner
    return {
      ...planner,
      bills: planner.bills.map((b) => migrateBill(b as unknown as Record<string, unknown>)),
    }
  }
  const legacy = raw as {
    id: string
    name: string
    businessId: string
    targetThisMonth?: number
    actualThisMonth?: number
    monthlyProjections?: Record<string, number>
  }
  return {
    id: legacy.id,
    name: legacy.name,
    businessId: legacy.businessId,
    bufferAmount: 0,
    actualBalance: legacy.actualThisMonth ?? 0,
    bills: [],
  }
}

function ensureArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? value : fallback
}

function migrateState(parsed: Record<string, unknown>): AppState {
  const { trend: _trend, ...rest } = parsed
  const base = { ...initialState, ...rest } as AppState
  base.groups = ensureArray(base.groups, initialState.groups)
  base.businesses = ensureArray(base.businesses, initialState.businesses)
  base.venues = ensureArray(base.venues, initialState.venues)
  base.accounts = ensureArray(base.accounts, initialState.accounts)
  base.commitments = ensureArray(base.commitments, initialState.commitments)
  base.expectedReceipts = ensureArray(base.expectedReceipts, initialState.expectedReceipts)
  base.reservePlanners = ensureArray(base.reservePlanners, initialState.reservePlanners)
  base.historyRecords = ensureArray(base.historyRecords, [])
  base.dayNotes = migrateDayNotes(ensureArray(base.dayNotes, []), base.groups[0]?.id)
  base.businessReferenceProfiles = ensureArray(base.businessReferenceProfiles, [])
  base.diaryReminders = ensureArray(base.diaryReminders, [])
  base.snapshots = ensureArray(base.snapshots, []).map((snap: BalanceSnapshot) => ({
    ...snap,
    changedAccounts: (snap.changedAccounts ?? []).map((c) => ({
      ...c,
      venueId: c.venueId ?? '',
      venueName: c.venueName ?? 'Unknown venue',
    })),
  }))
  if (Array.isArray(base.reservePlanners)) {
    base.reservePlanners = base.reservePlanners.map((p) =>
      migrateReservePlanner(p as unknown as Record<string, unknown>),
    )
  }
  if (Array.isArray(base.accounts)) {
    base.accounts = base.accounts.map((a) => ({ ...a, balance: roundCurrency(toAmount(a.balance)) }))
  }
  if (Array.isArray(base.commitments)) {
    base.commitments = base.commitments.map((c) =>
      migrateCommitment(c as unknown as Record<string, unknown>),
    )
  }
  const migratedAt = new Date().toISOString()
  const repaired = repairEmptySnapshotChangedAccounts(base)
  const withBackfill = backfillScopeSnapshots(repaired, migratedAt)
  const withSnapshots = refreshAllSnapshotMetrics(withBackfill, migratedAt)
  if (base.workspaceOrigin === undefined) {
    if (!statesMatchRoughly(withSnapshots, initialState)) {
      withSnapshots.workspaceOrigin = 'user'
    }
  }
  return applySortOrders(withSnapshots)
}

function applySortOrders(state: AppState): AppState {
  let commitments = state.commitments
  for (const schedule of ['monthly', 'planned'] as const) {
    const group = commitments.filter((c) => c.schedule === schedule)
    commitments = commitments.map((c) => {
      if (c.schedule !== schedule || c.sortOrder !== undefined) return c
      const index = group.findIndex((g) => g.id === c.id)
      return index >= 0 ? { ...c, sortOrder: index } : c
    })
  }

  const expectedReceipts = state.expectedReceipts.map((receipt, index) =>
    receipt.sortOrder !== undefined ? receipt : { ...receipt, sortOrder: index },
  )

  const reservePlanners = state.reservePlanners.map((planner) => ({
    ...planner,
    bills: planner.bills.map((bill, index) =>
      bill.sortOrder !== undefined ? bill : { ...bill, sortOrder: index },
    ),
  }))

  return { ...state, commitments, expectedReceipts, reservePlanners }
}

function applyOrderedSort<T extends { id: string; sortOrder?: number }>(
  items: T[],
  orderedIds: string[],
): T[] {
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]))
  return items.map((item) =>
    orderMap.has(item.id) ? { ...item, sortOrder: orderMap.get(item.id)! } : item,
  )
}

export function readBrowserAppState(): AppState | null {
  try {
    const raw = readRawBrowserStateJson()
    if (!raw) return null
    return migrateState(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    return null
  }
}

function loadState(): AppState {
  return normalizeWorkspaceState(readBrowserAppState() ?? initialState)
}

function resolveInitialAppState(options?: UseAppStateOptions): AppState {
  if (options?.remotePersist) {
    const local = readBrowserAppState()
    if (local && isUserOwnedWorkspace(local)) {
      return normalizeWorkspaceState(cloneState(local))
    }
    if (options.externalState) {
      return normalizeWorkspaceState(cloneState(options.externalState))
    }
    return loadState()
  }
  if (options?.externalState) {
    return normalizeWorkspaceState(cloneState(options.externalState))
  }
  return loadState()
}

export interface BalanceSaveChange {
  accountId: string
  balance: number
}

export interface BalanceSaveResult {
  updated: number
  snapshotted: boolean
}

export interface UseAppStateOptions {
  /** When set, replaces localStorage as the data source after load. */
  externalState?: AppState | null
  /** Bumped when remote workspace is replaced (import / restore). */
  externalStateVersion?: number | string
  /** Workspace id — resets remote hydration when the signed-in workspace changes. */
  workspaceId?: string | null
  externalLoading?: boolean
  /** Called after each state change (e.g. sync to Supabase). */
  onStateChange?: (state: AppState, options?: { immediate?: boolean }) => void
  /** When true, skip localStorage writes (cloud-backed session). */
  remotePersist?: boolean
  /** When true, never write demo/session data to localStorage. */
  skipLocalPersist?: boolean
  /** Initial scope when hydrating external state (e.g. interactive demo). */
  defaultViewScope?: ViewScope
  readOnly?: boolean
}

export function useAppState(options?: UseAppStateOptions) {
  const [state, setState] = useState<AppState>(() => resolveInitialAppState(options))
  const [viewScope, setViewScope] = useState<ViewScope>(() => {
    const initial = resolveInitialAppState(options)
    return resolveDefaultViewScope(initial, options?.defaultViewScope ?? defaultViewScope)
  })
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const undoStackRef = useRef<AppState[]>([])
  const redoStackRef = useRef<AppState[]>([])
  const skipPersistRef = useRef(true)
  const remoteHydratedRef = useRef(!options?.remotePersist)
  const externalStateRef = useRef(options?.externalState)
  externalStateRef.current = options?.externalState
  const lastHydrateKeyRef = useRef<string | null>(null)
  const prevWorkspaceIdRef = useRef<string | null | undefined>(undefined)
  const persistImmediateRef = useRef(false)

  useEffect(() => {
    if (!options?.remotePersist) {
      remoteHydratedRef.current = true
      return
    }
    const workspaceId = options?.workspaceId ?? null
    if (prevWorkspaceIdRef.current === workspaceId) return
    prevWorkspaceIdRef.current = workspaceId
    remoteHydratedRef.current = false
    lastHydrateKeyRef.current = null
  }, [options?.remotePersist, options?.workspaceId])

  useEffect(() => {
    if (options?.externalLoading) return
    const external = externalStateRef.current
    if (!external) return

    const version = options?.externalStateVersion ?? 0
    const hydrateKey = `${options?.workspaceId ?? 'local'}:${version}`
    if (lastHydrateKeyRef.current === hydrateKey) return
    lastHydrateKeyRef.current = hydrateKey

    // Initial app load uses resolveInitialAppState (localStorage when present). Only
    // replace in-memory state when the cloud workspace is explicitly replaced (restore/import).
    const isExplicitRemoteReplace =
      version !== 0 && version !== '0' || Boolean(options?.defaultViewScope)
    if (!isExplicitRemoteReplace) {
      remoteHydratedRef.current = true
      skipPersistRef.current = true
      return
    }

    const next = normalizeWorkspaceState(cloneState(external))
    setState(next)
    undoStackRef.current = []
    setCanUndo(false)
    redoStackRef.current = []
    setCanRedo(false)
    if (options?.defaultViewScope) {
      setViewScope(resolveDefaultViewScope(next, options.defaultViewScope))
    } else {
      setViewScope(resolveDefaultViewScope(next))
    }
    skipPersistRef.current = true
    remoteHydratedRef.current = true
  }, [options?.externalStateVersion, options?.workspaceId, options?.externalLoading, options?.defaultViewScope])

  useEffect(() => {
    let next = viewScope

    if (!isViewScopeValid(state, viewScope)) {
      next = resolveDefaultViewScope(state, options?.defaultViewScope)
    } else if (viewScope.type === 'group') {
      const groupExists = state.groups.some((group) => group.id === viewScope.id)
      if (!groupExists && state.businesses.length > 0) {
        next = { type: 'business', id: state.businesses[0]!.id }
      } else if (groupExists) {
        const inGroup = state.businesses.filter((business) => business.groupId === viewScope.id)
        if (inGroup.length === 1) {
          next = { type: 'business', id: inGroup[0]!.id }
        }
      }
    }

    if (isViewScopeValid(state, next) && !scopesMatch(next, viewScope)) {
      setViewScope(next)
    }
  }, [state, viewScope, options?.defaultViewScope])

  useEffect(() => {
    if (options?.skipLocalPersist) {
      options.onStateChange?.(state)
      return
    }
    if (skipPersistRef.current) {
      skipPersistRef.current = false
      return
    }
    if (options?.remotePersist && !remoteHydratedRef.current) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    if (options?.remotePersist) {
      const immediate = persistImmediateRef.current
      persistImmediateRef.current = false
      options.onStateChange?.(state, { immediate })
    }
  }, [state, options?.remotePersist, options?.onStateChange, options?.skipLocalPersist])

  const pushUndo = useCallback((snapshot: AppState) => {
    undoStackRef.current = [...undoStackRef.current.slice(-(MAX_UNDO - 1)), cloneState(snapshot)]
    setCanUndo(true)
  }, [])

  const update = useCallback(
    (fn: (prev: AppState) => AppState) => {
      if (options?.readOnly) return
      setState((prev) => {
        const next = fn(prev)
        if (next === prev) return prev
        pushUndo(prev)
        redoStackRef.current = []
        setCanRedo(false)
        return next
      })
    },
    [pushUndo, options?.readOnly],
  )

  const undo = useCallback(() => {
    const stack = undoStackRef.current
    if (stack.length === 0) return
    redoStackRef.current = [...redoStackRef.current.slice(-(MAX_UNDO - 1)), cloneState(state)]
    setCanRedo(true)
    const previous = stack[stack.length - 1]
    undoStackRef.current = stack.slice(0, -1)
    setCanUndo(undoStackRef.current.length > 0)
    setState(cloneState(previous))
  }, [state])

  const redo = useCallback(() => {
    const stack = redoStackRef.current
    if (stack.length === 0) return
    const next = stack[stack.length - 1]
    if (!shouldConfirmRedoDueRemoval(state, next)) return
    undoStackRef.current = [...undoStackRef.current.slice(-(MAX_UNDO - 1)), cloneState(state)]
    setCanUndo(true)
    redoStackRef.current = stack.slice(0, -1)
    setCanRedo(redoStackRef.current.length > 0)
    setState(cloneState(next))
  }, [state])

  // Groups
  const addGroup = (name: string) => {
    let targetGroupId = ''
    update((s) => {
      const groupId = s.groups.length === 0 ? newId() : s.groups[0]!.id
      targetGroupId = groupId
      const groups =
        s.groups.length === 0 ? [{ id: groupId, name }] : s.groups
      const businesses = s.businesses.map((business) => ({ ...business, groupId }))
      return { ...s, groups, businesses }
    })
    if (targetGroupId) {
      setViewScope({ type: 'group', id: targetGroupId })
    }
  }

  const renameGroup = (id: string, name: string) =>
    update((s) => ({ ...s, groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)) }))

  const setGroupAccentColor = (id: string, accentColor: string | null) =>
    update((s) => ({
      ...s,
      groups: s.groups.map((g) =>
        g.id === id ? { ...g, accentColor: accentColor ?? undefined } : g,
      ),
    }))

  const deleteGroup = (id: string) =>
    update((s) => {
      const businessIds = s.businesses.filter((b) => b.groupId === id).map((b) => b.id)
      const venueIds = s.venues.filter((v) => businessIds.includes(v.businessId)).map((v) => v.id)
      return {
        ...s,
        groups: s.groups.filter((g) => g.id !== id),
        businesses: s.businesses.filter((b) => b.groupId !== id),
        venues: s.venues.filter((v) => !businessIds.includes(v.businessId)),
        accounts: s.accounts.filter(
          (a) =>
            !(a.venueId && venueIds.includes(a.venueId)) &&
            !(a.businessId && businessIds.includes(a.businessId)),
        ),
        commitments: s.commitments.filter((c) => !(c.scopeLevel === 'group' && c.scopeId === id)),
        expectedReceipts: s.expectedReceipts.filter((r) => !(r.scopeLevel === 'group' && r.scopeId === id)),
        reservePlanners: s.reservePlanners.filter((p) => !businessIds.includes(p.businessId)),
      }
    })

  const dissolveGroup = (id: string) =>
    update((s) => ({
      ...s,
      groups: s.groups.filter((g) => g.id !== id),
      businesses: s.businesses.map((business) =>
        business.groupId === id ? { ...business, groupId: `ungrouped-${business.id}` } : business,
      ),
    }))

  // Businesses
  const addBusiness = (groupId: string | undefined, name: string, createDefaultAccount = false) =>
    update((s) => {
      const resolvedGroupId = groupId ?? s.groups[0]?.id ?? newId()
      let groups = s.groups
      if (!groups.some((g) => g.id === resolvedGroupId)) {
        groups = [...groups, { id: resolvedGroupId, name: 'Group' }]
      }
      const businessId = newId()
      const businesses = [...s.businesses, { id: businessId, groupId: resolvedGroupId, name }]
      if (!createDefaultAccount) return { ...s, groups, businesses }
      const accounts = [
        ...s.accounts,
        {
          id: newId(),
          businessId,
          name: 'Current account',
          type: 'current' as const,
          balance: 0,
          active: true,
          updatedAt: new Date().toISOString(),
        },
      ]
      return { ...s, groups, businesses, accounts }
    })

  const renameBusiness = (id: string, name: string) =>
    update((s) => ({ ...s, businesses: s.businesses.map((b) => (b.id === id ? { ...b, name } : b)) }))

  const setBusinessAccentColor = (id: string, accentColor: string | null) =>
    update((s) => ({
      ...s,
      businesses: s.businesses.map((b) =>
        b.id === id ? { ...b, accentColor: accentColor ?? undefined } : b,
      ),
    }))

  const setBusinessIncomePattern = (id: string, incomePattern: IncomePattern) =>
    update((s) => ({
      ...s,
      businesses: s.businesses.map((b) => (b.id === id ? { ...b, incomePattern } : b)),
    }))

  const setBusinessForecastDailyIncome = (id: string, forecastDailyIncome: number | null) =>
    update((s) => ({
      ...s,
      businesses: s.businesses.map((b) =>
        b.id === id
          ? {
              ...b,
              forecastDailyIncome:
                forecastDailyIncome != null && forecastDailyIncome !== 0
                  ? forecastDailyIncome
                  : undefined,
            }
          : b,
      ),
    }))

  const setVenueAccentColor = (id: string, accentColor: string | null) =>
    update((s) => ({
      ...s,
      venues: s.venues.map((v) =>
        v.id === id ? { ...v, accentColor: accentColor ?? undefined } : v,
      ),
    }))

  const deleteBusiness = (id: string) => {
    const venueIds = state.venues.filter((v) => v.businessId === id).map((v) => v.id)
    update((s) => ({
      ...s,
      businesses: s.businesses.filter((b) => b.id !== id),
      venues: s.venues.filter((v) => v.businessId !== id),
      accounts: s.accounts.filter(
        (a) => !(a.venueId && venueIds.includes(a.venueId)) && a.businessId !== id,
      ),
      commitments: s.commitments.filter((c) => !(c.scopeLevel === 'business' && c.scopeId === id)),
      expectedReceipts: s.expectedReceipts.filter((r) => !(r.scopeLevel === 'business' && r.scopeId === id)),
      reservePlanners: s.reservePlanners.filter((p) => p.businessId !== id),
    }))
  }

  // Venues
  const addVenue = (businessId: string, name: string) =>
    update((s) => ({ ...s, venues: [...s.venues, { id: newId(), businessId, name }] }))

  const renameVenue = (id: string, name: string) =>
    update((s) => ({ ...s, venues: s.venues.map((v) => (v.id === id ? { ...v, name } : v)) }))

  const deleteVenue = (id: string) =>
    update((s) => ({
      ...s,
      venues: s.venues.filter((v) => v.id !== id),
      accounts: s.accounts.filter((a) => a.venueId !== id),
      commitments: s.commitments.filter((c) => !(c.scopeLevel === 'venue' && c.scopeId === id)),
      expectedReceipts: s.expectedReceipts.filter((r) => !(r.scopeLevel === 'venue' && r.scopeId === id)),
    }))

  // Accounts
  const addAccount = (venueId: string, name: string, type: AccountType) =>
    update((s) => ({
      ...s,
      accounts: [
        ...s.accounts,
        { id: newId(), venueId, name, type, balance: 0, active: true, updatedAt: new Date().toISOString() },
      ],
    }))

  const addBusinessAccount = (businessId: string, name: string, type: AccountType) =>
    update((s) => ({
      ...s,
      accounts: [
        ...s.accounts,
        {
          id: newId(),
          businessId,
          name,
          type,
          balance: 0,
          active: true,
          updatedAt: new Date().toISOString(),
        },
      ],
    }))

  const addBusinessSavingsAccount = (businessId: string, name: string) =>
    addBusinessAccount(businessId, name, 'savings')

  const renameAccount = (id: string, name: string) =>
    update((s) => ({ ...s, accounts: s.accounts.map((a) => (a.id === id ? { ...a, name } : a)) }))

  const setAccountType = (id: string, type: AccountType) =>
    update((s) => ({ ...s, accounts: s.accounts.map((a) => (a.id === id ? { ...a, type } : a)) }))

  const deactivateAccount = (id: string) =>
    update((s) => ({ ...s, accounts: s.accounts.map((a) => (a.id === id ? { ...a, active: false } : a)) }))

  const updateAccountBalance = (id: string, balance: number) =>
    update((s) => ({
      ...s,
      accounts: s.accounts.map((a) =>
        a.id === id ? { ...a, balance: roundCurrency(balance), updatedAt: new Date().toISOString() } : a,
      ),
    }))

  const saveBalanceUpdate = (
    scope: ViewScope,
    viewName: string,
    changes: BalanceSaveChange[],
    note: string | undefined,
    plotOnGraph: boolean,
  ): BalanceSaveResult => {
    if (changes.length === 0) return { updated: 0, snapshotted: false }

    let result: BalanceSaveResult = { updated: 0, snapshotted: false }
    requestImmediatePersist()

    setState((s) => {
      const now = new Date().toISOString()
      const date = todayDateKey()
      const changedAccounts: SnapshotAccountChange[] = []

      let accounts = s.accounts
      for (const change of changes) {
        const account = accounts.find((a) => a.id === change.accountId)
        if (!account) continue

        changedAccounts.push(buildSnapshotAccountChange(s, account, roundCurrency(toAmount(change.balance))))
        accounts = accounts.map((a) =>
          a.id === change.accountId
            ? { ...a, balance: roundCurrency(toAmount(change.balance)), updatedAt: now }
            : a,
        )
      }

      if (changedAccounts.length === 0) return s

      pushUndo(s)

      let nextState = { ...s, accounts }
      const noteText = plotOnGraph && note?.trim() ? note.trim() : undefined
      nextState = applySnapshotRollup(nextState, changedAccounts, noteText, now, date)

      const historyRecord = captureHistoryRecord(nextState, scope, viewName, date, now, noteText)
      nextState = {
        ...nextState,
        historyRecords: upsertDailyHistoryRecord(nextState.historyRecords ?? [], historyRecord),
      }

      result = { updated: changedAccounts.length, snapshotted: true }
      return nextState
    })

    return result
  }

  // Commitments
  const addCommitment = (item: Omit<Commitment, 'id'>) =>
    update((s) => {
      if (!isCommitmentScopeAllowed(s, item.scopeLevel, item.scopeId)) return s
      return {
        ...s,
        commitments: [
          ...s.commitments,
          {
            ...item,
            id: newId(),
            createdAt: todayDateKey(),
            sortOrder: nextSortOrder(s.commitments.filter((c) => c.schedule === item.schedule)),
          },
        ],
      }
    })

  const updateCommitment = (id: string, patch: Partial<Commitment>) =>
    update((s) => {
      const existing = s.commitments.find((c) => c.id === id)
      if (!existing) return s

      const nextLevel = patch.scopeLevel ?? existing.scopeLevel
      const nextId = patch.scopeId ?? existing.scopeId
      if (
        (patch.scopeLevel !== undefined || patch.scopeId !== undefined) &&
        !isCommitmentScopeAllowed(s, nextLevel, nextId)
      ) {
        return s
      }

      let merged = { ...existing, ...patch }
      if (patch.amount !== undefined && patch.amount !== existing.amount) {
        merged = { ...merged, ...buildAmountChangePatch(existing, patch.amount) }
      } else if (patch.periodAmountOverrides !== undefined) {
        merged.amount = existing.amount
      }

      const nextState: AppState = {
        ...s,
        commitments: s.commitments.map((c) => (c.id === id ? merged : c)),
      }

      const now = new Date().toISOString()
      const periodOverrideFrom =
        getCommitmentRebuildFromPeriodOverridePatch(existing, patch) ?? null
      const fromDate =
        patch.amount !== undefined && patch.amount !== existing.amount
          ? getCommitmentRebuildFromDateKey(merged, getReferenceDate())
          : periodOverrideFrom ?? todayDateKey()

      return refreshSnapshotsForScopes(
        nextState,
        getScopesForCommitment(nextState, merged),
        fromDate,
        now,
      )
    })

  const updateCommitmentDuePeriodAmount = (
    id: string,
    primaryPeriod: string,
    amount: number,
    occurrences: ReturnType<typeof getCommitmentDueOccurrences>,
  ) =>
    update((s) => {
      const existing = s.commitments.find((c) => c.id === id)
      if (!existing || existing.schedule !== 'monthly') return s

      const merged = mergeCommitmentDuePeriodOverride(existing, primaryPeriod, amount, occurrences)
      const nextState: AppState = {
        ...s,
        commitments: s.commitments.map((c) => (c.id === id ? merged : c)),
      }

      const fromDate =
        getCommitmentRebuildFromPeriodOverridePatch(existing, merged) ??
        getCommitmentRebuildFromDateKey(merged, getReferenceDate())

      return refreshSnapshotsForScopes(
        nextState,
        getScopesForCommitment(nextState, merged),
        fromDate,
        new Date().toISOString(),
      )
    })

  const requestImmediatePersist = () => {
    persistImmediateRef.current = true
  }

  const markCommitmentPaid = (id: string, paidAmount?: number) => {
    requestImmediatePersist()
    update((s) => {
      const commitment = s.commitments.find((c) => c.id === id)
      if (!commitment) return s
      const referenceDate = getReferenceDate()
      const occurrences = getCommitmentDueOccurrences(commitment, referenceDate)
      const expectedTotal = getCommitmentPayoffExpectedTotal(commitment, referenceDate)
      const resolvedPaid =
        paidAmount != null ? roundCurrency(toAmount(paidAmount)) : roundCurrency(expectedTotal)
      const amountCorrected = resolvedPaid !== roundCurrency(expectedTotal)

      const paidPatch = buildMarkPaidPatch(
        commitment,
        occurrences,
        { paidAmount: amountCorrected ? resolvedPaid : undefined },
        referenceDate,
      )
      let merged: Commitment = { ...commitment, ...paidPatch }

      if (amountCorrected) {
        if (occurrences.length === 0) {
          const period =
            getActiveAccrualPeriod(commitment, referenceDate) ?? getReferenceDateKey().slice(0, 7)
          merged = {
            ...merged,
            amount: commitment.amount,
            periodAmountOverrides: {
              ...(merged.periodAmountOverrides ?? commitment.periodAmountOverrides),
              [period]: resolvedPaid,
            },
          }
        } else {
          const primaryPeriod = occurrences[0]!.period
          merged = mergeCommitmentDuePeriodOverride(
            { ...merged, amount: commitment.amount },
            primaryPeriod,
            resolvedPaid,
            occurrences,
          )
        }
      }

      const fromDate = amountCorrected
        ? getCommitmentRebuildFromPeriodOverridePatch(commitment, merged) ??
          getCommitmentHistoricCorrectionFromDateKey(merged)
        : todayDateKey()

      const nextState: AppState = {
        ...s,
        commitments: s.commitments.map((c) => (c.id === id ? merged : c)),
      }
      return refreshSnapshotsForScopes(
        nextState,
        getScopesForCommitment(nextState, merged),
        fromDate,
        new Date().toISOString(),
      )
    })
  }

  const dismissCommitmentDue = (id: string) => {
    requestImmediatePersist()
    update((s) => {
      const commitment = s.commitments.find((c) => c.id === id)
      if (!commitment) return s
      const periods =
        commitment.schedule === 'planned'
          ? [commitment.plannedDueDate?.slice(0, 7) ?? currentPeriod()]
          : (() => {
              const occurrences = getCommitmentDueOccurrences(commitment)
              return occurrences.length > 0
                ? occurrences.map((entry) => entry.period)
                : [currentPeriod()]
            })()
      return {
        ...s,
        commitments: s.commitments.map((c) => {
          if (c.id !== id) return c
          const dismissed = new Set(c.dismissedDuePeriods ?? [])
          for (const period of periods) dismissed.add(period)
          return { ...c, dismissedDuePeriods: [...dismissed] }
        }),
      }
    })
  }

  const acknowledgeCommitmentDueAlert = (id: string, period?: string) =>
    update((s) => {
      const commitment = s.commitments.find((c) => c.id === id)
      if (!commitment) return s
      const periods =
        period != null
          ? [period]
          : commitment.schedule === 'planned'
            ? [commitment.plannedDueDate?.slice(0, 7) ?? currentPeriod()]
            : (() => {
                const occurrences = getCommitmentDueOccurrences(commitment)
                return occurrences.length > 0
                  ? occurrences.map((entry) => entry.period)
                  : [currentPeriod()]
              })()
      return {
        ...s,
        commitments: s.commitments.map((c) => {
          if (c.id !== id) return c
          const acknowledged = new Set(c.acknowledgedDuePeriods ?? [])
          for (const p of periods) acknowledged.add(p)
          return { ...c, acknowledgedDuePeriods: [...acknowledged] }
        }),
      }
    })

  const deleteCommitment = (id: string) => {
    requestImmediatePersist()
    update((s) => {
      const existing = s.commitments.find((c) => c.id === id)
      if (!existing) return s
      const nextState: AppState = {
        ...s,
        commitments: s.commitments.filter((c) => c.id !== id),
      }
      const fromDate = getCommitmentRebuildFromDateKey(existing, getReferenceDate())
      return refreshSnapshotsForScopes(
        nextState,
        getScopesForCommitment(nextState, existing),
        fromDate,
        new Date().toISOString(),
      )
    })
  }

  const duplicateCommitment = (id: string) =>
    update((s) => {
      const source = s.commitments.find((c) => c.id === id)
      if (!source) return s
      const siblings = s.commitments.filter((c) => c.schedule === source.schedule)
      const {
        lastPaidPeriod: _lastPaid,
        paidPeriodAmounts: _paidAmounts,
        dismissedDuePeriods: _dismissed,
        acknowledgedDuePeriods: _acknowledged,
        periodAmountOverrides: _overrides,
        paid: _legacyPaid,
        ...sourceBase
      } = source as Commitment & { paid?: boolean }
      const copy: Commitment = {
        ...sourceBase,
        id: newId(),
        name: source.name,
        createdAt: todayDateKey(),
        status: 'healthy',
        lastPaidPeriod: undefined,
        dismissedDuePeriods: [],
        acknowledgedDuePeriods: [],
        paidPeriodAmounts: undefined,
        periodAmountOverrides: undefined,
      }
      const ordered = sortByOrder(siblings, (c) => c.sortOrder)
      const sourceIndex = ordered.findIndex((c) => c.id === id)
      const orderedIds = ordered.map((c) => c.id)
      orderedIds.splice(sourceIndex + 1, 0, copy.id)
      return {
        ...s,
        commitments: applyOrderedSort([...s.commitments, copy], orderedIds),
      }
    })

  // Expected receipts
  const addReceipt = (item: Omit<ExpectedReceipt, 'id' | 'received'>) =>
    update((s) => {
      if (!isValidScopeReference(s, item.scopeLevel, item.scopeId)) return s
      return {
        ...s,
        expectedReceipts: [
          ...s.expectedReceipts,
          {
            ...item,
            id: newId(),
            received: false,
            createdAt: todayDateKey(),
            sortOrder: nextSortOrder(s.expectedReceipts),
          },
        ],
      }
    })

  const updateReceipt = (id: string, patch: Partial<ExpectedReceipt>) =>
    update((s) => {
      const existing = s.expectedReceipts.find((r) => r.id === id)
      if (!existing) return s
      const nextLevel = patch.scopeLevel ?? existing.scopeLevel
      const nextId = patch.scopeId ?? existing.scopeId
      if (
        (patch.scopeLevel !== undefined || patch.scopeId !== undefined) &&
        !isValidScopeReference(s, nextLevel, nextId)
      ) {
        return s
      }
      const merged = { ...existing, ...patch }
      const nextState: AppState = {
        ...s,
        expectedReceipts: s.expectedReceipts.map((r) => (r.id === id ? merged : r)),
      }

      const affectsHistory =
        patch.amount !== undefined ||
        patch.receiptTiming !== undefined ||
        patch.expectedDate !== undefined ||
        patch.accrualStartDate !== undefined ||
        patch.periodAmountOverrides !== undefined

      if (!affectsHistory) return nextState

      return refreshSnapshotsForScopes(
        nextState,
        getScopesForReceipt(nextState, merged),
        getReceiptRebuildFromDateKey(existing, patch),
        new Date().toISOString(),
      )
    })

  const markReceiptReceived = (id: string) =>
    update((s) => {
      const existing = s.expectedReceipts.find((r) => r.id === id)
      if (!existing) return s
      const receivedDate = todayDateKey()
      const nextState: AppState = {
        ...s,
        expectedReceipts: s.expectedReceipts.map((r) =>
          r.id === id ? { ...r, received: true, receivedDate } : r,
        ),
      }
      return refreshSnapshotsForScopes(
        nextState,
        getScopesForReceipt(nextState, existing),
        getReceiptActiveFromDateKey(existing),
        new Date().toISOString(),
      )
    })

  const deleteReceipt = (id: string) =>
    update((s) => {
      const existing = s.expectedReceipts.find((r) => r.id === id)
      if (!existing) return s
      const nextState: AppState = {
        ...s,
        expectedReceipts: s.expectedReceipts.filter((r) => r.id !== id),
      }
      return refreshSnapshotsForScopes(
        nextState,
        getScopesForReceipt(nextState, existing),
        getReceiptDeleteFromDateKey(existing),
        new Date().toISOString(),
      )
    })

  const duplicateReceipt = (id: string) =>
    update((s) => {
      const source = s.expectedReceipts.find((r) => r.id === id)
      if (!source) return s
      const copy: ExpectedReceipt = {
        ...source,
        id: newId(),
        received: false,
        receivedDate: undefined,
        createdAt: todayDateKey(),
        sortOrder: nextSortOrder(s.expectedReceipts),
      }
      return { ...s, expectedReceipts: [...s.expectedReceipts, copy] }
    })

  // Reserve planner
  const updateReservePlanner = (id: string, patch: Partial<ReservePlanner>) =>
    update((s) => ({
      ...s,
      reservePlanners: s.reservePlanners.map((p) => {
        if (p.id !== id) return p
        const updated = { ...p, ...patch }
        if (patch.actualBalance !== undefined && updated.reserveAccountId) {
          return updated
        }
        return updated
      }),
      accounts:
        patch.actualBalance !== undefined
          ? s.accounts.map((a) => {
              const planner = s.reservePlanners.find((p) => p.id === id)
              if (planner?.reserveAccountId === a.id) {
                return { ...a, balance: patch.actualBalance!, updatedAt: new Date().toISOString() }
              }
              return a
            })
          : s.accounts,
    }))

  const deleteReservePlanner = (id: string) =>
    update((s) => ({
      ...s,
      reservePlanners: s.reservePlanners.filter((p) => p.id !== id),
    }))

  const addReservePlanner = (item: Omit<ReservePlanner, 'id' | 'bills'> & { bills?: ReserveBill[] }) => {
    const id = newId()
    update((s) => ({
      ...s,
      reservePlanners: [
        ...s.reservePlanners,
        { ...item, id, bills: item.bills ?? [] },
      ],
    }))
    return id
  }

  const addReserveBill = (bill: Omit<ReserveBill, 'id'>) =>
    update((s) => ({
      ...s,
      reservePlanners: s.reservePlanners.map((p) =>
        p.id === bill.plannerId
          ? {
              ...p,
              bills: [...p.bills, { ...bill, id: newId(), sortOrder: nextSortOrder(p.bills) }],
            }
          : p,
      ),
    }))

  const updateReserveBill = (plannerId: string, billId: string, patch: Partial<ReserveBill>) =>
    update((s) => {
      const planner = s.reservePlanners.find((p) => p.id === plannerId)
      const existing = planner?.bills.find((b) => b.id === billId)
      if (!planner || !existing) return s

      const nextState: AppState = {
        ...s,
        reservePlanners: s.reservePlanners.map((p) =>
          p.id === plannerId
            ? {
                ...p,
                bills: p.bills.map((b) => (b.id === billId ? { ...b, ...patch } : b)),
              }
            : p,
        ),
      }

      const amountChanged =
        patch.monthAmounts !== undefined || patch.duePeriodAmountOverrides !== undefined
      if (!amountChanged) return nextState

      return refreshSnapshotsForScopes(
        nextState,
        getScopesForReservePlanner(nextState, planner),
        `${currentPeriod()}-01`,
        new Date().toISOString(),
      )
    })

  const deleteReserveBill = (plannerId: string, billId: string) =>
    update((s) => {
      const planner = s.reservePlanners.find((p) => p.id === plannerId)
      if (!planner) return s
      const nextState: AppState = {
        ...s,
        reservePlanners: s.reservePlanners.map((p) =>
          p.id === plannerId ? { ...p, bills: p.bills.filter((b) => b.id !== billId) } : p,
        ),
      }
      return refreshSnapshotsForScopes(
        nextState,
        getScopesForReservePlanner(nextState, planner),
        `${currentPeriod()}-01`,
        new Date().toISOString(),
      )
    })

  const duplicateReserveBill = (plannerId: string, billId: string) =>
    update((s) => ({
      ...s,
      reservePlanners: s.reservePlanners.map((p) => {
        if (p.id !== plannerId) return p
        const source = p.bills.find((b) => b.id === billId)
        if (!source) return p
        const copy: ReserveBill = {
          ...source,
          id: newId(),
          monthAmounts: { ...source.monthAmounts },
          monthDueDays: source.monthDueDays ? { ...source.monthDueDays } : undefined,
          duePeriodAmountOverrides: undefined,
          lastPaidPeriod: undefined,
          dismissedDuePeriods: [],
          acknowledgedDuePeriods: [],
          sortOrder: nextSortOrder(p.bills),
        }
        return { ...p, bills: [...p.bills, copy] }
      }),
    }))

  const copyReservePlannerBillsFrom = (
    targetPlannerId: string,
    sourcePlannerId: string,
    mode: 'replace' | 'append',
  ) =>
    update((s) => {
      if (targetPlannerId === sourcePlannerId) return s
      const source = s.reservePlanners.find((p) => p.id === sourcePlannerId)
      const target = s.reservePlanners.find((p) => p.id === targetPlannerId)
      if (!source || !target) return s

      const targetVenueIds = new Set(
        s.venues.filter((v) => v.businessId === target.businessId).map((v) => v.id),
      )

      const cloneBill = (bill: ReserveBill, sortOrder: number): ReserveBill => ({
        ...bill,
        id: newId(),
        plannerId: targetPlannerId,
        venueId: bill.venueId && targetVenueIds.has(bill.venueId) ? bill.venueId : undefined,
        monthAmounts: { ...bill.monthAmounts },
        monthDueDays: bill.monthDueDays ? { ...bill.monthDueDays } : undefined,
        lastPaidPeriod: undefined,
        dismissedDuePeriods: [],
        sortOrder,
      })

      const baseOrder = nextSortOrder(target.bills)
      const copied = source.bills.map((bill, index) =>
        cloneBill(bill, mode === 'replace' ? index : baseOrder + index),
      )
      const bills = mode === 'replace' ? copied : [...target.bills, ...copied]

      return {
        ...s,
        reservePlanners: s.reservePlanners.map((p) =>
          p.id === targetPlannerId ? { ...p, bills } : p,
        ),
      }
    })

  const reorderCommitments = (orderedIds: string[]) =>
    update((s) => ({ ...s, commitments: applyOrderedSort(s.commitments, orderedIds) }))

  const reorderReceipts = (orderedIds: string[]) =>
    update((s) => ({ ...s, expectedReceipts: applyOrderedSort(s.expectedReceipts, orderedIds) }))

  const reorderReserveBills = (plannerId: string, orderedIds: string[]) =>
    update((s) => ({
      ...s,
      reservePlanners: s.reservePlanners.map((p) =>
        p.id === plannerId ? { ...p, bills: applyOrderedSort(p.bills, orderedIds) } : p,
      ),
    }))

  const reorderDueRows = (
    items: Array<{ commitmentId?: string; reservePlannerId?: string; reserveBillId?: string }>,
  ) =>
    update((s) => {
      let commitments = s.commitments
      let reservePlanners = s.reservePlanners
      items.forEach((item, sortOrder) => {
        if (item.reservePlannerId && item.reserveBillId) {
          reservePlanners = reservePlanners.map((p) =>
            p.id === item.reservePlannerId
              ? {
                  ...p,
                  bills: p.bills.map((b) =>
                    b.id === item.reserveBillId ? { ...b, sortOrder } : b,
                  ),
                }
              : p,
          )
        } else if (item.commitmentId) {
          commitments = commitments.map((c) =>
            c.id === item.commitmentId ? { ...c, sortOrder } : c,
          )
        }
      })
      return { ...s, commitments, reservePlanners }
    })

  const markReserveBillPaid = (plannerId: string, billId: string) => {
    requestImmediatePersist()
    update((s) => {
      const planner = s.reservePlanners.find((p) => p.id === plannerId)
      const bill = planner?.bills.find((b) => b.id === billId)
      const occurrences = bill ? getUnpaidReserveBillDueOccurrences(bill) : []
      const latest = occurrences[occurrences.length - 1]?.period ?? currentPeriod()
      const periodsToClear = [
        ...occurrences.map((entry) => entry.period),
        occurrences[0]?.period,
      ].filter((period, index, list): period is string => Boolean(period) && list.indexOf(period) === index)
      if (!planner) return s

      const nextState: AppState = {
        ...s,
        reservePlanners: s.reservePlanners.map((p) =>
          p.id === plannerId
            ? {
                ...p,
                bills: p.bills.map((b) =>
                  b.id === billId
                    ? {
                        ...b,
                        lastPaidPeriod: latest,
                        ...clearReserveDueAmountOverridesForPeriods(b, periodsToClear),
                      }
                    : b,
                ),
              }
            : p,
        ),
      }

      return refreshSnapshotsForScopes(
        nextState,
        getScopesForReservePlanner(nextState, planner),
        todayDateKey(),
        new Date().toISOString(),
      )
    })
  }

  const dismissReserveBillDue = (plannerId: string, billId: string) => {
    requestImmediatePersist()
    update((s) => {
      const bill = s.reservePlanners
        .find((p) => p.id === plannerId)
        ?.bills.find((b) => b.id === billId)
      const occurrences = bill ? getUnpaidReserveBillDueOccurrences(bill) : []
      const periods = occurrences.length > 0 ? occurrences.map((entry) => entry.period) : [currentPeriod()]
      return {
        ...s,
        reservePlanners: s.reservePlanners.map((p) => {
          if (p.id !== plannerId) return p
          return {
            ...p,
            bills: p.bills.map((b) => {
              if (b.id !== billId) return b
              const dismissed = new Set(b.dismissedDuePeriods ?? [])
              for (const period of periods) dismissed.add(period)
              return { ...b, dismissedDuePeriods: [...dismissed] }
            }),
          }
        }),
      }
    })
  }

  const acknowledgeReserveBillDueAlert = (plannerId: string, billId: string, period?: string) =>
    update((s) => {
      const bill = s.reservePlanners.find((p) => p.id === plannerId)?.bills.find((b) => b.id === billId)
      const occurrences = bill ? getUnpaidReserveBillDueOccurrences(bill) : []
      const periods =
        period != null
          ? [period]
          : occurrences.length > 0
            ? occurrences.map((entry) => entry.period)
            : [currentPeriod()]
      return {
        ...s,
        reservePlanners: s.reservePlanners.map((p) => {
          if (p.id !== plannerId) return p
          return {
            ...p,
            bills: p.bills.map((b) => {
              if (b.id !== billId) return b
              const acknowledged = new Set(b.acknowledgedDuePeriods ?? [])
              for (const p of periods) acknowledged.add(p)
              return { ...b, acknowledgedDuePeriods: [...acknowledged] }
            }),
          }
        }),
      }
    })

  const acknowledgeDueAlertBucket = (bucket: 'overdue' | 'due-soon', scope: ViewScope) =>
    update((s) => {
      const commitments = getCommitmentsForScope(s, scope)
      const reserveRows = buildReserveAccruingRows(s, scope)
      const reserveDueRows = buildReserveDueRows(s, scope)
      const views = buildCommitmentViews(commitments, reserveRows, reserveDueRows)
      const urgent = countDueRowsNeedingAttention(views)
      const targets =
        bucket === 'overdue'
          ? urgent.filter((row) => {
              const status = getDerivedDueRowStatus(row)
              return status === 'critical' || status === 'risk'
            })
          : urgent.filter((row) => getDerivedDueRowStatus(row) === 'warning')

      let next = s
      for (const row of targets) {
        const period = row.dueReferencePeriod ?? row.period
        if (row.source === 'reserve' && row.reservePlannerId && row.reserveBillId) {
          const bill = next.reservePlanners
            .find((p) => p.id === row.reservePlannerId)
            ?.bills.find((b) => b.id === row.reserveBillId)
          if (!bill) continue
          const acknowledged = new Set(bill.acknowledgedDuePeriods ?? [])
          acknowledged.add(period)
          next = {
            ...next,
            reservePlanners: next.reservePlanners.map((p) =>
              p.id !== row.reservePlannerId
                ? p
                : {
                    ...p,
                    bills: p.bills.map((b) =>
                      b.id !== row.reserveBillId
                        ? b
                        : { ...b, acknowledgedDuePeriods: [...acknowledged] },
                    ),
                  },
            ),
          }
        } else {
          next = {
            ...next,
            commitments: next.commitments.map((c) => {
              if (c.id !== row.commitment.id) return c
              const acknowledged = new Set(c.acknowledgedDuePeriods ?? [])
              if (c.schedule === 'planned' && c.plannedDueDate) {
                acknowledged.add(c.plannedDueDate.slice(0, 7))
              } else {
                acknowledged.add(period)
              }
              return { ...c, acknowledgedDuePeriods: [...acknowledged] }
            }),
          }
        }
      }
      return next
    })

  const confirmReserveMonth = (
    plannerId: string,
    month: string,
    input: ReserveMonthConfirmInput,
  ) =>
    update((s) => {
      const currentMonth = MONTHS[currentMonthIndex()]
      if (month !== currentMonth) return s

      const planner = s.reservePlanners.find((p) => p.id === plannerId)
      return {
        ...s,
        reservePlanners: s.reservePlanners.map((p) =>
          p.id === plannerId
            ? {
                ...p,
                actualBalance: input.balance,
                monthConfirmations: {
                  ...(p.monthConfirmations ?? {}),
                  [month]: {
                    balance: input.balance,
                    confirmedAt: new Date().toISOString(),
                    operatingBalanceBefore: input.operatingBalanceBefore,
                    transferDone: input.transferDone,
                  },
                },
              }
            : p,
        ),
        accounts: planner?.reserveAccountId
          ? s.accounts.map((a) =>
              a.id === planner.reserveAccountId
                ? { ...a, balance: input.balance, updatedAt: new Date().toISOString() }
                : a,
            )
          : s.accounts,
      }
    })

  const resetToDemo = () => {
    backupBrowserStateToSession()
    undoStackRef.current = []
    setCanUndo(false)
    redoStackRef.current = []
    setCanRedo(false)
    const demo = { ...initialState, workspaceOrigin: 'builtin-demo' as const }
    setState(demo)
    setViewScope(defaultViewScope)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo))
    skipPersistRef.current = false
  }

  const randomiseFinancialFigures = () => {
    const jitter = (seed: number, spread = 0.35) => {
      const t = Math.sin(seed * 12.9898) * 43758.5453
      const r = t - Math.floor(t)
      return 0.65 + r * spread * 2
    }
    update((s) => ({
      ...s,
      accounts: s.accounts.map((account, i) => ({
        ...account,
        balance: roundCurrency(Math.max(500, toAmount(account.balance) * jitter(i + 1))),
        updatedAt: new Date().toISOString(),
      })),
      commitments: s.commitments.map((commitment, i) => ({
        ...commitment,
        amount: roundCurrency(Math.max(50, toAmount(commitment.amount) * jitter(i + 11, 0.45))),
      })),
      expectedReceipts: s.expectedReceipts.map((receipt, i) => ({
        ...receipt,
        amount: roundCurrency(Math.max(50, toAmount(receipt.amount) * jitter(i + 21, 0.5))),
      })),
      businessReferenceProfiles: s.businessReferenceProfiles ?? [],
      diaryReminders: s.diaryReminders ?? [],
    }))
  }

  const replaceEntireState = useCallback(
    (next: AppState) => {
      undoStackRef.current = []
      setCanUndo(false)
      redoStackRef.current = []
      setCanRedo(false)
      const withOrigin: AppState = { ...cloneState(next), workspaceOrigin: 'user' }
      setState(withOrigin)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withOrigin))
      const firstGroup = withOrigin.groups[0]
      if (firstGroup && withOrigin.businesses.length > 1) {
        setViewScope({ type: 'group', id: firstGroup.id })
      } else if (withOrigin.businesses[0]) {
        setViewScope({ type: 'business', id: withOrigin.businesses[0].id })
      }
      skipPersistRef.current = Boolean(options?.remotePersist)
    },
    [options?.remotePersist],
  )

  const upsertSnapshotForDate = (
    date: string,
    scope: ViewScope,
    overrides?: Partial<
      Pick<BalanceSnapshot, 'cash' | 'committedFunds' | 'expectedReceipts' | 'trueBalance' | 'note'>
    >,
  ) =>
    update((s) => {
      const metrics = calculateDashboard(s, scope)
      const viewName = getScopeLabel(s, scope)
      const existingIdx = s.snapshots.findIndex(
        (snap) => snap.date === date && snap.scopeType === scope.type && snap.scopeId === scope.id,
      )
      const existing = existingIdx >= 0 ? s.snapshots[existingIdx] : undefined
      const snapshot: BalanceSnapshot = {
        id: existing?.id ?? newId(),
        date,
        scopeType: scope.type,
        scopeId: scope.id,
        viewName,
        cash: overrides?.cash ?? metrics.cash,
        committedFunds: overrides?.committedFunds ?? metrics.committedFunds,
        expectedReceipts: overrides?.expectedReceipts ?? metrics.expectedReceipts,
        trueBalance: overrides?.trueBalance ?? metrics.trueBalance,
        note: overrides?.note ?? existing?.note,
        noteSource: overrides?.note ? 'admin' : existing?.noteSource,
        freshness: getFreshness(0),
        changedAccounts: existing?.changedAccounts ?? [],
        updatedAt: new Date().toISOString(),
      }
      if (existingIdx >= 0) {
        return { ...s, snapshots: s.snapshots.map((item, index) => (index === existingIdx ? snapshot : item)) }
      }
      return { ...s, snapshots: [...s.snapshots, snapshot] }
    })

  const correctSnapshotMetric = (snapshotId: string, metric: HistoryMetricKey, newValue: number) =>
    update((s) => {
      const target = s.snapshots.find((snap) => snap.id === snapshotId)
      if (!target) return s

      const oldValue = target[metric]
      const rounded = roundCurrency(newValue)
      if (rounded === oldValue) return s

      const now = new Date().toISOString()
      const delta = rounded - oldValue
      const pairedMetric =
        metric === 'trueBalance'
          ? 'committedFunds'
          : metric === 'committedFunds'
            ? 'trueBalance'
            : null

      let snapshots = s.snapshots.map((snap) => {
        if (snap.id !== snapshotId) return snap
        const corrected = applySnapshotMetricCorrection(snap, metric, rounded)
        if (!pairedMetric) return corrected
        return {
          ...corrected,
          [pairedMetric]: roundCurrency(snap[pairedMetric] - delta),
        }
      })

      snapshots = propagateSnapshotMetricDelta(snapshots, target, metric, delta, s, now)

      return { ...s, snapshots }
    })

  const deleteSnapshot = (id: string) =>
    update((s) => ({
      ...s,
      snapshots: s.snapshots.filter((snap) => snap.id !== id),
    }))

  const deleteSnapshots = (ids: string[]) => {
    const idSet = new Set(ids)
    if (idSet.size === 0) return
    update((s) => ({
      ...s,
      snapshots: s.snapshots.filter((snap) => !idSet.has(snap.id)),
    }))
  }

  const deleteSnapshotForDate = (date: string, scope: ViewScope) =>
    update((s) => ({
      ...s,
      snapshots: s.snapshots.filter(
        (snap) => !(snap.date === date && snap.scopeType === scope.type && snap.scopeId === scope.id),
      ),
    }))

  const deleteHistoryRecord = (id: string) =>
    update((s) => {
      const stored = (s.historyRecords ?? []).find((r) => r.id === id)
      let date: string
      let scope: ViewScope

      if (stored) {
        date = stored.date
        scope = stored.viewScope
      } else if (id.startsWith('derived:')) {
        const rest = id.slice('derived:'.length)
        date = rest.slice(-10)
        const scopeKeyStr = rest.slice(0, -11)
        const colon = scopeKeyStr.indexOf(':')
        if (colon < 0) return s
        scope = {
          type: scopeKeyStr.slice(0, colon) as ViewScope['type'],
          id: scopeKeyStr.slice(colon + 1),
        }
      } else {
        return s
      }

      const historyIds = new Set(getStoredHistoryRecordIdsForDay(s, date, scope))
      const snapshotIds = new Set(getSnapshotIdsForDayInViewScope(s, date, scope))

      return {
        ...s,
        historyRecords: (s.historyRecords ?? []).filter((r) => !historyIds.has(r.id)),
        snapshots: s.snapshots.filter((snap) => !snapshotIds.has(snap.id)),
        dayNotes: (s.dayNotes ?? []).filter(
          (note) =>
            !(
              note.date === date &&
              scopeInViewTree(s, { type: note.scopeLevel, id: note.scopeId }, scope)
            ),
        ),
      }
    })

  const deleteHistoryRecords = (ids: string[]) => {
    const idSet = new Set(ids)
    if (idSet.size === 0) return
    update((s) => {
      const targets = (s.historyRecords ?? []).filter((r) => idSet.has(r.id))
      if (targets.length === 0) return s

      const removeSnapshot = (snap: (typeof s.snapshots)[number]) =>
        !targets.some(
          (record) =>
            snap.date === record.date &&
            snap.scopeType === record.viewScope.type &&
            snap.scopeId === record.viewScope.id,
        )

      const removeNote = (note: (typeof s.dayNotes)[number]) =>
        !targets.some(
          (record) =>
            note.date === record.date &&
            note.scopeLevel === record.viewScope.type &&
            note.scopeId === record.viewScope.id,
        )

      return {
        ...s,
        historyRecords: (s.historyRecords ?? []).filter((r) => !idSet.has(r.id)),
        snapshots: s.snapshots.filter(removeSnapshot),
        dayNotes: (s.dayNotes ?? []).filter(removeNote),
      }
    })
  }

  const setDayNote = (date: string, text: string | null, scope: ViewScope) =>
    update((s) => {
      const trimmed = text?.trim() ?? ''
      const rest = (s.dayNotes ?? []).filter(
        (n) => !(n.date === date && n.scopeLevel === scope.type && n.scopeId === scope.id),
      )
      if (!trimmed) {
        return { ...s, dayNotes: rest }
      }
      const existing = (s.dayNotes ?? []).find(
        (n) => n.date === date && n.scopeLevel === scope.type && n.scopeId === scope.id,
      )
      const next = {
        id: existing?.id ?? newId(),
        date,
        text: trimmed,
        scopeLevel: scope.type,
        scopeId: scope.id,
        updatedAt: new Date().toISOString(),
      }
      return { ...s, dayNotes: [...rest, next].sort((a, b) => a.date.localeCompare(b.date)) }
    })

  function upsertReferenceProfile(
    profiles: BusinessReferenceProfile[],
    businessId: string,
  ): BusinessReferenceProfile[] {
    const existing = profiles.find((p) => p.businessId === businessId)
    if (existing) return profiles
    return [
      ...profiles,
      { businessId, fields: [], notes: '', updatedAt: new Date().toISOString() },
    ]
  }

  const upsertReferenceField = (
    businessId: string,
    field: Omit<CompanyReferenceField, 'id'> & { id?: string },
  ) =>
    update((s) => {
      const profiles = upsertReferenceProfile(s.businessReferenceProfiles ?? [], businessId)
      return {
        ...s,
        businessReferenceProfiles: profiles.map((profile) => {
          if (profile.businessId !== businessId) return profile
          const existing = field.id
            ? profile.fields.find((f) => f.id === field.id)
            : profile.fields.find((f) => f.presetId === field.presetId && f.label === field.label)
          const nextField: CompanyReferenceField = {
            id: existing?.id ?? field.id ?? newId(),
            presetId: field.presetId,
            label: field.label,
            value: field.value,
            sortOrder: existing?.sortOrder ?? profile.fields.length,
          }
          const rest = profile.fields.filter((f) => f.id !== nextField.id)
          return {
            ...profile,
            fields: [...rest, nextField].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
            updatedAt: new Date().toISOString(),
          }
        }),
      }
    })

  const removeReferenceField = (businessId: string, fieldId: string) =>
    update((s) => ({
      ...s,
      businessReferenceProfiles: (s.businessReferenceProfiles ?? []).map((profile) =>
        profile.businessId === businessId
          ? {
              ...profile,
              fields: profile.fields.filter((f) => f.id !== fieldId),
              updatedAt: new Date().toISOString(),
            }
          : profile,
      ),
    }))

  const setReferenceNotes = (businessId: string, notes: string) =>
    update((s) => {
      const profiles = upsertReferenceProfile(s.businessReferenceProfiles ?? [], businessId)
      return {
        ...s,
        businessReferenceProfiles: profiles.map((profile) =>
          profile.businessId === businessId
            ? { ...profile, notes, updatedAt: new Date().toISOString() }
            : profile,
        ),
      }
    })

  const addDiaryReminder = (
    item: Omit<DiaryReminder, 'id' | 'createdAt' | 'completed' | 'completedAt'>,
  ) => {
    const id = newId()
    update((s) => {
      const reminders = s.diaryReminders ?? []
      const next: DiaryReminder = {
        ...item,
        id,
        completed: false,
        createdAt: new Date().toISOString(),
        sortOrder: reminders.length,
      }
      return { ...s, diaryReminders: [...reminders, next] }
    })
    return id
  }

  const updateDiaryReminder = (id: string, patch: Partial<DiaryReminder>) =>
    update((s) => ({
      ...s,
      diaryReminders: (s.diaryReminders ?? []).map((reminder) =>
        reminder.id === id ? { ...reminder, ...patch, id: reminder.id } : reminder,
      ),
    }))

  const deleteDiaryReminder = (id: string) =>
    update((s) => ({
      ...s,
      diaryReminders: (s.diaryReminders ?? []).filter((r) => r.id !== id),
    }))

  const toggleDiaryReminderComplete = (id: string) =>
    update((s) => ({
      ...s,
      diaryReminders: (s.diaryReminders ?? []).map((reminder) => {
        if (reminder.id !== id) return reminder
        const completed = !reminder.completed
        return {
          ...reminder,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        }
      }),
    }))

  const dismissDiaryReminder = (
    id: string,
    action: { type: 'remove' } | { type: 'next-year' } | { type: 'reschedule'; date: string },
  ) =>
    update((s) => {
      const reminders = s.diaryReminders ?? []
      const reminder = reminders.find((r) => r.id === id)
      if (!reminder) return s
      if (action.type === 'remove') {
        return { ...s, diaryReminders: reminders.filter((r) => r.id !== id) }
      }
      const nextDate =
        action.type === 'next-year'
          ? (() => {
              const [y, m, d] = reminder.date.split('-').map(Number)
              const date = new Date(y!, m! - 1, d!)
              date.setFullYear(date.getFullYear() + 1)
              const yy = date.getFullYear()
              const mm = String(date.getMonth() + 1).padStart(2, '0')
              const dd = String(date.getDate()).padStart(2, '0')
              return `${yy}-${mm}-${dd}`
            })()
          : action.date
      return {
        ...s,
        diaryReminders: reminders.map((r) =>
          r.id === id
            ? { ...r, date: nextDate, completed: false, completedAt: undefined }
            : r,
        ),
      }
    })

  const clearPastDiaryReminders = (businessIds: string[], beforeDate: string) =>
    update((s) => ({
      ...s,
      diaryReminders: (s.diaryReminders ?? []).filter(
        (r) => !(businessIds.includes(r.businessId) && !r.completed && r.date < beforeDate),
      ),
    }))

  const dismissDiaryDueSoonAlerts = (scope: ViewScope) =>
    update((s) => {
      const reminders = filterRemindersForScope(s, scope)
      const { dueSoon } = getDiaryAttentionBuckets(reminders)
      const targetIds = new Set(dueSoon.map((r) => r.id))
      return {
        ...s,
        diaryReminders: (s.diaryReminders ?? []).map((reminder) => {
          if (!targetIds.has(reminder.id)) return reminder
          return { ...reminder, weekBeforeAlertDismissedFor: reminder.date }
        }),
      }
    })

  const addDiaryReminderFromTemplate = (businessId: string, templateId: string) => {
    const template = DIARY_REMINDER_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return null
    return addDiaryReminder({
      businessId,
      title: template.title,
      date: templateToNextDate(template),
      category: template.category,
      notes: template.notes,
      recurring: template.recurring,
      templateId: template.id,
    })
  }

  const setupMinimalWorkspace = (input: {
    businessName: string
    venueName?: string
    currentAccountName?: string
  }) => {
    const businessName = input.businessName.trim()
    if (!businessName) return
    update((s) => {
      if (s.businesses.length > 0) return s
      const groupId = newId()
      const businessId = newId()
      const groups = [...s.groups, { id: groupId, name: 'Group' }]
      const businesses = [...s.businesses, { id: businessId, groupId, name: businessName }]
      let venues = [...s.venues]
      let accounts = [...s.accounts]
      const venueLabel = input.venueName?.trim()
      if (venueLabel) {
        const venueId = newId()
        venues = [...venues, { id: venueId, businessId, name: venueLabel }]
        accounts = [
          ...accounts,
          {
            id: newId(),
            venueId,
            name: input.currentAccountName?.trim() || 'Current account',
            type: 'current' as const,
            balance: 0,
            active: true,
            updatedAt: new Date().toISOString(),
          },
        ]
      } else {
        accounts = [
          ...accounts,
          {
            id: newId(),
            businessId,
            name: input.currentAccountName?.trim() || 'Current account',
            type: 'current' as const,
            balance: 0,
            active: true,
            updatedAt: new Date().toISOString(),
          },
        ]
      }
      return { ...s, groups, businesses, venues, accounts }
    })
  }

  const setupGuidedWorkspace = (input: {
    groupName?: string
    businesses: Array<{
      name: string
      venues: Array<{
        name: string
        accounts: Array<{ name: string; type: AccountType }>
      }>
      businessAccounts?: Array<{ name: string; type: AccountType }>
    }>
  }) => {
    const businessPayloads = input.businesses
      .map((business) => ({ ...business, name: business.name.trim() }))
      .filter((business) => business.name)
    if (businessPayloads.length === 0) return

    update((s) => {
      if (s.businesses.length > 0) return s
      const groupId = newId()
      const groups = [
        ...s.groups,
        { id: groupId, name: input.groupName?.trim() || 'Group' },
      ]
      let businesses = [...s.businesses]
      let venues = [...s.venues]
      let accounts = [...s.accounts]

      for (const businessDraft of businessPayloads) {
        const businessId = newId()
        businesses = [...businesses, { id: businessId, groupId, name: businessDraft.name }]

        for (const venueDraft of businessDraft.venues) {
          const venueName = venueDraft.name.trim()
          if (!venueName) continue
          const venueId = newId()
          venues = [...venues, { id: venueId, businessId, name: venueName }]
          for (const accountDraft of venueDraft.accounts) {
            const accountName = accountDraft.name.trim()
            if (!accountName) continue
            accounts = [
              ...accounts,
              {
                id: newId(),
                venueId,
                name: accountName,
                type: accountDraft.type,
                balance: 0,
                active: true,
                updatedAt: new Date().toISOString(),
              },
            ]
          }
        }

        for (const accountDraft of businessDraft.businessAccounts ?? []) {
          const accountName = accountDraft.name.trim()
          if (!accountName) continue
          accounts = [
            ...accounts,
            {
              id: newId(),
              businessId,
              name: accountName,
              type: accountDraft.type,
              balance: 0,
              active: true,
              updatedAt: new Date().toISOString(),
            },
          ]
        }
      }

      return { ...s, groups, businesses, venues, accounts }
    })
  }

  const syncGuidedStructureFromDrafts = (payloads: GuidedBusinessPayload[]) => {
    update((s) => {
      const synced = syncGuidedStructureInState(s, payloads)
      return { ...s, ...synced }
    })
  }

  return {
    state,
    viewScope,
    setViewScope,
    canUndo,
    canRedo,
    undo,
    redo,
    addGroup,
    renameGroup,
    setGroupAccentColor,
    deleteGroup,
    dissolveGroup,
    addBusiness,
    renameBusiness,
    setBusinessAccentColor,
    setBusinessIncomePattern,
    setBusinessForecastDailyIncome,
    deleteBusiness,
    addVenue,
    renameVenue,
    setVenueAccentColor,
    deleteVenue,
    addAccount,
    addBusinessAccount,
    addBusinessSavingsAccount,
    renameAccount,
    setAccountType,
    deactivateAccount,
    updateAccountBalance,
    saveBalanceUpdate,
    addCommitment,
    updateCommitment,
    updateCommitmentDuePeriodAmount,
    markCommitmentPaid,
    dismissCommitmentDue,
    acknowledgeCommitmentDueAlert,
    acknowledgeReserveBillDueAlert,
    acknowledgeDueAlertBucket,
    deleteCommitment,
    duplicateCommitment,
    reorderCommitments,
    addReceipt,
    updateReceipt,
    markReceiptReceived,
    deleteReceipt,
    duplicateReceipt,
    reorderReceipts,
    updateReservePlanner,
    deleteReservePlanner,
    addReservePlanner,
    addReserveBill,
    updateReserveBill,
    deleteReserveBill,
    duplicateReserveBill,
    copyReservePlannerBillsFrom,
    reorderReserveBills,
    reorderDueRows,
    markReserveBillPaid,
    dismissReserveBillDue,
    confirmReserveMonth,
    resetToDemo,
    randomiseFinancialFigures,
    replaceEntireState,
    upsertSnapshotForDate,
    correctSnapshotMetric,
    deleteSnapshot,
    deleteSnapshots,
    deleteSnapshotForDate,
    deleteHistoryRecord,
    deleteHistoryRecords,
    setDayNote,
    upsertReferenceField,
    removeReferenceField,
    setReferenceNotes,
    addDiaryReminder,
    updateDiaryReminder,
    deleteDiaryReminder,
    toggleDiaryReminderComplete,
    dismissDiaryReminder,
    clearPastDiaryReminders,
    dismissDiaryDueSoonAlerts,
    addDiaryReminderFromTemplate,
    setupMinimalWorkspace,
    setupGuidedWorkspace,
    syncGuidedStructureFromDrafts,
  }
}

export type AppActions = ReturnType<typeof useAppState>
