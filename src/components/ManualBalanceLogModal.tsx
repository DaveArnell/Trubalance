import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toAmount, roundCurrency } from '../utils/amounts'

interface ManualBalanceLogModalProps {
  scopeLabel: string
  defaultDate: string
  maxDate: string
  suggestedTrueBalance: number
  onConfirm: (input: { date: string; trueBalance: number }) => void
  onCancel: () => void
}

export function ManualBalanceLogModal({
  scopeLabel,
  defaultDate,
  maxDate,
  suggestedTrueBalance,
  onConfirm,
  onCancel,
}: ManualBalanceLogModalProps) {
  const [date, setDate] = useState(defaultDate)
  const [value, setValue] = useState(() => String(roundCurrency(suggestedTrueBalance)))
  const [error, setError] = useState('')
  const backdropPointerDown = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const handleConfirm = () => {
    if (!date) {
      setError('Pick a date.')
      return
    }
    if (date > maxDate) {
      setError('Date cannot be in the future.')
      return
    }
    const parsed = toAmount(value)
    if (!Number.isFinite(parsed)) {
      setError('Enter a valid Cash Prophet Balance.')
      return
    }
    onConfirm({ date, trueBalance: roundCurrency(parsed) })
  }

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
        aria-labelledby="manual-balance-log-title"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h3 id="manual-balance-log-title">Add balance log entry</h3>
        <p className="snapshot-correction-subtitle">
          <strong>{scopeLabel}</strong> · manual entry
        </p>

        <label className="snapshot-correction-input">
          <span>Date</span>
          <input
            type="date"
            value={date}
            max={maxDate}
            onChange={(e) => {
              setDate(e.target.value)
              setError('')
            }}
          />
        </label>

        <label className="snapshot-correction-input">
          <span>Cash Prophet Balance</span>
          <input
            type="number"
            step="1"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError('')
            }}
            autoFocus
          />
        </label>

        {error ? <p className="snapshot-correction-error">{error}</p> : null}

        <p className="snapshot-correction-note muted">
          Manual entries are marked with * in the balance log. Use them to fill gaps or seed history
          for demos and guides. If a point already exists for that date, it will be updated.
        </p>

        <div className="snapshot-correction-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Add entry
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
