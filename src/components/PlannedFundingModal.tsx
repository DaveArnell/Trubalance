import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Commitment, PlannedFundingMethod } from '../types'
import { formatCurrency } from '../utils/format'
import { formatPlannedDueDate } from '../utils/plannedFunding'

export interface PlannedFundingDraft {
  commitmentId: string
  name: string
  amount: number
  plannedDueDate: string
  fundingMethod?: PlannedFundingMethod
  amountToReserveNow?: number
}

interface PlannedFundingModalProps {
  draft: PlannedFundingDraft
  onConfirm: (result: {
    fundingMethod: PlannedFundingMethod
    amountToReserveNow?: number
  }) => void
  onCancel: () => void
}

const OPTIONS: Array<{
  method: PlannedFundingMethod
  title: string
  description: string
}> = [
  {
    method: 'immediate',
    title: 'Reserve the full amount now',
    description: 'The full amount is taken off Available immediately.',
  },
  {
    method: 'accrue_until_due',
    title: 'Build it up until the due date',
    description: 'The amount is spread evenly from today until the due date.',
  },
  {
    method: 'hybrid',
    title: 'Reserve some now, build the rest',
    description: 'Choose how much to reserve today. The rest will build up until the due date.',
  },
]

export function PlannedFundingModal({ draft, onConfirm, onCancel }: PlannedFundingModalProps) {
  const [method, setMethod] = useState<PlannedFundingMethod>(draft.fundingMethod ?? 'immediate')
  const [reserveNow, setReserveNow] = useState(
    draft.amountToReserveNow ?? Math.round(draft.amount / 2),
  )
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const dueLabel = formatPlannedDueDate(draft.plannedDueDate)

  const handleConfirm = () => {
    if (method === 'hybrid') {
      if (reserveNow < 0 || reserveNow > draft.amount) {
        setError(`Enter an amount between ${formatCurrency(0)} and ${formatCurrency(draft.amount)}.`)
        return
      }
      onConfirm({ fundingMethod: method, amountToReserveNow: reserveNow })
      return
    }
    onConfirm({ fundingMethod: method })
  }

  return createPortal(
    <div className="planned-funding-backdrop" onClick={onCancel}>
      <div
        className="planned-funding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planned-funding-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="planned-funding-title">How should this affect Available?</h3>
        <p className="planned-funding-subtitle">
          <strong>{draft.name || 'Planned cost'}</strong> · {formatCurrency(draft.amount)} due{' '}
          {dueLabel}
        </p>

        <div className="planned-funding-options">
          {OPTIONS.map((opt) => (
            <label
              key={opt.method}
              className={`planned-funding-option${method === opt.method ? ' selected' : ''}`}
            >
              <input
                type="radio"
                name="planned-funding-method"
                checked={method === opt.method}
                onChange={() => {
                  setMethod(opt.method)
                  setError('')
                }}
              />
              <span>
                <strong>{opt.title}</strong>
                <span className="planned-funding-option-desc">{opt.description}</span>
              </span>
            </label>
          ))}
        </div>

        {method === 'hybrid' && (
          <label className="planned-funding-hybrid-input">
            <span>Amount to reserve today</span>
            <input
              type="number"
              min={0}
              max={draft.amount}
              step="0.01"
              value={reserveNow}
              onChange={(e) => {
                setReserveNow(Number(e.target.value))
                setError('')
              }}
            />
          </label>
        )}

        {error && <p className="planned-funding-error">{error}</p>}

        <div className="planned-funding-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleConfirm}>
            Save planned cost
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function buildPlannedFundingDraft(
  commitment: Commitment,
  patch: Partial<Commitment>,
): PlannedFundingDraft | null {
  const merged: Commitment = { ...commitment, ...patch }
  const amount = merged.amount
  const plannedDueDate = merged.plannedDueDate
  if (amount <= 0 || !plannedDueDate) return null

  return {
    commitmentId: commitment.id,
    name: merged.name,
    amount,
    plannedDueDate,
    fundingMethod: merged.fundingMethod,
    amountToReserveNow: merged.amountToReserveNow,
  }
}

export function shouldPromptPlannedFunding(
  commitment: Commitment,
  patch: Partial<Commitment>,
): boolean {
  const merged: Commitment = { ...commitment, ...patch }
  if (merged.amount <= 0 || !merged.plannedDueDate) return false

  const fundingFieldsChanged =
    patch.amount != null ||
    patch.plannedDueDate != null ||
    patch.plannedLabel != null

  if (!fundingFieldsChanged) return false

  if (!merged.fundingMethod) return true

  return (
    (patch.amount != null && patch.amount !== commitment.amount) ||
    (patch.plannedDueDate != null && patch.plannedDueDate !== commitment.plannedDueDate)
  )
}
