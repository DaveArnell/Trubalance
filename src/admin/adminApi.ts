import { isSupabaseConfigured, tryGetSupabase } from '../lib/supabase'
import { getAppEnvironmentLabel } from '../lib/appEnvironment'
import { deleteUserAccount } from '../services/accountDeletion'
import { logAdminAction } from '../services/adminRepository'
import { getAdminDataMode } from './services/adminDemoMode'
import {
  fetchAdminAuditLog,
  fetchAdminStats,
  fetchAdminUsers,
  fetchPayments,
  fetchRecentEvents,
  fetchSetupFunnelEvents,
  fetchWorkspaceEngagementMetrics,
} from '../services/adminRepository'
import {
  getMockAnalytics,
  getMockAuditLog,
  getMockDeveloperInfo,
  getMockEmailTemplates,
  getMockNotifications,
  getMockOverviewStats,
  getEmptyOverviewStats,
  getEmptyProductAnalytics,
  getMockPayments,
  getMockPlatformSettings,
  getMockProductAnalytics,
  getMockQrCodes,
  getMockRecentActivity,
  getMockSubscriptions,
  getMockSupportTickets,
  getMockUserById,
  getMockUserHealthRows,
  getMockUserTimeline,
  getMockUsers,
  getMockWorkspaceInspector,
} from './mockData'
import {
  addAdminNote,
  defaultAccessOverride,
  loadAccessOverride,
  loadAdminNotes,
  loadAllAdminNotes,
  purgeAdminLocalDataForUser,
  saveAccessOverride,
} from './services/adminLocalStorage'
import { computeUserHealth, isUserRecentlyActive, onboardingPctFromUser } from './utils/userHealth'
import type {
  AdminActivityRow,
  AdminAnalyticsSnapshot,
  AdminNote,
  AdminPaymentRow,
  AdminSubscriptionRow,
  AdminUserDetail,
  AdminUserFilter,
  AdminUserHealthRow,
  AdminUserListItem,
  AuditLogEntry,
  DeveloperInfo,
  EmailTemplateRow,
  HealthStatus,
  ListParams,
  NotificationTemplateRow,
  PaginatedResult,
  PlatformOverviewStats,
  PlatformSettings,
  ProductAnalyticsSnapshot,
  QrCodeRow,
  RiskStatus,
  SupportTicketRow,
  UserTimelineEvent,
  WorkspaceAccessOverride,
  WorkspaceInspectorData,
} from './types'
import { buildSetupFunnelSnapshot, emptySetupFunnelSnapshot } from './utils/setupFunnelStats'

const DEFAULT_PAGE_SIZE = 25

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  }
}

function filterUsers(
  users: AdminUserListItem[],
  search: string,
  filter: AdminUserFilter,
): AdminUserListItem[] {
  let result = users
  const q = search.trim().toLowerCase()

  if (q) {
    result = result.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.businessNames.some((b) => b.toLowerCase().includes(q)),
    )
  }

  switch (filter) {
    case 'trial':
      return result.filter((u) => u.subscriptionStatus === 'trialing')
    case 'paid':
      return result.filter((u) => u.subscriptionStatus === 'active')
    case 'lifetime':
      return result.filter((u) => u.lifetimeAccess)
    case 'cancelled':
      return result.filter((u) => u.subscriptionStatus === 'canceled' || u.subscriptionStatus === 'expired')
    case 'active':
      return result.filter((u) => u.isActive)
    case 'inactive':
      return result.filter((u) => !u.isActive)
    default:
      return result
  }
}

async function useMockData(): Promise<boolean> {
  if (isSupabaseConfigured) return false
  return getAdminDataMode() === 'demo'
}

/** Platform overview dashboard stats + activity feeds. */
export async function adminFetchOverview(): Promise<{
  stats: PlatformOverviewStats
  recentActivity: AdminActivityRow[]
  usersAtRisk: AdminUserHealthRow[]
  recentNotes: AdminNote[]
}> {
  if (await useMockData()) {
    const health = getMockUserHealthRows()
    return {
      stats: getMockOverviewStats(),
      recentActivity: getMockRecentActivity(),
      usersAtRisk: health
        .filter((r) => r.riskStatus === 'high' || r.healthStatus === 'red')
        .slice(0, 8),
      recentNotes: loadAllAdminNotes().slice(0, 6),
    }
  }

  if (!isSupabaseConfigured) {
    return {
      stats: getEmptyOverviewStats(),
      recentActivity: [],
      usersAtRisk: [],
      recentNotes: loadAllAdminNotes().slice(0, 6),
    }
  }

  const legacy = await fetchAdminStats()
  const events = await fetchRecentEvents(20)
  const trialUsers = Math.max(0, legacy.totalUsers - legacy.activeSubscriptions)
  return {
    stats: {
      totalUsers: legacy.totalUsers,
      activeUsers: legacy.totalUsers,
      newUsersToday: legacy.signupsToday,
      newUsersWeek: legacy.signupsWeek,
      newUsersMonth: legacy.signupsMonth,
      trialUsers,
      payingUsers: legacy.activeSubscriptions,
      lifetimeUsers: 0,
      betaUsers: 0,
      cancelledUsers: 0,
      staleUsers: 0,
      usersNeedingHelp: 0,
      totalBalanceUpdates: 0,
      totalReservePlanners: 0,
      onboardingCompletionPct: 0,
      mrrCents: 0,
      arrCents: 0,
      trialConversionRate: 0,
      dau: legacy.loginsToday,
      wau: 0,
      mau: 0,
    },
    recentActivity: events.map((e) => ({
      id: e.id,
      type: e.eventType === 'signup' ? 'signup' : e.eventType === 'login' ? 'login' : 'alert',
      title: e.eventType,
      subtitle: e.email,
      createdAt: e.createdAt,
    })),
    usersAtRisk: (await adminFetchUserHealth({ page: 1, pageSize: 200 }))
      .items.filter((r) => r.riskStatus === 'high' || r.healthStatus === 'red' || r.healthStatus === 'orange')
      .slice(0, 8),
    recentNotes: loadAllAdminNotes().slice(0, 6),
  }
}

async function enrichUsersWithWorkspaceData(
  users: Awaited<ReturnType<typeof fetchAdminUsers>>['items'],
): Promise<AdminUserListItem[]> {
  const supabase = tryGetSupabase()
  return Promise.all(
    users.map(async (u) => {
      let businessCount = 0
      let businessNames: string[] = []
      let venueCount = 0
      let accountCount = 0
      let commitmentCount = 0
      let reservePlannerCount = 0
      let lastBalanceUpdateAt: string | null = null
      let hasGroup = false

      if (supabase && u.workspaceId) {
        const [{ data: businesses }, { count: gCount }, engagement] = await Promise.all([
          supabase.from('businesses').select('id, name').eq('workspace_id', u.workspaceId),
          supabase.from('groups').select('id', { count: 'exact', head: true }).eq('workspace_id', u.workspaceId),
          fetchWorkspaceEngagementMetrics(u.workspaceId),
        ])
        if (businesses) {
          businessCount = businesses.length
          businessNames = businesses.map((b) => String(b.name))
        }
        hasGroup = (gCount ?? 0) > 0
        venueCount = engagement.venueCount
        accountCount = engagement.accountCount
        commitmentCount = engagement.commitmentCount
        reservePlannerCount = engagement.reservePlannerCount
        lastBalanceUpdateAt = engagement.lastBalanceUpdateAt
      }

      const override = loadAccessOverride(u.id)
      const tierFromUsage =
        hasGroup || businessCount > 1 ? 'group' : 'solo'

      const resolvedTier = override?.subscriptionPlan
        ?? (u.plan !== 'free' ? u.plan : tierFromUsage)
      const resolvedStatus = override
        ? (override.accessType === 'lifetime' ? 'lifetime'
          : override.accessType === 'paid' ? 'active'
          : override.accessType === 'cancelled' ? 'canceled'
          : 'trialing')
        : (u.subscriptionStatus === 'trialing' || u.subscriptionStatus === 'free')
          ? 'trialing'
          : u.subscriptionStatus

      const lastLoginAt = u.lastSignInAt

      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        subscriptionTier: resolvedTier as AdminUserListItem['subscriptionTier'],
        subscriptionStatus: resolvedStatus as AdminUserListItem['subscriptionStatus'],
        trialEndsAt: override?.trialEndsAt ?? null,
        businessCount,
        businessNames,
        workspaceName: u.workspaceName,
        lastLoginAt,
        lastBalanceUpdateAt,
        createdAt: u.createdAt,
        isActive: isUserRecentlyActive(lastLoginAt, lastBalanceUpdateAt),
        lifetimeAccess: override?.lifetimeAccess ?? false,
        betaTester: override?.betaTester ?? false,
        isPlatformAdmin: u.role === 'admin' || u.role === 'super_admin',
        venueCount,
        accountCount,
        commitmentCount,
        reservePlannerCount,
        onboardingCompleted: u.onboardingCompleted,
      }
    }),
  )
}

function buildHealthRowFromUser(u: AdminUserListItem & {
  venueCount?: number
  accountCount?: number
  commitmentCount?: number
  reservePlannerCount?: number
  onboardingCompleted?: boolean
}): AdminUserHealthRow {
  const venueCount = u.venueCount ?? 0
  const accountCount = u.accountCount ?? 0
  const commitmentCount = u.commitmentCount ?? 0
  const reservePlannerCount = u.reservePlannerCount ?? 0
  const onboardingPct = onboardingPctFromUser({
    businessCount: u.businessCount,
    accountCount,
    commitmentCount,
    reservePlannerCount,
    onboardingCompleted: u.onboardingCompleted ?? false,
  })
  const { healthStatus, riskStatus } = computeUserHealth({
    lastLoginAt: u.lastLoginAt,
    lastBalanceUpdateAt: u.lastBalanceUpdateAt,
    onboardingPct,
    trialEndsAt: u.trialEndsAt,
    isActive: u.isActive,
  })

  return {
    userId: u.id,
    fullName: u.fullName,
    email: u.email,
    workspaceName: u.workspaceName ?? '—',
    plan: u.subscriptionTier,
    subscriptionStatus: u.subscriptionStatus,
    trialEndsAt: u.trialEndsAt,
    lastLoginAt: u.lastLoginAt,
    lastBalanceUpdateAt: u.lastBalanceUpdateAt,
    businessCount: u.businessCount,
    venueCount,
    accountCount,
    commitmentCount,
    reservePlannerCount,
    onboardingPct,
    healthStatus,
    riskStatus,
  }
}

export async function adminFetchUsers(
  params: ListParams & { filter?: AdminUserFilter },
): Promise<PaginatedResult<AdminUserListItem>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  const filter = (params.filter ?? 'all') as AdminUserFilter

  if (await useMockData()) {
    const filtered = filterUsers(getMockUsers(), params.search ?? '', filter)
    return paginate(filtered, page, pageSize)
  }

  if (!isSupabaseConfigured) {
    return paginate([], page, pageSize)
  }

  const legacy = await fetchAdminUsers(page, pageSize, params.search ?? '')
  const enriched = await enrichUsersWithWorkspaceData(legacy.items)
  return {
    items: enriched,
    total: legacy.total,
    page: legacy.page,
    pageSize: legacy.pageSize,
  }
}

export async function adminFetchUserDetail(userId: string): Promise<AdminUserDetail | null> {
  if (await useMockData()) {
    const detail = getMockUserById(userId)
    if (!detail) return null
    const override = loadAccessOverride(userId)
    if (override) {
      return {
        ...detail,
        subscriptionTier: override.subscriptionPlan,
        lifetimeAccess: override.lifetimeAccess,
        betaTester: override.betaTester,
        trialEndsAt: override.trialEndsAt,
        subscriptionStatus:
          override.accessType === 'lifetime'
            ? 'lifetime'
            : override.accessType === 'cancelled'
              ? 'canceled'
              : override.accessType === 'paid'
                ? 'active'
                : detail.subscriptionStatus,
      }
    }
    return detail
  }
  const supabase = tryGetSupabase()
  if (!supabase) return null

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (!profileRow) return null

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, plan')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()

  let businessCount = 0
  let businessNames: string[] = []
  let venueCount = 0
  let accountCount = 0
  let reservePlannerCount = 0
  let commitmentCount = 0
  let expectedReceiptCount = 0
  let latestTrueBalance: number | null = null
  let lastBalanceUpdateAt: string | null = null

  let hasGroup = false

  if (workspace?.id) {
    const [bizRes, engagement, snapRes, grpRes] = await Promise.all([
      supabase.from('businesses').select('id, name').eq('workspace_id', workspace.id),
      fetchWorkspaceEngagementMetrics(workspace.id),
      supabase.from('balance_snapshots').select('true_balance').eq('workspace_id', workspace.id).order('date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('groups').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    ])
    if (bizRes.data) {
      businessCount = bizRes.data.length
      businessNames = bizRes.data.map((b) => String(b.name))
    }
    venueCount = engagement.venueCount
    accountCount = engagement.accountCount
    reservePlannerCount = engagement.reservePlannerCount
    commitmentCount = engagement.commitmentCount
    lastBalanceUpdateAt = engagement.lastBalanceUpdateAt
    latestTrueBalance = snapRes.data ? Number(snapRes.data.true_balance) : null
    hasGroup = (grpRes.count ?? 0) > 0
    expectedReceiptCount = 0
    const { count: recCount } = await supabase
      .from('expected_receipts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
    expectedReceiptCount = recCount ?? 0
  }

  const tierFromUsage =
    hasGroup || businessCount > 1 ? 'group' : 'solo'

  const override = loadAccessOverride(userId)

  const resolvedTier = override?.subscriptionPlan
    ?? (workspace?.plan !== 'free' ? workspace?.plan : tierFromUsage)
  const resolvedStatus = override
    ? (override.accessType === 'lifetime' ? 'lifetime'
      : override.accessType === 'paid' ? 'active'
      : override.accessType === 'cancelled' ? 'canceled'
      : 'trialing')
    : 'trialing'
  const resolvedLifetime = override?.lifetimeAccess ?? false
  const resolvedBeta = override?.betaTester ?? false
  const resolvedTrialEnds = override?.trialEndsAt ?? null
  const onboardingCompleted = Boolean(profileRow.onboarding_completed)
  const onboardingPct = onboardingPctFromUser({
    businessCount,
    accountCount,
    commitmentCount,
    reservePlannerCount,
    onboardingCompleted,
  })
  const lastLoginAt = profileRow.last_sign_in_at ? String(profileRow.last_sign_in_at) : null

  return {
    id: String(profileRow.id),
    fullName: String(profileRow.full_name ?? ''),
    email: String(profileRow.email ?? ''),
    subscriptionTier: resolvedTier as AdminUserDetail['subscriptionTier'],
    subscriptionStatus: resolvedStatus as AdminUserDetail['subscriptionStatus'],
    trialEndsAt: resolvedTrialEnds,
    businessCount,
    businessNames,
    workspaceName: workspace?.name ?? null,
    lastLoginAt,
    lastBalanceUpdateAt,
    createdAt: String(profileRow.created_at ?? ''),
    isActive: isUserRecentlyActive(lastLoginAt, lastBalanceUpdateAt),
    lifetimeAccess: resolvedLifetime,
    betaTester: resolvedBeta,
    isPlatformAdmin: profileRow.role === 'admin' || profileRow.role === 'super_admin',
    phone: null,
    emailVerified: true,
    onboardingCompleted,
    onboardingPct,
    workspaceId: workspace?.id ?? null,
    invitedUsers: 0,
    venueCount,
    accountCount,
    reservePlannerCount,
    commitmentCount,
    expectedReceiptCount,
    latestTrueBalance,
    latestCashBalance: null,
    latestCommittedTotal: null,
    latestExpectedReceipts: null,
    freshnessStatus: 'unknown',
    notificationEmail: true,
    notificationInApp: true,
    recentLogins: [],
    recentActivity: [],
    recentBalanceUpdates: [],
    recentReports: [],
    emailHistory: [],
    supportTickets: [],
    adminNotes: loadAdminNotes(userId).map((note) => note.text).join('\n'),
    subscriptionRenewalAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  }
}

export async function adminFetchUserHealth(
  params: ListParams & {
    health?: HealthStatus | 'all'
    risk?: RiskStatus | 'all'
    sortKey?: string
    sortDir?: 'asc' | 'desc'
  },
): Promise<PaginatedResult<AdminUserHealthRow>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  const sortDir = params.sortDir ?? 'asc'

  if (await useMockData()) {
    let rows = getMockUserHealthRows()
    const q = params.search?.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.workspaceName.toLowerCase().includes(q),
      )
    }
    if (params.health && params.health !== 'all') {
      rows = rows.filter((r) => r.healthStatus === params.health)
    }
    if (params.risk && params.risk !== 'all') {
      rows = rows.filter((r) => r.riskStatus === params.risk)
    }
    if (params.sortKey) {
      const key = params.sortKey as keyof AdminUserHealthRow
      rows = [...rows].sort((a, b) => {
        const av = a[key]
        const bv = b[key]
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    }
    return paginate(rows, page, pageSize)
  }

  const supabase = tryGetSupabase()
  if (!supabase) return paginate([], page, pageSize)

  const allUsers = await adminFetchUsers({ page: 1, pageSize: 200 })
  let rows: AdminUserHealthRow[] = allUsers.items.map(buildHealthRowFromUser)

  const q = params.search?.trim().toLowerCase()
  if (q) {
    rows = rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.workspaceName.toLowerCase().includes(q),
    )
  }
  if (params.health && params.health !== 'all') {
    rows = rows.filter((r) => r.healthStatus === params.health)
  }
  if (params.risk && params.risk !== 'all') {
    rows = rows.filter((r) => r.riskStatus === params.risk)
  }
  if (params.sortKey) {
    const key = params.sortKey as keyof AdminUserHealthRow
    rows = [...rows].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
  }
  return paginate(rows, page, pageSize)
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 999
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)))
}

export async function adminFetchUserTimeline(userId: string): Promise<UserTimelineEvent[]> {
  const storedNotes = loadAdminNotes(userId)
  const noteEvents: UserTimelineEvent[] = storedNotes.map((n) => ({
    id: n.id,
    type: 'admin_note_added',
    label: 'Admin note added',
    detail: n.text,
    at: n.createdAt,
  }))

  if (await useMockData()) {
    return [...noteEvents, ...getMockUserTimeline(userId)].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    )
  }
  return noteEvents
}

export async function adminFetchWorkspaceInspector(
  userId: string,
): Promise<WorkspaceInspectorData | null> {
  if (await useMockData()) return getMockWorkspaceInspector(userId)

  const supabase = tryGetSupabase()
  if (!supabase) return null

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()
  if (!workspace) return null

  const [bizRes, venRes, accRes, comRes, recRes, rpRes, snapRes, commitSample, receiptSample, rpSample] =
    await Promise.all([
      supabase.from('businesses').select('id, name').eq('workspace_id', workspace.id),
      supabase.from('venues').select('id, business_id', { count: 'exact' }).eq('workspace_id', workspace.id),
      supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
      supabase.from('commitments').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
      supabase.from('expected_receipts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
      supabase.from('reserve_planners').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
      supabase.from('balance_snapshots').select('date, true_balance').eq('workspace_id', workspace.id).order('date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('commitments').select('name, amount, due_day').eq('workspace_id', workspace.id).limit(5),
      supabase.from('expected_receipts').select('name, amount, expected_date').eq('workspace_id', workspace.id).limit(5),
      supabase.from('reserve_planners').select('name, monthly_deposit').eq('workspace_id', workspace.id).limit(5),
    ])

  const businesses = (bizRes.data ?? []).map((b) => {
    const bVenues = (venRes.data ?? []).filter((v) => (v as { business_id: string }).business_id === b.id)
    return {
      id: String(b.id),
      name: String(b.name),
      venueCount: bVenues.length,
      accountCount: 0,
    }
  })

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name ?? '',
    businesses,
    venueCount: venRes.count ?? 0,
    accountCount: accRes.count ?? 0,
    commitmentCount: comRes.count ?? 0,
    expectedReceiptCount: recRes.count ?? 0,
    reservePlannerCount: rpRes.count ?? 0,
    latestTrueBalance: snapRes.data ? Number(snapRes.data.true_balance) : null,
    latestCashBalance: null,
    latestCommittedTotal: null,
    latestExpectedReceipts: null,
    lastBalanceUpdateAt: snapRes.data?.date ? String(snapRes.data.date) : null,
    freshnessStatus: snapRes.data?.date ? (daysSince(String(snapRes.data.date)) <= 2 ? 'fresh' : daysSince(String(snapRes.data.date)) <= 7 ? 'aging' : 'stale') : 'unknown',
    committedFundsSample: (commitSample.data ?? []).map((c) => ({
      name: String((c as Record<string, unknown>).name ?? ''),
      amount: Number((c as Record<string, unknown>).amount ?? 0),
      dueLabel: `Day ${(c as Record<string, unknown>).due_day ?? '?'}`,
    })),
    expectedReceiptsSample: (receiptSample.data ?? []).map((r) => ({
      name: String((r as Record<string, unknown>).name ?? ''),
      amount: Number((r as Record<string, unknown>).amount ?? 0),
      dueLabel: (r as Record<string, unknown>).expected_date ? String((r as Record<string, unknown>).expected_date) : '—',
    })),
    reservePlannersSample: (rpSample.data ?? []).map((p) => ({
      name: String((p as Record<string, unknown>).name ?? ''),
      target: Number((p as Record<string, unknown>).monthly_deposit ?? 0),
      status: 'Active',
    })),
  }
}

export async function adminFetchAdminNotes(userId: string): Promise<AdminNote[]> {
  return loadAdminNotes(userId)
}

export async function adminCreateAdminNote(userId: string, text: string): Promise<AdminNote> {
  return addAdminNote(userId, text)
}

export async function adminFetchAccessOverride(userId: string): Promise<WorkspaceAccessOverride> {
  const stored = loadAccessOverride(userId)
  if (stored) return stored
  const user = await adminFetchUserDetail(userId)
  if (!user) {
    return defaultAccessOverride(userId, 'solo', null)
  }
  return defaultAccessOverride(userId, user.subscriptionTier, user.trialEndsAt)
}

export async function adminSaveAccessOverride(
  override: WorkspaceAccessOverride,
): Promise<WorkspaceAccessOverride> {
  return saveAccessOverride(override)
}

export async function adminDeleteUser(
  userId: string,
  adminUserId: string,
): Promise<{ error: string | null }> {
  if (await useMockData()) {
    purgeAdminLocalDataForUser(userId)
    return { error: null }
  }

  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not configured.' }
  }

  const detail = await adminFetchUserDetail(userId)
  const { error } = await deleteUserAccount(userId)
  if (error) return { error }

  purgeAdminLocalDataForUser(userId)
  await logAdminAction(adminUserId, 'delete_user', userId, detail?.workspaceId ?? undefined, {
    email: detail?.email,
  })
  return { error: null }
}

export async function adminFetchProductAnalytics(): Promise<ProductAnalyticsSnapshot> {
  if (await useMockData()) return getMockProductAnalytics()
  if (!isSupabaseConfigured) return getEmptyProductAnalytics()

  const supabase = tryGetSupabase()
  if (!supabase) return getEmptyProductAnalytics()

  const [
    usersRes,
    workspacesRes,
    businessesRes,
    venuesRes,
    accountsRes,
    commitmentsRes,
    reserveRes,
    snapshotsRes,
    receiptsRes,
    funnelEvents,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('workspaces').select('id', { count: 'exact', head: true }),
    supabase.from('businesses').select('id', { count: 'exact', head: true }),
    supabase.from('venues').select('id', { count: 'exact', head: true }),
    supabase.from('accounts').select('id', { count: 'exact', head: true }),
    supabase.from('commitments').select('id', { count: 'exact', head: true }),
    supabase.from('reserve_planners').select('id', { count: 'exact', head: true }),
    supabase.from('balance_snapshots').select('id', { count: 'exact', head: true }),
    supabase.from('expected_receipts').select('id', { count: 'exact', head: true }),
    fetchSetupFunnelEvents(),
  ])

  const totalUsers = usersRes.count ?? 0
  const setupFunnel = funnelEvents.length > 0 ? buildSetupFunnelSnapshot(funnelEvents) : emptySetupFunnelSnapshot()
  const onboardingCompletionRate =
    setupFunnel.usersStarted > 0 ? setupFunnel.usersCompleted / setupFunnel.usersStarted : 0
  return {
    totalUsers,
    activeUsers: totalUsers,
    workspacesCreated: workspacesRes.count ?? 0,
    businessesCreated: businessesRes.count ?? 0,
    venuesCreated: venuesRes.count ?? 0,
    accountsCreated: accountsRes.count ?? 0,
    committedFundsCreated: commitmentsRes.count ?? 0,
    reservePlannersCreated: reserveRes.count ?? 0,
    balanceUpdatesCreated: snapshotsRes.count ?? 0,
    graphSnapshotsCreated: snapshotsRes.count ?? 0,
    expectedReceiptsCreated: receiptsRes.count ?? 0,
    avgDaysBetweenBalanceUpdates: 0,
    usersWithStaleBalances: 0,
    usersWithNoCommittedFunds: 0,
    usersWithNoReservePlanner: 0,
    onboardingCompletionRate,
    dailySignups: [],
    featureUsage: [
      { feature: 'Balance updates', count: snapshotsRes.count ?? 0 },
      { feature: 'Monthly costs', count: commitmentsRes.count ?? 0 },
      { feature: 'Reserve planners', count: reserveRes.count ?? 0 },
      { feature: 'Expected receipts', count: receiptsRes.count ?? 0 },
      { feature: 'Accounts', count: accountsRes.count ?? 0 },
      { feature: 'Venues', count: venuesRes.count ?? 0 },
    ],
    setupFunnel,
  }
}

export async function adminFetchSubscriptions(
  params: ListParams,
): Promise<PaginatedResult<AdminSubscriptionRow>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  if (await useMockData()) {
    let items = getMockSubscriptions()
    const q = params.search?.trim().toLowerCase()
    if (q) {
      items = items.filter(
        (s) => s.userEmail.toLowerCase().includes(q) || s.userName.toLowerCase().includes(q),
      )
    }
    return paginate(items, page, pageSize)
  }

  const allUsers = await adminFetchUsers({ page: 1, pageSize: 200 })
  const TRIAL_DAYS = 90
  let items: AdminSubscriptionRow[] = allUsers.items.map((u) => {
    const created = new Date(u.createdAt)
    const trialEnd = new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
    return {
      id: u.id,
      userId: u.id,
      userName: u.fullName,
      userEmail: u.email,
      plan: u.subscriptionTier as AdminSubscriptionRow['plan'],
      status: u.subscriptionStatus as AdminSubscriptionRow['status'],
      trialEndsAt: trialEnd.toISOString(),
      renewalAt: null,
      paymentStatus: u.subscriptionStatus === 'active' ? 'paid' : 'n/a',
      stripeSubscriptionId: null,
      lifetimeAccess: u.lifetimeAccess,
    }
  })

  const q = params.search?.trim().toLowerCase()
  if (q) {
    items = items.filter(
      (s) => s.userEmail.toLowerCase().includes(q) || s.userName.toLowerCase().includes(q),
    )
  }
  return paginate(items, page, pageSize)
}

export async function adminFetchPayments(params: ListParams): Promise<PaginatedResult<AdminPaymentRow>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  if (await useMockData()) return paginate(getMockPayments(), page, pageSize)

  const legacy = await fetchPayments(page, pageSize)
  return {
    items: legacy.items.map((p) => ({
      id: p.id,
      userEmail: '—',
      workspaceName: p.workspaceName ?? '—',
      amountCents: p.amountCents,
      currency: p.currency,
      status: p.status === 'succeeded' ? 'succeeded' : 'failed',
      description: p.description,
      plan: 'solo',
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
    total: legacy.total,
    page: legacy.page,
    pageSize: legacy.pageSize,
  }
}

export async function adminFetchAnalytics(): Promise<AdminAnalyticsSnapshot> {
  if (await useMockData()) return getMockAnalytics()
  return getMockAnalytics()
}

export async function adminFetchSupportTickets(
  params: ListParams,
): Promise<PaginatedResult<SupportTicketRow>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  if (await useMockData()) return paginate(getMockSupportTickets(), page, pageSize)
  return paginate([], page, pageSize)
}

export async function adminFetchEmailTemplates(): Promise<EmailTemplateRow[]> {
  return getMockEmailTemplates()
}

export async function adminFetchNotifications(): Promise<NotificationTemplateRow[]> {
  return getMockNotifications()
}

export async function adminFetchQrCodes(): Promise<QrCodeRow[]> {
  return getMockQrCodes()
}

export async function adminFetchPlatformSettings(): Promise<PlatformSettings> {
  return getMockPlatformSettings()
}

export async function adminFetchAuditLog(params: ListParams): Promise<PaginatedResult<AuditLogEntry>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  if (await useMockData()) return paginate(getMockAuditLog(), page, pageSize)

  const legacy = await fetchAdminAuditLog(100)
  const items: AuditLogEntry[] = legacy.map((r) => ({
    id: r.id,
    adminEmail: r.adminEmail ?? '—',
    action: r.action,
    target: r.targetEmail,
    metadata: null,
    createdAt: r.createdAt,
  }))
  return paginate(items, page, pageSize)
}

export async function adminFetchDeveloperInfo(): Promise<DeveloperInfo> {
  const info = getMockDeveloperInfo()
  return {
    ...info,
    supabaseConfigured: isSupabaseConfigured,
    environment: getAppEnvironmentLabel(),
  }
}
