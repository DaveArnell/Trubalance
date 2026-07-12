import { tryGetSupabase } from '../lib/supabase'
import type { AdminNote, WorkspaceAccessOverride } from '../admin/types'
import type { SubscriptionTierId } from '../config/subscriptionTiers'

function mapNote(row: Record<string, unknown>): AdminNote {
  return {
    id: String(row.id),
    userId: String(row.target_user_id),
    text: String(row.text),
    author: String(row.author_email ?? 'Platform admin'),
    createdAt: String(row.created_at),
  }
}

export async function fetchPlatformAdminId(): Promise<string | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null
  return String(data.id)
}

export async function fetchServerAdminNotes(userId: string): Promise<AdminNote[]> {
  const supabase = tryGetSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('admin_user_notes')
    .select('id, target_user_id, text, author_email, created_at')
    .eq('target_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapNote(row as Record<string, unknown>))
}

export async function createServerAdminNote(userId: string, text: string): Promise<AdminNote> {
  const supabase = tryGetSupabase()
  if (!supabase) throw new Error('Supabase is not configured')

  const platformAdminId = await fetchPlatformAdminId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!platformAdminId || !user?.email) {
    throw new Error('Platform admin session required')
  }

  const trimmed = text.trim()
  if (!trimmed) throw new Error('Note cannot be empty')

  const { data, error } = await supabase
    .from('admin_user_notes')
    .insert({
      target_user_id: userId,
      platform_admin_id: platformAdminId,
      author_email: user.email,
      text: trimmed,
    })
    .select('id, target_user_id, text, author_email, created_at')
    .single()

  if (error) throw error
  return mapNote(data as Record<string, unknown>)
}

export async function fetchRecentServerAdminNotes(limit = 6): Promise<AdminNote[]> {
  const supabase = tryGetSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('admin_user_notes')
    .select('id, target_user_id, text, author_email, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((row) => mapNote(row as Record<string, unknown>))
}

export async function fetchServerAccessOverride(userId: string): Promise<WorkspaceAccessOverride | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select(
      'id, subscription_tier, trial_ends_at, lifetime_access, beta_tester, admin_tier_override',
    )
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!workspace) return null

  const tier = (workspace.subscription_tier as SubscriptionTierId) || 'solo'
  const lifetimeAccess = Boolean(workspace.lifetime_access)
  const betaTester = Boolean(workspace.beta_tester)
  const trialEndsAt = workspace.trial_ends_at ? String(workspace.trial_ends_at) : null

  let accessType: WorkspaceAccessOverride['accessType'] = 'normal_trial'
  if (lifetimeAccess) accessType = 'lifetime'
  else if (betaTester) accessType = 'beta_tester'
  else if (trialEndsAt && new Date(trialEndsAt) > new Date()) accessType = 'normal_trial'
  else accessType = 'cancelled'

  return {
    userId,
    accessType,
    subscriptionPlan: (workspace.admin_tier_override as SubscriptionTierId) || tier,
    betaTester,
    lifetimeAccess,
    trialEndsAt,
    updatedAt: new Date().toISOString(),
  }
}

export async function saveServerAccessOverride(
  override: WorkspaceAccessOverride,
): Promise<WorkspaceAccessOverride> {
  const supabase = tryGetSupabase()
  if (!supabase) throw new Error('Supabase is not configured')

  const lifetimeAccess = override.accessType === 'lifetime' || override.lifetimeAccess
  const betaTester = override.accessType === 'beta_tester' || override.betaTester
  const subscriptionPlan =
    lifetimeAccess || betaTester ? 'group' : override.subscriptionPlan

  const { error } = await supabase.rpc('admin_apply_workspace_access', {
    p_user_id: override.userId,
    p_access_type: override.accessType,
    p_subscription_plan: subscriptionPlan,
    p_trial_ends_at: lifetimeAccess ? null : override.trialEndsAt,
    p_lifetime_access: lifetimeAccess,
    p_beta_tester: betaTester,
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    ...override,
    subscriptionPlan,
    lifetimeAccess,
    betaTester,
    trialEndsAt: lifetimeAccess ? null : override.trialEndsAt,
    updatedAt: new Date().toISOString(),
  }
}

export async function fetchPlatformAdminUserIds(): Promise<Set<string>> {
  const supabase = tryGetSupabase()
  if (!supabase) return new Set()

  const { data, error } = await supabase.from('platform_admins').select('user_id')
  if (error) throw error
  return new Set((data ?? []).map((row) => String(row.user_id)))
}
