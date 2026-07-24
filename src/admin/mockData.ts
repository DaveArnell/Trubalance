import type { SubscriptionTierId } from '../config/subscriptionTiers'
import { SETUP_ONBOARDING_STEP_LABELS, SETUP_ONBOARDING_STEPS } from '../content/setupOnboarding'
import { computeUserHealth, onboardingPctFromUser } from './utils/userHealth'
import type {
  AdminActivityRow,
  AdminAnalyticsSnapshot,
  AdminPaymentRow,
  AdminSubscriptionRow,
  AdminUserDetail,
  AdminUserHealthRow,
  AdminUserListItem,
  AuditLogEntry,
  DeveloperInfo,
  EmailTemplateRow,
  NotificationTemplateRow,
  PlatformOverviewStats,
  PlatformSettings,
  ProductAnalyticsSnapshot,
  SetupFunnelSnapshot,
  QrCodeRow,
  SubscriptionStatus,
  SupportTicketRow,
  UserTimelineEvent,
  WorkspaceInspectorData,
} from './types'

const FIRST = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Drew', 'Avery']
const LAST = ['Smith', 'Jones', 'Williams', 'Brown', 'Davies', 'Wilson', 'Taylor', 'Evans', 'Thomas', 'Roberts']
const BUSINESSES = [
  'Oak & Co Ltd',
  'River Kitchen',
  'Northline Trading',
  'Brightside Consulting',
  'Harbour Logistics',
  'Summit Retail',
  'Cedar Works',
  'Metro Services',
  'Blue Finch Media',
  'Stonegate Properties',
]

const TIERS: SubscriptionTierId[] = ['solo', 'multi', 'group']
const STATUSES: SubscriptionStatus[] = ['trialing', 'active', 'past_due', 'canceled', 'expired', 'lifetime']

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]!
}

function mockUserBase(i: number): AdminUserListItem {
  const tier = pick(TIERS, i)
  const status = i % 11 === 0 ? 'lifetime' : pick(STATUSES, i)
  const lifetime = status === 'lifetime'
  const betaTester = i % 13 === 0
  const trialEnds = status === 'trialing' ? daysAgo(-14 + (i % 30)) : null
  const businessCount = tier === 'solo' ? 1 : tier === 'multi' ? 1 : 5 + (i % 8)
  const names = Array.from({ length: businessCount }, (_, j) => pick(BUSINESSES, i + j))
  const lastLoginAt = i % 7 === 0 ? null : daysAgo(i % 21)
  const lastBalanceUpdateAt =
    i % 5 === 0 ? null : i % 8 === 0 ? daysAgo(12 + (i % 5)) : daysAgo(i % 6)

  return {
    id: `user-${String(i + 1).padStart(4, '0')}`,
    fullName: `${pick(FIRST, i)} ${pick(LAST, i + 3)}`,
    email: `${pick(FIRST, i).toLowerCase()}.${pick(LAST, i).toLowerCase()}@example.com`,
    subscriptionTier: tier,
    subscriptionStatus: status,
    trialEndsAt: trialEnds,
    businessCount,
    businessNames: names,
    workspaceName: `${names[0] ?? 'Workspace'} workspace`,
    lastLoginAt,
    lastBalanceUpdateAt,
    createdAt: daysAgo(30 + i * 2),
    isActive: i % 9 !== 0,
    lifetimeAccess: lifetime,
    betaTester,
    isPlatformAdmin: i === 0,
  }
}

const MOCK_USERS: AdminUserListItem[] = Array.from({ length: 48 }, (_, i) => mockUserBase(i))

export function getMockUsers(): AdminUserListItem[] {
  return MOCK_USERS
}

export function getMockUserById(id: string): AdminUserDetail | null {
  const base = MOCK_USERS.find((u) => u.id === id)
  if (!base) return null

  const venueCount = base.businessCount * (1 + (parseInt(base.id.slice(-1), 10) % 3))
  const accountCount = base.businessCount * 2
  const reservePlannerCount = 1 + (parseInt(base.id.slice(-2), 10) % 3)
  const commitmentCount = 8 + (parseInt(base.id.slice(-2), 10) % 12)
  const expectedReceiptCount = parseInt(base.id.slice(-2), 10) % 5
  const onboardingCompleted = base.id !== 'user-0003'
  const onboardingPct = onboardingPctFromUser({
    businessCount: base.businessCount,
    accountCount,
    commitmentCount,
    reservePlannerCount,
    onboardingCompleted,
  })
  const latestCashBalance = 52000 + parseInt(base.id.slice(-3), 10) * 211
  const latestCommittedTotal = 18000 + parseInt(base.id.slice(-2), 10) * 420
  const latestExpectedReceipts = expectedReceiptCount * 2400
  const latestTrueBalance = latestCashBalance - latestCommittedTotal + latestExpectedReceipts
  const daysSinceBalance = base.lastBalanceUpdateAt
    ? Math.floor((Date.now() - new Date(base.lastBalanceUpdateAt).getTime()) / 86400000)
    : null
  const freshnessStatus =
    daysSinceBalance == null
      ? 'unknown'
      : daysSinceBalance <= 3
        ? 'fresh'
        : daysSinceBalance <= 10
          ? 'aging'
          : 'stale'

  return {
    ...base,
    phone: base.id.endsWith('001') ? '+44 7700 900123' : null,
    emailVerified: base.isActive,
    onboardingCompleted,
    onboardingPct,
    workspaceId: `ws-${base.id}`,
    invitedUsers: base.subscriptionTier === 'solo' ? 0 : 1 + (parseInt(base.id.slice(-2), 10) % 4),
    venueCount,
    accountCount,
    reservePlannerCount,
    commitmentCount,
    expectedReceiptCount,
    latestTrueBalance,
    latestCashBalance,
    latestCommittedTotal,
    latestExpectedReceipts,
    freshnessStatus,
    notificationEmail: true,
    notificationInApp: true,
    recentLogins: [
      { at: daysAgo(0), ip: '86.14.x.x', device: 'Chrome · Windows' },
      { at: daysAgo(2), ip: '86.14.x.x', device: 'Safari · iPhone' },
      { at: daysAgo(5), ip: '81.2.x.x', device: 'Chrome · macOS' },
    ],
    recentActivity: [
      { at: daysAgo(0), event: 'page_view', detail: 'committed-funds' },
      { at: daysAgo(1), event: 'balance_update', detail: 'Current account' },
      { at: daysAgo(3), event: 'page_view', detail: 'trends' },
    ],
    recentBalanceUpdates: [
      { at: daysAgo(1), account: 'Main current', amount: 45230.12 },
      { at: daysAgo(4), account: 'Savings', amount: 12000 },
    ],
    recentReports: [{ at: daysAgo(7), name: 'Monthly Available summary' }],
    emailHistory: [
      { at: daysAgo(30), template: 'Welcome email', status: 'delivered' },
      { at: daysAgo(14), template: 'Trial reminder', status: 'delivered' },
    ],
    supportTickets: [
      {
        id: `tkt-${base.id}`,
        subject: 'Question about reserve planner',
        status: 'resolved',
        createdAt: daysAgo(10),
      },
    ],
    adminNotes: '',
    subscriptionRenewalAt: base.subscriptionStatus === 'active' ? daysAgo(-28) : null,
    stripeCustomerId: base.subscriptionStatus === 'active' ? `cus_mock_${base.id}` : null,
    stripeSubscriptionId: base.subscriptionStatus === 'active' ? `sub_mock_${base.id}` : null,
  }
}

export function getEmptyOverviewStats(): PlatformOverviewStats {
  return {
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newUsersWeek: 0,
    newUsersMonth: 0,
    trialUsers: 0,
    payingUsers: 0,
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
    dau: 0,
    wau: 0,
    mau: 0,
  }
}

export function getEmptyProductAnalytics(): ProductAnalyticsSnapshot {
  return {
    totalUsers: 0,
    activeUsers: 0,
    workspacesCreated: 0,
    businessesCreated: 0,
    venuesCreated: 0,
    accountsCreated: 0,
    committedFundsCreated: 0,
    reservePlannersCreated: 0,
    balanceUpdatesCreated: 0,
    graphSnapshotsCreated: 0,
    expectedReceiptsCreated: 0,
    avgDaysBetweenBalanceUpdates: 0,
    usersWithStaleBalances: 0,
    usersWithNoCommittedFunds: 0,
    usersWithNoReservePlanner: 0,
    onboardingCompletionRate: 0,
    dailySignups: [],
    featureUsage: [],
    setupFunnel: getMockSetupFunnel(0),
  }
}

function getMockSetupFunnel(usersStarted: number): SetupFunnelSnapshot {
  const steps = SETUP_ONBOARDING_STEPS.map((step, index) => {
    const usersReached = usersStarted === 0 ? 0 : Math.max(0, usersStarted - index * 2)
    const previousReached =
      index === 0 ? usersStarted : Math.max(0, usersStarted - (index - 1) * 2)
    return {
      stepId: step.id,
      label: SETUP_ONBOARDING_STEP_LABELS[step.id] ?? step.title,
      usersReached,
      pctOfStarted: usersStarted > 0 ? Math.round((usersReached / usersStarted) * 100) : 0,
      dropOffFromPrevious: Math.max(0, previousReached - usersReached),
    }
  })

  return {
    usersStarted,
    usersCompleted: usersStarted === 0 ? 0 : Math.max(0, usersStarted - SETUP_ONBOARDING_STEPS.length * 2),
    usersDismissed: usersStarted === 0 ? 0 : 4,
    steps,
    dismissByStep:
      usersStarted === 0
        ? []
        : [
            { stepId: 'reserve', label: 'Reserve', count: 2 },
            { stepId: 'committed', label: 'Commitments', count: 1 },
          ],
  }
}

export function getMockOverviewStats(): PlatformOverviewStats {
  const users = MOCK_USERS
  const healthRows = getMockUserHealthRows()
  const staleUsers = healthRows.filter((r) => r.healthStatus === 'orange' || r.healthStatus === 'red').length
  const needingHelp = healthRows.filter((r) => r.riskStatus === 'high').length
  const onboardingPcts = healthRows.map((r) => r.onboardingPct)

  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    newUsersToday: 2,
    newUsersWeek: 7,
    newUsersMonth: 18,
    trialUsers: users.filter((u) => u.subscriptionStatus === 'trialing').length,
    payingUsers: users.filter((u) => u.subscriptionStatus === 'active').length,
    lifetimeUsers: users.filter((u) => u.lifetimeAccess).length,
    betaUsers: users.filter((u) => u.betaTester).length,
    cancelledUsers: users.filter((u) => u.subscriptionStatus === 'canceled').length,
    staleUsers,
    usersNeedingHelp: needingHelp,
    totalBalanceUpdates: 1840,
    totalReservePlanners: users.reduce((n, u) => n + (1 + (parseInt(u.id.slice(-2), 10) % 3)), 0),
    onboardingCompletionPct:
      onboardingPcts.length > 0
        ? onboardingPcts.filter((p) => p >= 100).length / onboardingPcts.length
        : 0,
    mrrCents: 284700,
    arrCents: 3416400,
    trialConversionRate: 0.34,
    dau: 12,
    wau: 31,
    mau: users.filter((u) => u.isActive).length,
  }
}

export function getMockUserHealthRows(): AdminUserHealthRow[] {
  return MOCK_USERS.map((u) => {
    const detail = getMockUserById(u.id)!
    const onboardingPct = detail.onboardingPct
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
      venueCount: detail.venueCount,
      accountCount: detail.accountCount,
      commitmentCount: detail.commitmentCount,
      reservePlannerCount: detail.reservePlannerCount,
      onboardingPct,
      healthStatus,
      riskStatus,
    }
  })
}

export function getMockUserTimeline(userId: string): UserTimelineEvent[] {
  const user = getMockUserById(userId)
  if (!user) return []

  const events: UserTimelineEvent[] = [
    { id: 't1', type: 'signed_up', label: 'Signed up', detail: null, at: user.createdAt },
    {
      id: 't2',
      type: 'verified_email',
      label: 'Verified email',
      detail: user.email,
      at: daysAgo(Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000) - 1)),
    },
    {
      id: 't3',
      type: 'trial_started',
      label: 'Trial started',
      detail: `${user.subscriptionTier} plan`,
      at: user.createdAt,
    },
    {
      id: 't4',
      type: 'created_workspace',
      label: 'Created workspace',
      detail: user.workspaceName,
      at: daysAgo(28),
    },
    {
      id: 't5',
      type: 'created_business',
      label: 'Created business',
      detail: user.businessNames[0] ?? null,
      at: daysAgo(26),
    },
  ]

  if (user.venueCount > 0) {
    events.push({
      id: 't6',
      type: 'created_venue',
      label: 'Created venue',
      detail: `${user.venueCount} venues total`,
      at: daysAgo(24),
    })
  }
  if (user.accountCount > 0) {
    events.push({
      id: 't7',
      type: 'added_account',
      label: 'Added bank account',
      detail: 'Main current account',
      at: daysAgo(22),
    })
  }
  if (user.commitmentCount > 0) {
    events.push({
      id: 't8',
      type: 'added_committed_fund',
      label: 'Added committed fund',
      detail: 'Rent · monthly',
      at: daysAgo(20),
    })
  }
  if (user.reservePlannerCount > 0) {
    events.push({
      id: 't9',
      type: 'added_reserve_planner',
      label: 'Created reserve planner',
      detail: 'Corporation tax reserve',
      at: daysAgo(18),
    })
  }
  if (user.lastBalanceUpdateAt) {
    events.push({
      id: 't10',
      type: 'updated_balance',
      label: 'Updated balance',
      detail: 'Current account',
      at: user.lastBalanceUpdateAt,
    })
  }
  events.push({
    id: 't11',
    type: 'plotted_graph',
    label: 'Plotted graph snapshot',
    detail: 'Available trend',
    at: daysAgo(6),
  })
  if (user.recentReports[0]) {
    events.push({
      id: 't12',
      type: 'generated_report',
      label: 'Generated report',
      detail: user.recentReports[0].name,
      at: user.recentReports[0].at,
    })
  }
  if (user.lastLoginAt) {
    events.push({
      id: 't13',
      type: 'logged_in',
      label: 'Logged in',
      detail: user.recentLogins[0]?.device ?? null,
      at: user.lastLoginAt,
    })
  }
  if (user.supportTickets[0]) {
    events.push({
      id: 't14',
      type: 'support_ticket_created',
      label: 'Support ticket created',
      detail: user.supportTickets[0].subject,
      at: user.supportTickets[0].createdAt,
    })
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

export function getMockWorkspaceInspector(userId: string): WorkspaceInspectorData | null {
  const user = getMockUserById(userId)
  if (!user || !user.workspaceId) return null

  return {
    workspaceId: user.workspaceId,
    workspaceName: user.workspaceName ?? 'Workspace',
    businesses: user.businessNames.map((name, i) => ({
      id: `biz-${i}`,
      name,
      venueCount: Math.max(1, Math.floor(user.venueCount / user.businessCount)),
      accountCount: Math.max(1, Math.floor(user.accountCount / user.businessCount)),
    })),
    venueCount: user.venueCount,
    accountCount: user.accountCount,
    commitmentCount: user.commitmentCount,
    expectedReceiptCount: user.expectedReceiptCount,
    reservePlannerCount: user.reservePlannerCount,
    latestTrueBalance: user.latestTrueBalance,
    latestCashBalance: user.latestCashBalance,
    latestCommittedTotal: user.latestCommittedTotal,
    latestExpectedReceipts: user.latestExpectedReceipts,
    lastBalanceUpdateAt: user.lastBalanceUpdateAt,
    freshnessStatus: user.freshnessStatus,
    committedFundsSample: [
      { name: 'Rent', amount: 4200, dueLabel: 'Monthly · 1st' },
      { name: 'Payroll', amount: 18600, dueLabel: 'Monthly · 28th' },
      { name: 'VAT', amount: 8400, dueLabel: 'Quarterly' },
    ],
    expectedReceiptsSample: [
      { name: 'Client invoice #1042', amount: 6200, dueLabel: 'Due in 5 days' },
      { name: 'Grant instalment', amount: 4800, dueLabel: 'Due in 12 days' },
    ],
    reservePlannersSample: [
      { name: 'Corporation tax', target: 12000, status: 'On track' },
      { name: 'Equipment renewal', target: 4500, status: 'Behind' },
    ],
  }
}

export function getMockProductAnalytics(): ProductAnalyticsSnapshot {
  const users = MOCK_USERS
  const health = getMockUserHealthRows()
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })

  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    workspacesCreated: users.length,
    businessesCreated: users.reduce((n, u) => n + u.businessCount, 0),
    venuesCreated: health.reduce((n, r) => n + r.venueCount, 0),
    accountsCreated: health.reduce((n, r) => n + r.accountCount, 0),
    committedFundsCreated: health.reduce((n, r) => n + r.commitmentCount, 0),
    reservePlannersCreated: health.reduce((n, r) => n + r.reservePlannerCount, 0),
    balanceUpdatesCreated: 1840,
    graphSnapshotsCreated: 512,
    expectedReceiptsCreated: health.reduce((n, r) => n + (r.commitmentCount % 5), 0) * 12,
    avgDaysBetweenBalanceUpdates: 4.8,
    usersWithStaleBalances: health.filter((r) => {
      if (!r.lastBalanceUpdateAt) return true
      const days = Math.floor((Date.now() - new Date(r.lastBalanceUpdateAt).getTime()) / 86400000)
      return days > 7
    }).length,
    usersWithNoCommittedFunds: health.filter((r) => r.commitmentCount === 0).length,
    usersWithNoReservePlanner: health.filter((r) => r.reservePlannerCount === 0).length,
    onboardingCompletionRate: health.filter((r) => r.onboardingPct >= 100).length / health.length,
    dailySignups: days.map((date, i) => ({ date, count: 1 + (i % 4) })),
    featureUsage: [
      { feature: 'Available overview', count: 420 },
      { feature: 'Committed funds', count: 380 },
      { feature: 'Reserve planner', count: 145 },
      { feature: 'Trends & graph', count: 210 },
      { feature: 'Balance updates', count: 1840 },
      { feature: 'Reports', count: 96 },
    ],
    setupFunnel: getMockSetupFunnel(28),
  }
}

export function getMockRecentActivity(): AdminActivityRow[] {
  return [
    { id: 'a1', type: 'signup', title: 'Alex Smith signed up', subtitle: 'Solo trial', createdAt: daysAgo(0) },
    { id: 'a2', type: 'login', title: 'Jordan Jones logged in', subtitle: null, createdAt: daysAgo(0) },
    { id: 'a3', type: 'payment', title: 'Payment received — £15.00', subtitle: 'Taylor Williams · Multi-site Business', createdAt: daysAgo(1) },
    { id: 'a4', type: 'support', title: 'New support ticket', subtitle: 'Reserve planner question', createdAt: daysAgo(1) },
    { id: 'a5', type: 'alert', title: 'Trial ending in 3 days', subtitle: '12 users', createdAt: daysAgo(2) },
    { id: 'a6', type: 'signup', title: 'Morgan Brown signed up', subtitle: 'Business trial', createdAt: daysAgo(2) },
  ]
}

export function getMockSubscriptions(): AdminSubscriptionRow[] {
  return MOCK_USERS.map((u) => ({
    id: `sub-${u.id}`,
    userId: u.id,
    userName: u.fullName,
    userEmail: u.email,
    plan: u.subscriptionTier,
    status: u.subscriptionStatus,
    trialEndsAt: u.trialEndsAt,
    renewalAt: u.subscriptionStatus === 'active' ? daysAgo(-20) : null,
    paymentStatus: u.subscriptionStatus === 'active' ? 'paid' : u.subscriptionStatus === 'past_due' ? 'failed' : 'none',
    stripeSubscriptionId: u.subscriptionStatus === 'active' ? `sub_mock_${u.id}` : null,
    lifetimeAccess: u.lifetimeAccess,
  }))
}

export function getMockPayments(): AdminPaymentRow[] {
  return MOCK_USERS.filter((u) => u.subscriptionStatus === 'active' || u.subscriptionStatus === 'past_due')
    .slice(0, 24)
    .map((u, i) => ({
      id: `pay-${u.id}`,
      userEmail: u.email,
      workspaceName: u.businessNames[0] ?? 'Workspace',
      amountCents: u.subscriptionTier === 'solo' ? 500 : u.subscriptionTier === 'multi' ? 1000 : 1500,
      currency: 'gbp',
      status: u.subscriptionStatus === 'past_due' ? 'failed' : i % 9 === 0 ? 'refunded' : 'succeeded',
      description: `${u.subscriptionTier} plan`,
      plan: u.subscriptionTier,
      paidAt: daysAgo(i % 30),
      createdAt: daysAgo(i % 30),
    }))
}

export function getMockAnalytics(): AdminAnalyticsSnapshot {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })
  return {
    dailySignups: days.map((date, i) => ({ date, count: 1 + (i % 4) })),
    dailyLogins: days.map((date, i) => ({ date, count: 8 + (i % 6) })),
    retentionWeeks: [
      { week: 'W1', rate: 0.82 },
      { week: 'W2', rate: 0.71 },
      { week: 'W3', rate: 0.64 },
      { week: 'W4', rate: 0.58 },
    ],
    featureUsage: [
      { feature: 'Available overview', count: 420 },
      { feature: 'Committed funds', count: 380 },
      { feature: 'Trends', count: 210 },
      { feature: 'Reserve planner', count: 145 },
      { feature: 'History', count: 98 },
    ],
    widgetUsage: [
      { widget: 'Due', count: 310 },
      { widget: 'Outgoings', count: 290 },
      { widget: 'Trend chart', count: 205 },
      { widget: 'Reserve planner', count: 140 },
    ],
    businessesCreated: 62,
    reservePlannersCreated: 38,
    balanceUpdates: 1840,
    reportsGenerated: 96,
    graphInteractions: 512,
    avgUpdatesPerWeek: 3.4,
    avgDaysBetweenLogins: 4.2,
    onboardingCompletionPct: 0.76,
    devices: [
      { label: 'Desktop', pct: 58 },
      { label: 'Mobile', pct: 32 },
      { label: 'Tablet', pct: 10 },
    ],
    browsers: [
      { label: 'Chrome', pct: 52 },
      { label: 'Safari', pct: 28 },
      { label: 'Edge', pct: 14 },
      { label: 'Other', pct: 6 },
    ],
    countries: [
      { label: 'United Kingdom', pct: 72 },
      { label: 'Ireland', pct: 12 },
      { label: 'Other', pct: 16 },
    ],
  }
}

export function getMockSupportTickets(): SupportTicketRow[] {
  return MOCK_USERS.slice(0, 12).map((u, i) => ({
    id: `tkt-${String(i + 1).padStart(3, '0')}`,
    subject: ['Trial extension request', 'Cannot add second business', 'Reserve planner help', 'Billing question'][i % 4]!,
    status: (['open', 'pending', 'resolved', 'closed'] as const)[i % 4],
    priority: (['low', 'normal', 'high', 'urgent'] as const)[i % 4],
    assignedAdmin: i % 3 === 0 ? 'Platform admin' : null,
    userId: u.id,
    userEmail: u.email,
    userName: u.fullName,
    adminNotes: i % 2 === 0 ? 'Follow up after trial extension.' : null,
    createdAt: daysAgo(i * 2),
    updatedAt: daysAgo(i),
  }))
}

const EMAIL_BODIES: Record<string, string> = {
  welcome: `Hi {{user_name}},\n\nWelcome to Cash Prophet. You now have a clear view of what money is genuinely yours — not just what is sitting in the bank.\n\nStart by adding your businesses and saving your account balances.\n\n— Cash Prophet`,
  verify_email: `Hi {{user_name}},\n\nPlease verify your email to secure your workspace.\n\n{{verify_link}}\n\n— Cash Prophet`,
  password_reset: `Hi {{user_name}},\n\nWe received a request to reset your password.\n\n{{reset_link}}\n\n— Cash Prophet`,
  trial_reminder: `Hi {{user_name}},\n\nYou are {{trial_days_left}} days into your Cash Prophet trial. Your committed funds and reserve planners are ready whenever you are.\n\n— Cash Prophet`,
  trial_ending: `Hi {{user_name}},\n\nYour trial ends on {{trial_end_date}}. Keep your Cash Prophet workspace so you never lose sight of committed cash.\n\n— Cash Prophet`,
  stale_balance: `Hi {{user_name}},\n\nYour balances in {{workspace_name}} have not been updated recently. A quick refresh keeps Available accurate.\n\n— Cash Prophet`,
  monthly_summary: `Hi {{user_name}},\n\nHere is your monthly Available summary for {{workspace_name}}.\n\nAvailable: {{true_balance}}\nCommitted: {{committed_total}}\n\n— Cash Prophet`,
  support_reply: `Hi {{user_name}},\n\nThanks for contacting support. {{support_message}}\n\n— Cash Prophet team`,
  beta_welcome: `Hi {{user_name}},\n\nThanks for joining the Cash Prophet private beta. You have full access while we refine the product — your feedback shapes what we build next.\n\n— Dave & the Cash Prophet team`,
}

export function getMockEmailTemplates(): EmailTemplateRow[] {
  const templates = [
    ['welcome', 'Welcome email', 'Welcome to Cash Prophet'],
    ['verify_email', 'Email verification', 'Verify your email address'],
    ['password_reset', 'Password reset', 'Reset your password'],
    ['trial_reminder', 'Trial reminder', 'Your Cash Prophet trial'],
    ['trial_ending', 'Trial ending soon', 'Your trial ends soon'],
    ['stale_balance', 'Stale balance reminder', 'Time to update your balances'],
    ['monthly_summary', 'Monthly Available summary', 'Your monthly Available summary'],
    ['support_reply', 'Support reply', 'Re: your support request'],
    ['beta_welcome', 'Beta tester welcome', 'Welcome to the Cash Prophet beta'],
  ]
  return templates.map(([key, name, subject], i) => ({
    id: `email-${key}`,
    key,
    name,
    subject,
    bodyPreview: EMAIL_BODIES[key] ?? `Hi {{user_name}},\n\n${name}.\n\n— Cash Prophet`,
    enabled: true,
    updatedAt: daysAgo(i * 3),
    variables: ['{{user_name}}', '{{workspace_name}}', '{{trial_end_date}}', '{{true_balance}}'],
  }))
}

export function getMockNotifications(): NotificationTemplateRow[] {
  return [
    { id: 'n1', name: 'Due item reminders', channel: 'email', enabled: true, description: 'Email when items are due' },
    { id: 'n2', name: 'Due item reminders', channel: 'in_app', enabled: true, description: 'In-app due alerts' },
    { id: 'n3', name: 'Trial ending', channel: 'email', enabled: true, description: '3 days before trial ends' },
    { id: 'n4', name: 'Balance stale', channel: 'email', enabled: false, description: 'When balances are outdated' },
    { id: 'n5', name: 'Monthly summary', channel: 'email', enabled: true, description: 'End of month recap' },
    { id: 'n6', name: 'Push — due alerts', channel: 'push', enabled: false, description: 'Future mobile push' },
  ]
}

export function getMockQrCodes(): QrCodeRow[] {
  return [
    { id: 'qr1', name: 'Invite team member', destination: 'https://trubalance.app/invite/demo', scans: 42, createdAt: daysAgo(20), status: 'active' },
    { id: 'qr2', name: 'Marketing landing', destination: 'https://trubalance.app/', scans: 128, createdAt: daysAgo(45), status: 'active' },
    { id: 'qr3', name: 'Printed guide v1', destination: 'https://trubalance.app/guide', scans: 17, createdAt: daysAgo(60), status: 'paused' },
  ]
}

export function getMockPlatformSettings(): PlatformSettings {
  return {
    platformName: 'Cash Prophet',
    logoUrl: '',
    primaryColor: '#0f766e',
    maintenanceMode: false,
    defaultTrialDays: 90,
    soloPriceGbp: 5,
    multiPriceGbp: 10,
    groupPriceGbp: 15,
    emailFromName: 'Cash Prophet',
    emailFromAddress: 'hello@trubalance.app',
    featureFlags: {
      reserve_planner: true,
      trend_forecast: true,
      platform_admin: true,
      ai_assistant: false,
      open_banking: false,
    },
    aiEnabled: false,
    openBankingEnabled: false,
  }
}

export function getMockAuditLog(): AuditLogEntry[] {
  return [
    { id: 'aud1', adminEmail: 'admin@trubalance.app', action: 'trial_extended', target: 'alex.smith@example.com', metadata: '+30 days', createdAt: daysAgo(1) },
    { id: 'aud2', adminEmail: 'admin@trubalance.app', action: 'subscription_changed', target: 'jordan.jones@example.com', metadata: 'solo → multi', createdAt: daysAgo(2) },
    { id: 'aud3', adminEmail: 'admin@trubalance.app', action: 'lifetime_granted', target: 'sam.williams@example.com', metadata: null, createdAt: daysAgo(5) },
    { id: 'aud4', adminEmail: 'admin@trubalance.app', action: 'email_template_updated', target: 'trial_ending', metadata: null, createdAt: daysAgo(7) },
    { id: 'aud5', adminEmail: 'admin@trubalance.app', action: 'platform_setting_changed', target: 'default_trial_days', metadata: '90', createdAt: daysAgo(10) },
  ]
}

export function getMockDeveloperInfo(): DeveloperInfo {
  return {
    version: '0.0.0',
    environment: import.meta.env.MODE,
    nodeEnv: import.meta.env.PROD ? 'production' : 'development',
    supabaseConfigured: false,
    databaseStatus: 'mock — connect Supabase for live data',
    lastMigration: '004_subscription_tiers',
  }
}
