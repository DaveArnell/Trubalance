import { getSupabase, isSupabaseConfigured } from '../lib/supabase'

export type AdminAuthState =
  | 'unconfigured'
  | 'unauthenticated'
  | 'not_enrolled'
  | 'needs_2fa'
  | 'ready'

export interface AdminAuthStatus {
  state: AdminAuthState
  email?: string
  expiresAt?: string
  message?: string
}

async function callAdminAuth(body: Record<string, unknown>): Promise<AdminAuthStatus & { error?: string }> {
  if (!isSupabaseConfigured) {
    return { state: 'unconfigured', message: 'Supabase is not configured.' }
  }

  const supabase = getSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { state: 'unauthenticated' }
  }

  const url = import.meta.env.VITE_SUPABASE_URL as string
  const response = await fetch(`${url}/functions/v1/admin-auth`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as Record<string, unknown>
  if (!response.ok) {
    const currentState = String(payload.state ?? 'needs_2fa') as AdminAuthState
    return {
      state: currentState === 'ready' ? 'needs_2fa' : currentState,
      error: String(payload.error ?? 'Admin authentication failed'),
      email: payload.email ? String(payload.email) : undefined,
      message: payload.message ? String(payload.message) : undefined,
    }
  }

  const state = String(payload.state ?? 'unauthenticated') as AdminAuthState
  return {
    state,
    email: payload.email ? String(payload.email) : undefined,
    expiresAt: payload.expiresAt ? String(payload.expiresAt) : undefined,
    message: payload.message ? String(payload.message) : undefined,
  }
}

export function fetchAdminAuthStatus(): Promise<AdminAuthStatus> {
  return callAdminAuth({ action: 'status' })
}

export function sendAdminEmailCode(): Promise<AdminAuthStatus & { error?: string }> {
  return callAdminAuth({ action: 'send_code' })
}

export function verifyAdminEmailCode(code: string): Promise<AdminAuthStatus & { error?: string }> {
  return callAdminAuth({ action: 'verify_code', code })
}

export function logoutAdminSession(): Promise<{ ok?: boolean; error?: string }> {
  return callAdminAuth({ action: 'logout' })
}

export async function hasServerAdminSession(): Promise<boolean> {
  const status = await fetchAdminAuthStatus()
  return status.state === 'ready'
}
