import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toAmount, roundCurrency } from '../utils/amounts'
import { formatCurrency } from '../utils/format'
import { formatHistoryDate } from '../utils/historyTable'

export interface SnapshotCorrectionDraft {
  snapshotId: string
  date: string
  columnLabel: string
  /** Value as originally recorded for this date (preserved after corrections). */
  recordedValue: number
  /** Value currently shown in history. */
  currentValue: number
}

interface SnapshotCorrectionModalProps {
  draft: SnapshotCorrectionDraft
  onConfirm: (newValue: number) => void
  onCancel: () => void
}

export function SnapshotCorrectionModal({ draft, onConfirm, onCancel }: SnapshotCorrectionModalProps) {
  const [value, setValue] = useState(() => String(roundCurrency(draft.currentValue)))
  const [error, setError] = useState('')

  useEffect(() => {
    setValue(String(roundCurrency(draft.currentValue)))
    setError('')
  }, [draft])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const handleConfirm = () => {
    const parsed = toAmount(value)
    if (!Number.isFinite(parsed)) {
      setError('Enter a valid amount.')
      return
    }
    const rounded = roundCurrency(parsed)
    if (rounded === roundCurrency(draft.currentValue)) {
      onCancel()
      return
    }
    onConfirm(rounded)
  }

  const recordedDisplay = roundCurrency(draft.recordedValue)
  const currentDisplay = roundCurrency(draft.currentValue)

  return createPortal(
    <div className="snapshot-correction-backdrop" onClick={onCancel}>
      <div
        className="snapshot-correction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="snapshot-correction-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="snapshot-correction-title">Confirm history correction</h3>
        <p className="snapshot-correction-subtitle">
          <strong>{draft.columnLabel}</strong> · {formatHistoryDate(draft.date)}
        </p>

        <dl className="snapshot-correction-facts">
          <div>
            <dt>Originally recorded</dt>
            <dd>{formatCurrency(recordedDisplay)}</dd>
          </div>
          <div>
            <dt>Currently shown</dt>
            <dd>{formatCurrency(currentDisplay)}</dd>
          </div>
        </dl>

        <label className="snapshot-correction-input">
          <span>Corrected value</span>
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
          The originally recorded amount is kept for reference. Trends and history will use your
          corrected value.
        </p>

        <div className="snapshot-correction-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Save correction
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
