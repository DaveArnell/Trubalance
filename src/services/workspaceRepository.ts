import type { AppState, BalanceSnapshot, Commitment, DayNote, ExpectedReceipt, FinancialChecklistItem, Group, Business, Venue, Account, ReservePlanner, ReserveBill, HistoryRecord } from '../types'
import { normalizeTierId } from '../config/subscriptionTiers'
import { FOUNDER_LIFETIME_SIGNUP_LIMIT } from '../config/founderProgram'
import type { SubscriptionStatus, WorkspaceSubscription } from '../types/subscription'
import { serializeReceiptDateField } from '../utils/receiptCalculations'
import { tryGetSupabase } from '../lib/supabase'
import { readBrowserAppState } from '../hooks/useAppState'
import { emptyAppState } from '../utils/localStateStorage'

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
}

type PackedHistoryRecord = HistoryRecord & { scopedRecords?: HistoryRecord[] }

function stripPackedSiblings(record: HistoryRecord): HistoryRecord {
  const { scopedRecords: _ignored, ...rest } = record as PackedHistoryRecord
  return rest
}

function historyCaptureScore(record: HistoryRecord): number {
  if ((record.note ?? '').includes('Restored from saved daily snapshot')) return 0
  return (
    (record.dueItems?.length ?? 0) * 1000 +
    (record.expectedReceipts?.length ?? 0) * 10 +
    (record.buildingUpItems?.length ?? 0) +
    (record.commitments?.length ?? 0)
  )
}

/**
 * DB still has UNIQUE (workspace_id, date) — one row per day. Pack every scope
 * for that day into the payload so business History is not deleted on save.
 */
function packHistoryRecordsForCloud(records: HistoryRecord[]): HistoryRecord[] {
  const byDate = new Map<string, HistoryRecord[]>()
  for (const record of records) {
    const clean = stripPackedSiblings(record)
    const list = byDate.get(clean.date) ?? []
    list.push(clean)
    byDate.set(clean.date, list)
  }

  return [...byDate.values()].map((list) => {
    const sorted = [...list].sort((a, b) => {
      const byScore = historyCaptureScore(b) - historyCaptureScore(a)
      if (byScore !== 0) return byScore
      return String(b.savedAt).localeCompare(String(a.savedAt))
    })
    const primary = sorted[0]!
    const siblings = sorted.slice(1)
    if (siblings.length === 0) return primary
    return { ...primary, scopedRecords: siblings } as HistoryRecord
  })
}

export function unpackHistoryRecords(records: HistoryRecord[]): HistoryRecord[] {
  const out: HistoryRecord[] = []
  const seen = new Set<string>()

  const add = (record: HistoryRecord) => {
    if (!record?.date || !record.viewScope?.type || !record.viewScope?.id) return
    const key = `${record.date}:${record.viewScope.type}:${record.viewScope.id}`
    if (seen.has(key)) return
    seen.add(key)
    const packed = record as PackedHistoryRecord
    const siblings = packed.scopedRecords ?? []
    out.push(stripPackedSiblings(record))
    for (const sibling of siblings) add(sibling)
  }

  for (const record of records) add(record)
  return out
}

function mapGroup(row: Record<string, unknown>): Group {
  const accentColor = row.accent_color ? String(row.accent_color) : undefined
  return {
    id: String(row.id),
    name: String(row.name),
    ...(accentColor ? { accentColor } : {}),
  }
}

function mapBusiness(row: Record<string, unknown>): Business {
  const accentColor = row.accent_color ? String(row.accent_color) : undefined
  const rawGroupId = row.group_id
  const groupId =
    rawGroupId != null && String(rawGroupId).trim() !== '' && String(rawGroupId) !== 'null'
      ? String(rawGroupId)
      : ''
  return {
    id: String(row.id),
    groupId,
    name: String(row.name),
    ...(accentColor ? { accentColor } : {}),
  }
}

function mapVenue(row: Record<string, unknown>): Venue {
  const accentColor = row.accent_color ? String(row.accent_color) : undefined
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    name: String(row.name),
    ...(accentColor ? { accentColor } : {}),
  }
}

function mapAccount(row: Record<string, unknown>): Account {
  return {
    id: String(row.id),
    venueId: row.venue_id ? String(row.venue_id) : undefined,
    businessId: row.business_id ? String(row.business_id) : undefined,
    name: String(row.name),
    type: row.type as Account['type'],
    balance: toNumber(row.balance),
    active: Boolean(row.active),
    updatedAt: String(row.updated_at || row.created_at || ''),
  }
}

function mapCommitment(row: Record<string, unknown>): Commitment {
  return {
    id: String(row.id),
    name: String(row.name),
    schedule: row.schedule as Commitment['schedule'],
    amount: toNumber(row.amount),
    dueDayOfMonth: row.due_day_of_month != null ? Number(row.due_day_of_month) : undefined,
    plannedLabel: row.planned_label ? String(row.planned_label) : undefined,
    plannedDueDate: row.planned_due_date ? String(row.planned_due_date) : undefined,
    fundingMethod: row.funding_method as Commitment['fundingMethod'],
    amountToReserveNow: row.amount_to_reserve_now != null ? toNumber(row.amount_to_reserve_now) : undefined,
    fundingStartDate: row.funding_start_date ? String(row.funding_start_date) : undefined,
    scopeLevel: row.scope_level as Commitment['scopeLevel'],
    scopeId: String(row.scope_id),
    linkedAccountId: row.linked_account_id ? String(row.linked_account_id) : undefined,
    status: row.status as Commitment['status'],
    notes: row.notes ? String(row.notes) : undefined,
    lastPaidPeriod: row.last_paid_period ? String(row.last_paid_period) : undefined,
    dismissedDuePeriods: Array.isArray(row.dismissed_due_periods)
      ? row.dismissed_due_periods.map(String)
      : undefined,
    preservedDuePeriods: Array.isArray(row.preserved_due_periods)
      ? row.preserved_due_periods.map(String)
      : undefined,
    acknowledgedDuePeriods: Array.isArray(row.acknowledged_due_periods)
      ? row.acknowledged_due_periods.map(String)
      : undefined,
    periodAmountOverrides:
      row.period_amount_overrides && typeof row.period_amount_overrides === 'object'
        ? Object.fromEntries(
            Object.entries(row.period_amount_overrides as Record<string, unknown>).map(([k, v]) => [
              k,
              toNumber(v),
            ]),
          )
        : undefined,
    paidPeriodAmounts:
      row.paid_period_amounts && typeof row.paid_period_amounts === 'object'
        ? Object.fromEntries(
            Object.entries(row.paid_period_amounts as Record<string, unknown>).map(([k, v]) => [
              k,
              toNumber(v),
            ]),
          )
        : undefined,
    paidPeriodDates:
      row.paid_period_dates && typeof row.paid_period_dates === 'object'
        ? (row.paid_period_dates as Record<string, string>)
        : undefined,
    createdAt: row.created_at ? toDateOnly(String(row.created_at)) : undefined,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : undefined,
  }
}

function toDateOnly(val: string): string {
  if (val.length === 10) return val
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mapReceipt(row: Record<string, unknown>): ExpectedReceipt {
  const expectedRaw = row.expected_date ? String(row.expected_date) : undefined
  const startRaw = row.accrual_start_date ? String(row.accrual_start_date) : undefined
  return {
    id: String(row.id),
    name: String(row.name),
    amount: toNumber(row.amount),
    expectedDate: expectedRaw ? toDateOnly(expectedRaw) : undefined,
    receiptTiming: row.receipt_timing ? (row.receipt_timing as ExpectedReceipt['receiptTiming']) : undefined,
    accrualStartDate: startRaw ? toDateOnly(startRaw) : undefined,
    periodAmountOverrides:
      row.period_amount_overrides && typeof row.period_amount_overrides === 'object'
        ? Object.fromEntries(
            Object.entries(row.period_amount_overrides as Record<string, unknown>).map(([k, v]) => [k, toNumber(v)]),
          )
        : undefined,
    createdAt: row.created_at ? toDateOnly(String(row.created_at)) : undefined,
    scopeLevel: row.scope_level as ExpectedReceipt['scopeLevel'],
    scopeId: String(row.scope_id),
    notes: row.notes ? String(row.notes) : undefined,
    received: Boolean(row.received),
    receivedDate: row.received_date ? toDateOnly(String(row.received_date)) : undefined,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : undefined,
  }
}

function mapBill(row: Record<string, unknown>): ReserveBill {
  return {
    id: String(row.id),
    plannerId: String(row.planner_id),
    name: String(row.name),
    monthAmounts: (row.month_amounts as Record<string, number>) ?? {},
    monthDueDays: (row.month_due_days as Record<string, number>) ?? undefined,
    duePeriodAmountOverrides:
      row.due_period_amount_overrides && typeof row.due_period_amount_overrides === 'object'
        ? Object.fromEntries(
            Object.entries(row.due_period_amount_overrides as Record<string, unknown>).map(
              ([period, amount]) => [period, toNumber(amount)],
            ),
          )
        : undefined,
    venueId: row.venue_id ? String(row.venue_id) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: row.created_at ? toDateOnly(String(row.created_at)) : undefined,
    lastPaidPeriod: row.last_paid_period ? String(row.last_paid_period) : undefined,
    lastPaidOnDate: row.last_paid_on_date ? toDateOnly(String(row.last_paid_on_date)) : undefined,
    dismissedDuePeriods: Array.isArray(row.dismissed_due_periods)
      ? row.dismissed_due_periods.map(String)
      : undefined,
    acknowledgedDuePeriods: Array.isArray(row.acknowledged_due_periods)
      ? row.acknowledged_due_periods.map(String)
      : undefined,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : undefined,
  }
}

function mapSnapshot(row: Record<string, unknown>): BalanceSnapshot {
  return {
    id: String(row.id),
    date: String(row.date),
    scopeType: row.scope_type as BalanceSnapshot['scopeType'],
    scopeId: String(row.scope_id),
    viewName: String(row.view_name),
    cash: toNumber(row.cash),
    committedFunds: toNumber(row.committed_funds),
    expectedReceipts: toNumber(row.expected_receipts),
    trueBalance: toNumber(row.true_balance),
    note: row.note ? String(row.note) : undefined,
    noteSource: row.note_source ? String(row.note_source) : undefined,
    freshness: row.freshness as BalanceSnapshot['freshness'],
    changedAccounts: (row.changed_accounts as BalanceSnapshot['changedAccounts']) ?? [],
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    recordedValues: row.recorded_values as BalanceSnapshot['recordedValues'],
    correctedAt: row.corrected_at ? String(row.corrected_at) : undefined,
  }
}

function mapHistoryRecord(row: Record<string, unknown>): HistoryRecord {
  const payload = (row.payload ?? {}) as HistoryRecord
  return {
    ...payload,
    id: String(row.id),
    date: String(row.date),
    savedAt: String(row.saved_at ?? payload.savedAt ?? new Date().toISOString()),
  }
}

function mapDayNote(row: Record<string, unknown>): DayNote {
  return {
    id: String(row.id),
    date: String(row.date),
    text: String(row.text),
    scopeLevel: row.scope_level as DayNote['scopeLevel'],
    scopeId: String(row.scope_id),
    updatedAt: String(row.updated_at),
  }
}

function mapFinancialChecklistItem(row: Record<string, unknown>): FinancialChecklistItem {
  const completedRaw = row.completed_periods
  const completedPeriods = Array.isArray(completedRaw)
    ? completedRaw.map(String)
    : completedRaw && typeof completedRaw === 'object'
      ? Object.values(completedRaw as Record<string, unknown>).map(String)
      : []
  const dueMonths = Array.isArray(row.due_months)
    ? (row.due_months as unknown[]).map(Number).filter((n) => n >= 1 && n <= 12)
    : undefined
  return {
    id: String(row.id),
    name: String(row.name),
    recurrence: (row.recurrence as FinancialChecklistItem['recurrence']) ?? 'monthly',
    dueDate: row.due_date ? String(row.due_date).slice(0, 10) : undefined,
    dueDayOfMonth: row.due_day_of_month != null ? Number(row.due_day_of_month) : undefined,
    dueMonths,
    scopeLevel: row.scope_level === 'group' ? 'group' : 'business',
    scopeId: String(row.scope_id),
    notes: row.notes ? String(row.notes) : undefined,
    completedPeriods,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : undefined,
    createdAt: row.created_at ? String(row.created_at).slice(0, 10) : undefined,
  }
}

export interface WorkspaceLoadResult {
  state: AppState
  /** True when any table failed to load — cloud save must not wipe missing tables. */
  loadHadErrors: boolean
}

export async function loadWorkspaceState(workspaceId: string): Promise<WorkspaceLoadResult> {
  const supabase = tryGetSupabase()
  if (!supabase) return { state: emptyAppState(), loadHadErrors: true }

  const [
    groupsRes,
    businessesRes,
    venuesRes,
    accountsRes,
    commitmentsRes,
    receiptsRes,
    plannersRes,
    billsRes,
    snapshotsRes,
    historyRes,
    dayNotesRes,
    checklistRes,
    workspaceMetaRes,
  ] = await Promise.all([
    supabase.from('groups').select('*').eq('workspace_id', workspaceId).order('sort_order'),
    supabase.from('businesses').select('*').eq('workspace_id', workspaceId).order('sort_order'),
    supabase.from('venues').select('*').eq('workspace_id', workspaceId).order('sort_order'),
    supabase.from('accounts').select('*').eq('workspace_id', workspaceId),
    supabase.from('commitments').select('*').eq('workspace_id', workspaceId).order('sort_order'),
    supabase.from('expected_receipts').select('*').eq('workspace_id', workspaceId).order('sort_order'),
    supabase.from('reserve_planners').select('*').eq('workspace_id', workspaceId).order('sort_order'),
    supabase.from('reserve_bills').select('*').eq('workspace_id', workspaceId).order('sort_order'),
    supabase.from('balance_snapshots').select('*').eq('workspace_id', workspaceId).order('date'),
    supabase.from('history_records').select('*').eq('workspace_id', workspaceId).order('date', { ascending: false }),
    supabase.from('day_notes').select('*').eq('workspace_id', workspaceId).order('date'),
    supabase.from('financial_checklist_items').select('*').eq('workspace_id', workspaceId).order('sort_order'),
    supabase.from('workspaces').select('reveal_from_overrides').eq('id', workspaceId).maybeSingle(),
  ])

  const responses = [
    ['groups', groupsRes],
    ['businesses', businessesRes],
    ['venues', venuesRes],
    ['accounts', accountsRes],
    ['commitments', commitmentsRes],
    ['expected_receipts', receiptsRes],
    ['reserve_planners', plannersRes],
    ['reserve_bills', billsRes],
    ['balance_snapshots', snapshotsRes],
    ['history_records', historyRes],
    ['day_notes', dayNotesRes],
    ['financial_checklist_items', checklistRes],
  ] as const

  let loadHadErrors = false
  for (const [table, res] of responses) {
    if (res.error) {
      // Table may not exist until migration 037 is applied — don't fail the whole load.
      if (table === 'financial_checklist_items') {
        console.warn(`[workspaceRepository] load ${table}:`, res.error.message)
        continue
      }
      loadHadErrors = true
      console.error(`[workspaceRepository] load ${table}:`, res.error.message)
    }
  }

  const bills = (billsRes.data ?? []).map((row) => mapBill(row as Record<string, unknown>))
  const billsByPlanner = new Map<string, ReserveBill[]>()
  for (const bill of bills) {
    const list = billsByPlanner.get(bill.plannerId) ?? []
    list.push(bill)
    billsByPlanner.set(bill.plannerId, list)
  }

  const reservePlanners: ReservePlanner[] = (plannersRes.data ?? []).map((row) => {
    const raw = row as Record<string, unknown>
    return {
      id: String(raw.id),
      name: String(raw.name),
      businessId: String(raw.business_id),
      reserveAccountId: raw.reserve_account_id ? String(raw.reserve_account_id) : undefined,
      bufferAmount: toNumber(raw.buffer_amount),
      actualBalance: toNumber(raw.actual_balance),
      bills: billsByPlanner.get(String(raw.id)) ?? [],
      monthConfirmations: (raw.month_confirmations as ReservePlanner['monthConfirmations']) ?? undefined,
    }
  })

  const deletedReceiptIds = parseDeletedReceiptIdsFromWorkspaceMeta(
    (workspaceMetaRes.data as { reveal_from_overrides?: unknown } | null)?.reveal_from_overrides,
  )
  const deletedReceiptIdSet = new Set(deletedReceiptIds)

  const state: AppState = {
    groups: (groupsRes.data ?? []).map((row) => mapGroup(row as Record<string, unknown>)),
    businesses: (businessesRes.data ?? []).map((row) => mapBusiness(row as Record<string, unknown>)),
    venues: (venuesRes.data ?? []).map((row) => mapVenue(row as Record<string, unknown>)),
    accounts: (accountsRes.data ?? []).map((row) => mapAccount(row as Record<string, unknown>)),
    commitments: (commitmentsRes.data ?? []).map((row) => mapCommitment(row as Record<string, unknown>)),
    expectedReceipts: (receiptsRes.data ?? [])
      .map((row) => mapReceipt(row as Record<string, unknown>))
      .filter((receipt) => !deletedReceiptIdSet.has(receipt.id)),
    reservePlanners,
    snapshots: (snapshotsRes.data ?? []).map((row) => mapSnapshot(row as Record<string, unknown>)),
    historyRecords: unpackHistoryRecords(
      (historyRes.data ?? []).map((row) => mapHistoryRecord(row as Record<string, unknown>)),
    ),
    dayNotes: (dayNotesRes.data ?? []).map((row) => mapDayNote(row as Record<string, unknown>)),
    financialChecklistItems: checklistRes.error
      ? []
      : (checklistRes.data ?? []).map((row) => mapFinancialChecklistItem(row as Record<string, unknown>)),
    deletedReceiptIds,
  }

  return { state, loadHadErrors }
}

/** Whether the database has no saved rows yet for this workspace. */
export async function isWorkspaceEmptyInDatabase(workspaceId: string): Promise<boolean> {
  const supabase = tryGetSupabase()
  if (!supabase) return true

  // Groups alone is not enough — a groups count error used to look like a blank
  // workspace and the client then replaced living businesses/costs with empty state.
  const tables = ['groups', 'businesses', 'accounts', 'commitments', 'reserve_planners'] as const
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
    if (error) return false
    if ((count ?? 0) > 0) return false
  }

  return true
}

const WORKSPACE_TABLE_NAMES = [
  'groups',
  'businesses',
  'venues',
  'accounts',
  'commitments',
  'expected_receipts',
  'reserve_planners',
  'reserve_bills',
  'balance_snapshots',
  'history_records',
  'day_notes',
  'financial_checklist_items',
] as const

export type WorkspaceTableName = (typeof WORKSPACE_TABLE_NAMES)[number]

function tableCounts(state: AppState): Record<WorkspaceTableName, number> {
  return {
    groups: state.groups.length,
    businesses: state.businesses.length,
    venues: state.venues.length,
    accounts: state.accounts.length,
    commitments: state.commitments.length,
    expected_receipts: state.expectedReceipts.length,
    reserve_planners: state.reservePlanners.length,
    reserve_bills: state.reservePlanners.reduce((n, p) => n + p.bills.length, 0),
    balance_snapshots: state.snapshots.length,
    history_records: (state.historyRecords ?? []).length,
    day_notes: (state.dayNotes ?? []).length,
    financial_checklist_items: (state.financialChecklistItems ?? []).length,
  }
}

/** Safe empty-table deletes for autosave — never wipe rows on first persist after a loaded workspace. */
export function buildSafeTableEmptyDeletes(
  state: AppState,
  options: { loaded: AppState | null; previous: AppState | null; allowAll?: boolean },
): Partial<Record<WorkspaceTableName, boolean>> | undefined {
  const counts = tableCounts(state)
  const loaded = options.loaded ? tableCounts(options.loaded) : null
  const previous = options.previous ? tableCounts(options.previous) : null
  const out: Partial<Record<WorkspaceTableName, boolean>> = {}

  for (const table of WORKSPACE_TABLE_NAMES) {
    if (counts[table] > 0) continue

    // Even during explicit allowAll (legacy), refuse to empty-wipe critical tables
    // that were present when the workspace loaded — use targeted ID deletes instead.
    const loadedCount = loaded?.[table] ?? 0
    if (
      (table === 'expected_receipts' ||
        table === 'reserve_planners' ||
        table === 'reserve_bills' ||
        table === 'commitments') &&
      loadedCount > 0
    ) {
      out[table] = false
      continue
    }

    if (options.allowAll) {
      out[table] = true
      continue
    }

    if (previous == null) {
      out[table] = false
      continue
    }
    const prevCount = previous[table] ?? 0
    out[table] = prevCount > 0 || loadedCount === 0
  }

  return out
}

export async function saveWorkspaceState(
  workspaceId: string,
  state: AppState,
  options?: {
    allowEmptyDeletes?: boolean
    /** Per-table override when row list is empty — avoids wiping data on a partial/stale save. */
    tableEmptyDeletes?: Partial<Record<WorkspaceTableName, boolean>>
    /** Previous persisted state — used for targeted deletes instead of orphan wipes. */
    previousState?: AppState | null
  },
): Promise<void> {
  const supabase = tryGetSupabase()
  if (!supabase) return
  const allowEmptyDeletes = options?.allowEmptyDeletes ?? false

  const ws = { workspace_id: workspaceId }

  const groupRows = state.groups.map((g, i) => ({
    id: g.id,
    name: g.name,
    sort_order: i,
    accent_color: g.accentColor ?? null,
    ...ws,
  }))
  const businessRows = state.businesses.map((b, i) => ({
    id: b.id,
    group_id: b.groupId,
    name: b.name,
    sort_order: i,
    accent_color: b.accentColor ?? null,
    ...ws,
  }))
  const venueRows = state.venues.map((v, i) => ({
    id: v.id,
    business_id: v.businessId,
    name: v.name,
    sort_order: i,
    accent_color: v.accentColor ?? null,
    ...ws,
  }))
  const accountRows = state.accounts.map((a) => ({
    id: a.id,
    venue_id: a.venueId ?? null,
    business_id: a.businessId ?? null,
    name: a.name,
    type: a.type,
    balance: a.balance,
    active: a.active ?? true,
    updated_at: a.updatedAt ?? new Date().toISOString(),
    ...ws,
  }))
  const commitmentRows = state.commitments.map((c, i) => ({
    id: c.id,
    name: c.name,
    schedule: c.schedule,
    amount: c.amount,
    due_day_of_month: c.dueDayOfMonth ?? null,
    planned_label: c.plannedLabel ?? null,
    planned_due_date: c.plannedDueDate ?? null,
    funding_method: c.fundingMethod ?? null,
    amount_to_reserve_now: c.amountToReserveNow ?? null,
    funding_start_date: c.fundingStartDate ?? null,
    scope_level: c.scopeLevel,
    scope_id: c.scopeId,
    linked_account_id: c.linkedAccountId ?? null,
    status: c.status,
    notes: c.notes ?? null,
    last_paid_period: c.lastPaidPeriod ?? null,
    dismissed_due_periods: c.dismissedDuePeriods ?? [],
    acknowledged_due_periods: c.acknowledgedDuePeriods ?? [],
    period_amount_overrides: c.periodAmountOverrides ?? {},
    paid_period_amounts: c.paidPeriodAmounts ?? {},
    preserved_due_periods: c.preservedDuePeriods ?? [],
    paid_period_dates: c.paidPeriodDates ?? {},
    created_at: c.createdAt ?? null,
    sort_order: c.sortOrder ?? i,
    ...ws,
  }))
  const receiptRows = state.expectedReceipts.map((r, i) => ({
    id: r.id,
    name: r.name,
    amount: r.amount,
    expected_date: serializeReceiptDateField(r.expectedDate),
    receipt_timing: r.receiptTiming === 'lump' || r.receiptTiming === 'accrual' ? r.receiptTiming : null,
    accrual_start_date: serializeReceiptDateField(r.accrualStartDate),
    period_amount_overrides: r.periodAmountOverrides ?? {},
    scope_level: r.scopeLevel,
    scope_id: r.scopeId,
    notes: r.notes ?? null,
    received: r.received,
    received_date: serializeReceiptDateField(r.receivedDate),
    sort_order: r.sortOrder ?? i,
    created_at: r.createdAt
      ? r.createdAt.includes('T')
        ? r.createdAt
        : `${r.createdAt}T12:00:00.000Z`
      : new Date().toISOString(),
    ...ws,
  }))
  const plannerRows = state.reservePlanners.map((p, i) => ({
    id: p.id,
    name: p.name,
    business_id: p.businessId,
    reserve_account_id: p.reserveAccountId ?? null,
    buffer_amount: p.bufferAmount,
    actual_balance: p.actualBalance,
    month_confirmations: p.monthConfirmations ?? {},
    sort_order: i,
    ...ws,
  }))
  const billRows = state.reservePlanners.flatMap((p) =>
    p.bills.map((b, i) => ({
      id: b.id,
      planner_id: p.id,
      name: b.name,
      month_amounts: b.monthAmounts,
      month_due_days: b.monthDueDays ?? {},
      due_period_amount_overrides: b.duePeriodAmountOverrides ?? {},
      venue_id: b.venueId ?? null,
      notes: b.notes ?? null,
      ...(b.createdAt ? { created_at: `${b.createdAt}T12:00:00.000Z` } : {}),
      last_paid_period: b.lastPaidPeriod ?? null,
      last_paid_on_date: b.lastPaidOnDate ?? null,
      dismissed_due_periods: b.dismissedDuePeriods ?? [],
      acknowledged_due_periods: b.acknowledgedDuePeriods ?? [],
      sort_order: b.sortOrder ?? i,
      ...ws,
    })),
  )
  // One row per (date, scope). Upsert-by-id alone 409s when another id already
  // owns the UNIQUE (workspace_id, date, scope_type, scope_id) slot.
  const previousSnapshotIdByKey = new Map(
    (options?.previousState?.snapshots ?? []).map((snap) => [
      `${snap.date}:${snap.scopeType}:${snap.scopeId}`,
      snap.id,
    ]),
  )
  const snapshotByKey = new Map<
    string,
    {
      id: string
      date: string
      scope_type: string
      scope_id: string
      view_name: string
      cash: number
      committed_funds: number
      expected_receipts: number
      true_balance: number
      note: string | null
      note_source: string | null
      freshness: string
      changed_accounts: unknown
      recorded_values: unknown
      corrected_at: string | null
      updated_at: string
      workspace_id: string
    }
  >()
  for (const s of state.snapshots) {
    if (String(s.id).startsWith('split-snap:')) continue
    const key = `${s.date}:${s.scopeType}:${s.scopeId}`
    const updatedAt = s.updatedAt ?? new Date().toISOString()
    const existing = snapshotByKey.get(key)
    if (existing && String(existing.updated_at) > updatedAt) continue
    snapshotByKey.set(key, {
      id: previousSnapshotIdByKey.get(key) ?? s.id,
      date: s.date,
      scope_type: s.scopeType,
      scope_id: s.scopeId,
      view_name: s.viewName ?? '',
      cash: s.cash ?? 0,
      committed_funds: s.committedFunds ?? 0,
      expected_receipts: s.expectedReceipts ?? 0,
      true_balance: s.trueBalance ?? 0,
      note: s.note ?? null,
      note_source: s.noteSource ?? null,
      freshness: s.freshness ?? 'green',
      changed_accounts: s.changedAccounts ?? [],
      recorded_values: s.recordedValues ?? null,
      corrected_at: s.correctedAt ?? null,
      updated_at: updatedAt,
      ...ws,
    })
  }
  const snapshotRows = [...snapshotByKey.values()]
  const historyRows = packHistoryRecordsForCloud(state.historyRecords ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    saved_at: r.savedAt,
    payload: r,
    ...ws,
  }))
  const dayNoteRows = (state.dayNotes ?? []).map((n) => ({
    id: n.id,
    date: n.date,
    text: n.text,
    scope_level: n.scopeLevel,
    scope_id: n.scopeId,
    updated_at: n.updatedAt ?? new Date().toISOString(),
    ...ws,
  }))
  const checklistRows = (state.financialChecklistItems ?? []).map((item, i) => ({
    id: item.id,
    name: item.name,
    recurrence: item.recurrence,
    due_date: item.dueDate ?? null,
    due_day_of_month: item.dueDayOfMonth ?? null,
    due_months: item.dueMonths ?? [],
    scope_level: item.scopeLevel,
    scope_id: item.scopeId,
    notes: item.notes ?? null,
    completed_periods: item.completedPeriods ?? [],
    sort_order: item.sortOrder ?? i,
    created_at: item.createdAt
      ? item.createdAt.includes('T')
        ? item.createdAt
        : `${item.createdAt}T12:00:00.000Z`
      : new Date().toISOString(),
    ...ws,
  }))
  const tables = [
    { name: 'groups', rows: groupRows },
    { name: 'businesses', rows: businessRows },
    { name: 'venues', rows: venueRows },
    { name: 'accounts', rows: accountRows },
    { name: 'commitments', rows: commitmentRows },
    { name: 'expected_receipts', rows: receiptRows },
    { name: 'reserve_planners', rows: plannerRows },
    { name: 'reserve_bills', rows: billRows },
    { name: 'balance_snapshots', rows: snapshotRows },
    { name: 'history_records', rows: historyRows },
    { name: 'day_notes', rows: dayNoteRows },
    { name: 'financial_checklist_items', rows: checklistRows },
  ] as const

  const EXTENDED_COLUMNS = [
    'preserved_due_periods',
    'paid_period_dates',
    'receipt_timing',
    'accrual_start_date',
    'period_amount_overrides',
    // Optional / later migrations — retry without these so core paid flags still save
    'last_paid_on_date',
    'due_period_amount_overrides',
    'acknowledged_due_periods',
    'received_date',
  ]

  /**
   * Fail the whole save if these cannot upsert — silent continue left devices out of sync.
   * Trends tables are NOT critical: a snapshot/history conflict must never block Due,
   * reserve bills, or account saves (that caused edits to appear then vanish).
   */
  const CRITICAL_UPSERT_TABLES = new Set([
    'groups',
    'businesses',
    'venues',
    'accounts',
    'commitments',
    'expected_receipts',
    'reserve_planners',
    'reserve_bills',
  ])

  const upsertConflict = (tableName: string): { onConflict: string } | undefined => {
    if (tableName === 'history_records') return { onConflict: 'workspace_id,date' }
    if (tableName === 'balance_snapshots') {
      return { onConflict: 'workspace_id,date,scope_type,scope_id' }
    }
    return undefined
  }
  const failedCritical: string[] = []

  /** Tables where a partial hydrate + orphan-delete previously wiped live data. */
  const TARGETED_DELETE_TABLES = new Set<string>([
    'reserve_planners',
    'reserve_bills',
    'expected_receipts',
    'commitments',
    'accounts',
    'businesses',
    'venues',
    'groups',
    'history_records',
    'balance_snapshots',
    'financial_checklist_items',
  ])

  const previousIdsByTable = (tableName: string): string[] => {
    const previous = options?.previousState
    if (!previous) return []
    switch (tableName) {
      case 'groups':
        return previous.groups.map((row) => row.id)
      case 'businesses':
        return previous.businesses.map((row) => row.id)
      case 'venues':
        return previous.venues.map((row) => row.id)
      case 'accounts':
        return previous.accounts.map((row) => row.id)
      case 'commitments':
        return previous.commitments.map((row) => row.id)
      case 'expected_receipts':
        return previous.expectedReceipts.map((row) => row.id)
      case 'reserve_planners':
        return previous.reservePlanners.map((row) => row.id)
      case 'reserve_bills':
        return previous.reservePlanners.flatMap((planner) => planner.bills.map((bill) => bill.id))
      case 'history_records':
        return (previous.historyRecords ?? []).map((row) => row.id)
      case 'balance_snapshots':
        return previous.snapshots.map((row) => row.id)
      case 'financial_checklist_items':
        return (previous.financialChecklistItems ?? []).map((row) => row.id)
      default:
        return []
    }
  }

  const hasPreviousState = Boolean(options?.previousState)

  const refuseMassDelete = (tableName: string, removed: string[], previous: string[]): boolean => {
    if (!TARGETED_DELETE_TABLES.has(tableName)) return false
    // Explicit import/restore may replace the whole workspace.
    if (allowEmptyDeletes && !hasPreviousState) return false
    if (previous.length > 1 && removed.length === previous.length) {
      console.error(
        `[workspaceRepository] Refusing to delete all ${previous.length} ${tableName} rows in one save`,
      )
      return true
    }
    return false
  }

  for (const table of tables) {
    if (table.rows.length === 0) {
      // Empty wipe is only for explicit import/restore (allowEmptyDeletes, no previousState).
      // Autosave always passes previousState — never wipe a whole critical table to empty.
      const mayDeleteEmpty =
        options?.tableEmptyDeletes?.[table.name as WorkspaceTableName] ??
        (allowEmptyDeletes && !hasPreviousState)
      if (
        TARGETED_DELETE_TABLES.has(table.name) &&
        hasPreviousState &&
        !(options?.tableEmptyDeletes?.[table.name as WorkspaceTableName] === true)
      ) {
        const removed = previousIdsByTable(table.name)
        if (removed.length > 0 && !refuseMassDelete(table.name, removed, removed)) {
          await supabase.from(table.name).delete().eq('workspace_id', workspaceId).in('id', removed)
        }
        continue
      }
      if (!mayDeleteEmpty) continue
      await supabase.from(table.name).delete().eq('workspace_id', workspaceId)
      continue
    }

    const { error } = await supabase.from(table.name).upsert(
      table.rows as Record<string, unknown>[],
      upsertConflict(table.name),
    )
    if (error) {
      console.warn(`[workspaceRepository] upsert ${table.name}:`, error.message)
      const coreRows = table.rows.map((row) => {
        const clean = { ...(row as Record<string, unknown>) }
        for (const col of EXTENDED_COLUMNS) delete clean[col]
        return clean
      })
      const { error: retryErr } = await supabase.from(table.name).upsert(
        coreRows,
        upsertConflict(table.name),
      )
      if (retryErr) {
        console.warn(`[workspaceRepository] upsert ${table.name} (retry):`, retryErr.message)
        if (CRITICAL_UPSERT_TABLES.has(table.name)) {
          failedCritical.push(`${table.name}: ${retryErr.message}`)
        }
        continue
      }
    }

    const ids = table.rows.map((r) => (r as Record<string, unknown>).id).filter(Boolean) as string[]
    if (ids.length === 0) continue

    // Critical tables: always targeted deletes when we know the previous snapshot.
    // Orphan wipe ("delete everything not in this save") only for explicit full replace
    // with no previousState (import / file restore). Partial loads + orphan wipe wiped
    // expected receipts (e.g. Swindon/Blackpool).
    if (TARGETED_DELETE_TABLES.has(table.name) && (!allowEmptyDeletes || hasPreviousState)) {
      const keep = new Set(ids)
      const previousIds = previousIdsByTable(table.name)
      const removed = previousIds.filter((id) => !keep.has(id))
      if (removed.length > 0 && !refuseMassDelete(table.name, removed, previousIds)) {
        await supabase.from(table.name).delete().eq('workspace_id', workspaceId).in('id', removed)
      }
      continue
    }

    await supabase
      .from(table.name)
      .delete()
      .eq('workspace_id', workspaceId)
      .not('id', 'in', `(${ids.join(',')})`)
  }

  // Business Hub removed — clear any legacy rows still in the database.
  await supabase.from('business_reference_profiles').delete().eq('workspace_id', workspaceId)
  await supabase.from('diary_reminders').delete().eq('workspace_id', workspaceId)

  if (failedCritical.length > 0) {
    throw new Error(`Cloud save failed for: ${failedCritical.join('; ')}`)
  }

  await saveWorkspaceDeletedReceiptIds(workspaceId, state.deletedReceiptIds ?? [])
}

const DELETED_RECEIPTS_META_KEY = '__deletedReceiptIds'

function parseDeletedReceiptIdsFromWorkspaceMeta(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  const ids = (raw as Record<string, unknown>)[DELETED_RECEIPTS_META_KEY]
  if (!Array.isArray(ids)) return []
  return ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
}

export async function saveWorkspaceDeletedReceiptIds(
  workspaceId: string,
  ids: string[],
): Promise<void> {
  const supabase = tryGetSupabase()
  if (!supabase) return

  const { data, error: readError } = await supabase
    .from('workspaces')
    .select('reveal_from_overrides')
    .eq('id', workspaceId)
    .maybeSingle()

  if (readError) {
    console.warn('[workspaceRepository] load deleted receipt tombstones:', readError.message)
    return
  }

  const current =
    data?.reveal_from_overrides &&
    typeof data.reveal_from_overrides === 'object' &&
    !Array.isArray(data.reveal_from_overrides)
      ? { ...(data.reveal_from_overrides as Record<string, unknown>) }
      : {}

  // Append-only: never drop ids already stored (Trends saves must not wipe deletes).
  const existing = parseDeletedReceiptIdsFromWorkspaceMeta(current)
  const unique = [...new Set([...existing, ...ids.filter(Boolean)])]
  if (unique.length === 0) return
  current[DELETED_RECEIPTS_META_KEY] = unique

  const { error } = await supabase
    .from('workspaces')
    .update({ reveal_from_overrides: current, updated_at: new Date().toISOString() })
    .eq('id', workspaceId)

  if (error) {
    console.warn('[workspaceRepository] save deleted receipt tombstones:', error.message)
  }
}

export async function getUserWorkspaceId(userId: string): Promise<string | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null

  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  return data?.workspace_id ?? null
}

export async function getWorkspaceIdForUser(userId: string): Promise<string | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (member?.workspace_id) return member.workspace_id

  const { data: owned } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()

  return owned?.id ?? null
}

export async function importLocalStorageToWorkspace(workspaceId: string): Promise<boolean> {
  const parsed = readBrowserAppState()
  if (!parsed) return false
  await saveWorkspaceState(workspaceId, parsed, { allowEmptyDeletes: true })
  return true
}

export async function restoreStateToWorkspace(workspaceId: string, state: AppState): Promise<void> {
  await saveWorkspaceState(workspaceId, state, { allowEmptyDeletes: true })
}

function mapStripeStatus(raw: string | null | undefined): SubscriptionStatus {
  switch (raw) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'cancelled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'expired'
    default:
      return 'trialing'
  }
}

function mapWorkspaceSubscriptionRow(
  row: Record<string, unknown>,
  subscriptionRow?: Record<string, unknown> | null,
): WorkspaceSubscription {
  const tierId = normalizeTierId(row.subscription_tier ? String(row.subscription_tier) : 'solo')
  const lifetimeAccess = Boolean(row.lifetime_access)
  const betaTester = Boolean(row.beta_tester)
  const trialEndsAt = row.trial_ends_at ? String(row.trial_ends_at) : null
  const adminOverride = row.admin_tier_override
    ? normalizeTierId(String(row.admin_tier_override))
    : null
  const gracePeriodEndsAt =
    (subscriptionRow?.grace_period_ends_at as string | null | undefined) ??
    (row.grace_period_ends_at ? String(row.grace_period_ends_at) : null)

  let status: SubscriptionStatus = 'trialing'
  if (lifetimeAccess || betaTester) {
    status = 'active'
  } else if (subscriptionRow?.status) {
    status = mapStripeStatus(String(subscriptionRow.status))
  } else if (trialEndsAt && new Date(trialEndsAt) <= new Date()) {
    status = 'expired'
  }

  const billingIntervalRaw =
    subscriptionRow?.billing_interval ?? row.billing_interval
  const billingInterval =
    billingIntervalRaw === 'monthly' || billingIntervalRaw === 'annual'
      ? billingIntervalRaw
      : null

  const paidTier = subscriptionRow?.tier
    ? normalizeTierId(String(subscriptionRow.tier))
    : tierId

  return {
    tierId: paidTier,
    status,
    trialEndsAt: lifetimeAccess ? null : trialEndsAt,
    lifetimeAccess,
    betaTester,
    adminTierOverride: adminOverride,
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripeSubscriptionId: subscriptionRow?.stripe_subscription_id
      ? String(subscriptionRow.stripe_subscription_id)
      : null,
    currentPeriodStart: subscriptionRow?.current_period_start
      ? String(subscriptionRow.current_period_start)
      : null,
    currentPeriodEnd: subscriptionRow?.current_period_end
      ? String(subscriptionRow.current_period_end)
      : null,
    cancelAtPeriodEnd: Boolean(subscriptionRow?.cancel_at_period_end),
    gracePeriodEndsAt: gracePeriodEndsAt ? String(gracePeriodEndsAt) : null,
    billingInterval,
    statementAiUnlimited: Boolean(row.statement_ai_unlimited),
    statementAiUsage: asStatementAiUsage(row.statement_ai_usage),
  }
}

function asStatementAiUsage(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) out[key] = value
  }
  return out
}

export async function loadWorkspaceSubscription(workspaceId: string): Promise<WorkspaceSubscription | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null

  const withUnlimited = `subscription_tier, trial_ends_at, lifetime_access, beta_tester, admin_tier_override,
       grace_period_ends_at, billing_interval, stripe_customer_id, statement_ai_unlimited, statement_ai_usage,
       subscriptions (
         stripe_subscription_id, stripe_price_id, status, tier,
         current_period_start, current_period_end, cancel_at_period_end,
         grace_period_ends_at, billing_interval
       )`
  const withoutUnlimited = `subscription_tier, trial_ends_at, lifetime_access, beta_tester, admin_tier_override,
       grace_period_ends_at, billing_interval, stripe_customer_id,
       subscriptions (
         stripe_subscription_id, stripe_price_id, status, tier,
         current_period_start, current_period_end, cancel_at_period_end,
         grace_period_ends_at, billing_interval
       )`

  let { data, error } = await supabase
    .from('workspaces')
    .select(withUnlimited)
    .eq('id', workspaceId)
    .maybeSingle()

  if (error) {
    const missingColumn =
      /statement_ai_unlimited|statement_ai_usage/i.test(error.message) ||
      error.code === '42703' ||
      error.code === 'PGRST204'
    if (!missingColumn) return null
    ;({ data, error } = await supabase
      .from('workspaces')
      .select(withoutUnlimited)
      .eq('id', workspaceId)
      .maybeSingle())
  }

  if (error || !data) return null

  const row = data as Record<string, unknown>
  const subscriptions = row.subscriptions
  const subscriptionRow = Array.isArray(subscriptions)
    ? (subscriptions[0] as Record<string, unknown> | undefined)
    : (subscriptions as Record<string, unknown> | null | undefined)

  return mapWorkspaceSubscriptionRow(row, subscriptionRow ?? null)
}

export async function loadWorkspaceRevealFrom(
  workspaceId: string,
): Promise<Record<string, string>> {
  const supabase = tryGetSupabase()
  if (!supabase) return {}

  const { data, error } = await supabase
    .from('workspaces')
    .select('reveal_from_overrides')
    .eq('id', workspaceId)
    .maybeSingle()

  if (error || !data) return {}

  const raw = (data as { reveal_from_overrides?: unknown }).reveal_from_overrides
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const entries = Object.entries(raw as Record<string, unknown>).filter(
    (entry): entry is [string, string] =>
      typeof entry[0] === 'string' &&
      typeof entry[1] === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(entry[1]),
  )
  return Object.fromEntries(entries)
}

export async function saveWorkspaceRevealFrom(
  workspaceId: string,
  overrides: Record<string, string>,
): Promise<void> {
  const supabase = tryGetSupabase()
  if (!supabase) return

  const { data } = await supabase
    .from('workspaces')
    .select('reveal_from_overrides')
    .eq('id', workspaceId)
    .maybeSingle()

  const previous =
    data?.reveal_from_overrides &&
    typeof data.reveal_from_overrides === 'object' &&
    !Array.isArray(data.reveal_from_overrides)
      ? (data.reveal_from_overrides as Record<string, unknown>)
      : {}

  // Keep receipt tombstones when Trends cutoffs are saved (same jsonb column).
  const next: Record<string, unknown> = { ...overrides }
  if (DELETED_RECEIPTS_META_KEY in previous) {
    next[DELETED_RECEIPTS_META_KEY] = previous[DELETED_RECEIPTS_META_KEY]
  }

  const { error } = await supabase
    .from('workspaces')
    .update({ reveal_from_overrides: next, updated_at: new Date().toISOString() })
    .eq('id', workspaceId)

  if (error) {
    console.error('Failed to save reveal_from_overrides', error)
  }
}

export async function getFounderSpotsRemaining(): Promise<number | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null

  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  if (error || count == null) return null
  return Math.max(0, FOUNDER_LIFETIME_SIGNUP_LIMIT - count)
}
