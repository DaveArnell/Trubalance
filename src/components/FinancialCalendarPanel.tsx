import { useMemo, useState } from 'react'
import type { AppState, ChecklistRecurrence, FinancialChecklistItem, ViewScope } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import { HelpButton } from './HelpButton'
import { ConfirmDialog } from './ConfirmDialog'
import { WIDGET_HELP } from '../content/livingDashboard'
import {
  getChecklistOccurrencesForMonth,
  getOutstandingChecklistOccurrences,
  getUpcomingChecklistOccurrences,
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
    | 'seedFinancialChecklistTemplates'
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

function defaultScope(
  state: AppState,
  viewScope: ViewScope,
): { scopeLevel: 'group' | 'business'; scopeId: string } {
  if (viewScope.type === 'group') {
    return { scopeLevel: 'group', scopeId: viewScope.id }
  }
  if (viewScope.type === 'business') {
    return { scopeLevel: 'business', scopeId: viewScope.id }
  }
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
  const d = new Date(`${dateKey}T12:00:00`)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function statusLabel(status: ChecklistOccurrence['status']): string {
  if (status === 'overdue') return 'Outstanding'
  if (status === 'due') return 'Due today'
  if (status === 'done') return 'Done'
  return 'Upcoming'
}

function parseDueMonths(raw: string): number[] | undefined {
  const months = raw
    .split(/[,\s]+/)
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12)
  return months.length > 0 ? [...new Set(months)].sort((a, b) => a - b) : undefined
}

function monthTitle(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
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
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }))
  const [selectedDate, setSelectedDate] = useState(() => dateToKey(today))
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

  const outstanding = useMemo(
    () => getOutstandingChecklistOccurrences(state, viewScope),
    [state, viewScope],
  )
  const upcoming = useMemo(
    () => getUpcomingChecklistOccurrences(state, viewScope, 45),
    [state, viewScope],
  )
  const monthOccurrences = useMemo(
    () => getChecklistOccurrencesForMonth(state, viewScope, cursor.year, cursor.monthIndex),
    [state, viewScope, cursor.year, cursor.monthIndex],
  )
  const configured = useMemo(() => listChecklistItemsForView(state, viewScope), [state, viewScope])

  const byDate = useMemo(() => {
    const map = new Map<string, ChecklistOccurrence[]>()
    for (const occurrence of monthOccurrences) {
      const list = map.get(occurrence.dueDate) ?? []
      list.push(occurrence)
      map.set(occurrence.dueDate, list)
    }
    return map
  }, [monthOccurrences])

  const selectedDayItems = byDate.get(selectedDate) ?? []

  const calendarCells = useMemo(() => {
    const first = new Date(cursor.year, cursor.monthIndex, 1)
    const startPad = (first.getDay() + 6) % 7 // Monday-first
    const daysInMonth = new Date(cursor.year, cursor.monthIndex + 1, 0).getDate()
    const cells: Array<{ dateKey: string | null; day: number | null }> = []
    for (let i = 0; i < startPad; i++) cells.push({ dateKey: null, day: null })
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = dateToKey(new Date(cursor.year, cursor.monthIndex, day))
      cells.push({ dateKey, day })
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
      dueDate: item.dueDate ?? dateToKey(today),
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
    if (editingId) {
      actions.updateFinancialChecklistItem(editingId, payload)
    } else {
      actions.addFinancialChecklistItem(payload)
    }
    setFormOpen(false)
    setEditingId(null)
  }

  const seedScope = defaultScope(state, viewScope)

  return (
    <section className="card financial-calendar-panel" data-tour="financial-calendar">
      <div className="card-head card-head-compact">
        <div>
          <h2>Financial calendar</h2>
          <p className="muted">
            Set money-admin tasks ahead of time. When the date arrives they stay on your checklist
            until you tick them — then the next cycle comes back on its own.
          </p>
        </div>
        <HelpButton
          id="financial-calendar"
          openHelp={openHelp}
          setOpenHelp={setOpenHelp}
          text={WIDGET_HELP.financialCalendar}
        />
      </div>

      {isFinancialChecklistTableMissing() ? (
        <div className="import-banner" role="status">
          <span>
            Checklist cloud storage is not set up yet — items stay on this device for now. Run
            migrations 037 and 038 in the Supabase SQL Editor so they save to your account.
          </span>
        </div>
      ) : null}

      <div className="financial-calendar-toolbar">
        {!editReadOnly ? (
          <>
            <button type="button" className="btn-primary btn-tiny" onClick={openCreate}>
              + Add item
            </button>
            <button
              type="button"
              className="btn-ghost btn-tiny"
              onClick={() =>
                actions.seedFinancialChecklistTemplates(seedScope.scopeLevel, seedScope.scopeId)
              }
              disabled={!seedScope.scopeId}
            >
              Add starter list
            </button>
          </>
        ) : null}
        <span className="muted financial-calendar-count">
          {configured.length} set up · {outstanding.length} outstanding
        </span>
      </div>

      <div className="financial-calendar-layout">
        <div className="financial-calendar-main">
          <div className="financial-calendar-month-nav">
            <button
              type="button"
              className="btn-ghost btn-tiny"
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
              className="btn-ghost btn-tiny"
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

          <div className="financial-calendar-weekdays" aria-hidden>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="financial-calendar-grid" role="grid" aria-label="Financial calendar">
            {calendarCells.map((cell, index) => {
              if (!cell.dateKey || cell.day == null) {
                return <div key={`pad-${index}`} className="financial-calendar-day is-pad" />
              }
              const dayItems = byDate.get(cell.dateKey) ?? []
              const hasOutstanding = dayItems.some(
                (item) => item.status === 'due' || item.status === 'overdue',
              )
              const hasUpcoming = dayItems.some((item) => item.status === 'upcoming')
              const isToday = cell.dateKey === dateToKey(today)
              const isSelected = cell.dateKey === selectedDate
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  className={[
                    'financial-calendar-day',
                    isToday ? 'is-today' : '',
                    isSelected ? 'is-selected' : '',
                    hasOutstanding ? 'has-outstanding' : '',
                    hasUpcoming ? 'has-upcoming' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedDate(cell.dateKey!)}
                >
                  <span className="financial-calendar-day-num">{cell.day}</span>
                  {dayItems.length > 0 ? (
                    <span className="financial-calendar-day-dots" aria-hidden>
                      {dayItems.slice(0, 3).map((item) => (
                        <i
                          key={`${item.item.id}-${item.periodKey}`}
                          className={`dot status-${item.status}`}
                        />
                      ))}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="financial-calendar-day-detail">
            <h4>{formatShortDate(selectedDate)}</h4>
            {selectedDayItems.length === 0 ? (
              <p className="muted">Nothing scheduled on this day.</p>
            ) : (
              <ul className="financial-checklist-list">
                {selectedDayItems.map((occurrence) => (
                  <OccurrenceRow
                    key={`${occurrence.item.id}-${occurrence.periodKey}`}
                    occurrence={occurrence}
                    state={state}
                    editReadOnly={editReadOnly}
                    onToggle={(done) =>
                      actions.setFinancialChecklistOccurrenceDone(
                        occurrence.item.id,
                        occurrence.periodKey,
                        done,
                      )
                    }
                    onEdit={() => openEdit(occurrence.item)}
                    onDelete={() => setDeleteId(occurrence.item.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="financial-calendar-aside">
          <section className="financial-checklist-block">
            <header>
              <h3>Outstanding checklist</h3>
              <p className="muted">Due today or earlier — stays here until ticked.</p>
            </header>
            {outstanding.length === 0 ? (
              <p className="muted">All clear for now.</p>
            ) : (
              <ul className="financial-checklist-list">
                {outstanding.map((occurrence) => (
                  <OccurrenceRow
                    key={`${occurrence.item.id}-${occurrence.periodKey}`}
                    occurrence={occurrence}
                    state={state}
                    editReadOnly={editReadOnly}
                    onToggle={(done) =>
                      actions.setFinancialChecklistOccurrenceDone(
                        occurrence.item.id,
                        occurrence.periodKey,
                        done,
                      )
                    }
                    onEdit={() => openEdit(occurrence.item)}
                    onDelete={() => setDeleteId(occurrence.item.id)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="financial-checklist-block">
            <header>
              <h3>Coming up</h3>
              <p className="muted">Next 45 days on the calendar.</p>
            </header>
            {upcoming.length === 0 ? (
              <p className="muted">Nothing upcoming — add items or use the starter list.</p>
            ) : (
              <ul className="financial-checklist-list">
                {upcoming.slice(0, 12).map((occurrence) => (
                  <OccurrenceRow
                    key={`${occurrence.item.id}-${occurrence.periodKey}`}
                    occurrence={occurrence}
                    state={state}
                    editReadOnly={editReadOnly}
                    showToggle={false}
                    onEdit={() => openEdit(occurrence.item)}
                    onDelete={() => setDeleteId(occurrence.item.id)}
                  />
                ))}
              </ul>
            )}
          </section>

          {configured.length > 0 ? (
            <section className="financial-checklist-block">
              <header>
                <h3>Set up</h3>
                <p className="muted">Recurring and one-off items for this view.</p>
              </header>
              <ul className="financial-checklist-setup">
                {configured.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span className="muted">
                        {recurrenceLabel(item.recurrence)}
                        {item.recurrence !== 'once' && item.dueDayOfMonth
                          ? ` · day ${item.dueDayOfMonth}`
                          : ''}
                        {item.recurrence === 'once' && item.dueDate
                          ? ` · ${formatShortDate(item.dueDate)}`
                          : ''}
                        {' · '}
                        {getScopeLabel(state, {
                          type: item.scopeLevel,
                          id: item.scopeId,
                        })}
                      </span>
                    </div>
                    {!editReadOnly ? (
                      <div className="financial-checklist-row-actions">
                        <button type="button" className="btn-ghost btn-tiny" onClick={() => openEdit(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-ghost btn-tiny"
                          onClick={() => setDeleteId(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      {formOpen ? (
        <div className="financial-calendar-form" role="dialog" aria-label="Checklist item">
          <h3>{editingId ? 'Edit item' : 'Add item'}</h3>
          <div className="financial-calendar-form-grid">
            <label>
              Name
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Staff pay"
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
                <option value="once">One-off</option>
              </select>
            </label>
            {draft.recurrence === 'once' ? (
              <label>
                Due date
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
                Months (1–12, comma separated)
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
            <label className="financial-calendar-form-notes">
              Notes
              <input
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                placeholder="Optional"
              />
            </label>
          </div>
          <div className="financial-calendar-form-actions">
            <button type="button" className="btn-primary btn-tiny" onClick={saveDraft}>
              {editingId ? 'Save' : 'Add'}
            </button>
            <button
              type="button"
              className="btn-ghost btn-tiny"
              onClick={() => {
                setFormOpen(false)
                setEditingId(null)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <ConfirmDialog
          title="Delete checklist item?"
          message="This removes the recurring item and its history of ticks for this workspace."
          confirmLabel="Delete"
          onConfirm={() => {
            actions.deleteFinancialChecklistItem(deleteId)
            setDeleteId(null)
          }}
          onCancel={() => setDeleteId(null)}
        />
      ) : null}
    </section>
  )
}

function OccurrenceRow({
  occurrence,
  state,
  editReadOnly,
  onToggle,
  onEdit,
  onDelete,
  showToggle = true,
}: {
  occurrence: ChecklistOccurrence
  state: AppState
  editReadOnly: boolean
  onToggle?: (done: boolean) => void
  onEdit: () => void
  onDelete: () => void
  showToggle?: boolean
}) {
  return (
    <li className={`financial-checklist-row status-${occurrence.status}`}>
      {showToggle && onToggle && !editReadOnly ? (
        <label className="financial-checklist-tick">
          <input
            type="checkbox"
            checked={occurrence.done}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="sr-only">Mark done</span>
        </label>
      ) : (
        <span className={`financial-checklist-status-pill status-${occurrence.status}`}>
          {statusLabel(occurrence.status)}
        </span>
      )}
      <div className="financial-checklist-copy">
        <strong>{occurrence.item.name}</strong>
        <span className="muted">
          {formatShortDate(occurrence.dueDate)}
          {' · '}
          {recurrenceLabel(occurrence.item.recurrence)}
          {' · '}
          {getScopeLabel(state, {
            type: occurrence.item.scopeLevel,
            id: occurrence.item.scopeId,
          })}
        </span>
      </div>
      {!editReadOnly ? (
        <div className="financial-checklist-row-actions">
          <button type="button" className="btn-ghost btn-tiny" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="btn-ghost btn-tiny" onClick={onDelete}>
            Delete
          </button>
        </div>
      ) : null}
    </li>
  )
}
