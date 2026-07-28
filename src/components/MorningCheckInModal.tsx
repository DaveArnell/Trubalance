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
 * Once-per-day check-in: update balances, see newly due items, month-start reserve tip.
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

  const newlyDue = useMemo(() => getNewlyDueItemsToday(state, viewScope), [state, viewScope])
  const reserveHint = useMemo(() => getMorningReserveHint(state, viewScope), [state, viewScope])
  const showMonthTip = isStartOfMonth() || Boolean(reserveHint)

  useEffect(() => {
    if (!enabled) return
    if (wasMorningCheckInDoneToday()) return
    // Small delay so the dashboard paints first.
    const timer = window.setTimeout(() => setOpen(true), 600)
    return () => window.clearTimeout(timer)
  }, [enabled])

  const close = (preferDueNotify: boolean) => {
    markMorningCheckInDone()
    // Keep a banner if dues moved today and the user didn't clear them here.
    if (newlyDue.length > 0 && preferDueNotify) {
      setPendingDueNotifyPeriods(newlyDue.map(dueNotifyKey))
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
      setSaveMessage(`Updated ${result.updated} account${result.updated === 1 ? '' : 's'}.`)
      window.setTimeout(() => setSaveMessage(''), 2500)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="snapshot-correction-backdrop morning-checkin-backdrop" role="presentation">
      <div
        className="snapshot-correction-modal morning-checkin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="morning-checkin-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="morning-checkin-head">
          <p className="morning-checkin-kicker">{morningGreeting()}</p>
          <h2 id="morning-checkin-title">Let’s update today’s position</h2>
          <p className="muted">
            A quick check-in: refresh bank balances, then glance at anything that needs attention.
          </p>
        </header>

        <section className="morning-checkin-section">
          <h3>Bank balances</h3>
          {breakdownColumns.length > 0 ? (
            <>
              <BreakdownTable
                state={state}
                columns={breakdownColumns}
                compact
                onBalanceSave={handleSave}
              />
              {saveMessage ? <p className="overview-accounts-save-msg">{saveMessage}</p> : null}
            </>
          ) : (
            <p className="muted">Add accounts in Settings to update balances here.</p>
          )}
        </section>

        {newlyDue.length > 0 ? (
          <section className="morning-checkin-section">
            <h3>New in Due today</h3>
            <p className="muted">
              These monthly costs have moved from accruing into Due. Mark paid when the money leaves
              the account.
            </p>
            <ul className="morning-checkin-due-list">
              {newlyDue.map((item) => (
                <li key={dueNotifyKey(item)}>
                  <span>
                    <strong>{item.name}</strong>
                    <span className="muted"> · {formatCurrency(item.amount)}</span>
                  </span>
                  {onMarkCommitmentPaid ? (
                    <button
                      type="button"
                      className="btn-secondary btn-tiny"
                      onClick={() => onMarkCommitmentPaid(item.commitmentId)}
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
        ) : null}

        {showMonthTip && reserveHint ? (
          <section className="morning-checkin-section morning-checkin-section--reserve">
            <h3>{isStartOfMonth() ? 'New month — reserve' : 'Reserve transfer'}</h3>
            <p>
              <strong>{reserveHint.plannerName}:</strong> {reserveHint.message}
            </p>
            {onOpenReserve ? (
              <button type="button" className="btn-ghost btn-tiny" onClick={onOpenReserve}>
                Open Reserve Planner
              </button>
            ) : null}
          </section>
        ) : null}

        <footer className="morning-checkin-foot">
          <button type="button" className="btn-primary" onClick={() => close(newlyDue.length > 0)}>
            Done for today
          </button>
          {newlyDue.length > 0 ? (
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
