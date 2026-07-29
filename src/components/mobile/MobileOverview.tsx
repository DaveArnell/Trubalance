import { useMemo, useState } from 'react'
import type { BalanceSaveChange, BalanceSaveResult } from '../../hooks/useAppState'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import type { AppState, DashboardMetrics, ViewScope } from '../../types'
import type { BreakdownColumn } from '../../utils/breakdownTable'
import { formatCurrency } from '../../utils/format'
import {
  formatPositionChange,
  getBalancePositionDeltas,
} from '../../utils/balancePositionDeltas'
import { getScopeCurrentAccountFreshness } from '../../utils/accountFreshness'
import { BreakdownTable } from '../BreakdownTable'

interface MobileOverviewProps {
  metrics: DashboardMetrics
  state?: AppState
  viewScope?: ViewScope
  breakdownColumns?: BreakdownColumn[]
  onBalanceSave?: (changes: BalanceSaveChange[]) => BalanceSaveResult
}

/** Scope columns only — no TOTAL rollup (saves space; rollup equals the closed hero). */
function mobileBalanceColumns(columns: BreakdownColumn[]): BreakdownColumn[] {
  const scopes = columns.filter((column) => !column.isRollup)
  return scopes.length > 0 ? scopes : columns
}

/**
 * Compact mobile Cash Prophet Balance strip.
 * Collapsed: number + week/month on one row. Expanded: replaces with balances table.
 */
export function MobileOverview({
  metrics,
  state,
  viewScope,
  breakdownColumns = [],
  onBalanceSave,
}: MobileOverviewProps) {
  const editReadOnly = useEditReadOnly()
  const [balancesOpen, setBalancesOpen] = useState(false)
  const canExpand = Boolean(state && breakdownColumns.length > 0)

  const balanceColumns = useMemo(
    () => mobileBalanceColumns(breakdownColumns),
    [breakdownColumns],
  )

  const freshness = useMemo(() => {
    if (!state || !viewScope) return null
    return getScopeCurrentAccountFreshness(state, viewScope)
  }, [state, viewScope])

  const deltas = useMemo(() => {
    if (!state || !viewScope) return { weekChange: null, monthChange: null }
    return getBalancePositionDeltas(state, viewScope, metrics.trueBalance)
  }, [state, viewScope, metrics.trueBalance])

  const showFreshness = freshness && freshness.level !== 'green'

  const weekLabel =
    deltas.weekChange == null
      ? 'Week: —'
      : `${formatPositionChange(deltas.weekChange)} week`
  const monthLabel =
    deltas.monthChange == null
      ? 'Month: —'
      : `${formatPositionChange(deltas.monthChange)} month`

  return (
    <section
      className={`mobile-overview${balancesOpen ? ' mobile-overview--expanded' : ''}`}
      aria-label="Cash Prophet Balance"
    >
      <button
        type="button"
        className="mobile-overview-summary"
        aria-expanded={balancesOpen}
        onClick={() => canExpand && setBalancesOpen((open) => !open)}
      >
        {balancesOpen ? (
          <span className="mobile-overview-summary-text">
            <span className="mobile-overview-summary-label">Balances</span>
            <span className="mobile-overview-summary-hint-copy">Tap a figure to update</span>
          </span>
        ) : (
          <>
            <span className="mobile-overview-summary-text">
              <span className="mobile-overview-summary-label-row">
                <span className="mobile-overview-summary-label">Cash Prophet Balance</span>
                {freshness ? (
                  <span
                    className={`overview-freshness-dot overview-freshness-dot--${freshness.level} mobile-overview-freshness-dot`}
                    title={`Current account: ${freshness.label}`}
                    aria-label={`Current account ${freshness.label}`}
                  />
                ) : null}
              </span>
              {showFreshness ? (
                <span
                  className={`mobile-overview-freshness mobile-overview-freshness--${freshness.level}`}
                >
                  {freshness.label}
                </span>
              ) : null}
              <span className="mobile-overview-summary-value">
                {formatCurrency(metrics.trueBalance)}
              </span>
            </span>
            <span className="mobile-overview-deltas mobile-overview-deltas--aside" aria-label="Change this week and month">
              <span>{weekLabel}</span>
              <span>{monthLabel}</span>
            </span>
          </>
        )}
        {canExpand ? (
          <span className="mobile-overview-summary-hint" aria-hidden>
            {balancesOpen ? '▴' : '▾'}
          </span>
        ) : null}
      </button>

      {balancesOpen && state && balanceColumns.length > 0 ? (
        <div className="mobile-overview-breakdown">
          <BreakdownTable
            state={state}
            columns={balanceColumns}
            compact
            balancesOnly
            onBalanceSave={editReadOnly ? undefined : onBalanceSave}
          />
        </div>
      ) : null}
    </section>
  )
}
