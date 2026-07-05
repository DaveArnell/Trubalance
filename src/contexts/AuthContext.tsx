import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured, tryGetSupabase } from '../lib/supabase'
import { isLocalDevMode } from '../lib/devMode'
import { clearLocalUserData } from '../utils/localStateStorage'
import { fetchProfile, logAdminAction, type UserProfile } from '../services/adminRepository'
import { trackEvent, updateLastSignIn } from '../services/eventTracking'

const IMPERSONATE_KEY = 'trubalance-impersonate'

export interface ImpersonationTarget {
  userId: string
  email: string
  fullName: string
  workspaceId: string | null
}

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isAdmin: boolean
  impersonation: ImpersonationTarget | null
  effectiveUserId: string | null
  isImpersonating: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  startImpersonation: (target: ImpersonationTarget) => Promise<void>
  stopImpersonation: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadImpersonation(): ImpersonationTarget | null {
  try {
    const raw = sessionStorage.getItem(IMPERSONATE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ImpersonationTarget
  } catch {
    return null
  }
}

function saveImpersonation(target: ImpersonationTarget | null) {
  if (target) sessionStorage.setItem(IMPERSONATE_KEY, JSON.stringify(target))
  else sessionStorage.removeItem(IMPERSONATE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [impersonation, setImpersonation] = useState<ImpersonationTarget | null>(() => loadImpersonation())

  const user = session?.user ?? null
  const isAdmin =
    isLocalDevMode() || profile?.role === 'admin' || profile?.role === 'super_admin'
  const effectiveUserId = impersonation?.userId ?? user?.id ?? null
  const isImpersonating = Boolean(impersonation)

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null)
      return
    }
    const next = await fetchProfile(user.id)
    setProfile(next)
  }, [user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const supabase = getSupabase()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      return
    }
    refreshProfile()
  }, [user?.id, refreshProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured' }
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    const { data } = await supabase.auth.getUser()
    if (data.user) {
      await updateLastSignIn(data.user.id)
      await trackEvent('login', data.user.id)
    }
    return { error: null }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured' }
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) return { error: error.message }
    if (data.user) await trackEvent('signup', data.user.id)
    return { error: null }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured' }
    const supabase = getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured' }
    const supabase = getSupabase()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    saveImpersonation(null)
    setImpersonation(null)
    const supabase = tryGetSupabase()
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    setProfile(null)

    clearLocalUserData()

    window.location.href = '/'
  }, [])

  const startImpersonation = useCallback(
    async (target: ImpersonationTarget) => {
      if (!isAdmin || !user?.id) return
      saveImpersonation(target)
      setImpersonation(target)
      await logAdminAction(user.id, 'impersonate_start', target.userId, target.workspaceId ?? undefined, {
        email: target.email,
      })
      await trackEvent('admin_impersonate', user.id, target.workspaceId, { targetUserId: target.userId })
    },
    [isAdmin, user?.id],
  )

  const stopImpersonation = useCallback(() => {
    if (user?.id && impersonation) {
      logAdminAction(user.id, 'impersonate_stop', impersonation.userId, impersonation.workspaceId ?? undefined)
    }
    saveImpersonation(null)
    setImpersonation(null)
  }, [user?.id, impersonation])

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user,
      profile,
      isAdmin,
      impersonation,
      effectiveUserId,
      isImpersonating,
      signIn,
      signUp,
      resetPassword,
      updatePassword,
      signOut,
      startImpersonation,
      stopImpersonation,
      refreshProfile,
    }),
    [
      loading,
      session,
      user,
      profile,
      isAdmin,
      impersonation,
      effectiveUserId,
      isImpersonating,
      signIn,
      signUp,
      signOut,
      startImpersonation,
      stopImpersonation,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
