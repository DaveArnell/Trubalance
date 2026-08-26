import type { AppState, ChecklistRecurrence, FinancialChecklistItem, ViewScope } from '../types'
import { getBusinessIdsForScope } from './scope'
import { getReferenceDate, dateToKey } from './referenceDate'
import { clampDueDay } from './commitmentCalculations'

export type ChecklistOccurrenceStatus = 'upcoming' | 'due' | 'overdue' | 'done'

export interface ChecklistOccurrence {
  item: FinancialChecklistItem
  /** Occurrence key stored in completedPeriods (YYYY-MM-DD). */
  periodKey: string
  dueDate: string
  status: ChecklistOccurrenceStatus
  done: boolean
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function occurrenceDate(year: number, monthIndex: number, dueDay: number): string {
  const day = clampDueDay(year, monthIndex, dueDay)
  return dateToKey(new Date(year, monthIndex, day))
}

function monthsForRecurrence(item: FinancialChecklistItem): number[] {
  if (item.recurrence === 'monthly') {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  }
  const custom = (item.dueMonths ?? []).filter((m) => m >= 1 && m <= 12)
  if (custom.length > 0) return [...new Set(custom)].sort((a, b) => a - b)
  if (item.recurrence === 'quarterly') return [1, 4, 7, 10]
  if (item.recurrence === 'yearly') return [4]
  return []
}

export function checklistItemInView(
  state: AppState,
  item: FinancialChecklistItem,
  viewScope: ViewScope,
): boolean {
  if (viewScope.type === 'group') {
    if (item.scopeLevel === 'group') return item.scopeId === viewScope.id
    if (item.scopeLevel === 'business') {
      return getBusinessIdsForScope(state, viewScope).includes(item.scopeId)
    }
    return false
  }
  if (viewScope.type === 'business') {
    if (item.scopeLevel === 'business') return item.scopeId === viewScope.id
    if (item.scopeLevel === 'group') {
      const business = state.businesses.find((b) => b.id === viewScope.id)
      return Boolean(business && business.groupId === item.scopeId)
    }
    return false
  }
  const venue = state.venues.find((v) => v.id === viewScope.id)
  if (!venue) return false
  if (item.scopeLevel === 'business') return item.scopeId === venue.businessId
  const business = state.businesses.find((b) => b.id === venue.businessId)
  return Boolean(business && item.scopeLevel === 'group' && item.scopeId === business.groupId)
}

export function listChecklistItemsForView(
  state: AppState,
  viewScope: ViewScope,
): FinancialChecklistItem[] {
  return (state.financialChecklistItems ?? [])
    .filter((item) => checklistItemInView(state, item, viewScope))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
}

/** Occurrences for one item within [fromDate, toDate] inclusive. */
export function getChecklistOccurrencesInRange(
  item: FinancialChecklistItem,
  fromDate: string,
  toDate: string,
  referenceDate: Date = getReferenceDate(),
): ChecklistOccurrence[] {
  const today = dateToKey(dateOnly(referenceDate))
  const completed = new Set(item.completedPeriods ?? [])
  const results: ChecklistOccurrence[] = []

  if (item.recurrence === 'once') {
    const due = item.dueDate?.slice(0, 10)
    if (!due || due < fromDate || due > toDate) return []
    const done = completed.has(due)
    let status: ChecklistOccurrenceStatus = 'upcoming'
    if (done) status = 'done'
    else if (due < today) status = 'overdue'
    else if (due === today) status = 'due'
    results.push({ item, periodKey: due, dueDate: due, status, done })
    return results
  }

  const dueDay = item.dueDayOfMonth ?? 28
  const months = monthsForRecurrence(item)

  const fromYear = Number(fromDate.slice(0, 4))
  const toYear = Number(toDate.slice(0, 4))

  for (let year = fromYear; year <= toYear; year++) {
    for (const month of months) {
      const monthIndex = month - 1
      const due = occurrenceDate(year, monthIndex, dueDay)
      if (due < fromDate || due > toDate) continue
      const done = completed.has(due)
      let status: ChecklistOccurrenceStatus = 'upcoming'
      if (done) status = 'done'
      else if (due < today) status = 'overdue'
      else if (due === today) status = 'due'
      results.push({ item, periodKey: due, dueDate: due, status, done })
    }
  }

  return results.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/** Outstanding: due today or overdue and not ticked (the living checklist). */
export function getOutstandingChecklistOccurrences(
  state: AppState,
  viewScope: ViewScope,
  referenceDate: Date = getReferenceDate(),
): ChecklistOccurrence[] {
  const today = dateToKey(dateOnly(referenceDate))
  const lookback = dateToKey(
    new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 18, referenceDate.getDate()),
  )
  const items = listChecklistItemsForView(state, viewScope)
  const out: ChecklistOccurrence[] = []
  for (const item of items) {
    for (const occurrence of getChecklistOccurrencesInRange(item, lookback, today, referenceDate)) {
      if (!occurrence.done && (occurrence.status === 'due' || occurrence.status === 'overdue')) {
        out.push(occurrence)
      }
    }
  }
  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.item.name.localeCompare(b.item.name))
}

/** Upcoming (not yet due) occurrences in the next N days. */
export function getUpcomingChecklistOccurrences(
  state: AppState,
  viewScope: ViewScope,
  withinDays = 62,
  referenceDate: Date = getReferenceDate(),
): ChecklistOccurrence[] {
  const today = dateOnly(referenceDate)
  const from = dateToKey(today)
  const to = dateToKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + withinDays))
  const items = listChecklistItemsForView(state, viewScope)
  const out: ChecklistOccurrence[] = []
  for (const item of items) {
    for (const occurrence of getChecklistOccurrencesInRange(item, from, to, referenceDate)) {
      if (!occurrence.done && occurrence.status === 'upcoming') out.push(occurrence)
    }
  }
  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function getChecklistOccurrencesForMonth(
  state: AppState,
  viewScope: ViewScope,
  year: number,
  monthIndex: number,
  referenceDate: Date = getReferenceDate(),
): ChecklistOccurrence[] {
  const from = dateToKey(new Date(year, monthIndex, 1))
  const to = dateToKey(new Date(year, monthIndex, daysInMonth(year, monthIndex)))
  const items = listChecklistItemsForView(state, viewScope)
  const out: ChecklistOccurrence[] = []
  for (const item of items) {
    out.push(...getChecklistOccurrencesInRange(item, from, to, referenceDate))
  }
  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function recurrenceLabel(recurrence: ChecklistRecurrence): string {
  if (recurrence === 'once') return 'One-off'
  if (recurrence === 'monthly') return 'Every month'
  if (recurrence === 'quarterly') return 'Every quarter'
  return 'Every year'
}

export const CHECKLIST_STARTER_TEMPLATES: Array<{
  name: string
  recurrence: ChecklistRecurrence
  dueDayOfMonth: number
  dueMonths?: number[]
}> = [
  { name: 'Staff pay', recurrence: 'monthly', dueDayOfMonth: 28 },
  { name: 'Pension submission', recurrence: 'monthly', dueDayOfMonth: 22 },
  { name: 'VAT return', recurrence: 'quarterly', dueDayOfMonth: 7, dueMonths: [2, 5, 8, 11] },
  { name: 'Confirm reserve transfer', recurrence: 'monthly', dueDayOfMonth: 1 },
  {
    name: 'Companies House confirmation statement',
    recurrence: 'yearly',
    dueDayOfMonth: 1,
    dueMonths: [4],
  },
]
