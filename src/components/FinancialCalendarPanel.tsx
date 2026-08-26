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

type MainTab = 'doing' | 'ahead' | 'setup'

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

function formatWeekdayDate(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
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

function scheduleSummary(item: FinancialChecklistItem): string {
  if (item.recurrence === 'once' && item.dueDate) {
    return `One-off · ${formatShortDate(item.dueDate)}`
  }
  const day = item.dueDayOfMonth ? ordinal(item.dueDayOfMonth) : ''
  if (item.recurrence === 'monthly') return `Monthly · ${day}`
  if (item.recurrence === 'quarterly') {
    const months = (item.dueMonths ?? [1, 4, 7, 10]).join(', ')
    return `Quarterly · ${day} of months ${months}`
  }
  const months = (item.dueMonths ?? [4]).join(', ')
  return `Yearly · ${day} of month ${months}`
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

function groupByDate(items: ChecklistOccurrence[]): Array<{ date: string; items: ChecklistOccurrence[] }> {
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
  const [tab, setTab] = useState<MainTab>('doing')
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
    () => getUpcomingChecklistOccurrences(state, viewScope, 60),
    [state, viewScope],
  )
  const monthOccurrences = useMemo(
    () => getChecklistOccurrencesForMonth(state, viewScope, cursor.year, cursor.monthIndex),
    [state, viewScope, cursor.year, cursor.monthIndex],
  )
  const configured = useMemo(() => listChecklistItemsForView(state, viewScope), [state, viewScope])
  const upcomingGroups = useMemo(() => groupByDate(upcoming), [upcoming])

  const monthMarks = useMemo(() => {
    const map = new Map<string, 'due' | 'upcoming' | 'done'>()
    for (const occurrence of monthOccurrences) {
      const prev = map.get(occurrence.dueDate)
      if (occurrence.status === 'due' || occurrence.status === 'overdue') {
        map.set(occurrence.dueDate, 'due')
      } else if (occurrence.status === 'upcoming' && prev !== 'due') {
        map.set(occurrence.dueDate, 'upcoming')
      } else if (occurrence.status === 'done' && !prev) {
        map.set(occurrence.dueDate, 'done')
      }
    }
    return map
  }, [monthOccurrences])

  const daysInMonth = new Date(cursor.year, cursor.monthIndex + 1, 0).getDate()
  const seedScope = defaultScope(state, viewScope)

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
    if (editingId) {
      actions.updateFinancialChecklistItem(editingId, payload)
    } else {
      actions.addFinancialChecklistItem(payload)
      setTab('ahead')
    }
    setFormOpen(false)
    setEditingId(null)
  }

  return (
    <section className="card financial-checklist-panel" data-tour="financial-calendar">
      <div className="card-head card-head--widget-bar">
        <div className="card-head-toolbar">
          <div className="card-head-toolbar-left">
            <h2>Checklist</h2>
            <HelpButton
              id="financial-calendar"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
              text={WIDGET_HELP.financialCalendar}
            />
          </div>
          <div className="card-head-toolbar-right">
            {!editReadOnly ? (
              <>
                <button
                  type="button"
                  className="btn-ghost btn-tiny"
                  onClick={() =>
                    actions.seedFinancialChecklistTemplates(seedScope.scopeLevel, seedScope.scopeId)
                  }
                  disabled={!seedScope.scopeId || configured.length > 0}
                  title={
                    configured.length > 0
                      ? 'Starter items already present'
                      : 'Add common monthly / VAT / Companies House tasks'
                  }
                >
                  Starter list
                </button>
                <button type="button" className="btn-widget-add" onClick={openCreate}>
                  + Add
                </button>
              </>
            ) : null}
          </div>
        </div>
        <p className="financial-checklist-lead muted">
          Money-admin tasks for this view. Tick what is due; set the rest ahead so they appear when
          the date arrives.
        </p>
      </div>

      {isFinancialChecklistTableMissing() ? (
        <div className="import-banner" role="status">
          <span>
            Cloud storage for checklist is not set up yet. Run migrations 037 and 038 in the Supabase
            SQL Editor so items save to your account.
          </span>
        </div>
      ) : null}

      <div className="financial-checklist-summary" aria-label="Checklist summary">
        <button
          type="button"
          className={`financial-checklist-summary-pill${tab === 'doing' ? ' is-active' : ''}${
            outstanding.length > 0 ? ' has-work' : ''
          }`}
          onClick={() => setTab('doing')}
        >
          <strong>{outstanding.length}</strong>
          <span>Needs doing</span>
        </button>
        <button
          type="button"
          className={`financial-checklist-summary-pill${tab === 'ahead' ? ' is-active' : ''}`}
          onClick={() => setTab('ahead')}
        >
          <strong>{upcoming.length}</strong>
          <span>Coming up</span>
        </button>
        <button
          type="button"
          className={`financial-checklist-summary-pill${tab === 'setup' ? ' is-active' : ''}`}
          onClick={() => setTab('setup')}
        >
          <strong>{configured.length}</strong>
          <span>Set up</span>
        </button>
      </div>

      <div className="financial-checklist-monthbar" aria-label="Month overview">
        <div className="financial-checklist-monthbar-nav">
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
          <span>{monthTitle(cursor.year, cursor.monthIndex)}</span>
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
        <div className="financial-checklist-monthbar-days">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateKey = dateToKey(new Date(cursor.year, cursor.monthIndex, day))
            const mark = monthMarks.get(dateKey)
            const isToday = dateKey === todayKey
            return (
              <span
                key={dateKey}
                className={[
                  'financial-checklist-monthbar-day',
                  isToday ? 'is-today' : '',
                  mark ? `mark-${mark}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={
                  mark
                    ? `${day}: ${mark === 'due' ? 'Needs doing' : mark === 'upcoming' ? 'Coming up' : 'Done'}`
                    : String(day)
                }
              >
                {day}
              </span>
            )
          })}
        </div>
      </div>

      {tab === 'doing' ? (
        <div className="financial-checklist-body">
          {outstanding.length === 0 ? (
            <div className="financial-checklist-empty">
              <p>Nothing waiting to be ticked.</p>
              <p className="muted">
                When a scheduled date arrives, it lands here until you mark it done.
              </p>
              {!editReadOnly && configured.length === 0 ? (
                <button type="button" className="btn-primary btn-tiny" onClick={openCreate}>
                  Add your first task
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="financial-checklist-ticklist">
              {outstanding.map((occurrence) => (
                <TickRow
                  key={`${occurrence.item.id}-${occurrence.periodKey}`}
                  occurrence={occurrence}
                  state={state}
                  editReadOnly={editReadOnly}
                  emphasis
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
      ) : null}

      {tab === 'ahead' ? (
        <div className="financial-checklist-body">
          {upcomingGroups.length === 0 ? (
            <div className="financial-checklist-empty">
              <p>Nothing scheduled in the next 60 days.</p>
              <p className="muted">Add recurring tasks so they show here before they are due.</p>
            </div>
          ) : (
            <div className="financial-checklist-agenda">
              {upcomingGroups.map((group) => (
                <section key={group.date} className="financial-checklist-agenda-group">
                  <h3>{formatWeekdayDate(group.date)}</h3>
                  <ul className="financial-checklist-ticklist financial-checklist-ticklist--quiet">
                    {group.items.map((occurrence) => (
                      <TickRow
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
                </section>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'setup' ? (
        <div className="financial-checklist-body">
          {configured.length === 0 ? (
            <div className="financial-checklist-empty">
              <p>No recurring tasks set up yet.</p>
              <p className="muted">
                Payroll, pension, VAT, reserve transfers — set them once and they return each cycle.
              </p>
              {!editReadOnly ? (
                <div className="financial-checklist-empty-actions">
                  <button type="button" className="btn-primary btn-tiny" onClick={openCreate}>
                    Add task
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-tiny"
                    onClick={() =>
                      actions.seedFinancialChecklistTemplates(seedScope.scopeLevel, seedScope.scopeId)
                    }
                    disabled={!seedScope.scopeId}
                  >
                    Use starter list
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <ul className="financial-checklist-setuplist">
              {configured.map((item) => (
                <li key={item.id}>
                  <div className="financial-checklist-setuplist-copy">
                    <strong>{item.name}</strong>
                    <span className="muted">
                      {scheduleSummary(item)}
                      {' · '}
                      {getScopeLabel(state, { type: item.scopeLevel, id: item.scopeId })}
                    </span>
                    {item.notes ? <span className="financial-checklist-notes">{item.notes}</span> : null}
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
          )}
        </div>
      ) : null}

      {formOpen
        ? createPortal(
            <div className="planned-funding-backdrop" onClick={() => setFormOpen(false)}>
              <div
                className="planned-funding-modal financial-checklist-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="checklist-item-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="checklist-item-title">{editingId ? 'Edit task' : 'Add task'}</h3>
                <p className="planned-funding-subtitle">
                  Choose when it repeats. It shows under Coming up until the date, then Needs doing
                  until you tick it.
                </p>
                <div className="financial-checklist-modal-grid">
                  <label>
                    Name
                    <input
                      autoFocus
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
                  <label className="financial-checklist-modal-notes">
                    Notes
                    <input
                      value={draft.notes}
                      onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                      placeholder="Optional"
                    />
                  </label>
                </div>
                <div className="planned-funding-actions">
                  <button type="button" className="btn-ghost btn-tiny" onClick={() => setFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary btn-tiny" onClick={saveDraft}>
                    {editingId ? 'Save' : 'Add task'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {deleteId ? (
        <ConfirmDialog
          title="Delete this task?"
          message="Removes the recurring item and its tick history for this workspace."
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

function TickRow({
  occurrence,
  state,
  editReadOnly,
  onToggle,
  onEdit,
  onDelete,
  showToggle = true,
  emphasis = false,
}: {
  occurrence: ChecklistOccurrence
  state: AppState
  editReadOnly: boolean
  onToggle?: (done: boolean) => void
  onEdit: () => void
  onDelete: () => void
  showToggle?: boolean
  emphasis?: boolean
}) {
  const overdue = occurrence.status === 'overdue'
  return (
    <li
      className={[
        'financial-checklist-tickrow',
        emphasis ? 'is-emphasis' : '',
        overdue ? 'is-overdue' : '',
        occurrence.status === 'due' ? 'is-due' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showToggle && onToggle && !editReadOnly ? (
        <label className="financial-checklist-check">
          <input
            type="checkbox"
            checked={occurrence.done}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="sr-only">Mark {occurrence.item.name} done</span>
        </label>
      ) : (
        <span className="financial-checklist-check-spacer" aria-hidden />
      )}
      <div className="financial-checklist-tickrow-copy">
        <strong>{occurrence.item.name}</strong>
        <span className="muted">
          {overdue ? `Outstanding since ${formatShortDate(occurrence.dueDate)}` : formatShortDate(occurrence.dueDate)}
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
