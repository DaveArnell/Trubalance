import { useMemo, useState } from 'react'
import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { Account, AppState } from '../types'
import type { BreakdownColumn } from '../utils/breakdownTable'
import { getAccountLocationLabel } from '../utils/accounts'
import { toAmount, roundCurrency } from '../utils/amounts'

interface MorningBalancesListProps {
  state: AppState
  columns: BreakdownColumn[]
  onBalanceSave?: (changes: BalanceSaveChange[]) => BalanceSaveResult
}

interface BalanceRow {
  account: Account
  kind: 'current' | 'savings'
  groupLabel: string
}

/** Vertical current/savings editors for the morning check-in (no wide scroll table). */
export function MorningBalancesList({ state, columns, onBalanceSave }: MorningBalancesListProps) {
  const rows = useMemo(() => {
    const next: BalanceRow[] = []
    for (const column of columns) {
      if (column.isRollup) continue
      for (const account of column.currentAccounts) {
        next.push({ account, kind: 'current', groupLabel: column.label })
      }
      for (const account of column.savingsAccounts) {
        next.push({ account, kind: 'savings', groupLabel: column.label })
      }
    }
    return next
  }, [columns])

  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savedFlash, setSavedFlash] = useState<string | null>(null)

  if (rows.length === 0) {
    return <p className="muted">Add accounts in Settings to update balances here.</p>
  }

  const commit = (account: Account, raw: string) => {
    if (!onBalanceSave) return
    const balance = roundCurrency(toAmount(raw))
    if (balance === roundCurrency(toAmount(account.balance))) return
    const result = onBalanceSave([{ accountId: account.id, balance }])
    if (result.updated > 0) {
      setSavedFlash(account.id)
      window.setTimeout(() => setSavedFlash((id) => (id === account.id ? null : id)), 1600)
    }
  }

  let lastGroup = ''

  return (
    <div className="morning-balances-list">
      {rows.map((row) => {
        const showGroup = row.groupLabel !== lastGroup
        lastGroup = row.groupLabel
        const location = getAccountLocationLabel(state, row.account)
        const value = drafts[row.account.id] ?? String(Math.round(row.account.balance))
        return (
          <div key={row.account.id}>
            {showGroup ? <p className="morning-balances-group">{row.groupLabel}</p> : null}
            <label className="morning-balances-row">
              <span className="morning-balances-row-copy">
                <strong>{row.kind === 'current' ? 'Current account' : 'Savings account'}</strong>
                {location && location !== row.groupLabel ? (
                  <span className="muted">{location}</span>
                ) : null}
              </span>
              <div className="morning-balances-input-wrap">
                <input
                  className="morning-balances-input"
                  type="number"
                  step="1"
                  inputMode="decimal"
                  value={value}
                  disabled={!onBalanceSave}
                  aria-label={`${row.groupLabel} ${row.kind === 'current' ? 'current' : 'savings'} balance`}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [row.account.id]: e.target.value }))
                  }
                  onBlur={() => commit(row.account, value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                />
                {savedFlash === row.account.id ? (
                  <span className="morning-balances-saved" aria-live="polite">
                    Saved
                  </span>
                ) : null}
              </div>
            </label>
          </div>
        )
      })}
    </div>
  )
}
