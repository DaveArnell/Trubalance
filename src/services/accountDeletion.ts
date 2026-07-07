import { isSupabaseConfigured, tryGetSupabase } from '../lib/supabase'
import { clearLocalUserData } from '../utils/localStateStorage'

function mapDeleteError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('not_authenticated')) return 'You must be signed in to delete an account.'
  if (lower.includes('forbidden')) return 'You do not have permission to delete this account.'
  return message
}

/**
 * Permanently delete a user account and all workspace data.
 * Self-service: omit targetUserId. Platform admin: pass the target user's id.
 */
export async function deleteUserAccount(targetUserId?: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    clearLocalUserData()
    return { error: null }
  }

  const supabase = tryGetSupabase()
  if (!supabase) {
    return { error: 'Could not connect to the server.' }
  }

  const { error } = await supabase.rpc('delete_user_account', {
    p_target_user_id: targetUserId ?? null,
  })

  if (error) {
    return { error: mapDeleteError(error.message) }
  }

  return { error: null }
}

/** After self-deletion, clear local caches and end the browser session. */
export async function finishSelfAccountDeletion(): Promise<void> {
  clearLocalUserData()
  const supabase = tryGetSupabase()
  if (supabase) {
    await supabase.auth.signOut()
  }
  window.location.href = '/'
}
