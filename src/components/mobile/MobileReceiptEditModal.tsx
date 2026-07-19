import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, ExpectedReceipt, ScopeLevel, ViewScope } from '../../types'
import { getCommitmentScopeOptionsForView } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import { toAmount, roundCurrency } from '../../utils/amounts'
import {
  formatReceiptDateDisplay,
  normalizeReceiptDateInput,
} from '../../utils/receiptCalculations'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import { AmountConfirmModal } from '../committed/AmountConfirmModal'

interface MobileReceiptEditModalProps {
  state: AppState
  viewScope: ViewScope
  receipt: ExpectedReceipt
  accentColor: string
  onClose: () => void
  onSave: (patch: Partial<ExpectedReceipt>) => void
  onReceived: (amount: number) => void
  onDuplicate: () => void
  onDelete: () => void
}

function toDateInputValue(value: string | undefined): string {
  if (!value?.trim()) return ''
  const key = normalizeReceiptDateInput(value)
  return key ?? ''
}

export function MobileReceiptEditModal({
  state,
  viewScope,
  receipt,
  accentColor,
  onClose,
  onSave,
  onReceived,
  onDuplicate,
  onDelete,
}: MobileReceiptEditModalProps) {
  const editReadOnly = useEditReadOnly()
  const scopeOptions = getCommitmentScopeOptionsForView(state, viewScope)
  const [name, setName] = useState(receipt.name)
  const [amount, setAmount] = useState(String(receipt.amount))
  const [timing, setTiming] = useState<'lump' | 'accrual'>(receipt.receiptTiming ?? 'lump')
  const [startDate, setStartDate] = useState(toDateInputValue(receipt.accrualStartDate))
  const [expectedDate, setExpectedDate] = useState(toDateInputValue(receipt.expectedDate))
  const [scopeKey, setScopeKey] = useState(`${receipt.scopeLevel}:${receipt.scopeId}`)
  const [error, setError] = useState('')
  const [receiveOpen, setReceiveOpen] = useState(false)

  useEffect(() => {
    setName(receipt.name)
    setAmount(String(receipt.amount))
    setTiming(receipt.receiptTiming ?? 'lump')
    setStartDate(toDateInputValue(receipt.accrualStartDate))
    setExpectedDate(toDateInputValue(receipt.expectedDate))
    setScopeKey(`${receipt.scopeLevel}:${receipt.scopeId}`)
    setError('')
  }, [receipt])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !receiveOpen) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, receiveOpen])

  const handleSave = () => {
    if (editReadOnly) return
    const parsedAmount = roundCurrency(toAmount(amount))
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError('Enter a valid amount.')
      return
    }
    const [scopeLevel, scopeId] = scopeKey.split(':') as [ScopeLevel, string]
    if (!scopeLevel || !scopeId) {
      setError('Choose where this receipt applies.')
      return
    }

    const patch: Partial<ExpectedReceipt> = {
      name: name.trim() || receipt.name,
      amount: parsedAmount,
      receiptTiming: timing,
      scopeLevel,
      scopeId,
      expectedDate: expectedDate ? normalizeReceiptDateInput(expectedDate) : undefined,
      accrualStartDate:
        timing === 'accrual' && startDate ? normalizeReceiptDateInput(startDate) : undefined,
    }
    onSave(patch)
    onClose()
  }

  return createPortal(
    <>
      <div className="snapshot-correction-backdrop" onClick={onClose}>
        <div
          className="snapshot-correction-modal mobile-item-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-receipt-edit-title"
          onClick={(e) => e.stopPropagation()}
          style={{ borderTop: `4px solid ${accentColor}` }}
        >
          <h3 id="mobile-receipt-edit-title">{editReadOnly ? receipt.name : 'Edit expected receipt'}</h3>

          {editReadOnly ? (
            <dl className="snapshot-correction-facts">
              <div>
                <dt>Amount</dt>
                <dd>{formatCurrency(receipt.amount)}</dd>
              </div>
              <div>
                <dt>Timing</dt>
                <dd>{(receipt.receiptTiming ?? 'lump') === 'accrual' ? 'Building up' : 'Lump sum'}</dd>
              </div>
              {receipt.expectedDate ? (
                <div>
                  <dt>Expected</dt>
                  <dd>{formatReceiptDateDisplay(receipt.expectedDate)}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <div className="mobile-accruing-edit-fields">
              <label className="snapshot-correction-input">
                <span>Name</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
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
              <label className="snapshot-correction-input">
                <span>Timing</span>
                <select
                  value={timing}
                  onChange={(e) => setTiming(e.target.value as 'lump' | 'accrual')}
                >
                  <option value="lump">Lump sum</option>
                  <option value="accrual">Building up</option>
                </select>
              </label>
              {timing === 'accrual' ? (
                <label className="snapshot-correction-input">
                  <span>Start date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
              ) : null}
              <label className="snapshot-correction-input">
                <span>Expected date</span>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </label>
              <label className="snapshot-correction-input">
                <span>Applies to</span>
                <select value={scopeKey} onChange={(e) => setScopeKey(e.target.value)}>
                  {scopeOptions.map((opt) => (
                    <option key={`${opt.level}:${opt.id}`} value={`${opt.level}:${opt.id}`}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              {error ? <p className="snapshot-correction-error">{error}</p> : null}
            </div>
          )}

          {!editReadOnly ? (
            <div className="mobile-item-modal-actions mobile-item-modal-actions--stack">
              <button type="button" className="btn-primary" onClick={() => setReceiveOpen(true)}>
                Mark received…
              </button>
              <div className="mobile-item-modal-actions-row">
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
                <button
                  type="button"
                  className="btn-danger btn-tiny"
                  onClick={() => {
                    if (window.confirm(`Delete “${receipt.name}”?`)) {
                      onDelete()
                      onClose()
                    }
                  }}
                >
                  Delete
                </button>
                <button type="button" className="btn-ghost btn-tiny" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn-secondary btn-tiny" onClick={handleSave}>
                  Save
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

      {receiveOpen ? (
        <AmountConfirmModal
          title="Confirm receipt"
          itemLabel={receipt.name}
          expectedTotal={receipt.amount}
          expectedLabel="Expected amount"
          amountLabel="Amount received"
          confirmSameLabel="Yes, mark received"
          confirmDiffLabel="Receive and correct history"
          noteSame="Confirming the expected amount will mark it received without changing past history."
          noteDiff="A different amount will correct history from when this receipt started."
          onConfirm={(value) => {
            onReceived(value)
            setReceiveOpen(false)
            onClose()
          }}
          onCancel={() => setReceiveOpen(false)}
        />
      ) : null}
    </>,
    document.body,
  )
}
