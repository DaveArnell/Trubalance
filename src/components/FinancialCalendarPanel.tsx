import { useMemo, useRef, useState } from 'react'
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

function formatShortDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function formatDayHeading(dateKey: string): string {
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

function daysUntil(dueDate: string, todayKey: string): number {
  const due = new Date(`${dueDate}T12:00:00`)
  const today = new Date(`${todayKey}T12:00:00`)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

function dueInLabel(dueDate: string, todayKey: string): string {
  const days = daysUntil(dueDate, todayKey)
  if (days < 0) return `Overdue · ${formatShortDate(dueDate)}`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days < 14) return `Due in ${days} days`
  return formatShortDate(dueDate)
}

function parseDueMonths(raw: string): number[] | undefined {
  const months = raw
    .split(/[,\s]+/)
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12)
  return months.length > 0 ? [...new Set(months)].sort((a, b) => a - b) : undefined
}

function canTick(occurrence: ChecklistOccurrence): boolean {
  return occurrence.status === 'due' || occurrence.status === 'overdue' || occurrence.done
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
  const backdropPointerDown = useRef(false)
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }))
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey)
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

  const timeline = useMemo(() => getChecklistTimeline(state, viewScope, 120), [state, viewScope])
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

  const selectedDayItems = useMemo(() => {
    if (!selectedDate) return []
    return byDate.get(selectedDate) ?? []
  }, [byDate, selectedDate])

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

  const renderOccurrenceRow = (
    occurrence: ChecklistOccurrence,
    options?: { showDate?: boolean },
  ) => {
    const tickable = canTick(occurrence) && !editReadOnly
    return (
      <li
        key={`${occurrence.item.id}-${occurrence.periodKey}`}
        className={[
          'fin-cal-item',
          occurrence.status === 'overdue' ? 'is-overdue' : '',
          occurrence.status === 'due' ? 'is-due' : '',
          occurrence.done ? 'is-done' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {tickable ? (
          <label className="fin-cal-item-check">
            <input
              type="checkbox"
              checked={occurrence.done}
              onChange={(e) => toggleDone(occurrence, e.target.checked)}
            />
            <span className="sr-only">Mark {occurrence.item.name} done</span>
          </label>
        ) : (
          <span className="fin-cal-item-mark" aria-hidden />
        )}
        <div className="fin-cal-item-copy">
          <strong>{occurrence.item.name}</strong>
          <span className="muted">
            {options?.showDate ? `${dueInLabel(occurrence.dueDate, todayKey)} · ` : null}
            {recurrenceLabel(occurrence.item.recurrence)}
            {' · '}
            {getScopeLabel(state, {
              type: occurrence.item.scopeLevel,
              id: occurrence.item.scopeId,
            })}
            {occurrence.item.notes ? ` · ${occurrence.item.notes}` : null}
          </span>
        </div>
        {!editReadOnly ? (
          <button type="button" className="btn-ghost btn-tiny fin-cal-item-edit" onClick={() => openEdit(occurrence.item)}>
            Edit
          </button>
        ) : null}
      </li>
    )
  }

  return (
    <section id="financial-calendar" className="card widget-compact card-scroll" data-tour="financial-calendar">
      <div className="card-head card-head-compact card-head--widget-bar">
        <div className="card-head-toolbar" data-tour="fin-cal-toolbar">
          {!editReadOnly ? (
            <button type="button" className="btn-primary btn-widget-add" onClick={openCreate}>
              + Add
            </button>
          ) : (
            <span className="card-head-toolbar-spacer" aria-hidden />
          )}
          <h2>
            Financial calendar
            <span className="feature-beta-badge" title="Still being shaped — your reminders are saved">
              Beta
            </span>
          </h2>
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
      <p className="fin-cal-beta-note muted">
        Beta — the layout is still being shaped. Reminders you add are saved.
      </p>

      <div className="card-scroll-body fin-cal-shell">
        <div className="fin-cal-layout">
          <div className="fin-cal-main" data-tour="fin-cal-month">
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
                const openItems = dayItems.filter((item) => !item.done)
                const isToday = cell.dateKey === todayKey
                const isSelected = cell.dateKey === selectedDate
                const hasDue = openItems.some(
                  (item) => item.status === 'due' || item.status === 'overdue',
                )
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
                      openItems.length > 0 ? 'has-event' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSelectedDate(cell.dateKey)}
                  >
                    <span className="fin-cal-day-num">{cell.day}</span>
                    {openItems.length > 0 ? (
                      <span className="fin-cal-day-events">
                        {openItems.slice(0, 3).map((item) => (
                          <span
                            key={`${item.item.id}-${item.periodKey}`}
                            className={[
                              'fin-cal-day-chip',
                              item.status === 'overdue' || item.status === 'due' ? 'is-due' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {item.item.name}
                          </span>
                        ))}
                        {openItems.length > 3 ? (
                          <span className="fin-cal-day-more">+{openItems.length - 3}</span>
                        ) : null}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="fin-cal-day-detail" data-tour="fin-cal-day-detail">
              <header className="fin-cal-day-detail-head">
                <h4>{selectedDate ? formatDayHeading(selectedDate) : 'Select a day'}</h4>
              </header>
              {!selectedDate ? (
                <p className="muted fin-cal-empty">Click a day to see its reminders.</p>
              ) : selectedDayItems.length === 0 ? (
                <p className="muted fin-cal-empty">Nothing on this day.</p>
              ) : (
                <ul className="fin-cal-item-list">{selectedDayItems.map((item) => renderOccurrenceRow(item))}</ul>
              )}
            </div>
          </div>

          <aside className="fin-cal-upcoming" data-tour="fin-cal-upcoming">
            <header className="fin-cal-upcoming-head">
              <h3>Coming up</h3>
              <span className="fin-cal-count">{timeline.length}</span>
            </header>
            <p className="muted fin-cal-upcoming-lead">
              Next dates in order. Tick when due — overdue stays until you tick it.
            </p>
            {timeline.length === 0 ? (
              <div className="fin-cal-empty-block">
                <p className="muted">
                  {reminders.length === 0
                    ? 'No reminders yet. Use + Add to put dates on your calendar.'
                    : 'Nothing coming up in the next 120 days.'}
                </p>
                {!editReadOnly && reminders.length === 0 ? (
                  <button type="button" className="btn-primary btn-tiny" onClick={openCreate}>
                    Add reminder
                  </button>
                ) : null}
              </div>
            ) : (
              <ul className="fin-cal-item-list">
                {timeline.map((occurrence) => renderOccurrenceRow(occurrence, { showDate: true }))}
              </ul>
            )}
          </aside>
        </div>
      </div>

      {formOpen
        ? createPortal(
            <div
              className="planned-funding-backdrop"
              onPointerDown={(e) => {
                backdropPointerDown.current = e.target === e.currentTarget
              }}
              onClick={(e) => {
                // Only close when the press started on the backdrop — not when a
                // number/date drag ends outside the dialog.
                if (backdropPointerDown.current && e.target === e.currentTarget) setFormOpen(false)
                backdropPointerDown.current = false
              }}
            >
              <div
                className="planned-funding-modal fin-cal-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="fin-cal-form-title"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <h3 id="fin-cal-form-title">{editingId ? 'Edit reminder' : 'Add reminder'}</h3>
                <p className="planned-funding-subtitle">
                  Shows on the calendar and in Coming up. Tick when due; recurring ones return next
                  cycle. Notes stay with the reminder.
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
                      placeholder="e.g. Pay from Swindon current"
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
