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
}

function dueDateKey(year: number, monthIndex: number, dueDay: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const day = Math.min(Math.max(1, dueDay), lastDay)
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Monthly costs whose due date is today (just moved into Due). */
export function getNewlyDueItemsToday(
  state: AppState,
  viewScope: ViewScope,
  referenceDate: Date = getReferenceDate(),
): NewlyDueItem[] {
  const today = dateToKey(referenceDate)
  const year = referenceDate.getFullYear()
  const commitments = getCommitmentsForScope(state, viewScope).filter(
    (c): c is Commitment => c.schedule === 'monthly',
  )

  const items: NewlyDueItem[] = []
  for (const commitment of commitments) {
    const occurrences = getCommitmentDueOccurrences(commitment, referenceDate)
    for (const occurrence of occurrences) {
      const key = dueDateKey(year, occurrence.monthIndex, commitment.dueDayOfMonth ?? 28)
      if (key !== today) continue
      const scope = { type: commitment.scopeLevel, id: commitment.scopeId } as const
      items.push({
        commitmentId: commitment.id,
        name: commitment.name,
        amount: getCommitmentDueRowAmount(commitment, occurrences),
        period: occurrence.period,
        scopeLabel: getScopeLabel(state, scope),
        accentColor: chartColorForScope(state, scope),
      })
      break
    }
  }
  return items
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

const CHECKIN_KEY = 'trubalance-morning-checkin-date-v3'
const DUE_NOTIFY_KEY = 'trubalance-due-notify-periods'

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

export function getPendingDueNotifyPeriods(): string[] {
  try {
    const raw = localStorage.getItem(DUE_NOTIFY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function setPendingDueNotifyPeriods(periods: string[]) {
  try {
    localStorage.setItem(DUE_NOTIFY_KEY, JSON.stringify([...new Set(periods)]))
  } catch {
    /* ignore */
  }
}

export function clearPendingDueNotifyPeriods() {
  try {
    localStorage.removeItem(DUE_NOTIFY_KEY)
  } catch {
    /* ignore */
  }
}

export function clearPendingDueNotifyKey(key: string) {
  const next = getPendingDueNotifyPeriods().filter((entry) => entry !== key)
  if (next.length === 0) clearPendingDueNotifyPeriods()
  else setPendingDueNotifyPeriods(next)
}

export function dueNotifyKey(item: NewlyDueItem): string {
  return `${item.commitmentId}:${item.period}`
}

export function dueRowNotifyKey(row: { commitment: { id: string }; period: string; dueReferencePeriod?: string }): string {
  return `${row.commitment.id}:${row.dueReferencePeriod ?? row.period}`
}

export function isPendingNewlyDueRow(
  row: { commitment: { id: string }; period: string; dueReferencePeriod?: string },
  pending: ReadonlySet<string> = new Set(getPendingDueNotifyPeriods()),
): boolean {
  return pending.has(dueRowNotifyKey(row))
}

/** How many “moved into Due today” notices are still waiting to be acknowledged. */
export function countPendingNewlyDueNotices(
  state: AppState,
  viewScope: ViewScope,
): number {
  const pending = new Set(getPendingDueNotifyPeriods())
  if (pending.size === 0) return 0
  return getNewlyDueItemsToday(state, viewScope).filter((item) => pending.has(dueNotifyKey(item)))
    .length
}
