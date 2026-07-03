import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState, ViewScope } from '../types'
import type { AppActions } from '../hooks/useAppState'
import {
  BUSINESS_HUB_HELP,
  DIARY_CATEGORY_LABELS,
  DIARY_REMINDER_TEMPLATES,
} from '../content/businessHub'
import { HelpButton } from './HelpButton'
import { FeatureGate } from './FeatureGate'
import {
  businessName,
  countActiveDiaryReminders,
  dateKey,
  filterRemindersForScope,
  formatDiaryRelative,
  partitionDiaryReminders,
  resolvePrimaryBusinessId,
} from '../utils/businessHub'
import { getBusinessIdsForScope } from '../utils/scope'

interface BusinessDiaryPanelProps {
  state: AppState
  viewScope: ViewScope
  actions: Pick<
    AppActions,
    'addDiaryReminder' | 'updateDiaryReminder' | 'dismissDiaryReminder' | 'addDiaryReminderFromTemplate'
  >
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
}

function DiaryIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="diary-icon-btn diary-icon-btn--ghost"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

export function BusinessDiaryPanel({
  state,
  viewScope,
  actions,
  openHelp,
  setOpenHelp,
}: BusinessDiaryPanelProps) {
  const today = useMemo(() => new Date(), [])
  const todayKey = dateKey(today)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState(todayKey)
  const [newTitle, setNewTitle] = useState('')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const highlightTimerRef = useRef<number | null>(null)
  const templatesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!templatesOpen) return
    const close = (e: MouseEvent) => {
      if (templatesRef.current?.contains(e.target as Node)) return
      setTemplatesOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [templatesOpen])

  const businessIds = useMemo(() => getBusinessIdsForScope(state, viewScope), [state, viewScope])
  const activeBusinessId = resolvePrimaryBusinessId(state, viewScope)
  const reminders = useMemo(() => filterRemindersForScope(state, viewScope), [state, viewScope])
  const savedCount = countActiveDiaryReminders(state)
  const { overdue, upcoming, todayKey: partitionToday } = useMemo(
    () => partitionDiaryReminders(reminders, today),
    [reminders, today],
  )

  const addFromTemplate = (templateId: string) => {
    if (!activeBusinessId) return
    const id = actions.addDiaryReminderFromTemplate(activeBusinessId, templateId)
    if (!id) return
    setTemplatesOpen(false)
    setHighlightId(id)
    if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = window.setTimeout(() => setHighlightId(null), 2400)
  }

  const addCustomReminder = () => {
    if (!activeBusinessId || !newTitle.trim()) return
    actions.addDiaryReminder({
      businessId: activeBusinessId,
      title: newTitle.trim(),
      date: newDate,
      category: 'general',
      notes: '',
      recurring: 'none',
    })
    setNewTitle('')
    setNewDate(todayKey)
  }

  const renderReminderList = (items: typeof reminders, overdueSection = false) => (
    <ul className="diary-items">
      {items.map((reminder) => (
        <DiaryReminderItem
          key={reminder.id}
          reminder={reminder}
          highlighted={highlightId === reminder.id}
          businessLabel={businessName(state, reminder.businessId)}
          showBusiness={businessIds.length > 1}
          todayKey={partitionToday}
          overdue={overdueSection}
          menuOpen={menuId === reminder.id}
          onOpenMenu={() => setMenuId(reminder.id)}
          onCloseMenu={() => setMenuId(null)}
          onUpdate={actions.updateDiaryReminder}
          onDismiss={actions.dismissDiaryReminder}
        />
      ))}
    </ul>
  )

  return (
    <section className="card widget-compact card-scroll business-hub-panel" data-tour="business-diary-panel">
      <header className="hub-panel-head">
        <div className="hub-panel-head-copy">
          <p className="hub-panel-eyebrow">Business hub</p>
          <h2 className="hub-panel-title">Diary</h2>
        </div>
        <HelpButton
          id="business-diary"
          openHelp={openHelp}
          setOpenHelp={setOpenHelp}
          text={BUSINESS_HUB_HELP.diary}
        />
      </header>

      <div className="card-scroll-body">
        <FeatureGate
          feature="businessDiary"
          headline="Your business diary"
          body="Track pension re-enrolment, annual returns, tax dates, and anything else. Included on the Business plan — try it free during your trial."
          savedCount={savedCount}
          savedLabel="active reminders"
        >
          {activeBusinessId && (
            <div className="diary-toolbar" data-tour="diary-add">
              <input
                type="date"
                className="diary-field diary-field--date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                aria-label="Reminder date"
              />
              <input
                type="text"
                className="diary-field diary-field--grow"
                value={newTitle}
                placeholder="Add a reminder…"
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustomReminder()
                }}
              />
              <button type="button" className="diary-btn diary-btn--primary" onClick={addCustomReminder}>
                Add
              </button>
              <div className="diary-templates" ref={templatesRef}>
                <button
                  type="button"
                  className="diary-btn diary-btn--ghost"
                  onClick={() => setTemplatesOpen((open) => !open)}
                  aria-expanded={templatesOpen}
                >
                  Templates
                </button>
                {templatesOpen && (
                  <div className="diary-templates-menu" role="menu">
                    {DIARY_REMINDER_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        role="menuitem"
                        onClick={() => addFromTemplate(template.id)}
                      >
                        {template.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {overdue.length > 0 && (
            <div className="diary-section diary-section--overdue" data-tour="diary-overdue">
              <p className="diary-section-label">Overdue</p>
              {renderReminderList(overdue, true)}
            </div>
          )}

          <div className="diary-section" data-tour="diary-list">
            <p className="diary-section-label">Coming up</p>
            {upcoming.length === 0 ? (
              <p className="diary-empty">Nothing scheduled ahead.</p>
            ) : (
              renderReminderList(upcoming)
            )}
          </div>
        </FeatureGate>
      </div>
    </section>
  )
}

function DiaryReminderItem({
  reminder,
  businessLabel,
  showBusiness,
  todayKey,
  highlighted = false,
  overdue = false,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  onUpdate,
  onDismiss,
}: {
  reminder: AppState['diaryReminders'][number]
  businessLabel: string
  showBusiness: boolean
  todayKey: string
  highlighted?: boolean
  overdue?: boolean
  menuOpen: boolean
  onOpenMenu: () => void
  onCloseMenu: () => void
  onUpdate: AppActions['updateDiaryReminder']
  onDismiss: AppActions['dismissDiaryReminder']
}) {
  return (
    <li
      className={`diary-item${overdue ? ' diary-item--overdue' : ''}${highlighted ? ' diary-item--highlight' : ''}`}
    >
      <div className="diary-item-date">
        <input
          type="date"
          className="diary-field diary-field--date diary-field--inline-date"
          value={reminder.date}
          onChange={(e) => onUpdate(reminder.id, { date: e.target.value })}
          aria-label="Reminder date"
        />
        <span className="diary-item-date-sub">{formatDiaryRelative(reminder.date, todayKey)}</span>
      </div>
      <div className="diary-item-body">
        <input
          type="text"
          className="diary-field diary-field--title"
          value={reminder.title}
          onChange={(e) => onUpdate(reminder.id, { title: e.target.value })}
          aria-label="Reminder title"
        />
        <span className="diary-item-meta">
          {DIARY_CATEGORY_LABELS[reminder.category] ?? reminder.category}
          {showBusiness && ` · ${businessLabel}`}
        </span>
      </div>
      <div className="diary-item-actions">
        <DiaryIconButton
          label="Clear reminder"
          onClick={() => (menuOpen ? onCloseMenu() : onOpenMenu())}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M2.5 7.5l3 3 6-6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </DiaryIconButton>
        {menuOpen && (
          <div className="diary-item-menu">
            <button
              type="button"
              className="diary-item-menu-btn"
              onClick={() => {
                onDismiss(reminder.id, { type: 'remove' })
                onCloseMenu()
              }}
            >
              Remove
            </button>
            <button
              type="button"
              className="diary-item-menu-btn"
              onClick={() => {
                onDismiss(reminder.id, { type: 'next-year' })
                onCloseMenu()
              }}
            >
              Same time next year
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
