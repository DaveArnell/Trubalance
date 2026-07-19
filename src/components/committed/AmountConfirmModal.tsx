import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toAmount, roundCurrency } from '../../utils/amounts'
import { formatCurrency, getCurrencySymbol } from '../../utils/format'

export interface AmountConfirmModalProps {
  title: string
  itemLabel: string
  expectedTotal: number
  expectedLabel?: string
  amountLabel?: string
  confirmSameLabel?: string
  confirmDiffLabel?: string
  noteSame?: string
  noteDiff?: string
  onConfirm: (amount: number) => void
  onCancel: () => void
}

/** Shared “confirm final amount” modal for Mark paid / Mark received. */
export function AmountConfirmModal({
  title,
  itemLabel,
  expectedTotal,
  expectedLabel = 'Expected amount',
  amountLabel = 'Final amount',
  confirmSameLabel = 'Confirm',
  confirmDiffLabel = 'Confirm and correct history',
  noteSame = 'Confirming the expected amount will not change past history.',
  noteDiff = 'A different amount will correct history from when this item was added.',
  onConfirm,
  onCancel,
}: AmountConfirmModalProps) {
  const expectedRounded = roundCurrency(expectedTotal)
  const [value, setValue] = useState(() => String(expectedRounded))
  const [error, setError] = useState('')
  const backdropPointerDown = useRef(false)

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
    <div
      className="snapshot-correction-backdrop"
      onPointerDown={(e) => {
        backdropPointerDown.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (backdropPointerDown.current && e.target === e.currentTarget) onCancel()
        backdropPointerDown.current = false
      }}
    >
      <div
        className="snapshot-correction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="amount-confirm-title"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h3 id="amount-confirm-title">{title}</h3>
        <p className="snapshot-correction-subtitle">
          <strong>{itemLabel}</strong>
        </p>

        <dl className="snapshot-correction-facts">
          <div>
            <dt>{expectedLabel}</dt>
            <dd>{formatCurrency(expectedRounded)}</dd>
          </div>
        </dl>

        <label className="snapshot-correction-input">
          <span>{amountLabel}</span>
          <div className="mark-paid-custom-row">
            <span className="mark-paid-currency">{getCurrencySymbol()}</span>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
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

        <p className="snapshot-correction-note">{amountDiffers ? noteDiff : noteSame}</p>

        <div className="snapshot-correction-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleConfirm}>
            {amountDiffers ? confirmDiffLabel : confirmSameLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

interface AmountConfirmButtonProps {
  buttonLabel: string
  title: string
  itemLabel: string
  expectedTotal: number
  expectedLabel?: string
  amountLabel?: string
  confirmSameLabel?: string
  confirmDiffLabel?: string
  noteSame?: string
  noteDiff?: string
  onConfirm: (amount: number) => void
  className?: string
}

export function AmountConfirmButton({
  buttonLabel,
  title,
  itemLabel,
  expectedTotal,
  expectedLabel,
  amountLabel,
  confirmSameLabel,
  confirmDiffLabel,
  noteSame,
  noteDiff,
  onConfirm,
  className = 'btn-primary btn-tiny',
}: AmountConfirmButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={className}
        title={`${buttonLabel} (${formatCurrency(expectedTotal)})`}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
      >
        {buttonLabel}
      </button>
      {open ? (
        <AmountConfirmModal
          title={title}
          itemLabel={itemLabel}
          expectedTotal={expectedTotal}
          expectedLabel={expectedLabel}
          amountLabel={amountLabel}
          confirmSameLabel={confirmSameLabel}
          confirmDiffLabel={confirmDiffLabel}
          noteSame={noteSame}
          noteDiff={noteDiff}
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
