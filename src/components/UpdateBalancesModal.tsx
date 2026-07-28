import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { AppState } from '../types'
import type { BreakdownColumn } from '../utils/breakdownTable'
import { BreakdownTable } from './BreakdownTable'

interface UpdateBalancesModalProps {
  open: boolean
  onClose: () => void
  state: AppState
  columns: BreakdownColumn[]
  onBalanceSave?: (changes: BalanceSaveChange[]) => BalanceSaveResult
}

/** Modal to update current/savings balances without expanding the full overview. */
export function UpdateBalancesModal({
  open,
  onClose,
  state,
  columns,
  onBalanceSave,
}: UpdateBalancesModalProps) {
  const [saveMessage, setSaveMessage] = useState('')

  const handleSave = (changes: BalanceSaveChange[]) => {
    if (!onBalanceSave) return
    const result = onBalanceSave(changes)
    if (result.updated > 0) {
      setSaveMessage(`Updated ${result.updated} account${result.updated === 1 ? '' : 's'}.`)
      window.setTimeout(() => setSaveMessage(''), 2500)
    }
  }

  const title = useMemo(() => 'Update bank balances', [])

  if (!open) return null

  return createPortal(
    <div className="snapshot-correction-backdrop" onClick={onClose} role="presentation">
      <div
        className="snapshot-correction-modal update-balances-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-balances-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="update-balances-modal-head">
          <h2 id="update-balances-title">{title}</h2>
          <p className="muted">
            Enter what’s in each current and savings account today. Your Cash Prophet Balance updates
            from these figures.
          </p>
        </header>
        <div className="update-balances-modal-body">
          <BreakdownTable state={state} columns={columns} compact onBalanceSave={handleSave} />
          {saveMessage ? <p className="overview-accounts-save-msg">{saveMessage}</p> : null}
        </div>
        <footer className="update-balances-modal-foot">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
