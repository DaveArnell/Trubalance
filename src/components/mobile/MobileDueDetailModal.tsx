import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, CommitmentDueRow } from '../../types'
import {
  formatDueRowTiming,
  formatRolledDueTooltip,
  getCommitmentPayoffExpectedTotal,
  isReserveTransferDueRow,
} from '../../utils/commitmentCalculations'
import { getCardScopeMetaLabel } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import { AmountConfirmModal } from '../committed/AmountConfirmModal'

interface MobileDueDetailModalProps {
  state: AppState
  row: CommitmentDueRow
  accentColor?: string
  onClose: () => void
  onMarkPaid: (amount: number) => void
  onDuplicate?: () => void
  onDelete?: () => void
  onOpenReservePlanner?: () => void
}

export function MobileDueDetailModal({
  state,
  row,
  accentColor,
  onClose,
  onMarkPaid,
  onDuplicate,
  onDelete,
  onOpenReservePlanner,
}: MobileDueDetailModalProps) {
  const editReadOnly = useEditReadOnly()
  const [payOpen, setPayOpen] = useState(false)
  const item = row.commitment
  const isReserve = row.source === 'reserve'
  const isReserveTransfer = isReserveTransferDueRow(row)
  const isReserveBill = isReserve && !isReserveTransfer
  const isPlanned = item.schedule === 'planned'
  const expectedTotal = isPlanned || isReserveBill
    ? row.amount
    : getCommitmentPayoffExpectedTotal(item)
  const scopeLabel = isReserveTransfer
    ? 'Reserve transfer'
    : getCardScopeMetaLabel(state, item.scopeLevel, item.scopeId)
  const timing = formatDueRowTiming(row)
  const rolled = formatRolledDueTooltip(row)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !payOpen) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, payOpen])

  return createPortal(
    <>
      <div className="snapshot-correction-backdrop" onClick={onClose}>
        <div
          className="snapshot-correction-modal mobile-item-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-due-detail-title"
          onClick={(e) => e.stopPropagation()}
          style={accentColor ? { borderTop: `4px solid ${accentColor}` } : undefined}
        >
          <h3 id="mobile-due-detail-title">{item.name}</h3>
          {scopeLabel ? <p className="snapshot-correction-subtitle">{scopeLabel}</p> : null}

          <dl className="snapshot-correction-facts">
            <div>
              <dt>Amount due</dt>
              <dd>{formatCurrency(row.amount)}</dd>
            </div>
            {timing ? (
              <div>
                <dt>When</dt>
                <dd>{timing}</dd>
              </div>
            ) : null}
            {rolled ? (
              <div>
                <dt>Rolled</dt>
                <dd>{rolled}</dd>
              </div>
            ) : null}
          </dl>

          {!editReadOnly ? (
            <div className="mobile-item-modal-actions mobile-item-modal-actions--stack">
              {isReserveTransfer && onOpenReservePlanner ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    onOpenReservePlanner()
                    onClose()
                  }}
                >
                  Open planner
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={() => setPayOpen(true)}>
                  Mark paid…
                </button>
              )}
              <div className="mobile-item-modal-actions-row">
                {onDuplicate && !isReserveTransfer ? (
                  <button
                    type="button"
                    className="btn-ghost btn-tiny"
                    onClick={() => {
                      onDuplicate()
                      onClose()
                    }}
                  >
                    Duplicate
                  </button>
                ) : null}
                {onDelete && !isReserveTransfer && !isReserveBill ? (
                  <button
                    type="button"
                    className="btn-danger btn-tiny"
                    onClick={() => {
                      if (window.confirm(`Remove “${item.name}” from Due?`)) {
                        onDelete()
                        onClose()
                      }
                    }}
                  >
                    Delete
                  </button>
                ) : null}
                <button type="button" className="btn-ghost btn-tiny" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="mobile-item-modal-actions-primary">
              <button type="button" className="btn-ghost btn-tiny" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {payOpen ? (
        <AmountConfirmModal
          title="Confirm payment"
          itemLabel={item.name}
          expectedTotal={expectedTotal}
          expectedLabel="Amount due"
          amountLabel="Amount paid"
          confirmSameLabel="Yes, mark paid"
          confirmDiffLabel="Pay and correct history"
          noteSame="Confirming the due amount will mark it paid without changing past history."
          noteDiff="A different amount will correct history from when this cost was added."
          onConfirm={(amount) => {
            onMarkPaid(amount)
            setPayOpen(false)
            onClose()
          }}
          onCancel={() => setPayOpen(false)}
        />
      ) : null}
    </>,
    document.body,
  )
}
