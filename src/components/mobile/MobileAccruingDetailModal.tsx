import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, CommitmentAccruingRow } from '../../types'
import {
  getAccrualProgress,
  getAccruingRowDailyRate,
} from '../../utils/commitmentCalculations'
import { getScopeItemLabel } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import { ordinalDay } from '../committed/shared'

interface MobileAccruingDetailModalProps {
  state: AppState
  row: CommitmentAccruingRow
  accentColor: string
  onClose: () => void
}

export function MobileAccruingDetailModal({
  state,
  row,
  accentColor,
  onClose,
}: MobileAccruingDetailModalProps) {
  const { commitment } = row
  const progress = getAccrualProgress(commitment)?.progress ?? 0
  const scope = getScopeItemLabel(state, commitment.scopeLevel, commitment.scopeId)
  const dueDay =
    commitment.dueDayOfMonth != null ? ordinalDay(commitment.dueDayOfMonth) : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="snapshot-correction-backdrop" onClick={onClose}>
      <div
        className="snapshot-correction-modal mobile-accruing-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-accruing-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="mobile-accruing-detail-title">{commitment.name}</h3>
        <p className="snapshot-correction-subtitle">{scope}</p>

        <div
          className="mobile-accruing-detail-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Accrual progress through cycle"
        >
          <div
            className="mobile-accruing-detail-progress-fill"
            style={{ width: `${Math.round(progress * 100)}%`, background: accentColor }}
          />
        </div>
        <p className="muted mobile-accruing-detail-progress-label">
          {Math.round(progress * 100)}% through this month’s cycle
        </p>

        <dl className="snapshot-correction-facts">
          <div>
            <dt>Accrued so far</dt>
            <dd>{formatCurrency(row.accruedAmount)}</dd>
          </div>
          <div>
            <dt>Monthly amount</dt>
            <dd>{formatCurrency(commitment.amount)}</dd>
          </div>
          {dueDay ? (
            <div>
              <dt>Due</dt>
              <dd>{dueDay} each month</dd>
            </div>
          ) : null}
          <div>
            <dt>Daily rate</dt>
            <dd>{formatCurrency(getAccruingRowDailyRate(row))}/day</dd>
          </div>
        </dl>

        <div className="planned-funding-actions">
          <button type="button" className="btn-primary btn-tiny" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
