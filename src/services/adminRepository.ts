import { tryGetSupabase } from '../lib/supabase'
import { isLocalDevMode } from '../lib/devMode'
import {
  getLocalDevAdminStats,
  getLocalDevAdminUsers,
  getLocalDevAuditLog,
  getLocalDevEvents,
  getLocalDevPageViews,
} from './adminLocalDev'

export type UserRole = 'user' | 'admin' | 'super_admin'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: UserRole
  createdAt: string
  lastSignInAt: string | null
  onboardingCompleted: boolean
}

export interface AdminUserRow extends UserProfile {
  workspaceId: string | null
  workspaceName: string | null
  plan: string
  subscriptionStatus: string
  latestTrueBalance: number | null
}

export interface PaymentRow {
  id: string
  workspaceId: string
  workspaceName: string | null
  amountCents: number
  currency: string
  status: string
  description: string | null
  paidAt: string | null
  createdAt: string
}

export interface AdminStats {
  totalUsers: number
  signupsToday: number
  signupsWeek: number
  signupsMonth: number
  activeSubscriptions: number
  totalRevenueCents: number
  loginsToday: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    fullName: String(row.full_name ?? ''),
    role: (row.role as UserRole) ?? 'user',
    createdAt: String(row.created_at),
    lastSignInAt: row.last_sign_in_at ? String(row.last_sign_in_at) : null,
    onboardingCompleted: Boolean(row.onboarding_completed),
  }
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const supabase = tryGetSupabase()
  if (!supabase) {
    if (isLocalDevMode()) return getLocalDevAdminStats()
    return {
      totalUsers: 0,
      signupsToday: 0,
      signupsWeek: 0,
      signupsMonth: 0,
      activeSubscriptions: 0,
      totalRevenueCents: 0,
      loginsToday: 0,
    }
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [usersRes, subsRes, paymentsRes, activeWeekRes, signupsTodayRes, signupsWeekRes, signupsMonthRes] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('payments').select('amount_cents').eq('status', 'succeeded'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_sign_in_at', weekStart),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekStart),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart),
    ])

  const totalRevenueCents = (paymentsRes.data ?? []).reduce(
    (sum, row) => sum + Number((row as { amount_cents: number }).amount_cents ?? 0),
    0,
  )

  return {
    totalUsers: usersRes.count ?? 0,
    signupsToday: signupsTodayRes.count ?? 0,
    signupsWeek: signupsWeekRes.count ?? 0,
    signupsMonth: signupsMonthRes.count ?? 0,
    activeSubscriptions: subsRes.count ?? 0,
    totalRevenueCents,
    loginsToday: activeWeekRes.count ?? 0,
  }
}

export async function fetchAdminUsers(
  page: number,
  pageSize: number,
  search = '',
): Promise<PaginatedResult<AdminUserRow>> {
  const supabase = tryGetSupabase()
  if (!supabase) {
    if (isLocalDevMode()) {
      const items = getLocalDevAdminUsers().filter((row) => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return row.email.toLowerCase().includes(q) || row.fullName.toLowerCase().includes(q)
      })
      return { items, total: items.length, page, pageSize }
    }
    return { items: [], total: 0, page, pageSize }
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search.trim()) {
    query = query.or(`email.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%`)
  }

  const { data, count, error } = await query
  if (error) throw error

  const items: AdminUserRow[] = await Promise.all(
    (data ?? []).map(async (row) => {
      const raw = row as Record<string, unknown>
      const profile = mapProfile(raw)

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id, name, plan')
        .eq('owner_id', profile.id)
        .limit(1)
        .maybeSingle()

      let subscriptionStatus = 'free'
      if (workspace?.id) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('workspace_id', workspace.id)
          .maybeSingle()
        subscriptionStatus = sub?.status ?? 'free'
      }

      let latestTrueBalance: number | null = null
      if (workspace?.id) {
        const { data: snap } = await supabase
          .from('balance_snapshots')
          .select('true_balance')
          .eq('workspace_id', workspace.id)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()
        latestTrueBalance = snap ? Number(snap.true_balance) : null
      }

      return {
        ...profile,
        workspaceId: workspace?.id ?? null,
        workspaceName: workspace?.name ?? null,
        plan: workspace?.plan ?? 'free',
        subscriptionStatus,
        latestTrueBalance,
      }
    }),
  )

  return { items, total: count ?? 0, page, pageSize }
}

export async function fetchPayments(
  page: number,
  pageSize: number,
): Promise<PaginatedResult<PaymentRow>> {
  const supabase = tryGetSupabase()
  if (!supabase) return { items: [], total: 0, page, pageSize }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('payments')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const items: PaymentRow[] = await Promise.all(
    (data ?? []).map(async (row) => {
      const raw = row as Record<string, unknown>
      const workspaceId = String(raw.workspace_id)
      const { data: ws } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .maybeSingle()

      return {
        id: String(raw.id),
        workspaceId,
        workspaceName: ws?.name ?? null,
        amountCents: Number(raw.amount_cents),
        currency: String(raw.currency),
        status: String(raw.status),
        description: raw.description ? String(raw.description) : null,
        paidAt: raw.paid_at ? String(raw.paid_at) : null,
        createdAt: String(raw.created_at),
      }
    }),
  )

  return { items, total: count ?? 0, page, pageSize }
}

export async function fetchRecentEvents(limit = 50) {
  const supabase = tryGetSupabase()
  if (!supabase) return isLocalDevMode() ? getLocalDevEvents().slice(0, limit) : []

  const { data } = await supabase
    .from('user_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  const userIds = [...new Set((data ?? []).map((row) => (row as { user_id: string }).user_id).filter(Boolean))]
  const emailById = new Map<string, string>()

  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds)
    for (const p of profiles ?? []) {
      emailById.set(p.id, p.email ?? '')
    }
  }

  return (data ?? []).map((row) => {
    const raw = row as Record<string, unknown>
    const userId = raw.user_id ? String(raw.user_id) : null
    return {
      id: String(raw.id),
      eventType: String(raw.event_type),
      email: userId ? emailById.get(userId) ?? null : null,
      metadata: raw.metadata as Record<string, unknown>,
      createdAt: String(raw.created_at),
    }
  })
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId?: string,
  targetWorkspaceId?: string,
  metadata?: Record<string, unknown>,
) {
  const supabase = tryGetSupabase()
  if (!supabase) return

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId ?? null,
    target_workspace_id: targetWorkspaceId ?? null,
    metadata: metadata ?? {},
  })
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null

  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (!data) return null
  return mapProfile(data as Record<string, unknown>)
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  const supabase = tryGetSupabase()
  if (!supabase) return
  await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId)
}

export interface PageViewStat {
  page: string
  count: number
}

export async function fetchPageViewStats(): Promise<PageViewStat[]> {
  const supabase = tryGetSupabase()
  if (!supabase) return isLocalDevMode() ? getLocalDevPageViews() : []

  const { data } = await supabase
    .from('user_events')
    .select('metadata')
    .eq('event_type', 'page_view')
    .order('created_at', { ascending: false })
    .limit(5000)

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const meta = (row as { metadata?: { page?: string } }).metadata
    const page = meta?.page ?? 'unknown'
    counts.set(page, (counts.get(page) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
}

export interface UserEventRow {
  id: string
  eventType: string
  metadata: Record<string, unknown>
  createdAt: string
}

export async function fetchUserEvents(userId: string, limit = 50): Promise<UserEventRow[]> {
  const supabase = tryGetSupabase()
  if (!supabase) return []

  const { data } = await supabase
    .from('user_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((row) => {
    const raw = row as Record<string, unknown>
    return {
      id: String(raw.id),
      eventType: String(raw.event_type),
      metadata: (raw.metadata as Record<string, unknown>) ?? {},
      createdAt: String(raw.created_at),
    }
  })
}

export interface WorkspaceSummary {
  workspaceId: string
  workspaceName: string
  plan: string
  groups: number
  businesses: number
  venues: number
  accounts: number
  commitments: number
  reservePlanners: number
  snapshots: number
  historyRecords: number
}

export async function fetchWorkspaceSummary(workspaceId: string): Promise<WorkspaceSummary | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null

  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, name, plan')
    .eq('id', workspaceId)
    .maybeSingle()
  if (!ws) return null

  const count = async (table: string) => {
    const { count: n } = await supabase!
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
    return n ?? 0
  }

  const [groups, businesses, venues, accounts, commitments, reservePlanners, snapshots] =
    await Promise.all([
      count('groups'),
      count('businesses'),
      count('venues'),
      count('accounts'),
      count('commitments'),
      count('reserve_planners'),
      count('balance_snapshots'),
    ])

  let historyRecords = 0
  try {
    historyRecords = await count('history_records')
  } catch {
    historyRecords = 0
  }

  return {
    workspaceId,
    workspaceName: ws.name,
    plan: ws.plan,
    groups,
    businesses,
    venues,
    accounts,
    commitments,
    reservePlanners,
    snapshots,
    historyRecords,
  }
}

export interface WorkspaceEngagementMetrics {
  venueCount: number
  accountCount: number
  commitmentCount: number
  reservePlannerCount: number
  lastBalanceUpdateAt: string | null
}

export async function fetchWorkspaceEngagementMetrics(
  workspaceId: string,
): Promise<WorkspaceEngagementMetrics> {
  const supabase = tryGetSupabase()
  if (!supabase) {
    return {
      venueCount: 0,
      accountCount: 0,
      commitmentCount: 0,
      reservePlannerCount: 0,
      lastBalanceUpdateAt: null,
    }
  }

  const [venRes, accRes, comRes, rpRes, snapRes, accUpdatedRes] = await Promise.all([
    supabase.from('venues').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('commitments').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('reserve_planners').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase
      .from('balance_snapshots')
      .select('date')
      .eq('workspace_id', workspaceId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('updated_at')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const snapshotDate = snapRes.data?.date ? String(snapRes.data.date) : null
  const accountUpdatedAt = accUpdatedRes.data?.updated_at ? String(accUpdatedRes.data.updated_at) : null
  let lastBalanceUpdateAt: string | null = snapshotDate
  if (accountUpdatedAt) {
    if (!lastBalanceUpdateAt || accountUpdatedAt > lastBalanceUpdateAt) {
      lastBalanceUpdateAt = accountUpdatedAt
    }
  }

  return {
    venueCount: venRes.count ?? 0,
    accountCount: accRes.count ?? 0,
    commitmentCount: comRes.count ?? 0,
    reservePlannerCount: rpRes.count ?? 0,
    lastBalanceUpdateAt,
  }
}

export interface AuditLogRow {
  id: string
  adminEmail: string | null
  action: string
  targetEmail: string | null
  createdAt: string
}

export async function fetchAdminAuditLog(limit = 50): Promise<AuditLogRow[]> {
  const supabase = tryGetSupabase()
  if (!supabase) return isLocalDevMode() ? getLocalDevAuditLog().slice(0, limit) : []

  const { data } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  const userIds = new Set<string>()
  for (const row of data ?? []) {
    const raw = row as Record<string, unknown>
    if (raw.admin_id) userIds.add(String(raw.admin_id))
    if (raw.target_user_id) userIds.add(String(raw.target_user_id))
  }

  const emailById = new Map<string, string>()
  if (userIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', [...userIds])
    for (const p of profiles ?? []) {
      emailById.set(p.id, p.email ?? '')
    }
  }

  return (data ?? []).map((row) => {
    const raw = row as Record<string, unknown>
    return {
      id: String(raw.id),
      adminEmail: raw.admin_id ? emailById.get(String(raw.admin_id)) ?? null : null,
      action: String(raw.action),
      targetEmail: raw.target_user_id ? emailById.get(String(raw.target_user_id)) ?? null : null,
      createdAt: String(raw.created_at),
    }
  })
}
