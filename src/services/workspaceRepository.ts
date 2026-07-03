import type { AppState, BalanceSnapshot, BusinessReferenceProfile, Commitment, DayNote, DiaryReminder, ExpectedReceipt, Group, Business, Venue, Account, ReservePlanner, ReserveBill, HistoryRecord } from '../types'
import { tryGetSupabase } from '../lib/supabase'
import { readBrowserAppState } from '../hooks/useAppState'
import { emptyAppState } from '../utils/localStateStorage'

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
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
  return {
    id: String(row.id),
    groupId: String(row.group_id),
    name: String(row.name),
    ...(accentColor ? { accentColor } : {}),
  }
}

function mapVenue(row: Record<string, unknown>): Venue {
  return { id: String(row.id), businessId: String(row.business_id), name: String(row.name) }
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
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
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
  return {
    id: String(row.id),
    name: String(row.name),
    amount: toNumber(row.amount),
    expectedDate: row.expected_date ? toDateOnly(String(row.expected_date)) : undefined,
    receiptTiming: row.receipt_timing ? (row.receipt_timing as ExpectedReceipt['receiptTiming']) : undefined,
    accrualStartDate: row.accrual_start_date ? toDateOnly(String(row.accrual_start_date)) : undefined,
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
    lastPaidPeriod: row.last_paid_period ? String(row.last_paid_period) : undefined,
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

function mapBusinessReferenceProfile(row: Record<string, unknown>): BusinessReferenceProfile {
  return {
    businessId: String(row.business_id),
    fields: Array.isArray(row.fields) ? row.fields : [],
    notes: row.notes ? String(row.notes) : undefined,
    updatedAt: String(row.updated_at),
  }
}

function mapDiaryReminder(row: Record<string, unknown>): DiaryReminder {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    title: String(row.title),
    date: String(row.date),
    category: row.category as DiaryReminder['category'],
    notes: row.notes ? String(row.notes) : undefined,
    completed: Boolean(row.completed),
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    recurring: (row.recurring as DiaryReminder['recurring']) ?? 'none',
    templateId: row.template_id ? String(row.template_id) : undefined,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : undefined,
    createdAt: String(row.created_at),
    weekBeforeAlertDismissedFor: row.week_before_alert_dismissed_for ? String(row.week_before_alert_dismissed_for) : undefined,
    overdueAlertDismissedFor: row.overdue_alert_dismissed_for ? String(row.overdue_alert_dismissed_for) : undefined,
  }
}

export async function loadWorkspaceState(workspaceId: string): Promise<AppState> {
  const supabase = tryGetSupabase()
  if (!supabase) return emptyAppState()

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
    businessRefRes,
    diaryRemindersRes,
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
    supabase.from('business_reference_profiles').select('*').eq('workspace_id', workspaceId),
    supabase.from('diary_reminders').select('*').eq('workspace_id', workspaceId).order('sort_order'),
  ])

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

  const state: AppState = {
    groups: (groupsRes.data ?? []).map((row) => mapGroup(row as Record<string, unknown>)),
    businesses: (businessesRes.data ?? []).map((row) => mapBusiness(row as Record<string, unknown>)),
    venues: (venuesRes.data ?? []).map((row) => mapVenue(row as Record<string, unknown>)),
    accounts: (accountsRes.data ?? []).map((row) => mapAccount(row as Record<string, unknown>)),
    commitments: (commitmentsRes.data ?? []).map((row) => mapCommitment(row as Record<string, unknown>)),
    expectedReceipts: (receiptsRes.data ?? []).map((row) => mapReceipt(row as Record<string, unknown>)),
    reservePlanners,
    snapshots: (snapshotsRes.data ?? []).map((row) => mapSnapshot(row as Record<string, unknown>)),
    historyRecords: (historyRes.data ?? []).map((row) => mapHistoryRecord(row as Record<string, unknown>)),
    dayNotes: (dayNotesRes.data ?? []).map((row) => mapDayNote(row as Record<string, unknown>)),
    businessReferenceProfiles: (businessRefRes.data ?? []).map((row) => mapBusinessReferenceProfile(row as Record<string, unknown>)),
    diaryReminders: (diaryRemindersRes.data ?? []).map((row) => mapDiaryReminder(row as Record<string, unknown>)),
  }

  return state
}

/** Whether the database has no saved rows yet for this workspace. */
export async function isWorkspaceEmptyInDatabase(workspaceId: string): Promise<boolean> {
  const supabase = tryGetSupabase()
  if (!supabase) return true

  const { count } = await supabase
    .from('groups')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  return (count ?? 0) === 0
}

export async function saveWorkspaceState(workspaceId: string, state: AppState): Promise<void> {
  const supabase = tryGetSupabase()
  if (!supabase) return

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
    expected_date: r.expectedDate ?? null,
    receipt_timing: r.receiptTiming === 'lump' || r.receiptTiming === 'accrual' ? r.receiptTiming : null,
    accrual_start_date: r.accrualStartDate ?? null,
    period_amount_overrides: r.periodAmountOverrides ?? {},
    scope_level: r.scopeLevel,
    scope_id: r.scopeId,
    notes: r.notes ?? null,
    received: r.received,
    sort_order: r.sortOrder ?? i,
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
      last_paid_period: b.lastPaidPeriod ?? null,
      dismissed_due_periods: b.dismissedDuePeriods ?? [],
      acknowledged_due_periods: b.acknowledgedDuePeriods ?? [],
      sort_order: b.sortOrder ?? i,
      ...ws,
    })),
  )
  const snapshotRows = state.snapshots.map((s) => ({
    id: s.id,
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
    updated_at: s.updatedAt ?? new Date().toISOString(),
    ...ws,
  }))
  const historyRows = (state.historyRecords ?? []).map((r) => ({
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
  const businessRefRows = (state.businessReferenceProfiles ?? []).map((p) => ({
    business_id: p.businessId,
    fields: p.fields,
    notes: p.notes ?? null,
    updated_at: p.updatedAt ?? new Date().toISOString(),
    ...ws,
  }))
  const diaryReminderRows = (state.diaryReminders ?? []).map((d, i) => ({
    id: d.id,
    business_id: d.businessId,
    title: d.title,
    date: d.date,
    category: d.category,
    notes: d.notes ?? null,
    completed: d.completed ?? false,
    completed_at: d.completedAt ?? null,
    recurring: d.recurring ?? 'none',
    template_id: d.templateId ?? null,
    sort_order: d.sortOrder ?? i,
    created_at: d.createdAt ?? new Date().toISOString(),
    week_before_alert_dismissed_for: d.weekBeforeAlertDismissedFor ?? null,
    overdue_alert_dismissed_for: d.overdueAlertDismissedFor ?? null,
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
    { name: 'business_reference_profiles', rows: businessRefRows },
    { name: 'diary_reminders', rows: diaryReminderRows },
  ] as const

  const EXTENDED_COLUMNS = [
    'preserved_due_periods', 'paid_period_dates',
    'receipt_timing', 'accrual_start_date', 'period_amount_overrides',
  ]

  for (const table of tables) {
    if (table.rows.length === 0) {
      await supabase.from(table.name).delete().eq('workspace_id', workspaceId)
      continue
    }

    const { error } = await supabase.from(table.name).upsert(table.rows as Record<string, unknown>[])
    if (error) {
      console.warn(`[workspaceRepository] upsert ${table.name}:`, error.message)
      const coreRows = table.rows.map((row) => {
        const clean = { ...(row as Record<string, unknown>) }
        for (const col of EXTENDED_COLUMNS) delete clean[col]
        return clean
      })
      const { error: retryErr } = await supabase.from(table.name).upsert(coreRows)
      if (retryErr) {
        console.warn(`[workspaceRepository] upsert ${table.name} (retry):`, retryErr.message)
        continue
      }
    }

    const ids = table.rows.map((r) => (r as Record<string, unknown>).id).filter(Boolean) as string[]
    if (ids.length > 0) {
      await supabase
        .from(table.name)
        .delete()
        .eq('workspace_id', workspaceId)
        .not('id', 'in', `(${ids.join(',')})`)
    }
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
  await saveWorkspaceState(workspaceId, parsed)
  return true
}

export async function restoreStateToWorkspace(workspaceId: string, state: AppState): Promise<void> {
  await saveWorkspaceState(workspaceId, state)
}
