import type { AppState, ViewScope } from '../types'
import { getBusinessIdsForScope } from './scope'
import { getReferenceDate, dateToKey } from './referenceDate'
import { MONTHS } from './format'
import {
  DEFAULT_RESERVE_BILL_DUE_DAY,
  billMonthlyAmount,
  getReservePlanListLabel,
  isReservePlanMonthTransferDone,
} from './reserveCalculations'
import type { ChecklistOccurrenceStatus } from './financialChecklist'

export interface SystemCalendarEvent {
  id: string
  kind: 'reserve_transfer'
  name: string
  dueDate: string
  status: ChecklistOccurrenceStatus
  done: boolean
  plannerId: string
  scopeLabel: string
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function occurrenceDate(year: number, monthIndex: number, dueDay: number): string {
  const last = new Date(year, monthIndex + 1, 0).getDate()
  const day = Math.min(dueDay, last)
  return dateToKey(new Date(year, monthIndex, day))
}

function plannersInView(state: AppState, viewScope: ViewScope) {
  const businessIds = getBusinessIdsForScope(state, viewScope)
  return (state.reservePlanners ?? []).filter((p) => businessIds.includes(p.businessId))
}

/**
 * System dates on the financial calendar (not user reminders).
 * Reserve transfers fall on the 1st each month when a plan has bills.
 */
export function getReserveTransferCalendarEvents(
  state: AppState,
  viewScope: ViewScope,
  fromDate: string,
  toDate: string,
  referenceDate: Date = getReferenceDate(),
): SystemCalendarEvent[] {
  if (state.workspaceOrigin === 'builtin-demo') return []

  const today = dateToKey(dateOnly(referenceDate))
  const planners = plannersInView(state, viewScope)
  const out: SystemCalendarEvent[] = []

  const from = new Date(`${fromDate}T12:00:00`)
  const to = new Date(`${toDate}T12:00:00`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return []

  for (const planner of planners) {
    const monthlyAmount = planner.bills.reduce((sum, bill) => sum + billMonthlyAmount(bill), 0)
    if (monthlyAmount <= 0) continue

    const business = state.businesses.find((b) => b.id === planner.businessId)
    const label =
      getReservePlanListLabel(state, planner) || business?.name || planner.name || 'Reserve plan'

    let cursor = new Date(from.getFullYear(), from.getMonth(), 1)
    const end = new Date(to.getFullYear(), to.getMonth(), 1)
    while (cursor <= end) {
      const year = cursor.getFullYear()
      const monthIndex = cursor.getMonth()
      const dueDate = occurrenceDate(year, monthIndex, DEFAULT_RESERVE_BILL_DUE_DAY)
      if (dueDate >= fromDate && dueDate <= toDate) {
        const monthKey = MONTHS[monthIndex]!
        const done = isReservePlanMonthTransferDone(planner, monthKey)
        let status: ChecklistOccurrenceStatus = 'upcoming'
        if (done) status = 'done'
        else if (dueDate < today) status = 'overdue'
        else if (dueDate === today) status = 'due'
        out.push({
          id: `system-reserve-transfer-${planner.id}-${dueDate}`,
          kind: 'reserve_transfer',
          name: `Reserve transfer · ${label}`,
          dueDate,
          status,
          done,
          plannerId: planner.id,
          scopeLabel: business?.name ?? label,
        })
      }
      cursor = new Date(year, monthIndex + 1, 1)
    }
  }

  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name))
}

export function getSystemCalendarEventsForMonth(
  state: AppState,
  viewScope: ViewScope,
  year: number,
  monthIndex: number,
  referenceDate: Date = getReferenceDate(),
): SystemCalendarEvent[] {
  const from = dateToKey(new Date(year, monthIndex, 1))
  const to = dateToKey(new Date(year, monthIndex + 1, 0))
  return getReserveTransferCalendarEvents(state, viewScope, from, to, referenceDate)
}

export function getSystemCalendarTimeline(
  state: AppState,
  viewScope: ViewScope,
  withinDays = 120,
  referenceDate: Date = getReferenceDate(),
): SystemCalendarEvent[] {
  const today = dateOnly(referenceDate)
  const todayKey = dateToKey(today)
  const from = dateToKey(new Date(today.getFullYear(), today.getMonth(), 1))
  const to = dateToKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + withinDays))
  return getReserveTransferCalendarEvents(state, viewScope, from, to, referenceDate).filter(
    (event) => !(event.done && event.dueDate < todayKey),
  )
}
