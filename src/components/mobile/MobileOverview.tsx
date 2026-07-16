import { useMemo, useState } from 'react'
import type { BalanceSaveChange, BalanceSaveResult } from '../../hooks/useAppState'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import type { AppState, AttentionItem, DashboardMetrics } from '../../types'
import type { BreakdownColumn } from '../../utils/breakdownTable'
import { getAccountLocationLabel } from '../../utils/accounts'
import { toAmount, roundCurrency } from '../../utils/amounts'
import { formatCurrency } from '../../utils/format'
import { getFreshnessLabel, daysBetween } from '../../utils/snapshots'

interface MobileOverviewProps {
  metrics: DashboardMetrics
  attentionItems: AttentionItem[]
  onNotificationClick: (item: AttentionItem) => void
  state?: AppState
  breakdownColumns?: BreakdownColumn[]
  onBalanceSave?: (changes: BalanceSaveChange[]) => BalanceSaveResult
}

export function MobileOverview({
  metrics,
  attentionItems,
  onNotificationClick,
  state,
  breakdownColumns = [],
  onBalanceSave,
}: MobileOverviewProps) {
  const editReadOnly = useEditReadOnly()
  const [balancesOpen, setBalancesOpen] = useState(false)

  const accountRows = useMemo(() => {
    if (!state) return []
    const rows: { accountId: string; label: string; balance: number; freshness?: string }[] = []
    for (const column of breakdownColumns) {
      for (const account of [...column.currentAccounts, ...column.savingsAccounts]) {
        const daysAgo = daysBetween(account.updatedAt)
        rows.push({
          accountId: account.id,
          label:
            breakdownColumns.length > 1
              ? `${column.label} · ${getAccountLocationLabel(state, account)}`
              : getAccountLocationLabel(state, account),
          balance: toAmount(account.balance),
          freshness: getFreshnessLabel(daysAgo),
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

  const topAlerts = attentionItems.slice(0, 3)

  return (
    <section className="mobile-overview" aria-label="True Balance overview">
      <div className="mobile-overview-hero">
        <p className="mobile-overview-label">True Balance</p>
        <p className="mobile-overview-value">{formatCurrency(metrics.trueBalance)}</p>
      </div>

      <div className="mobile-overview-kpis" aria-label="Balance breakdown">
        <div className="mobile-overview-kpi">
          <span className="mobile-overview-kpi-label">Cash</span>
          <span className="mobile-overview-kpi-value">{formatCurrency(metrics.cash)}</span>
        </div>
        <div className="mobile-overview-kpi">
          <span className="mobile-overview-kpi-label">Committed</span>
          <span className="mobile-overview-kpi-value mobile-overview-kpi-value--neg">
            {formatCurrency(-metrics.committedFunds)}
          </span>
        </div>
        <div className="mobile-overview-kpi">
          <span className="mobile-overview-kpi-label">Receipts</span>
          <span className="mobile-overview-kpi-value">
            {formatCurrency(metrics.expectedReceipts)}
          </span>
        </div>
      </div>

      {accountRows.length > 0 && (
        <div className="mobile-overview-balances">
          <button
            type="button"
            className="mobile-overview-balances-toggle"
            aria-expanded={balancesOpen}
            onClick={() => setBalancesOpen((open) => !open)}
          >
            {balancesOpen ? 'Hide bank balances' : 'Update bank balances'}
            <span className="mobile-overview-balances-chevron" aria-hidden>
              {balancesOpen ? '▴' : '▾'}
            </span>
          </button>
          {balancesOpen && (
            <ul className="mobile-balance-list">
              {accountRows.map((row) => (
                <li key={row.accountId} className="mobile-balance-row">
                  <div className="mobile-balance-row-label">
                    <span>{row.label}</span>
                    {row.freshness ? (
                      <span className="mobile-balance-freshness muted">{row.freshness}</span>
                    ) : null}
                  </div>
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
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {topAlerts.length > 0 && (
        <ul className="mobile-overview-alerts" aria-label="Alerts">
          {topAlerts.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`mobile-overview-alert mobile-overview-alert--${item.level === 'yellow' ? 'orange' : item.level}`}
                onClick={() => onNotificationClick(item)}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
