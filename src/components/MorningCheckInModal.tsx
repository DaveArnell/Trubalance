import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { AppState, ViewScope } from '../types'
import type { BreakdownColumn } from '../utils/breakdownTable'
import { formatCurrency } from '../utils/format'
import {
  clearPendingDueNotifyPeriods,
  getMorningReserveHint,
  getNewlyDueItemsToday,
  isStartOfMonth,
  markMorningCheckInDone,
  morningGreeting,
  setPendingDueNotifyPeriods,
  dueNotifyKey,
  wasMorningCheckInDoneToday,
} from '../utils/morningCheckIn'
import { BreakdownTable } from './BreakdownTable'

interface MorningCheckInModalProps {
  state: AppState
  viewScope: ViewScope
  breakdownColumns: BreakdownColumn[]
  onBalanceSave?: (changes: BalanceSaveChange[]) => BalanceSaveResult
  onMarkCommitmentPaid?: (id: string) => void
  onOpenDue?: () => void
  onOpenReserve?: () => void
  onCheckInClosed?: () => void
  enabled?: boolean
}

/**
 * Once-per-day check-in: update bank balances, see newly due items, month-start reserve tip.
 */
export function MorningCheckInModal({
  state,
  viewScope,
  breakdownColumns,
  onBalanceSave,
  onMarkCommitmentPaid,
  onOpenDue,
  onOpenReserve,
  onCheckInClosed,
  enabled = true,
}: MorningCheckInModalProps) {
  const [open, setOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [paidIds, setPaidIds] = useState<string[]>([])

  const newlyDue = useMemo(() => getNewlyDueItemsToday(state, viewScope), [state, viewScope])
  const visibleDue = newlyDue.filter((item) => !paidIds.includes(item.commitmentId))
  const reserveHint = useMemo(() => getMorningReserveHint(state, viewScope), [state, viewScope])
  const showMonthTip = isStartOfMonth() || Boolean(reserveHint)

  useEffect(() => {
    if (!enabled) return
    if (wasMorningCheckInDoneToday()) return
    const timer = window.setTimeout(() => setOpen(true), 600)
    return () => window.clearTimeout(timer)
  }, [enabled])

  const close = (preferDueNotify: boolean) => {
    markMorningCheckInDone()
    if (visibleDue.length > 0 && preferDueNotify) {
      setPendingDueNotifyPeriods(visibleDue.map(dueNotifyKey))
    } else if (!preferDueNotify) {
      clearPendingDueNotifyPeriods()
    }
    setOpen(false)
    onCheckInClosed?.()
  }

  const handleSave = (changes: BalanceSaveChange[]) => {
    if (!onBalanceSave) return
    const result = onBalanceSave(changes)
    if (result.updated > 0) {
      setSaveMessage(`Saved ${result.updated} account${result.updated === 1 ? '' : 's'}.`)
      window.setTimeout(() => setSaveMessage(''), 2500)
    }
  }

  const handleMarkPaid = (id: string) => {
    onMarkCommitmentPaid?.(id)
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
            Update bank balances, then note anything that moved into Due today.
          </p>
        </header>

        <div className="morning-checkin-grid">
          <section className="morning-checkin-panel">
            <div className="morning-checkin-panel-head">
              <h3>Bank balances</h3>
              <p>Current and savings only — click a cell to edit.</p>
            </div>
            {breakdownColumns.length > 0 ? (
              <div className="morning-checkin-balances">
                <BreakdownTable
                  state={state}
                  columns={breakdownColumns}
                  compact
                  balancesOnly
                  onBalanceSave={handleSave}
                />
                {saveMessage ? <p className="overview-accounts-save-msg">{saveMessage}</p> : null}
              </div>
            ) : (
              <p className="muted">Add accounts in Settings to update balances here.</p>
            )}
          </section>

          <aside className="morning-checkin-aside">
            {visibleDue.length > 0 ? (
              <section className="morning-checkin-panel morning-checkin-panel--due">
                <div className="morning-checkin-panel-head">
                  <h3>New in Due today</h3>
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
                        <button
                          type="button"
                          className="btn-secondary btn-tiny"
                          onClick={() => handleMarkPaid(item.commitmentId)}
                        >
                          Mark paid
                        </button>
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
                  <h3>Due today</h3>
                  <p>Nothing new moved into Due this morning.</p>
                </div>
              </section>
            )}

            {showMonthTip && reserveHint ? (
              <section className="morning-checkin-panel morning-checkin-panel--reserve">
                <div className="morning-checkin-panel-head">
                  <h3>{isStartOfMonth() ? 'New month — reserve' : 'Reserve tip'}</h3>
                </div>
                <p className="morning-checkin-reserve-copy">
                  <strong>{reserveHint.plannerName}</strong>
                  <span>{reserveHint.message}</span>
                </p>
                {onOpenReserve ? (
                  <button type="button" className="btn-ghost btn-tiny" onClick={onOpenReserve}>
                    Open Reserve Planner
                  </button>
                ) : null}
              </section>
            ) : null}
          </aside>
        </div>

        <footer className="morning-checkin-foot">
          <button type="button" className="btn-primary" onClick={() => close(visibleDue.length > 0)}>
            Done for today
          </button>
          {visibleDue.length > 0 ? (
            <button type="button" className="btn-ghost" onClick={() => close(true)}>
              Remind me about Due later
            </button>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => close(false)}>
              Close
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}
