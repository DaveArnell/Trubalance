import { getReferenceDate } from '../../utils/referenceDate'

function anchor(from?: Date): Date {
  return from ? new Date(from.getTime()) : getReferenceDate()
}

/** Rolling date helpers — re-evaluated each time a demo scenario is built. */

export function daysAgoIso(days: number, from?: Date): string {
  const d = anchor(from)
  d.setDate(d.getDate() - days)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

/** Demo accounts always look freshly updated (no stale-balance nags). */
export function demoAccountUpdatedAt(from?: Date): string {
  return daysAgoIso(0, from)
}

export function daysAheadDateKey(days: number, from?: Date): string {
  const d = anchor(from)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function todayDateKey(from?: Date): string {
  return anchor(from).toISOString().slice(0, 10)
}

export function daysAgoDateKey(days: number, from?: Date): string {
  const d = anchor(from)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function receiptDateLabel(daysFromNow: number, from?: Date): string {
  const d = anchor(from)
  d.setDate(d.getDate() + daysFromNow)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
