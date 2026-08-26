import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, ChecklistRecurrence, FinancialChecklistItem, ViewScope } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import { HelpButton } from './HelpButton'
import { ConfirmDialog } from './ConfirmDialog'
import { WIDGET_HELP } from '../content/livingDashboard'
import {
  getChecklistOccurrencesForMonth,
  getChecklistTimeline,
  listChecklistItemsForView,
  recurrenceLabel,
  type ChecklistOccurrence,
} from '../utils/financialChecklist'
import { isFinancialChecklistTableMissing } from '../services/workspaceRepository'
import { getReferenceDate, dateToKey } from '../utils/referenceDate'
import {
  formatScopeOptionLabel,
  getScopeLabel,
  getScopeOptionsForView,
} from '../utils/scope'

interface FinancialCalendarPanelProps {
  state: AppState
  viewScope: ViewScope
  actions: Pick<
    AppActions,
    | 'addFinancialChecklistItem'
    | 'updateFinancialChecklistItem'
    | 'deleteFinancialChecklistItem'
    | 'setFinancialChecklistOccurrenceDone'
  >
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
}

type DraftItem = {
  name: string
  recurrence: ChecklistRecurrence
  dueDayOfMonth: number
  dueDate: string
  dueMonths: string
  scopeLevel: 'group' | 'business'
  scopeId: string
  notes: string
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function defaultScope(
  state: AppState,
  viewScope: ViewScope,
): { scopeLevel: 'group' | 'business'; scopeId: string } {
  if (viewScope.type === 'group') return { scopeLevel: 'group', scopeId: viewScope.id }
  if (viewScope.type === 'business') return { scopeLevel: 'business', scopeId: viewScope.id }
  const venue = state.venues.find((v) => v.id === viewScope.id)
  if (venue) return { scopeLevel: 'business', scopeId: venue.businessId }
  const firstBusiness = state.businesses[0]
  if (firstBusiness) return { scopeLevel: 'business', scopeId: firstBusiness.id }
  const firstGroup = state.groups[0]
  if (firstGroup) return { scopeLevel: 'group', scopeId: firstGroup.id }
  return { scopeLevel: 'business', scopeId: '' }
}

function emptyDraft(state: AppState, viewScope: ViewScope): DraftItem {
  const scope = defaultScope(state, viewScope)
  return {
    name: '',
    recurrence: 'monthly',
    dueDayOfMonth: 28,
    dueDate: dateToKey(getReferenceDate()),
    dueMonths: '',
    scopeLevel: scope.scopeLevel,
    scopeId: scope.scopeId,
    notes: '',
  }
}

function formatFeedDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function monthTitle(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

function parseDueMonths(raw: string): number[] | undefined {
  const months = raw
    .split(/[,\s]+/)
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12)
  return months.length > 0 ? [...new Set(months)].sort((a, b) => a - b) : undefined
}

function groupTimelineByDate(
  items: ChecklistOccurrence[],
): Array<{ date: string; items: ChecklistOccurrence[] }> {
  const map = new Map<string, ChecklistOccurrence[]>()
  for (const item of items) {
    const list = map.get(item.dueDate) ?? []
    list.push(item)
    map.set(item.dueDate, list)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, group]) => ({ date, items: group }))
}

export function FinancialCalendarPanel({
  state,
  viewScope,
  actions,
  openHelp,
  setOpenHelp,
}: FinancialCalendarPanelProps) {
  const editReadOnly = useEditReadOnly()
  const today = getReferenceDate()
  const todayKey = dateToKey(today)
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftItem>(() => emptyDraft(state, viewScope))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const scopeOptions = useMemo(
    () =>
      getScopeOptionsForView(state, viewScope).filter(
        (option): option is { level: 'group' | 'business'; id: string; label: string } =>
          option.level === 'group' || option.level === 'business',
      ),
    [state, viewScope],
  )

  const timeline = useMemo(() => getChecklistTimeline(state, viewScope), [state, viewScope])
  const monthOccurrences = useMemo(
    () => getChecklistOccurrencesForMonth(state, viewScope, cursor.year, cursor.monthIndex),
    [state, viewScope, cursor.year, cursor.monthIndex],
  )
  const reminders = useMemo(() => listChecklistItemsForView(state, viewScope), [state, viewScope])

  const byDate = useMemo(() => {
    const map = new Map<string, ChecklistOccurrence[]>()
    for (const occurrence of monthOccurrences) {
      const list = map.get(occurrence.dueDate) ?? []
      list.push(occurrence)
      map.set(occurrence.dueDate, list)
    }
    return map
  }, [monthOccurrences])

  const feedItems = useMemo(() => {
    if (!selectedDate) return timeline
    return timeline.filter((item) => item.dueDate === selectedDate)
  }, [timeline, selectedDate])

  const feedGroups = useMemo(() => groupTimelineByDate(feedItems), [feedItems])

  const calendarCells = useMemo(() => {
    const first = new Date(cursor.year, cursor.monthIndex, 1)
    const startPad = (first.getDay() + 6) % 7
    const daysInMonth = new Date(cursor.year, cursor.monthIndex + 1, 0).getDate()
    const cells: Array<{ dateKey: string | null; day: number | null }> = []
    for (let i = 0; i < startPad; i++) cells.push({ dateKey: null, day: null })
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ dateKey: dateToKey(new Date(cursor.year, cursor.monthIndex, day)), day })
    }
    while (cells.length % 7 !== 0) cells.push({ dateKey: null, day: null })
    return cells
  }, [cursor.year, cursor.monthIndex])

  const openCreate = () => {
    setEditingId(null)
    setDraft(emptyDraft(state, viewScope))
    setFormOpen(true)
  }

  const openEdit = (item: FinancialChecklistItem) => {
    setEditingId(item.id)
    setDraft({
      name: item.name,
      recurrence: item.recurrence,
      dueDayOfMonth: item.dueDayOfMonth ?? 28,
      dueDate: item.dueDate ?? todayKey,
      dueMonths: (item.dueMonths ?? []).join(', '),
      scopeLevel: item.scopeLevel,
      scopeId: item.scopeId,
      notes: item.notes ?? '',
    })
    setFormOpen(true)
  }

  const saveDraft = () => {
    const name = draft.name.trim()
    if (!name || !draft.scopeId || editReadOnly) return
    const dueMonths =
      draft.recurrence === 'quarterly' || draft.recurrence === 'yearly'
        ? parseDueMonths(draft.dueMonths)
        : undefined
    const payload = {
      name,
      recurrence: draft.recurrence,
      dueDayOfMonth: draft.recurrence === 'once' ? undefined : draft.dueDayOfMonth,
      dueDate: draft.recurrence === 'once' ? draft.dueDate : undefined,
      dueMonths,
      scopeLevel: draft.scopeLevel,
      scopeId: draft.scopeId,
      notes: draft.notes.trim() || undefined,
    }
    if (editingId) actions.updateFinancialChecklistItem(editingId, payload)
    else actions.addFinancialChecklistItem(payload)
    setFormOpen(false)
    setEditingId(null)
  }

  const toggleDone = (occurrence: ChecklistOccurrence, done: boolean) => {
    actions.setFinancialChecklistOccurrenceDone(occurrence.item.id, occurrence.periodKey, done)
  }

  return (
    <section id="financial-calendar" className="card widget-compact card-scroll" data-tour="financial-calendar">
      <div className="card-head card-head-compact card-head--widget-bar">
        <div className="card-head-toolbar">
          {!editReadOnly ? (
            <button type="button" className="btn-primary btn-widget-add" onClick={openCreate}>
              + Add
            </button>
          ) : (
            <span className="card-head-toolbar-spacer" aria-hidden />
          )}
          <h2>Financial calendar</h2>
          <HelpButton
            id="financial-calendar"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            text={WIDGET_HELP.financialCalendar}
          />
        </div>
      </div>

      {isFinancialChecklistTableMissing() ? (
        <div className="import-banner" role="status">
          <span>Cloud sync for the calendar is still unavailable — check Supabase migrations.</span>
        </div>
      ) : null}

      <div className="card-scroll-body fin-cal-shell">
        <div className="fin-cal-grid">
          <div className="fin-cal-month">
            <div className="fin-cal-month-header">
              <button
                type="button"
                className="fin-cal-nav-btn"
                aria-label="Previous month"
                onClick={() =>
                  setCursor((c) => {
                    const d = new Date(c.year, c.monthIndex - 1, 1)
                    return { year: d.getFullYear(), monthIndex: d.getMonth() }
                  })
                }
              >
                ‹
              </button>
              <h3>{monthTitle(cursor.year, cursor.monthIndex)}</h3>
              <button
                type="button"
                className="fin-cal-nav-btn"
                aria-label="Next month"
                onClick={() =>
                  setCursor((c) => {
                    const d = new Date(c.year, c.monthIndex + 1, 1)
                    return { year: d.getFullYear(), monthIndex: d.getMonth() }
                  })
                }
              >
                ›
              </button>
            </div>

            <div className="fin-cal-weekdays" aria-hidden>
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="fin-cal-days" role="grid" aria-label="Calendar">
              {calendarCells.map((cell, index) => {
                if (!cell.dateKey || cell.day == null) {
                  return <div key={`pad-${index}`} className="fin-cal-day is-empty" aria-hidden />
                }
                const dayItems = byDate.get(cell.dateKey) ?? []
                const isToday = cell.dateKey === todayKey
                const isSelected = cell.dateKey === selectedDate
                const hasDue = dayItems.some(
                  (item) => item.status === 'due' || item.status === 'overdue',
                )
                const hasUpcoming = dayItems.some((item) => item.status === 'upcoming')
                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    role="gridcell"
                    className={[
                      'fin-cal-day',
                      isToday ? 'is-today' : '',
                      isSelected ? 'is-selected' : '',
                      hasDue ? 'has-due' : '',
                      hasUpcoming ? 'has-upcoming' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() =>
                      setSelectedDate((current) => (current === cell.dateKey ? null : cell.dateKey!))
                    }
                  >
                    <span className="fin-cal-day-num">{cell.day}</span>
                    {dayItems.length > 0 ? (
                      <span className="fin-cal-day-mark" aria-hidden />
                    ) : null}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              className="btn-ghost btn-tiny fin-cal-today-btn"
              onClick={() => {
                setCursor({ year: today.getFullYear(), monthIndex: today.getMonth() })
                setSelectedDate(todayKey)
              }}
            >
              Today
            </button>
          </div>

          <aside className="fin-cal-feed">
            <div className="fin-cal-feed-head">
              <h3>{selectedDate ? formatFeedDate(selectedDate) : 'Next up'}</h3>
              {selectedDate ? (
                <button type="button" className="btn-ghost btn-tiny" onClick={() => setSelectedDate(null)}>
                  Show all
                </button>
              ) : null}
            </div>

            {feedGroups.length === 0 ? (
              <div className="fin-cal-feed-empty">
                <p>{selectedDate ? 'Nothing on this day.' : 'No reminders yet.'}</p>
                {!editReadOnly && reminders.length === 0 ? (
                  <button type="button" className="btn-primary btn-tiny" onClick={openCreate}>
                    Add reminder
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="fin-cal-feed-list">
                {feedGroups.map((group) => (
                  <section key={group.date} className="fin-cal-feed-group">
                    {!selectedDate ? (
                      <h4 className="fin-cal-feed-date">{formatFeedDate(group.date)}</h4>
                    ) : null}
                    <ul>
                      {group.items.map((occurrence) => {
                        const actionable =
                          occurrence.status === 'due' || occurrence.status === 'overdue'
                        return (
                          <li
                            key={`${occurrence.item.id}-${occurrence.periodKey}`}
                            className={[
                              'fin-cal-feed-item',
                              occurrence.status === 'overdue' ? 'is-overdue' : '',
                              occurrence.status === 'due' ? 'is-due' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {actionable && !editReadOnly ? (
                              <label className="fin-cal-feed-check">
                                <input
                                  type="checkbox"
                                  checked={occurrence.done}
                                  onChange={(e) => toggleDone(occurrence, e.target.checked)}
                                />
                                <span className="sr-only">Done</span>
                              </label>
                            ) : (
                              <span className="fin-cal-feed-dot" aria-hidden />
                            )}
                            <div className="fin-cal-feed-copy">
                              <strong>{occurrence.item.name}</strong>
                              <span className="muted">
                                {occurrence.status === 'overdue'
                                  ? 'Overdue — tick when done'
                                  : occurrence.status === 'due'
                                    ? 'Due today'
                                    : recurrenceLabel(occurrence.item.recurrence)}
                                {' · '}
                                {getScopeLabel(state, {
                                  type: occurrence.item.scopeLevel,
                                  id: occurrence.item.scopeId,
                                })}
                              </span>
                            </div>
                            {!editReadOnly ? (
                              <button
                                type="button"
                                className="btn-ghost btn-tiny"
                                onClick={() => openEdit(occurrence.item)}
                              >
                                Edit
                              </button>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>

      {formOpen
        ? createPortal(
            <div className="planned-funding-backdrop" onClick={() => setFormOpen(false)}>
              <div
                className="planned-funding-modal fin-cal-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="fin-cal-form-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="fin-cal-form-title">{editingId ? 'Edit reminder' : 'Add reminder'}</h3>
                <p className="planned-funding-subtitle">
                  Shows on the calendar and in Next up by date. Tick when due; recurring reminders come
                  back next time.
                </p>
                <div className="fin-cal-modal-grid">
                  <label>
                    Name
                    <input
                      autoFocus
                      value={draft.name}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="e.g. Insurance renewal"
                    />
                  </label>
                  <label>
                    Repeats
                    <select
                      value={draft.recurrence}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          recurrence: e.target.value as ChecklistRecurrence,
                        }))
                      }
                    >
                      <option value="monthly">Every month</option>
                      <option value="quarterly">Every quarter</option>
                      <option value="yearly">Every year</option>
                      <option value="once">One-off date</option>
                    </select>
                  </label>
                  {draft.recurrence === 'once' ? (
                    <label>
                      Date
                      <input
                        type="date"
                        value={draft.dueDate}
                        onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                      />
                    </label>
                  ) : (
                    <label>
                      Day of month
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={draft.dueDayOfMonth}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            dueDayOfMonth: Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                          }))
                        }
                      />
                    </label>
                  )}
                  {(draft.recurrence === 'quarterly' || draft.recurrence === 'yearly') && (
                    <label>
                      Months (1–12)
                      <input
                        value={draft.dueMonths}
                        onChange={(e) => setDraft((d) => ({ ...d, dueMonths: e.target.value }))}
                        placeholder={draft.recurrence === 'quarterly' ? '2, 5, 8, 11' : '4'}
                      />
                    </label>
                  )}
                  <label>
                    Applies to
                    <select
                      value={`${draft.scopeLevel}:${draft.scopeId}`}
                      onChange={(e) => {
                        const [level, id] = e.target.value.split(':')
                        if (level !== 'group' && level !== 'business') return
                        setDraft((d) => ({ ...d, scopeLevel: level, scopeId: id ?? '' }))
                      }}
                    >
                      {scopeOptions.map((option) => (
                        <option
                          key={`${option.level}:${option.id}`}
                          value={`${option.level}:${option.id}`}
                        >
                          {formatScopeOptionLabel(option.level, option.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="fin-cal-modal-notes">
                    Notes (optional)
                    <input
                      value={draft.notes}
                      onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                    />
                  </label>
                </div>
                <div className="planned-funding-actions">
                  <button type="button" className="btn-ghost btn-tiny" onClick={() => setFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary btn-tiny" onClick={saveDraft}>
                    {editingId ? 'Save' : 'Add'}
                  </button>
                </div>
                {editingId && !editReadOnly ? (
                  <button
                    type="button"
                    className="btn-ghost btn-tiny fin-cal-modal-delete"
                    onClick={() => {
                      setDeleteId(editingId)
                      setFormOpen(false)
                    }}
                  >
                    Delete reminder
                  </button>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}

      {deleteId ? (
        <ConfirmDialog
          title="Delete this reminder?"
          message="Removes it from your calendar and its tick history."
          confirmLabel="Delete"
          onConfirm={() => {
            actions.deleteFinancialChecklistItem(deleteId)
            setDeleteId(null)
            setEditingId(null)
          }}
          onCancel={() => setDeleteId(null)}
        />
      ) : null}
    </section>
  )
}
