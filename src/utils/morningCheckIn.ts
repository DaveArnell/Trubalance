import type { AppState, Commitment, ViewScope } from '../types'
import {
  getCommitmentDueOccurrences,
  getCommitmentDueRowAmount,
} from './commitmentCalculations'
import { getCommitmentsForScope } from './calculations'
import { chartColorForScope } from './businessTheme'
import { dateToKey, getReferenceDate, getReferenceDateKey } from './referenceDate'
import {
  buildReserveTransferDueRows,
  getPlannerDisplayName,
  getReservePlannerIdForScope,
} from './reserveCalculations'
import { getScopeLabel } from './scope'
import { formatCurrency } from './format'

export interface NewlyDueItem {
  commitmentId: string
  name: string
  amount: number
  period: string
  scopeLabel: string
  accentColor: string
  /** Calendar due date (YYYY-MM-DD) for this occurrence */
  dueDate: string
}

function dueDateKey(year: number, monthIndex: number, dueDay: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const day = Math.min(Math.max(1, dueDay), lastDay)
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const CHECKIN_KEY = 'trubalance-morning-checkin-date-v4'
/** Keys the user has dismissed for “new in Due” badges. */
const DUE_NEW_ACK_KEY = 'trubalance-due-new-acked-v2'

/** Date key of the last completed check-in, if any. */
export function getLastMorningCheckInDateKey(): string | null {
  try {
    return localStorage.getItem(CHECKIN_KEY)
  } catch {
    return null
  }
}

/**
 * Monthly costs that moved into Due after the last completed check-in.
 * If there is no prior check-in, show dues from the last 14 days (not only today),
 * so a returning user still sees the backlog.
 */
export function getNewlyDueItemsSinceLastCheckIn(
  state: AppState,
  viewScope: ViewScope,
  referenceDate: Date = getReferenceDate(),
): NewlyDueItem[] {
  const today = dateToKey(referenceDate)
  const lastCheckIn = getLastMorningCheckInDateKey()
  const lookbackStart = lastCheckIn ?? dateToKey(addCalendarDays(referenceDate, -14))
  const year = referenceDate.getFullYear()
  const commitments = getCommitmentsForScope(state, viewScope).filter(
    (c): c is Commitment => c.schedule === 'monthly',
  )

  const items: NewlyDueItem[] = []
  for (const commitment of commitments) {
    const dueDay = commitment.dueDayOfMonth ?? 28
    const occurrences = getCommitmentDueOccurrences(commitment, referenceDate)
    for (const occurrence of occurrences) {
      const key = dueDateKey(year, occurrence.monthIndex, dueDay)
      if (key > today) continue
      // Already shown on/before the last visit — not "new" this time.
      // When there is no last visit, lookbackStart is 14 days ago (inclusive floor).
      if (lastCheckIn ? key <= lookbackStart : key < lookbackStart) continue

      const scope = { type: commitment.scopeLevel, id: commitment.scopeId } as const
      items.push({
        commitmentId: commitment.id,
        name: commitment.name,
        amount: getCommitmentDueRowAmount(commitment, occurrences),
        period: occurrence.period,
        scopeLabel: getScopeLabel(state, scope),
        accentColor: chartColorForScope(state, scope),
        dueDate: key,
      })
      break
    }
  }

  items.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name))
  return items
}

function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
  return next
}

/** @deprecated Prefer getNewlyDueItemsSinceLastCheckIn */
export function getNewlyDueItemsToday(
  state: AppState,
  viewScope: ViewScope,
  referenceDate: Date = getReferenceDate(),
): NewlyDueItem[] {
  return getNewlyDueItemsSinceLastCheckIn(state, viewScope, referenceDate)
}

export function morningGreeting(now: Date = getReferenceDate()): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function isStartOfMonth(now: Date = getReferenceDate()): boolean {
  return now.getDate() === 1
}

export interface MorningReserveHint {
  plannerName: string
  message: string
  amount: number
}

/** Pending reserve transfer tip for the morning check-in. */
export function getMorningReserveHint(
  state: AppState,
  viewScope: ViewScope,
): MorningReserveHint | null {
  const rows = buildReserveTransferDueRows(state, viewScope)
  const row = rows[0]
  if (!row || row.amount <= 0) return null
  const plannerId = getReservePlannerIdForScope(state, viewScope)
  const planner = plannerId ? state.reservePlanners.find((p) => p.id === plannerId) : null
  return {
    plannerName: planner ? getPlannerDisplayName(state, planner) : 'Reserve',
    message:
      row.commitment.notes ||
      `Move ${formatCurrency(row.amount)} between operating and reserve this month.`,
    amount: row.amount,
  }
}

export function wasMorningCheckInDoneToday(today = getReferenceDateKey()): boolean {
  try {
    return localStorage.getItem(CHECKIN_KEY) === today
  } catch {
    return false
  }
}

export function markMorningCheckInDone(today = getReferenceDateKey()) {
  try {
    localStorage.setItem(CHECKIN_KEY, today)
  } catch {
    /* ignore */
  }
}

export function dueNotifyKey(item: NewlyDueItem): string {
  return `${item.commitmentId}:${item.period}`
}

export function dueRowNotifyKey(row: {
  commitment: { id: string }
  period: string
  dueReferencePeriod?: string
}): string {
  return `${row.commitment.id}:${row.dueReferencePeriod ?? row.period}`
}

function readAcknowledgedNewlyDue(): { keys: string[] } {
  try {
    const raw = localStorage.getItem(DUE_NEW_ACK_KEY)
    if (!raw) return { keys: [] }
    const parsed = JSON.parse(raw) as { keys?: unknown; date?: unknown }
    const keys = Array.isArray(parsed.keys)
      ? parsed.keys.filter((k): k is string => typeof k === 'string')
      : []
    return { keys }
  } catch {
    return { keys: [] }
  }
}

export function getAcknowledgedNewlyDueKeys(): Set<string> {
  return new Set(readAcknowledgedNewlyDue().keys)
}

export function acknowledgeNewlyDueKey(key: string) {
  const prev = readAcknowledgedNewlyDue().keys
  try {
    localStorage.setItem(
      DUE_NEW_ACK_KEY,
      JSON.stringify({ keys: [...new Set([...prev, key])] }),
    )
  } catch {
    /* ignore */
  }
}

/** Active “new since last visit” keys — not yet dismissed. */
export function getActiveNewlyDueNotifyKeys(
  state: AppState,
  viewScope: ViewScope,
): string[] {
  const acked = getAcknowledgedNewlyDueKeys()
  return getNewlyDueItemsSinceLastCheckIn(state, viewScope)
    .map(dueNotifyKey)
    .filter((key) => !acked.has(key))
}

export function isPendingNewlyDueRow(
  row: { commitment: { id: string }; period: string; dueReferencePeriod?: string },
  activeKeys: ReadonlySet<string>,
): boolean {
  return activeKeys.has(dueRowNotifyKey(row))
}

export function countPendingNewlyDueNotices(state: AppState, viewScope: ViewScope): number {
  return getActiveNewlyDueNotifyKeys(state, viewScope).length
}
