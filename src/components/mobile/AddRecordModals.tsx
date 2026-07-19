import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, PlannedFundingMethod, ScopeLevel, ViewScope } from '../../types'
import {
  formatScopeOptionLabel,
  getCommitmentScopeOptionsForView,
  getDefaultCommitmentScope,
  isSoloOrganisation,
} from '../../utils/scope'
import { toAmount, roundCurrency } from '../../utils/amounts'
import { todayDateKey } from '../../utils/snapshots'

type MonthlySave = {
  name: string
  amount: number
  dueDayOfMonth: number
  scopeLevel: ScopeLevel
  scopeId: string
}

type PlannedSave = {
  name: string
  amount: number
  plannedDueDate: string
  fundingMethod: PlannedFundingMethod
  amountToReserveNow?: number
  scopeLevel: ScopeLevel
  scopeId: string
}

type ReceiptSave = {
  name: string
  amount: number
  expectedDate: string
  receiptTiming: 'lump' | 'accrual'
  scopeLevel: ScopeLevel
  scopeId: string
}

function ScopeField({
  state,
  viewScope,
  scopeKey,
  onChange,
}: {
  state: AppState
  viewScope: ViewScope
  scopeKey: string
  onChange: (value: string) => void
}) {
  const options = getCommitmentScopeOptionsForView(state, viewScope)
  if (isSoloOrganisation(state) || options.length <= 1) return null
  return (
    <label className="snapshot-correction-input">
      <span>Applies to</span>
      <select value={scopeKey} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={`${opt.level}:${opt.id}`} value={`${opt.level}:${opt.id}`}>
            {formatScopeOptionLabel(opt.level, opt.label)}
          </option>
        ))}
      </select>
    </label>
  )
}

function parseScopeKey(scopeKey: string, viewScope: ViewScope): { scopeLevel: ScopeLevel; scopeId: string } {
  const [scopeLevel, scopeId] = scopeKey.split(':') as [ScopeLevel, string]
  if (scopeLevel && scopeId) return { scopeLevel, scopeId }
  return { scopeLevel: viewScope.type, scopeId: viewScope.id }
}

export function AddMonthlyCostModal({
  state,
  viewScope,
  onSave,
  onClose,
}: {
  state: AppState
  viewScope: ViewScope
  onSave: (payload: MonthlySave) => void
  onClose: () => void
}) {
  const defaults = getDefaultCommitmentScope(state, viewScope)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('28')
  const [scopeKey, setScopeKey] = useState(`${defaults.scopeLevel}:${defaults.scopeId}`)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSave = () => {
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
    const scope = parseScopeKey(scopeKey, viewScope)
    onSave({
      name: name.trim() || 'New monthly cost',
      amount: parsedAmount,
      dueDayOfMonth: parsedDue,
      ...scope,
    })
  }

  return createPortal(
    <div className="snapshot-correction-backdrop" onClick={onClose}>
      <div
        className="snapshot-correction-modal mobile-item-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-monthly-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="add-monthly-title">Add monthly cost</h3>
        <div className="mobile-accruing-edit-fields">
          <label className="snapshot-correction-input">
            <span>Name</span>
            <input
              type="text"
              value={name}
              placeholder="e.g. Rent, Wages, Loan"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="snapshot-correction-input">
            <span>Monthly amount</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
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
          <ScopeField state={state} viewScope={viewScope} scopeKey={scopeKey} onChange={setScopeKey} />
          {error ? <p className="snapshot-correction-error">{error}</p> : null}
        </div>
        <div className="mobile-item-modal-actions mobile-item-modal-actions--stack">
          <button type="button" className="btn-primary" onClick={handleSave}>
            Add cost
          </button>
          <button type="button" className="btn-ghost btn-tiny" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function AddPlannedCostModal({
  state,
  viewScope,
  onSave,
  onClose,
}: {
  state: AppState
  viewScope: ViewScope
  onSave: (payload: PlannedSave) => void
  onClose: () => void
}) {
  const defaults = getDefaultCommitmentScope(state, viewScope)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [fundingMethod, setFundingMethod] = useState<PlannedFundingMethod>('accrue_until_due')
  const [reserveNow, setReserveNow] = useState('')
  const [scopeKey, setScopeKey] = useState(`${defaults.scopeLevel}:${defaults.scopeId}`)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSave = () => {
    const parsedAmount = roundCurrency(toAmount(amount))
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    if (!dueDate.trim()) {
      setError('Choose a due date.')
      return
    }
    let amountToReserveNow: number | undefined
    if (fundingMethod === 'hybrid') {
      amountToReserveNow = roundCurrency(toAmount(reserveNow))
      if (
        !Number.isFinite(amountToReserveNow) ||
        amountToReserveNow < 0 ||
        amountToReserveNow > parsedAmount
      ) {
        setError('Reserve-now amount must be between 0 and the total.')
        return
      }
    }
    const scope = parseScopeKey(scopeKey, viewScope)
    onSave({
      name: name.trim() || 'New planned cost',
      amount: parsedAmount,
      plannedDueDate: dueDate,
      fundingMethod,
      amountToReserveNow,
      ...scope,
    })
  }

  return createPortal(
    <div className="snapshot-correction-backdrop" onClick={onClose}>
      <div
        className="snapshot-correction-modal mobile-item-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-planned-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="add-planned-title">Add planned cost</h3>
        <div className="mobile-accruing-edit-fields">
          <label className="snapshot-correction-input">
            <span>Name</span>
            <input
              type="text"
              value={name}
              placeholder="e.g. Corporation tax"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="snapshot-correction-input">
            <span>Amount</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(e) => {
                setAmount(e.target.value)
                setError('')
              }}
            />
          </label>
          <label className="snapshot-correction-input">
            <span>Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value)
                setError('')
              }}
            />
          </label>
          <fieldset className="setup-quick-funding">
            <legend>How should this affect True Balance?</legend>
            <label className="setup-quick-funding-option">
              <input
                type="radio"
                name="add-planned-funding"
                checked={fundingMethod === 'immediate'}
                onChange={() => setFundingMethod('immediate')}
              />
              <span>
                <strong>Reserve the full amount now</strong>
                <small>Deduct from True Balance straight away</small>
              </span>
            </label>
            <label className="setup-quick-funding-option">
              <input
                type="radio"
                name="add-planned-funding"
                checked={fundingMethod === 'accrue_until_due'}
                onChange={() => setFundingMethod('accrue_until_due')}
              />
              <span>
                <strong>Build it up until the due date</strong>
                <small>Spread the amount evenly from today</small>
              </span>
            </label>
            <label className="setup-quick-funding-option">
              <input
                type="radio"
                name="add-planned-funding"
                checked={fundingMethod === 'hybrid'}
                onChange={() => setFundingMethod('hybrid')}
              />
              <span>
                <strong>Part now, part building</strong>
                <small>Reserve a lump sum now, accrue the rest</small>
              </span>
            </label>
          </fieldset>
          {fundingMethod === 'hybrid' ? (
            <label className="snapshot-correction-input">
              <span>Reserve now</span>
              <input
                type="text"
                inputMode="decimal"
                value={reserveNow}
                placeholder="0.00"
                onChange={(e) => {
                  setReserveNow(e.target.value)
                  setError('')
                }}
              />
            </label>
          ) : null}
          <ScopeField state={state} viewScope={viewScope} scopeKey={scopeKey} onChange={setScopeKey} />
          {error ? <p className="snapshot-correction-error">{error}</p> : null}
        </div>
        <div className="mobile-item-modal-actions mobile-item-modal-actions--stack">
          <button type="button" className="btn-primary" onClick={handleSave}>
            Add planned cost
          </button>
          <button type="button" className="btn-ghost btn-tiny" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function AddReceiptModal({
  state,
  viewScope,
  onSave,
  onClose,
}: {
  state: AppState
  viewScope: ViewScope
  onSave: (payload: ReceiptSave) => void
  onClose: () => void
}) {
  const defaults = getDefaultCommitmentScope(state, viewScope)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [timing, setTiming] = useState<'lump' | 'accrual'>('lump')
  const [scopeKey, setScopeKey] = useState(
    viewScope.type === 'group'
      ? `${defaults.scopeLevel}:${defaults.scopeId}`
      : `${viewScope.type}:${viewScope.id}`,
  )
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSave = () => {
    const parsedAmount = roundCurrency(toAmount(amount))
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    const scope = parseScopeKey(scopeKey, viewScope)
    onSave({
      name: name.trim() || 'New receipt',
      amount: parsedAmount,
      expectedDate: expectedDate || todayDateKey(),
      receiptTiming: timing,
      ...scope,
    })
  }

  return createPortal(
    <div className="snapshot-correction-backdrop" onClick={onClose}>
      <div
        className="snapshot-correction-modal mobile-item-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-receipt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="add-receipt-title">Add expected receipt</h3>
        <div className="mobile-accruing-edit-fields">
          <label className="snapshot-correction-input">
            <span>Name</span>
            <input
              type="text"
              value={name}
              placeholder="e.g. Client invoice"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="snapshot-correction-input">
            <span>Amount</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(e) => {
                setAmount(e.target.value)
                setError('')
              }}
            />
          </label>
          <label className="snapshot-correction-input">
            <span>Expected by</span>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
          </label>
          <fieldset className="setup-quick-funding">
            <legend>Timing</legend>
            <label className="setup-quick-funding-option">
              <input
                type="radio"
                name="add-receipt-timing"
                checked={timing === 'lump'}
                onChange={() => setTiming('lump')}
              />
              <span>
                <strong>Lump sum</strong>
                <small>Count the full amount now</small>
              </span>
            </label>
            <label className="setup-quick-funding-option">
              <input
                type="radio"
                name="add-receipt-timing"
                checked={timing === 'accrual'}
                onChange={() => setTiming('accrual')}
              />
              <span>
                <strong>Build up</strong>
                <small>Accrue a little each day toward the date</small>
              </span>
            </label>
          </fieldset>
          <ScopeField state={state} viewScope={viewScope} scopeKey={scopeKey} onChange={setScopeKey} />
          {error ? <p className="snapshot-correction-error">{error}</p> : null}
        </div>
        <div className="mobile-item-modal-actions mobile-item-modal-actions--stack">
          <button type="button" className="btn-primary" onClick={handleSave}>
            Add receipt
          </button>
          <button type="button" className="btn-ghost btn-tiny" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
