import { tryGetSupabase } from '../lib/supabase'

export async function trackEvent(
  eventType: string,
  userId?: string | null,
  workspaceId?: string | null,
  metadata?: Record<string, unknown>,
) {
  const supabase = tryGetSupabase()
  if (!supabase || !userId) return

  await supabase.from('user_events').insert({
    user_id: userId,
    workspace_id: workspaceId ?? null,
    event_type: eventType,
    metadata: metadata ?? {},
  })
}

export async function updateLastSignIn(userId: string) {
  const supabase = tryGetSupabase()
  if (!supabase) return

  await supabase
    .from('profiles')
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq('id', userId)
}

const SESSION_ACTIVITY_KEY = 'trubalance-session-activity'

/** Record a returning session once per calendar day (login + last_sign_in_at). */
export async function recordSessionActivity(userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const key = `${SESSION_ACTIVITY_KEY}:${userId}`
  try {
    if (sessionStorage.getItem(key) === today) return
    sessionStorage.setItem(key, today)
  } catch {
    // sessionStorage unavailable — still record
  }
  await updateLastSignIn(userId)
  await trackEvent('session', userId)
}
