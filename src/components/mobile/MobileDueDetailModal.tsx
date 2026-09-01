import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, Commitment, CommitmentDueRow, PlannedFundingMethod } from '../../types'
import {
  formatDueRowTiming,
  formatRolledDueTooltip,
  getCommitmentPayoffExpectedTotal,
  isReserveTransferDueRow,
} from '../../utils/commitmentCalculations'
import {
  formatPlannedDueDate,
  getPlannedFundingLabel,
  parsePlannedDueDateInput,
} from '../../utils/plannedFunding'
import { getCardScopeMetaLabel } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import { toAmount, roundCurrency } from '../../utils/amounts'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import { AmountConfirmModal } from '../committed/AmountConfirmModal'
import { todayDateKey } from '../../utils/snapshots'

interface MobileDueDetailModalProps {
  state: AppState
  row: CommitmentDueRow
  accentColor?: string
  onClose: () => void
  onMarkPaid: (amount: number) => void
  onSave?: (patch: Partial<Commitment>) => void
  onSaveDueAmount?: (amount: number) => void
  onSaveReserveAmount?: (amount: number) => void
  onDuplicate?: () => void
  onDelete?: () => void
  onOpenReservePlanner?: () => void
}

const FUNDING_OPTIONS: Array<{ value: PlannedFundingMethod; label: string }> = [
  { value: 'immediate', label: 'Reserve the full amount now' },
  { value: 'accrue_until_due', label: 'Build up until the due date' },
  { value: 'hybrid', label: 'Reserve some now, build the rest' },
]

export function MobileDueDetailModal({
  state,
  row,
  accentColor,
  onClose,
  onMarkPaid,
  onSave,
  onSaveDueAmount,
  onSaveReserveAmount,
  onDuplicate,
  onDelete,
  onOpenReservePlanner,
}: MobileDueDetailModalProps) {
  const editReadOnly = useEditReadOnly()
  const [payOpen, setPayOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const backdropPointerDown = useRef(false)

  const item = row.commitment
  const isReserve = row.source === 'reserve'
  const isReserveTransfer = isReserveTransferDueRow(row)
  const isReserveBill = isReserve && !isReserveTransfer
  const isPlanned = item.schedule === 'planned'
  const isMonthly = item.schedule === 'monthly' && !isReserve
  const canEdit =
    !editReadOnly &&
    !isReserveTransfer &&
    (((isPlanned || isMonthly) && Boolean(onSave || onSaveDueAmount)) ||
      (isReserveBill && Boolean(onSaveReserveAmount)))

  const expectedTotal = isPlanned || isReserveBill
    ? row.amount
    : getCommitmentPayoffExpectedTotal(item)
  const scopeLabel = isReserveTransfer
    ? 'Reserve transfer'
    : getCardScopeMetaLabel(state, item.scopeLevel, item.scopeId)
  const timing = formatDueRowTiming(row)
  const rolled = formatRolledDueTooltip(row)

  const [name, setName] = useState(item.name)
  const [amount, setAmount] = useState(String(row.amount))
  const [dueDay, setDueDay] = useState(String(item.dueDayOfMonth ?? 28))
  const [plannedDueDate, setPlannedDueDate] = useState(
    item.plannedDueDate ? formatPlannedDueDate(item.plannedDueDate) : '',
  )
  const [fundingMethod, setFundingMethod] = useState<PlannedFundingMethod>(
    item.fundingMethod ?? 'immediate',
  )
  const [reserveNow, setReserveNow] = useState(String(item.amountToReserveNow ?? 0))

  useEffect(() => {
    setName(item.name)
    setAmount(String(row.amount))
    setDueDay(String(item.dueDayOfMonth ?? 28))
    setPlannedDueDate(item.plannedDueDate ? formatPlannedDueDate(item.plannedDueDate) : '')
    setFundingMethod(item.fundingMethod ?? 'immediate')
    setReserveNow(String(item.amountToReserveNow ?? 0))
    setError('')
    setEditing(false)
  }, [item, row.amount])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !payOpen) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, payOpen])

  const handleSave = () => {
    if (!canEdit) return
    const parsedAmount = roundCurrency(toAmount(amount))
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError('Enter a valid amount.')
      return
    }

    if (isReserveBill) {
      onSaveReserveAmount?.(parsedAmount)
      setEditing(false)
      onClose()
      return
    }

    if (isMonthly) {
      const parsedDue = Math.round(Number(dueDay))
      if (!Number.isFinite(parsedDue) || parsedDue < 1 || parsedDue > 31) {
        setError('Due day must be between 1 and 31.')
        return
      }
      const trimmedName = name.trim() || item.name
      if (parsedAmount !== roundCurrency(row.amount)) {
        onSaveDueAmount?.(parsedAmount)
      }
      const patch: Partial<Commitment> = {}
      if (trimmedName !== item.name) patch.name = trimmedName
      if (parsedDue !== (item.dueDayOfMonth ?? 28)) patch.dueDayOfMonth = parsedDue
      if (Object.keys(patch).length > 0) onSave?.(patch)
      setEditing(false)
      onClose()
      return
    }

    if (!onSave) return

    if (isPlanned) {
      const trimmedName = name.trim() || item.name
      const parsedDue = parsePlannedDueDateInput(plannedDueDate)
      if (plannedDueDate.trim() && !parsedDue) {
        setError('Enter a valid due date (e.g. 31 Jul 2026).')
        return
      }

      const patch: Partial<Commitment> = {}
      if (trimmedName !== item.name) patch.name = trimmedName
      if (parsedAmount !== roundCurrency(toAmount(item.amount))) patch.amount = parsedAmount
      if (parsedDue && parsedDue !== item.plannedDueDate) {
        patch.plannedDueDate = parsedDue
        patch.plannedLabel = ''
      }

      const methodChanged = fundingMethod !== (item.fundingMethod ?? 'immediate')
      if (methodChanged) {
        patch.fundingMethod = fundingMethod
        patch.fundingStartDate = todayDateKey()
      }

      if (fundingMethod === 'hybrid') {
        const parsedReserve = roundCurrency(toAmount(reserveNow))
        if (!Number.isFinite(parsedReserve) || parsedReserve < 0 || parsedReserve > parsedAmount) {
          setError(`Reserve now must be between ${formatCurrency(0)} and ${formatCurrency(parsedAmount)}.`)
          return
        }
        patch.amountToReserveNow = parsedReserve
      } else if (methodChanged || item.amountToReserveNow != null) {
        patch.amountToReserveNow = undefined
      }

      if (Object.keys(patch).length > 0) onSave(patch)
      setEditing(false)
      onClose()
    }
  }

  return createPortal(
    <>
      <div
        className="snapshot-correction-backdrop"
        onPointerDown={(e) => {
          backdropPointerDown.current = e.target === e.currentTarget
        }}
        onClick={(e) => {
          if (backdropPointerDown.current && e.target === e.currentTarget) onClose()
          backdropPointerDown.current = false
        }}
      >
        <div
          className="snapshot-correction-modal mobile-item-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-due-detail-title"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={accentColor ? { borderTop: `4px solid ${accentColor}` } : undefined}
        >
          <h3 id="mobile-due-detail-title">{editing ? 'Edit due item' : item.name}</h3>
          {!editing && scopeLabel ? (
            <p className="snapshot-correction-subtitle">{scopeLabel}</p>
          ) : null}

          {editing ? (
            <div className="mobile-accruing-edit-fields">
              {!isReserveBill ? (
                <label className="snapshot-correction-input">
                  <span>Name</span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
              ) : null}
              <label className="snapshot-correction-input">
                <span>Amount</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setError('')
                  }}
                />
              </label>
              {isMonthly ? (
                <label className="snapshot-correction-input">
                  <span>Due day of month</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => {
                      setDueDay(e.target.value)
                      setError('')
                    }}
                  />
                </label>
              ) : null}
              {isPlanned ? (
                <>
                  <label className="snapshot-correction-input">
                    <span>Due date</span>
                    <input
                      type="text"
                      value={plannedDueDate}
                      placeholder="e.g. 31 Jul 2026"
                      onChange={(e) => {
                        setPlannedDueDate(e.target.value)
                        setError('')
                      }}
                    />
                  </label>
                  <label className="snapshot-correction-input">
                    <span>Payment type</span>
                    <select
                      value={fundingMethod}
                      onChange={(e) => {
                        setFundingMethod(e.target.value as PlannedFundingMethod)
                        setError('')
                      }}
                    >
                      {FUNDING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {fundingMethod === 'hybrid' ? (
                    <label className="snapshot-correction-input">
                      <span>Reserve now</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={reserveNow}
                        onChange={(e) => {
                          setReserveNow(e.target.value)
                          setError('')
                        }}
                      />
                    </label>
                  ) : null}
                </>
              ) : null}
              {error ? (
                <p className="snapshot-correction-error" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <dl className="snapshot-correction-facts">
              <div>
                <dt>{isPlanned && (item.fundingMethod ?? 'immediate') === 'immediate' ? 'Provisioned' : 'Amount due'}</dt>
                <dd>{formatCurrency(row.amount)}</dd>
              </div>
              {timing ? (
                <div>
                  <dt>Due</dt>
                  <dd>{timing}</dd>
                </div>
              ) : null}
              {isPlanned ? (
                <div>
                  <dt>Payment type</dt>
                  <dd>{getPlannedFundingLabel(item.fundingMethod)}</dd>
                </div>
              ) : null}
              {rolled ? (
                <div>
                  <dt>Rolled</dt>
                  <dd>{rolled}</dd>
                </div>
              ) : null}
            </dl>
          )}

          {!editReadOnly ? (
            <div className="mobile-item-modal-actions mobile-item-modal-actions--stack">
              {editing ? (
                <button type="button" className="btn-primary" onClick={handleSave}>
                  Save changes
                </button>
              ) : isReserveTransfer && onOpenReservePlanner ? (
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
                {editing ? (
                  <button type="button" className="btn-ghost btn-tiny" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                ) : (
                  <>
                    {canEdit ? (
                      <button type="button" className="btn-ghost btn-tiny" onClick={() => setEditing(true)}>
                        Edit
                      </button>
                    ) : null}
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
                  </>
                )}
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
          onConfirm={(paidAmount) => {
            onMarkPaid(paidAmount)
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
