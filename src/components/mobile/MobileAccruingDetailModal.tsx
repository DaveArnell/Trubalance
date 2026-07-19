import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, Commitment, CommitmentAccruingRow, ScopeLevel } from '../../types'
import {
  getAccrualProgress,
  getAccruingRowDailyRate,
} from '../../utils/commitmentCalculations'
import { getScopeItemLabel, isSoloOrganisation, formatScopeOptionLabel, type ScopeOption } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import { toAmount, roundCurrency } from '../../utils/amounts'
import { ordinalDay } from '../committed/shared'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'

interface MobileAccruingDetailModalProps {
  state: AppState
  row: CommitmentAccruingRow
  accentColor: string
  scopeOptions: ScopeOption[]
  onClose: () => void
  onSave?: (patch: Partial<Commitment>) => void
  onSaveDueDay?: (commitment: Commitment, dueDayOfMonth: number) => void
  onDuplicate?: () => void
  onDelete?: () => void
}

export function MobileAccruingDetailModal({
  state,
  row,
  accentColor,
  scopeOptions,
  onClose,
  onSave,
  onSaveDueDay,
  onDuplicate,
  onDelete,
}: MobileAccruingDetailModalProps) {
  const editReadOnly = useEditReadOnly()
  const { commitment } = row
  const isReserve = row.source === 'reserve'
  const canEdit = !editReadOnly && !isReserve && Boolean(onSave)
  const progress = getAccrualProgress(commitment)?.progress ?? 0

  const [name, setName] = useState(commitment.name)
  const [amount, setAmount] = useState(String(commitment.amount))
  const [dueDay, setDueDay] = useState(String(commitment.dueDayOfMonth ?? 28))
  const [scopeKey, setScopeKey] = useState(`${commitment.scopeLevel}:${commitment.scopeId}`)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(commitment.name)
    setAmount(String(commitment.amount))
    setDueDay(String(commitment.dueDayOfMonth ?? 28))
    setScopeKey(`${commitment.scopeLevel}:${commitment.scopeId}`)
    setError('')
  }, [commitment])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const scopeLabel = getScopeItemLabel(state, commitment.scopeLevel, commitment.scopeId)
  const showScopeField = !isSoloOrganisation(state) && scopeOptions.length > 1

  const handleSave = () => {
    if (!canEdit || !onSave) return
    const parsedAmount = roundCurrency(toAmount(amount))
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError('Enter a valid monthly amount.')
      return
    }
    const parsedDue = Math.round(Number(dueDay))
    if (!Number.isFinite(parsedDue) || parsedDue < 1 || parsedDue > 31) {
      setError('Due day must be between 1 and 31.')
      return
    }
    const [scopeLevel, scopeId] = scopeKey.split(':') as [ScopeLevel, string]
    if (!scopeLevel || !scopeId) {
      setError('Choose where this cost applies.')
      return
    }

    const trimmedName = name.trim() || commitment.name
    const patch: Partial<Commitment> = {}
    if (trimmedName !== commitment.name) patch.name = trimmedName
    if (parsedAmount !== roundCurrency(toAmount(commitment.amount))) patch.amount = parsedAmount
    if (scopeLevel !== commitment.scopeLevel || scopeId !== commitment.scopeId) {
      patch.scopeLevel = scopeLevel
      patch.scopeId = scopeId
    }

    const dueChanged = parsedDue !== (commitment.dueDayOfMonth ?? 28)
    if (Object.keys(patch).length > 0) onSave(patch)
    if (dueChanged && onSaveDueDay) {
      onSaveDueDay(commitment, parsedDue)
    } else if (dueChanged) {
      onSave?.({ dueDayOfMonth: parsedDue })
    }
    onClose()
  }

  return createPortal(
    <div className="snapshot-correction-backdrop" onClick={onClose}>
      <div
        className="snapshot-correction-modal mobile-accruing-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-accruing-detail-title"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `4px solid ${accentColor}` }}
      >
        <h3 id="mobile-accruing-detail-title">{canEdit ? 'Edit monthly cost' : commitment.name}</h3>
        {!canEdit && showScopeField ? (
          <p className="snapshot-correction-subtitle">{scopeLabel}</p>
        ) : null}

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
          {Math.round(progress * 100)}% through this month’s cycle · accrued{' '}
          {formatCurrency(row.accruedAmount)}
        </p>

        {canEdit ? (
          <div className="mobile-accruing-edit-fields">
            <label className="snapshot-correction-input">
              <span>Name</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="snapshot-correction-input">
              <span>Monthly amount</span>
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
            {showScopeField ? (
              <label className="snapshot-correction-input">
                <span>Applies to</span>
                <select value={scopeKey} onChange={(e) => setScopeKey(e.target.value)}>
                  {scopeOptions.map((opt) => (
                    <option key={`${opt.level}:${opt.id}`} value={`${opt.level}:${opt.id}`}>
                      {formatScopeOptionLabel(opt.level, opt.label)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {error ? <p className="snapshot-correction-error">{error}</p> : null}
          </div>
        ) : (
          <dl className="snapshot-correction-facts">
            <div>
              <dt>Monthly amount</dt>
              <dd>{formatCurrency(commitment.amount)}</dd>
            </div>
            {commitment.dueDayOfMonth != null ? (
              <div>
                <dt>Due</dt>
                <dd>{ordinalDay(commitment.dueDayOfMonth)} each month</dd>
              </div>
            ) : null}
            <div>
              <dt>Daily rate</dt>
              <dd>{formatCurrency(getAccruingRowDailyRate(row))}/day</dd>
            </div>
            {isReserve ? (
              <div>
                <dt>Note</dt>
                <dd>Reserve accruals are edited in the Reserve Planner.</dd>
              </div>
            ) : null}
          </dl>
        )}

        <div className="mobile-item-modal-actions mobile-item-modal-actions--stack">
          {canEdit ? (
            <button type="button" className="btn-primary" onClick={handleSave}>
              Save
            </button>
          ) : null}
          <div className="mobile-item-modal-actions-row">
            {!editReadOnly && onDuplicate && !isReserve ? (
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
            {!editReadOnly && onDelete && !isReserve ? (
              <button
                type="button"
                className="btn-danger btn-tiny"
                onClick={() => {
                  if (window.confirm(`Delete “${commitment.name}”?`)) {
                    onDelete()
                    onClose()
                  }
                }}
              >
                Delete
              </button>
            ) : null}
            <button type="button" className="btn-ghost btn-tiny" onClick={onClose}>
              {canEdit ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
