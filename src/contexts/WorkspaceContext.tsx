import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppState } from '../types'
import type { WorkspaceSubscription } from '../types/subscription'
import { useAuth } from './AuthContext'
import {
  getWorkspaceIdForUser,
  isWorkspaceEmptyInDatabase,
  loadWorkspaceState,
  loadWorkspaceSubscription,
  restoreStateToWorkspace,
  saveWorkspaceState,
  buildSafeTableEmptyDeletes,
} from '../services/workspaceRepository'
import { isSupabaseConfigured, tryGetSupabase } from '../lib/supabase'
import { emptyAppState, isBuiltinDemoWorkspace, isUserOwnedWorkspace, backupBrowserStateToSession, mergeMissingLocalWorkspaceData, countCriticalEntitiesAdded, unionExpectedReceipts, expectedReceiptsSyncKey, accountsSyncKey, snapshotsSyncKey, historyRecordsSyncKey, unionAccountsByUpdatedAt, unionSnapshotsByUpdatedAt, unionHistoryRecordsBySavedAt, stripEntitiesOutsideWorkspace, omitDeletedReceipts, syncDeletedReceiptIdsToBrowser, LOCAL_STORAGE_KEY } from '../utils/localStateStorage'
import { readBrowserAppState } from '../hooks/useAppState'
import { normalizeWorkspaceStateForDisplay } from '../utils/workspaceNormalize'
import { workspaceCostsRepairKey } from '../utils/workspaceRecovery'

/** Lightweight fingerprint so tab-focus reloads only remount UI when cloud data actually changed. */
function workspaceSyncFingerprint(state: AppState): string {
  const accounts = state.accounts
    .map((a) => `${a.id}:${a.balance}:${a.updatedAt ?? ''}`)
    .sort()
    .join('|')
  const commitments = state.commitments
    .map(
      (c) =>
        `${c.id}:${c.name}:${c.lastPaidPeriod ?? ''}:${JSON.stringify(c.paidPeriodAmounts ?? {})}:${c.amount}:${c.dueDayOfMonth ?? ''}:${c.scopeId}`,
    )
    .sort()
    .join('|')
  // Include name/scope/dates — narrower fingerprints used to skip remounting after phone edits.
  const receipts = state.expectedReceipts
    .map(
      (r) =>
        `${r.id}:${r.name}:${r.scopeId}:${r.amount}:${r.received ? 1 : 0}:${r.receivedDate ?? ''}:${r.expectedDate ?? ''}:${r.receiptTiming ?? ''}:${r.accrualStartDate ?? ''}`,
    )
    .sort()
    .join('|')
  const planners = state.reservePlanners
    .map((p) => `${p.id}:${p.bills.length}:${p.actualBalance}:${p.bufferAmount}`)
    .sort()
    .join('|')
  // Trends / week-month deltas come from stored snapshot values — length alone missed rebuilds.
  const snapshots = snapshotsSyncKey(state)
  const history = historyRecordsSyncKey(state)
  return [
    accounts,
    commitments,
    receipts,
    planners,
    snapshots,
    history,
    state.dayNotes?.length ?? 0,
  ].join('#')
}

interface WorkspaceContextValue {
  workspaceId: string | null
  loading: boolean
  remoteEnabled: boolean
  readOnly: boolean
  importedFromLocal: boolean
  remoteStateVersion: number
  reload: () => Promise<void>
  persistState: (state: AppState, options?: { immediate?: boolean }) => void
  cancelPendingPersist: () => void
  initialRemoteState: AppState | null
  workspaceSubscription: WorkspaceSubscription | null
  refreshSubscription: () => Promise<WorkspaceSubscription | null>
  restoreFromBrowser: () => Promise<AppState | null>
  restoreWorkspaceState: (state: AppState) => Promise<AppState>
  /** Union local-only receipts/costs/planners into cloud without deleting anything. */
  syncMissingLocalToCloud: (liveState?: AppState | null) => Promise<{
    receipts: number
    commitments: number
    planners: number
    total: number
    deviceReceipts: number
    cloudReceiptsAfter: number
    openReceipts: number
  } | null>
  /** Call after React applies a pulled remote snapshot — unlocks cloud saves. */
  markRemoteHydrated: () => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const SAVE_DEBOUNCE_MS = 400
const LOAD_WORKSPACE_TIMEOUT_MS = 45_000
const SYNC_PULL_THROTTLE_MS = 2_500
const SYNC_INTERVAL_MS = 20_000
const SAVE_RETRY_MS = 2_500
const REALTIME_PULL_TABLES = [
  'expected_receipts',
  'commitments',
  'accounts',
  'reserve_planners',
  'reserve_bills',
] as const

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { effectiveUserId, isImpersonating, user, configured } = useAuth()
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => {
    if (!isSupabaseConfigured) return false
    try {
      const local = readBrowserAppState()
      if (local && isUserOwnedWorkspace(local)) return false
    } catch {
      // Fall through to configured default below.
    }
    return configured
  })
  const [initialRemoteState, setInitialRemoteState] = useState<AppState | null>(() => {
    if (!isSupabaseConfigured) return null
    try {
      const local = readBrowserAppState()
      if (local && isUserOwnedWorkspace(local)) return local
    } catch {
      // Ignore corrupt local cache; cloud load will recover.
    }
    return null
  })
  const [workspaceSubscription, setWorkspaceSubscription] = useState<WorkspaceSubscription | null>(null)
  const [remoteStateVersion, setRemoteStateVersion] = useState(0)
  const [importedFromLocal, setImportedFromLocal] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingStateRef = useRef<AppState | null>(null)
  const persistEnabledRef = useRef(false)
  const allowEmptyDeletesRef = useRef(false)
  const loadedStateRef = useRef<AppState | null>(null)
  const lastPersistedStateRef = useRef<AppState | null>(null)
  const lastSyncFingerprintRef = useRef<string | null>(null)
  const syncInFlightRef = useRef(false)
  const saveRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushSaveRef = useRef<() => Promise<void>>(async () => {})
  const pullGenerationRef = useRef(0)
  const hydratedGenerationRef = useRef(0)
  const lastLocalSaveAtRef = useRef(0)
  const loadedForUserRef = useRef<string | null>(null)
  const hasLoadedStateRef = useRef(
    (() => {
      if (!isSupabaseConfigured) return false
      try {
        const local = readBrowserAppState()
        return Boolean(local && isUserOwnedWorkspace(local))
      } catch {
        return false
      }
    })(),
  )

  const remoteEnabled = configured && Boolean(effectiveUserId)
  const readOnly = isImpersonating

  const loadWorkspace = useCallback(async () => {
    // Hold cloud writes during pull, but keep any in-flight local edits queued.
    persistEnabledRef.current = false
    allowEmptyDeletesRef.current = false
    const pendingBeforeLoad = pendingStateRef.current
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    pendingStateRef.current = null

    if (!configured || !effectiveUserId) {
      setWorkspaceId(null)
      setInitialRemoteState(null)
      setWorkspaceSubscription(null)
      setLoading(false)
      loadedForUserRef.current = null
      hasLoadedStateRef.current = false
      persistEnabledRef.current = false
      return
    }

    const isFirstLoadForUser = loadedForUserRef.current !== effectiveUserId
    const shouldShowLoading = isFirstLoadForUser && !hasLoadedStateRef.current
    if (shouldShowLoading) {
      setLoading(true)
    }

    try {
      await withTimeout(
        (async () => {
      const wsId = await getWorkspaceIdForUser(effectiveUserId)
      setWorkspaceId(wsId)
      if (!wsId) {
        setInitialRemoteState(emptyAppState())
        setWorkspaceSubscription(null)
        loadedForUserRef.current = effectiveUserId
        hasLoadedStateRef.current = true
        return
      }

      const remoteSubscription = await loadWorkspaceSubscription(wsId)
      setWorkspaceSubscription(remoteSubscription)

      backupBrowserStateToSession()

      const dbEmpty = await isWorkspaceEmptyInDatabase(wsId)
      const { state: loadedState, loadHadErrors } = await loadWorkspaceState(wsId)
      syncDeletedReceiptIdsToBrowser(loadedState.deletedReceiptIds ?? [])
      const cloudRaw = stripEntitiesOutsideWorkspace(omitDeletedReceipts(loadedState))
      let state = cloudRaw

      const lastAuthUserId =
        typeof window !== 'undefined' ? window.localStorage.getItem('trubalance-last-auth-user-id') : null
      const localBelongsToThisUser = !lastAuthUserId || lastAuthUserId === effectiveUserId
      const localState =
        !isImpersonating && user?.id === effectiveUserId && localBelongsToThisUser
          ? readBrowserAppState()
          : null

      if (!localBelongsToThisUser && typeof window !== 'undefined') {
        // Different signed-in user than the last one that wrote localStorage — do not merge.
        console.warn('[Workspace] Ignoring browser workspace cache from a different signed-in user')
      }

      const cloudLooksLikeDemo = isBuiltinDemoWorkspace(state)
      const localLooksLikeUserData = localState && isUserOwnedWorkspace(localState)

      if (
        !isImpersonating &&
        user?.id === effectiveUserId &&
        localLooksLikeUserData &&
        (dbEmpty || cloudLooksLikeDemo)
      ) {
        // One-shot replace into an empty/demo cloud workspace only.
        // Never leave allowEmptyDeletes on for later autosaves — that re-enabled
        // orphan wipes and has deleted expected receipts across devices.
        await saveWorkspaceState(wsId, localState, { allowEmptyDeletes: true })
        state = localState
        allowEmptyDeletesRef.current = false
        setImportedFromLocal(true)
      } else if (dbEmpty && !localLooksLikeUserData) {
        const cloudHasRows =
          loadedState.businesses.length > 0 ||
          loadedState.accounts.length > 0 ||
          loadedState.commitments.length > 0 ||
          loadedState.reservePlanners.length > 0 ||
          loadedState.expectedReceipts.length > 0
        if (!cloudHasRows) {
          state = emptyAppState()
        }
        allowEmptyDeletesRef.current = false
      } else {
        allowEmptyDeletesRef.current = false
      }

      // Prefer the account as source of truth. Only fold in an in-flight edit from this
      // pull — not a stale browser cache (that rewrote Trends and undid Due / reserve edits).
      const localSources = (
        dbEmpty || cloudLooksLikeDemo
          ? [localState, pendingBeforeLoad]
          : [pendingBeforeLoad]
      ).filter(Boolean) as AppState[]
      if (!isImpersonating && user?.id === effectiveUserId && localSources.length > 0) {
        const beforeMerge = state
        for (const source of localSources) {
          state = mergeMissingLocalWorkspaceData(state, {
            ...source,
            workspaceOrigin: source.workspaceOrigin ?? 'user',
          })
          state = unionExpectedReceipts(state, source)
          state = unionAccountsByUpdatedAt(state, source)
          state = unionSnapshotsByUpdatedAt(state, source)
          state = unionHistoryRecordsBySavedAt(state, source)
        }
        state = omitDeletedReceipts(state)
        state = stripEntitiesOutsideWorkspace(state)
        const afterUnion = state
        // Restore frozen History captures before deciding to push — never push past
        // Trends that were rewritten from today's live balances on load.
        state = normalizeWorkspaceStateForDisplay(state)
        state = stripEntitiesOutsideWorkspace(state)
        const added = countCriticalEntitiesAdded(beforeMerge, state)
        const receiptsChanged =
          expectedReceiptsSyncKey(beforeMerge) !== expectedReceiptsSyncKey(state)
        const accountsChanged = accountsSyncKey(beforeMerge) !== accountsSyncKey(state)
        const cloudSnapIds = new Set(beforeMerge.snapshots.map((snap) => snap.id))
        const cloudHistoryIds = new Set((beforeMerge.historyRecords ?? []).map((r) => r.id))
        const localHasExtraHistory = localSources.some(
          (source) =>
            source.snapshots.some((snap) => !cloudSnapIds.has(snap.id)) ||
            (source.historyRecords ?? []).some((record) => !cloudHistoryIds.has(record.id)),
        )
        // Only treat History restore as a push signal — not union preferring a newer bad row.
        const restoredHistory =
          snapshotsSyncKey(afterUnion) !== snapshotsSyncKey(state) ||
          historyRecordsSyncKey(afterUnion) !== historyRecordsSyncKey(state)
        if (loadHadErrors) {
          console.warn(
            '[Workspace] Cloud load had table errors — merged missing local planners/receipts/commitments',
          )
        }
        // Push living data this device still had, plus History-restored Trends baselines.
        if (
          (added.total > 0 ||
            receiptsChanged ||
            accountsChanged ||
            localHasExtraHistory ||
            restoredHistory) &&
          !isImpersonating
        ) {
          try {
            await saveWorkspaceState(wsId, state, {
              allowEmptyDeletes: false,
              previousState: beforeMerge,
            })
            console.info(
              `[Workspace] Pushed ${added.receipts} receipts, ${added.commitments} costs, ${added.planners} planners` +
                (accountsChanged ? ', account balances' : '') +
                (restoredHistory || localHasExtraHistory ? ', and updated Trends baselines' : '') +
                ' from this device to your account',
            )
          } catch (error) {
            console.warn('[Workspace] Failed to push merged local entities to cloud', error)
          }
        }
      }

      if (!state.workspaceOrigin) {
        if (localState?.workspaceOrigin === 'user' || isUserOwnedWorkspace(state)) {
          state = { ...state, workspaceOrigin: 'user' }
        } else if (isBuiltinDemoWorkspace(state)) {
          state = { ...state, workspaceOrigin: 'builtin-demo' }
        }
      }

      // Already normalized above when local sources were merged; still normalize when not.
      if (localSources.length === 0 || isImpersonating || user?.id !== effectiveUserId) {
        state = normalizeWorkspaceStateForDisplay(state)
      }
      state = stripEntitiesOutsideWorkspace(state)

      if (
        loadedState.businesses.length > 0 &&
        state.businesses.length === 0
      ) {
        console.error('[Workspace] Loaded businesses were dropped — keeping cloud rows')
        state = loadedState
      }

      const recoveredCosts =
        loadedState.commitments.length === 0 && state.commitments.length > 0
      const recoveredPlanners =
        loadedState.reservePlanners.length === 0 && state.reservePlanners.length > 0
      const prunedRestoredReceipts =
        expectedReceiptsSyncKey(loadedState) !== expectedReceiptsSyncKey(state) &&
        state.expectedReceipts.length < loadedState.expectedReceipts.length
      const costsRepaired = workspaceCostsRepairKey(loadedState) !== workspaceCostsRepairKey(state)
      if (
        !isImpersonating &&
        (recoveredCosts || recoveredPlanners || prunedRestoredReceipts || costsRepaired)
      ) {
        try {
          await saveWorkspaceState(wsId, state, {
            allowEmptyDeletes: false,
            previousState: loadedState,
          })
          console.info('[Workspace] Saved history recovery to account', {
            costs: state.commitments.length,
            planners: state.reservePlanners.length,
            receipts: state.expectedReceipts.length,
          })
        } catch (error) {
          console.warn('[Workspace] Failed to save history recovery', error)
        }
      }

      console.debug('[Workspace] cloud rows', {
        groups: state.groups.length,
        businesses: state.businesses.length,
        accounts: state.accounts.length,
        commitments: state.commitments.length,
        receipts: state.expectedReceipts.length,
        planners: state.reservePlanners.length,
        snapshots: state.snapshots.length,
        loadHadErrors,
      })

      // Signed-in workspaces live on the account — drop the old browser cache so it
      // cannot silently overwrite cloud data on the next pull.
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY)
        window.localStorage.removeItem('trubalance-app-state-v3')
        window.localStorage.removeItem('trubalance-app-state-v2')
      } catch {
        /* ignore */
      }

      try {
        window.localStorage.setItem('trubalance-last-auth-user-id', effectiveUserId)
      } catch {
        /* ignore */
      }

      loadedStateRef.current = state
      // Treat the pulled cloud snapshot as already persisted so a stale UI save
      // cannot targeted-delete rows that only exist on another device — but only
      // after React hydrates (see markRemoteHydrated / pullGeneration).
      lastPersistedStateRef.current = state
      pullGenerationRef.current += 1

      setInitialRemoteState(state)
      const fingerprint = workspaceSyncFingerprint(state)
      if (lastSyncFingerprintRef.current !== fingerprint) {
        lastSyncFingerprintRef.current = fingerprint
        setRemoteStateVersion((v) => v + 1)
      } else {
        // No UI remount needed — unlock saves for this pull immediately.
        hydratedGenerationRef.current = pullGenerationRef.current
      }
      loadedForUserRef.current = effectiveUserId
      hasLoadedStateRef.current = true
        })(),
        LOAD_WORKSPACE_TIMEOUT_MS,
        'Workspace load',
      )
    } catch (error) {
      console.error('[Workspace] Failed to load workspace', error)
      const localState =
        !isImpersonating && user?.id === effectiveUserId ? readBrowserAppState() : null
      if (localState && isUserOwnedWorkspace(localState)) {
        const fallback = normalizeWorkspaceStateForDisplay(localState)
        loadedStateRef.current = fallback
        lastPersistedStateRef.current = fallback
        pullGenerationRef.current += 1
        setInitialRemoteState(fallback)
        setRemoteStateVersion((v) => v + 1)
        loadedForUserRef.current = effectiveUserId
        hasLoadedStateRef.current = true
      } else if (!hasLoadedStateRef.current) {
        setInitialRemoteState(emptyAppState())
        loadedForUserRef.current = effectiveUserId
      }
    } finally {
      setLoading(false)
      persistEnabledRef.current = true
      // Mid-pull edits stay queued until hydrate unlocks saves (markRemoteHydrated).
      if (
        pendingStateRef.current &&
        hydratedGenerationRef.current === pullGenerationRef.current
      ) {
        void flushSaveRef.current()
      }
    }
  }, [configured, effectiveUserId, isImpersonating, user?.id])

  useEffect(() => {
    loadWorkspace()
  }, [loadWorkspace])

  const refreshSubscription = useCallback(async () => {
    if (!workspaceId || !isSupabaseConfigured) return null
    const remoteSubscription = await loadWorkspaceSubscription(workspaceId)
    setWorkspaceSubscription(remoteSubscription)
    return remoteSubscription
  }, [workspaceId])

  // After Stripe Checkout returns (?billing=success), poll until webhook unlocks editing.
  useEffect(() => {
    if (!remoteEnabled || !workspaceId) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('billing') !== 'success') return

    let cancelled = false
    let attempts = 0
    const maxAttempts = 8

    const tick = async () => {
      if (cancelled) return
      attempts += 1
      const sub = await refreshSubscription()
      const unlocked =
        sub?.lifetimeAccess ||
        sub?.status === 'active' ||
        (sub?.status === 'trialing' && Boolean(sub.stripeSubscriptionId)) ||
        (sub?.trialEndsAt != null && new Date(sub.trialEndsAt) > new Date())
      if (unlocked || attempts >= maxAttempts) {
        params.delete('billing')
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
        window.history.replaceState({}, '', next)
        return
      }
      window.setTimeout(() => {
        void tick()
      }, 1500)
    }

    void tick()
    return () => {
      cancelled = true
    }
  }, [remoteEnabled, workspaceId, refreshSubscription])

  const cancelPendingPersist = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    pendingStateRef.current = null
  }, [])

  const flushSave = useCallback(async () => {
    if (!workspaceId || readOnly || !isSupabaseConfigured || !persistEnabledRef.current) return
    // Wait until React has applied the latest pull — otherwise a stale snapshot can
    // targeted-delete receipts that another device just pushed.
    if (hydratedGenerationRef.current !== pullGenerationRef.current) return

    while (pendingStateRef.current) {
      const state = pendingStateRef.current
      pendingStateRef.current = null

      const loaded = loadedStateRef.current
      if (
        loaded &&
        loaded.businesses.length > 0 &&
        state.businesses.length === 0 &&
        (loaded.commitments.length > 0 ||
          loaded.accounts.length > 0 ||
          loaded.reservePlanners.length > 0)
      ) {
        console.error('[Workspace] Refusing to save an empty workspace over loaded account data')
        pendingStateRef.current = null
        break
      }

      try {
        lastLocalSaveAtRef.current = Date.now()
        await saveWorkspaceState(workspaceId, state, {
          allowEmptyDeletes: allowEmptyDeletesRef.current,
          tableEmptyDeletes: buildSafeTableEmptyDeletes(state, {
            loaded: loadedStateRef.current,
            previous: lastPersistedStateRef.current,
            allowAll: allowEmptyDeletesRef.current,
          }),
          previousState: lastPersistedStateRef.current ?? undefined,
        })
        if (pendingStateRef.current == null) {
          lastPersistedStateRef.current = state
          loadedStateRef.current = state
          lastSyncFingerprintRef.current = workspaceSyncFingerprint(state)
          setInitialRemoteState(state)
          lastLocalSaveAtRef.current = Date.now()
        }
        if (saveRetryTimerRef.current) {
          clearTimeout(saveRetryTimerRef.current)
          saveRetryTimerRef.current = null
        }
      } catch (error) {
        console.warn('[WorkspaceContext] save failed — will retry:', error)
        if (pendingStateRef.current == null) pendingStateRef.current = state
        if (!saveRetryTimerRef.current) {
          saveRetryTimerRef.current = setTimeout(() => {
            saveRetryTimerRef.current = null
            void flushSaveRef.current()
          }, SAVE_RETRY_MS)
        }
        break
      }
    }
  }, [workspaceId, readOnly])

  flushSaveRef.current = flushSave

  const markRemoteHydrated = useCallback(() => {
    hydratedGenerationRef.current = pullGenerationRef.current
    if (pendingStateRef.current && persistEnabledRef.current) {
      void flushSaveRef.current()
    }
  }, [])

  const saveChainRef = useRef(Promise.resolve())

  const persistState = useCallback(
    (state: AppState, options?: { immediate?: boolean }) => {
      if (!remoteEnabled || readOnly || !workspaceId) return
      // Always queue — even while a pull has persistEnabled=false — so phone edits are not dropped.
      pendingStateRef.current = state
      if (!persistEnabledRef.current) return
      if (hydratedGenerationRef.current !== pullGenerationRef.current) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      const run = () => {
        saveChainRef.current = saveChainRef.current
          .catch(() => undefined)
          .then(() => flushSave())
        return saveChainRef.current
      }
      if (options?.immediate) {
        void run()
        return
      }
      saveTimerRef.current = setTimeout(() => {
        void run()
      }, SAVE_DEBOUNCE_MS)
    },
    [remoteEnabled, readOnly, workspaceId, flushSave],
  )

  // Keep devices aligned: flush local edits, then pull cloud (focus / online / interval).
  useEffect(() => {
    if (!remoteEnabled) return

    let lastPullAt = 0
    let cancelled = false

    const flushPendingSoon = () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      return flushSave()
    }

    const flushThenPull = async (reason: string) => {
      if (cancelled || readOnly) return
      if (syncInFlightRef.current) return
      const now = Date.now()
      if (now - lastPullAt < SYNC_PULL_THROTTLE_MS && reason !== 'online') return
      syncInFlightRef.current = true
      lastPullAt = now
      try {
        await saveChainRef.current.catch(() => undefined)
        await flushPendingSoon()
        if (cancelled) return
        await loadWorkspace()
      } catch (error) {
        console.warn(`[Workspace] sync (${reason}) failed`, error)
      } finally {
        syncInFlightRef.current = false
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flushPendingSoon()
        return
      }
      void flushThenPull('visibility')
    }
    const onFocus = () => {
      if (document.visibilityState === 'visible') void flushThenPull('focus')
    }
    const onOnline = () => void flushThenPull('online')
    const onPageHide = () => {
      void flushPendingSoon()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    window.addEventListener('pagehide', onPageHide)

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void flushThenPull('interval')
    }, SYNC_INTERVAL_MS)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('pagehide', onPageHide)
      window.clearInterval(intervalId)
    }
  }, [remoteEnabled, readOnly, loadWorkspace, flushSave])

  // Live updates when another device writes to the account (requires Realtime publication).
  useEffect(() => {
    if (!remoteEnabled || readOnly || !workspaceId) return
    const supabase = tryGetSupabase()
    if (!supabase) return

    let pullTimer: ReturnType<typeof setTimeout> | null = null
    const schedulePull = () => {
      if (Date.now() - lastLocalSaveAtRef.current < 4_000) return
      if (pullTimer) clearTimeout(pullTimer)
      pullTimer = setTimeout(() => {
        if (document.visibilityState !== 'visible') return
        if (syncInFlightRef.current) return
        if (Date.now() - lastLocalSaveAtRef.current < 4_000) return
        syncInFlightRef.current = true
        void (async () => {
          try {
            await saveChainRef.current.catch(() => undefined)
            if (saveTimerRef.current) {
              clearTimeout(saveTimerRef.current)
              saveTimerRef.current = null
            }
            await flushSaveRef.current()
            await loadWorkspace()
          } catch (error) {
            console.warn('[Workspace] realtime sync failed', error)
          } finally {
            syncInFlightRef.current = false
          }
        })()
      }, 800)
    }

    const channel = supabase.channel(`workspace-sync:${workspaceId}`)
    for (const table of REALTIME_PULL_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `workspace_id=eq.${workspaceId}` },
        schedulePull,
      )
    }
    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.info('[Workspace] Realtime sync unavailable — using focus/interval sync')
      }
    })

    return () => {
      if (pullTimer) clearTimeout(pullTimer)
      void supabase.removeChannel(channel)
    }
  }, [remoteEnabled, readOnly, workspaceId, loadWorkspace])

  const restoreFromBrowser = useCallback(async (): Promise<AppState | null> => {
    const local = readBrowserAppState()
    if (!local) return null
    cancelPendingPersist()
    if (workspaceId && !readOnly) {
      await restoreStateToWorkspace(workspaceId, local)
    }
    setInitialRemoteState(local)
    setRemoteStateVersion((v) => v + 1)
    setImportedFromLocal(true)
    return local
  }, [workspaceId, readOnly, cancelPendingPersist])

  const restoreWorkspaceState = useCallback(
    async (state: AppState): Promise<AppState> => {
      cancelPendingPersist()
      if (workspaceId && !readOnly) {
        await restoreStateToWorkspace(workspaceId, state)
      }
      setInitialRemoteState(state)
      setRemoteStateVersion((v) => v + 1)
      setImportedFromLocal(true)
      return state
    },
    [workspaceId, readOnly, cancelPendingPersist],
  )

  const syncMissingLocalToCloud = useCallback(async (liveState?: AppState | null) => {
    if (!workspaceId || readOnly || !isSupabaseConfigured) return null
    cancelPendingPersist()
    const local = readBrowserAppState()
    const { state: cloudState } = await loadWorkspaceState(workspaceId)
    const beforeMerge = cloudState

    // Always take receipts from this device seriously — not only brand-new ids.
    let merged = unionExpectedReceipts(cloudState, local, liveState)
    if (local) {
      merged = mergeMissingLocalWorkspaceData(merged, {
        ...local,
        workspaceOrigin: local.workspaceOrigin ?? 'user',
      })
    }
    if (liveState) {
      merged = mergeMissingLocalWorkspaceData(merged, { ...liveState, workspaceOrigin: 'user' })
      merged = unionExpectedReceipts(merged, liveState)
    }
    merged = unionAccountsByUpdatedAt(merged, local, liveState)
    merged = unionSnapshotsByUpdatedAt(merged, local, liveState)
    merged = unionHistoryRecordsBySavedAt(merged, local, liveState)
    merged = normalizeWorkspaceStateForDisplay({
      ...merged,
      workspaceOrigin: merged.workspaceOrigin ?? 'user',
    })

    const added = countCriticalEntitiesAdded(beforeMerge, merged)
    const receiptsChanged =
      expectedReceiptsSyncKey(beforeMerge) !== expectedReceiptsSyncKey(merged)
    const deviceReceiptCount = Math.max(
      liveState?.expectedReceipts.length ?? 0,
      local?.expectedReceipts.length ?? 0,
      merged.expectedReceipts.length,
    )

    // Always upsert — even when counts match — so field-level phone edits and
    // earlier failed saves still land in the account.
    try {
      await saveWorkspaceState(workspaceId, merged, {
        allowEmptyDeletes: false,
        previousState: beforeMerge,
      })
    } catch (error) {
      console.warn('[Workspace] Force sync save failed', error)
      throw error
    }

    // Verify the account actually has the receipts we just pushed.
    const { state: verified } = await loadWorkspaceState(workspaceId)
    const verifiedKey = expectedReceiptsSyncKey(verified)
    const mergedKey = expectedReceiptsSyncKey(merged)
    if (verifiedKey !== mergedKey) {
      console.warn('[Workspace] Sync verify mismatch — retrying upsert', {
        device: merged.expectedReceipts.length,
        cloud: verified.expectedReceipts.length,
      })
      await saveWorkspaceState(workspaceId, merged, {
        allowEmptyDeletes: false,
        previousState: verified,
      })
    }

    loadedStateRef.current = merged
    lastPersistedStateRef.current = merged
    lastSyncFingerprintRef.current = workspaceSyncFingerprint(merged)
    pullGenerationRef.current += 1
    setInitialRemoteState(merged)
    setRemoteStateVersion((v) => v + 1)

    const receiptDelta = Math.max(
      0,
      merged.expectedReceipts.filter((receipt) => !receipt.received).length -
        beforeMerge.expectedReceipts.filter((receipt) => !receipt.received).length,
    )
    return {
      receipts: Math.max(
        added.receipts,
        receiptDelta,
        receiptsChanged ? merged.expectedReceipts.length : 0,
        deviceReceiptCount > beforeMerge.expectedReceipts.length
          ? deviceReceiptCount - beforeMerge.expectedReceipts.length
          : 0,
      ),
      commitments: added.commitments,
      planners: added.planners,
      total:
        added.total +
        (receiptsChanged && added.receipts === 0 ? 1 : 0) +
        (deviceReceiptCount > 0 && added.total === 0 && !receiptsChanged ? 0 : 0),
      deviceReceipts: deviceReceiptCount,
      cloudReceiptsAfter: merged.expectedReceipts.length,
      openReceipts: merged.expectedReceipts.filter((receipt) => !receipt.received).length,
    }
  }, [workspaceId, readOnly, cancelPendingPersist])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (pendingStateRef.current && workspaceId && !readOnly && persistEnabledRef.current) {
        const state = pendingStateRef.current
        saveWorkspaceState(workspaceId, state, {
          allowEmptyDeletes: allowEmptyDeletesRef.current,
          tableEmptyDeletes: buildSafeTableEmptyDeletes(state, {
            loaded: loadedStateRef.current,
            previous: lastPersistedStateRef.current,
            allowAll: allowEmptyDeletesRef.current,
          }),
          previousState: lastPersistedStateRef.current ?? loadedStateRef.current,
        })
      }
    }
  }, [workspaceId, readOnly])

  const value = useMemo(
    () => ({
      workspaceId,
      loading,
      remoteEnabled,
      readOnly,
      importedFromLocal,
      remoteStateVersion,
      reload: loadWorkspace,
      persistState,
      cancelPendingPersist,
      initialRemoteState,
      workspaceSubscription,
      refreshSubscription,
      restoreFromBrowser,
      restoreWorkspaceState,
      syncMissingLocalToCloud,
      markRemoteHydrated,
    }),
    [
      workspaceId,
      loading,
      remoteEnabled,
      readOnly,
      importedFromLocal,
      remoteStateVersion,
      loadWorkspace,
      persistState,
      cancelPendingPersist,
      initialRemoteState,
      workspaceSubscription,
      refreshSubscription,
      restoreFromBrowser,
      restoreWorkspaceState,
      syncMissingLocalToCloud,
      markRemoteHydrated,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
