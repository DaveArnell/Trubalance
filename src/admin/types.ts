import type { SubscriptionTierId } from '../config/subscriptionTiers'

export type AdminUserFilter =
  | 'all'
  | 'trial'
  | 'paid'
  | 'lifetime'
  | 'cancelled'
  | 'active'
  | 'inactive'

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'lifetime'

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  filter?: string
}

export interface PlatformOverviewStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersWeek: number
  newUsersMonth: number
  trialUsers: number
  payingUsers: number
  lifetimeUsers: number
  betaUsers: number
  cancelledUsers: number
  staleUsers: number
  usersNeedingHelp: number
  totalBalanceUpdates: number
  totalReservePlanners: number
  onboardingCompletionPct: number
  mrrCents: number
  arrCents: number
  trialConversionRate: number
  dau: number
  wau: number
  mau: number
}

export interface AdminActivityRow {
  id: string
  type: 'signup' | 'login' | 'payment' | 'support' | 'alert'
  title: string
  subtitle: string | null
  createdAt: string
}

export interface AdminUserListItem {
  id: string
  fullName: string
  email: string
  subscriptionTier: SubscriptionTierId
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: string | null
  businessCount: number
  businessNames: string[]
  workspaceName: string | null
  lastLoginAt: string | null
  lastBalanceUpdateAt: string | null
  createdAt: string
  isActive: boolean
  lifetimeAccess: boolean
  betaTester: boolean
  isPlatformAdmin: boolean
}

export type HealthStatus = 'green' | 'yellow' | 'orange' | 'red'
export type RiskStatus = 'low' | 'medium' | 'high'

export interface AdminUserHealthRow {
  userId: string
  fullName: string
  email: string
  workspaceName: string
  plan: SubscriptionTierId
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: string | null
  lastLoginAt: string | null
  lastBalanceUpdateAt: string | null
  businessCount: number
  venueCount: number
  accountCount: number
  commitmentCount: number
  reservePlannerCount: number
  onboardingPct: number
  healthStatus: HealthStatus
  riskStatus: RiskStatus
}

export type UserTimelineEventType =
  | 'signed_up'
  | 'verified_email'
  | 'logged_in'
  | 'created_workspace'
  | 'created_business'
  | 'created_venue'
  | 'added_account'
  | 'added_committed_fund'
  | 'added_reserve_planner'
  | 'updated_balance'
  | 'plotted_graph'
  | 'generated_report'
  | 'changed_subscription'
  | 'trial_started'
  | 'trial_extended'
  | 'trial_expired'
  | 'admin_note_added'
  | 'support_ticket_created'

export interface UserTimelineEvent {
  id: string
  type: UserTimelineEventType
  label: string
  detail: string | null
  at: string
}

export interface WorkspaceBusinessRow {
  id: string
  name: string
  venueCount: number
  accountCount: number
}

export interface WorkspaceInspectorData {
  workspaceId: string
  workspaceName: string
  businesses: WorkspaceBusinessRow[]
  venueCount: number
  accountCount: number
  commitmentCount: number
  expectedReceiptCount: number
  reservePlannerCount: number
  latestTrueBalance: number | null
  latestCashBalance: number | null
  latestCommittedTotal: number | null
  latestExpectedReceipts: number | null
  lastBalanceUpdateAt: string | null
  freshnessStatus: 'fresh' | 'aging' | 'stale' | 'unknown'
  committedFundsSample: Array<{ name: string; amount: number; dueLabel: string }>
  expectedReceiptsSample: Array<{ name: string; amount: number; dueLabel: string }>
  reservePlannersSample: Array<{ name: string; target: number; status: string }>
}

export interface AdminNote {
  id: string
  userId: string
  text: string
  author: string
  createdAt: string
}

export type WorkspaceAccessType =
  | 'normal_trial'
  | 'paid'
  | 'beta_tester'
  | 'lifetime'
  | 'cancelled'

export interface WorkspaceAccessOverride {
  userId: string
  accessType: WorkspaceAccessType
  subscriptionPlan: SubscriptionTierId
  betaTester: boolean
  lifetimeAccess: boolean
  trialEndsAt: string | null
  updatedAt: string
}

export interface ProductAnalyticsSnapshot {
  totalUsers: number
  activeUsers: number
  workspacesCreated: number
  businessesCreated: number
  venuesCreated: number
  accountsCreated: number
  committedFundsCreated: number
  reservePlannersCreated: number
  balanceUpdatesCreated: number
  graphSnapshotsCreated: number
  expectedReceiptsCreated: number
  avgDaysBetweenBalanceUpdates: number
  usersWithStaleBalances: number
  usersWithNoCommittedFunds: number
  usersWithNoReservePlanner: number
  onboardingCompletionRate: number
  dailySignups: Array<{ date: string; count: number }>
  featureUsage: Array<{ feature: string; count: number }>
}

export interface AdminUserDetail extends AdminUserListItem {
  phone: string | null
  emailVerified: boolean
  onboardingCompleted: boolean
  onboardingPct: number
  workspaceId: string | null
  invitedUsers: number
  venueCount: number
  accountCount: number
  reservePlannerCount: number
  commitmentCount: number
  expectedReceiptCount: number
  latestTrueBalance: number | null
  latestCashBalance: number | null
  latestCommittedTotal: number | null
  latestExpectedReceipts: number | null
  freshnessStatus: WorkspaceInspectorData['freshnessStatus']
  notificationEmail: boolean
  notificationInApp: boolean
  recentLogins: Array<{ at: string; ip: string | null; device: string }>
  recentActivity: Array<{ at: string; event: string; detail: string | null }>
  recentBalanceUpdates: Array<{ at: string; account: string; amount: number }>
  recentReports: Array<{ at: string; name: string }>
  emailHistory: Array<{ at: string; template: string; status: string }>
  supportTickets: Array<{ id: string; subject: string; status: string; createdAt: string }>
  adminNotes: string
  subscriptionRenewalAt: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

export interface AdminSubscriptionRow {
  id: string
  userId: string
  userName: string
  userEmail: string
  plan: SubscriptionTierId
  status: SubscriptionStatus
  trialEndsAt: string | null
  renewalAt: string | null
  paymentStatus: string
  stripeSubscriptionId: string | null
  lifetimeAccess: boolean
}

export interface AdminPaymentRow {
  id: string
  userEmail: string
  workspaceName: string
  amountCents: number
  currency: string
  status: 'succeeded' | 'failed' | 'refunded' | 'pending'
  description: string | null
  plan: SubscriptionTierId
  paidAt: string | null
  createdAt: string
}

export interface AdminAnalyticsSnapshot {
  dailySignups: Array<{ date: string; count: number }>
  dailyLogins: Array<{ date: string; count: number }>
  retentionWeeks: Array<{ week: string; rate: number }>
  featureUsage: Array<{ feature: string; count: number }>
  widgetUsage: Array<{ widget: string; count: number }>
  businessesCreated: number
  reservePlannersCreated: number
  balanceUpdates: number
  reportsGenerated: number
  graphInteractions: number
  avgUpdatesPerWeek: number
  avgDaysBetweenLogins: number
  onboardingCompletionPct: number
  devices: Array<{ label: string; pct: number }>
  browsers: Array<{ label: string; pct: number }>
  countries: Array<{ label: string; pct: number }>
}

export interface SupportTicketRow {
  id: string
  subject: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assignedAdmin: string | null
  userId: string
  userEmail: string
  userName: string
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface EmailTemplateRow {
  id: string
  key: string
  name: string
  subject: string
  bodyPreview: string
  enabled: boolean
  updatedAt: string
  variables: string[]
}

export interface NotificationTemplateRow {
  id: string
  name: string
  channel: 'email' | 'in_app' | 'push'
  enabled: boolean
  description: string
}

export interface QrCodeRow {
  id: string
  name: string
  destination: string
  scans: number
  createdAt: string
  status: 'active' | 'paused' | 'archived'
}

export interface PlatformSettings {
  platformName: string
  logoUrl: string
  primaryColor: string
  maintenanceMode: boolean
  defaultTrialDays: number
  soloPriceGbp: number
  businessPriceGbp: number
  groupPriceGbp: number
  emailFromName: string
  emailFromAddress: string
  featureFlags: Record<string, boolean>
  aiEnabled: boolean
  openBankingEnabled: boolean
}

export interface AuditLogEntry {
  id: string
  adminEmail: string
  action: string
  target: string | null
  metadata: string | null
  createdAt: string
}

export interface DeveloperInfo {
  version: string
  environment: string
  nodeEnv: string
  supabaseConfigured: boolean
  databaseStatus: string
  lastMigration: string
}
