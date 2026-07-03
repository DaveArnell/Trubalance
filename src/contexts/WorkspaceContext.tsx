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
import { useAuth } from './AuthContext'
import {
  getWorkspaceIdForUser,
  isWorkspaceEmptyInDatabase,
  loadWorkspaceState,
  restoreStateToWorkspace,
  saveWorkspaceState,
} from '../services/workspaceRepository'
import { isSupabaseConfigured } from '../lib/supabase'
import { emptyAppState, isBuiltinDemoWorkspace, isUserOwnedWorkspace, backupBrowserStateToSession } from '../utils/localStateStorage'
import { readBrowserAppState } from '../hooks/useAppState'

interface WorkspaceContextValue {
  workspaceId: string | null
  loading: boolean
  remoteEnabled: boolean
  readOnly: boolean
  importedFromLocal: boolean
  remoteStateVersion: number
  reload: () => Promise<void>
  persistState: (state: AppState) => void
  cancelPendingPersist: () => void
  initialRemoteState: AppState | null
  restoreFromBrowser: () => Promise<AppState | null>
  restoreWorkspaceState: (state: AppState) => Promise<AppState>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const SAVE_DEBOUNCE_MS = 400

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { effectiveUserId, isImpersonating, user, configured } = useAuth()
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(configured)
  const [initialRemoteState, setInitialRemoteState] = useState<AppState | null>(null)
  const [remoteStateVersion, setRemoteStateVersion] = useState(0)
  const [importedFromLocal, setImportedFromLocal] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingStateRef = useRef<AppState | null>(null)
  const persistEnabledRef = useRef(false)
  const loadedForUserRef = useRef<string | null>(null)

  const remoteEnabled = configured && Boolean(effectiveUserId)
  const readOnly = isImpersonating

  const loadWorkspace = useCallback(async () => {
    persistEnabledRef.current = false
    if (!configured || !effectiveUserId) {
      setWorkspaceId(null)
      setInitialRemoteState(null)
      setLoading(false)
      loadedForUserRef.current = null
      return
    }

    const isFirstLoadForUser = loadedForUserRef.current !== effectiveUserId
    if (isFirstLoadForUser) {
      setLoading(true)
    }

    try {
      const wsId = await getWorkspaceIdForUser(effectiveUserId)
      setWorkspaceId(wsId)
      if (!wsId) {
        setInitialRemoteState(emptyAppState())
        loadedForUserRef.current = effectiveUserId
        return
      }

      backupBrowserStateToSession()

      const dbEmpty = await isWorkspaceEmptyInDatabase(wsId)
      let state = await loadWorkspaceState(wsId)
      const localState = !isImpersonating && user?.id === effectiveUserId ? readBrowserAppState() : null

      const cloudLooksLikeDemo = isBuiltinDemoWorkspace(state)
      const localLooksLikeUserData = localState && isUserOwnedWorkspace(localState)

      if (
        !isImpersonating &&
        user?.id === effectiveUserId &&
        localLooksLikeUserData &&
        (dbEmpty || cloudLooksLikeDemo)
      ) {
        await saveWorkspaceState(wsId, localState)
        state = localState
        setImportedFromLocal(true)
      } else if (dbEmpty && !localLooksLikeUserData) {
        state = emptyAppState()
      }

      if (!state.workspaceOrigin) {
        if (localState?.workspaceOrigin === 'user' || isUserOwnedWorkspace(state)) {
          state = { ...state, workspaceOrigin: 'user' }
        } else if (isBuiltinDemoWorkspace(state)) {
          state = { ...state, workspaceOrigin: 'builtin-demo' }
        }
      }

      setInitialRemoteState(state)
      loadedForUserRef.current = effectiveUserId
    } finally {
      if (isFirstLoadForUser) {
        setLoading(false)
      }
      persistEnabledRef.current = true
    }
  }, [configured, effectiveUserId, isImpersonating, user?.id])

  useEffect(() => {
    loadWorkspace()
  }, [loadWorkspace])

  const cancelPendingPersist = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    pendingStateRef.current = null
  }, [])

  const flushSave = useCallback(async () => {
    if (!workspaceId || readOnly || !isSupabaseConfigured || !persistEnabledRef.current) return
    const state = pendingStateRef.current
    if (!state) return
    pendingStateRef.current = null
    await saveWorkspaceState(workspaceId, state)
  }, [workspaceId, readOnly])

  const persistState = useCallback(
    (state: AppState) => {
      if (!remoteEnabled || readOnly || !workspaceId || !persistEnabledRef.current) return
      pendingStateRef.current = state
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        flushSave()
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
        saveWorkspaceState(workspaceId, pendingStateRef.current)
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
