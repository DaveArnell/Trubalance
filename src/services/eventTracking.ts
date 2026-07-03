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
