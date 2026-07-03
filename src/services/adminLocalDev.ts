import type { AdminStats, AdminUserRow, AuditLogRow, PageViewStat } from './adminRepository'

/** Demo admin data when Supabase is not configured. */
export function getLocalDevAdminStats(): AdminStats {
  return {
    totalUsers: 1,
    signupsToday: 0,
    signupsWeek: 1,
    signupsMonth: 1,
    activeSubscriptions: 0,
    totalRevenueCents: 0,
    loginsToday: 1,
  }
}

export function getLocalDevAdminUsers(): AdminUserRow[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'local-dev-user',
      email: 'developer@local.dev',
      fullName: 'Local developer',
      role: 'super_admin',
      createdAt: now,
      lastSignInAt: now,
      onboardingCompleted: false,
      workspaceId: 'local-workspace',
      workspaceName: 'Local workspace',
      plan: 'solo',
      subscriptionStatus: 'trialing',
      latestTrueBalance: null,
    },
  ]
}

export function getLocalDevPageViews(): PageViewStat[] {
  return [
    { page: 'committed-funds', count: 12 },
    { page: 'trends', count: 4 },
    { page: 'reserve-planner', count: 3 },
    { page: 'settings', count: 2 },
  ]
}

export function getLocalDevAuditLog(): AuditLogRow[] {
  return []
}

export function getLocalDevEvents() {
  const now = new Date().toISOString()
  return [
    {
      id: 'local-ev-1',
      eventType: 'page_view',
      email: 'developer@local.dev',
      createdAt: now,
    },
  ]
}
