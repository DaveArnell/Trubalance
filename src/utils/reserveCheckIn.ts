import type { AppState, ReservePlanner, ViewScope } from '../types'
import { MONTHS, currentMonthIndex } from './format'
import { getReservePlannersForScope } from './calculations'

export function currentReserveMonthKey(): string {
  return MONTHS[currentMonthIndex()]!
}

export function plannerNeedsMonthlyCheckIn(planner: ReservePlanner, monthKey = currentReserveMonthKey()): boolean {
  const confirmations = planner.monthConfirmations ?? {}
  return !confirmations[monthKey]
}

export function getPlannersNeedingMonthlyCheckIn(
  state: AppState,
  scope?: ViewScope,
): ReservePlanner[] {
  const monthKey = currentReserveMonthKey()
  const planners = scope ? getReservePlannersForScope(state, scope) : state.reservePlanners
  return planners.filter((planner) => plannerNeedsMonthlyCheckIn(planner, monthKey))
}

const DISMISS_KEY_PREFIX = 'trubalance-reserve-checkin-dismissed'

export function reserveCheckInDismissKey(monthKey = currentReserveMonthKey()): string {
  return `${DISMISS_KEY_PREFIX}-${monthKey}`
}

export function wasReserveCheckInDismissed(monthKey = currentReserveMonthKey()): boolean {
  try {
    return localStorage.getItem(reserveCheckInDismissKey(monthKey)) === '1'
  } catch {
    return false
  }
}

export function dismissReserveCheckInLocally(monthKey = currentReserveMonthKey()) {
  try {
    localStorage.setItem(reserveCheckInDismissKey(monthKey), '1')
  } catch {
    /* ignore */
  }
}
