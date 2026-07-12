import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  fetchAdminAuthStatus,
  logoutAdminSession,
  sendAdminEmailCode,
  verifyAdminEmailCode,
  type AdminAuthState,
} from '../services/adminAuthApi'

interface AdminAuthContextValue {
  loading: boolean
  state: AdminAuthState
  email: string | null
  expiresAt: string | null
  error: string | null
  infoMessage: string | null
  refresh: () => Promise<void>
  sendEmailCode: () => Promise<boolean>
  submitEmailCode: (code: string) => Promise<boolean>
  logoutAdmin: () => Promise<void>
  isAdminReady: boolean
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth()
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<AdminAuthState>('unauthenticated')
  const [email, setEmail] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!configured) {
      setState('unconfigured')
      setLoading(false)
      return
    }

    if (!user) {
      setState('unauthenticated')
      setEmail(null)
      setExpiresAt(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const status = await fetchAdminAuthStatus()
    setState(status.state)
    setEmail(status.email ?? user.email ?? null)
    setExpiresAt(status.expiresAt ?? null)
    if (status.message && status.state === 'not_enrolled') {
      setError(status.message)
    }
    setLoading(false)
  }, [configured, user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const sendEmailCode = useCallback(async () => {
    setError(null)
    setInfoMessage(null)
    const result = await sendAdminEmailCode()
    if (result.error) {
      setError(result.error)
      return false
    }
    setState(result.state)
    setInfoMessage(result.message ?? 'Check your email for a 6-digit code.')
    return true
  }, [])

  const submitEmailCode = useCallback(async (code: string) => {
    setError(null)
    setInfoMessage(null)
    const result = await verifyAdminEmailCode(code)
    if (result.error) {
      setError(result.error)
      return false
    }
    setState(result.state)
    setExpiresAt(result.expiresAt ?? null)
    setInfoMessage(result.message ?? null)
    return result.state === 'ready'
  }, [])

  const logoutAdmin = useCallback(async () => {
    await logoutAdminSession()
    setExpiresAt(null)
    setInfoMessage(null)
    await refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      loading,
      state,
      email,
      expiresAt,
      error,
      infoMessage,
      refresh,
      sendEmailCode,
      submitEmailCode,
      logoutAdmin,
      isAdminReady: state === 'ready',
    }),
    [
      loading,
      state,
      email,
      expiresAt,
      error,
      infoMessage,
      refresh,
      sendEmailCode,
      submitEmailCode,
      logoutAdmin,
    ],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
