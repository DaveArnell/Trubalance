export type AccountType = 'current' | 'savings' | 'reserve'
export type CommitmentSchedule = 'monthly' | 'planned'
export type PlannedFundingMethod = 'immediate' | 'accrue_until_due' | 'hybrid'
export type StatusColor = 'healthy' | 'warning' | 'risk' | 'critical'
export type HealthLevel = 'green' | 'yellow' | 'orange' | 'red'
export type ScopeLevel = 'group' | 'business' | 'venue'
export type GraphRange = '30d' | '90d' | '12m' | 'all'

/** How True Balance history rows are grouped on the Trends page. */
export type HistoryGranularity = 'daily' | 'weekly' | 'monthly'
export type TrendDirection = 'improving' | 'stable' | 'declining'

export interface Group {
  id: string
  name: string
  /** User-chosen accent for group-level view (hex). */
  accentColor?: string
}

export type IncomePattern = 'steady' | 'lumpy'

export interface Business {
  id: string
  groupId: string
  name: string
  /** User-chosen accent for business-scoped UI (hex). */
  accentColor?: string
  /** Steady = regular income; lumpy = irregular large payments (affects cash outlook guidance). */
  incomePattern?: IncomePattern
}

export interface Venue {
  id: string
  businessId: string
  name: string
  /** User-chosen accent for venue-scoped UI (hex). */
  accentColor?: string
}

export interface Account {
  id: string
  venueId?: string
  businessId?: string
  name: string
  type: AccountType
  balance: number
  active: boolean
  updatedAt: string
}

export interface Commitment {
  id: string
  name: string
  schedule: CommitmentSchedule
  amount: number
  dueDayOfMonth?: number
  /** Display label kept for compatibility; prefer plannedDueDate. */
  plannedLabel?: string
  /** ISO date (YYYY-MM-DD) when a planned commitment is due. */
  plannedDueDate?: string
  /** How a planned commitment affects True Balance. */
  fundingMethod?: PlannedFundingMethod
  /** For hybrid funding — reserved immediately; the rest accrues until due. */
  amountToReserveNow?: number
  /** ISO date when accrual-based funding started (usually set when funding is chosen). */
  fundingStartDate?: string
  scopeLevel: ScopeLevel
  scopeId: string
  linkedAccountId?: string
  status: StatusColor
  notes?: string
  lastPaidPeriod?: string
  /** Periods (YYYY-MM) where the due-now entry was dismissed without deleting the monthly cost. */
  dismissedDuePeriods?: string[]
  /** Periods intentionally kept visible in Due after due-day changes. */
  preservedDuePeriods?: string[]
  /** Periods where the due alert was acknowledged — item stays in Due, dot clears. */
  acknowledgedDuePeriods?: string[]
  /** Per-period expected amounts (YYYY-MM) locked when the headline amount changes. */
  periodAmountOverrides?: Record<string, number>
  /** Actual amount paid per period (YYYY-MM) when reconciled. */
  paidPeriodAmounts?: Record<string, number>
  /** Calendar date (YYYY-MM-DD) each period was marked paid — used for historic as-of views. */
  paidPeriodDates?: Record<string, string>
  /** ISO date (YYYY-MM-DD) when this commitment was first added. */
  createdAt?: string
  /** User-defined row order within its list (monthly, planned, due, etc.). */
  sortOrder?: number
}

export type AccruingRowSource = 'commitment' | 'reserve'

export interface CommitmentAccruingRow {
  commitment: Commitment
  accruedAmount: number
  source: AccruingRowSource
  reservePlannerId?: string
}

export interface CommitmentDueRow {
  id: string
  commitment: Commitment
  amount: number
  period: string
  source: 'commitment' | 'reserve'
  reservePlannerId?: string
  reserveBillId?: string
  /** Pending operating ↔ reserve transfer for the current month (completed in Reserve Planner). */
  reserveTransferDirection?: 'to_reserve' | 'from_reserve'
  /** Resolved sort order for display (from commitment or reserve bill). */
  sortOrder?: number
  /** Earliest unpaid period (YYYY-MM) — used for overdue timing when amounts rolled up. */
  dueReferencePeriod?: string
  /** Number of unpaid periods rolled into this row (e.g. 2 quarterly payments). */
  rolledPeriodCount?: number
  /** Month labels included in the rolled amount (for tooltips). */
  rolledMonths?: string[]
}

/** Visual / grouping category for a row in the Due table. */
export type DueRowKind = 'monthly' | 'reserve' | 'planned-open' | 'planned-saving' | 'planned-due'

export interface DueRowSection {
  kind: DueRowKind
  label: string
  rows: CommitmentDueRow[]
}

export interface CommitmentViews {
  monthly: Commitment[]
  buildingUp: CommitmentAccruingRow[]
  due: CommitmentDueRow[]
  planned: Commitment[]
}

export interface ExpectedReceipt {
  id: string
  name: string
  amount: number
  expectedDate?: string
  /** Lump sum counts in full from Start; build up accrues daily from Start to Expected. */
  receiptTiming?: 'lump' | 'accrual'
  /** ISO date (YYYY-MM-DD) Start — when this receipt begins affecting True Balance. */
  accrualStartDate?: string
  /** Per-month actual amounts (YYYY-MM) when the receipt differed from the estimate. */
  periodAmountOverrides?: Record<string, number>
  /** ISO date (YYYY-MM-DD) when this receipt was first added. */
  createdAt?: string
  scopeLevel: ScopeLevel
  scopeId: string
  notes?: string
  received: boolean
  sortOrder?: number
}

export interface ReserveBill {
  id: string
  plannerId: string
  name: string
  monthAmounts: Record<string, number>
  /** Day of month (1–31) when payment is due, per calendar month key. */
  monthDueDays?: Record<string, number>
  /** One-off due amounts (YYYY-MM) when the payment differs from the planner schedule. */
  duePeriodAmountOverrides?: Record<string, number>
  venueId?: string
  notes?: string
  lastPaidPeriod?: string
  dismissedDuePeriods?: string[]
  acknowledgedDuePeriods?: string[]
  sortOrder?: number
}

export interface ReserveMonthConfirmation {
  balance: number
  confirmedAt: string
  operatingBalanceBefore?: number
  transferDone?: boolean
}

export interface ReserveMonthConfirmInput {
  balance: number
  operatingBalanceBefore?: number
  transferDone?: boolean
}

export interface ReservePlanner {
  id: string
  name: string
  businessId: string
  reserveAccountId?: string
  bufferAmount: number
  actualBalance: number
  bills: ReserveBill[]
  monthConfirmations?: Record<string, ReserveMonthConfirmation>
}

export interface ReserveMonthPlan {
  month: string
  monthIndex: number
  billsDue: ReserveBill[]
  totalDue: number
  targetBalance: number
  projectedBalance: number | null
  transferRequired: number
  isCurrentMonth: boolean
  isPastMonth: boolean
}

export interface ReservePlannerSummary {
  planner: ReservePlanner
  businessName: string
  actualBalance: number
  months: ReserveMonthPlan[]
  currentMonth: ReserveMonthPlan
  status: HealthLevel
  action: 'Transfer in' | 'Withdraw' | 'On target'
  difference: number
}

export interface SnapshotAccountChange {
  accountId: string
  accountName: string
  venueId?: string
  venueName: string
  balance: number
}

export interface BalanceSnapshot {
  id: string
  date: string
  scopeType: ScopeLevel
  scopeId: string
  viewName: string
  cash: number
  committedFunds: number
  expectedReceipts: number
  trueBalance: number
  note?: string
  noteSource?: string
  freshness: HealthLevel
  changedAccounts: SnapshotAccountChange[]
  updatedAt: string
  /** Values as first recorded for this date — kept when a cell is manually corrected. */
  recordedValues?: Partial<Pick<BalanceSnapshot, 'cash' | 'committedFunds' | 'expectedReceipts' | 'trueBalance'>>
  /** ISO timestamp of the most recent manual correction. */
  correctedAt?: string
}

export interface ViewScope {
  type: ScopeLevel
  id: string
}

export interface AppState {
  groups: Group[]
  businesses: Business[]
  venues: Venue[]
  accounts: Account[]
  commitments: Commitment[]
  expectedReceipts: ExpectedReceipt[]
  reservePlanners: ReservePlanner[]
  snapshots: BalanceSnapshot[]
  historyRecords: HistoryRecord[]
  /** User annotations for a calendar day — shown on trends and balance log. */
  dayNotes: DayNote[]
  /** Important company numbers & references — Business plan feature. */
  businessReferenceProfiles: BusinessReferenceProfile[]
  /** Business diary reminders — Business plan feature. */
  diaryReminders: DiaryReminder[]
  /** Set when loading built-in demo or restoring a user export. */
  workspaceOrigin?: 'builtin-demo' | 'user'
}

export interface DayNote {
  id: string
  date: string
  text: string
  scopeLevel: ScopeLevel
  scopeId: string
  updatedAt: string
}

export interface CompanyReferencePreset {
  id: string
  label: string
  placeholder?: string
}

export interface CompanyReferenceField {
  id: string
  /** Preset id from COMPANY_REFERENCE_PRESETS or `custom`. */
  presetId: string
  label: string
  value: string
  sortOrder?: number
}

export interface BusinessReferenceProfile {
  businessId: string
  fields: CompanyReferenceField[]
  notes?: string
  updatedAt: string
}

export type DiaryReminderCategory =
  | 'tax'
  | 'companies-house'
  | 'hr-pensions'
  | 'insurance'
  | 'general'

export interface DiaryReminderTemplate {
  id: string
  title: string
  category: DiaryReminderCategory
  notes?: string
  recurring: 'none' | 'yearly'
  /** Months from January (0 = Jan). */
  monthOffset: number
  dayOfMonth: number
}

export interface DiaryReminder {
  id: string
  businessId: string
  title: string
  /** ISO date YYYY-MM-DD */
  date: string
  category: DiaryReminderCategory
  notes?: string
  completed: boolean
  completedAt?: string
  recurring: 'none' | 'yearly'
  templateId?: string
  sortOrder?: number
  createdAt: string
  /** Suppresses the week-before alert for this due date when it matches `date`. */
  weekBeforeAlertDismissedFor?: string
  /** Suppresses the overdue alert for this due date when it matches `date`. */
  overdueAlertDismissedFor?: string
}

export interface DashboardMetrics {
  cash: number
  committedFunds: number
  monthAccruingReserve: number
  reserveMonthlyTarget: number
  monthAccrualProgress: number
  expectedReceipts: number
  trueBalance: number
  updatedDaysAgo: number
  freshness: HealthLevel
  freshnessLabel: string
  health: HealthLevel
  commitmentViews: CommitmentViews
  receipts: ExpectedReceipt[]
  reservePlanner: ReservePlanner | null
  reservePlanners: ReservePlannerSummary[]
  attentionItems: AttentionItem[]
}

export interface AttentionItem {
  id: string
  level: HealthLevel
  title: string
  detail: string
  targetSection: string
  commitmentId?: string
  dueRowId?: string
  widgetId?: string
  dismissible?: boolean
}

/** Full point-in-time capture when balances are saved for the day. */
export interface HistoryRecord {
  id: string
  date: string
  savedAt: string
  viewScope: ViewScope
  viewName: string
  note?: string
  summary: {
    cash: number
    committedFunds: number
    expectedReceipts: number
    trueBalance: number
  }
  accounts: Array<{
    id: string
    name: string
    type: AccountType
    balance: number
    venueId?: string
    businessId?: string
    businessName?: string
    venueName?: string | null
    active: boolean
  }>
  buildingUpItems: Array<{
    rowId: string
    name: string
    accruedAmount: number
    budgetAmount: number
    source: 'commitment' | 'reserve'
    schedule: CommitmentSchedule | 'reserve'
    scopeLevel: ScopeLevel
    scopeId: string
  }>
  dueItems: Array<{
    rowId: string
    name: string
    amount: number
    period: string
    status: StatusColor
    source: 'commitment' | 'reserve'
    schedule: CommitmentSchedule | 'reserve'
    scopeLevel: ScopeLevel
    scopeId: string
  }>
  expectedReceipts: Array<{
    id: string
    name: string
    amount: number
    received: boolean
    scopeLevel: ScopeLevel
    scopeId: string
  }>
  commitments: Array<{
    id: string
    name: string
    amount: number
    accruedAmount: number
    schedule: CommitmentSchedule
    scopeLevel: ScopeLevel
    scopeId: string
    status: StatusColor
  }>
  reservePlanners: Array<{
    id: string
    name: string
    actualBalance: number
    bufferAmount: number
    businessId: string
  }>
}

export interface TrendStats {
  change: number | null
  direction: TrendDirection | null
  rangeLabel: string
}

export interface AccountGroup {
  businessName: string
  venueName: string | null
  label: string
  accounts: Account[]
}
