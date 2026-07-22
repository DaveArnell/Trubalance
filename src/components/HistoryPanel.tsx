import { useEffect, useMemo, useState } from 'react'
import type { AppState, HistoryRecord, ViewScope } from '../types'
import { getHistoryRecordsForScope } from '../utils/historyRebuild'
import { formatCurrency } from '../utils/format'
import { formatSnapshotDateLong } from '../utils/snapshots'
import { getScopeBreadcrumb, getScopeItemLabel } from '../utils/scope'
import type { AppActions } from '../hooks/useAppState'
import { HelpButton } from './HelpButton'

interface HistoryPanelProps {
  state: AppState
  viewScope: ViewScope
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
  onDeleteHistoryRecord?: AppActions['deleteHistoryRecord']
}

function formatSavedAt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatScheduleLabel(schedule: string) {
  if (schedule === 'reserve') return 'Reserve'
  if (schedule === 'monthly') return 'Monthly'
  if (schedule === 'planned') return 'Planned'
  return schedule
}

function statusLabel(status: string) {
  if (status === 'healthy') return 'On track'
  if (status === 'warning') return 'Due soon'
  if (status === 'risk') return 'At risk'
  if (status === 'critical') return 'Overdue'
  return status
}

export function HistoryPanel({
  state,
  viewScope,
  openHelp,
  setOpenHelp,
  onDeleteHistoryRecord,
}: HistoryPanelProps) {
  const scopeLabel = getScopeItemLabel(state, viewScope.type, viewScope.id)
  const records = useMemo(() => getHistoryRecordsForScope(state, viewScope), [state, viewScope])
  const formatHistoryDate = (dateKey: string) => formatSnapshotDateLong(dateKey)
  const scopeBreadcrumb = getScopeBreadcrumb(state, viewScope)
  const showBusinessColumn = viewScope.type === 'group'
  const showVenueColumn = viewScope.type === 'group' || viewScope.type === 'business'
  const showItemScopeColumn = viewScope.type !== 'venue'

  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null)

  useEffect(() => {
    if (!records.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !records.some((r) => r.id === selectedId)) {
      setSelectedId(records[0]!.id)
    }
  }, [records, selectedId])

  const selected = records.find((r) => r.id === selectedId) ?? records[0] ?? null

  return (
    <section className="card history-panel">
      <div className="card-head card-head-compact">
        <div>
          <h2>History</h2>
          <p className="muted history-panel-lead">
            Saved balance days for <strong>{scopeBreadcrumb}</strong>. Switch group, business, or venue
            in the sidebar to see that scope — including days saved from a parent view.
          </p>
        </div>
        <HelpButton
          id="history"
          openHelp={openHelp}
          setOpenHelp={setOpenHelp}
          text="History is created when you save balances in the overview. Each day shows cash, what had built up in monthly costs, what was in Due, and expected receipts — all recalculated as-of that date when underlying data changes."
        />
      </div>

      {records.length === 0 ? (
        <p className="muted history-panel-empty">
          No saved days for {scopeLabel} yet. Update account balances in the overview to
          create history — you can view it here at group, business, or venue level.
        </p>
      ) : (
        <>
          <div className="history-date-picker">
            <label className="history-date-picker-label" htmlFor="history-date-select">
              Choose saved day
            </label>
            <select
              id="history-date-select"
              className="history-date-select"
              value={selected?.id ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {records.map((record) => (
                <option key={record.id} value={record.id}>
                  {formatHistoryDate(record.date)} — Available {formatCurrency(record.summary.trueBalance)}
                </option>
              ))}
            </select>
            <p className="muted history-date-picker-hint">
              {records.length} saved day{records.length === 1 ? '' : 's'} for this view
              {onDeleteHistoryRecord ? ' · Delete removes the day from charts and calculations' : ''}
            </p>
          </div>

          <div className="history-panel-split">
            <aside className="history-panel-list" aria-label="Saved days timeline">
              {records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className={`history-day-btn${selected?.id === record.id ? ' history-day-btn--active' : ''}`}
                  onClick={() => setSelectedId(record.id)}
                >
                  <span className="history-day-date">{formatHistoryDate(record.date)}</span>
                  <span className="history-day-meta">
                    <strong>{formatCurrency(record.summary.trueBalance)}</strong>
                    <span className="muted"> available</span>
                  </span>
                  <span className="history-day-saved muted">{formatSavedAt(record.savedAt)}</span>
                </button>
              ))}
            </aside>

            {selected && (
              <HistoryRecordDetail
                state={state}
                record={selected}
                scopeLabel={scopeLabel}
                formatDateLabel={formatHistoryDate}
                showBusinessColumn={showBusinessColumn}
                showVenueColumn={showVenueColumn}
                showItemScopeColumn={showItemScopeColumn}
                onDelete={
                  onDeleteHistoryRecord
                    ? () => {
                        const label = formatHistoryDate(selected.date)
                        if (
                          !window.confirm(
                            `Delete the saved entry for ${label} from ${scopeLabel}? It will be removed from History, Trends, and the balance log. This cannot be undone.`,
                          )
                        ) {
                          return
                        }
                        onDeleteHistoryRecord(selected.id)
                      }
                    : undefined
                }
              />
            )}
          </div>
        </>
      )}
    </section>
  )
}

function HistoryRecordDetail({
  state,
  record,
  scopeLabel,
  formatDateLabel,
  showBusinessColumn,
  showVenueColumn,
  showItemScopeColumn,
  onDelete,
}: {
  state: AppState
  record: HistoryRecord
  scopeLabel: string
  formatDateLabel: (dateKey: string) => string
  showBusinessColumn: boolean
  showVenueColumn: boolean
  showItemScopeColumn: boolean
  onDelete?: () => void
}) {
  const buildingUp = record.buildingUpItems ?? []
  const urgentDue = record.dueItems.filter((d) => d.status !== 'healthy')

  const accountGroups = useMemo(() => {
    const groups = new Map<
      string,
      { businessName: string; venueName: string | null; accounts: HistoryRecord['accounts'] }
    >()

    for (const account of record.accounts) {
      const businessName = account.businessName ?? 'Unassigned'
      const venueName = account.venueName ?? null
      const key = `${businessName}::${venueName ?? ''}`
      const existing = groups.get(key)
      if (existing) {
        existing.accounts.push(account)
      } else {
        groups.set(key, { businessName, venueName, accounts: [account] })
      }
    }

    return [...groups.values()].sort((a, b) => {
      const businessCmp = a.businessName.localeCompare(b.businessName)
      if (businessCmp !== 0) return businessCmp
      return (a.venueName ?? '').localeCompare(b.venueName ?? '')
    })
  }, [record.accounts])

  return (
    <div className="history-record-detail">
      <header className="history-record-head">
        <div className="history-record-head-text">
          <h3>{formatDateLabel(record.date)}</h3>
          <p className="muted">
            As-of this day · saved {formatSavedAt(record.savedAt)}
            {record.note ? ` · ${record.note}` : ''}
          </p>
        </div>
        {onDelete ? (
          <button type="button" className="btn-danger btn-tiny history-record-delete" onClick={onDelete}>
            Delete this day
          </button>
        ) : null}
      </header>

      <div className="history-record-metrics">
        <div className="history-metric-card history-metric-card--primary">
          <span className="muted">Available</span>
          <strong>{formatCurrency(record.summary.trueBalance)}</strong>
          <span className="history-metric-hint muted">Cash − committed + receipts</span>
        </div>
        <div className="history-metric-card">
          <span className="muted">Cash in accounts</span>
          <strong>{formatCurrency(record.summary.cash)}</strong>
        </div>
        <div className="history-metric-card">
          <span className="muted">Committed funds</span>
          <strong>{formatCurrency(record.summary.committedFunds)}</strong>
          <span className="history-metric-hint muted">Building up + in Due</span>
        </div>
        <div className="history-metric-card">
          <span className="muted">Expected receipts</span>
          <strong>{formatCurrency(record.summary.expectedReceipts)}</strong>
        </div>
      </div>

      <section className="history-record-section">
        <h4>Account balances</h4>
        <p className="muted history-section-lead">
          Cash held on this day{showBusinessColumn ? ', grouped by business and venue' : ''}.
        </p>
        {record.accounts.length === 0 ? (
          <p className="muted">No accounts in this scope.</p>
        ) : (
          accountGroups.map((group) => (
            <div key={`${group.businessName}-${group.venueName ?? 'biz'}`} className="history-account-group">
              {(showBusinessColumn || showVenueColumn) && (
                <p className="history-account-group-title">
                  {showBusinessColumn && <span>{group.businessName}</span>}
                  {showBusinessColumn && showVenueColumn && group.venueName ? (
                    <span className="muted"> · </span>
                  ) : null}
                  {showVenueColumn && group.venueName ? (
                    <span className="muted">{group.venueName}</span>
                  ) : showBusinessColumn && !group.venueName ? (
                    <span className="muted"> · Business savings</span>
                  ) : null}
                </p>
              )}
              <div className="history-table-wrap">
                <table className="history-table history-table--accounts">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Balance on this day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.accounts.map((account) => (
                      <tr key={account.id}>
                        <td>{account.name}</td>
                        <td className="muted">{account.type === 'current' ? 'Current' : 'Savings'}</td>
                        <td>{formatCurrency(account.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="history-record-section history-record-section--highlight">
        <h4>Building up on this day ({buildingUp.length})</h4>
        <p className="muted history-section-lead">
          How much each monthly cost and reserve pot had accrued by the end of this day — not the full
          monthly budget unless the due date had passed.
        </p>
        {buildingUp.length === 0 ? (
          <p className="muted">Nothing was accruing in this scope at this point.</p>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Cost</th>
                  {showItemScopeColumn ? <th>Scope</th> : null}
                  <th>Type</th>
                  <th>Built up to</th>
                  <th>Monthly budget</th>
                </tr>
              </thead>
              <tbody>
                {buildingUp.map((item) => (
                  <tr key={item.rowId}>
                    <td>{item.name}</td>
                    {showItemScopeColumn ? (
                      <td className="muted">
                        {getScopeItemLabel(state, item.scopeLevel, item.scopeId)}
                      </td>
                    ) : null}
                    <td className="muted">{formatScheduleLabel(item.schedule)}</td>
                    <td>
                      <strong>{formatCurrency(item.accruedAmount)}</strong>
                    </td>
                    <td className="muted">{formatCurrency(item.budgetAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="history-record-section">
        <h4>In Due on this day ({record.dueItems.length})</h4>
        <p className="muted history-section-lead">
          Items that were in the Due list on this date, with the amount owed then.
        </p>
        {record.dueItems.length === 0 ? (
          <p className="muted">Nothing was in Due at this point.</p>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Item</th>
                  {showItemScopeColumn ? <th>Scope</th> : null}
                  <th>Period</th>
                  <th>Status</th>
                  <th>Amount due</th>
                </tr>
              </thead>
              <tbody>
                {record.dueItems.map((item) => (
                  <tr
                    key={item.rowId}
                    className={item.status !== 'healthy' ? `history-due--${item.status}` : ''}
                  >
                    <td>{item.name}</td>
                    {showItemScopeColumn ? (
                      <td className="muted">
                        {item.source === 'reserve'
                          ? 'Reserve'
                          : getScopeItemLabel(state, item.scopeLevel, item.scopeId)}
                      </td>
                    ) : null}
                    <td className="muted">{item.period}</td>
                    <td>{statusLabel(item.status)}</td>
                    <td>
                      <strong>{formatCurrency(item.amount)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {urgentDue.length > 0 && (
          <p className="muted history-record-hint">
            {urgentDue.length} item{urgentDue.length === 1 ? '' : 's'} needed attention on this day.
          </p>
        )}
      </section>

      <section className="history-record-section">
        <h4>Expected receipts ({record.expectedReceipts.length})</h4>
        {record.expectedReceipts.length === 0 ? (
          <p className="muted">None in scope at this point.</p>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Name</th>
                  {showItemScopeColumn ? <th>Scope</th> : null}
                  <th>Received?</th>
                  <th>Amount on this day</th>
                </tr>
              </thead>
              <tbody>
                {record.expectedReceipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td>{receipt.name}</td>
                    {showItemScopeColumn ? (
                      <td className="muted">
                        {getScopeItemLabel(state, receipt.scopeLevel, receipt.scopeId)}
                      </td>
                    ) : null}
                    <td>{receipt.received ? 'Yes' : 'No'}</td>
                    <td>{formatCurrency(receipt.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {record.reservePlanners.length > 0 && (
        <section className="history-record-section">
          <h4>Reserve planners</h4>
          <ul className="history-reserve-list">
            {record.reservePlanners.map((planner) => {
              const business = state.businesses.find((b) => b.id === planner.businessId)
              return (
                <li key={planner.id}>
                  <strong>{planner.name}</strong>
                  {showBusinessColumn && business ? (
                    <span className="muted"> · {business.name}</span>
                  ) : null}
                  <span className="muted">
                    {' '}
                    · balance {formatCurrency(planner.actualBalance)} · buffer{' '}
                    {formatCurrency(planner.bufferAmount)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <p className="muted history-record-scope-note">
        Showing {scopeLabel} as-of {formatDateLabel(record.date)}.
      </p>
    </div>
  )
}
