import type { AppState, BusinessReferenceProfile, DiaryReminder, DiaryReminderTemplate, ViewScope } from '../types'
import { getBusinessIdsForScope } from './scope'

export function getProfileForBusiness(
  state: AppState,
  businessId: string,
): BusinessReferenceProfile | undefined {
  return state.businessReferenceProfiles.find((p) => p.businessId === businessId)
}

export function countReferenceValues(state: AppState): number {
  return state.businessReferenceProfiles.reduce(
    (sum, profile) => sum + profile.fields.filter((f) => f.value.trim()).length,
    0,
  )
}

export function countActiveDiaryReminders(state: AppState): number {
  return state.diaryReminders.filter((r) => !r.completed).length
}

export function filterRemindersForScope(state: AppState, scope: ViewScope): DiaryReminder[] {
  const businessIds = new Set(getBusinessIdsForScope(state, scope))
  return state.diaryReminders.filter((r) => businessIds.has(r.businessId))
}

export function templateToDate(template: DiaryReminderTemplate, year = new Date().getFullYear()): string {
  const month = template.monthOffset
  const lastDay = new Date(year, month + 1, 0).getDate()
  const day = Math.min(template.dayOfMonth, lastDay)
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function parseMonthKey(date: Date): { year: number; month: number } {
  return { year: date.getFullYear(), month: date.getMonth() }
}

export function daysInMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const startPad = (first.getDay() + 6) % 7
  const total = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: startPad }, () => null)
  for (let d = 1; d <= total; d += 1) {
    cells.push(new Date(year, month, d))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Next occurrence on or after today (rolls to next year when the template date has passed). */
export function templateToNextDate(
  template: DiaryReminderTemplate,
  referenceDate: Date = new Date(),
): string {
  const todayKey = dateKey(referenceDate)
  const thisYear = templateToDate(template, referenceDate.getFullYear())
  if (thisYear >= todayKey) return thisYear
  return templateToDate(template, referenceDate.getFullYear() + 1)
}

export function formatDiaryDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function addYearsToIsoDate(dateStr: string, years: number): string {
  const date = new Date(`${dateStr}T12:00:00`)
  date.setFullYear(date.getFullYear() + years)
  return dateKey(date)
}

export function daysAgoIso(days: number, from = new Date()): string {
  const date = new Date(from)
  date.setDate(date.getDate() - days)
  return dateKey(date)
}

export function formatDiaryRelative(dateStr: string, todayKey: string): string {
  const today = new Date(`${todayKey}T12:00:00`)
  const target = new Date(`${dateStr}T12:00:00`)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays > 1) return `In ${diffDays} days`
  return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`
}

export function partitionDiaryReminders(reminders: DiaryReminder[], today = new Date()) {
  const todayKey = dateKey(today)
  const active = reminders.filter((r) => !r.completed)
  const overdue = active
    .filter((r) => r.date < todayKey)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  const upcoming = active
    .filter((r) => r.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  return { overdue, upcoming, todayKey }
}

function daysUntilDate(dateStr: string, todayKey: string): number {
  const today = new Date(`${todayKey}T12:00:00`)
  const target = new Date(`${dateStr}T12:00:00`)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function getDiaryAttentionBuckets(reminders: DiaryReminder[], today = new Date()) {
  const todayKey = dateKey(today)
  const overdue: DiaryReminder[] = []
  const dueSoon: DiaryReminder[] = []

  for (const reminder of reminders) {
    if (reminder.completed) continue
    const days = daysUntilDate(reminder.date, todayKey)
    if (days < 0) {
      overdue.push(reminder)
    } else if (days <= 7 && reminder.weekBeforeAlertDismissedFor !== reminder.date) {
      dueSoon.push(reminder)
    }
  }

  overdue.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  dueSoon.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
  return { overdue, dueSoon, todayKey }
}

export function resolvePrimaryBusinessId(state: AppState, scope: ViewScope): string | null {
  const ids = getBusinessIdsForScope(state, scope)
  return ids[0] ?? null
}

export function businessName(state: AppState, businessId: string): string {
  return state.businesses.find((b) => b.id === businessId)?.name ?? 'Business'
}
