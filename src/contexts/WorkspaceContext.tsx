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
import { isSupabaseConfigured } from '../lib/supabase'
import { emptyAppState, isBuiltinDemoWorkspace, isUserOwnedWorkspace, backupBrowserStateToSession, mergeMissingExpectedReceipts } from '../utils/localStateStorage'
import { readBrowserAppState } from '../hooks/useAppState'
import { normalizeWorkspaceStateForDisplay } from '../utils/workspaceNormalize'

/** Lightweight fingerprint so tab-focus reloads only remount UI when cloud data actually changed. */
function workspaceSyncFingerprint(state: AppState): string {
  const accounts = state.accounts
    .map((a) => `${a.id}:${a.balance}:${a.updatedAt ?? ''}`)
    .sort()
    .join('|')
  const commitments = state.commitments
    .map(
      (c) =>
        `${c.id}:${c.lastPaidPeriod ?? ''}:${JSON.stringify(c.paidPeriodAmounts ?? {})}:${c.amount}:${c.dueDayOfMonth ?? ''}`,
    )
    .sort()
    .join('|')
  const receipts = state.expectedReceipts
    .map((r) => `${r.id}:${r.amount}:${r.received ? 1 : 0}:${r.receivedDate ?? ''}`)
    .sort()
    .join('|')
  return [
    accounts,
    commitments,
    receipts,
    state.snapshots.length,
    state.historyRecords.length,
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
  restoreFromBrowser: () => Promise<AppState | null>
  restoreWorkspaceState: (state: AppState) => Promise<AppState>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const SAVE_DEBOUNCE_MS = 400
const LOAD_WORKSPACE_TIMEOUT_MS = 45_000

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
    persistEnabledRef.current = false
    allowEmptyDeletesRef.current = false
    loadedStateRef.current = null
    lastPersistedStateRef.current = null
    if (!configured || !effectiveUserId) {
      setWorkspaceId(null)
      setInitialRemoteState(null)
      setWorkspaceSubscription(null)
      setLoading(false)
      loadedForUserRef.current = null
      hasLoadedStateRef.current = false
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
      const { state: loadedState } = await loadWorkspaceState(wsId)
      let state = loadedState
      const localState = !isImpersonating && user?.id === effectiveUserId ? readBrowserAppState() : null

      const cloudLooksLikeDemo = isBuiltinDemoWorkspace(state)
      const localLooksLikeUserData = localState && isUserOwnedWorkspace(localState)

      if (
        !isImpersonating &&
        user?.id === effectiveUserId &&
        localLooksLikeUserData &&
        (dbEmpty || cloudLooksLikeDemo)
      ) {
        await saveWorkspaceState(wsId, localState, { allowEmptyDeletes: true })
        state = localState
        allowEmptyDeletesRef.current = true
        setImportedFromLocal(true)
      } else if (dbEmpty && !localLooksLikeUserData) {
        state = emptyAppState()
        allowEmptyDeletesRef.current = false
      } else {
        allowEmptyDeletesRef.current = false
      }

      if (
        !isImpersonating &&
        user?.id === effectiveUserId &&
        localState &&
        isUserOwnedWorkspace(localState)
      ) {
        state = mergeMissingExpectedReceipts(state, localState)
      }

      if (!state.workspaceOrigin) {
        if (localState?.workspaceOrigin === 'user' || isUserOwnedWorkspace(state)) {
          state = { ...state, workspaceOrigin: 'user' }
        } else if (isBuiltinDemoWorkspace(state)) {
          state = { ...state, workspaceOrigin: 'builtin-demo' }
        }
      }

      state = normalizeWorkspaceStateForDisplay(state)

      loadedStateRef.current = state
      lastPersistedStateRef.current = null

      setInitialRemoteState(state)
      const fingerprint = workspaceSyncFingerprint(state)
      if (lastSyncFingerprintRef.current !== fingerprint) {
        lastSyncFingerprintRef.current = fingerprint
        setRemoteStateVersion((v) => v + 1)
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
        setInitialRemoteState(fallback)
        loadedForUserRef.current = effectiveUserId
        hasLoadedStateRef.current = true
      } else if (!hasLoadedStateRef.current) {
        setInitialRemoteState(emptyAppState())
        loadedForUserRef.current = effectiveUserId
      }
    } finally {
      setLoading(false)
      persistEnabledRef.current = true
    }
  }, [configured, effectiveUserId, isImpersonating, user?.id])

  useEffect(() => {
    loadWorkspace()
  }, [loadWorkspace])

  // Pull latest cloud state when returning to the tab (phone ↔ web).
  useEffect(() => {
    if (!remoteEnabled) return

    let lastRefresh = 0
    const refreshIfStale = () => {
      if (document.visibilityState !== 'visible') return
      if (!persistEnabledRef.current || readOnly) return
      if (pendingStateRef.current || saveTimerRef.current) return
      const now = Date.now()
      if (now - lastRefresh < 2500) return
      lastRefresh = now
      void loadWorkspace()
    }

    const onFocus = () => refreshIfStale()
    document.addEventListener('visibilitychange', refreshIfStale)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', refreshIfStale)
      window.removeEventListener('focus', onFocus)
    }
  }, [remoteEnabled, readOnly, loadWorkspace])

  const cancelPendingPersist = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    pendingStateRef.current = null
  }, [])

  const flushSave = useCallback(async () => {
    if (!workspaceId || readOnly || !isSupabaseConfigured || !persistEnabledRef.current) return

    while (pendingStateRef.current) {
      const state = pendingStateRef.current
      pendingStateRef.current = null
      try {
        await saveWorkspaceState(workspaceId, state, {
          allowEmptyDeletes: allowEmptyDeletesRef.current,
          tableEmptyDeletes: buildSafeTableEmptyDeletes(state, {
            loaded: loadedStateRef.current,
            previous: lastPersistedStateRef.current,
            allowAll: allowEmptyDeletesRef.current,
          }),
        })
        if (pendingStateRef.current == null) {
          lastPersistedStateRef.current = state
          lastSyncFingerprintRef.current = workspaceSyncFingerprint(state)
          setInitialRemoteState(state)
        }
      } catch (error) {
        console.warn('[WorkspaceContext] save failed:', error)
        if (pendingStateRef.current == null) pendingStateRef.current = state
        break
      }
    }
  }, [workspaceId, readOnly])

  const saveChainRef = useRef(Promise.resolve())

  const persistState = useCallback(
    (state: AppState, options?: { immediate?: boolean }) => {
      if (!remoteEnabled || readOnly || !workspaceId || !persistEnabledRef.current) return
      pendingStateRef.current = state
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
      restoreFromBrowser,
      restoreWorkspaceState,
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
      restoreFromBrowser,
      restoreWorkspaceState,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
