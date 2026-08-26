import type { AppState, DayNote, ViewScope } from '../types'

export function dayNoteMatchesScope(note: DayNote, scope: ViewScope): boolean {
  return note.scopeLevel === scope.type && note.scopeId === scope.id
}

export function migrateDayNotes(
  dayNotes: DayNote[],
  defaultGroupId: string | undefined,
): DayNote[] {
  if (!defaultGroupId) return dayNotes
  return dayNotes.map((note) => {
    if (note.scopeLevel && note.scopeId) return note
    return {
      ...note,
      scopeLevel: 'group',
      scopeId: defaultGroupId,
    }
  })
}

export function getDayNote(state: AppState, date: string, scope: ViewScope): DayNote | undefined {
  return (state.dayNotes ?? []).find((n) => n.date === date && dayNoteMatchesScope(n, scope))
}

/** Day note text for the current view, including legacy notes on scoped history records. */
export function getDayNoteText(state: AppState, date: string, scope: ViewScope): string | null {
  const explicit = getDayNote(state, date, scope)?.text?.trim()
  if (explicit) return explicit

  const historyNote = (state.historyRecords ?? []).find(
    (r) =>
      r.date === date &&
      r.note?.trim() &&
      r.viewScope.type === scope.type &&
      r.viewScope.id === scope.id,
  )?.note
  const trimmed = historyNote?.trim() ?? null
  if (!trimmed) return null
  // System / recovery markers must not appear as user notes in Trends.
  if (isSystemHistoryNote(trimmed)) return null
  return trimmed
}

/** Internal History markers — never show these in the Note column. */
export function isSystemHistoryNote(note: string): boolean {
  const value = note.toLowerCase()
  return (
    value.includes('restored from saved daily snapshot') ||
    value.includes('restored from daily snapshot') ||
    value.includes('restored from balance history')
  )
}

export function hasDayNote(state: AppState, date: string, scope: ViewScope): boolean {
  return getDayNoteText(state, date, scope) != null
}

export function dayNoteDates(state: AppState, scope: ViewScope): string[] {
  const dates = new Set<string>()
  for (const n of state.dayNotes ?? []) {
    if (n.text?.trim() && dayNoteMatchesScope(n, scope)) dates.add(n.date)
  }
  for (const r of state.historyRecords ?? []) {
    if (
      r.note?.trim() &&
      !isSystemHistoryNote(r.note) &&
      r.viewScope.type === scope.type &&
      r.viewScope.id === scope.id
    ) {
      dates.add(r.date)
    }
  }
  for (const s of state.snapshots ?? []) {
    if (
      s.note?.trim() &&
      !isSystemHistoryNote(s.note) &&
      s.scopeType === scope.type &&
      s.scopeId === scope.id
    ) {
      dates.add(s.date)
    }
  }
  return [...dates].sort()
}
