import { isSupabaseConfigured } from './supabase'

/** Local build without cloud auth — admin and subscription overrides use browser storage. */
export function isLocalDevMode(): boolean {
  return !isSupabaseConfigured
}
