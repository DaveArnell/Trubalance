import { isSupabaseConfigured } from '../../lib/supabase'

export type AdminDataMode = 'demo' | 'live'

const STORAGE_KEY = 'trubalance-admin-data-mode'

const STAGING_DEMO_DEFAULT = import.meta.env.VITE_ADMIN_DEMO_DEFAULT === 'true'

export function getAdminDataMode(): AdminDataMode {
  if (isSupabaseConfigured) return 'live'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'demo' || stored === 'live') return stored
  } catch {
    /* ignore */
  }
  return STAGING_DEMO_DEFAULT ? 'demo' : 'live'
}

export function setAdminDataMode(mode: AdminDataMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('admin-data-mode-change', { detail: mode }))
}
