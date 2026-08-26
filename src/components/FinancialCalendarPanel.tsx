import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, ChecklistRecurrence, FinancialChecklistItem, ViewScope } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import { HelpButton } from './HelpButton'
import { ConfirmDialog } from './ConfirmDialog'
import { CompactKpiStrip } from './CompactKpiStrip'
import { WIDGET_HELP } from '../content/livingDashboard'
import {
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

function formatLongDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function ordinal(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

function dueDayLabel(item: FinancialChecklistItem): string {
  if (item.recurrence === 'once' && item.dueDate) return formatShortDate(item.dueDate)
  if (item.dueDayOfMonth) return `${ordinal(item.dueDayOfMonth)} of month`
  return '—'
}

function parseDueMonths(raw: string): number[] | undefined {
  const months = raw
    .split(/[,\s]+/)
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12)
  return months.length > 0 ? [...new Set(months)].sort((a, b) => a - b) : undefined
}

export function FinancialCalendarPanel({
  state,
  viewScope,
  actions,
  openHelp,
  setOpenHelp,
}: FinancialCalendarPanelProps) {
  const editReadOnly = useEditReadOnly()
  const todayKey = dateToKey(getReferenceDate())
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
    () => getUpcomingChecklistOccurrences(state, viewScope, 90),
    [state, viewScope],
  )
  const recurring = useMemo(() => listChecklistItemsForView(state, viewScope), [state, viewScope])
  const nextUp = upcoming[0] ?? null

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

  return (
    <section id="financial-calendar" className="card widget-compact card-scroll" data-tour="financial-calendar">
      <div className="card-head card-head-compact card-head-with-kpi">
        <h2>Financial calendar</h2>
        <table className="kpi-table kpi-table--head kpi-table--totals" aria-label="Calendar summary">
          <tbody>
            <tr>
              <th scope="row">To do now</th>
              <td className="col-amount kpi-primary">{outstanding.length}</td>
            </tr>
          </tbody>
        </table>
        <div className="card-actions">
          {!editReadOnly ? (
            <button type="button" className="btn-primary btn-widget-add" onClick={openCreate}>
              + Add
            </button>
          ) : null}
          <HelpButton
            id="financial-calendar"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            text={WIDGET_HELP.financialCalendar}
          />
        </div>
      </div>

      <div className="card-kpi-bar">
        <CompactKpiStrip
          items={[
            {
              label: 'Waiting to tick',
              value: outstanding.length,
              emphasis: outstanding.length > 0,
            },
            {
              label: 'Next due',
              value: nextUp
                ? `${nextUp.item.name} · ${formatShortDate(nextUp.dueDate)}`
                : recurring.length > 0
                  ? 'Nothing in next 90 days'
                  : 'Add a reminder',
            },
            { label: 'Reminders', value: recurring.length },
          ]}
        />
      </div>

      {isFinancialChecklistTableMissing() ? (
        <div className="import-banner" role="status">
          <span>Cloud sync for the calendar is still unavailable — check Supabase migrations.</span>
        </div>
      ) : null}

      <div className="card-scroll-body fin-cal-body">
        <div className="sheet-section sheet-section-compact">
          <div className="sheet-section-head">
            <h3>To do now</h3>
            <p className="muted fin-cal-section-lead">
              Financial reminders that have reached their date. Tick when done — recurring ones come
              back on the next due date.
            </p>
          </div>
          {outstanding.length === 0 ? (
            <p className="muted fin-cal-empty">Nothing waiting. Reminders land here on their due date.</p>
          ) : (
            <ul className="fin-cal-todo-list">
              {outstanding.map((occurrence) => (
                <TodoRow
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
                />
              ))}
            </ul>
          )}
        </div>

        <div className="sheet-section sheet-section-compact">
          <div className="sheet-section-head">
            <h3>Coming up</h3>
            <p className="muted fin-cal-section-lead">
              Dates on your financial calendar for the next 90 days.
            </p>
          </div>
          {upcoming.length === 0 ? (
            <p className="muted fin-cal-empty">
              {recurring.length === 0
                ? 'Add reminders below — they will show here before each due date.'
                : 'No dates in the next 90 days.'}
            </p>
          ) : (
            <table className="fin-cal-upcoming-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Reminder</th>
                  <th scope="col">Repeats</th>
                  {!editReadOnly ? <th scope="col" className="fin-cal-actions-col" /> : null}
                </tr>
              </thead>
              <tbody>
                {upcoming.map((occurrence) => (
                  <tr key={`${occurrence.item.id}-${occurrence.periodKey}`}>
                    <td>{formatLongDate(occurrence.dueDate)}</td>
                    <td>{occurrence.item.name}</td>
                    <td className="muted">{recurrenceLabel(occurrence.item.recurrence)}</td>
                    {!editReadOnly ? (
                      <td className="fin-cal-actions-col">
                        <button
                          type="button"
                          className="btn-ghost btn-tiny"
                          onClick={() => openEdit(occurrence.item)}
                        >
                          Edit
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="sheet-section sheet-section-compact">
          <div className="sheet-section-head">
            <h3>Your reminders</h3>
            <p className="muted fin-cal-section-lead">
              Anything you want to track — set the name and due date once. It appears under Coming up,
              then To do now when the date arrives.
            </p>
          </div>
          {recurring.length === 0 ? (
            <p className="muted fin-cal-empty">No reminders yet. Use + Add to create one.</p>
          ) : (
            <table className="fin-cal-recurring-table">
              <thead>
                <tr>
                  <th scope="col">Reminder</th>
                  <th scope="col">Repeats</th>
                  <th scope="col">Due</th>
                  <th scope="col">Applies to</th>
                  {!editReadOnly ? <th scope="col" className="fin-cal-actions-col" /> : null}
                </tr>
              </thead>
              <tbody>
                {recurring.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.notes ? <span className="muted fin-cal-note">{item.notes}</span> : null}
                    </td>
                    <td>{recurrenceLabel(item.recurrence)}</td>
                    <td>{dueDayLabel(item)}</td>
                    <td className="muted">
                      {getScopeLabel(state, { type: item.scopeLevel, id: item.scopeId })}
                    </td>
                    {!editReadOnly ? (
                      <td className="fin-cal-actions-col">
                        <button
                          type="button"
                          className="btn-ghost btn-tiny"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-ghost btn-tiny"
                          onClick={() => setDeleteId(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
                  Name it, pick when it repeats, and choose the due date or day of month.
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
          }}
          onCancel={() => setDeleteId(null)}
        />
      ) : null}
    </section>
  )
}

function TodoRow({
  occurrence,
  state,
  editReadOnly,
  onToggle,
  onEdit,
}: {
  occurrence: ChecklistOccurrence
  state: AppState
  editReadOnly: boolean
  onToggle: (done: boolean) => void
  onEdit: () => void
}) {
  const overdue = occurrence.status === 'overdue'
  const dueToday = occurrence.status === 'due'
  return (
    <li className={`fin-cal-todo-row${overdue ? ' is-overdue' : ''}${dueToday ? ' is-due-today' : ''}`}>
      {!editReadOnly ? (
        <label className="fin-cal-todo-check">
          <input
            type="checkbox"
            checked={occurrence.done}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="sr-only">Mark {occurrence.item.name} done</span>
        </label>
      ) : null}
      <div className="fin-cal-todo-copy">
        <strong>{occurrence.item.name}</strong>
        <span className="muted">
          {overdue
            ? `Overdue · was due ${formatShortDate(occurrence.dueDate)}`
            : dueToday
              ? 'Due today'
              : formatShortDate(occurrence.dueDate)}
          {' · '}
          {getScopeLabel(state, {
            type: occurrence.item.scopeLevel,
            id: occurrence.item.scopeId,
          })}
        </span>
      </div>
      {!editReadOnly ? (
        <button type="button" className="btn-ghost btn-tiny" onClick={onEdit}>
          Edit
        </button>
      ) : null}
    </li>
  )
}
