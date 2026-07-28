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
  label: string
  meta?: string
}

/** One current-account balance per business/venue — named like the org structure. */
export function MorningBalancesList({ state, columns, onBalanceSave }: MorningBalancesListProps) {
  const rows = useMemo(() => {
    const next: BalanceRow[] = []
    for (const column of columns) {
      if (column.isRollup) continue
      const accounts = column.currentAccounts
      if (accounts.length === 0) continue
      if (accounts.length === 1) {
        next.push({ account: accounts[0]!, label: column.label })
        continue
      }
      for (const account of accounts) {
        const location = getAccountLocationLabel(state, account)
        next.push({
          account,
          label: column.label,
          meta: location !== column.label ? location : account.name,
        })
      }
    }
    return next
  }, [columns, state])

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

  return (
    <div className="morning-balances-list">
      {rows.map((row) => {
        const value = drafts[row.account.id] ?? String(Math.round(row.account.balance))
        return (
          <label key={row.account.id} className="morning-balances-row">
            <span className="morning-balances-row-copy">
              <strong>{row.label}</strong>
              {row.meta ? <span className="muted">{row.meta}</span> : null}
            </span>
            <div className="morning-balances-input-wrap">
              <input
                className="morning-balances-input"
                type="number"
                step="1"
                inputMode="decimal"
                value={value}
                disabled={!onBalanceSave}
                aria-label={`${row.label} balance`}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [row.account.id]: e.target.value }))
                }
                onBlur={() => commit(row.account, value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
              />
              {savedFlash === row.account.id ? (
                <span className="morning-balances-saved" aria-live="polite">
                  Saved
                </span>
              ) : null}
            </div>
          </label>
        )
      })}
    </div>
  )
}
