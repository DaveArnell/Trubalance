import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { AppState, ViewScope } from '../types'
import type { BreakdownColumn } from '../utils/breakdownTable'
import { formatCurrency } from '../utils/format'
import {
  getMorningReserveHint,
  getNewlyDueItemsSinceLastCheckIn,
  isStartOfMonth,
  markMorningCheckInDone,
  morningGreeting,
  dueNotifyKey,
  wasMorningCheckInDoneToday,
} from '../utils/morningCheckIn'
import { getOutstandingChecklistOccurrences } from '../utils/financialChecklist'
import { MorningBalancesList } from './MorningBalancesList'
import { MarkPaidConfirmButton } from './committed/MarkPaidConfirmModal'

interface MorningCheckInModalProps {
  state: AppState
  viewScope: ViewScope
  breakdownColumns: BreakdownColumn[]
  onBalanceSave?: (changes: BalanceSaveChange[]) => BalanceSaveResult
  onMarkCommitmentPaid?: (id: string, paidAmount?: number) => void
  onOpenDue?: () => void
  onOpenReserve?: () => void
  onOpenCalendar?: () => void
  onCheckInClosed?: () => void
  enabled?: boolean
}

/**
 * Once-per-day check-in: update bank balances, see items that moved into Due since last visit.
 */
export function MorningCheckInModal({
  state,
  viewScope,
  breakdownColumns,
  onBalanceSave,
  onMarkCommitmentPaid,
  onOpenDue,
  onOpenReserve,
  onOpenCalendar,
  onCheckInClosed,
  enabled = true,
}: MorningCheckInModalProps) {
  const [open, setOpen] = useState(false)
  const [paidIds, setPaidIds] = useState<string[]>([])

  const newlyDue = useMemo(
    () => getNewlyDueItemsSinceLastCheckIn(state, viewScope),
    [state, viewScope],
  )
  const visibleDue = newlyDue.filter((item) => !paidIds.includes(item.commitmentId))
  const reserveHint = useMemo(() => getMorningReserveHint(state, viewScope), [state, viewScope])
  const outstandingChecklist = useMemo(
    () => getOutstandingChecklistOccurrences(state, viewScope).slice(0, 5),
    [state, viewScope],
  )
  const showMonthTip = isStartOfMonth() || Boolean(reserveHint)

  useEffect(() => {
    if (!enabled) return
    if (wasMorningCheckInDoneToday()) return
    const timer = window.setTimeout(() => setOpen(true), 600)
    return () => window.clearTimeout(timer)
  }, [enabled])

  const close = () => {
    markMorningCheckInDone()
    setOpen(false)
    onCheckInClosed?.()
  }

  const handleMarkPaid = (id: string, paidAmount: number) => {
    onMarkCommitmentPaid?.(id, paidAmount)
    setPaidIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  if (!open) return null

  return createPortal(
    <div className="morning-checkin-backdrop" role="presentation">
      <div
        className="morning-checkin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="morning-checkin-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="morning-checkin-head">
          <p className="morning-checkin-kicker">{morningGreeting()}</p>
          <h2 id="morning-checkin-title">Today’s check-in</h2>
          <p className="morning-checkin-lead">
            Confirm today’s bank balances, then note anything that moved into Due since your last
            visit.
          </p>
        </header>

        <div className="morning-checkin-grid">
          <section className="morning-checkin-panel">
            <div className="morning-checkin-panel-head">
              <h3>Bank balances</h3>
              <p>One balance per business or venue — same names as your structure.</p>
            </div>
            {breakdownColumns.length > 0 ? (
              <div className="morning-checkin-balances">
                <MorningBalancesList
                  state={state}
                  columns={breakdownColumns}
                  onBalanceSave={onBalanceSave}
                />
              </div>
            ) : (
              <p className="muted">Add accounts in Settings to update balances here.</p>
            )}
          </section>

          <aside className="morning-checkin-aside">
            {visibleDue.length > 0 ? (
              <section className="morning-checkin-panel morning-checkin-panel--due">
                <div className="morning-checkin-panel-head">
                  <h3>New in Due since last visit</h3>
                  <p>Moved from monthly accruing — mark paid when it leaves the account.</p>
                </div>
                <ul className="morning-checkin-due-list">
                  {visibleDue.map((item) => (
                    <li key={dueNotifyKey(item)} className="morning-checkin-due-item">
                      <span
                        className="morning-checkin-due-swatch"
                        style={{ background: item.accentColor }}
                        aria-hidden
                      />
                      <div className="morning-checkin-due-copy">
                        <strong>{item.name}</strong>
                        <span className="morning-checkin-due-meta">
                          {item.scopeLabel}
                          <span aria-hidden> · </span>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                      {onMarkCommitmentPaid ? (
                        <MarkPaidConfirmButton
                          itemLabel={item.name}
                          expectedTotal={item.amount}
                          buttonLabel="Mark paid"
                          onConfirm={(amount) => handleMarkPaid(item.commitmentId, amount)}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
                {onOpenDue ? (
                  <button type="button" className="btn-ghost btn-tiny" onClick={onOpenDue}>
                    Open Due
                  </button>
                ) : null}
              </section>
            ) : (
              <section className="morning-checkin-panel morning-checkin-panel--quiet">
                <div className="morning-checkin-panel-head">
                  <h3>Due since last visit</h3>
                  <p>Nothing new moved into Due since you were last here.</p>
                </div>
              </section>
            )}

            {showMonthTip && reserveHint ? (
              <section className="morning-checkin-panel morning-checkin-panel--reserve">
                <div className="morning-checkin-panel-head">
                  <h3>{isStartOfMonth() ? 'New month — reserve' : 'Reserve tip'}</h3>
                  <p>{reserveHint.plannerName}</p>
                </div>
                <p className="morning-checkin-reserve-copy">
                  <span>{reserveHint.message}</span>
                </p>
                {onOpenReserve ? (
                  <button type="button" className="btn-ghost btn-tiny" onClick={onOpenReserve}>
                    Open Reserve Planner
                  </button>
                ) : null}
              </section>
            ) : null}

            {outstandingChecklist.length > 0 ? (
              <section className="morning-checkin-panel morning-checkin-panel--checklist">
                <div className="morning-checkin-panel-head">
                  <h3>Checklist outstanding</h3>
                  <p>Money-admin items waiting to be ticked.</p>
                </div>
                <ul className="morning-checkin-due-list">
                  {outstandingChecklist.map((occurrence) => (
                    <li
                      key={`${occurrence.item.id}-${occurrence.periodKey}`}
                      className="morning-checkin-due-item"
                    >
                      <div className="morning-checkin-due-copy">
                        <strong>{occurrence.item.name}</strong>
                        <span className="morning-checkin-due-meta">
                          {occurrence.status === 'due' ? 'Due today' : 'Outstanding'} ·{' '}
                          {occurrence.dueDate.slice(8, 10)}/
                          {occurrence.dueDate.slice(5, 7)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                {onOpenCalendar ? (
                  <button type="button" className="btn-ghost btn-tiny" onClick={onOpenCalendar}>
                    Open Calendar
                  </button>
                ) : null}
              </section>
            ) : null}
          </aside>
        </div>

        <footer className="morning-checkin-foot">
          <button type="button" className="btn-primary" onClick={close}>
            Done for today
          </button>
          <button type="button" className="btn-ghost" onClick={close}>
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
