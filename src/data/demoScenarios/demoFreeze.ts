/** Fixed “today” for all interactive demos — keeps accrual, Due, and Trends stable. */
export const DEMO_FROZEN_DATE_KEY = '2026-07-15'

export function getDemoFrozenDate(): Date {
  const [y, m, d] = DEMO_FROZEN_DATE_KEY.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}
