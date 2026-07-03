import { useState } from 'react'
import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { AppState } from '../types'
import type { BreakdownColumn } from '../utils/breakdownTable'
import { BreakdownTable } from './BreakdownTable'

interface TrueBalanceHeroProps {
  state: AppState
  breakdownColumns: BreakdownColumn[]
  onBalanceSave: (changes: BalanceSaveChange[]) => BalanceSaveResult
}

export function TrueBalanceHero({
  state,
  breakdownColumns,
  onBalanceSave,
}: TrueBalanceHeroProps) {
  const [saveMessage, setSaveMessage] = useState('')

  const handleBalanceSave = (changes: BalanceSaveChange[]) => {
    const result = onBalanceSave(changes)
    if (result.updated > 0) {
      setSaveMessage(`Updated ${result.updated} account${result.updated === 1 ? '' : 's'}. History saved.`)
    }
  }

  const showTable = breakdownColumns.length > 0

  return (
    <section id="dashboard" className="card hero-card card-scroll">
      <div className="card-head card-head-compact">
        <h2>Account balances</h2>
      </div>

      <div className="card-scroll-body">
      {showTable ? (
        <BreakdownTable
          state={state}
          columns={breakdownColumns}
          onBalanceSave={handleBalanceSave}
        />
      ) : (
        <p className="muted">Add accounts in Settings to update balances here.</p>
      )}

      {saveMessage && <p className="success-message">{saveMessage}</p>}
      </div>
    </section>
  )
}
