import { isSupabaseConfigured } from '../lib/supabase'
import { getAppEnvironmentLabel } from '../lib/appEnvironment'
import { getAdminDataMode } from './services/adminDemoMode'
import {
  fetchAdminAuditLog,
  fetchAdminStats,
  fetchAdminUsers,
  fetchPayments,
  fetchRecentEvents,
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
  saveAccessOverride,
} from './services/adminLocalStorage'
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
  return {
    stats: {
      totalUsers: legacy.totalUsers,
      activeUsers: legacy.totalUsers,
      newUsersToday: legacy.signupsToday,
      newUsersWeek: legacy.signupsWeek,
      newUsersMonth: legacy.signupsMonth,
      trialUsers: 0,
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
    usersAtRisk: [],
    recentNotes: loadAllAdminNotes().slice(0, 6),
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
  return {
    items: legacy.items.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      subscriptionTier: (u.plan as AdminUserListItem['subscriptionTier']) || 'solo',
      subscriptionStatus: (u.subscriptionStatus as AdminUserListItem['subscriptionStatus']) || 'trialing',
      trialEndsAt: null,
      businessCount: 1,
      businessNames: u.workspaceName ? [u.workspaceName] : [],
      workspaceName: u.workspaceName,
      lastLoginAt: u.lastSignInAt,
      lastBalanceUpdateAt: null,
      createdAt: u.createdAt,
      isActive: true,
      lifetimeAccess: false,
      betaTester: false,
      isPlatformAdmin: u.role === 'admin' || u.role === 'super_admin',
    })),
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
  const list = await adminFetchUsers({ page: 1, pageSize: 1, search: userId })
  const item = list.items.find((u) => u.id === userId)
  if (!item) return null
  return {
    ...item,
    phone: null,
    emailVerified: true,
    onboardingCompleted: false,
    onboardingPct: 0,
    workspaceId: null,
    invitedUsers: 0,
    venueCount: 0,
    accountCount: 0,
    reservePlannerCount: 0,
    commitmentCount: 0,
    expectedReceiptCount: 0,
    latestTrueBalance: null,
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
    adminNotes: '',
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
  return paginate([], page, pageSize)
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
  return null
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

export async function adminFetchProductAnalytics(): Promise<ProductAnalyticsSnapshot> {
  if (await useMockData()) return getMockProductAnalytics()
  if (!isSupabaseConfigured) return getEmptyProductAnalytics()
  return getEmptyProductAnalytics()
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
  return paginate([], page, pageSize)
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
