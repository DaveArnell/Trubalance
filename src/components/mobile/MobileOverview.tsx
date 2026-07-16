import { useMemo, useState } from 'react'
import type { BalanceSaveChange, BalanceSaveResult } from '../../hooks/useAppState'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import type { AppState, DashboardMetrics } from '../../types'
import type { BreakdownColumn } from '../../utils/breakdownTable'
import { getAccountLocationLabel } from '../../utils/accounts'
import { toAmount, roundCurrency } from '../../utils/amounts'
import { formatCurrency } from '../../utils/format'

interface MobileOverviewProps {
  metrics: DashboardMetrics
  state?: AppState
  breakdownColumns?: BreakdownColumn[]
  onBalanceSave?: (changes: BalanceSaveChange[]) => BalanceSaveResult
}

/** Compact True Balance summary — scrolls with page content on mobile. */
export function MobileOverview({
  metrics,
  state,
  breakdownColumns = [],
  onBalanceSave,
}: MobileOverviewProps) {
  const editReadOnly = useEditReadOnly()
  const [balancesOpen, setBalancesOpen] = useState(false)

  const accountRows = useMemo(() => {
    if (!state) return []
    const rows: { accountId: string; label: string; balance: number }[] = []
    for (const column of breakdownColumns) {
      for (const account of [...column.currentAccounts, ...column.savingsAccounts]) {
        rows.push({
          accountId: account.id,
          label:
            breakdownColumns.length > 1
              ? `${column.label} · ${getAccountLocationLabel(state, account)}`
              : getAccountLocationLabel(state, account),
          balance: toAmount(account.balance),
        })
      }
    }
    return rows
  }, [breakdownColumns, state])

  const saveBalance = (accountId: string, raw: string) => {
    if (!onBalanceSave || editReadOnly) return
    const balance = roundCurrency(toAmount(raw))
    const existing = accountRows.find((row) => row.accountId === accountId)
    if (!existing || balance === roundCurrency(existing.balance)) return
    onBalanceSave([{ accountId, balance }])
  }

  return (
    <section className="mobile-overview" aria-label="True Balance">
      <button
        type="button"
        className="mobile-overview-summary"
        aria-expanded={balancesOpen}
        onClick={() => accountRows.length > 0 && setBalancesOpen((open) => !open)}
      >
        <span className="mobile-overview-summary-label">True Balance</span>
        <span className="mobile-overview-summary-value">{formatCurrency(metrics.trueBalance)}</span>
        {accountRows.length > 0 && (
          <span className="mobile-overview-summary-hint" aria-hidden>
            {balancesOpen ? '▴' : '▾'}
          </span>
        )}
      </button>

      {balancesOpen && accountRows.length > 0 && (
        <ul className="mobile-balance-list">
          {accountRows.map((row) => (
            <li key={row.accountId} className="mobile-balance-row">
              <span className="mobile-balance-row-label">{row.label}</span>
              {editReadOnly || !onBalanceSave ? (
                <span className="mobile-balance-value">{formatCurrency(row.balance)}</span>
              ) : (
                <input
                  className="mobile-balance-input"
                  type="number"
                  inputMode="decimal"
                  step="1"
                  defaultValue={String(row.balance)}
                  aria-label={`Balance for ${row.label}`}
                  onBlur={(e) => saveBalance(row.accountId, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
