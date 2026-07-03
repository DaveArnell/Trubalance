import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toAmount, roundCurrency } from '../../utils/amounts'
import { formatCurrency, getCurrencySymbol } from '../../utils/format'

interface MarkPaidConfirmModalProps {
  itemLabel: string
  expectedTotal: number
  onConfirm: (amount: number) => void
  onCancel: () => void
}

export function MarkPaidConfirmModal({
  itemLabel,
  expectedTotal,
  onConfirm,
  onCancel,
}: MarkPaidConfirmModalProps) {
  const expectedRounded = roundCurrency(expectedTotal)
  const [value, setValue] = useState(() => String(expectedRounded))
  const [error, setError] = useState('')

  useEffect(() => {
    setValue(String(expectedRounded))
    setError('')
  }, [expectedRounded, itemLabel])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const handleConfirm = () => {
    const parsed = toAmount(value)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Enter a valid amount.')
      return
    }
    onConfirm(roundCurrency(parsed))
  }

  const enteredRounded = roundCurrency(toAmount(value))
  const amountDiffers =
    Number.isFinite(enteredRounded) && enteredRounded !== expectedRounded

  return createPortal(
    <div className="snapshot-correction-backdrop" onClick={onCancel}>
      <div
        className="snapshot-correction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-paid-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="mark-paid-confirm-title">Confirm payment</h3>
        <p className="snapshot-correction-subtitle">
          <strong>{itemLabel}</strong>
        </p>

        <dl className="snapshot-correction-facts">
          <div>
            <dt>Amount due</dt>
            <dd>{formatCurrency(expectedRounded)}</dd>
          </div>
        </dl>

        <label className="snapshot-correction-input">
          <span>Amount paid</span>
          <div className="mark-paid-custom-row">
            <span className="mark-paid-currency">{getCurrencySymbol()}</span>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              autoFocus
              onChange={(e) => {
                setValue(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm()
              }}
            />
          </div>
        </label>

        {error ? <p className="snapshot-correction-error">{error}</p> : null}

        <p className="snapshot-correction-note">
          {amountDiffers
            ? 'A different amount will correct history from when this cost was added.'
            : 'Confirming the due amount will mark it paid without changing past history.'}
        </p>

        <div className="snapshot-correction-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleConfirm}>
            {amountDiffers ? 'Pay and correct history' : 'Yes, mark paid'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

interface MarkPaidConfirmButtonProps {
  itemLabel: string
  expectedTotal: number
  onConfirm: (amount: number) => void
}

export function MarkPaidConfirmButton({ itemLabel, expectedTotal, onConfirm }: MarkPaidConfirmButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="btn-primary btn-tiny"
        title={`Mark paid (${formatCurrency(expectedTotal)})`}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
      >
        Paid
      </button>
      {open ? (
        <MarkPaidConfirmModal
          itemLabel={itemLabel}
          expectedTotal={expectedTotal}
          onConfirm={(amount) => {
            onConfirm(amount)
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}
