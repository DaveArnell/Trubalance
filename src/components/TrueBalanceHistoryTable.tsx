import { useEffect, useMemo, useRef, useState } from 'react'

import type { AppState, GraphRange, HistoryGranularity, ViewScope } from '../types'
import type { RevealFromContext } from '../utils/dataRevealFrom'
import { getScopeItemLabel } from '../utils/scope'
import { buildHistoryTable, formatHistoryDate, formatHistoryPeriod } from '../utils/historyTable'

import { tablePreferenceClasses } from '../utils/tablePreferences'

import { formatCurrency } from '../utils/format'

import { HelpButton } from './HelpButton'
import { DayNoteEditor } from './DayNoteEditor'
import { getDayNoteText } from '../utils/dayNotes'
import { getSnapshotIdsForDateInScope } from '../utils/snapshots'
import { useDemoMode } from '../contexts/DemoModeContext'

import type { AppActions } from '../hooks/useAppState'

import { useTablePreferences } from '../contexts/TablePreferencesContext'

import {
  SnapshotCorrectionModal,
  type SnapshotCorrectionDraft,
} from './SnapshotCorrectionModal'

const granularities: { key: HistoryGranularity; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

function localTodayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface TrueBalanceHistoryTableProps {
  state: AppState
  viewScope: ViewScope
  graphRange: GraphRange
  fromDate?: string | null
  onFromDateChange?: (date: string | null) => void
  revealFromContext?: RevealFromContext
  historyGranularity?: HistoryGranularity
  onHistoryGranularityChange?: (granularity: HistoryGranularity) => void
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
  embedded?: boolean
  correctSnapshotMetric?: AppActions['correctSnapshotMetric']
  onDeleteSnapshots?: AppActions['deleteSnapshots']
  onSetDayNote?: (date: string, text: string | null, scope: ViewScope) => void
}

const ranges: { key: GraphRange; label: string }[] = [
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '12m', label: '12 months' },
  { key: 'all', label: 'All' },
]

export function TrueBalanceHistoryTable({
  state,
  viewScope,
  graphRange,
  fromDate = null,
  onFromDateChange,
  revealFromContext,
  historyGranularity = 'daily',
  onHistoryGranularityChange,
  openHelp,
  setOpenHelp,
  embedded = false,
  correctSnapshotMetric,
  onDeleteSnapshots,
  onSetDayNote,
}: TrueBalanceHistoryTableProps) {
  const demoMode = useDemoMode()
  const [correction, setCorrection] = useState<SnapshotCorrectionDraft | null>(null)
  const [noteEditorDate, setNoteEditorDate] = useState<string | null>(null)
  const granularity = historyGranularity
  const [canScrollMore, setCanScrollMore] = useState(false)
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const { preferences: tablePreferences } = useTablePreferences('trends-history')
  const tablePrefClasses = tablePreferenceClasses(tablePreferences, 'trends-history')

  const { columns, rows } = useMemo(
    () => buildHistoryTable(state, viewScope, graphRange, 'trueBalance', granularity, fromDate),
    [state, viewScope, graphRange, granularity, fromDate],
  )

  useEffect(() => {
    const el = tableWrapRef.current
    if (!el) return

    const update = () => {
      const remaining = el.scrollWidth - el.clientWidth - el.scrollLeft
      setCanScrollMore(remaining > 4)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(el)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      ro?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [columns.length, rows.length, granularity, tablePrefClasses])

  const setHistoryGranularity = (next: HistoryGranularity) => {
    onHistoryGranularityChange?.(next)
  }

  const scopeLabel = getScopeItemLabel(state, viewScope.type, viewScope.id)
  const ownFromDate =
    revealFromContext?.hasOwnOverride && fromDate ? fromDate : null

  const revealFromBar =
    onFromDateChange && !demoMode ? (
      <div className="history-reveal-from-bar">
        <label className="history-reveal-from-field">
          <span className="history-reveal-from-label">Only show data from</span>
          <div className="history-reveal-from-input trends-from-date">
            <input
              type="date"
              value={ownFromDate ?? fromDate ?? ''}
              max={localTodayKey()}
              onChange={(e) => onFromDateChange(e.target.value || null)}
              aria-label={`Only show data from this date for ${scopeLabel}`}
              title="Hide balance history before this date — set here for a fresh start"
            />
            {(ownFromDate ?? fromDate) && (
              <button
                type="button"
                className="trends-from-date-clear"
                onClick={() => onFromDateChange(null)}
                title="Clear start date for this scope"
                aria-label="Clear start date"
              >
                ×
              </button>
            )}
          </div>
        </label>
        {revealFromContext?.source === 'inherited' && revealFromContext.inheritedFromLabel ? (
          <p className="history-reveal-from-hint muted">
            Using cutoff from {revealFromContext.inheritedFromLabel}. Set a date here to override for{' '}
            {scopeLabel} only.
          </p>
        ) : revealFromContext?.hasOwnOverride ? (
          <p className="history-reveal-from-hint muted">
            Applies to {scopeLabel} and below unless a site sets its own date.
          </p>
        ) : null}
      </div>
    ) : null

  const openCorrection = (
    snapshotId: string,
    date: string,
    columnLabel: string,
    value: number,
    recordedValue: number | null,
  ) => {
    if (!correctSnapshotMetric) return
    setCorrection({
      snapshotId,
      date,
      columnLabel,
      recordedValue: recordedValue ?? value,
      currentValue: value,
    })
  }

  const deleteRow = (row: (typeof rows)[number]) => {
    if (!onDeleteSnapshots || granularity !== 'daily') return
    const snapshotIds = getSnapshotIdsForDateInScope(state, row.date, viewScope)
    if (snapshotIds.length === 0) return
    const label = formatHistoryPeriod(row.date, granularity)
    if (
      !window.confirm(
        snapshotIds.length === 1
          ? `Remove the balance log entry for ${label}? This removes the group, business, and site entries for that day.`
          : `Remove ${snapshotIds.length} balance log entries for ${label}? This removes the group, business, and site entries for that day.`,
      )
    ) {
      return
    }
    onDeleteSnapshots(snapshotIds)
  }

  const granularityControls = (
    <div className="history-granularity-toggles" role="group" aria-label="History grouping">
      {granularities.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`btn-ghost btn-tiny${granularity === option.key ? ' active' : ''}`}
          aria-pressed={granularity === option.key}
          onClick={() => setHistoryGranularity(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  const tableBody = (
    <>
      {revealFromBar}
      {rows.length === 0 ? (
        <p className="muted">
          No chart data yet. Each time you save bank balances in the overview, a point is added to the chart and
          listed here.
        </p>
      ) : (
        <div
          className={`history-table-scroll${canScrollMore ? ' history-table-scroll--hint' : ''}`}
        >
          <div
            ref={tableWrapRef}
            className={`history-table-wrap table-pref-surface ${tablePrefClasses}`}
          >
            <table
              className={`sheet-table history-table sheet-table-dense table-pref-table ${tablePrefClasses}`}
            >
            <thead>
              <tr>
                <th className="history-date-col">Date</th>
                {granularity === 'daily' && onSetDayNote ? (
                  <th className="history-note-col">Note</th>
                ) : null}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={
                      col.isTotal
                        ? 'history-total-col'
                        : col.isShared
                          ? 'history-shared-col'
                          : 'history-value-col'
                    }
                    title={col.label}
                  >
                    <span className="history-col-head">
                      <span className="history-col-swatch" style={{ background: col.color }} />
                      {col.label}
                    </span>
                  </th>
                ))}
                {onDeleteSnapshots && granularity === 'daily' ? (
                  <th className="history-actions-col" aria-label="Actions" />
                ) : null}
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((row) => {
                const dayNote = granularity === 'daily' ? getDayNoteText(state, row.date, viewScope) : null
                return (
                <tr key={row.date}>
                  <td className="history-date-col">
                    <span className="history-date-label">{formatHistoryPeriod(row.date, granularity)}</span>
                  </td>
                  {granularity === 'daily' && onSetDayNote ? (
                    <td
                      className={`history-note-col${dayNote ? ' history-note-col--filled' : ''} history-note-col--editable`}
                      title={dayNote ?? 'Click to add or edit a day note'}
                      onClick={() => setNoteEditorDate(row.date)}
                    >
                      {dayNote ? (
                        <span className="history-note-text">{dayNote}</span>
                      ) : (
                        <span className="history-note-placeholder muted">Add note…</span>
                      )}
                    </td>
                  ) : null}
                  {columns.map((col) => {
                    const cell = row.values[col.key]
                    const editable =
                      granularity === 'daily' &&
                      Boolean(correctSnapshotMetric && cell.snapshotId && cell.value != null)
                    const corrected = cell.recordedValue != null
                    const title = corrected
                      ? `Originally recorded: ${formatCurrency(cell.recordedValue!)}. Click to edit.`
                      : editable
                        ? 'Click to correct this value'
                        : undefined

                    return (
                      <td
                        key={col.key}
                        className={[
                          'sheet-num',
                          col.isTotal
                            ? 'history-total-col'
                            : col.isShared
                              ? 'history-shared-col'
                              : 'history-value-col',
                          editable ? 'history-cell-editable' : '',
                          corrected ? 'history-cell-corrected' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        title={title}
                        onClick={
                          editable
                            ? () =>
                                openCorrection(
                                  cell.snapshotId!,
                                  row.date,
                                  col.label,
                                  cell.value!,
                                  cell.recordedValue,
                                )
                            : undefined
                        }
                      >
                        {cell.value == null ? '—' : formatCurrency(cell.value)}
                      </td>
                    )
                  })}
                  {onDeleteSnapshots && granularity === 'daily' ? (
                    <td className="history-actions-col">
                      <button
                        type="button"
                        className="history-row-delete"
                        onClick={() => deleteRow(row)}
                        aria-label={`Delete entry for ${formatHistoryPeriod(row.date, granularity)}`}
                        title="Delete this entry"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                          <path
                            d="M3 4h8M5.5 4V3h3v1M5.5 6.5v3M8.5 6.5v3M4.5 4l.4 7h4.2l.4-7"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </td>
                  ) : null}
                </tr>
              )})}
            </tbody>
          </table>
          </div>
          {canScrollMore ? (
            <span className="history-table-scroll-cue" aria-hidden>
              ›
            </span>
          ) : null}
        </div>
      )}
      <p className="sheet-edit-hint history-range-note">
        {ranges.find((r) => r.key === graphRange)?.label ?? graphRange} range
        {fromDate ? ` · from ${formatHistoryDate(fromDate)}` : ''}
        {granularity !== 'daily' ? ` · ${granularities.find((g) => g.key === granularity)?.label}` : ''}
        {correctSnapshotMetric && granularity === 'daily' ? ' · Click a value to correct it' : ''}
        {granularity !== 'daily' ? ' · Switch to Daily to edit values' : ''}
        {onSetDayNote && granularity === 'daily' ? ' · Click a date to add a note' : ''}
        {onDeleteSnapshots && granularity === 'daily' ? ' · Delete removes saved points for that day' : ''}
      </p>
      {correction && correctSnapshotMetric ? (
        <SnapshotCorrectionModal
          draft={correction}
          onConfirm={(newValue) => {
            correctSnapshotMetric(correction.snapshotId, 'trueBalance', newValue)
            setCorrection(null)
          }}
          onCancel={() => setCorrection(null)}
        />
      ) : null}
      {noteEditorDate && onSetDayNote && (
        <DayNoteEditor
          date={noteEditorDate}
          scopeLabel={getScopeItemLabel(state, viewScope.type, viewScope.id)}
          initialText={getDayNoteText(state, noteEditorDate, viewScope) ?? ''}
          onSave={(text) => onSetDayNote(noteEditorDate, text, viewScope)}
          onClose={() => setNoteEditorDate(null)}
        />
      )}
    </>
  )

  if (embedded) {
    return (
      <div id="balance-history" className="trends-history-panel">
        <div className="trends-history-head">
          <div>
            <h3>Balance log</h3>
            <p className="muted trends-history-lead">
              Same data points as the chart. Use Daily, Weekly, or Monthly to match the graph grouping.
            </p>
          </div>
          <div className="trends-history-head-actions">
            {granularityControls}
            <HelpButton
              id="history"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
              text="This table lists the same balance totals plotted on the Trends chart. A row appears each time you save account balances in the overview. Use Daily, Weekly, or Monthly to group rows. Click a daily True Balance cell to correct it — the original recorded amount is kept, and the correction carries forward to later dates."
            />
          </div>
        </div>
        {tableBody}
      </div>
    )
  }

  return (
    <section id="balance-history" className="card history-card widget-span-2">
      <div className="card-head card-head-compact">
        <div>
          <h2>True Balance History</h2>
        </div>
        <div className="card-actions">
          {granularityControls}
          <HelpButton
            id="history"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            text="Each row is a date when balances were recorded. Use Daily, Weekly, or Monthly to change how rows are grouped. Click any daily value to correct it — you will be asked to confirm, and the originally recorded amount is always kept for reference. Corrections apply to that date and every later date in the log."
          />
        </div>
      </div>
      {tableBody}
    </section>
  )
}
