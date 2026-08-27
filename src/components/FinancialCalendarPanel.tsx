import { useMemo, useRef, useState, type ReactNode } from 'react'
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
import {
  getSystemCalendarEventsForMonth,
  getSystemCalendarTimeline,
  type SystemCalendarEvent,
} from '../utils/calendarSystemEvents'
import { isFinancialChecklistTableMissing } from '../services/workspaceRepository'
import { getReferenceDate, dateToKey } from '../utils/referenceDate'
import {
  formatScopeOptionLabel,
  getScopeLabel,
  getScopeOptionsForView,
} from '../utils/scope'

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

type CalendarActions = Pick<
  AppActions,
  | 'addFinancialChecklistItem'
  | 'updateFinancialChecklistItem'
  | 'deleteFinancialChecklistItem'
  | 'setFinancialChecklistOccurrenceDone'
>

interface SharedCalendarProps {
  state: AppState
  viewScope: ViewScope
  actions: CalendarActions
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

function emptyDraft(state: AppState, viewScope: ViewScope, preferredDate?: string): DraftItem {
  const scope = defaultScope(state, viewScope)
  const dueDate = preferredDate ?? dateToKey(getReferenceDate())
  const day = Number(dueDate.slice(8, 10)) || 28
  return {
    name: '',
    recurrence: preferredDate ? 'once' : 'monthly',
    dueDayOfMonth: Math.min(31, Math.max(1, day)),
    dueDate,
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

type DayChip = { key: string; name: string; isDue: boolean; isSystem?: boolean }

function useReminderForm(state: AppState, viewScope: ViewScope, actions: CalendarActions) {
  const editReadOnly = useEditReadOnly()
  const todayKey = dateToKey(getReferenceDate())
  const backdropPointerDown = useRef(false)
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

  const openCreate = (preferredDate?: string) => {
    setEditingId(null)
    setDraft(emptyDraft(state, viewScope, preferredDate))
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

  const modal: ReactNode = formOpen
    ? createPortal(
        <div
          className="planned-funding-backdrop"
          onPointerDown={(e) => {
            backdropPointerDown.current = e.target === e.currentTarget
          }}
          onClick={(e) => {
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
              Shows on the calendar and in Coming up. Tick when due; recurring ones return next cycle.
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
                    <option key={`${option.level}:${option.id}`} value={`${option.level}:${option.id}`}>
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
    : null

  const deleteDialog =
    deleteId != null ? (
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
    ) : null

  return { editReadOnly, openCreate, openEdit, modal, deleteDialog }
}

/** Month calendar widget */
export function FinancialCalendarMonthPanel({
  state,
  viewScope,
  actions,
  openHelp,
  setOpenHelp,
}: SharedCalendarProps) {
  const today = getReferenceDate()
  const todayKey = dateToKey(today)
  const { editReadOnly, openCreate, openEdit, modal, deleteDialog } = useReminderForm(
    state,
    viewScope,
    actions,
  )
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey)

  const monthOccurrences = useMemo(
    () => getChecklistOccurrencesForMonth(state, viewScope, cursor.year, cursor.monthIndex),
    [state, viewScope, cursor.year, cursor.monthIndex],
  )
  const systemMonth = useMemo(
    () => getSystemCalendarEventsForMonth(state, viewScope, cursor.year, cursor.monthIndex),
    [state, viewScope, cursor.year, cursor.monthIndex],
  )

  const byDate = useMemo(() => {
    const map = new Map<string, { reminders: ChecklistOccurrence[]; system: SystemCalendarEvent[] }>()
    for (const occurrence of monthOccurrences) {
      const entry = map.get(occurrence.dueDate) ?? { reminders: [], system: [] }
      entry.reminders.push(occurrence)
      map.set(occurrence.dueDate, entry)
    }
    for (const event of systemMonth) {
      const entry = map.get(event.dueDate) ?? { reminders: [], system: [] }
      entry.system.push(event)
      map.set(event.dueDate, entry)
    }
    return map
  }, [monthOccurrences, systemMonth])

  const selectedDay = selectedDate ? byDate.get(selectedDate) : undefined

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

  const chipsForDay = (dateKey: string): DayChip[] => {
    const entry = byDate.get(dateKey)
    if (!entry) return []
    const chips: DayChip[] = []
    for (const event of entry.system.filter((e) => !e.done)) {
      chips.push({
        key: event.id,
        name: event.name,
        isDue: event.status === 'due' || event.status === 'overdue',
        isSystem: true,
      })
    }
    for (const occurrence of entry.reminders.filter((r) => !r.done)) {
      chips.push({
        key: `${occurrence.item.id}-${occurrence.periodKey}`,
        name: occurrence.item.name,
        isDue: occurrence.status === 'due' || occurrence.status === 'overdue',
      })
    }
    return chips
  }

  return (
    <section
      id="financial-calendar"
      className="card widget-compact card-scroll"
      data-tour="fin-cal-month"
    >
      <div className="card-head card-head-compact card-head--widget-bar">
        <div className="card-head-toolbar" data-tour="fin-cal-toolbar">
          {!editReadOnly ? (
            <button type="button" className="btn-primary btn-widget-add" onClick={() => openCreate()}>
              + Add
            </button>
          ) : (
            <span className="card-head-toolbar-spacer" aria-hidden />
          )}
          <h2>
            Calendar
            <span className="feature-beta-badge" title="Still being shaped — reminders are saved">
              Beta
            </span>
          </h2>
          <HelpButton
            id="financial-calendar-month"
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
        Beta — double-click a day to add a reminder. Reserve transfers appear on the 1st when you have a
        plan.
      </p>

      <div className="card-scroll-body fin-cal-shell fin-cal-shell--month">
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
          <div className="fin-cal-month-title-wrap">
            <button
              type="button"
              className="fin-cal-month-title-btn"
              aria-expanded={pickerOpen}
              aria-haspopup="dialog"
              onClick={() => setPickerOpen((open) => !open)}
            >
              {monthTitle(cursor.year, cursor.monthIndex)}
            </button>
            {pickerOpen ? (
              <div className="fin-cal-month-picker" role="dialog" aria-label="Choose month">
                <div className="fin-cal-month-picker-year">
                  <button
                    type="button"
                    className="fin-cal-nav-btn"
                    aria-label="Previous year"
                    onClick={() => setCursor((c) => ({ ...c, year: c.year - 1 }))}
                  >
                    ‹
                  </button>
                  <strong>{cursor.year}</strong>
                  <button
                    type="button"
                    className="fin-cal-nav-btn"
                    aria-label="Next year"
                    onClick={() => setCursor((c) => ({ ...c, year: c.year + 1 }))}
                  >
                    ›
                  </button>
                </div>
                <div className="fin-cal-month-picker-grid">
                  {MONTH_SHORT.map((label, monthIndex) => (
                    <button
                      key={label}
                      type="button"
                      className={[
                        'fin-cal-month-picker-item',
                        monthIndex === cursor.monthIndex ? 'is-current' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => {
                        setCursor((c) => ({ ...c, monthIndex }))
                        setPickerOpen(false)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
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
              setPickerOpen(false)
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
            const chips = chipsForDay(cell.dateKey)
            const isToday = cell.dateKey === todayKey
            const isSelected = cell.dateKey === selectedDate
            const hasDue = chips.some((chip) => chip.isDue)
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
                  chips.length > 0 ? 'has-event' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setSelectedDate(cell.dateKey)
                  setPickerOpen(false)
                }}
                onDoubleClick={() => {
                  if (editReadOnly) return
                  setSelectedDate(cell.dateKey)
                  openCreate(cell.dateKey!)
                }}
              >
                <span className="fin-cal-day-num">{cell.day}</span>
                {chips.length > 0 ? (
                  <span className="fin-cal-day-events">
                    {chips.slice(0, 3).map((chip) => (
                      <span
                        key={chip.key}
                        className={[
                          'fin-cal-day-chip',
                          chip.isDue ? 'is-due' : '',
                          chip.isSystem ? 'is-system' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {chip.name}
                      </span>
                    ))}
                    {chips.length > 3 ? (
                      <span className="fin-cal-day-more">+{chips.length - 3}</span>
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
            {!editReadOnly && selectedDate ? (
              <button
                type="button"
                className="btn-ghost btn-tiny"
                onClick={() => openCreate(selectedDate)}
              >
                + Add on this day
              </button>
            ) : null}
          </header>
          {!selectedDate ? (
            <p className="muted fin-cal-empty">Click a day — double-click to add.</p>
          ) : !selectedDay ||
            (selectedDay.reminders.length === 0 && selectedDay.system.length === 0) ? (
            <p className="muted fin-cal-empty">Nothing on this day.</p>
          ) : (
            <ul className="fin-cal-sheet-list">
              {selectedDay.system.map((event) => (
                <li
                  key={event.id}
                  className={[
                    'fin-cal-sheet-row',
                    'is-system',
                    event.status === 'overdue' ? 'is-overdue' : '',
                    event.status === 'due' ? 'is-due' : '',
                    event.done ? 'is-done' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="fin-cal-sheet-mark" aria-hidden />
                  <div className="fin-cal-sheet-copy">
                    <strong>{event.name}</strong>
                    <span className="muted">
                      {event.done
                        ? 'Confirmed in Reserve Planner'
                        : 'Confirm in Reserve Planner · system'}
                      {' · '}
                      {event.scopeLabel}
                    </span>
                  </div>
                </li>
              ))}
              {selectedDay.reminders.map((occurrence) => {
                const tickable = canTick(occurrence) && !editReadOnly
                return (
                  <li
                    key={`${occurrence.item.id}-${occurrence.periodKey}`}
                    className={[
                      'fin-cal-sheet-row',
                      occurrence.status === 'overdue' ? 'is-overdue' : '',
                      occurrence.status === 'due' ? 'is-due' : '',
                      occurrence.done ? 'is-done' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {tickable ? (
                      <label className="fin-cal-sheet-check">
                        <input
                          type="checkbox"
                          checked={occurrence.done}
                          onChange={(e) =>
                            actions.setFinancialChecklistOccurrenceDone(
                              occurrence.item.id,
                              occurrence.periodKey,
                              e.target.checked,
                            )
                          }
                        />
                        <span className="sr-only">Mark {occurrence.item.name} done</span>
                      </label>
                    ) : (
                      <span className="fin-cal-sheet-mark" aria-hidden />
                    )}
                    <div className="fin-cal-sheet-copy">
                      <strong>{occurrence.item.name}</strong>
                      <span className="muted">
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
          )}
        </div>
      </div>
      {modal}
      {deleteDialog}
    </section>
  )
}

/** Coming up widget */
export function FinancialComingUpPanel({
  state,
  viewScope,
  actions,
  openHelp,
  setOpenHelp,
}: SharedCalendarProps) {
  const todayKey = dateToKey(getReferenceDate())
  const { editReadOnly, openCreate, openEdit, modal, deleteDialog } = useReminderForm(
    state,
    viewScope,
    actions,
  )

  const timeline = useMemo(() => getChecklistTimeline(state, viewScope, 120), [state, viewScope])
  const systemTimeline = useMemo(
    () => getSystemCalendarTimeline(state, viewScope, 120),
    [state, viewScope],
  )
  const reminders = useMemo(() => listChecklistItemsForView(state, viewScope), [state, viewScope])

  type Row =
    | { kind: 'reminder'; occurrence: ChecklistOccurrence }
    | { kind: 'system'; event: SystemCalendarEvent }

  const rows = useMemo(() => {
    const merged: Row[] = [
      ...timeline.map((occurrence) => ({ kind: 'reminder' as const, occurrence })),
      ...systemTimeline.map((event) => ({ kind: 'system' as const, event })),
    ]
    return merged.sort((a, b) => {
      const dateA = a.kind === 'reminder' ? a.occurrence.dueDate : a.event.dueDate
      const dateB = b.kind === 'reminder' ? b.occurrence.dueDate : b.event.dueDate
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      const nameA = a.kind === 'reminder' ? a.occurrence.item.name : a.event.name
      const nameB = b.kind === 'reminder' ? b.occurrence.item.name : b.event.name
      return nameA.localeCompare(nameB)
    })
  }, [timeline, systemTimeline])

  return (
    <section
      id="financial-coming-up"
      className="card widget-compact card-scroll"
      data-tour="fin-cal-upcoming"
    >
      <div className="card-head card-head-compact card-head--widget-bar">
        <div className="card-head-toolbar">
          {!editReadOnly ? (
            <button type="button" className="btn-primary btn-widget-add" onClick={() => openCreate()}>
              + Add
            </button>
          ) : (
            <span className="card-head-toolbar-spacer" aria-hidden />
          )}
          <h2>
            Coming up
            <span className="feature-beta-badge">Beta</span>
          </h2>
          <HelpButton
            id="financial-coming-up"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            text={WIDGET_HELP.financialComingUp}
          />
        </div>
      </div>

      <div className="card-scroll-body fin-cal-shell fin-cal-shell--upcoming">
        <p className="muted fin-cal-upcoming-lead">
          Next dates in order — including reserve transfers. Tick reminders when due.
        </p>
        {rows.length === 0 ? (
          <div className="fin-cal-empty-block">
            <p className="muted">
              {reminders.length === 0
                ? 'No reminders yet. Use + Add, or double-click a day on the calendar.'
                : 'Nothing coming up in the next 120 days.'}
            </p>
            {!editReadOnly && reminders.length === 0 ? (
              <button type="button" className="btn-primary btn-tiny" onClick={() => openCreate()}>
                Add reminder
              </button>
            ) : null}
          </div>
        ) : (
          <table className="fin-cal-upcoming-table">
            <thead>
              <tr>
                <th scope="col" className="fin-cal-upcoming-check-col">
                  <span className="sr-only">Done</span>
                </th>
                <th scope="col">When</th>
                <th scope="col">Reminder</th>
                <th scope="col">Detail</th>
                <th scope="col" className="fin-cal-upcoming-actions-col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                if (row.kind === 'system') {
                  const { event } = row
                  return (
                    <tr
                      key={event.id}
                      className={[
                        event.status === 'overdue' ? 'is-overdue' : '',
                        event.status === 'due' ? 'is-due' : '',
                        event.done ? 'is-done' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <td />
                      <td className="fin-cal-upcoming-when">{dueInLabel(event.dueDate, todayKey)}</td>
                      <td>
                        <strong>{event.name}</strong>
                      </td>
                      <td className="muted">Reserve Planner · {event.scopeLabel}</td>
                      <td />
                    </tr>
                  )
                }
                const { occurrence } = row
                const tickable = canTick(occurrence) && !editReadOnly
                return (
                  <tr
                    key={`${occurrence.item.id}-${occurrence.periodKey}`}
                    className={[
                      occurrence.status === 'overdue' ? 'is-overdue' : '',
                      occurrence.status === 'due' ? 'is-due' : '',
                      occurrence.done ? 'is-done' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <td className="fin-cal-upcoming-check-col">
                      {tickable ? (
                        <label className="fin-cal-sheet-check">
                          <input
                            type="checkbox"
                            checked={occurrence.done}
                            onChange={(e) =>
                              actions.setFinancialChecklistOccurrenceDone(
                                occurrence.item.id,
                                occurrence.periodKey,
                                e.target.checked,
                              )
                            }
                          />
                          <span className="sr-only">Mark {occurrence.item.name} done</span>
                        </label>
                      ) : null}
                    </td>
                    <td className="fin-cal-upcoming-when">
                      {dueInLabel(occurrence.dueDate, todayKey)}
                    </td>
                    <td>
                      <strong>{occurrence.item.name}</strong>
                    </td>
                    <td className="muted">
                      {recurrenceLabel(occurrence.item.recurrence)}
                      {' · '}
                      {getScopeLabel(state, {
                        type: occurrence.item.scopeLevel,
                        id: occurrence.item.scopeId,
                      })}
                    </td>
                    <td className="fin-cal-upcoming-actions-col">
                      {!editReadOnly ? (
                        <button
                          type="button"
                          className="btn-ghost btn-tiny"
                          onClick={() => openEdit(occurrence.item)}
                        >
                          Edit
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {modal}
      {deleteDialog}
    </section>
  )
}

/** @deprecated Prefer FinancialCalendarMonthPanel — kept for any stray imports */
export function FinancialCalendarPanel(props: SharedCalendarProps) {
  return <FinancialCalendarMonthPanel {...props} />
}
